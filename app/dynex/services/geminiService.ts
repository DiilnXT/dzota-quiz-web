// DYNEX Medical Gemini AI Service
// Specialized in High-Precision Anatomical OCR & Auto Mask Detection
// Designed specifically for Dzota Quiz Platform

export const sampleAnatomyUrl = '/sample_anatomy.jpg'

const LOCAL_STORAGE_KEY_GEMINI_KEY = 'dynex_gemini_api_key'
const LOCAL_STORAGE_KEY_GEMINI_MODEL = 'dynex_gemini_model'
const LOCAL_STORAGE_KEY_DEFAULT_MASK_STYLE = 'dynex_default_mask_style_v2'

export const DEFAULT_MODEL = 'gemini-3.6-flash'
export const AVAILABLE_MODELS = [
  { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash (Chính thức - Tối ưu 1M token & Suy luận y khoa)' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Thế hệ 3.8 mới nhất)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Đa phương thức)' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Ổn định)' }
]

export const MASK_COLOR_PRESETS = [
  { id: 'dark', name: 'Đen Đặc Dzota Y Khoa', hex: '#070b14', border: '#4f46e5', textColor: '#ffffff' },
  { id: 'indigo', name: 'Xanh Indigo Dzota', hex: '#1e1b4b', border: '#6366f1', textColor: '#c7d2fe' },
  { id: 'cyan', name: 'Cyan Y Sinh', hex: '#083344', border: '#06b6d4', textColor: '#67e8f9' },
  { id: 'emerald', name: 'Xanh Ngoại Khoa', hex: '#022c22', border: '#10b981', textColor: '#6ee7b7' },
  { id: 'rose', name: 'Đỏ Phẫu Thuật', hex: '#4c0519', border: '#f43f5e', textColor: '#fda4af' },
  { id: 'amber', name: 'Vàng Cảnh Báo OSCE', hex: '#451a03', border: '#f59e0b', textColor: '#fde68a' },
  { id: 'purple', name: 'Tím Thần Kinh Học', hex: '#2e1065', border: '#a855f7', textColor: '#d8b4fe' },
  { id: 'tape', name: 'Băng Trắng Y Tế', hex: '#f1f5f9', border: '#64748b', textColor: '#0f172a' }
]

export const DEFAULT_MASK_STYLE = {
  color: '#070b14',
  borderColor: '#6366f1',
  textColor: '#ffffff',
  opacity: 1.0, // 100% solid opacity to guarantee zero answer leak
  texture: 'solid', // 'solid' | 'glass' | 'tape' | 'neon'
  displayMode: 'number', // 'number' | 'question' | 'blank'
  borderRadius: 8
}

export const getStoredDefaultMaskStyle = () => {
  if (typeof window === 'undefined') return DEFAULT_MASK_STYLE
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_DEFAULT_MASK_STYLE)
    return raw ? { ...DEFAULT_MASK_STYLE, ...JSON.parse(raw) } : DEFAULT_MASK_STYLE
  } catch {
    return DEFAULT_MASK_STYLE
  }
}

export const setStoredDefaultMaskStyle = (style: any) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY_DEFAULT_MASK_STYLE, JSON.stringify(style))
}

export const getStoredApiKey = () => {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(LOCAL_STORAGE_KEY_GEMINI_KEY) || ''
}

export const setStoredApiKey = (key: string) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(LOCAL_STORAGE_KEY_GEMINI_KEY, (key || '').trim())
}

export const getStoredModel = () => {
  if (typeof window === 'undefined') return DEFAULT_MODEL
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY_GEMINI_MODEL)
  if (!stored || stored === 'gemini-2.5-flash' || stored === 'gemini-flash-3.6') {
    return DEFAULT_MODEL
  }
  return stored
}

export const setStoredModel = (model: string) => {
  if (typeof window === 'undefined') return
  const normalized = (model === 'gemini-flash-3.6' || model === 'gemini-2.5-flash') ? DEFAULT_MODEL : model
  localStorage.setItem(LOCAL_STORAGE_KEY_GEMINI_MODEL, normalized)
}

