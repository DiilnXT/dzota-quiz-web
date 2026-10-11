import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface NotebookNDRequest {
  action: 'extract_topics' | 'generate_quiz' | 'chat'
  subjectName?: string
  sourceContent?: string
  selectedTopics?: string[]
  questionCount?: number
  easyMediumPercent?: number
  hardPercent?: number
  customNotes?: string
  sampleExamContent?: string
  chatPrompt?: string
  chatHistory?: { role: 'user' | 'model'; parts: { text: string }[] }[]
  clientKeys?: string
  clientModel?: string
}

export async function POST(request: Request) {
  try {
    const body: NotebookNDRequest = await request.json()
    const {
      action,
      subjectName = 'Tổng quát',
      sourceContent = '',
      selectedTopics = [],
      questionCount = 20,
      easyMediumPercent = 60,
      hardPercent = 40,
      customNotes = '',
      sampleExamContent = '',
      chatPrompt = '',
      chatHistory = [],
      clientKeys,
      clientModel
    } = body

    if (!sourceContent && action !== 'chat') {
      return NextResponse.json({ error: 'Nội dung tài liệu nguồn không được để trống' }, { status: 400 })
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

    // 2. Xây dựng prompt theo từng action
    let systemInstruction = ''
    let userPrompt = ''
    let temperature = 0.2

    if (action === 'extract_topics') {
      systemInstruction = `Bạn là một trợ lý AI sư phạm cao cấp chuyên phân tích tài liệu và cấu trúc hóa giáo trình học tập chuẩn phong cách Google NotebookLM.
Nhiệm vụ của bạn là đọc toàn bộ nội dung tài liệu nguồn được cung cấp, nhận diện các chương, chủ đề lớn, chủ đề nhỏ và các đơn vị kiến thức cốt lõi.
Trả về KẾT QUẢ ĐÚNG ĐỊNH DẠNG JSON MẢNG (Array of objects), không kèm bất kỳ lời giải thích nào khác ngoài chuỗi JSON hợp lệ.`

      userPrompt = `Dưới đây là tài liệu nguồn thuộc môn học: "${subjectName}".
Hãy phân tích và chia tài liệu thành danh sách các chủ đề / chương độc lập để người học có thể chọn từng chủ đề ôn thi.

NỘI DUNG TÀI LIỆU NGUỒN:
${sourceContent.slice(0, 50000)}

HÃY TRẢ VỀ ĐÚNG FORMAT JSON NHƯ SAU (chỉ trả về JSON thuần, không bọc markdown triple-backticks nếu có thể, hoặc bọc \`\`\`json):
[
  {
    "id": "topic_1",
    "name": "Tên chủ đề 1",
    "summary": "Tóm tắt ngắn gọn 1-2 câu về nội dung chủ đề này"
  },
  {
    "id": "topic_2",
    "name": "Tên chủ đề 2",
    "summary": "Tóm tắt ngắn gọn 1-2 câu về nội dung chủ đề này"
  }
]
`
      temperature = 0.1
    } else if (action === 'generate_quiz') {
      systemInstruction = `Bạn hãy làm việc như một nhân viên chuyên trách xây dựng ngân hàng câu hỏi trắc nghiệm chất lượng cao, có chuyên môn sâu về nội dung tài liệu tôi cung cấp. Tôi muốn bạn đọc tài liệu thật kỹ, sau đó tạo ra một bộ câu hỏi trắc nghiệm có khả năng giúp học sinh học thuộc, hiểu sâu và vận dụng thành thạo toàn bộ kiến thức trong tài liệu đó.

QUY TẮC BẮT BUỘC VỀ SỐ LƯỢNG (CRITICAL RULE - TUÂN THỦ 100%):
- BẠN BẮT BUỘC PHẢI TẠO ĐỦ VÀ CHÍNH XÁC ${questionCount} CÂU HỎI TRẮC NGHIỆM (Đánh số liên tục từ Câu 1 đến Câu ${questionCount}).
- TUYỆT ĐỐI KHÔNG DỪNG SỚM HOẶC BỎ DỞ GIỮA CHỪNG. Nếu người dùng yêu cầu ${questionCount} câu, bạn PHẢI tạo đầy đủ từ Câu 1, Câu 2... cho đến hết Câu ${questionCount}. Không được tạo thiếu dù chỉ 1 câu!

Tôi không cần những câu hỏi chung chung, hời hợt hay chỉ hỏi những ý chính nổi bật. Tôi cần bạn khai thác nội dung đến từng chi tiết nhỏ nhất có giá trị kiến thức, không bỏ sót bất kỳ khái niệm, định nghĩa, đặc điểm, phân loại, điều kiện, cơ chế, quy trình, số liệu, mốc thời gian, ngoại lệ, trường hợp đặc biệt, mối liên hệ, nguyên nhân, kết quả, sự giống nhau, khác nhau hay chi tiết dễ gây nhầm lẫn nào được đề cập trong nguồn.

Tôi muốn câu hỏi được xây dựng theo nhiều tầng tư duy:
- Câu kiểm tra khả năng nhớ chính xác kiến thức;
- Câu yêu cầu giải thích và hiểu bản chất;
- Câu phân biệt những khái niệm gần giống nhau;
- Câu hỏi về nguyên nhân, cơ chế và mối quan hệ giữa các hiện tượng;
- Câu kết hợp kiến thức từ nhiều phần khác nhau;
- Câu vận dụng vào tình huống cụ thể;
- Câu yêu cầu suy luận từ dữ kiện;
- Câu hỏi đảo chiều từ kết quả tìm nguyên nhân hoặc từ biểu hiện xác định cơ chế;
- Câu hỏi về ngoại lệ, điều kiện cần, điều kiện đủ và những trường hợp dễ mắc bẫy.
Hãy phân bổ độ khó theo đúng tỉ lệ người dùng yêu cầu: khoảng ${easyMediumPercent}% Nhận biết & Thông hiểu, khoảng ${hardPercent}% Vận dụng & Vận dụng cao.

QUY TẮC CÁC PHƯƠNG ÁN TRẢ LỜI:
1. Mỗi câu có đúng 4 lựa chọn A, B, C, D và chỉ có một đáp án đúng nhất.
2. BẮT BUỘC: 4 phương án của mỗi câu hỏi phải có độ dài (số lượng từ) tương đương nhau, không để 3 phương án ngắn và 1 phương án dài lộ đáp án đúng.
3. Các phương án nhiễu phải hợp lý, có tính phân hóa, xuất phát từ những nhầm lẫn thực tế mà người học dễ mắc phải.
4. Tuyệt đối không tự ý bịa kiến thức, số liệu không có căn cứ. Lấy tài liệu nguồn làm chuẩn tuyệt đối.

QUY ĐỊNH ĐỊNH DẠNG CÂU HỎI BẮT BUỘC TUÂN THỦ 100%:
Mỗi câu hỏi phải đúng mẫu sau:
Câu 1. [Nội dung câu hỏi câu 1]
A. [Nội dung phương án A]
B. [Nội dung phương án B]
C. [Nội dung phương án C]
D. [Nội dung phương án D]

(Trong đó: ĐÁP ÁN ĐÚNG LÀ PHƯƠNG ÁN ĐƯỢC IN ĐẬM TOÀN BỘ NỘI DUNG PHƯƠNG ÁN VÀ CẢ CHỮ CÁI A B C D TƯƠNG ỨNG ĐỨNG ĐẦU. Ví dụ: **A. Nội dung phương án đúng** hoặc **C. Nội dung phương án đúng**).
TUYỆT ĐỐI KHÔNG CẦN NOTE THÊM BẤT CỨ GÌ ở giữa phương án D và câu tiếp theo. KHÔNG ghi "Đáp án: A" hay giải thích rời rạc ở giữa các câu, để thuận tiện import trực tiếp vào hệ thống thi!`

      let topicsText = ''
      if (selectedTopics && selectedTopics.length > 0) {
        topicsText = `\nCÁC CHỦ ĐỀ ĐƯỢC CHỌN ĐỂ TẠO TRẮC NGHIỆM:\n${selectedTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      }

      let sampleExamText = ''
      if (sampleExamContent && sampleExamContent.trim().length > 0) {
        sampleExamText = `\n[TÀI LIỆU ĐỀ MẪU CỦA GIÁO VIÊN - HÃY PHÂN TÍCH VÀ CLONE PHONG CÁCH, CẤU TRÚC, CÁCH RA ĐỀ, ĐẶT BẪY CỦA ĐỀ NÀY]:\n${sampleExamContent.slice(0, 20000)}\n`
      }

      let notesText = ''
      if (customNotes && customNotes.trim().length > 0) {
        notesText = `\nLƯU Ý / YÊU CẦU BỔ SUNG CỦA NGƯỜI DÙNG:\n${customNotes}\n`
      }

      userPrompt = `Môn học: "${subjectName}".
Số lượng câu hỏi cần tạo: ĐÚNG CHÍNH XÁC ${questionCount} CÂU HỎI TRẮC NGHIỆM (từ Câu 1 đến hết Câu ${questionCount}).
Tỉ lệ mức độ tư duy:
- Nhận biết & Thông hiểu: khoảng ${easyMediumPercent}% (tương đương ${Math.round((questionCount * easyMediumPercent) / 100)} câu)
- Vận dụng & Vận dụng cao: khoảng ${hardPercent}% (tương đương ${Math.round((questionCount * hardPercent) / 100)} câu)
${topicsText}${sampleExamText}${notesText}
TÀI LIỆU NGUỒN CẦN KHAI THÁC CHUYÊN SÂU:
${sourceContent.slice(0, 60000)}

HÃY BẮT ĐẦU TẠO ĐỦ VÀ ĐÚNG ${questionCount} CÂU HỎI THEO ĐÚNG FORMAT YÊU CẦU TRÊN (Liệt kê đủ từ Câu 1, Câu 2... đến Câu ${questionCount}. Phương án đúng in đậm toàn bộ dòng, 4 phương án tương đương về độ dài từ).`
      temperature = 0.15
    } else if (action === 'chat') {
      systemInstruction = `Bạn là trợ lý học tập AI chuyên sâu của NoteBook ND (chuẩn phong cách Google NotebookLM).
QUY TẮC CỐT LÕI:
1. CHỈ sử dụng thông tin có trong phần [TÀI LIỆU NGUỒN] môn "${subjectName}" bên dưới để trả lời.
2. KHÔNG sử dụng kiến thức ngoài luồng hoặc tự suy đoán/bịa đặt.
3. Nếu câu hỏi không có trong tài liệu, hãy trả lời trung thực: "Thông tin này không có trong tài liệu nguồn được cung cấp."
4. Trả lời chi tiết, sư phạm, trích dẫn chính xác phần nội dung liên quan để người học đối chiếu.
5. QUY TẮC ĐỊNH DẠNG:
- Trình bày rõ ràng, mạch lạc, phân chia các đề mục lớn nhỏ có cấu trúc.
- Sử dụng gạch đầu dòng chuẩn cho từng ý.
- TUYỆT ĐỐI KHÔNG lạm dụng ký tự dấu gạch chéo '//' thừa hoặc dấu '*' lẻ loi.
- In đậm đúng thuật ngữ cốt lõi để người học dễ nắm bắt.`

      userPrompt = `[TÀI LIỆU NGUỒN]:
${sourceContent.slice(0, 45000)}

CÂU HỎI CỦA NGƯỜI HỌC:
${chatPrompt}`
      temperature = 0.0
    }

    // 3. Gọi Gemini API với cơ chế xoay vòng Key
    let lastError = ''
    let resultText = ''

    for (const key of shuffledKeys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${key}`

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: userPrompt }]
              }
            ],
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            },
            generationConfig: {
              temperature: temperature,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: action === 'generate_quiz' ? 16384 : 4096
            }
          })
        })

        const resData = await response.json()

        if (!response.ok) {
          const errMsg = resData.error?.message || `HTTP ${response.status}`
          console.warn(`NoteBook ND: Key ...${key.slice(-4)} failed (${errMsg}), switching to next key...`)
          lastError = errMsg
          continue
        }

        const candidate = resData.candidates?.[0]?.content?.parts?.[0]?.text
        if (candidate) {
          resultText = candidate
          break
        } else {
          lastError = 'API không trả về nội dung'
        }
      } catch (err: any) {
        console.warn(`NoteBook ND: Key ...${key.slice(-4)} error:`, err.message)
        lastError = err.message
      }
    }

    if (!resultText) {
      return NextResponse.json({
        error: `Không thể kết nối dịch vụ AI NoteBook ND (${lastError}). Vui lòng kiểm tra lại API Key trong Cài đặt hệ thống.`
      }, { status: 502 })
    }

    if (action === 'extract_topics') {
      let parsedTopics: any[] = []
      try {
        // Strip markdown code fences if any
        let cleanJson = resultText.trim()
        if (cleanJson.startsWith('```')) {
          cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
        }
        parsedTopics = JSON.parse(cleanJson)
        if (!Array.isArray(parsedTopics)) {
          parsedTopics = []
        }
      } catch (e) {
        console.warn('NoteBook ND: Could not parse topics JSON, fallback to line parsing:', e)
        // Fallback: Parse line by line
        const lines = resultText.split('\n').filter(l => l.trim().length > 0)
        parsedTopics = lines.slice(0, 15).map((l, idx) => ({
          id: `topic_${idx + 1}`,
          name: l.replace(/^[-*0-9.)\s]+/, '').trim(),
          summary: 'Chủ đề kiến thức từ tài liệu'
        }))
      }

      return NextResponse.json({
        success: true,
        topics: parsedTopics,
        modelUsed: activeModel
      })
    }

    return NextResponse.json({
      success: true,
      result: resultText,
      modelUsed: activeModel
    })
  } catch (error: any) {
    console.error('NoteBook ND API error:', error)
    return NextResponse.json({ error: error.message || 'Lỗi server NoteBook ND' }, { status: 500 })
  }
}
