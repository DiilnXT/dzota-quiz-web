import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface MindMapNode {
  id: string
  text: string
  notes?: string
  icon?: string
  color?: string
  isCollapsed?: boolean
  children?: MindMapNode[]
}

const THEME_PALETTES: Record<string, string[]> = {
  rainbow: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'],
  energy: ['#f97316', '#ef4444', '#eab308', '#dc2626', '#b91c1c', '#ea580c', '#f59e0b'],
  medical: ['#0284c7', '#0d9488', '#e11d48', '#7c3aed', '#059669', '#2563eb', '#db2777'],
  pastel: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#38bdf8'],
  cyber: ['#06b6d4', '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#6366f1', '#14b8a6'],
  minimalist: ['#475569', '#3b82f6', '#0284c7', '#334155', '#64748b', '#2563eb']
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      mode = 'topic',
      input = '',
      imageData = null,
      targetNode = null,
      depth = 3,
      detail = 'balanced',
      audience = 'study',
      theme = 'rainbow',
      layout = 'radial',
      customKeys = ''
    } = body

    if (!input && !imageData && mode !== 'create_quiz' && mode !== 'create_flashcards') {
      return NextResponse.json({ error: 'Vui lòng cung cấp nội dung hoặc chủ đề để tạo sơ đồ.' }, { status: 400 })
    }

    // 1. Lấy danh sách API keys từ DB / Client / ENV
    let rawKeys = customKeys || ''
    let activeModel = 'gemini-2.5-flash'

    try {
      if ((prisma as any).systemSetting) {
        const keysSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_API_KEYS' } })
        const modelSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_ACTIVE_MODEL' } })
        if (keysSetting?.value && !rawKeys) rawKeys = keysSetting.value
        if (modelSetting?.value) activeModel = modelSetting.value
      }
    } catch (e) {
      console.warn('SystemSetting query skipped:', e)
    }

    if (!rawKeys) rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || ''

    const keyList = rawKeys
      .split(/[\n,;]+/)
      .map((k: string) => k.trim())
      .filter((k: string) => k.length > 5)

    // Chuẩn bị palette màu cho chủ đề
    const palette = THEME_PALETTES[theme] || THEME_PALETTES.rainbow

    // Xử lý nếu chưa có Gemini Key -> Cung cấp cấu trúc Fallback thông minh
    if (keyList.length === 0) {
      const fallbackResult = generateFallbackMindMap(mode, input, depth, palette, targetNode)
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        isFallback: true,
        notice: 'Đang dùng bộ sinh sơ đồ nội bộ do chưa cấu hình Gemini API Key. Bạn có thể vào Cài đặt để thêm API Key sử dụng AI đầy đủ.'
      })
    }

    // 2. Xây dựng Prompt tương ứng từng chế độ
    let systemInstruction = `Bạn là một Chuyên gia Giáo dục & Kiến trúc sư Trí nhớ hàng đầu thế giới (Mind Map Architect).
Nhiệm vụ của bạn là phân tích tài liệu và cấu trúc hóa kiến thức thành Sơ đồ tư duy (Mind Map) cực kỳ khoa học, trực quan, dễ nhớ và logic.

QUY TẮC CỐT LÕI:
1. TOÀN BỘ NỘI DUNG PHẢI BẰNG TIẾNG VIỆT HOÀN TOÀN (giữ nguyên thuật ngữ chuyên ngành tiếng Anh/Latinh trong ngoặc đơn nếu cần).
2. Phân cấp rõ ràng: Chủ đề gốc (Root) -> Các nhánh chính (Main Topics, cấp 1) -> Các nhánh phụ (Subtopics, cấp 2) -> Chi tiết / Ví dụ / Định nghĩa (Details, cấp 3-4).
3. Mỗi nhánh (node) phải có:
   - "text": Tên nhánh ngắn gọn, súc tích (từ 2-7 từ).
   - "notes": Giải thích chi tiết hoặc định nghĩa/công thức/cơ chế của nhánh đó (từ 10-30 từ).
   - "icon": Một biểu tượng emoji trực quan phù hợp (ví dụ: 🧠, ⚡, 🫀, 📊, 🎯, 💡, 🔬, 💊, 🛡️, 📚...).
4. Độ sâu yêu cầu: ${depth} cấp.
5. Phong cách chi tiết: ${detail === 'brief' ? 'Ngắn gọn, chắt lọc để ôn thi nhanh' : detail === 'deep' ? 'Rất chi tiết, đầy đủ cơ chế và dẫn chứng' : 'Cân bằng giữa lý thuyết và ví dụ'}.
6. Mục đích: ${audience === 'research' ? 'Nghiên cứu chuyên sâu y khoa/khoa học' : audience === 'teach' ? 'Giảng dạy sư phạm' : 'Học tập & Ôn thi hiệu quả'}.
`

    let userPrompt = ''

    if (mode === 'expand_node') {
      userPrompt = `Hãy phát triển và mở rộng riêng cho nhánh kiến thức sau đây:
Nhánh: "${targetNode?.text || input}"
Ghi chú hiện tại: "${targetNode?.notes || ''}"
Bối cảnh sơ đồ: "${targetNode?.context || ''}"

Yêu cầu: Hãy sinh ra 3 đến 6 nhánh con (children) sâu sắc, logic để bổ sung và đào sâu kiến thức cho nhánh này.
Chỉ trả về mảng JSON chứa các nhánh con theo định dạng:
[
  { "text": "...", "notes": "...", "icon": "..." }
]`
    } else if (mode === 'explain_node') {
      userPrompt = `Hãy giải thích chi tiết, cơ chế hoạt động và cách ghi nhớ bản chất của nhánh sau:
"${targetNode?.text || input}" (Ghi chú: ${targetNode?.notes || ''}).
Trả về dạng JSON: { "explanation": "Giải thích sư phạm dễ nhớ...", "analogy": "Ví dụ so sánh liên tưởng thực tế...", "mnemonics": "Mẹo khẩu quyết nhớ nhanh..." }`
    } else if (mode === 'create_quiz') {
      userPrompt = `Từ kiến thức sơ đồ tư duy sau: "${input}", hãy tạo 3 đến 5 câu hỏi trắc nghiệm ôn tập chất lượng cao (4 phương án A, B, C, D kèm đáp án đúng và lời giải thích chi tiết).
Trả về JSON dạng:
{
  "quizzes": [
    {
      "question": "...",
      "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
      "correct": "A",
      "explanation": "..."
    }
  ]
}`
    } else if (mode === 'create_flashcards') {
      userPrompt = `Từ kiến thức sau: "${input}", hãy tạo 6 thẻ ghi nhớ Flashcard ôn tập (mặt trước là câu hỏi/khái niệm, mặt sau là câu trả lời/bản chất).
Trả về JSON:
{
  "flashcards": [
    { "front": "...", "back": "...", "tag": "..." }
  ]
}`
    } else {
      userPrompt = `Hãy phân tích nội dung sau và tạo Sơ đồ tư duy hoàn chỉnh (Mind Map Tree):
NỘI DUNG ĐẦU VÀO:
"""
${input}
"""

BẮT BUỘC TRẢ VỀ DUY NHẤT MỘT ĐỐI TƯỢNG JSON CÓ CẤU TRÚC CÂY NHƯ SAU (Không viết thêm chữ nào khác ngoài JSON):
{
  "text": "Tên chủ đề trung tâm",
  "notes": "Mô tả tổng quan chủ đề",
  "icon": "🧠",
  "children": [
    {
      "text": "Nhánh chính 1",
      "notes": "Giải thích nhánh 1",
      "icon": "📌",
      "children": [
        {
          "text": "Nhánh con 1.1",
          "notes": "Chi tiết nhánh 1.1",
          "icon": "💡",
          "children": []
        }
      ]
    }
  ]
}`
    }

    const shuffledKeys = [...keyList].sort(() => Math.random() - 0.5)
    let aiResponseText = ''
    let lastError = ''

    for (const key of shuffledKeys) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent?key=${key}`

        const parts: any[] = []
        if (imageData && imageData.data && imageData.mimeType) {
          parts.push({
            inlineData: {
              mimeType: imageData.mimeType,
              data: imageData.data
            }
          })
        }
        parts.push({ text: `${systemInstruction}\n\n${userPrompt}` })

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts }],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 8192,
              responseMimeType: 'application/json'
            }
          })
        })

        const resData = await response.json()
        if (resData.error) {
          lastError = resData.error.message || JSON.stringify(resData.error)
          continue
        }

        const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text
        if (candidateText) {
          aiResponseText = candidateText
          break
        }
      } catch (err: any) {
        lastError = err.message || String(err)
      }
    }

    if (!aiResponseText) {
      console.warn('Gemini request failed or rate-limited. Falling back to internal engine:', lastError)
      const fallbackResult = generateFallbackMindMap(mode, input, depth, palette, targetNode)
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        isFallback: true,
        notice: `Đã tự động chuyển sang bộ tạo dự phòng (${lastError || 'Kết nối AI gián đoạn'}).`
      })
    }

    // 3. Chuẩn hóa và gán màu/ID cho cây sơ đồ
    try {
      const cleanJsonStr = aiResponseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim()
      const parsed = JSON.parse(cleanJsonStr)

      if (mode === 'create_quiz' || mode === 'create_flashcards' || mode === 'explain_node') {
        return NextResponse.json({ success: true, data: parsed })
      }

      if (mode === 'expand_node') {
        const rawChildren = Array.isArray(parsed) ? parsed : (parsed.children || [])
        const coloredChildren = rawChildren.map((c: any, i: number) => ({
          id: 'node_' + Math.random().toString(36).substring(2, 9),
          text: c.text || 'Ý mới',
          notes: c.notes || '',
          icon: c.icon || '💡',
          color: palette[i % palette.length],
          children: []
        }))
        return NextResponse.json({ success: true, data: coloredChildren })
      }

      // Gán id và màu sắc theo palette
      const assignedTree = assignNodeMeta(parsed, palette)
      return NextResponse.json({ success: true, data: assignedTree })
    } catch (parseErr) {
      console.warn('JSON parsing error from AI response:', parseErr)
      const fallbackResult = generateFallbackMindMap(mode, input, depth, palette, targetNode)
      return NextResponse.json({
        success: true,
        data: fallbackResult,
        isFallback: true
      })
    }
  } catch (error: any) {
    console.error('MindMap API error:', error)
    return NextResponse.json({ error: error.message || 'Lỗi xử lý MindMap AI' }, { status: 500 })
  }
}

// Hàm gán ID, màu sắc và icon cho toàn bộ nhánh
function assignNodeMeta(node: any, palette: string[], depth = 0, branchColor?: string): MindMapNode {
  const nodeId = node.id || 'node_' + Math.random().toString(36).substring(2, 9)
  let color = node.color
  if (!color) {
    if (depth === 0) {
      color = '#1e293b' // Root node
    } else if (depth === 1) {
      color = palette[Math.floor(Math.random() * palette.length)]
    } else {
      color = branchColor || palette[0]
    }
  }

  const processedChildren = (node.children || []).map((child: any, idx: number) => {
    const cColor = depth === 0 ? palette[idx % palette.length] : color
    return assignNodeMeta(child, palette, depth + 1, cColor)
  })

  return {
    id: nodeId,
    text: String(node.text || 'Chủ đề'),
    notes: node.notes ? String(node.notes) : undefined,
    icon: node.icon || (depth === 0 ? '🧠' : depth === 1 ? '📌' : '•'),
    color,
    isCollapsed: false,
    children: processedChildren
  }
}

// Bộ tạo sơ đồ dự phòng chất lượng cao
function generateFallbackMindMap(mode: string, input: string, depth: number, palette: string[], targetNode?: any): any {
  if (mode === 'create_quiz') {
    return {
      quizzes: [
        {
          question: `Nội dung cốt lõi của "${input.slice(0, 40)}" liên quan mật thiết nhất đến yếu tố nào?`,
          options: {
            A: 'Cơ chế kích hoạt và truyền tín hiệu sinh học',
            B: 'Định luật bảo toàn năng lượng và phân rã',
            C: 'Quy trình kiểm soát chất lượng và tối ưu hóa',
            D: 'Mô hình phân loại hệ thống logic'
          },
          correct: 'A',
          explanation: 'Dựa trên bản chất phân tích kiến thức, cơ chế truyền tín hiệu là yếu tố chi phối trực tiếp.'
        },
        {
          question: `Ứng dụng thực tiễn quan trọng nhất trong nghiên cứu "${input.slice(0, 40)}" là gì?`,
          options: {
            A: 'Chẩn đoán và đưa ra phác đồ can thiệp phù hợp',
            B: 'Xây dựng cấu trúc dữ liệu cơ sở',
            C: 'Giảm thiểu thời gian vận hành tối đa',
            D: 'Thay thế hoàn toàn quy trình truyền thống'
          },
          correct: 'A',
          explanation: 'Mục tiêu hàng đầu của việc hệ thống hóa kiến thức là phục vụ ứng dụng can thiệp chính xác.'
        }
      ]
    }
  }

  if (mode === 'create_flashcards') {
    return {
      flashcards: [
        {
          front: `Khái niệm then chốt của "${input.slice(0, 40)}" là gì?`,
          back: 'Hệ thống hóa các mối quan hệ nguyên nhân - kết quả và phân nhóm kiến thức cốt lõi.',
          tag: 'Định nghĩa'
        },
        {
          front: `Quy tắc ghi nhớ nhanh cho chuyên đề này?`,
          back: 'Áp dụng liên tưởng hình ảnh, phân nhóm theo cơ quan/chức năng và đối chiếu sơ đồ tư duy.',
          tag: 'Mẹo nhớ'
        }
      ]
    }
  }

  if (mode === 'expand_node') {
    const parentText = targetNode?.text || input || 'Khái niệm'
    return [
      { id: 'node_exp_1', text: `Cơ chế hoạt động của ${parentText}`, notes: 'Chi tiết nguyên lý và động lực thúc đẩy', icon: '⚡', color: palette[0], children: [] },
      { id: 'node_exp_2', text: `Đặc điểm & Dấu hiệu nhận biết`, notes: 'Các tiêu chuẩn phân biệt then chốt', icon: '🔍', color: palette[1], children: [] },
      { id: 'node_exp_3', text: `Ứng dụng thực hành & Bẫy thi`, notes: 'Tình huống thường gặp trong đề thi và thực tế', icon: '🎯', color: palette[2], children: [] },
      { id: 'node_exp_4', text: `Lưu ý & Chống chỉ định`, notes: 'Những ngoại lệ đặc biệt cần ghi nhớ kỹ', icon: '⚠️', color: palette[3], children: [] }
    ]
  }

  // Chế độ tạo sơ đồ chính từ văn bản/chủ đề
  const cleanTitle = (input || 'Sơ Đồ Kiến Thức').trim().slice(0, 50)
  
  return {
    id: 'root',
    text: cleanTitle,
    notes: 'Sơ đồ tư duy hệ thống hóa toàn diện kiến thức',
    icon: '🧠',
    color: '#1e293b',
    isCollapsed: false,
    children: [
      {
        id: 'branch_1',
        text: 'Tổng Quan & Định Nghĩa',
        notes: 'Khái niệm nền tảng và vị trí trong hệ thống',
        icon: '📖',
        color: palette[0],
        children: [
          { id: 'b1_1', text: 'Bản chất khoa học', notes: 'Nguyên lý hình thành và cơ sở lý luận', icon: '🔬', color: palette[0] },
          { id: 'b1_2', text: 'Phạm vi áp dụng', notes: 'Điều kiện xảy ra và đối tượng tác động', icon: '🌐', color: palette[0] },
          { id: 'b1_3', text: 'Thuật ngữ liên quan', notes: 'Các khái niệm bổ trợ then chốt', icon: '🏷️', color: palette[0] }
        ]
      },
      {
        id: 'branch_2',
        text: 'Cơ Chế & Nguyên Lý Hoạt Động',
        notes: 'Tiến trình diễn biến và tương tác nội tại',
        icon: '⚡',
        color: palette[1],
        children: [
          { id: 'b2_1', text: 'Giai đoạn khởi động', notes: 'Yếu tố kích hoạt và điều kiện cần', icon: '🚀', color: palette[1] },
          { id: 'b2_2', text: 'Giai đoạn chuyển hóa', notes: 'Phản ứng trung gian và chu trình', icon: '🔄', color: palette[1] },
          { id: 'b2_3', text: 'Giai đoạn hoàn tất', notes: 'Sản phẩm đầu ra và trạng thái cân bằng', icon: '🏁', color: palette[1] }
        ]
      },
      {
        id: 'branch_3',
        text: 'Phân Loại & Dấu Hiệu Đặc Trưng',
        notes: 'Cách phân chia các nhóm đối tượng theo tiêu chuẩn',
        icon: '📊',
        color: palette[2],
        children: [
          { id: 'b3_1', text: 'Nhóm điển hình cấp I', notes: 'Tần suất xuất hiện cao nhất, đặc tính cơ bản', icon: '🅰️', color: palette[2] },
          { id: 'b3_2', text: 'Nhóm biến thể cấp II', notes: 'Biến đổi cấu trúc hoặc thích nghi ngoại cảnh', icon: '🅱️', color: palette[2] },
          { id: 'b3_3', text: 'Bảng đối chiếu so sánh', notes: 'Phân biệt nhanh các điểm tương đồng và dị biệt', icon: '⚖️', color: palette[2] }
        ]
      },
      {
        id: 'branch_4',
        text: 'Ứng Dụng Thực Tiễn & Bài Tập',
        notes: 'Liên hệ thực tế, xử lý câu hỏi trắc nghiệm',
        icon: '🎯',
        color: palette[3],
        children: [
          { id: 'b4_1', text: 'Tình huống ứng dụng thực tế', notes: 'Giải quyết ca bệnh / bài toán cụ thể', icon: '💼', color: palette[3] },
          { id: 'b4_2', text: 'Bẫy đề thi hay gặp', notes: 'Các phương án nhiễu dễ gây nhầm lẫn', icon: '⚠️', color: palette[3] },
          { id: 'b4_3', text: 'Khẩu quyết nhớ nhanh', notes: 'Thần chú phản xạ trắc nghiệm tức thì', icon: '💡', color: palette[3] }
        ]
      }
    ]
  }
}
