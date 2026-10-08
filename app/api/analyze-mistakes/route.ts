import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface MistakeItem {
  questionText?: string
  question?: string
  options?: Record<string, string>
  correctOption?: string
  correct?: string
  userOption?: string
}

interface AnalyzeMistakesBody {
  quizTitle?: string
  subjectName?: string
  mistakes: MistakeItem[]
  clientKeys?: string
  clientModel?: string
}

export async function POST(request: Request) {
  try {
    const body: AnalyzeMistakesBody = await request.json()
    const { quizTitle, subjectName, mistakes, clientKeys, clientModel } = body

    if (!Array.isArray(mistakes) || mistakes.length === 0) {
      return NextResponse.json({ error: 'Danh sách câu hỏi sai trống' }, { status: 400 })
    }

    // 1. Lấy danh sách API keys từ DB / Client / ENV
    let rawKeys = ''
    let activeModel = 'gemini-2.5-flash'

    try {
      if ((prisma as any).systemSetting) {
        const keysSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_API_KEYS' } })
        const modelSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_ACTIVE_MODEL' } })
        if (keysSetting?.value) rawKeys = keysSetting.value
        if (modelSetting?.value) activeModel = modelSetting.value
      }
    } catch (e) {
      console.warn('SystemSetting query skipped:', e)
    }

    if (!rawKeys && clientKeys) rawKeys = clientKeys
    if (!rawKeys) rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || ''
    if (clientModel) activeModel = clientModel

    const keyList = rawKeys
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5)

    if (keyList.length === 0) {
      return NextResponse.json({
        error: 'Chưa có Gemini API Key nào được cấu hình trong Hệ thống. Vui lòng vào Cài đặt để thêm API Key.'
      }, { status: 400 })
    }

    const shuffledKeys = [...keyList].sort(() => Math.random() - 0.5)

    // Chuẩn bị danh sách câu sai cho Prompt
    const formattedQuestions = mistakes.map((m, index) => {
      const qText = m.questionText || m.question || `Câu ${index + 1}`
      const correct = m.correctOption || m.correct || ''
      const opts = m.options || {}
      const optsText = Object.entries(opts)
        .map(([k, v]) => `  ${k}. ${v}`)
        .join('\n')

      return `[CÂU HỎI ${index + 1}]:\n${qText}\nCác phương án:\n${optsText}\n-> Đáp án đúng: ${correct}${opts[correct] ? ` (${opts[correct]})` : ''}`
    }).join('\n\n')

    const prompt = `Bạn là Giảng viên Đại học / Chuyên gia Sư phạm hàng đầu môn ${subjectName || 'chuyên ngành tương ứng'}.
Dưới đây là danh sách ${mistakes.length} câu hỏi trắc nghiệm mà học sinh làm bài thi "${quizTitle || 'Bài kiểm tra'}" vừa làm sai:

${formattedQuestions}

NHIỆM VỤ CỦA BẠN:
Phân tích chuyên sâu nhưng CỰC KỲ CÔ ĐỌNG, SÚC TÍCH, DỄ HIỂU để khi học sinh đọc qua hết 1 lần là đảm bảo 100% nắm chắc bản chất kiến thức và làm đúng tất cả các câu hỏi này!

YÊU CẦU ĐỊNH DẠNG VÀ TRÌNH BÀY (RẤT QUAN TRỌNG):
1. TUYỆT ĐỐI KHÔNG để lỗi định dạng Markdown (như thừa dấu hoa thị * in đậm *, dấu sao lộn xộn). Sử dụng Markdown chuẩn, thanh lịch, rõ ràng.
2. Nếu có công thức Toán học / Hóa học / Vật lý, bắt buộc dùng cú pháp LaTeX $...$ hoặc $$...$$.
3. CẤU TRÚC PHÂN TÍCH:
- 📌 **Tổng quan bẫy kiến thức thường gặp**: Tóm tắt 2-3 gạch đầu dòng về lỗi sai tư duy lớn nhất của học sinh trong cụm câu này.
- 💡 **Phân tích từng câu hỏi (hoặc nhóm câu hỏi liên quan)**:
  Mỗi câu trình bày ngắn gọn gồm:
  + **Bản chất kiến thức cốt lõi**: Khái niệm/quy tắc then chốt cần ghi nhớ (1-2 câu).
  + **Tại sao chọn đáp án đúng & Bẫy cần tránh**: Chỉ rõ lý do vì sao đáp án đúng là chính xác và các phương án gây nhiễu dễ đánh lừa ở điểm nào.
  + **Quy tắc vàng / Mẹo phản xạ nhanh**: Bí quyết nhớ nhanh để không bao giờ sai lại câu tương tự.
- 🎯 **Công thức & Quy tắc tổng kết (Đọc nhanh trước khi làm bài)**: 3-5 gạch đầu dòng ngắn gọn đúc kết toàn bộ kiến thức để học sinh tự tin đạt điểm tuyệt đối.

Hãy viết bằng giọng văn sư phạm truyền cảm hứng, chuẩn xác, cô đọng, đi thẳng vào trọng tâm!`

    let lastError = ''
    let analysisResult = ''

    for (const key of shuffledKeys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${key}`

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.25,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2500
            }
          })
        })

        const resData = await response.json()

        if (!response.ok) {
          const errMsg = resData.error?.message || `HTTP ${response.status}`
          lastError = errMsg
          continue
        }

        const candidate = resData.candidates?.[0]?.content?.parts?.[0]?.text
        if (candidate) {
          analysisResult = candidate
          break
        } else {
          lastError = 'API không trả về nội dung'
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    if (!analysisResult) {
      return NextResponse.json({
        error: `Không thể kết nối Giảng viên AI phân tích (${lastError}). Vui lòng kiểm tra lại API Key.`
      }, { status: 502 })
    }

    // Làm sạch Markdown để đảm bảo không lỗi cú pháp * *
    let cleaned = analysisResult
      .replace(/\*\s+\*/g, '')
      .replace(/\*{3,}/g, '**')

    return NextResponse.json({
      success: true,
      modelUsed: activeModel,
      analysis: cleaned,
      mistakeCount: mistakes.length
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
