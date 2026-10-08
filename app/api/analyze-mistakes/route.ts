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

    const prompt = `Bạn là Giáo sư / Giảng viên Đại học môn ${subjectName || 'chuyên ngành tương ứng'}.
Dưới đây là danh sách ${mistakes.length} câu hỏi trắc nghiệm mà học sinh làm bài thi "${quizTitle || 'Bài kiểm tra'}" vừa làm sai:

${formattedQuestions}

NHIỆM VỤ & YÊU CẦU SƯ PHẠM (RẤT QUAN TRỌNG):
1. BẢO ĐẢM ĐỘ SÂU & ĐẦY ĐỦ KIẾN THỨC: KHÔNG tóm tắt qua loa, KHÔNG rút gọn sơ sài. Phải bao quát ĐẦY ĐỦ VÀ TOÀN DIỆN kiến thức của TẤT CẢ các câu hỏi có trong danh sách trên.
2. MỤC TIÊU 100% ĐIỂM SỐ: Khi học sinh đọc và nắm vững bài phân tích này, đảm bảo 100% LÀM ĐÚNG HẾT tất cả các câu hỏi này và TỰ TIN LÀM ĐƯỢC TẤT CẢ CÁC CÂU HỎI MỞ RỘNG / TƯƠNG TỰ CÙNG CHUYÊN ĐỀ.
3. CẤU TRÚC PHÂN CHIA HỆ THỐNG:
Phân chia thành các CHUYÊN ĐỀ / NHÓM BÀI HỌC CỐT LÕI (ví dụ: '### NHÓM 1: TÊN CHUYÊN ĐỀ (Bao gồm các câu: ...)').
Trong TỪNG CHUYÊN ĐỀ / NHÓM:
- **Bản chất kiến thức & Cơ chế toàn diện**: Trình bày rõ ràng, sâu sắc bản chất khoa học, định lý, cơ chế dược lý/sinh lý/toán lý hóa, chỉ định, chống chỉ định, nguyên lý hoạt động... Đủ sâu để hiểu tận gốc rễ vấn đề.
- **Phân tích bẫy đề thi & Tại sao chọn đáp án đúng**: Chỉ rõ vì sao đáp án đúng là chính xác tuyệt đối, bẫy tinh vi của từng phương án sai nằm ở đâu.
- **Quy tắc vàng / Mẹo phản xạ nhanh**: Khẩu quyết, câu thần chú ghi nhớ, bảng so sánh đối chiếu giúp phản xạ ngay lập tức khi gặp dạng câu này và các câu tương tự.

QUY TẮC ĐỊNH DẠNG:
- Dùng tiêu đề chuẩn: \`### NHÓM 1: ...\` cho chuyên đề.
- Dùng gạch đầu dòng: \`- **Tên mục**: Nội dung...\`
- TUYỆT ĐỐI KHÔNG để dấu hoa thị lộn xộn hoặc \`**:\` lơ lửng.
- Công thức khoa học: dùng LaTeX \`$công thức$\` (ví dụ: $\\alpha$, $H_2SO_4$, $f'(x)$).`

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
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192
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
      .replace(/\*\*:\s*/g, ':** ')
      .trim()

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
