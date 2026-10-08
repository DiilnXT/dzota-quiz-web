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
1. BẢO ĐẢM ĐỘ SÂU & ĐẦY ĐỦ KIẾN THỨC: KHÔNG tóm tắt qua loa, KHÔNG rút gọn sơ sài. Phải bao quát ĐẦY ĐỦ VÀ TOÀN DIỆN tất cả các câu hỏi có trong danh sách trên.
2. MỤC TIÊU 100% ĐIỂM SỐ: Học sinh đọc xong bài phân tích này phải nhớ trọn vẹn câu hỏi, hiểu tường tận đáp án đúng, thấu hiểu bẫy của từng phương án sai và tự tin làm đúng 100% khi gặp lại dạng câu này hoặc câu hỏi tương tự.
3. CẤU TRÚC PHÂN CHIA HỆ THỐNG:
Phân chia thành các CHUYÊN ĐỀ / NHÓM BÀI HỌC CỐT LÕI (ví dụ: '### NHÓM 1: TÊN CHUYÊN ĐỀ (Bao gồm các câu: ...)').

Trong TỪNG CHUYÊN ĐỀ / NHÓM, BẮT BUỘC CÓ ĐỦ 3 PHẦN:

PHẦN 1. **Bản chất kiến thức cốt lõi & Cơ chế toàn diện**:
Trình bày rõ ràng, sâu sắc bản chất khoa học, định lý, cơ chế dược lý/sinh lý/hóa sinh/toán học, chỉ định, chống chỉ định, nguyên lý hoạt động... Đủ sâu để hiểu tận gốc rễ vấn đề.

PHẦN 2. **Phân tích chi tiết từng câu hỏi & Bẫy đề thi**:
(CỰC KỲ QUAN TRỌNG: Học sinh đọc lại bài phân tích này cần NHỚ RÕ CÂU HỎI HỎI GÌ VÀ CÁC PHƯƠNG ÁN LÀ GÌ. TUYỆT ĐỐI KHÔNG CHỈ GHI MỖI "Câu 1 (Đáp án A)" MỘT CÁCH TRƠ TRỌI!)
Đối với TỪNG CÂU HỎI trong chuyên đề, BẮT BUỘC trình bày theo đúng khuôn mẫu sau:
+ **Câu [Số] - [Tóm tắt đề bài hỏi gì: ví dụ "Kháng sinh ưu tiên điều trị ban đầu viêm phổi mắc phải cộng đồng"]**:
  * ✅ **Đáp án đúng [Ký tự] ([Nội dung phương án đúng])**: Giải thích ngắn gọn bản chất vì sao đúng tuyệt đối.
  * ⚠️ **Bẫy các phương án sai & Cách phân biệt**:
    - [Ký tự phương án] ([Nội dung phương án]): Bẫy tinh vi ở chỗ nào? Vì sao sai?
    - [Ký tự phương án] ([Nội dung phương án]): Bẫy tinh vi ở chỗ nào? Vì sao sai?

PHẦN 3. **Quy tắc vàng / Mẹo phản xạ nhanh**:
Khẩu quyết, câu thần chú ghi nhớ, bảng so sánh đối chiếu giúp phản xạ ngay lập tức khi gặp dạng câu này và các câu tương tự trong đề thi thật.

QUY TẮC ĐỊNH DẠNG:
- Dùng tiêu đề chuẩn: \`### NHÓM 1: ...\` cho chuyên đề.
- Dùng gạch đầu dòng: \`- **Tên mục**: Nội dung...\`
- Dùng ký hiệu: \`✅ **Đáp án đúng...**\`, \`⚠️ **Bẫy các phương án sai...**\`
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

    // Làm sạch Markdown để đảm bảo chuẩn cú pháp và không dính chữ
    let cleaned = analysisResult
      .replace(/\*\s+\*/g, '')
      .replace(/\*{3,}/g, '**')
      .replace(/:(\*\*)/g, ': $1')
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
