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
    let activeModel = 'gemini-2.0-flash'

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

QUY ĐỊNH ĐỊNH DẠNG CÂU HỎI BẮT BUỘC TUÂN THỦ 100% (BẮT BUỘC 100% ĐỊNH DẠNG MARKDOWN):
1. Toàn bộ phản hồi BẮT BUỘC phải ở định dạng Markdown chuẩn.
2. Mỗi câu hỏi phải tuân thủ nghiêm ngặt cấu trúc sau:
Câu 1. [Nội dung câu hỏi câu 1]
A. [Nội dung phương án A]
**B. [Nội dung phương án B]**
C. [Nội dung phương án C]
D. [Nội dung phương án D]

QUY TẮC ĐÁP ÁN ĐÚNG TRONG MARKDOWN:
- ĐÁP ÁN ĐÚNG BẮT BUỘC LÀ PHƯƠNG ÁN ĐƯỢC IN ĐẬM TOÀN BỘ THEO CÚ PHÁP MARKDOWN: **[A-D]. [Nội dung phương án]** (In đậm cả chữ cái thứ tự và toàn bộ nội dung của phương án đó).
- Ví dụ nếu phương án B là đáp án đúng:
A. Nội dung phương án A
**B. Nội dung phương án B**
C. Nội dung phương án C
D. Nội dung phương án D
- BẮT BUỘC chỉ in đậm duy nhất 1 phương án đúng cho mỗi câu. 3 phương án còn lại tuyệt đối KHÔNG in đậm.
- TUYỆT ĐỐI KHÔNG ghi thêm dòng "Đáp án: B" hay giải thích rời rạc giữa các câu, để thuận tiện import trực tiếp vào hệ thống thi!`

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

HÃY BẮT ĐẦU TẠO ĐỦ VÀ ĐÚNG ${questionCount} CÂU HỎI THEO ĐÚNG FORMAT MARKDOWN YÊU CẦU TRÊN (Bắt buộc phản hồi bằng Markdown chuẩn. Liệt kê đủ từ Câu 1, Câu 2... đến Câu ${questionCount}. Phương án đúng in đậm toàn bộ theo cú pháp: **[A-D]. [Nội dung phương án]**, 4 phương án tương đương về độ dài từ).`
      temperature = 0.15
    } else if (action === 'chat') {
      systemInstruction = `Bạn là trợ lý học tập AI chuyên sâu của NoteBook ND (hoạt động theo tiêu chuẩn bảo mật kiến thức và trích dẫn chuẩn xác 100% của Google NotebookLM).

NGUYÊN TẮC CỐT LÕI VỀ KIẾN THỨC NGUỒN (CRITICAL GROUNDING RULES - TUÂN THỦ TUYỆT ĐỐI 100%):
1. BÁM SÁT 100% NGUỒN: CHỈ SỬ DỤNG DUY NHẤT thông tin có trong phần [TÀI LIỆU NGUỒN] môn "${subjectName}" bên dưới để trả lời.
2. TUYỆT ĐỐI KHÔNG TỰ BỊA ĐẶT, KHÔNG SUY DIỄN MƠ HỒ, KHÔNG TỰ Ý ĐƯA KIẾN THỨC BÊN NGOÀI VÀO.
3. PHẦN KIẾN THỨC NÀO KHÔNG CÓ TRONG NGUỒN: Bạn PHẢI trả lời dứt khoát và trung thực: "Tài liệu nguồn được cung cấp không đề cập đến thông tin/nội dung này." Tuyệt đối không được đoán mò hoặc bổ sung kiến thức tự do!
4. NGOẠI LỆ DUY NHẤT: CHỈ KHI NÀO người dùng chủ động yêu cầu rõ ràng trong câu hỏi (ví dụ: "hãy mở rộng thêm", "lấy thêm thông tin bên ngoài nguồn", "hãy bịa/giả định cho tôi"), thì bạn mới được phép đưa thêm kiến thức mở rộng bên ngoài, và khi đó phải ghi rõ chú thích "[Kiến thức mở rộng ngoài tài liệu nguồn theo yêu cầu của bạn]".
5. BẮT BUỘC DẪN CHỨNG NGUỒN: Mỗi khi nêu ra một định nghĩa, quy trình, cơ chế, khoảng tham chiếu, số liệu, ý nghĩa bệnh lý..., bạn BẮT BUỘC phải kèm theo dẫn chứng cụ thể từ nguồn tài liệu bằng cú pháp [Slide X] hoặc [Trang X] hoặc [Mục X] (Ví dụ: "[Slide 17]" hoặc "[Trang 45, 46]") để người học tra cứu đối chiếu.

QUY TẮC ĐỊNH DẠNG VĂN BẢN (KHẮC PHỤC TRIỆT ĐỂ LỖI KÝ HIỆU):
1. TUYỆT ĐỐI KHÔNG sử dụng cú pháp LaTeX toán học dạng $\\mathbf{...}$, $\\mathrm{...}$ hoặc dấu dollar '$' cho các thuật ngữ y học, sinh học, chữ viết tắt hay đơn vị (như Hb, Hct, RBC, WBC, PLT, MCV, Neutrophil, 10^6/μL, g/dL, fL...). Phải viết chữ bình thường hoặc in đậm markdown thuần túy (Ví dụ: **Hb**, **Hct**, **RBC**, **WBC**, **PLT**, 10^6/μL).
2. TUYỆT ĐỐI KHÔNG dùng các dấu gạch chéo '//' thừa hoặc dấu '*' lẻ loi.
3. Sử dụng cấu trúc rõ ràng: Tiêu đề in hoa hoặc số La Mã (I, II, III...), các ý trình bày bằng dấu gạch đầu dòng '-' mạch lạc, sư phạm.
4. NẾU NGƯỜI HỌC YÊU CẦU TẠO CÂU HỎI TRẮC NGHIỆM TRONG CHAT:
- BẮT BUỘC trả về 100% ở định dạng Markdown chuẩn.
- ĐÁP ÁN ĐÚNG BẮT BUỘC là phương án được in đậm toàn bộ theo cú pháp Markdown: **[A-D]. [Nội dung phương án]** (Ví dụ: **B. Nội dung phương án B**). Các phương án khác không in đậm.
- Định dạng mỗi câu:
Câu 1. [Nội dung câu hỏi]
A. [Nội dung phương án A]
**B. [Nội dung phương án B]**
C. [Nội dung phương án C]
D. [Nội dung phương án D]
- Không ghi thêm chú thích "Đáp án: B" hay giải thích xen giữa các lựa chọn để đảm bảo đúng định dạng chuẩn.`

      userPrompt = `[TÀI LIỆU NGUỒN]:
${sourceContent.slice(0, 45000)}

CÂU HỎI CỦA NGƯỜI HỌC:
${chatPrompt}`
      temperature = 0.0
    }

    // 3. Gọi Gemini API với cơ chế xoay vòng Key và Fallback model
    // Khử trùng model, loại bỏ hoàn toàn các model 1.5 cũ đã bị Google ngừng phục vụ
    const sanitizedActiveModel = (activeModel && !activeModel.startsWith('gemini-1.5'))
      ? activeModel
      : 'gemini-3.8-flash'

    const candidateModels = [
      sanitizedActiveModel,
      'gemini-3.8-flash',
      'gemini-3.5-flash',
      'gemini-2.0-flash',
      'gemini-2.5-flash'
    ].filter((v, i, a) => a.indexOf(v) === i && !v.startsWith('gemini-1.5'))

    let lastError = ''
    let resultText = ''

    for (const key of shuffledKeys) {
      for (const m of candidateModels) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`

          const genConfig: any = {
            temperature: temperature,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: action === 'generate_quiz' ? 16384 : 4096
          }

          // CẤU HÌNH TỐI ƯU TỐC ĐỘ (LOW LATENCY) CHO TỪNG THẾ HỆ GEMINI:
          // 1. Dòng Gemini 3 (3.8-flash, 3.5-flash...):
          //    Mặc định Gemini 3 dùng thinkingLevel "medium" suy luận ngầm rất lâu gây treo.
          //    Đặt thinkingLevel: "low" giúp phản hồi nhanh chóng mà vẫn phân tích cực kỳ sắc bén.
          // 2. Dòng Gemini 2.5 (2.5-flash...):
          //    Dùng thinkingBudget: 0 để tắt bỏ suy luận ngầm và trả về tức thì.
          if (m.includes('3.') || m.startsWith('gemini-3')) {
            genConfig.thinkingConfig = { thinkingLevel: 'low' }
          } else if (m.includes('2.5')) {
            genConfig.thinkingConfig = { thinkingBudget: 0 }
          }

          let response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(35000), // Timeout 35s an toàn
            body: JSON.stringify({
              contents: [
                {
                  parts: [{ text: userPrompt }]
                }
              ],
              systemInstruction: systemInstruction ? {
                parts: [{ text: systemInstruction }]
              } : undefined,
              generationConfig: genConfig
            })
          })

          let resData = await response.json()

          // Nếu model tùy chỉnh không hỗ trợ thinkingConfig, tự động thử lại 1 lần không kèm thinkingConfig
          if (!response.ok && resData.error?.message?.toLowerCase().includes('thinking')) {
            delete genConfig.thinkingConfig
            response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              signal: AbortSignal.timeout(35000),
              body: JSON.stringify({
                contents: [
                  {
                    parts: [{ text: userPrompt }]
                  }
                ],
                systemInstruction: systemInstruction ? {
                  parts: [{ text: systemInstruction }]
                } : undefined,
                generationConfig: genConfig
              })
            })
            resData = await response.json()
          }

          if (!response.ok) {
            const errMsg = resData.error?.message || `HTTP ${response.status}`
            lastError = errMsg
            continue
          }

          const parts = resData.candidates?.[0]?.content?.parts || []
          // Trích xuất phần text câu trả lời (loại trừ thought tokens nếu có)
          const answerParts = parts.filter((p: any) => !p.thought && p.text).map((p: any) => p.text)
          const candidate = answerParts.length > 0 ? answerParts.join('\n') : parts[0]?.text
          if (candidate) {
            resultText = candidate
            break
          } else {
            lastError = 'API không trả về nội dung'
          }
        } catch (err: any) {
          lastError = err.message
          continue
        }
      }
      if (resultText) break
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
