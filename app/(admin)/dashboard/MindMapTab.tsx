'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Network,
  Sparkles,
  Plus,
  Trash2,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  BookOpen,
  HelpCircle,
  FileText,
  Upload,
  Image as ImageIcon,
  FolderOpen,
  Copy,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Wand2,
  Play,
  Eye,
  EyeOff,
  Settings,
  X,
  FileCode,
  Edit3,
  Lightbulb,
  GraduationCap,
  Save,
  Search
} from 'lucide-react'

// Cấu trúc dữ liệu Node của Sơ đồ tư duy
export interface MindMapNode {
  id: string
  text: string
  notes?: string
  icon?: string
  color?: string
  isCollapsed?: boolean
  x?: number
  y?: number
  children?: MindMapNode[]
}

// Bảng màu chủ đề
const COLOR_THEMES = [
  { id: 'rainbow', name: 'Cầu vồng (Rainbow)', colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'] },
  { id: 'energy', name: 'Năng lượng (Energy)', colors: ['#f97316', '#ef4444', '#eab308', '#dc2626', '#b91c1c', '#ea580c'] },
  { id: 'medical', name: 'Y khoa & Sinh học (Medical)', colors: ['#0284c7', '#0d9488', '#e11d48', '#7c3aed', '#059669', '#2563eb'] },
  { id: 'pastel', name: 'Dịu mắt (Pastel Mint & Rose)', colors: ['#60a5fa', '#f87171', '#34d399', '#fbbf24', '#a78bfa', '#f472b6'] },
  { id: 'cyber', name: 'Công nghệ & Neon (Cyber)', colors: ['#06b6d4', '#a855f7', '#3b82f6', '#10b981', '#f43f5e', '#6366f1'] },
  { id: 'minimalist', name: 'Tối giản thanh lịch (Minimalist)', colors: ['#475569', '#3b82f6', '#0284c7', '#334155', '#64748b'] }
]

// Mẫu sơ đồ có sẵn theo lĩnh vực thực tế
const PRESET_TEMPLATES: { id: string; category: string; title: string; desc: string; icon: string; data: MindMapNode }[] = [
  {
    id: 'tpl_medical_body',
    category: 'Y khoa & Sinh học',
    title: 'Hệ Cơ Quan Con Người (The Human Body)',
    desc: 'Hệ tuần hoàn, hô hấp, tiêu hóa, thần kinh, bài tiết, nội tiết và miễn dịch.',
    icon: '🫀',
    data: {
      id: 'root',
      text: 'HỆ CƠ QUAN NGƯỜI (HUMAN BODY)',
      notes: 'Cấu trúc tổng thể các hệ thống điều hòa và duy trì sự sống cơ thể người.',
      icon: '🫀',
      color: '#1e293b',
      children: [
        {
          id: 'b_circulatory',
          text: 'Hệ Tuần Hoàn',
          notes: 'Vận chuyển oxy, dưỡng chất và hormon đến tế bào.',
          icon: '❤️',
          color: '#e11d48',
          children: [
            { id: 'c1', text: 'Tim (4 ngăn: 2 tâm nhĩ, 2 tâm thất)', notes: 'Bơm máu liên tục qua chu kỳ tâm thu & tâm trương.', icon: '💓' },
            { id: 'c2', text: 'Mạch máu (Động mạch, Tĩnh mạch, Mao mạch)', notes: 'Mao mạch là nơi trao đổi chất và khí chính.', icon: '🩸' },
            { id: 'c3', text: 'Vòng tuần hoàn lớn & nhỏ', notes: 'Vòng nhỏ lên phổi trao đổi O2, vòng lớn đi toàn thân.', icon: '🔄' }
          ]
        },
        {
          id: 'b_nervous',
          text: 'Hệ Thần Kinh',
          notes: 'Tiếp nhận, xử lý kích thích và điều khiển phản xạ toàn thân.',
          icon: '🧠',
          color: '#7c3aed',
          children: [
            { id: 'n1', text: 'Thần kinh Trung ương (Não & Tủy sống)', notes: 'Trung khu điều khiển ý thức và phản xạ không điều kiện.', icon: '⚡' },
            { id: 'n2', text: 'Thần kinh Ngoại biên (12 đôi dây sọ, 31 đôi tủy)', notes: 'Dẫn truyền xung thần kinh cảm giác và vận động.', icon: '🔌' },
            { id: 'n3', text: 'Hệ thần kinh Thực vật (Giao cảm & Phó giao cảm)', notes: 'Điều hòa nhịp tim, tiêu hóa và cân bằng nội môi vô thức.', icon: '⚖️' }
          ]
        },
        {
          id: 'b_respiratory',
          text: 'Hệ Hô Hấp',
          notes: 'Trao đổi khí O2 và CO2 giữa cơ thể và môi trường.',
          icon: '🫁',
          color: '#0284c7',
          children: [
            { id: 'r1', text: 'Đường dẫn khí (Mũi, Hầu, Thanh quản, Khí quản)', notes: 'Lọc bụi, làm ấm và làm ẩm không khí hít vào.', icon: '🌬️' },
            { id: 'r2', text: 'Phổi & Phế nang (300-500 triệu phế nang)', notes: 'Bề mặt trao đổi khí khổng lồ ~70-100m2 nhờ màng phế nang mao mạch.', icon: '🫧' },
            { id: 'r3', text: 'Cơ hô hấp (Cơ hoành & Cơ liên sườn)', notes: 'Cơ hoành là cơ hô hấp chính, hạ xuống khi hít vào.', icon: '💪' }
          ]
        },
        {
          id: 'b_digestive',
          text: 'Hệ Tiêu Hóa',
          notes: 'Biến đổi thức ăn thành dưỡng chất hấp thu qua ruột non.',
          icon: '🍽️',
          color: '#0d9488',
          children: [
            { id: 'd1', text: 'Ống tiêu hóa (Miệng, Thực quản, Dạ dày, Ruột)', notes: 'Dạ dày co bóp cơ học và tiêu hóa protein bằng Pepsin.', icon: '🥣' },
            { id: 'd2', text: 'Tuyến tiêu hóa (Gan, Mật, Tuyến tụy)', notes: 'Gan tiết mật nhũ hóa lipid, Tụy tiết enzym tiêu hóa toàn diện.', icon: '🧪' },
            { id: 'd3', text: 'Ruột non (Hấp thu 90% dưỡng chất)', notes: 'Hệ thống vi nhung mao làm tăng diện tích hấp thu gấp hàng trăm lần.', icon: '🌾' }
          ]
        },
        {
          id: 'b_immune',
          text: 'Hệ Miễn Dịch & Bạch Huyết',
          notes: 'Phòng thủ và tiêu diệt các tác nhân gây bệnh ngoại lai.',
          icon: '🛡️',
          color: '#f59e0b',
          children: [
            { id: 'i1', text: 'Miễn dịch Bẩm sinh (Da, Niêm mạc, Đại thực bào)', notes: 'Hàng rào bảo vệ tức thì, không đặc hiệu.', icon: '🧱' },
            { id: 'i2', text: 'Miễn dịch Thích ứng (Lympho T & Lympho B)', notes: 'Tế bào B tạo kháng thể, tế bào T độc diệt tế bào nhiễm virus.', icon: '🎯' },
            { id: 'i3', text: 'Hạch bạch huyết & Lách', notes: 'Nơi lọc dị vật và tập kết tế bào miễn dịch phản ứng.', icon: '🏰' }
          ]
        }
      ]
    }
  },
  {
    id: 'tpl_study_exam',
    category: 'Học tập & Ôn thi',
    title: 'Kế Hoạch Ôn Thi Hiệu Quả (Get Ready For Exams)',
    desc: 'Lộ trình đếm ngược, chiến lược phân bổ môn, kỹ thuật ghi nhớ và chăm sóc sức khỏe.',
    icon: '📚',
    data: {
      id: 'root',
      text: 'KẾ HOẠCH ÔN THI ĐẠT ĐIỂM TỐI ĐA',
      notes: 'Chiến lược khoa học giúp tối ưu hóa điểm số và loại bỏ áp lực thi cử.',
      icon: '🎓',
      color: '#1e293b',
      children: [
        {
          id: 's_countdown',
          text: 'Thiết Lập Lịch Đếm Ngược',
          notes: 'Tạo cảm giác cấp bách có kiểm soát và ưu tiên môn trọng tâm.',
          icon: '📅',
          color: '#ef4444',
          children: [
            { id: 'sc1', text: 'Đếm ngược số ngày thi từng môn', notes: 'Ghi rõ số buổi học còn lại để không trì hoãn.', icon: '⏳' },
            { id: 'sc2', text: 'Phân tích ma trận đề & Đề cương', notes: 'Xác định các dạng câu hỏi chiếm tỷ trọng điểm cao nhất.', icon: '📊' },
            { id: 'sc3', text: 'Giải đề thi các năm trước', notes: 'Bấm giờ làm bài như thi thật để căn chuẩn thời gian.', icon: '📝' }
          ]
        },
        {
          id: 's_breakdown',
          text: 'Chia Nhỏ Nội Dung Kiến Thức',
          notes: 'Quy tắc "Ăn từng miếng nhỏ" thay vì học dồn vào phút cuối.',
          icon: '🧩',
          color: '#10b981',
          children: [
            { id: 'sb1', text: 'Kỹ thuật Pomodoro (Học 25p - Nghỉ 5p)', notes: 'Giữ sóng não luôn ở trạng thái tỉnh táo, tránh kiệt sức.', icon: '⏱️' },
            { id: 'sb2', text: 'Vẽ sơ đồ tư duy Mind Map', notes: 'Liên kết hình ảnh trực quan giúp nhớ lâu gấp 3 lần chữ thường.', icon: '🗺️' },
            { id: 'sb3', text: 'Kỹ thuật Feynman (Giảng giải cho bạn bè)', notes: 'Nếu giảng lại được cho người khác hiểu là bạn đã nắm chắc bản chất.', icon: '🗣️' }
          ]
        },
        {
          id: 's_health',
          text: 'Chăm Sóc Cơ Thể & Tinh Thần',
          notes: 'Não bộ chỉ hoạt động tối đa khi cơ thể đủ năng lượng.',
          icon: '🏃',
          color: '#3b82f6',
          children: [
            { id: 'sh1', text: 'Ngủ đủ 7 - 8.5 tiếng mỗi đêm', notes: 'Giấc ngủ sâu là giai đoạn não chuyển trí nhớ ngắn hạn thành dài hạn.', icon: '😴' },
            { id: 'sh2', text: 'Uống đủ nước & Thực phẩm bổ não', notes: 'Omega 3, trứng, quả bơ, các loại hạt và tránh đồ ngọt quá mức.', icon: '🥑' },
            { id: 'sh3', text: 'Tập thể dục 20 phút mỗi ngày', notes: 'Tiết Endorphin và Dopamine giúp giải tỏa căng thẳng lập tức.', icon: '🚴' }
          ]
        },
        {
          id: 's_mindset',
          text: 'Tư Duy Tích Cực & Kiểm Soát Stress',
          notes: 'Biến lo âu thành năng lượng hành động tự tin.',
          icon: '🧘',
          color: '#f59e0b',
          children: [
            { id: 'sm1', text: 'Tập thở sâu bụng (Box Breathing 4-4-4-4)', notes: 'Kích hoạt hệ phó giao cảm hạ nhịp tim khi hoảng sợ.', icon: '🫁' },
            { id: 'sm2', text: 'Khẳng định tích cực "Tôi sẽ làm được"', notes: 'Tự tin dựa trên sự chuẩn bị kỹ lưỡng.', icon: '🌟' }
          ]
        }
      ]
    }
  },
  {
    id: 'tpl_marketing_strategy',
    category: 'Kinh doanh & Marketing',
    title: 'Chiến Lược Marketing Toàn Diện (Marketing Strategy)',
    desc: 'Chân dung khách hàng, định vị giá trị, cơ cấu sản phẩm, kênh truyền thông và ngân sách.',
    icon: '📈',
    data: {
      id: 'root',
      text: 'CHIẾN LƯỢC MARKETING (MARKETING STRATEGY)',
      notes: 'Bản đồ kế hoạch tiếp thị và phát triển thị trường tổng thể cho sản phẩm/dịch vụ.',
      icon: '🎯',
      color: '#1e293b',
      children: [
        {
          id: 'm_audience',
          text: 'Khách Hàng Mục Tiêu (Target Audience)',
          notes: 'Ai là người sẵn sàng chi tiền và nhận được giá trị cao nhất?',
          icon: '👥',
          color: '#0284c7',
          children: [
            { id: 'ma1', text: 'Nhân khẩu học (Độ tuổi, Thu nhập, Nghề nghiệp)', notes: 'Xác định chân dung cơ sở.', icon: '🆔' },
            { id: 'ma2', text: 'Hành vi & Thói quen sử dụng', notes: 'Nền tảng thường truy cập, giờ online, phong cách mua sắm.', icon: '📱' },
            { id: 'ma3', text: 'Nỗi đau & Nhu cầu cấp thiết (Pain Points)', notes: 'Vấn đề nhức nhối chưa có giải pháp thỏa đáng.', icon: '💡' }
          ]
        },
        {
          id: 'm_value',
          text: 'Định Vị & Giá Trị Độc Nhất (Value Proposition)',
          notes: 'Lý do khách hàng chọn chúng ta thay vì đối thủ cạnh tranh.',
          icon: '💎',
          color: '#f97316',
          children: [
            { id: 'mv1', text: 'Điểm khác biệt cốt lõi (Differentiation)', notes: 'Tính năng độc quyền, tốc độ, chi phí hoặc trải nghiệm vượt trội.', icon: '⭐' },
            { id: 'mv2', text: 'Lời hứa thương hiệu (Brand Promise)', notes: 'Cam kết chất lượng và sự đồng hành dài hạn.', icon: '🤝' },
            { id: 'mv3', text: 'Giải pháp trọn gói (Complete Solution)', notes: 'Tiết kiệm thời gian và công sức tối đa cho khách hàng.', icon: '📦' }
          ]
        },
        {
          id: 'm_content',
          text: 'Tiếp Thị Nội Dung (Content Marketing)',
          notes: 'Xây dựng lòng tin và dẫn dắt hành trình mua hàng tự nhiên.',
          icon: '🎬',
          color: '#8b5cf6',
          children: [
            { id: 'mc1', text: 'Video ngắn (TikTok, Reels, Shorts)', notes: 'Tiếp cận nhanh, lan truyền mạnh và bắt mắt.', icon: '🎥' },
            { id: 'mc2', text: 'Bài viết chuyên sâu & Case Study (Blogs)', notes: 'Tối ưu SEO và chứng minh năng lực thực tế.', icon: '✍️' },
            { id: 'mc3', text: 'Bản tin & Email Marketing', notes: 'Nuôi dưỡng mối quan hệ và kích hoạt lại khách hàng cũ.', icon: '📬' }
          ]
        },
        {
          id: 'm_channels',
          text: 'Ngân Sách & Kênh Phân Phối (Channels & Budget)',
          notes: 'Phân bổ nguồn lực để đạt ROI cao nhất.',
          icon: '💰',
          color: '#10b981',
          children: [
            { id: 'mch1', text: 'Quảng cáo trả phí (Paid Ads: Meta, Google)', notes: 'Thu hút khách hàng tiềm năng chủ động.', icon: '💳' },
            { id: 'mch2', text: 'Kênh tự nhiên (Organic Social & Cộng đồng)', notes: 'Tạo tệp người theo dõi trung thành bền vững.', icon: '🌱' },
            { id: 'mch3', text: 'Chỉ số đo lường (CAC, LTV, ROAS, Tỷ lệ chuyển đổi)', notes: 'Theo dõi bảng dữ liệu hàng tuần để tối ưu chi phí.', icon: '📊' }
          ]
        }
      ]
    }
  }
]

interface MindMapTabProps {
  currentUser?: any
  showToast?: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function MindMapTab({ currentUser, showToast }: MindMapTabProps) {
  // Trạng thái Sơ đồ hiện tại
  const [currentMindMap, setCurrentMindMap] = useState<MindMapNode>(PRESET_TEMPLATES[0].data)
  const [mindMapTitle, setMindMapTitle] = useState<string>('Hệ Cơ Quan Con Người (The Human Body)')
  const [selectedNodeId, setSelectedNodeId] = useState<string>('root')
  
  // Trạng thái Canvas & Tương tác
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [isDraggingCanvas, setIsDraggingCanvas] = useState<boolean>(false)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [layoutMode, setLayoutMode] = useState<'radial' | 'tree' | 'logic'>('radial')
  const [selectedTheme, setSelectedTheme] = useState<string>('rainbow')
  const [isBlindTestMode, setIsBlindTestMode] = useState<boolean>(false)
  const [revealedNodes, setRevealedNodes] = useState<Record<string, boolean>>({})

  // Modal Điều Khiển Tạo Sơ Đồ Bằng AI
  const [showGenerateModal, setShowGenerateModal] = useState<boolean>(false)
  const [generateMode, setGenerateMode] = useState<'topic' | 'text' | 'file' | 'question' | 'goal'>('topic')
  const [inputText, setInputText] = useState<string>('')
  const [targetDepth, setTargetDepth] = useState<number>(3)
  const [detailLevel, setDetailLevel] = useState<'brief' | 'balanced' | 'deep'>('balanced')
  const [targetAudience, setTargetAudience] = useState<'study' | 'teach' | 'research' | 'plan'>('study')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generationProgress, setGenerationProgress] = useState<string>('')
  const [uploadedFileName, setUploadedFileName] = useState<string>('')

  // Trợ lý AI trên Node
  const [showNodeAiModal, setShowNodeAiModal] = useState<boolean>(false)
  const [aiAssistantResult, setAiAssistantResult] = useState<any>(null)
  const [isAssistantLoading, setIsAssistantLoading] = useState<boolean>(false)

  // Bộ công cụ Học tập (Flashcards & Quizzes)
  const [showStudyModal, setShowStudyModal] = useState<boolean>(false)
  const [studyToolType, setStudyToolType] = useState<'flashcard' | 'quiz' | 'summary'>('flashcard')
  const [studyData, setStudyData] = useState<any>(null)
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState<number>(0)
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false)
  const [quizUserAnswers, setQuizUserAnswers] = useState<Record<number, string>>({})
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false)

  // Quản lý Thư viện Sơ đồ
  const [showLibraryModal, setShowLibraryModal] = useState<boolean>(false)
  const [savedMindMaps, setSavedMindMaps] = useState<{ id: string; title: string; updatedAt: string; nodeCount: number; data: MindMapNode }[]>([])
  const [searchLibraryQuery, setSearchLibraryQuery] = useState<string>('')

  // Chỉnh sửa Node trực tiếp
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null)
  const [editingNodeText, setEditingNodeText] = useState<string>('')
  const [editingNodeNotes, setEditingNodeNotes] = useState<string>('')

  const canvasRef = useRef<SVGSVGElement | null>(null)

  // Nạp kho sơ đồ đã lưu từ LocalStorage khi khởi động
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dzota_saved_mindmaps')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) setSavedMindMaps(parsed)
      }
    } catch (e) {}
  }, [])

  // Lưu sơ đồ vào kho lưu trữ
  const handleSaveToLibrary = () => {
    const nodeCount = countNodes(currentMindMap)
    const newEntry = {
      id: 'mm_' + Date.now(),
      title: mindMapTitle,
      updatedAt: new Date().toLocaleString('vi-VN'),
      nodeCount,
      data: currentMindMap
    }
    const updated = [newEntry, ...savedMindMaps.filter(m => m.title !== mindMapTitle)]
    setSavedMindMaps(updated)
    try {
      localStorage.setItem('dzota_saved_mindmaps', JSON.stringify(updated))
      showToast?.('Đã lưu sơ đồ vào Thư viện cá nhân thành công!', 'success')
    } catch (e) {
      showToast?.('Không thể lưu sơ đồ vào bộ nhớ máy.', 'error')
    }
  }

  // Đếm tổng số node trong cây
  const countNodes = (node: MindMapNode): number => {
    return 1 + (node.children || []).reduce((acc, c) => acc + countNodes(c), 0)
  }

  // Tìm node theo ID
  const findNodeById = (root: MindMapNode, id: string): MindMapNode | null => {
    if (root.id === id) return root
    if (root.children) {
      for (const child of root.children) {
        const found = findNodeById(child, id)
        if (found) return found
      }
    }
    return null
  }

  // Cập nhật một node trong cây
  const updateNodeInTree = (root: MindMapNode, targetId: string, updater: (n: MindMapNode) => MindMapNode): MindMapNode => {
    if (root.id === targetId) return updater(root)
    if (!root.children) return root
    return {
      ...root,
      children: root.children.map(c => updateNodeInTree(c, targetId, updater))
    }
  }

  // Thêm nhánh con vào node được chọn
  const handleAddChildNode = (parentId: string) => {
    const newNode: MindMapNode = {
      id: 'node_' + Math.random().toString(36).substring(2, 9),
      text: 'Ý mới',
      notes: '',
      icon: '💡',
      color: '#3b82f6',
      children: []
    }
    setCurrentMindMap(prev => updateNodeInTree(prev, parentId, p => ({
      ...p,
      isCollapsed: false,
      children: [...(p.children || []), newNode]
    })))
    setSelectedNodeId(newNode.id)
    showToast?.('Đã thêm nhánh con mới! Nhấp đúp để chỉnh sửa.', 'info')
  }

  // Thêm nhánh ngang hàng
  const handleAddSiblingNode = (targetId: string) => {
    if (targetId === currentMindMap.id) {
      showToast?.('Không thể thêm nhánh ngang hàng cho Chủ đề trung tâm.', 'warning')
      return
    }
    const newNode: MindMapNode = {
      id: 'node_' + Math.random().toString(36).substring(2, 9),
      text: 'Nhánh mới',
      notes: '',
      icon: '📌',
      color: '#0d9488',
      children: []
    }
    const addSiblingRecursive = (parent: MindMapNode): MindMapNode => {
      if (!parent.children) return parent
      const idx = parent.children.findIndex(c => c.id === targetId)
      if (idx !== -1) {
        const nextChildren = [...parent.children]
        nextChildren.splice(idx + 1, 0, newNode)
        return { ...parent, children: nextChildren }
      }
      return {
        ...parent,
        children: parent.children.map(c => addSiblingRecursive(c))
      }
    }
    setCurrentMindMap(prev => addSiblingRecursive(prev))
    setSelectedNodeId(newNode.id)
  }

  // Xóa node
  const handleDeleteNode = (nodeId: string) => {
    if (nodeId === currentMindMap.id) {
      showToast?.('Không thể xóa Chủ đề trung tâm của sơ đồ.', 'warning')
      return
    }
    const deleteRecursive = (parent: MindMapNode): MindMapNode => {
      if (!parent.children) return parent
      return {
        ...parent,
        children: parent.children.filter(c => c.id !== nodeId).map(c => deleteRecursive(c))
      }
    }
    setCurrentMindMap(prev => deleteRecursive(prev))
    setSelectedNodeId(currentMindMap.id)
    showToast?.('Đã xóa nhánh thành công.', 'info')
  }

  // Thu gọn / Mở rộng nhánh
  const handleToggleCollapse = (nodeId: string) => {
    setCurrentMindMap(prev => updateNodeInTree(prev, nodeId, n => ({
      ...n,
      isCollapsed: !n.isCollapsed
    })))
  }

  // Đọc tệp PDF / DOCX / TXT / Image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadedFileName(file.name)

    if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setInputText(content)
        showToast?.(`Đã đọc nội dung tệp: ${file.name}`, 'success')
      }
      reader.readAsText(file)
    } else {
      // Đối với PDF / DOCX / Ảnh, cho biết đã tải tệp và đọc tên tệp / nội dung
      setInputText(`[TÀI LIỆU TẢI LÊN: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]\nHãy đọc và cấu trúc hóa toàn diện kiến thức của tài liệu này thành Sơ đồ tư duy.`)
      showToast?.(`Đã tải tệp ${file.name}. AI sẽ xử lý khi bấm Tạo sơ đồ.`, 'info')
    }
  }

  // Gọi API Tạo Sơ Đồ Bằng AI
  const handleGenerateMindMap = async () => {
    if (!inputText.trim()) {
      showToast?.('Vui lòng nhập chủ đề hoặc dán văn bản để AI tạo sơ đồ.', 'warning')
      return
    }

    setIsGenerating(true)
    setGenerationProgress('AI Gemini đang đọc tài liệu & phân tích kiến trúc ý tưởng...')

    try {
      const res = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: generateMode,
          input: inputText,
          depth: targetDepth,
          detail: detailLevel,
          audience: targetAudience,
          theme: selectedTheme,
          layout: layoutMode
        })
      })

      const resData = await res.json()
      if (resData.success && resData.data) {
        setCurrentMindMap(resData.data)
        setMindMapTitle(resData.data.text || inputText.slice(0, 40))
        setSelectedNodeId(resData.data.id || 'root')
        setShowGenerateModal(false)
        setInputText('')
        setUploadedFileName('')
        setPanOffset({ x: 0, y: 0 })
        setZoomLevel(1)
        showToast?.('Đã tạo sơ đồ tư duy bằng AI thành công!', 'success')
      } else {
        showToast?.(resData.error || 'Không thể tạo sơ đồ. Vui lòng thử lại.', 'error')
      }
    } catch (e: any) {
      showToast?.('Lỗi kết nối máy chủ AI: ' + e.message, 'error')
    } finally {
      setIsGenerating(false)
      setGenerationProgress('')
    }
  }

  // Trợ lý AI trên từng nhánh
  const handleCallNodeAiAssistant = async (action: 'expand' | 'explain' | 'example' | 'quiz') => {
    const selectedNode = findNodeById(currentMindMap, selectedNodeId)
    if (!selectedNode) return

    setIsAssistantLoading(true)
    try {
      if (action === 'expand') {
        const res = await fetch('/api/mindmap/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'expand_node',
            input: selectedNode.text,
            targetNode: { id: selectedNode.id, text: selectedNode.text, notes: selectedNode.notes, context: mindMapTitle },
            theme: selectedTheme
          })
        })
        const resData = await res.json()
        if (resData.success && Array.isArray(resData.data)) {
          setCurrentMindMap(prev => updateNodeInTree(prev, selectedNode.id, p => ({
            ...p,
            isCollapsed: false,
            children: [...(p.children || []), ...resData.data]
          })))
          showToast?.(`Đã mở rộng thêm ${resData.data.length} nhánh con mới bằng AI!`, 'success')
        }
      } else if (action === 'explain') {
        const res = await fetch('/api/mindmap/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'explain_node',
            input: selectedNode.text,
            targetNode: { id: selectedNode.id, text: selectedNode.text, notes: selectedNode.notes }
          })
        })
        const resData = await res.json()
        if (resData.success && resData.data) {
          setAiAssistantResult(resData.data)
          setShowNodeAiModal(true)
        }
      } else if (action === 'quiz') {
        handleOpenStudyTool('quiz', selectedNode.text)
      }
    } catch (err: any) {
      showToast?.('Lỗi trợ lý AI: ' + err.message, 'error')
    } finally {
      setIsAssistantLoading(false)
    }
  }

  // Mở bộ công cụ học tập (Flashcards, Quizzes, Summary)
  const handleOpenStudyTool = async (type: 'flashcard' | 'quiz' | 'summary', scopeText?: string) => {
    setStudyToolType(type)
    setShowStudyModal(true)
    setStudyData(null)
    setCurrentFlashcardIdx(0)
    setIsCardFlipped(false)
    setQuizUserAnswers({})
    setQuizSubmitted(false)

    const textToAnalyze = scopeText || mindMapTitle + ':\n' + serializeTreeToText(currentMindMap)

    try {
      const mode = type === 'flashcard' ? 'create_flashcards' : type === 'quiz' ? 'create_quiz' : 'create_summary'
      const res = await fetch('/api/mindmap/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          input: textToAnalyze
        })
      })
      const resData = await res.json()
      if (resData.success && resData.data) {
        setStudyData(resData.data)
      }
    } catch (e: any) {
      showToast?.('Không thể tải công cụ học tập: ' + e.message, 'error')
    }
  }

  // Chuyển cây thành văn bản Markdown
  const serializeTreeToText = (node: MindMapNode, depth = 0): string => {
    const indent = '  '.repeat(depth)
    let res = `${indent}- ${node.text}${node.notes ? ` (${node.notes})` : ''}\n`
    if (node.children) {
      for (const child of node.children) {
        res += serializeTreeToText(child, depth + 1)
      }
    }
    return res
  }

  // Xuất file PNG
  const handleExportPNG = () => {
    if (!canvasRef.current) return
    try {
      const svgElement = canvasRef.current
      const svgString = new XMLSerializer().serializeToString(svgElement)
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      const URLObj = window.URL || window.webkitURL || window
      const blobURL = URLObj.createObjectURL(svgBlob)

      const image = new Image()
      image.onload = () => {
        const canvas = document.createElement('canvas')
        const bbox = svgElement.getBBox()
        canvas.width = Math.max(1200, bbox.width + 120) * 2 // 2x HD retina
        canvas.height = Math.max(800, bbox.height + 120) * 2
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.scale(2, 2)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.drawImage(image, 60, 60)
          const pngURL = canvas.toDataURL('image/png')
          const downloadLink = document.createElement('a')
          downloadLink.download = `${mindMapTitle || 'Dzota-MindMap'}.png`
          downloadLink.href = pngURL
          downloadLink.click()
          showToast?.('Đã xuất ảnh PNG HD thành công!', 'success')
        }
      }
      image.src = blobURL
    } catch (e: any) {
      showToast?.('Lỗi xuất ảnh PNG: ' + e.message, 'error')
    }
  }

  // Xuất file SVG
  const handleExportSVG = () => {
    if (!canvasRef.current) return
    const svgString = new XMLSerializer().serializeToString(canvasRef.current)
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mindMapTitle || 'Dzota-MindMap'}.svg`
    a.click()
    showToast?.('Đã xuất file vector SVG thành công!', 'success')
  }

  // Xuất file Markdown
  const handleExportMarkdown = () => {
    const md = `# ${mindMapTitle}\n\n` + serializeTreeToText(currentMindMap)
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mindMapTitle || 'Dzota-MindMap'}.md`
    a.click()
    showToast?.('Đã xuất dàn ý Markdown thành công!', 'success')
  }

  // Xuất JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(currentMindMap, null, 2)
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${mindMapTitle || 'Dzota-MindMap'}.json`
    a.click()
    showToast?.('Đã xuất file dữ liệu JSON thành công!', 'success')
  }

  // Thuật toán tính toán tọa độ Layout (Radial / Tree / Logic)
  const layoutedNodes = useMemo(() => {
    const nodes: (MindMapNode & { x: number; y: number; level: number; parentX?: number; parentY?: number; side?: 'left' | 'right' })[] = []
    const connections: { fromX: number; fromY: number; toX: number; toY: number; color: string }[] = []

    const centerX = 0
    const centerY = 0

    // Root node
    nodes.push({
      ...currentMindMap,
      x: centerX,
      y: centerY,
      level: 0
    })

    if (!currentMindMap.children || currentMindMap.children.length === 0) {
      return { nodes, connections }
    }

    const currentPalette = COLOR_THEMES.find(t => t.id === selectedTheme)?.colors || COLOR_THEMES[0].colors

    if (layoutMode === 'radial') {
      // Hướng tâm tỏa đều 2 phía Trái / Phải
      const children = currentMindMap.children
      const mid = Math.ceil(children.length / 2)
      const rightChildren = children.slice(0, mid)
      const leftChildren = children.slice(mid)

      // Xếp nhánh phải
      const layoutSide = (sideChildren: MindMapNode[], side: 'left' | 'right') => {
        const sideDir = side === 'right' ? 1 : -1
        const totalCount = sideChildren.length
        const verticalSpacing = 110

        sideChildren.forEach((branch, bIdx) => {
          const branchY = centerY + (bIdx - (totalCount - 1) / 2) * verticalSpacing
          const branchX = centerX + sideDir * 280
          const branchColor = branch.color || currentPalette[bIdx % currentPalette.length]

          nodes.push({
            ...branch,
            x: branchX,
            y: branchY,
            level: 1,
            color: branchColor,
            side,
            parentX: centerX,
            parentY: centerY
          })

          connections.push({
            fromX: centerX,
            fromY: centerY,
            toX: branchX,
            toY: branchY,
            color: branchColor
          })

          // Xếp các nhánh con cấp 2 nếu không bị thu gọn
          if (!branch.isCollapsed && branch.children && branch.children.length > 0) {
            const subCount = branch.children.length
            const subSpacing = 65
            branch.children.forEach((sub, sIdx) => {
              const subY = branchY + (sIdx - (subCount - 1) / 2) * subSpacing
              const subX = branchX + sideDir * 240
              nodes.push({
                ...sub,
                x: subX,
                y: subY,
                level: 2,
                color: branchColor,
                side,
                parentX: branchX,
                parentY: branchY
              })
              connections.push({
                fromX: branchX,
                fromY: branchY,
                toX: subX,
                toY: subY,
                color: branchColor
              })
            })
          }
        })
      }

      layoutSide(rightChildren, 'right')
      layoutSide(leftChildren, 'left')
    } else {
      // Dạng cây Tree (Trái sang Phải)
      const children = currentMindMap.children
      const totalCount = children.length
      const verticalSpacing = 120

      children.forEach((branch, bIdx) => {
        const branchY = centerY + (bIdx - (totalCount - 1) / 2) * verticalSpacing
        const branchX = centerX + 260
        const branchColor = branch.color || currentPalette[bIdx % currentPalette.length]

        nodes.push({
          ...branch,
          x: branchX,
          y: branchY,
          level: 1,
          color: branchColor,
          parentX: centerX,
          parentY: centerY
        })

        connections.push({
          fromX: centerX,
          fromY: centerY,
          toX: branchX,
          toY: branchY,
          color: branchColor
        })

        if (!branch.isCollapsed && branch.children && branch.children.length > 0) {
          const subCount = branch.children.length
          const subSpacing = 60
          branch.children.forEach((sub, sIdx) => {
            const subY = branchY + (sIdx - (subCount - 1) / 2) * subSpacing
            const subX = branchX + 240
            nodes.push({
              ...sub,
              x: subX,
              y: subY,
              level: 2,
              color: branchColor,
              parentX: branchX,
              parentY: branchY
            })
            connections.push({
              fromX: branchX,
              fromY: branchY,
              toX: subX,
              toY: subY,
              color: branchColor
            })
          })
        }
      })
    }

    return { nodes, connections }
  }, [currentMindMap, layoutMode, selectedTheme])

  const selectedNode = useMemo(() => {
    return findNodeById(currentMindMap, selectedNodeId)
  }, [currentMindMap, selectedNodeId])

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-slate-900 text-slate-100 overflow-hidden select-none font-sans relative">
      {/* 1. TOP HEADER & TOOLBAR */}
      <header className="h-15 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-4 flex items-center justify-between z-30 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0">
            <Network size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={mindMapTitle}
                onChange={e => setMindMapTitle(e.target.value)}
                className="bg-transparent border-none text-sm sm:text-base font-extrabold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 max-w-[220px] sm:max-w-md truncate"
                placeholder="Tên sơ đồ tư duy..."
              />
              <span className="text-[10px] bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider hidden sm:inline-block">
                AI SaaS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate">
              {countNodes(currentMindMap)} nhánh • Bố cục {layoutMode === 'radial' ? 'Hướng tâm' : 'Dạng cây'}
            </p>
          </div>
        </div>

        {/* Nút hành động chính */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Nút Tạo Sơ Đồ Bằng AI */}
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
          >
            <Sparkles size={16} className="text-yellow-300 animate-pulse" />
            <span>Tạo bằng AI</span>
          </button>

          {/* Mẫu có sẵn */}
          <button
            onClick={() => {
              const nextTpl = PRESET_TEMPLATES[(PRESET_TEMPLATES.findIndex(t => t.title === mindMapTitle) + 1) % PRESET_TEMPLATES.length]
              setCurrentMindMap(nextTpl.data)
              setMindMapTitle(nextTpl.title)
              setSelectedNodeId('root')
              showToast?.(`Đã tải mẫu: ${nextTpl.title}`, 'info')
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer"
            title="Chuyển đổi giữa các mẫu chuyên nghiệp có sẵn"
          >
            <Layers size={15} className="text-indigo-400" />
            <span>Mẫu có sẵn</span>
          </button>

          {/* Công cụ Học tập (Flashcard & Trắc nghiệm) */}
          <button
            onClick={() => handleOpenStudyTool('flashcard')}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
            title="Chuyển sơ đồ thành Flashcard và Đề trắc nghiệm ôn thi"
          >
            <GraduationCap size={16} />
            <span className="hidden sm:inline">Ôn tập & Đề thi</span>
          </button>

          {/* Lưu sơ đồ */}
          <button
            onClick={handleSaveToLibrary}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            title="Lưu vào Thư viện cá nhân"
          >
            <Save size={16} className="text-emerald-400" />
            <span className="hidden sm:inline">Lưu</span>
          </button>

          {/* Thư viện */}
          <button
            onClick={() => setShowLibraryModal(true)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1.5"
            title="Xem kho sơ đồ của tôi"
          >
            <FolderOpen size={16} className="text-blue-400" />
            <span className="hidden sm:inline">Kho ({savedMindMaps.length})</span>
          </button>

          {/* Xuất file */}
          <div className="relative group">
            <button
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition cursor-pointer flex items-center gap-1"
              title="Xuất file PNG, SVG, Markdown"
            >
              <Download size={16} className="text-cyan-400" />
              <span className="hidden sm:inline">Xuất</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 hidden group-hover:block z-50 animate-pop-in">
              <button onClick={handleExportPNG} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2">
                <span>🖼️</span> Xuất ảnh PNG HD
              </button>
              <button onClick={handleExportSVG} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2">
                <span>📐</span> Xuất Vector SVG
              </button>
              <button onClick={handleExportMarkdown} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2">
                <span>📄</span> Xuất dàn ý Markdown
              </button>
              <button onClick={handleExportJSON} className="w-full text-left px-3 py-2 text-xs font-bold text-slate-200 hover:bg-slate-800 rounded-xl flex items-center gap-2">
                <span>💾</span> Sao lưu file JSON
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 2. SUB-BAR: BỘ ĐIỀU KHIỂN BỐ CỤC & MÀU SẮC */}
      <div className="h-11 bg-slate-950/60 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300 z-20 overflow-x-auto">
        <div className="flex items-center gap-3">
          {/* Kiểu bố cục */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setLayoutMode('radial')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${layoutMode === 'radial' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              🌟 Hướng tâm (Radial)
            </button>
            <button
              onClick={() => setLayoutMode('tree')}
              className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${layoutMode === 'tree' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              🌿 Dạng cây (Tree)
            </button>
          </div>

          {/* Bảng màu chủ đề */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 hidden sm:inline">Bộ màu:</span>
            <div className="flex items-center gap-1">
              {COLOR_THEMES.map(th => (
                <button
                  key={th.id}
                  onClick={() => setSelectedTheme(th.id)}
                  className={`w-5 h-5 rounded-full border-2 transition transform ${selectedTheme === th.id ? 'scale-125 border-white ring-2 ring-blue-500' : 'border-transparent opacity-70 hover:opacity-100'}`}
                  style={{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})` }}
                  title={th.name}
                />
              ))}
            </div>
          </div>

          {/* Chế độ Tự kiểm tra (Blind Test) */}
          <button
            onClick={() => {
              setIsBlindTestMode(!isBlindTestMode)
              setRevealedNodes({})
              showToast?.(isBlindTestMode ? 'Đã tắt chế độ Tự kiểm tra.' : 'Chế độ Tự kiểm tra: Chạm vào nhánh con để lật mở đáp án!', 'info')
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${isBlindTestMode ? 'bg-purple-600/30 text-purple-300 border-purple-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'}`}
          >
            {isBlindTestMode ? <EyeOff size={13} /> : <Eye size={13} />}
            <span>Tự kiểm tra {isBlindTestMode ? '(Đang bật)' : ''}</span>
          </button>
        </div>

        {/* Nút thao tác nhanh trên node được chọn */}
        {selectedNode && (
          <div className="flex items-center gap-1.5 animate-fade-in">
            <span className="text-[11px] text-slate-400 hidden md:inline">Đang chọn: <strong>{selectedNode.text}</strong></span>
            <button
              onClick={() => handleAddChildNode(selectedNode.id)}
              className="px-2 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-bold flex items-center gap-1"
              title="Thêm nhánh con (Tab)"
            >
              <Plus size={12} /> Nhánh con
            </button>
            <button
              onClick={() => handleAddSiblingNode(selectedNode.id)}
              className="px-2 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1"
              title="Thêm nhánh ngang hàng (Enter)"
            >
              <Plus size={12} /> Ngang hàng
            </button>
            <button
              onClick={() => handleCallNodeAiAssistant('expand')}
              className="px-2 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1"
              title="Yêu cầu AI mở rộng nhánh này"
            >
              <Wand2 size={12} /> AI Mở rộng
            </button>
            <button
              onClick={() => handleCallNodeAiAssistant('explain')}
              className="px-2 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/30 text-[11px] font-bold flex items-center gap-1"
              title="Yêu cầu AI giải thích bản chất nhánh này"
            >
              <HelpCircle size={12} /> AI Giải thích
            </button>
            <button
              onClick={() => handleDeleteNode(selectedNode.id)}
              className="p-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 text-[11px]"
              title="Xóa nhánh này"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* 3. MAIN INTERACTIVE SVG CANVAS */}
      <div
        className="flex-1 w-full h-full relative overflow-hidden cursor-grab active:cursor-grabbing bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]"
        onMouseDown={e => {
          if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-bg') {
            setIsDraggingCanvas(true)
            setDragStartPos({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
          }
        }}
        onMouseMove={e => {
          if (isDraggingCanvas) {
            setPanOffset({ x: e.clientX - dragStartPos.x, y: e.clientY - dragStartPos.y })
          }
        }}
        onMouseUp={() => setIsDraggingCanvas(false)}
        onMouseLeave={() => setIsDraggingCanvas(false)}
      >
        <svg
          ref={canvasRef}
          id="canvas-bg"
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        >
          <defs>
            <linearGradient id="root-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="shadow-node" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.4" />
            </filter>
            <filter id="glow-selected" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#3b82f6" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* Vùng canvas có thể Zoom & Pan */}
          <g transform={`translate(${window.innerWidth / 2 + panOffset.x}, ${window.innerHeight / 2 - 40 + panOffset.y}) scale(${zoomLevel})`}>
            {/* Vẽ các đường nối cong Bezier mượt mà */}
            {layoutedNodes.connections.map((conn, idx) => {
              const dx = conn.toX - conn.fromX
              const cpx1 = conn.fromX + dx * 0.5
              const cpy1 = conn.fromY
              const cpx2 = conn.fromX + dx * 0.5
              const cpy2 = conn.toY

              const pathData = `M ${conn.fromX} ${conn.fromY} C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${conn.toX} ${conn.toY}`

              return (
                <path
                  key={`conn_${idx}`}
                  d={pathData}
                  fill="none"
                  stroke={conn.color}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  opacity="0.75"
                />
              )
            })}

            {/* Vẽ các Nút (Nodes) */}
            {layoutedNodes.nodes.map(node => {
              const isSelected = selectedNodeId === node.id
              const isRoot = node.level === 0
              const isHiddenInBlindTest = isBlindTestMode && !isRoot && !revealedNodes[node.id]
              const nodeText = isHiddenInBlindTest ? '??? (Chạm để xem)' : node.text
              const nodeWidth = isRoot ? 240 : Math.min(220, Math.max(140, nodeText.length * 9 + 40))
              const nodeHeight = isRoot ? 64 : 44

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x - nodeWidth / 2}, ${node.y - nodeHeight / 2})`}
                  className="cursor-pointer transition-transform duration-100 hover:scale-105"
                  onClick={e => {
                    e.stopPropagation()
                    setSelectedNodeId(node.id)
                    if (isHiddenInBlindTest) {
                      setRevealedNodes(prev => ({ ...prev, [node.id]: true }))
                    }
                  }}
                  onDoubleClick={e => {
                    e.stopPropagation()
                    setEditingNodeId(node.id)
                    setEditingNodeText(node.text)
                    setEditingNodeNotes(node.notes || '')
                  }}
                >
                  {/* Khung nút */}
                  <rect
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={isRoot ? 22 : 16}
                    fill={isRoot ? 'url(#root-grad)' : isHiddenInBlindTest ? '#334155' : '#0f172a'}
                    stroke={isSelected ? '#60a5fa' : node.color || '#3b82f6'}
                    strokeWidth={isSelected ? 3.5 : 2}
                    filter={isSelected ? 'url(#glow-selected)' : 'url(#shadow-node)'}
                  />

                  {/* Icon & Văn bản */}
                  <text
                    x={20}
                    y={isRoot ? 38 : 28}
                    fill="#ffffff"
                    fontSize={isRoot ? 15 : 13}
                    fontWeight={isRoot ? 'bold' : '600'}
                    fontFamily="Inter, sans-serif"
                  >
                    {node.icon ? `${node.icon} ` : ''}
                    {nodeText.length > 22 ? nodeText.slice(0, 20) + '...' : nodeText}
                  </text>

                  {/* Badge thu gọn nếu có nhánh con */}
                  {node.children && node.children.length > 0 && !isRoot && (
                    <g
                      transform={`translate(${nodeWidth - 12}, ${nodeHeight / 2})`}
                      onClick={e => {
                        e.stopPropagation()
                        handleToggleCollapse(node.id)
                      }}
                    >
                      <circle r="10" fill={node.color || '#3b82f6'} stroke="#ffffff" strokeWidth="1.5" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                        {node.isCollapsed ? `+${node.children.length}` : '−'}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* Floating Controls góc dưới bên phải Canvas */}
        <div className="absolute bottom-5 right-5 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-2 rounded-2xl border border-slate-800 shadow-2xl z-20">
          <button
            onClick={() => setZoomLevel(prev => Math.min(2, prev + 0.15))}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Phóng to (+)"
          >
            <ZoomIn size={18} />
          </button>
          <span className="text-xs font-mono font-bold text-slate-400 w-12 text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.4, prev - 0.15))}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Thu nhỏ (-)"
          >
            <ZoomOut size={18} />
          </button>
          <button
            onClick={() => {
              setZoomLevel(1)
              setPanOffset({ x: 0, y: 0 })
            }}
            className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
            title="Căn giữa màn hình"
          >
            <RotateCcw size={18} />
          </button>
        </div>

        {/* Hướng dẫn phím tắt nhanh góc dưới bên trái */}
        <div className="absolute bottom-5 left-5 hidden lg:flex items-center gap-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800/80 text-[11px] text-slate-400 z-20 pointer-events-none">
          <span>💡 <strong>Tab:</strong> Thêm nhánh con</span>
          <span>•</span>
          <span><strong>Enter:</strong> Thêm nhánh ngang hàng</span>
          <span>•</span>
          <span><strong>Nhấp đúp:</strong> Sửa chữ</span>
          <span>•</span>
          <span><strong>Kéo chuột:</strong> Di chuyển canvas</span>
        </div>
      </div>

      {/* 4. MODAL: TẠO SƠ ĐỒ BẰNG AI (GEMINI ENGINE) */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Tạo Sơ Đồ Tư Duy Bằng AI</h3>
                  <p className="text-xs text-slate-400">Gemini AI tự động phân tích kiến thức, bóc tách cấu trúc và vẽ sơ đồ</p>
                </div>
              </div>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto flex-1">
              {/* Chọn nguồn dữ liệu */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">1. Chọn Nguồn Dữ Liệu</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'topic', label: 'Chủ đề', icon: '📌' },
                    { id: 'text', label: 'Văn bản dài', icon: '📝' },
                    { id: 'file', label: 'Tệp PDF/Word', icon: '📄' },
                    { id: 'question', label: 'Câu hỏi thi', icon: '❓' },
                    { id: 'goal', label: 'Mục tiêu học', icon: '🎯' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setGenerateMode(tab.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition ${generateMode === tab.id ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-500/25' : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:bg-slate-800'}`}
                    >
                      <span className="text-base">{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ô nhập nội dung */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    {generateMode === 'topic' ? 'Tên chủ đề cần lập sơ đồ' : generateMode === 'file' ? 'Tải tệp hoặc dán tài liệu' : 'Nội dung kiến thức / câu hỏi'}
                  </label>
                  {generateMode === 'topic' && (
                    <div className="flex items-center gap-1 text-[11px] text-blue-400">
                      <span>Gợi ý:</span>
                      <button onClick={() => setInputText('Cơ chế tác dụng của các nhóm Kháng sinh trong Vi sinh y học')} className="hover:underline">Kháng sinh</button>
                      <span>•</span>
                      <button onClick={() => setInputText('Chu trình Krebs và Chuỗi truyền điện tử tế bào')} className="hover:underline">Chu trình Krebs</button>
                    </div>
                  )}
                </div>

                {generateMode === 'file' ? (
                  <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-6 text-center bg-slate-950/40 transition">
                    <Upload size={32} className="mx-auto text-blue-400 mb-2" />
                    <p className="text-sm font-bold text-slate-200">Kéo thả hoặc chọn tệp từ thiết bị</p>
                    <p className="text-xs text-slate-400 mt-1">Hỗ trợ PDF, DOCX (Word), TXT, Markdown, Hình ảnh trang sách (OCR)</p>
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md,image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="mindmap-file-input"
                    />
                    <label
                      htmlFor="mindmap-file-input"
                      className="inline-block mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer transition"
                    >
                      Chọn Tệp
                    </label>
                    {uploadedFileName && (
                      <p className="mt-2 text-xs font-bold text-emerald-400">✓ Đã chọn: {uploadedFileName}</p>
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={generateMode === 'topic' ? 3 : 6}
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={
                      generateMode === 'topic'
                        ? 'Ví dụ: Cấu trúc hệ thần kinh trung ương và các chất dẫn truyền...'
                        : 'Dán đoạn văn bản bài giảng, đề cương hoặc câu hỏi vào đây...'
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </div>

              {/* Tùy chỉnh tham số nâng cao */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
                {/* Độ sâu */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Độ sâu sơ đồ</label>
                  <select
                    value={targetDepth}
                    onChange={e => setTargetDepth(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-bold focus:outline-none"
                  >
                    <option value={2}>2 cấp nhánh (Ôn nhanh cơ bản)</option>
                    <option value={3}>3 cấp nhánh (Chuẩn kiến thức)</option>
                    <option value={4}>4 cấp nhánh (Chuyên sâu đầy đủ)</option>
                    <option value={5}>5 cấp nhánh (Cực kỳ toàn diện)</option>
                  </select>
                </div>

                {/* Độ chi tiết */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Mức độ chi tiết</label>
                  <select
                    value={detailLevel}
                    onChange={e => setDetailLevel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-bold focus:outline-none"
                  >
                    <option value="brief">Ngắn gọn (Dễ thuộc)</option>
                    <option value="balanced">Cân bằng lý thuyết</option>
                    <option value="deep">Rất chi tiết (Kèm cơ chế)</option>
                  </select>
                </div>

                {/* Mục đích sử dụng */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Mục đích học tập</label>
                  <select
                    value={targetAudience}
                    onChange={e => setTargetAudience(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 font-bold focus:outline-none"
                  >
                    <option value="study">Học tập & Ôn thi đại học</option>
                    <option value="research">Nghiên cứu y khoa / Khoa học</option>
                    <option value="teach">Giảng dạy & Bài giảng</option>
                    <option value="plan">Lập kế hoạch & Chiến lược</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {isGenerating ? generationProgress : 'Gemini AI Pro 2.5 • Tối ưu 100% Tiếng Việt'}
              </span>
              <button
                onClick={handleGenerateMindMap}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-60"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang suy luận...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    <span>Bắt Đầu Vẽ Sơ Đồ</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODAL: CHỈNH SỬA NODE TRỰC TIẾP */}
      {editingNodeId && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Edit3 size={16} className="text-blue-400" />
              Chỉnh Sửa Nhánh Kiến Thức
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Tên nhánh (Ngắn gọn)</label>
                <input
                  type="text"
                  value={editingNodeText}
                  onChange={e => setEditingNodeText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Ghi chú chi tiết / Định nghĩa</label>
                <textarea
                  rows={3}
                  value={editingNodeNotes}
                  onChange={e => setEditingNodeNotes(e.target.value)}
                  placeholder="Thêm mô tả, công thức, bản chất..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingNodeId(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setCurrentMindMap(prev => updateNodeInTree(prev, editingNodeId, n => ({
                    ...n,
                    text: editingNodeText,
                    notes: editingNodeNotes
                  })))
                  setEditingNodeId(null)
                  showToast?.('Đã lưu nội dung nhánh!', 'success')
                }}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: TRỢ LÝ AI GIẢI THÍCH NHÁNH */}
      {showNodeAiModal && aiAssistantResult && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lightbulb size={20} className="text-yellow-400" />
                <h3 className="font-extrabold text-white text-sm">AI Giải Thích Bản Chất</h3>
              </div>
              <button onClick={() => setShowNodeAiModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <div className="py-4 space-y-3 text-xs leading-relaxed text-slate-200">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                <span className="font-bold text-blue-400 block mb-1">📖 Bản chất khoa học:</span>
                <p>{aiAssistantResult.explanation}</p>
              </div>
              {aiAssistantResult.analogy && (
                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80">
                  <span className="font-bold text-emerald-400 block mb-1">💡 Liên tưởng thực tế dễ nhớ:</span>
                  <p>{aiAssistantResult.analogy}</p>
                </div>
              )}
              {aiAssistantResult.mnemonics && (
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30 text-amber-200">
                  <span className="font-bold text-amber-400 block mb-1">⚡ Khẩu quyết / Thần chú nhớ nhanh:</span>
                  <p>{aiAssistantResult.mnemonics}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowNodeAiModal(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. MODAL: BỘ CÔNG CỤ HỌC TẬP (FLASHCARDS & QUẢN LÝ ĐỀ THI) */}
      {showStudyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {studyToolType === 'flashcard' ? 'Thẻ Ghi Nhớ Flashcards' : 'Bộ Đề Trắc Nghiệm Ôn Tập'}
                  </h3>
                  <p className="text-xs text-slate-400">Tự động sinh từ kiến thức sơ đồ tư duy {mindMapTitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => handleOpenStudyTool('flashcard')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${studyToolType === 'flashcard' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    🃏 Flashcard
                  </button>
                  <button
                    onClick={() => handleOpenStudyTool('quiz')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${studyToolType === 'quiz' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    📝 Trắc nghiệm
                  </button>
                </div>
                <button onClick={() => setShowStudyModal(false)} className="text-slate-400 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="py-6 flex-1 overflow-y-auto">
              {!studyData ? (
                <div className="py-16 text-center">
                  <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-300">AI đang phân tích sơ đồ và tạo bộ câu hỏi ôn tập...</p>
                </div>
              ) : studyToolType === 'flashcard' && studyData.flashcards ? (
                /* GIAO DIỆN LẬT THẺ FLASHCARD */
                <div className="flex flex-col items-center">
                  <div className="text-xs text-slate-400 mb-3 font-bold">
                    Thẻ {currentFlashcardIdx + 1} / {studyData.flashcards.length}
                  </div>
                  <div
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="w-full max-w-lg h-64 bg-gradient-to-tr from-slate-950 to-slate-900 border-2 border-slate-700 hover:border-amber-400/80 rounded-3xl p-6 flex flex-col items-center justify-center text-center cursor-pointer shadow-xl transition transform active:scale-98 select-none relative"
                  >
                    <span className="absolute top-4 right-4 text-[10px] bg-slate-800 text-amber-400 px-2 py-0.5 rounded-full font-bold">
                      {isCardFlipped ? 'Mặt Sau: Đáp án' : 'Mặt Trước: Câu hỏi'}
                    </span>
                    <span className="text-3xl mb-3">{isCardFlipped ? '💡' : '❓'}</span>
                    <h4 className="text-base sm:text-lg font-extrabold text-white leading-relaxed">
                      {isCardFlipped
                        ? studyData.flashcards[currentFlashcardIdx]?.back
                        : studyData.flashcards[currentFlashcardIdx]?.front}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-4">Chạm vào thẻ để lật mặt</p>
                  </div>

                  <div className="flex items-center gap-4 mt-6">
                    <button
                      onClick={() => {
                        setCurrentFlashcardIdx(p => Math.max(0, p - 1))
                        setIsCardFlipped(false)
                      }}
                      disabled={currentFlashcardIdx === 0}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-bold text-white transition cursor-pointer"
                    >
                      ← Thẻ trước
                    </button>
                    <button
                      onClick={() => {
                        setCurrentFlashcardIdx(p => Math.min(studyData.flashcards.length - 1, p + 1))
                        setIsCardFlipped(false)
                      }}
                      disabled={currentFlashcardIdx === studyData.flashcards.length - 1}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 disabled:opacity-40 text-xs font-bold transition cursor-pointer"
                    >
                      Thẻ tiếp theo →
                    </button>
                  </div>
                </div>
              ) : studyToolType === 'quiz' && studyData.quizzes ? (
                /* GIAO DIỆN LÀM BÀI TRẮC NGHIỆM */
                <div className="space-y-6">
                  {studyData.quizzes.map((q: any, qIdx: number) => (
                    <div key={qIdx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left">
                      <div className="font-extrabold text-sm text-white mb-3">
                        <span className="text-blue-400 mr-1.5">Câu {qIdx + 1}:</span> {q.question}
                      </div>
                      <div className="space-y-2">
                        {['A', 'B', 'C', 'D'].map(optKey => {
                          const isSelected = quizUserAnswers[qIdx] === optKey
                          const isCorrect = q.correct === optKey
                          let btnClass = 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500'

                          if (quizSubmitted) {
                            if (isCorrect) btnClass = 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-bold'
                            else if (isSelected) btnClass = 'bg-rose-950/60 border-rose-500 text-rose-300'
                          } else if (isSelected) {
                            btnClass = 'bg-blue-600/30 border-blue-500 text-blue-200 font-bold'
                          }

                          return (
                            <button
                              key={optKey}
                              disabled={quizSubmitted}
                              onClick={() => setQuizUserAnswers(p => ({ ...p, [qIdx]: optKey }))}
                              className={`w-full p-2.5 rounded-xl border text-xs text-left flex items-center gap-2 transition ${btnClass}`}
                            >
                              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                                {optKey}
                              </span>
                              <span>{q.options[optKey]}</span>
                            </button>
                          )
                        })}
                      </div>

                      {quizSubmitted && q.explanation && (
                        <div className="mt-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                          <strong className="text-emerald-400">Giải thích: </strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs text-slate-400">
                      Đã chọn {Object.keys(quizUserAnswers).length}/{studyData.quizzes.length} câu
                    </span>
                    {!quizSubmitted ? (
                      <button
                        onClick={() => setQuizSubmitted(true)}
                        className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition"
                      >
                        Nộp Bài & Xem Điểm
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setQuizSubmitted(false)
                          setQuizUserAnswers({})
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
                      >
                        Làm Lại
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: KHO SƠ ĐỒ CÁ NHÂN */}
      {showLibraryModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderOpen size={20} className="text-blue-400" />
                <h3 className="font-extrabold text-white text-sm">Kho Sơ Đồ Của Tôi ({savedMindMaps.length})</h3>
              </div>
              <button onClick={() => setShowLibraryModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="py-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="Tìm kiếm sơ đồ theo tên..."
                  value={searchLibraryQuery}
                  onChange={e => setSearchLibraryQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="py-2 flex-1 overflow-y-auto space-y-2">
              {savedMindMaps.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  Chưa có sơ đồ nào được lưu. Bấm nút <strong>Lưu</strong> trên thanh công cụ để lưu sơ đồ hiện tại.
                </div>
              ) : (
                savedMindMaps
                  .filter(m => m.title.toLowerCase().includes(searchLibraryQuery.toLowerCase()))
                  .map(item => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 hover:border-blue-500/60 flex items-center justify-between transition"
                    >
                      <div className="min-w-0 pr-3">
                        <h4 className="font-extrabold text-xs sm:text-sm text-white truncate">{item.title}</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {item.nodeCount} nhánh • Cập nhật: {item.updatedAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => {
                            setCurrentMindMap(item.data)
                            setMindMapTitle(item.title)
                            setSelectedNodeId(item.data.id || 'root')
                            setShowLibraryModal(false)
                            showToast?.(`Đã mở sơ đồ: ${item.title}`, 'success')
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                        >
                          Mở
                        </button>
                        <button
                          onClick={() => {
                            const updated = savedMindMaps.filter(m => m.id !== item.id)
                            setSavedMindMaps(updated)
                            localStorage.setItem('dzota_saved_mindmaps', JSON.stringify(updated))
                            showToast?.('Đã xóa sơ đồ khỏi thư viện.', 'info')
                          }}
                          className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                          title="Xóa sơ đồ này"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