// Generous 100% solid coverage anatomical coordinates for the sample Liver/Digestive diagram
export const SAMPLE_ANATOMY_FALLBACK_MASKS = [
  {
    id: 'mask_sample_1',
    label: 'Thùy gan phải',
    x: 4.0,
    y: 4.0,
    width: 34.0,
    height: 18.0,
    synonyms: ['Gan phải', 'Thùy phải gan', 'Lobus hepatis dexter'],
    hint: 'Phần lớn nhất của gan nằm ở hạ sườn phải, chia thành các hạ phân thùy V, VI, VII, VIII',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_2',
    label: 'Thực quản',
    x: 56.0,
    y: 1.5,
    width: 26.0,
    height: 16.5,
    synonyms: ['Ống thực quản', 'Esophagus'],
    hint: 'Ống dẫn thức ăn từ hầu xuống dạ dày qua lỗ tâm vị',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_3',
    label: 'Thùy gan trái',
    x: 67.0,
    y: 6.5,
    width: 31.0,
    height: 17.0,
    synonyms: ['Gan trái', 'Thùy trái gan', 'Lobus hepatis sinister'],
    hint: 'Phần gan nhỏ hơn nằm bên trái thực quản',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_4',
    label: 'Ống gan chung',
    x: 74.0,
    y: 34.0,
    width: 25.0,
    height: 17.0,
    synonyms: ['Ống gan', 'Ductus hepaticus communis'],
    hint: 'Hợp lưu từ ống gan phải và ống gan trái',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_5',
    label: 'Túi mật',
    x: 0.5,
    y: 39.0,
    width: 28.5,
    height: 16.0,
    synonyms: ['Túi trữ mật', 'Vesica biliaris'],
    hint: 'Túi nhỏ hình quả lê chứa và cô đặc dịch mật',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_6',
    label: 'Ống mật',
    x: 1.5,
    y: 63.0,
    width: 28.5,
    height: 14.5,
    synonyms: ['Đường mật', 'Ống túi mật', 'Ductus cysticus'],
    hint: 'Dẫn mật từ túi mật đổ vào ống mật chủ',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_7',
    label: 'Ống mật chủ',
    x: 7.0,
    y: 70.0,
    width: 29.0,
    height: 18.0,
    synonyms: ['Ống chủ', 'Ductus choledochus'],
    hint: 'Hợp lưu giữa ống gan chung và ống túi mật, đổ dịch mật vào bóng Vater ở tá tràng',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_8',
    label: 'Tá tràng',
    x: 10.5,
    y: 83.0,
    width: 29.0,
    height: 16.5,
    synonyms: ['Khúc tá tràng', 'Duodenum'],
    hint: 'Phần đầu tiên của ruột non hình chữ C ôm lấy đầu tụy',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_9',
    label: 'Môn vị',
    x: 32.0,
    y: 84.0,
    width: 28.0,
    height: 16.5,
    synonyms: ['Lỗ môn vị', 'Cơ thắt môn vị', 'Pylorus'],
    hint: 'Van cơ ngăn cách giữa dạ dày và tá tràng kiểm soát thức ăn qua',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_10',
    label: 'Ruột non',
    x: 61.0,
    y: 74.0,
    width: 29.0,
    height: 16.0,
    synonyms: ['Tiểu tràng', 'Hỗng tràng & Hồi tràng'],
    hint: 'Đoạn ruột tiếp nối tá tràng để hấp thụ chất dinh dưỡng',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  },
  {
    id: 'mask_sample_11',
    label: 'Tuyến tụy',
    x: 61.0,
    y: 82.5,
    width: 29.0,
    height: 17.0,
    synonyms: ['Tụy', 'Tụy tạng', 'Pancreas'],
    hint: 'Tuyến nội tiết và ngoại tiết nằm sau dạ dày',
    color: '#070b14',
    borderColor: '#6366f1',
    textColor: '#ffffff',
    opacity: 1.0,
    texture: 'solid',
    displayMode: 'number',
    isCovered: true
  }
]

