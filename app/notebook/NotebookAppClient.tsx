'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  BookOpen,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  FileText,
  Upload,
  Layers,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Settings,
  HelpCircle,
  FolderPlus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  FileCode,
  FileUp,
  RefreshCw,
  ExternalLink,
  Edit2,
  Sliders,
  Send,
  MessageSquare,
  Bookmark,
  Share2,
  Eye,
  SlidersHorizontal,
  Home,
  Folder,
  Tag,
  Star,
  Clock,
  ThumbsUp,
  FileCheck,
  Zap,
  ListOrdered
} from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────
export interface SourceItem {
  id: string
  name: string
  type: 'text' | 'pdf' | 'docx' | 'pptx' | 'file'
  content: string
  size?: number
  addedAt: number
  active: boolean
}

export interface TopicItem {
  id: string
  name: string
  summary?: string
  selected: boolean
}

export interface GeneratedQuiz {
  id: string
  title: string
  createdAt: number
  markdown: string
  questionCount: number
  selectedTopics: string[]
}

export interface NotebookItem {
  id: string
  title: string
  subject: string
  ownerId?: string
  createdAt: number
  updatedAt: number
  sourceType: 'single_topic' | 'multi_topic'
  isFavorite?: boolean
  sources: SourceItem[]
  sampleExam?: {
    name: string
    type: string
    content: string
  }
  topics: TopicItem[]
  quizConfig: {
    questionCount: number
    easyMediumPercent: number
    hardPercent: number
    customNotes: string
  }
  generatedQuizzes: GeneratedQuiz[]
}

// ─── RICH MARKDOWN RENDERER COMPONENT ─────────────────────────────
// Loại bỏ sạch sẽ lỗi in đậm **, //, lỗi công thức $\mathbf{...}$ và render dẫn chứng chuẩn mực
export function RichMarkdownRenderer({ content }: { content: string }) {
  const renderedElements = useMemo(() => {
    if (!content) return null

    // 1. Tiền xử lý dọn dẹp các ký tự rác và chuyển đổi LaTeX math bị lạm dụng
    let cleanText = content
      // Chuyển đổi triệt để các ký hiệu LaTeX math bị lạm dụng cho thuật ngữ y sinh / hóa học
      // Ví dụ: $\mathbf{Hb}$ -> **Hb**, $\mathbf{RBC}$ -> **RBC**, $\mathbf{WBC}$ -> **WBC**
      .replace(/\$\\mathbf\{([^}]+)\}\$/g, '**$1**')
      .replace(/\$\\mathrm\{([^}]+)\}\$/g, '$1')
      .replace(/\$\\text\{([^}]+)\}\$/g, '$1')
      .replace(/\$\\textbf\{([^}]+)\}\$/g, '**$1**')
      .replace(/\\mathbf\{([^}]+)\}/g, '**$1**')
      .replace(/\\mathrm\{([^}]+)\}/g, '$1')
      .replace(/\\text\{([^}]+)\}/g, '$1')
      .replace(/\\textbf\{([^}]+)\}/g, '**$1**')
      // Đơn vị y tế & toán học
      .replace(/\\times/g, '×')
      .replace(/\\mu\s*L/gi, 'μL')
      .replace(/\\mu/g, 'μ')
      .replace(/\\pm/g, '±')
      .replace(/\\ge(q)?\b/g, '≥')
      .replace(/\\le(q)?\b/g, '≤')
      .replace(/\\neq\b/g, '≠')
      // Chuẩn hóa lũy thừa số mũ thông dụng: 10^6 -> 10⁶, 10^{12} -> 10¹²
      .replace(/10\^\{?(\d+)\}?/g, (m, exp) => {
        const supMap: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' }
        return '10' + exp.split('').map((c: string) => supMap[c] || c).join('')
      })
      // Dọn dẹp các dấu dollar lẻ bao quanh thuật ngữ, đơn vị hoặc số liệu:
      // Ví dụ: $PLT$ -> **PLT**, $Neutrophil$ -> **Neutrophil**, $g/dL$ -> g/dL, $× 10⁶/μL$ -> × 10⁶/μL, $150 - 450$ -> 150 - 450
      .replace(/\$([^$\n]{1,60})\$/g, (match, inner) => {
        const trimmed = inner.trim()
        if (/^[A-Za-z]{1,20}$/.test(trimmed)) {
          return `**${trimmed}**`
        }
        return trimmed
      })
      // Bỏ các dấu gạch chéo // ở đầu dòng hoặc lẻ loi
      .replace(/^[ \t]*\/\/[ \t]*/gm, '')
      .replace(/[ \t]+\/\/[ \t]+/g, ' • ')
      // Chuẩn hóa xuống dòng
      .replace(/\r\n/g, '\n')

    // Tách văn bản thành các khối (blocks)
    const rawBlocks = cleanText.split(/\n\s*\n/)

    return rawBlocks.map((block, blockIdx) => {
      const trimmedBlock = block.trim()
      if (!trimmedBlock) return null

      // Horizontal Rule
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmedBlock)) {
        return <hr key={blockIdx} className="my-4 border-slate-200 dark:border-slate-700" />
      }

      // Heading 1 (# ...)
      if (/^#\s+/.test(trimmedBlock)) {
        const text = trimmedBlock.replace(/^#\s+/, '')
        return (
          <h1 key={blockIdx} className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-4 mb-2 pb-1 border-b border-slate-100 dark:border-slate-800">
            {renderInlineMarkdown(text)}
          </h1>
        )
      }

      // Heading 2 (## ...)
      if (/^##\s+/.test(trimmedBlock)) {
        const text = trimmedBlock.replace(/^##\s+/, '')
        return (
          <h2 key={blockIdx} className="text-lg sm:text-xl font-extrabold text-blue-700 dark:text-blue-400 mt-4 mb-2">
            {renderInlineMarkdown(text)}
          </h2>
        )
      }

      // Heading 3 (### ...)
      if (/^###\s+/.test(trimmedBlock)) {
        const text = trimmedBlock.replace(/^###\s+/, '')
        return (
          <h3 key={blockIdx} className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-100 mt-3 mb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-600 rounded-full inline-block" />
            <span>{renderInlineMarkdown(text)}</span>
          </h3>
        )
      }

      // Heading 4 (#### ...)
      if (/^####\s+/.test(trimmedBlock)) {
        const text = trimmedBlock.replace(/^####\s+/, '')
        return (
          <h4 key={blockIdx} className="text-sm sm:text-base font-bold text-slate-700 dark:text-slate-200 mt-2 mb-1">
            {renderInlineMarkdown(text)}
          </h4>
        )
      }

      // Heading Số La Mã lớn (I. KHOẢNG THAM CHIẾU..., II. CÁC THÔNG SỐ...)
      if (/^[IVXLCDM]+\.\s+[A-ZÀ-Ỹ\s\d\(\)\-]{3,}/i.test(trimmedBlock)) {
        return (
          <div key={blockIdx} className="my-3 p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border-l-4 border-blue-600 border border-blue-100 dark:border-blue-900/60 shadow-2xs">
            <h3 className="text-sm sm:text-base font-black text-blue-900 dark:text-blue-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block shrink-0" />
              <span>{renderInlineMarkdown(trimmedBlock)}</span>
            </h3>
          </div>
        )
      }

      // Blockquote (> ...)
      if (/^>\s+/.test(trimmedBlock)) {
        const quoteText = trimmedBlock.replace(/^>\s+/gm, '')
        return (
          <blockquote key={blockIdx} className="p-3 my-2.5 bg-blue-50/70 dark:bg-blue-950/30 border-l-4 border-blue-500 rounded-r-xl text-xs sm:text-sm text-slate-700 dark:text-slate-300 italic">
            {renderInlineMarkdown(quoteText)}
          </blockquote>
        )
      }

      // Code Block (``` ... ```)
      if (trimmedBlock.startsWith('```')) {
        const cleanCode = trimmedBlock.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/, '')
        return (
          <pre key={blockIdx} className="p-3 my-2.5 bg-slate-900 text-slate-100 rounded-2xl text-xs font-mono overflow-x-auto shadow-xs">
            <code>{cleanCode}</code>
          </pre>
        )
      }

      // Danh sách bullet hoặc số
      const lines = trimmedBlock.split('\n')
      const isListBlock = lines.every(l => /^\s*(\*|\-|\+|•|\d+\.)\s+/.test(l))

      if (isListBlock) {
        return (
          <ul key={blockIdx} className="space-y-1.5 my-2.5 pl-1">
            {lines.map((line, lIdx) => {
              const cleanItem = line.replace(/^\s*(\*|\-|\+|•|\d+\.)\s+/, '')
              return (
                <li key={lIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">{renderInlineMarkdown(cleanItem)}</div>
                </li>
              )
            })}
          </ul>
        )
      }

      // Đoạn văn bình thường (Paragraph)
      return (
        <p key={blockIdx} className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed my-2">
          {lines.map((l, lIdx) => (
            <React.Fragment key={lIdx}>
              {lIdx > 0 && <br />}
              {renderInlineMarkdown(l)}
            </React.Fragment>
          ))}
        </p>
      )
    })
  }, [content])

  return <div className="space-y-1">{renderedElements}</div>
}

