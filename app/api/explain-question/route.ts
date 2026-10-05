import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface ExplainRequestBody {
  questionText: string
  options: Record<string, string>
  correctOption: string
  selectedOption?: string
  subjectName?: string
  clientKeys?: string // Tùy chọn nếu người dùng nhập trực tiếp
  clientModel?: string
}

export async function POST(request: Request) {
  try {
    const body: ExplainRequestBody = await request.json()
    const { questionText, options, correctOption, selectedOption, subjectName, clientKeys, clientModel } = body

    if (!questionText || !options || !correctOption) {
      return NextResponse.json({ error: 'Thiếu dữ liệu câu hỏi hoặc đáp án đúng' }, { status: 400 })
    }

    // 1. Lấy danh sách API keys từ DB hoặc Client hoặc ENV
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

    if (!rawKeys && clientKeys) {
      rawKeys = clientKeys
    }
    if (!rawKeys) {
      rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || ''
    }

    if (clientModel) {
      activeModel = clientModel
    }

    // Tách các keys ngăn cách bởi dấu phẩy
    const keyList = rawKeys
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5)

    if (keyList.length === 0) {
      return NextResponse.json({
        error: 'Chưa có Gemini API Key nào được cấu hình trong Hệ thống. Vui lòng vào Cài đặt để thêm API Key.'
      }, { status: 400 })
    }

    // 2. Tạo mảng xáo trộn ngẫu nhiên (random shuffle) các keys để luân chuyển
    const shuffledKeys = [...keyList].sort(() => Math.random() - 0.5)

    // Format các phương án
    const optionsText = Object.entries(options)
      .map(([k, v]) => `${k}. ${v}`)
      .join('\n')

    const prompt = `Bạn là một giảng viên Y Dược - Khoa học tự nhiên chuyên sâu, nhiệt huyết và giải thích cực kỳ xúc tích, chuẩn xác sư phạm.
Nhiệm vụ của bạn là giải thích chi tiết câu hỏi trắc nghiệm dưới đây theo ĐÚNG ĐỊNH DẠNG YÊU CẦU.

CÂU HỎI:
${questionText}

CÁC PHƯƠNG ÁN:
${optionsText}

ĐÁP ÁN ĐÚNG CỦA CÂU HỎI: ${correctOption}. ${options[correctOption] || ''}
${selectedOption ? `NGƯỜI HỌC ĐÃ CHỌN: ${selectedOption}. ${options[selectedOption] || ''}` : ''}
${subjectName ? `MÔN HỌC LIÊN QUAN: ${subjectName}` : ''}

HÃY TRẢ LỜI CĂN LỀ TRÁI, TRỰC QUAN, RÕ RÀNG VÀ CHÍNH XÁC THEO 3 MỤC SAU:

Kiến thức liên quan cần biết:
(Tóm tắt định nghĩa, cơ chế sinh học/bệnh học, nguyên lý hoặc công thức lý thuyết cốt lõi cần ghi nhớ để giải quyết dạng câu hỏi này)

Tại sao chọn phương án ${correctOption}:
(Giải thích mạch lạc, sâu sắc lý do tại sao phương án ${correctOption} là đáp án hoàn toàn chính xác theo tài liệu chuẩn)

Các phương án còn lại lần lượt sai là vì:
(Phân tích lần lượt từng phương án sai khác ngoài ${correctOption}, chỉ ra chi tiết điểm sai, bẫy trắc nghiệm hoặc lý do không phù hợp)

LƯU Ý QUAN TRỌNG:
- Trả lời bằng tiếng Việt chuẩn y khoa/học thuật, rõ ràng, dễ hiểu.
- Giữ bố cục 3 tiêu đề chuẩn xác như trên.
- Không lặp lại đề bài không cần thiết.
`

    // 3. Gọi Gemini API với cơ chế tự động xoay vòng key khi gặp lỗi
    let lastError = ''
    let explanationText = ''

    for (const key of shuffledKeys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${key}`
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }]
              }
            ],
            generationConfig: {
              temperature: 0.3,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1500
            }
          })
        })

        const resData = await response.json()

        if (!response.ok) {
          const errMsg = resData.error?.message || `HTTP ${response.status}`
          console.warn(`Key ...${key.slice(-4)} thất bại (${errMsg}), đang chuyển sang key tiếp theo...`)
          lastError = errMsg
          continue // Đổi lẹ qua key khác
        }

        const candidate = resData.candidates?.[0]?.content?.parts?.[0]?.text
        if (candidate) {
          explanationText = candidate
          break // Thành công!
        } else {
          lastError = 'API không trả về nội dung'
        }
      } catch (err: any) {
        console.warn(`Lỗi gọi key ...${key.slice(-4)}:`, err.message)
        lastError = err.message
      }
    }

    if (!explanationText) {
      return NextResponse.json({
        error: `Không thể kết nối giảng viên AI (Tất cả ${keyList.length} API key đều gặp lỗi: ${lastError}). Vui lòng kiểm tra lại API Key hoặc hạn mức trong Cài Đặt.`
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      modelUsed: activeModel,
      explanation: explanationText
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