export const isDefaultSampleImage = (imageSource: string) => {
  if (!imageSource) return false
  if (imageSource === sampleAnatomyUrl) return true
  if (typeof imageSource === 'string' && imageSource.includes('sample_anatomy')) return true
  return false
}

// Helper to extract base64 and mime
export const extractBase64AndMime = async (imageSource: string): Promise<{ mimeType: string; base64: string }> => {
  if (typeof imageSource === 'string') {
    if (imageSource.startsWith('data:')) {
      const match = imageSource.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        return { mimeType: match[1], base64: match[2] }
      }
    } else {
      const res = await fetch(imageSource)
      const blob = await res.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          const match = result.match(/^data:([^;]+);base64,(.+)$/)
          if (match) {
            resolve({ mimeType: match[1], base64: match[2] })
          } else {
            reject(new Error('Failed to parse image data'))
          }
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    }
  }
  throw new Error('Unsupported image format')
}

/**
 * CLIENT-SIDE CANVAS VISION DETECTOR:
 * Scans image pixels locally in browser to detect high-contrast text lines and labels.
 */
export async function detectTextRegionsFromCanvas(imageSource: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const targetWidth = 1000
        const scale = targetWidth / img.width
        const targetHeight = Math.round(img.height * scale)

        canvas.width = targetWidth
        canvas.height = targetHeight
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return resolve([])
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

        const imgData = ctx.getImageData(0, 0, targetWidth, targetHeight)
        const data = imgData.data

        const gray = new Uint8Array(targetWidth * targetHeight)
        const edges = new Uint8Array(targetWidth * targetHeight)

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          gray[i / 4] = (r * 299 + g * 587 + b * 114) / 1000
        }

        for (let y = 1; y < targetHeight - 1; y++) {
          for (let x = 1; x < targetWidth - 1; x++) {
            const idx = y * targetWidth + x
            const diffX = Math.abs(gray[idx + 1] - gray[idx - 1])
            const diffY = Math.abs(gray[idx + targetWidth] - gray[idx - targetWidth])
            if (diffX > 25 || diffY > 30) {
              edges[idx] = 255
            }
          }
        }

        const dilated = new Uint8Array(targetWidth * targetHeight)
        const hRadius = 14
        const vRadius = 4

        for (let y = vRadius; y < targetHeight - vRadius; y += 2) {
          for (let x = hRadius; x < targetWidth - hRadius; x += 2) {
            let hit = false
            for (let dy = -vRadius; dy <= vRadius; dy++) {
              for (let dx = -hRadius; dx <= hRadius; dx++) {
                if (edges[(y + dy) * targetWidth + (x + dx)] === 255) {
                  hit = true
                  break
                }
              }
              if (hit) break
            }
            if (hit) {
              dilated[y * targetWidth + x] = 255
            }
          }
        }

        const cellSize = 16
        const gridW = Math.ceil(targetWidth / cellSize)
        const gridH = Math.ceil(targetHeight / cellSize)
        const grid = new Uint8Array(gridW * gridH)

        for (let gy = 0; gy < gridH; gy++) {
          for (let gx = 0; gx < gridW; gx++) {
            let count = 0
            const startX = gx * cellSize
            const startY = gy * cellSize
            for (let dy = 0; dy < cellSize; dy += 2) {
              for (let dx = 0; dx < cellSize; dx += 2) {
                const py = startY + dy
                const px = startX + dx
                if (py < targetHeight && px < targetWidth && dilated[py * targetWidth + px] === 255) {
                  count++
                }
              }
            }
            if (count >= 5) {
              grid[gy * gridW + gx] = 1
            }
          }
        }

        const visited = new Uint8Array(gridW * gridH)
        const boxes: any[] = []

        for (let gy = 0; gy < gridH; gy++) {
          for (let gx = 0; gx < gridW; gx++) {
            const gIdx = gy * gridW + gx
            if (grid[gIdx] === 1 && !visited[gIdx]) {
              let minGX = gx, maxGX = gx, minGY = gy, maxGY = gy
              const queue = [[gx, gy]]
              visited[gIdx] = 1

              while (queue.length > 0) {
                const [cx, cy] = queue.shift()!
                if (cx < minGX) minGX = cx
                if (cx > maxGX) maxGX = cx
                if (cy < minGY) minGY = cy
                if (cy > maxGY) maxGY = cy

                const neighbors = [
                  [cx + 1, cy], [cx - 1, cy],
                  [cx, cy + 1], [cx, cy - 1],
                  [cx + 1, cy + 1], [cx - 1, cy - 1]
                ]

                for (const [nx, ny] of neighbors) {
                  if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
                    const nIdx = ny * gridW + nx
                    if (grid[nIdx] === 1 && !visited[nIdx]) {
                      visited[nIdx] = 1
                      queue.push([nx, ny])
                    }
                  }
                }
              }

              const pixelX = minGX * cellSize
              const pixelY = minGY * cellSize
              const pixelW = (maxGX - minGX + 1) * cellSize
              const pixelH = (maxGY - minGY + 1) * cellSize

              const percentX = (pixelX / targetWidth) * 100
              const percentY = (pixelY / targetHeight) * 100
              const percentW = (pixelW / targetWidth) * 100
              const percentH = (pixelH / targetHeight) * 100

              if (
                percentW >= 4.0 && percentW <= 45.0 &&
                percentH >= 2.0 && percentH <= 16.0 &&
                (percentW / percentH) >= 1.0
              ) {
                boxes.push({
                  x: Math.max(0.5, Number((percentX - 0.5).toFixed(1))),
                  y: Math.max(0.5, Number((percentY - 0.5).toFixed(1))),
                  width: Math.min(99, Number((percentW + 1.5).toFixed(1))),
                  height: Math.min(99, Number((percentH + 1.2).toFixed(1)))
                })
              }
            }
          }
        }

        boxes.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y)

        const defStyle = getStoredDefaultMaskStyle()
        const detectedMasks = boxes.slice(0, 16).map((b, idx) => ({
          id: `mask_vision_${Date.now()}_${idx + 1}`,
          label: `Chi tiết giải phẫu #${idx + 1}`,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          synonyms: [],
          hint: 'Quan sát vị trí giải phẫu trên sơ đồ và điền tên chính xác',
          color: defStyle.color || '#070b14',
          borderColor: defStyle.borderColor || '#6366f1',
          textColor: defStyle.textColor || '#ffffff',
          opacity: 1.0,
          texture: 'solid',
          displayMode: 'number',
          isCovered: true
        }))

        resolve(detectedMasks)
      } catch (err) {
        reject(err)
      }
    }
    img.onerror = () => reject(new Error('Không thể tải hình ảnh để phân tích canvas.'))
    img.src = imageSource
  })
}