// Xử lý inline: **in đậm**, *in nghiêng*, `code`, và [Dẫn chứng nguồn]
function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return ''

  const parts: React.ReactNode[] = []
  // Regex nhận diện:
  // 1. Trích dẫn nguồn: (\(\s*\[(?:Slide|Trang|Chương|Nguồn|Bài)[^\]]+\]\s*\)|\[(?:Slide|Trang|Chương|Nguồn|Bài)[^\]]+\])
  // 2. **bold**
  // 3. *italic*
  // 4. `code`
  const regex = /(\(\s*\[(?:Slide|Trang|Chương|Nguồn|Bài)[^\]]+\]\s*\)|\[(?:Slide|Trang|Chương|Nguồn|Bài)[^\]]+\]|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/gi
  let match: RegExpExecArray | null
  let lastIndex = 0

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      // Bold
      parts.push(
        <strong key={match.index} className="font-extrabold text-slate-900 dark:text-white">
          {token.slice(2, -2)}
        </strong>
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      // Italic
      parts.push(
        <em key={match.index} className="italic text-slate-700 dark:text-slate-300">
          {token.slice(1, -1)}
        </em>
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      // Inline Code
      parts.push(
        <code key={match.index} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-pink-600 dark:text-pink-400 font-mono text-[11px]">
          {token.slice(1, -1)}
        </code>
      )
    } else if (
      /^(?:\(\s*)?\[(?:Slide|Trang|Chương|Nguồn|Bài)/i.test(token)
    ) {
      // Dẫn chứng tài liệu nguồn (Citation badge chuẩn Google NotebookLM)
      const cleanCitation = token
        .replace(/^\(\s*/, '')
        .replace(/\s*\)$/, '')
        .replace(/^\[/, '')
        .replace(/\]$/, '')
        .trim()

      parts.push(
        <span
          key={match.index}
          className="inline-flex items-center gap-1 px-2 py-0.5 my-0.5 mx-1 rounded-md bg-blue-50 dark:bg-blue-950/70 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 font-bold text-[11px] shadow-2xs align-middle"
          title={`Dẫn chứng chính xác từ tài liệu nguồn: ${cleanCitation}`}
        >
          <span>📖</span>
          <span>{cleanCitation}</span>
        </span>
      )
    }

    lastIndex = match.index + token.length
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

// ─── MAIN NOTEBOOK APP CLIENT COMPONENT ───────────────────────────
export default function NotebookAppClient({ currentUser }: { currentUser?: any }) {
  // Định danh người dùng hiện tại để cách ly dữ liệu sổ ghi chú tuyệt đối giữa các tài khoản
  const userKey = useMemo(() => {
    const raw = currentUser?.id || currentUser?.username || currentUser?.email || 'guest'
    return String(raw).trim()
  }, [currentUser])
  const storageKey = useMemo(() => `dzota_notebook_nd_store_${userKey}`, [userKey])

  // Sổ ghi chú store
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([])
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'favorites'>('all')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>('')

  // 2 CHẾ ĐỘ CỐT LÕI THEO YÊU CẦU: 'chat' (hỏi đáp) | 'studio' (tạo đề)
  const [activeMode, setActiveMode] = useState<'chat' | 'studio'>('chat')
  // Tab điều hướng độc lập trên điện thoại: 'sources' | 'chat' | 'studio'
  const [mobileTab, setMobileTab] = useState<'sources' | 'chat' | 'studio'>('chat')
  const [outputTab, setOutputTab] = useState<'preview' | 'markdown'>('preview')

  // Modals
  const [showAddSourceModal, setShowAddSourceModal] = useState(false)
  const [sourceInputType, setSourceInputType] = useState<'file' | 'text'>('file')
  const [manualTextTitle, setManualTextTitle] = useState('')
  const [manualTextContent, setManualTextContent] = useState('')

  // Đề mẫu modal
  const [showSampleExamModal, setShowSampleExamModal] = useState(false)
  const [sampleExamTitle, setSampleExamTitle] = useState('')
  const [sampleExamContent, setSampleExamContent] = useState('')

  // Tạo sổ mới modal
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newNotebookTitle, setNewNotebookTitle] = useState('')
  const [newNotebookSubject, setNewNotebookSubject] = useState('')
  const [newNotebookSourceType, setNewNotebookSourceType] = useState<'single_topic' | 'multi_topic'>('multi_topic')

  // Chat state
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string; time?: string }[]>([])
  const [isChatting, setIsChatting] = useState(false)

  // Copy notification
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null)

  const showToast = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToastMsg({ text, type })
    setTimeout(() => setToastMsg(null), 3500)
  }

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sampleExamInputRef = useRef<HTMLInputElement>(null)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Load external scripts (PDF.js, JSZip, Mammoth, Docx)
  useEffect(() => {
    const loadScript = (src: string, id: string) => {
      if (!document.getElementById(id)) {
        const s = document.createElement('script')
        s.id = id
        s.src = src
        s.async = true
        document.head.appendChild(s)
      }
    }
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', 'pdfjs-lib')
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js', 'jszip-lib')
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js', 'mammoth-lib')
    loadScript('https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js', 'docx-lib')
  }, [])

  // Khởi tạo và đọc dữ liệu sổ từ LocalStorage theo từng tài khoản (cách ly độc lập tuyệt đối)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          const userOnly = parsed.filter(n => !n.ownerId || n.ownerId === userKey)
          setNotebooks(userOnly)
          // Kiểm tra URL query xem có id sổ nào cần mở không
          const urlParams = new URLSearchParams(window.location.search)
          const targetId = urlParams.get('id')
          if (targetId && userOnly.some(n => n.id === targetId)) {
            setActiveNotebookId(targetId)
          } else if (userOnly.length > 0) {
            setActiveNotebookId(userOnly[0].id)
          } else {
            setActiveNotebookId(null)
          }
          return
        }
      }

      // Nếu tài khoản này chưa có dữ liệu trong storageKey, kiểm tra xem có dữ liệu cũ cần di chuyển không
      const legacyRaw = localStorage.getItem('dzota_notebook_nd_store')
      if (legacyRaw && userKey !== 'guest') {
        try {
          const legacyParsed = JSON.parse(legacyRaw)
          if (Array.isArray(legacyParsed) && legacyParsed.length > 0) {
            const migrated = legacyParsed.map(n => ({ ...n, ownerId: userKey }))
            setNotebooks(migrated)
            localStorage.setItem(storageKey, JSON.stringify(migrated))
            // Dọn dẹp key dùng chung cũ để các tài khoản khác sau này không bị đọc nhầm
            localStorage.removeItem('dzota_notebook_nd_store')
            setActiveNotebookId(migrated[0].id)
            return
          }
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Lỗi đọc store sổ ghi chú:', e)
    }

    // Nếu là tài khoản mới tinh chưa có sổ nào, tạo 1 sổ mẫu chuẩn Vi Sinh gắn với tài khoản này
    const sampleNotebook: NotebookItem = {
      id: `nb_sample_${userKey}_visinh`,
      title: 'Ôn Tập Vi Sinh Chuyên Sâu',
      subject: 'Vi Sinh Y Khoa',
      ownerId: userKey,
      createdAt: Date.now() - 3600000 * 24 * 2,
      updatedAt: Date.now(),
      sourceType: 'multi_topic',
      isFavorite: true,
      sources: [
        {
          id: 'src_sample_1',
          name: 'Giao_Trinh_Vi_Sinh_Co_Ban.docx',
          type: 'docx',
          content: 'Khái niệm vi khuẩn, vi nấm và virus. Vách tế bào vi khuẩn Gram dương có lớp Peptidoglycan dày đặc giữ màu tím gentian. Vi khuẩn Gram âm có màng ngoài chứa LPS (Endotoxin) gây sốt cao và sốc nhiễm khuẩn. Kháng sinh Beta-lactam ức chế tổng hợp vách tế bào bằng cách gắn vào PBP (Penicillin-Binding Protein). Kháng sinh Aminoglycosid và Macrolid ức chế tổng hợp protein tại ribosome 30S và 50S.',
          size: 45200,
          addedAt: Date.now() - 3600000 * 24,
          active: true
        }
      ],
      topics: [
        { id: 'top_1', name: 'Cấu trúc vách tế bào vi khuẩn Gram (+) và Gram (-)', selected: true },
        { id: 'top_2', name: 'Cơ chế kháng sinh ức chế tổng hợp vách và protein', selected: true },
        { id: 'top_3', name: 'Ngoại độc tố (Exotoxin) và Nội độc tố (Endotoxin)', selected: false }
      ],
      quizConfig: {
        questionCount: 20,
        easyMediumPercent: 60,
        hardPercent: 40,
        customNotes: 'Nhấn mạnh phân biệt cơ chế tác dụng của Beta-lactam và Vancomycin; các bẫy về độc tố vi khuẩn.'
      },
      generatedQuizzes: []
    }

    setNotebooks([sampleNotebook])
    setActiveNotebookId(sampleNotebook.id)
    try {
      localStorage.setItem(storageKey, JSON.stringify([sampleNotebook]))
    } catch (e) {}
  }, [storageKey, userKey])

  // Lưu trữ sổ ghi chú tự động mỗi khi có thay đổi
  const saveNotebooksToStorage = (updated: NotebookItem[]) => {
    const withOwner = updated.map(n => ({ ...n, ownerId: n.ownerId || userKey }))
    setNotebooks(withOwner)
    try {
      localStorage.setItem(storageKey, JSON.stringify(withOwner))
    } catch (e) {
      console.warn('Lỗi ghi LocalStorage:', e)
    }
  }

  // Sổ ghi chú đang được chọn
  const activeNotebook = useMemo(() => {
    return notebooks.find(n => n.id === activeNotebookId) || null
  }, [notebooks, activeNotebookId])

  // Cập nhật sổ hiện tại
  const updateActiveNotebook = (updater: (prev: NotebookItem) => NotebookItem) => {
    if (!activeNotebookId) return
    const updated = notebooks.map(nb => {
      if (nb.id === activeNotebookId) {
        return updater(nb)
      }
      return nb
    })
    saveNotebooksToStorage(updated)
  }

  // Lọc danh sách sổ theo tìm kiếm & bộ lọc
  const filteredNotebooks = useMemo(() => {
    return notebooks.filter(nb => {
      const matchSearch =
        nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nb.subject.toLowerCase().includes(searchQuery.toLowerCase())
      const matchFav = libraryFilter === 'favorites' ? nb.isFavorite : true
      return matchSearch && matchFav
    })
  }, [notebooks, searchQuery, libraryFilter])

  // Scroll xuống đáy chat khi có tin nhắn mới
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatting])

  // Khi mở sổ mới trên mobile: nếu sổ chưa có nguồn thì mở tab Nguồn, nếu đã có thì mở tab Chat
  useEffect(() => {
    if (activeNotebook) {
      if (activeNotebook.sources.length === 0) {
        setMobileTab('sources')
      } else {
        setMobileTab(activeMode)
      }
    }
  }, [activeNotebookId])

  // ─── HÀM BÓC TÁCH VĂN BẢN TỪ FILE ───────────────────────────────
  const extractTextFromFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    if (ext === 'txt' || ext === 'csv' || ext === 'json' || ext === 'md') {
      return await file.text()
    }

    if (ext === 'docx' || ext === 'doc') {
      const arrayBuffer = await file.arrayBuffer()
      const mammoth = (window as any).mammoth
      if (mammoth) {
        const result = await mammoth.extractRawText({ arrayBuffer })
        return result.value || ''
      }
      return await file.text()
    }

    if (ext === 'pdf') {
      const pdfjsLib = (window as any).pdfjsLib
      if (!pdfjsLib) {
        throw new Error('Thư viện PDF.js chưa sẵn sàng, vui lòng thử lại sau vài giây!')
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

      const arrayBuffer = await file.arrayBuffer()
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
      const pdf = await loadingTask.promise
      let fullText = ''

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const textContent = await page.getTextContent()
        const pageString = textContent.items.map((item: any) => item.str).join(' ')
        fullText += `\n--- Trang ${pageNum} ---\n` + pageString
      }
      return fullText
    }

    if (ext === 'pptx' || ext === 'ppt') {
      const JSZip = (window as any).JSZip
      if (JSZip) {
        try {
          const zip = await JSZip.loadAsync(file)
          let pptxText = ''
          const slideFiles = Object.keys(zip.files).filter(k => k.startsWith('ppt/slides/slide') && k.endsWith('.xml'))
          for (let i = 0; i < slideFiles.length; i++) {
            const xmlStr = await zip.files[slideFiles[i]].async('text')
            const stripped = xmlStr.replace(/<[^>]+>/g, ' ')
            pptxText += `\n--- Slide ${i + 1} ---\n` + stripped.replace(/\s+/g, ' ').trim()
          }
          if (pptxText.trim().length > 20) return pptxText
        } catch (e) {}
      }
      return await file.text()
    }

    return await file.text()
  }

  // ─── THAO TÁC NGUỒN TÀI LIỆU ────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !activeNotebook) return

    setLoading(true)
    setLoadingStep('Đang trích xuất văn bản từ tài liệu...')

    try {
      const newSources: SourceItem[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const text = await extractTextFromFile(file)

        if (!text || text.trim().length < 10) {
          showToast(`File ${file.name} không đọc được nội dung hoặc file rỗng!`, 'warning')
          continue
        }

        let type: SourceItem['type'] = 'file'
        if (ext === 'pdf') type = 'pdf'
        else if (['docx', 'doc'].includes(ext)) type = 'docx'
        else if (['pptx', 'ppt'].includes(ext)) type = 'pptx'
        else type = 'text'

        newSources.push({
          id: `src_${Date.now()}_${i}`,
          name: file.name,
          type,
          content: text,
          size: file.size,
          addedAt: Date.now(),
          active: true
        })
      }

      if (newSources.length > 0) {
        updateActiveNotebook(nb => ({
          ...nb,
          updatedAt: Date.now(),
          sources: [...nb.sources, ...newSources]
        }))
        showToast(`Đã thêm thành công ${newSources.length} tài liệu nguồn!`, 'success')
        setShowAddSourceModal(false)
      }
    } catch (err: any) {
      showToast(`Lỗi khi đọc file: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setLoadingStep('')
      if (e.target) e.target.value = ''
    }
  }

  const handleAddManualText = () => {
    if (!manualTextContent.trim() || !activeNotebook) {
      showToast('Vui lòng nhập nội dung văn bản nguồn!', 'warning')
      return
    }

    const newSource: SourceItem = {
      id: `src_${Date.now()}`,
      name: manualTextTitle.trim() || `Ghi chú nguồn #${activeNotebook.sources.length + 1}`,
      type: 'text',
      content: manualTextContent.trim(),
      addedAt: Date.now(),
      active: true
    }

    updateActiveNotebook(nb => ({
      ...nb,
      updatedAt: Date.now(),
      sources: [...nb.sources, newSource]
    }))

    setManualTextTitle('')
    setManualTextContent('')
    setShowAddSourceModal(false)
    showToast('Đã thêm văn bản nguồn thành công!', 'success')
  }

  // Toggle active/inactive nguồn
  const handleToggleSourceActive = (srcId: string) => {
    updateActiveNotebook(nb => ({
      ...nb,
      sources: nb.sources.map(s => s.id === srcId ? { ...s, active: !s.active } : s)
    }))
  }

  const handleDeleteSource = (srcId: string) => {
    updateActiveNotebook(nb => ({
      ...nb,
      sources: nb.sources.filter(s => s.id !== srcId)
    }))
    showToast('Đã xóa tài liệu nguồn khỏi sổ!', 'info')
  }

  // ─── ĐỀ THI MẪU (CLONE PHONG CÁCH GV) ───────────────────────────
  const handleSampleExamUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeNotebook) return

    setLoading(true)
    setLoadingStep('Đang phân tích cấu trúc & phong cách đề mẫu...')

    try {
      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 20) {
        showToast('File đề mẫu không có đủ nội dung để phân tích!', 'warning')
        return
      }

      updateActiveNotebook(nb => ({
        ...nb,
        updatedAt: Date.now(),
        sampleExam: {
          name: file.name,
          type: file.name.split('.').pop()?.toLowerCase() || 'docx',
          content: text
        }
      }))
      showToast(`Đã nạp đề mẫu: "${file.name}"! AI sẽ clone phong cách ra đề này.`, 'success')
      setShowSampleExamModal(false)
    } catch (err: any) {
      showToast(`Lỗi đọc file đề mẫu: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setLoadingStep('')
      if (e.target) e.target.value = ''
    }
  }

  // ─── TỰ ĐỘNG PHÂN TÍCH CHỦ ĐỀ ────────────────────────────────────
  const handleExtractTopics = async () => {
    if (!activeNotebook) return

    const activeSources = activeNotebook.sources.filter(s => s.active)
    if (activeSources.length === 0) {
      showToast('Vui lòng bật chọn ít nhất 1 tài liệu nguồn để phân tích chủ đề!', 'warning')
      return
    }

    const combinedContent = activeSources.map(s => `[Tài liệu: ${s.name}]\n${s.content}`).join('\n\n')

    setLoading(true)
    setLoadingStep('AI đang đọc toàn bộ tài liệu để chia thành các chủ đề chuyên sâu...')

    try {
      const res = await fetch('/api/notebook-nd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract_topics',
          subjectName: activeNotebook.subject || activeNotebook.title,
          sourceContent: combinedContent
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi phân tích chủ đề')

      if (data.topics && Array.isArray(data.topics)) {
        const topicsWithSelect: TopicItem[] = data.topics.map((t: any) => ({
          id: t.id || `topic_${Math.random()}`,
          name: t.name || 'Chủ đề',
          summary: t.summary || '',
          selected: true
        }))

        updateActiveNotebook(nb => ({
          ...nb,
          updatedAt: Date.now(),
          topics: topicsWithSelect
        }))
        showToast(`🎉 Đã phân tích và trích xuất thành công ${topicsWithSelect.length} chủ đề kiến thức!`, 'success')
      }
    } catch (err: any) {
      showToast(`Lỗi khi phân tích chủ đề: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // ─── TẠO BỘ CÂU HỎI TRẮC NGHIỆM AI ─────────────────────────────
  const handleGenerateQuiz = async () => {
    if (!activeNotebook) return

    const activeSources = activeNotebook.sources.filter(s => s.active)
    if (activeSources.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 tài liệu nguồn để tạo đề!', 'warning')
      return
    }

    const selectedTopicsList = activeNotebook.topics.filter(t => t.selected).map(t => t.name)
    const combinedContent = activeSources.map(s => s.content).join('\n\n')

    setLoading(true)
    setLoadingStep(`AI đang tạo ĐÚNG ${activeNotebook.quizConfig.questionCount} câu hỏi trắc nghiệm chuyên sâu...`)

    try {
      const res = await fetch('/api/notebook-nd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_quiz',
          subjectName: activeNotebook.subject || activeNotebook.title,
          sourceContent: combinedContent,
          selectedTopics: selectedTopicsList,
          questionCount: activeNotebook.quizConfig.questionCount || 20,
          easyMediumPercent: activeNotebook.quizConfig.easyMediumPercent || 60,
          hardPercent: activeNotebook.quizConfig.hardPercent || 40,
          customNotes: activeNotebook.quizConfig.customNotes || '',
          sampleExamContent: activeNotebook.sampleExam?.content || ''
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo đề trắc nghiệm')

      const generatedMarkdown = data.result || ''

      // Đếm số câu hỏi thực tế
      const matchQuestions = generatedMarkdown.match(/(?:^|\n)\s*Câu\s*\d+[\.:]/gi)
      const count = matchQuestions ? matchQuestions.length : activeNotebook.quizConfig.questionCount

      const newQuiz: GeneratedQuiz = {
        id: `quiz_${Date.now()}`,
        title: `${activeNotebook.title} (${count} câu)`,
        createdAt: Date.now(),
        markdown: generatedMarkdown,
        questionCount: count,
        selectedTopics: selectedTopicsList
      }

      updateActiveNotebook(nb => ({
        ...nb,
        updatedAt: Date.now(),
        generatedQuizzes: [newQuiz, ...nb.generatedQuizzes]
      }))

      showToast(`🎉 Đã tạo thành công bộ đề gồm ${count} câu hỏi trắc nghiệm!`, 'success')
      setOutputTab('preview')
    } catch (err: any) {
      showToast(`Lỗi tạo câu hỏi: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // ─── CHAT & HỎI ĐÁP TÀI LIỆU NGUỒN ─────────────────────────────
  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeNotebook || isChatting) return

    const userMsg = chatInput.trim()
    setChatInput('')

    const activeSources = activeNotebook.sources.filter(s => s.active)
    if (activeSources.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 tài liệu nguồn để đối thoại!', 'warning')
      return
    }

    const combinedContent = activeSources.map(s => `[${s.name}]\n${s.content}`).join('\n\n')

    const newMessages = [
      ...chatMessages,
      { role: 'user' as const, text: userMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]
    setChatMessages(newMessages)
    setIsChatting(true)

    try {
      const res = await fetch('/api/notebook-nd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          subjectName: activeNotebook.subject || activeNotebook.title,
          sourceContent: combinedContent,
          chatPrompt: userMsg
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi đối thoại AI')

      setChatMessages([
        ...newMessages,
        {
          role: 'assistant' as const,
          text: data.result || 'Không có câu trả lời phù hợp trong tài liệu.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ])
    } catch (err: any) {
      setChatMessages([
        ...newMessages,
        { role: 'assistant' as const, text: `⚠️ Lỗi kết nối: ${err.message}` }
      ])
    } finally {
      setIsChatting(false)
    }
  }

  // ─── XUẤT BẢN ĐỀ THI: COPY, IMPORT TẠO BÀI TEST, TẢI WORD ────────
  const latestQuiz = activeNotebook?.generatedQuizzes[0] || null

  const handleCopyQuestions = () => {
    if (!latestQuiz) return
    navigator.clipboard.writeText(latestQuiz.markdown)
    showToast('📋 Đã sao chép toàn bộ câu hỏi trắc nghiệm vào Clipboard!', 'success')
  }

  const handleImportToTestCreator = () => {
    if (!latestQuiz || !activeNotebook) return
    try {
      localStorage.setItem('dzota_pending_import_quiz', latestQuiz.markdown)
      localStorage.setItem('dzota_pending_import_title', activeNotebook.title)
      localStorage.setItem('dzota_pending_import_category', activeNotebook.subject || 'Chung')
      showToast('🚀 Đang chuyển sang trình Soạn thảo Đề thi của Dzota...', 'success')
      setTimeout(() => {
        window.location.href = '/creator?import=notebook_nd'
      }, 500)
    } catch (e) {
      showToast('Không thể lưu tạm dữ liệu import!', 'error')
    }
  }

  const handleExportDocx = async () => {
    if (!latestQuiz || !activeNotebook) return
    const docxLib = (window as any).docx
    if (!docxLib) {
      showToast('Thư viện Word chưa sẵn sàng, vui lòng thử lại sau 1-2 giây!', 'warning')
      return
    }

    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docxLib
      const paragraphs: any[] = []

      paragraphs.push(
        new Paragraph({
          text: activeNotebook.title.toUpperCase(),
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      )

      paragraphs.push(
        new Paragraph({
          text: `Môn học: ${activeNotebook.subject} | Số câu: ${latestQuiz.questionCount} câu | Bản quyền: NoteBook ND`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      )

      const lines = latestQuiz.markdown.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) {
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }))
          continue
        }

        const isCorrectAnswer = trimmed.startsWith('**') || /^\*\*[A-D]\./i.test(trimmed)
        const cleanLine = trimmed.replace(/\*\*/g, '').trim()

        if (/^Câu\s*\d+/i.test(cleanLine)) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanLine,
                  bold: true,
                  size: 24
                })
              ],
              spacing: { before: 200, after: 100 }
            })
          )
        } else if (/^[A-D]\./i.test(cleanLine)) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanLine,
                  bold: isCorrectAnswer,
                  color: isCorrectAnswer ? '006600' : '000000',
                  size: 22
                })
              ],
              indent: { left: 400 },
              spacing: { after: 80 }
            })
          )
        } else {
          paragraphs.push(
            new Paragraph({
              children: [new TextRun({ text: cleanLine, size: 22 })],
              spacing: { after: 80 }
            })
          )
        }
      }

      const doc = new Document({
        sections: [{ properties: {}, children: paragraphs }]
      })

      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${activeNotebook.title.replace(/\s+/g, '_')}_DeThi_NoteBookND.docx`
      a.click()
      window.URL.revokeObjectURL(url)
      showToast('📥 Đã tải file Word (.docx) về máy thành công!', 'success')
    } catch (err: any) {
      showToast(`Lỗi tạo file Word: ${err.message}`, 'error')
    }
  }

  // ─── TẠO SỔ GHI CHÚ MỚI ─────────────────────────────────────────
  const handleCreateNewNotebook = () => {
    if (!newNotebookTitle.trim()) {
      showToast('Vui lòng nhập tên sổ ghi chú!', 'warning')
      return
    }

    const newNb: NotebookItem = {
      id: `nb_${Date.now()}`,
      title: newNotebookTitle.trim(),
      subject: newNotebookSubject.trim() || 'Tổng hợp',
      ownerId: userKey,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceType: newNotebookSourceType,
      isFavorite: false,
      sources: [],
      topics: [],
      quizConfig: {
        questionCount: 20,
        easyMediumPercent: 60,
        hardPercent: 40,
        customNotes: ''
      },
      generatedQuizzes: []
    }

    const updated = [newNb, ...notebooks]
    saveNotebooksToStorage(updated)
    setActiveNotebookId(newNb.id)
    setShowCreateModal(false)
    setNewNotebookTitle('')
    setNewNotebookSubject('')
    showToast(`Đã tạo sổ ghi chú "${newNb.title}"! Hãy thêm tài liệu để bắt đầu.`, 'success')
  }

  const handleDeleteNotebook = (nbId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Bạn có chắc muốn xóa sổ ghi chú này không?')) return
    const updated = notebooks.filter(n => n.id !== nbId)
    saveNotebooksToStorage(updated)
    if (activeNotebookId === nbId) setActiveNotebookId(null)
    showToast('Đã xóa sổ ghi chú thành công!', 'info')
  }

  const handleToggleFavorite = (nbId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = notebooks.map(n => n.id === nbId ? { ...n, isFavorite: !n.isFavorite } : n)
    saveNotebooksToStorage(updated)
  }

  // =================================================================
  // GIAO DIỆN 1: THƯ VIỆN SỔ GHI CHÚ (NOTEBOOK LIBRARY - IMAGE 2)
  // =================================================================
  if (!activeNotebook) {
    return (
      <div className="w-full h-full flex overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100">
        {/* Toast thông báo */}
        {toastMsg && (
          <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 animate-fade-in">
            <span>{toastMsg.type === 'success' ? '✅' : toastMsg.type === 'error' ? '❌' : 'ℹ️'}</span>
            <span>{toastMsg.text}</span>
          </div>
        )}

        {/* Sidebar trái (Notebook OS) chuẩn NotebookLM */}
        <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between p-4 flex-shrink-0 hidden md:flex h-full overflow-y-auto min-h-0">
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Sparkles size={20} />
              </div>
              <div>
                <h1 className="font-black text-lg tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  NoteBook ND
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">AI Studio</p>
              </div>
            </div>

            {/* Menu chính */}
            <nav className="space-y-1">
              <button
                onClick={() => setLibraryFilter('all')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                  libraryFilter === 'all'
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <BookOpen size={17} />
                  <span>Thư viện sổ</span>
                </div>
                <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {notebooks.length}
                </span>
              </button>

              <button
                onClick={() => setLibraryFilter('favorites')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                  libraryFilter === 'favorites'
                    ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 font-extrabold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star size={17} />
                  <span>Sổ yêu thích</span>
                </div>
                <span className="text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full font-bold">
                  {notebooks.filter(n => n.isFavorite).length}
                </span>
              </button>
            </nav>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Thư mục</span>
                <Plus size={14} className="cursor-pointer hover:text-slate-700" />
              </div>
              <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <span>Thẻ Tags</span>
                <Plus size={14} className="cursor-pointer hover:text-slate-700" />
              </div>
            </div>
          </div>

          {/* Nút thoát về Dzota Quiz */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <a
              href="/dashboard"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Home size={16} />
              <span>Bảng điều khiển Dzota</span>
            </a>
            <a
              href="/creator"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <FileText size={16} />
              <span>Soạn thảo đề thi</span>
            </a>
          </div>
        </aside>

        {/* Nội dung chính: Danh sách sổ ghi chú */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col h-full overflow-hidden">
          {/* Top Bar thư viện */}
          <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm trong số ghi chú... (Ctrl + K)"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm border-none outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-md shadow-blue-500/20 transition flex items-center gap-1.5 sm:gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <Plus size={16} />
                <span>+ Sổ Mới</span>
              </button>
            </div>
          </header>

          {/* Vùng danh sách Table / Card View phong cách Google NotebookLM */}
          <div className="flex-1 min-h-0 p-3 sm:p-6 overflow-y-auto max-w-6xl mx-auto w-full space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Thư Viện Sổ Ghi Chú (Notebook Library)
                </h2>
                <p className="text-[11px] sm:text-sm text-slate-500 mt-0.5">
                  {notebooks.length} sổ ghi chú • Tra cứu tài liệu thông minh & tự động tạo ngân hàng câu hỏi
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLibraryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    libraryFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500'
                  }`}
                >
                  Tất cả ({notebooks.length})
                </button>
                <button
                  onClick={() => setLibraryFilter('favorites')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    libraryFilter === 'favorites'
                      ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-xs border border-slate-200 dark:border-slate-700'
                      : 'text-slate-500'
                  }`}
                >
                  Yêu thích ({notebooks.filter(n => n.isFavorite).length})
                </button>
              </div>
            </div>

            {/* Bảng sổ ghi chú */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
              {filteredNotebooks.length === 0 ? (
                <div className="text-center py-20 px-4 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 mx-auto flex items-center justify-center">
                    <BookOpen size={28} />
                  </div>
                  <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
                    Chưa tìm thấy sổ ghi chú nào
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Bấm vào nút "+ Sổ Ghi Chú Mới" để tạo sổ ôn tập và nạp tài liệu học tập của bạn ngay!
                  </p>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold rounded-xl transition cursor-pointer"
                  >
                    + Tạo sổ đầu tiên
                  </button>
                </div>
              ) : (
                <>
                  {/* Card View cho điện thoại (md:hidden) */}
                  <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredNotebooks.map(nb => (
                      <div
                        key={nb.id}
                        onClick={() => setActiveNotebookId(nb.id)}
                        className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer space-y-2.5 active:bg-slate-100"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                              <BookOpen size={18} />
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                                {nb.title}
                              </h4>
                              <p className="text-[11px] text-slate-400">
                                {nb.subject || 'Tổng hợp'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={e => handleToggleFavorite(nb.id, e)}
                              className="p-1.5 text-slate-300 hover:text-amber-500 transition"
                            >
                              <Star size={16} className={nb.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
                            </button>
                            <button
                              onClick={e => handleDeleteNotebook(nb.id, e)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50 dark:border-slate-800/50">
                          <span className="font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                            {nb.sources.length} tài liệu nguồn
                          </span>
                          <span>
                            {nb.generatedQuizzes.length > 0 ? `${nb.generatedQuizzes.length} bộ đề đã tạo` : 'Chưa tạo đề'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table View cho máy tính (hidden md:block) */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50">
                          <th className="py-3 px-4 w-10 text-center">⭐</th>
                          <th className="py-3 px-4">Tên Sổ Ghi Chú</th>
                          <th className="py-3 px-4">Môn Học / Chủ Đề</th>
                          <th className="py-3 px-4 text-center">Số Nguồn</th>
                          <th className="py-3 px-4">Ngày Cập Nhật</th>
                          <th className="py-3 px-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs sm:text-sm">
                        {filteredNotebooks.map(nb => (
                          <tr
                            key={nb.id}
                            onClick={() => setActiveNotebookId(nb.id)}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                          >
                            <td className="py-4 px-4 text-center" onClick={e => handleToggleFavorite(nb.id, e)}>
                              <button className="text-slate-300 hover:text-amber-500 transition">
                                <Star size={16} className={nb.isFavorite ? 'fill-amber-400 text-amber-400' : ''} />
                              </button>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition">
                                  <BookOpen size={18} />
                                </div>
                                <div>
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition block">
                                    {nb.title}
                                  </span>
                                  <span className="text-[11px] text-slate-400">
                                    {nb.generatedQuizzes.length > 0
                                      ? `Đã tạo ${nb.generatedQuizzes.length} bộ đề`
                                      : 'Chưa sinh đề thi'}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                                {nb.subject || 'Tổng hợp'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black text-xs">
                                {nb.sources.length} tài liệu
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-400 text-xs">
                              {new Date(nb.updatedAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => setActiveNotebookId(nb.id)}
                                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-xs transition cursor-pointer"
                                >
                                  Mở Sổ
                                </button>
                                <button
                                  onClick={e => handleDeleteNotebook(nb.id, e)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                  title="Xóa sổ ghi chú"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>

        {/* Modal tạo sổ mới */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Plus size={18} />
                  </div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">Tạo Sổ Ghi Chú Mới</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="space-y-3 text-xs sm:text-sm">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên sổ ghi chú:</label>
                  <input
                    type="text"
                    placeholder="VD: Ôn Tập Dược Lý Lâm Sàng, Vi Sinh 60 Câu..."
                    value={newNotebookTitle}
                    onChange={e => setNewNotebookTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Tên môn học / chuyên đề:</label>
                  <input
                    type="text"
                    placeholder="VD: Dược Lý, Vi Sinh, Giải Phẫu..."
                    value={newNotebookSubject}
                    onChange={e => setNewNotebookSubject(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-medium outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Cấu trúc tài liệu:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewNotebookSourceType('multi_topic')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        newNotebookSourceType === 'multi_topic'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <div className="font-bold">Đa chủ đề / Chương</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">AI tự tách thành các bài nhỏ</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewNotebookSourceType('single_topic')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        newNotebookSourceType === 'single_topic'
                          ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <div className="font-bold">Đơn chủ đề</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Tài liệu tập trung 1 bài</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateNewNotebook}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold shadow-md shadow-blue-500/20"
                >
                  Tạo Sổ & Bắt Đầu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =================================================================
  // GIAO DIỆN 2: WORKSPACE SỔ GHI CHÚ (INSIDE NOTEBOOK - IMAGE 3)
  // =================================================================
  return (
    <div className="w-full h-full max-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 font-sans flex flex-col text-slate-800 dark:text-slate-100">
      {/* Toast thông báo */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-slate-700 animate-fade-in">
          <span>{toastMsg.type === 'success' ? '✅' : toastMsg.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-1">
              <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">AI Đang Xử Lý</h3>
              <p className="text-xs text-slate-500">{loadingStep || 'Vui lòng chờ trong giây lát...'}</p>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR WORKSPACE CHUẨN NOTEBOOKLM */}
      <header className="h-14 sm:h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setActiveNotebookId(null)}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Quay lại danh sách sổ ghi chú"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[9px] sm:text-[10px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 truncate max-w-[120px] sm:max-w-none">
                {activeNotebook.subject || 'Tổng Hợp'}
              </span>
              <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
                {activeNotebook.sources.filter(s => s.active).length} nguồn đang bật
              </span>
            </div>
            <h1 className="font-black text-xs sm:text-base text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-md">
              {activeNotebook.title}
            </h1>
          </div>
        </div>

        {/* ─── 2 CHẾ ĐỘ CỐT LÕI THEO YÊU CẦU: CHAT vs TẠO ĐỀ (DESKTOP) ─── */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => {
              setActiveMode('chat')
              setMobileTab('chat')
            }}
            className={`px-3.5 sm:px-5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'chat'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare size={16} />
            <span>Hỏi Đáp & Trò Chuyện (Chat)</span>
          </button>

          <button
            onClick={() => {
              setActiveMode('studio')
              setMobileTab('studio')
            }}
            className={`px-3.5 sm:px-5 py-2 rounded-xl font-extrabold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeMode === 'studio'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles size={16} />
            <span>Tạo Đề Trắc Nghiệm (Studio)</span>
          </button>
        </div>

        {/* Phím thao tác nhanh */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition flex items-center gap-1"
            title="Tạo sổ mới"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Sổ mới</span>
          </button>
        </div>
      </header>

      {/* ─── THANH ĐIỀU HƯỚNG TAB TRÊN MOBILE (CHUẨN DI ĐỘNG NATIVE) ─── */}
      <div className="md:hidden flex items-center bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-1.5 shrink-0 gap-1.5 z-20 shadow-2xs">
        <button
          onClick={() => setMobileTab('sources')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'sources'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <FileText size={14} />
          <span>Nguồn ({activeNotebook.sources.filter(s => s.active).length})</span>
        </button>

        <button
          onClick={() => {
            setMobileTab('chat')
            setActiveMode('chat')
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'chat'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <MessageSquare size={14} />
          <span>Hỏi đáp</span>
        </button>

        <button
          onClick={() => {
            setMobileTab('studio')
            setActiveMode('studio')
          }}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            mobileTab === 'studio'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles size={14} />
          <span>Tạo đề</span>
        </button>
      </div>

      {/* VÙNG NỘI DUNG CHÍNH (3 CỘT NOTEBOOKLM) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* ─── CỘT TRÁI (320px trên Desktop, Full màn hình trên Mobile khi tab='sources') ─── */}
        <aside className={`${mobileTab === 'sources' ? 'flex w-full' : 'hidden'} md:flex md:w-80 md:shrink-0 h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col justify-between overflow-y-auto p-4 space-y-4 min-h-0`}>
          <div className="space-y-4">
            {/* Header Nguồn */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText size={16} className="text-blue-600" />
                  <span>Nguồn Tài Liệu</span>
                </h2>
                <p className="text-[11px] text-slate-400">PDF, Word, PPT, Text</p>
              </div>

              <button
                onClick={() => setShowAddSourceModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm</span>
              </button>
            </div>

            {/* Danh sách các tài liệu nguồn đã nạp */}
            <div className="space-y-2">
              {activeNotebook.sources.length === 0 ? (
                <div
                  onClick={() => setShowAddSourceModal(true)}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center space-y-2 cursor-pointer hover:border-blue-400 transition"
                >
                  <Upload size={22} className="mx-auto text-slate-400" />
                  <div className="text-xs font-bold text-slate-600 dark:text-slate-300">Chưa có tài liệu nguồn</div>
                  <div className="text-[10px] text-slate-400">Bấm để tải file Word, PDF hoặc dán văn bản</div>
                </div>
              ) : (
                activeNotebook.sources.map(src => (
                  <div
                    key={src.id}
                    className={`p-3 rounded-2xl border transition flex items-start justify-between gap-2.5 ${
                      src.active
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <label className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={src.active}
                        onChange={() => handleToggleSourceActive(src.id)}
                        className="mt-0.5 accent-blue-600 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate">
                          {src.name}
                        </h4>
                        <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                          <span className="uppercase font-bold text-blue-600">{src.type}</span>
                          <span>•</span>
                          <span>~{src.content.length.toLocaleString()} ký tự</span>
                        </div>
                      </div>
                    </label>

                    <button
                      onClick={() => handleDeleteSource(src.id)}
                      className="p-1 text-slate-400 hover:text-red-500 transition"
                      title="Xóa tài liệu"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Mục File Đề Thi Mẫu (Clone phong cách GV) */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span>File Đề Thi Mẫu</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Clone phong cách ra đề của GV</p>
                </div>

                {activeNotebook.sampleExam && (
                  <button
                    onClick={() => updateActiveNotebook(nb => ({ ...nb, sampleExam: undefined }))}
                    className="text-[11px] text-red-500 font-bold hover:underline"
                  >
                    Gỡ bỏ
                  </button>
                )}
              </div>

              {!activeNotebook.sampleExam ? (
                <button
                  onClick={() => setShowSampleExamModal(true)}
                  className="w-full p-2.5 rounded-2xl border border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 text-xs font-bold hover:bg-amber-100/50 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>+ Nạp đề mẫu (PDF, Word)</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-300 truncate">
                      {activeNotebook.sampleExam.name}
                    </span>
                    <span className="text-[10px] bg-amber-500 text-white font-black px-1.5 py-0.5 rounded">
                      CLONE ACTIVE
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400">
                    AI sẽ bám sát phong cách đặt câu, cách gài bẫy và cấu trúc 4 phương án của đề này.
                  </p>
                </div>
              )}
            </div>

            {/* Mục Chủ Đề Kiến Thức */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                    <Layers size={14} className="text-emerald-600" />
                    <span>Chủ Đề Kiến Thức</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">Tick chọn để tạo trắc nghiệm</p>
                </div>

                <button
                  onClick={handleExtractTopics}
                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles size={12} />
                  <span>{activeNotebook.topics.length > 0 ? 'Phân tích lại' : 'Tách chủ đề'}</span>
                </button>
              </div>

              {activeNotebook.topics.length > 0 && (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {activeNotebook.topics.map(top => (
                    <label
                      key={top.id}
                      className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={top.selected}
                        onChange={() => {
                          updateActiveNotebook(nb => ({
                            ...nb,
                            topics: nb.topics.map(t => t.id === top.id ? { ...t, selected: !t.selected } : t)
                          }))
                        }}
                        className="mt-0.5 accent-emerald-600 cursor-pointer"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                        {top.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Nút hành động nhanh trên mobile sau khi quản lý nguồn */}
            <div className="md:hidden pt-4 pb-2 border-t border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
              <button
                onClick={() => {
                  setMobileTab('chat')
                  setActiveMode('chat')
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <MessageSquare size={15} />
                <span>Mở khung Hỏi đáp về tài liệu</span>
              </button>
              <button
                onClick={() => {
                  setMobileTab('studio')
                  setActiveMode('studio')
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Sparkles size={15} />
                <span>Chuyển sang Tạo đề trắc nghiệm</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ─── VÙNG TRUNG TÂM / PHẢI: PHỤ THUỘC VÀO ACTIVE MODE ─── */}
        <div className={`${mobileTab !== 'sources' ? 'flex w-full' : 'hidden'} md:flex flex-1 min-h-0 overflow-hidden bg-slate-100/50 dark:bg-slate-950`}>
          {/* ========================================================= */}
          {/* CHẾ ĐỘ 1: 💬 HỎI ĐÁP & TRÒ CHUYỆN (CHAT)                  */}
          {/* TẮT HOÀN TOÀN SETUP TẠO TRẮC NGHIỆM ĐỂ CHAT THOÁNG ĐẸP     */}
          {/* ========================================================= */}
          {activeMode === 'chat' && (
            <div className="flex-1 min-h-0 flex flex-col h-full bg-white dark:bg-slate-900 overflow-hidden">
              {/* Header Chat */}
              <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 shrink-0 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                    💬
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                      Tra Cứu & Đối Thoại Tài Liệu Nguồn
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-400 truncate">
                      100% dựa trên {activeNotebook.sources.filter(s => s.active).length} tài liệu đang kích hoạt • Không ảo giác
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setChatMessages([])}
                  className="px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-bold text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
                >
                  Xóa chat
                </button>
              </div>

              {/* Danh sách tin nhắn Chat */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-16 px-4 space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 mx-auto flex items-center justify-center text-2xl shadow-sm">
                      💡
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-slate-800 dark:text-slate-100">
                        Đặt câu hỏi bất kỳ về tài liệu nguồn
                      </h4>
                      <p className="text-xs text-slate-400 max-w-md mx-auto">
                        AI sẽ đọc sâu toàn bộ giáo trình của bạn để giải thích cặn kẽ, trích dẫn chính xác và xâu chuỗi bản chất vấn đề.
                      </p>
                    </div>

                    {/* Gợi ý câu hỏi nhanh (Quick Chips) */}
                    <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-lg mx-auto">
                      {[
                        'Tóm tắt các kiến thức cốt lõi nhất của tài liệu',
                        'Giải thích các cơ chế hoạt động chính cho dễ hiểu',
                        'Chỉ ra các điểm quan trọng rất dễ bị nhầm lẫn trong bài thi'
                      ].map((prompt, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => {
                            setChatInput(prompt)
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition cursor-pointer"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1 animate-fade-in`}
                    >
                      <div className="text-[10px] text-slate-400 font-bold px-1">
                        {msg.role === 'user' ? 'Bạn' : 'NoteBook ND AI'} {msg.time ? `• ${msg.time}` : ''}
                      </div>

                      <div
                        className={`p-4 sm:p-5 rounded-3xl max-w-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-tr-sm'
                            : 'bg-slate-50 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm w-full'
                        }`}
                      >
                        {msg.role === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        ) : (
                          <div>
                            {/* RENDER RICH MARKDOWN HOÀN HẢO - KHÔNG CÒN LỖI **, // */}
                            <RichMarkdownRenderer content={msg.text} />

                            {/* Công cụ dưới mỗi câu trả lời */}
                            <div className="mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-400">
                              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Trích từ nguồn tài liệu
                              </span>

                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.text)
                                  setCopiedIndex(i)
                                  setTimeout(() => setCopiedIndex(null), 2000)
                                }}
                                className="flex items-center gap-1 hover:text-blue-600 transition font-bold"
                              >
                                {copiedIndex === i ? (
                                  <>
                                    <Check size={12} className="text-emerald-600" />
                                    <span className="text-emerald-600">Đã sao chép</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={12} />
                                    <span>Sao chép</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {isChatting && (
                  <div className="flex items-center gap-3 p-4 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-w-md animate-pulse">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                      AI đang phân tích tài liệu để trả lời...
                    </span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Khung nhập Chat bo tròn Pill chuẩn NotebookLM */}
              <div className="p-2.5 sm:p-4 shrink-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-4xl mx-auto flex items-center gap-2 sm:gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 sm:p-2 rounded-full border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition shadow-2xs">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                    placeholder="Hỏi bất kỳ điều gì từ tài liệu nguồn..."
                    disabled={isChatting}
                    className="flex-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 outline-none placeholder-slate-400 min-w-0"
                  />

                  <div className="flex items-center gap-1.5 sm:gap-2 pr-1 shrink-0">
                    <span className="text-[10px] font-bold text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 hidden sm:inline">
                      {activeNotebook.sources.filter(s => s.active).length} nguồn
                    </span>

                    <button
                      onClick={handleSendChat}
                      disabled={isChatting || !chatInput.trim()}
                      className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition disabled:opacity-40 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95 shrink-0"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* CHẾ ĐỘ 2: 📝 TẠO ĐỀ TRẮC NGHIỆM (STUDIO)                   */}
          {/* TẮT CHAT, TẬP TRUNG SETUP & XUẤT BẢN BỘ CÂU HỎI            */}
          {/* ========================================================= */}
          {activeMode === 'studio' && (
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 p-3 sm:p-6 overflow-y-auto">
              {/* ─── CỘT CÀI ĐẶT TẠO ĐỀ (5 Cols) ─── */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                        <SlidersHorizontal size={18} className="text-blue-600" />
                        <span>Cài Đặt Tạo Đề Trắc Nghiệm</span>
                      </h3>
                      <p className="text-xs text-slate-400">Tùy biến số lượng và độ khó theo yêu cầu</p>
                    </div>
                  </div>

                  {/* 1. SỐ LƯỢNG CÂU HỎI - CÓ Ô NHẬP SỐ TỰ DO THEO YÊU CẦU */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-slate-800 dark:text-slate-200">
                        Số lượng câu hỏi muốn tạo:
                      </label>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={activeNotebook.quizConfig.questionCount || ''}
                          onChange={e => {
                            const raw = e.target.value
                            if (raw === '') {
                              updateActiveNotebook(nb => ({
                                ...nb,
                                quizConfig: { ...nb.quizConfig, questionCount: 0 }
                              }))
                              return
                            }
                            const val = parseInt(raw)
                            if (!isNaN(val)) {
                              updateActiveNotebook(nb => ({
                                ...nb,
                                quizConfig: { ...nb.quizConfig, questionCount: Math.min(100, Math.max(1, val)) }
                              }))
                            }
                          }}
                          onBlur={() => {
                            if (!activeNotebook.quizConfig.questionCount || activeNotebook.quizConfig.questionCount < 1) {
                              updateActiveNotebook(nb => ({
                                ...nb,
                                quizConfig: { ...nb.quizConfig, questionCount: 20 }
                              }))
                            }
                          }}
                          className="w-16 px-2 py-1 rounded-xl border border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-center text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-500">câu</span>
                      </div>
                    </div>

                    {/* Các nút chọn nhanh */}
                    <div className="grid grid-cols-6 gap-1.5">
                      {[10, 20, 30, 40, 50, 60].map(cnt => (
                        <button
                          key={cnt}
                          type="button"
                          onClick={() => {
                            updateActiveNotebook(nb => ({
                              ...nb,
                              quizConfig: { ...nb.quizConfig, questionCount: cnt }
                            }))
                          }}
                          className={`py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                            activeNotebook.quizConfig.questionCount === cnt
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {cnt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. TỈ LỆ ĐỘ KHÓ */}
                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      Tỉ lệ mức độ tư duy:
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600 dark:text-slate-300">Nhận biết & Thông hiểu</span>
                          <span className="font-black text-emerald-600">{activeNotebook.quizConfig.easyMediumPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={activeNotebook.quizConfig.easyMediumPercent}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0
                            updateActiveNotebook(nb => ({
                              ...nb,
                              quizConfig: {
                                ...nb.quizConfig,
                                easyMediumPercent: val,
                                hardPercent: 100 - val
                              }
                            }))
                          }}
                          className="w-full accent-emerald-600 cursor-pointer"
                        />
                      </div>

                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600 dark:text-slate-300">Vận dụng & Vận dụng cao</span>
                          <span className="font-black text-purple-600">{activeNotebook.quizConfig.hardPercent}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={activeNotebook.quizConfig.hardPercent}
                          onChange={e => {
                            const val = parseInt(e.target.value) || 0
                            updateActiveNotebook(nb => ({
                              ...nb,
                              quizConfig: {
                                ...nb.quizConfig,
                                hardPercent: val,
                                easyMediumPercent: 100 - val
                              }
                            }))
                          }}
                          className="w-full accent-purple-600 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. GHI CHÚ BỔ SUNG */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                      Ghi chú / Yêu cầu thêm cho AI:
                    </label>
                    <textarea
                      rows={2}
                      placeholder="VD: Tập trung vào các bẫy câu hỏi đảo chiều, xoáy sâu vào phân biệt các nhóm thuốc..."
                      value={activeNotebook.quizConfig.customNotes}
                      onChange={e => {
                        updateActiveNotebook(nb => ({
                          ...nb,
                          quizConfig: { ...nb.quizConfig, customNotes: e.target.value }
                        }))
                      }}
                      className="w-full p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {/* NÚT BẮT ĐẦU TẠO ĐỀ */}
                  <button
                    onClick={handleGenerateQuiz}
                    disabled={loading || activeNotebook.sources.filter(s => s.active).length === 0}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-500/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles size={18} />
                    <span>TẠO {activeNotebook.quizConfig.questionCount} CÂU TRẮC NGHIỆM AI</span>
                  </button>
                </div>
              </div>

              {/* ─── CỘT KẾT QUẢ & CÔNG CỤ XUẤT BẢN (7 Cols) ─── */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">
                        Bộ Câu Hỏi Trắc Nghiệm Đã Tạo
                      </h3>
                      <p className="text-xs text-slate-400">
                        {latestQuiz ? `${latestQuiz.questionCount} câu hỏi chuẩn xác` : 'Chưa có kết quả'}
                      </p>
                    </div>

                    <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 flex text-xs font-bold">
                      <button
                        onClick={() => setOutputTab('preview')}
                        className={`px-3 py-1 rounded-lg transition ${
                          outputTab === 'preview'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Trực quan
                      </button>
                      <button
                        onClick={() => setOutputTab('markdown')}
                        className={`px-3 py-1 rounded-lg transition ${
                          outputTab === 'markdown'
                            ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-xs'
                            : 'text-slate-500'
                        }`}
                      >
                        Soạn thảo / Raw
                      </button>
                    </div>
                  </div>

                  {/* 3 NÚT CÔNG CỤ THEO ĐÚNG YÊU CẦU: COPY, TẠO BÀI TEST, TẢI WORD */}
                  {latestQuiz && (
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={handleCopyQuestions}
                        className="py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 font-black text-xs text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <Copy size={15} />
                        <span>Sao chép</span>
                      </button>

                      <button
                        onClick={handleImportToTestCreator}
                        className="py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                        title="Tự động nạp toàn bộ câu hỏi vào hệ thống Soạn thảo Đề thi của Dzota"
                      >
                        <Zap size={15} />
                        <span>TẠO BÀI TEST</span>
                      </button>

                      <button
                        onClick={handleExportDocx}
                        className="py-2.5 px-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
                      >
                        <Download size={15} />
                        <span>Tải file Word</span>
                      </button>
                    </div>
                  )}

                  {/* Nội dung câu hỏi */}
                  {!latestQuiz ? (
                    <div className="py-20 text-center space-y-3">
                      <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center text-xl">
                        📝
                      </div>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Hãy bấm nút "TẠO CÂU TRẮC NGHIỆM AI" ở cột bên trái để bắt đầu sinh bộ đề thi chuyên sâu từ tài liệu nguồn!
                      </p>
                    </div>
                  ) : outputTab === 'preview' ? (
                    <div className="max-h-[560px] overflow-y-auto space-y-4 pr-1">
                      {latestQuiz.markdown
                        .split(/(?:^|\n)(?=Câu\s*\d+[\.:])/i)
                        .filter(c => c.trim().length > 0)
                        .map((block, qIdx) => {
                          const lines = block.trim().split('\n')
                          const qTitle = lines[0] || `Câu ${qIdx + 1}`
                          const isOptLine = (l: string) => /^(?:\*\*|\*)?\s*[A-D][\.\)]/i.test(l.trim())
                          const options = lines.slice(1).filter(l => isOptLine(l))
                          const explanationLines = lines.slice(1).filter(l => !isOptLine(l) && l.trim().length > 0)

                          return (
                            <div
                              key={qIdx}
                              className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-2.5"
                            >
                              <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white leading-relaxed">
                                {qTitle}
                              </h4>

                              <div className="space-y-1.5 pl-2">
                                {options.map((opt, oIdx) => {
                                  const isCorrect = opt.includes('**') || /^\*\*[A-D]\./i.test(opt.trim())
                                  const cleanOpt = opt.replace(/\*\*/g, '').trim()

                                  return (
                                    <div
                                      key={oIdx}
                                      className={`p-2 rounded-xl text-xs transition flex items-start gap-2 ${
                                        isCorrect
                                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-extrabold'
                                          : 'text-slate-700 dark:text-slate-300'
                                      }`}
                                    >
                                      {isCorrect && (
                                        <CheckCircle2 size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                                      )}
                                      <span>{cleanOpt}</span>
                                    </div>
                                  )
                                })}
                              </div>

                              {explanationLines.length > 0 && (
                                <div className="mt-2.5 p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-xs text-amber-950 dark:text-amber-200 leading-relaxed">
                                  <span className="font-black text-amber-800 dark:text-amber-300">💡 Giải thích chi tiết: </span>
                                  <span>{explanationLines.join(' ').replace(/^[*#\s]*(?:Giải thích|Lời giải)[:\s-]*/i, '')}</span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                    </div>
                  ) : (
                    <textarea
                      rows={18}
                      readOnly
                      value={latestQuiz.markdown}
                      className="w-full p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 outline-none resize-none"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MODAL THÊM NGUỒN TÀI LIỆU ─────────────────────────────── */}
      {showAddSourceModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-black text-base text-slate-900 dark:text-white">Thêm Nguồn Tài Liệu</h3>
              <button onClick={() => setShowAddSourceModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSourceInputType('file')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
                  sourceInputType === 'file' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Tải tệp lên (PDF, Word, PPT)
              </button>
              <button
                onClick={() => setSourceInputType('text')}
                className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${
                  sourceInputType === 'text' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                }`}
              >
                Nhập văn bản trực tiếp
              </button>
            </div>

            {sourceInputType === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 text-center space-y-2 cursor-pointer hover:bg-blue-100/50 transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Upload size={32} className="mx-auto text-blue-600" />
                <div className="text-xs sm:text-sm font-extrabold text-blue-900 dark:text-blue-300">
                  Chọn hoặc thả tài liệu vào đây
                </div>
                <div className="text-[11px] text-slate-500">
                  Hỗ trợ định dạng PDF, Word (docx, doc), PowerPoint (pptx, ppt), Text
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Tên tài liệu / Tiêu đề văn bản..."
                  value={manualTextTitle}
                  onChange={e => setManualTextTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold outline-none"
                />
                <textarea
                  rows={8}
                  placeholder="Dán toàn bộ nội dung tài liệu nguồn vào đây..."
                  value={manualTextContent}
                  onChange={e => setManualTextContent(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs outline-none resize-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowAddSourceModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddManualText}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-500/20"
                  >
                    Thêm Nguồn
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL NẠP ĐỀ THI MẪU ─────────────────────────────────── */}
      {showSampleExamModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-500 fill-amber-500" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">Nạp Đề Mẫu (Clone Phong Cách)</h3>
              </div>
              <button onClick={() => setShowSampleExamModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <p className="text-xs text-slate-500">
              Tải lên file đề thi mẫu của giảng viên để AI học hỏi cách đặt câu, bẫy tâm lý và cách chia 4 phương án tương đương.
            </p>

            <div
              onClick={() => sampleExamInputRef.current?.click()}
              className="p-8 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-center space-y-2 cursor-pointer hover:bg-amber-100/50 transition"
            >
              <input
                type="file"
                ref={sampleExamInputRef}
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleSampleExamUpload}
                className="hidden"
              />
              <FileUp size={32} className="mx-auto text-amber-600" />
              <div className="text-xs sm:text-sm font-extrabold text-amber-900 dark:text-amber-300">
                Tải lên file đề mẫu (PDF, Word)
              </div>
              <div className="text-[11px] text-slate-400">Hỗ trợ .docx, .doc, .pdf</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