/**
 * Call Gemini Flash API (gemini-3.6-flash / gemini-3.8-flash)
 */
export async function detectAnatomyLabelsWithGemini(
  imageDataUrl: string,
  userApiKey: string = '',
  userModel: string = ''
): Promise<{
  success: boolean
  masks?: any[]
  modelUsed?: string
  usedSampleFallback?: boolean
  needsApiKey?: boolean
  message?: string
  error?: string
}> {
  const apiKey = userApiKey || getStoredApiKey()
  const rawModel = userModel || getStoredModel() || DEFAULT_MODEL
  const defStyle = getStoredDefaultMaskStyle()

  // 1. Thử gọi qua API backend của Dzota (sử dụng Gemini API Key cấu hình trong trang Admin của Dzota)
  try {
    const scanRes = await fetch('/api/dynex/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: imageDataUrl,
        clientApiKey: apiKey,
        clientModel: rawModel
      })
    })

    if (scanRes.ok) {
      const scanData = await scanRes.json()
      if (scanData.success && Array.isArray(scanData.labels) && scanData.labels.length > 0) {
        const masks = scanData.labels.map((item: any, idx: number) => ({
          id: `mask_gemini_${Date.now()}_${idx + 1}`,
          label: item.text || item.label || `Chi tiết giải phẫu #${idx + 1}`,
          x: Math.max(0, Math.min(100, item.x ?? (item.box_2d ? item.box_2d[1] / 10 : 10))),
          y: Math.max(0, Math.min(100, item.y ?? (item.box_2d ? item.box_2d[0] / 10 : 10))),
          width: Math.max(3, Math.min(100, item.width ?? (item.box_2d ? (item.box_2d[3] - item.box_2d[1]) / 10 : 20))),
          height: Math.max(2, Math.min(100, item.height ?? (item.box_2d ? (item.box_2d[2] - item.box_2d[0]) / 10 : 8))),
          synonyms: Array.isArray(item.synonyms)
            ? item.synonyms
            : (typeof item.synonyms === 'string' ? item.synonyms.split(',').map((s: string) => s.trim()).filter(Boolean) : []),
          hint: item.clinicalNote || item.hint || '',
          ...defStyle,
          isCovered: true
        }))

        return {
          success: true,
          masks,
          modelUsed: scanData.modelUsed || rawModel
        }
      }
    }
  } catch (backendErr) {
    console.warn('Backend /api/dynex/scan failed, attempting fallback:', backendErr)
  }

  // 2. Fallback cho ảnh mẫu (nếu chưa có API key)
  if (isDefaultSampleImage(imageDataUrl)) {
    await new Promise(r => setTimeout(r, 400))
    return {
      success: true,
      usedSampleFallback: true,
      masks: SAMPLE_ANATOMY_FALLBACK_MASKS.map(m => ({
        ...m,
        ...defStyle,
        id: `mask_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
      }))
    }
  }

  // 3. Fallback trực tiếp bằng Client-side gọi Google API (nếu người dùng có key riêng)
  if (!apiKey) {
    return {
      success: false,
      needsApiKey: true,
      message: 'Hình ảnh mới của bạn cần Google Gemini Vision API. Bạn có thể chọn Quét Canvas Vision hoặc cấu hình Gemini API Key trong Cài đặt.'
    }
  }

  try {
    const { mimeType, base64 } = await extractBase64AndMime(imageDataUrl)

    const prompt = `
Bạn là chuyên gia Giải phẫu học Y khoa và Trí tuệ Nhân tạo Thị giác máy tính cấp cao.
Nhiệm vụ: Phát hiện TOÀN BỘ các dòng chữ/nhãn nhan đề (labels/callouts) chỉ tên các cơ quan, cấu tạo giải phẫu, mạch máu, dây thần kinh, xương khớp in trên bức ảnh này.

Mỗi nhãn chữ cần được sinh một ô che (bounding box mask) để CHE KÍN HOÀN TOÀN 100% phần chữ đó, tuyệt đối KHÔNG ĐƯỢC LÒI BẤT KỲ KÝ TỰ CHỮ NÀO ra ngoài. Nếu chữ gồm 2 hoặc 3 dòng (ví dụ "Thể\\nchai"), hộp bao phải bao trọn toàn bộ các dòng!

QUY TẮC BẮT BUỘC:
1. "box_2d": [ymin, xmin, ymax, xmax] - tọa độ chuẩn hóa từ 0 đến 1000 (0 là đỉnh/trái, 1000 là đáy/phải). Hãy mở rộng viền hộp thêm 15 đơn vị mỗi chiều để che kín khít 100% phần chữ.
2. "label": Tên chính xác của cơ quan/bộ phận in trên nhãn (tiếng Việt có dấu chuẩn y khoa).
3. "synonyms": Mảng các tên gọi thay thế, tên viết tắt, hoặc tên giải phẫu quốc tế/Latinh (ví dụ: ["Corpus callosum", "Thể chai"]).
4. "hint": Gợi ý 1 câu ngắn gọn về chức năng sinh lý hoặc vị trí liên quan.

Hãy trả về DUY NHẤT một mảng JSON hợp lệ, không markdown/code block:
[
  {
    "box_2d": [80, 50, 210, 360],
    "label": "Tên cơ quan",
    "synonyms": ["Tên gọi khác"],
    "hint": "Gợi ý y khoa ngắn"
  }
]
`

    let primaryModel = rawModel
    if (primaryModel === 'gemini-flash-3.6' || primaryModel === 'gemini-2.5-flash') {
      primaryModel = 'gemini-3.6-flash'
    }

    const candidateModels = [
      primaryModel,
      'gemini-3.6-flash',
      'gemini-3.8-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash'
    ].filter((m, i, arr) => arr.indexOf(m) === i)

    let response: Response | null = null
    let usedModel = primaryModel
    let lastError = null

    for (const testModel of candidateModels) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${testModel}:generateContent?key=${apiKey}`
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64 } }
                ]
              }
            ],
            generationConfig: {
              response_mime_type: 'application/json',
              temperature: 0.1
            }
          })
        })

        if (res.ok) {
          response = res
          usedModel = testModel
          break
        } else {
          const errData = await res.json().catch(() => ({}))
          lastError = errData.error?.message || `HTTP ${res.status}`
          if (res.status === 404 || lastError.includes('no longer available') || lastError.includes('not found')) {
            continue
          } else {
            throw new Error(lastError)
          }
        }
      } catch (e: any) {
        lastError = e.message
        if (e.message.includes('API key') || e.message.includes('permission')) {
          throw e
        }
      }
    }

    if (!response) {
      throw new Error(lastError || 'Không thể kết nối đến Gemini Flash API.')
    }

    const data = await response.json()
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!candidateText) {
      throw new Error('Không nhận được dữ liệu phản hồi từ Gemini API')
    }

    let parsedList: any[] = []
    try {
      parsedList = JSON.parse(candidateText)
    } catch {
      const match = candidateText.match(/\[[\s\S]*\]/)
      if (match) {
        parsedList = JSON.parse(match[0])
      } else {
        throw new Error('Dữ liệu JSON từ Gemini không đúng định dạng')
      }
    }

    if (!Array.isArray(parsedList) || parsedList.length === 0) {
      throw new Error('Gemini không phát hiện được nhãn chữ nào trên hình ảnh.')
    }

    const formattedMasks = parsedList.map((item, index) => {
      let [ymin, xmin, ymax, xmax] = item.box_2d || [0, 0, 100, 100]

      ymin = Math.max(0, ymin - 15)
      xmin = Math.max(0, xmin - 15)
      ymax = Math.min(1000, ymax + 15)
      xmax = Math.min(1000, xmax + 15)

      const x = (xmin / 1000) * 100
      const y = (ymin / 1000) * 100
      const width = ((xmax - xmin) / 1000) * 100
      const height = ((ymax - ymin) / 1000) * 100

      return {
        id: `mask_ai_${Date.now()}_${index}`,
        label: (item.label || `Chi tiết #${index + 1}`).trim(),
        x: Math.max(0.5, Number(x.toFixed(2))),
        y: Math.max(0.5, Number(y.toFixed(2))),
        width: Math.max(5, Number(width.toFixed(2))),
        height: Math.max(4, Number(height.toFixed(2))),
        synonyms: Array.isArray(item.synonyms) ? item.synonyms : [],
        hint: item.hint || 'Quan sát vị trí giải phẫu liên quan',
        color: defStyle.color || '#070b14',
        borderColor: defStyle.borderColor || '#6366f1',
        textColor: defStyle.textColor || '#ffffff',
        opacity: 1.0,
        texture: defStyle.texture || 'solid',
        displayMode: defStyle.displayMode || 'number',
        isCovered: true
      }
    })

    return {
      success: true,
      masks: formattedMasks,
      modelUsed: usedModel
    }
  } catch (error: any) {
    console.error('Gemini Detection Failed:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
