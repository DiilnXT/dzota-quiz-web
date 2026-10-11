'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  SlidersHorizontal
} from 'lucide-react'

interface SourceItem {
  id: string
  name: string
  type: 'text' | 'pdf' | 'docx' | 'pptx' | 'file'
  content: string
  size?: number
  addedAt: number
  active: boolean
}

interface TopicItem {
  id: string
  name: string
  summary?: string
  selected: boolean
}

interface GeneratedQuiz {
  id: string
  title: string
  createdAt: number
  markdown: string
  questionCount: number
  selectedTopics: string[]
}

interface NotebookItem {
  id: string
  title: string
  subject: string
  createdAt: number
  updatedAt: number
  sourceType: 'single_topic' | 'multi_topic'
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

interface NoteBookNDTabProps {
  currentUser?: any
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

export default function NoteBookNDTab({ currentUser, showToast }: NoteBookNDTabProps) {
  // --- STATE ---
  const [notebooks, setNotebooks] = useState<NotebookItem[]>([])
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState<string>('')

  // View inside notebook: 'generator' (tạo đề) or 'chat' (hỏi đáp)
  const [workspaceMode, setWorkspaceMode] = useState<'generator' | 'chat'>('generator')
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
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; text: string }[]>([])
  const [isChatting, setIsChatting] = useState(false)

  // Copy indicator
  const [copied, setCopied] = useState(false)

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null)
  const sampleExamInputRef = useRef<HTMLInputElement>(null)

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

  // Load Notebooks from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('dzota_notebook_nd_store')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotebooks(parsed)
          return
        }
      }
    } catch (e) {
      console.warn('Lỗi đọc sổ ghi chú NoteBook ND:', e)
    }

    // Default sample notebook
    const sampleNotebook: NotebookItem = {
      id: 'nb_sample_1',
      title: 'Ôn Thi Vi Sinh & Miễn Dịch Học',
      subject: 'Vi Sinh - Ký Sinh Trùng',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now(),
      sourceType: 'multi_topic',
      sources: [
        {
          id: 'src_1',
          name: 'GiaoTrinh_ViSinh_ChuyenDe1.docx',
          type: 'docx',
          content: `Chương 1: Đại cương về vi khuẩn.
Vi khuẩn là sinh vật đơn bào, nhân sơ (procaryote), không có màng nhân, kích thước từ 0.2 - 2.0 micromet.
Cấu trúc cơ bản gồm: vách tế bào, màng bào tương, bào tương, vùng nhân (ADN xoắn kép dạng vòng đơn).
Vách tế bào vi khuẩn Gram dương có lớp peptidoglycan dày (40-80 lớp), chứa acid teichoic.
Vách tế bào vi khuẩn Gram âm có lớp peptidoglycan mỏng (1-2 lớp), có màng ngoài chứa lipopolysaccharide (LPS - nội độc tố).
Chương 2: Độc tố vi khuẩn.
Ngoại độc tố (exotoxin): do vi khuẩn Gram dương và một số Gram âm tiết ra khi còn sống. Bản chất là protein, có tính kháng nguyên mạnh, bị phá hủy bởi nhiệt độ, có thể chế thành giải độc tố (anatoxin) làm vaccine.
Nội độc tố (endotoxin): giải phóng khi vi khuẩn bị ly giải, bản chất là LPS của vách Gram âm. Kém chịu nhiệt, không thể chế thành giải độc tố.`,
          size: 1024,
          addedAt: Date.now(),
          active: true
        }
      ],
      topics: [
        { id: 'tp_1', name: 'Đại cương & Cấu trúc vi khuẩn (Gram dương & Gram âm)', summary: 'Phân biệt vách, peptidoglycan, acid teichoic và màng ngoài LPS', selected: true },
        { id: 'tp_2', name: 'Độc tố vi khuẩn (Ngoại độc tố & Nội độc tố)', summary: 'So sánh bản chất protein vs LPS, tính chịu nhiệt và khả năng chế giải độc tố', selected: true }
      ],
      quizConfig: {
        questionCount: 15,
        easyMediumPercent: 60,
        hardPercent: 40,
        customNotes: 'Xoáy sâu vào phân biệt vách vi khuẩn Gram (+) và (-); so sánh chi tiết ngoại độc tố và nội độc tố.'
      },
      generatedQuizzes: []
    }

    setNotebooks([sampleNotebook])
    try {
      localStorage.setItem('dzota_notebook_nd_store', JSON.stringify([sampleNotebook]))
    } catch (e) {}
  }, [])

  // Auto-save notebooks to localStorage
  const saveNotebooks = (updated: NotebookItem[]) => {
    setNotebooks(updated)
    try {
      localStorage.setItem('dzota_notebook_nd_store', JSON.stringify(updated))
    } catch (e) {}
  }

  // Active notebook helper
  const activeNotebook = notebooks.find(n => n.id === activeNotebookId) || null

  const updateActiveNotebook = (updater: (prev: NotebookItem) => NotebookItem) => {
    if (!activeNotebookId) return
    const updated = notebooks.map(n => {
      if (n.id === activeNotebookId) {
        return updater(n)
      }
      return n
    })
    saveNotebooks(updated)
  }

  // --- ACTIONS: SỔ GHI CHÚ ---
  const handleCreateNotebook = () => {
    if (!newNotebookTitle.trim()) {
      showToast('Vui lòng nhập tên sổ ghi chú!', 'warning')
      return
    }
    const newNb: NotebookItem = {
      id: `nb_${Date.now()}`,
      title: newNotebookTitle.trim(),
      subject: newNotebookSubject.trim() || 'Tổng quát',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceType: newNotebookSourceType,
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

    saveNotebooks([newNb, ...notebooks])
    setActiveNotebookId(newNb.id)
    setShowCreateModal(false)
    setNewNotebookTitle('')
    setNewNotebookSubject('')
    showToast(`Đã tạo sổ ghi chú "${newNb.title}"!`, 'success')
  }

  const handleDeleteNotebook = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm('Bạn có chắc chắn muốn xóa sổ ghi chú này? Mọi tài liệu và câu hỏi trong sổ sẽ bị xóa.')) return
    const filtered = notebooks.filter(n => n.id !== id)
    saveNotebooks(filtered)
    if (activeNotebookId === id) setActiveNotebookId(null)
    showToast('Đã xóa sổ ghi chú!', 'info')
  }

  // --- TRÍCH XUẤT NỘI DUNG FILE (CLIENT-SIDE) ---
  const extractTextFromFile = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || ''

    // 1. Text/Markdown
    if (['txt', 'md', 'json', 'csv'].includes(ext)) {
      return await file.text()
    }

    // 2. Word (.docx)
    if (ext === 'docx') {
      const buffer = await file.arrayBuffer()
      const win = window as any
      if (win.mammoth) {
        const res = await win.mammoth.extractRawText({ arrayBuffer: buffer })
        return res.value || ''
      }
      // Fallback text
      return await file.text()
    }

    // 3. PowerPoint (.pptx)
    if (ext === 'pptx') {
      const win = window as any
      if (win.JSZip) {
        const zip = await win.JSZip.loadAsync(file)
        let fullText = ''
        const slideFiles = Object.keys(zip.files).filter(name => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
        slideFiles.sort()
        for (let i = 0; i < slideFiles.length; i++) {
          const slideName = slideFiles[i]
          const xml = await zip.file(slideName).async('string')
          const matches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi)
          if (matches) {
            const slideText = matches.map((m: string) => m.replace(/<[^>]+>/g, '')).join(' ')
            fullText += `[Slide ${i + 1}]: ${slideText}\n\n`
          }
        }
        return fullText.trim()
      }
    }

    // 4. PDF (.pdf)
    if (ext === 'pdf') {
      const win = window as any
      if (win.pdfjsLib) {
        try {
          win.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
          const buffer = await file.arrayBuffer()
          const loadingTask = win.pdfjsLib.getDocument({ data: buffer })
          const pdf = await loadingTask.promise
          let fullText = ''
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i)
            const textContent = await page.getTextContent()
            const pageText = textContent.items.map((item: any) => item.str).join(' ')
            fullText += `[Trang ${i}]: ${pageText}\n\n`
          }
          if (fullText.trim().length > 0) return fullText.trim()
        } catch (e) {
          console.warn('Lỗi parse PDF client, fallback text:', e)
        }
      }
    }

    // Default fallback
    return await file.text()
  }

  // --- THÊM NGUỒN TÀI LIỆU ---
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
          showToast(`File ${file.name} không trích xuất được chữ hoặc file rỗng!`, 'warning')
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

  // --- UPLOAD ĐỀ MẪU CỦA GIÁO VIÊN ---
  const handleSampleExamUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeNotebook) return

    setLoading(true)
    setLoadingStep('Đang đọc cấu trúc đề thi mẫu...')

    try {
      const text = await extractTextFromFile(file)
      if (!text || text.trim().length < 20) {
        showToast('File đề mẫu không có nội dung chữ!', 'warning')
        return
      }

      updateActiveNotebook(nb => ({
        ...nb,
        sampleExam: {
          name: file.name,
          type: file.name.split('.').pop() || 'doc',
          content: text
        }
      }))
      showToast(`Đã nhận diện đề mẫu: "${file.name}"! AI sẽ clone phong cách ra đề của giáo viên.`, 'success')
      setShowSampleExamModal(false)
    } catch (err: any) {
      showToast(`Lỗi đọc file đề mẫu: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setLoadingStep('')
      if (e.target) e.target.value = ''
    }
  }

  const handleSaveManualSampleExam = () => {
    if (!sampleExamContent.trim() || !activeNotebook) {
      showToast('Vui lòng nhập nội dung câu hỏi đề mẫu!', 'warning')
      return
    }

    updateActiveNotebook(nb => ({
      ...nb,
      sampleExam: {
        name: sampleExamTitle.trim() || 'Đề thi mẫu giáo viên',
        type: 'text',
        content: sampleExamContent.trim()
      }
    }))
    setSampleExamTitle('')
    setSampleExamContent('')
    setShowSampleExamModal(false)
    showToast('Đã lưu đề mẫu giáo viên thành công!', 'success')
  }

  const handleRemoveSampleExam = () => {
    updateActiveNotebook(nb => {
      const copy = { ...nb }
      delete copy.sampleExam
      return copy
    })
    showToast('Đã gỡ bỏ đề mẫu.', 'info')
  }

  // --- PHÂN TÍCH TÁCH CHỦ ĐỀ AI (ACTION: EXTRACT_TOPICS) ---
  const handleExtractTopics = async () => {
    if (!activeNotebook) return
    const activeSources = activeNotebook.sources.filter(s => s.active)
    if (activeSources.length === 0) {
      showToast('Vui lòng bật ít nhất 1 tài liệu nguồn để phân tích chủ đề!', 'warning')
      return
    }

    setLoading(true)
    setLoadingStep('AI đang đọc toàn bộ tài liệu nguồn để bóc tách chủ đề kiến thức...')

    const combinedContent = activeSources.map(s => `=== TÀI LIỆU: ${s.name} ===\n${s.content}`).join('\n\n')

    try {
      const res = await fetch('/api/notebook-nd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extract_topics',
          subjectName: activeNotebook.subject,
          sourceContent: combinedContent
        })
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi phân tích chủ đề')
      }

      if (Array.isArray(data.topics) && data.topics.length > 0) {
        const formattedTopics: TopicItem[] = data.topics.map((t: any, idx: number) => ({
          id: t.id || `topic_${idx + 1}`,
          name: t.name || `Chủ đề ${idx + 1}`,
          summary: t.summary || '',
          selected: true
        }))

        updateActiveNotebook(nb => ({
          ...nb,
          topics: formattedTopics,
          updatedAt: Date.now()
        }))
        showToast(`AI đã bóc tách thành công ${formattedTopics.length} chủ đề chuyên sâu!`, 'success')
      } else {
        showToast('AI không tìm thấy các chủ đề cụ thể trong tài liệu.', 'warning')
      }
    } catch (err: any) {
      showToast(`Lỗi phân tích: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  const handleToggleTopic = (topicId: string) => {
    updateActiveNotebook(nb => ({
      ...nb,
      topics: nb.topics.map(t => t.id === topicId ? { ...t, selected: !t.selected } : t)
    }))
  }

  const handleToggleSelectAllTopics = (select: boolean) => {
    updateActiveNotebook(nb => ({
      ...nb,
      topics: nb.topics.map(t => ({ ...t, selected: select }))
    }))
  }

  // --- TẠO BỘ TRẮC NGHIỆM CHUYÊN SÂU (ACTION: GENERATE_QUIZ) ---
  const handleGenerateQuiz = async () => {
    if (!activeNotebook) return
    const activeSources = activeNotebook.sources.filter(s => s.active)
    if (activeSources.length === 0) {
      showToast('Vui lòng thêm và bật ít nhất 1 tài liệu nguồn để tạo đề!', 'warning')
      return
    }

    const selectedTopicsList = activeNotebook.topics.filter(t => t.selected).map(t => t.name)
    if (activeNotebook.sourceType === 'multi_topic' && activeNotebook.topics.length > 0 && selectedTopicsList.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 chủ đề để tạo câu hỏi trắc nghiệm!', 'warning')
      return
    }

    setLoading(true)
    setLoadingStep('AI đang đọc kỹ từng chi tiết nhỏ, phân bổ các tầng tư duy & clone phong cách đề...')

    const combinedContent = activeSources.map(s => `=== TÀI LIỆU: ${s.name} ===\n${s.content}`).join('\n\n')

    try {
      const res = await fetch('/api/notebook-nd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_quiz',
          subjectName: activeNotebook.subject,
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
      if (!res.ok) {
        throw new Error(data.error || 'Lỗi tạo đề trắc nghiệm')
      }

      const generatedMarkdown = data.result || ''
      if (!generatedMarkdown.trim()) {
        throw new Error('AI không trả về nội dung câu hỏi!')
      }

      // Đếm số câu hỏi thực tế tạo được
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
        generatedQuizzes: [newQuiz, ...nb.generatedQuizzes],
        updatedAt: Date.now()
      }))

      showToast(`Đã tạo thành công bộ trắc nghiệm chuyên sâu ${count} câu!`, 'success')
      setOutputTab('preview')
    } catch (err: any) {
      showToast(`Lỗi tạo trắc nghiệm: ${err.message}`, 'error')
    } finally {
      setLoading(false)
      setLoadingStep('')
    }
  }

  // --- THAO TÁC VỚI KẾT QUẢ ĐÃ TẠO (COPY, TẠO BÀI TEST, XUẤT WORD) ---
  const latestQuiz = activeNotebook?.generatedQuizzes?.[0] || null

  const handleCopyMarkdown = () => {
    if (!latestQuiz?.markdown) return
    navigator.clipboard.writeText(latestQuiz.markdown)
    setCopied(true)
    showToast('Đã sao chép toàn bộ bộ câu hỏi trắc nghiệm vào Clipboard!', 'success')
    setTimeout(() => setCopied(false), 2000)
  }

  // Nút TẠO BÀI TEST: Tự động import tất cả các câu vào ô soạn thảo
  const handleCreateTestFromNotebook = () => {
    if (!latestQuiz?.markdown || !activeNotebook) return

    try {
      // 1. Lưu nội dung câu hỏi và cấu hình bài thi vào localStorage
      localStorage.setItem('dzota_pending_import_quiz', latestQuiz.markdown)
      localStorage.setItem('dzota_pending_import_title', activeNotebook.title)
      localStorage.setItem('dzota_pending_import_category', activeNotebook.subject || 'Chung')

      showToast('Đang chuyển sang trình tạo bài thi Dzota và tự động nạp câu hỏi...', 'info')

      // 2. Chuyển hướng sang /creator (giao diện tạo bài test chuẩn)
      setTimeout(() => {
        window.location.href = '/creator?import=notebook_nd'
      }, 300)
    } catch (e: any) {
      showToast(`Lỗi khởi tạo bài test: ${e.message}`, 'error')
    }
  }

  // Xuất file Word (.docx) chuẩn theo yêu cầu
  const handleExportDocx = () => {
    if (!latestQuiz?.markdown || !activeNotebook) return

    const win = window as any
    if (!win.docx) {
      showToast('Đang nạp thư viện Word... Vui lòng thử lại sau 2 giây!', 'warning')
      return
    }

    try {
      const { Document, Paragraph, TextRun, HeadingLevel, AlignmentType, Packer } = win.docx

      const lines = latestQuiz.markdown.split('\n')
      const paragraphs: any[] = []

      // Title
      paragraphs.push(
        new Paragraph({
          text: `ĐỀ THI TRẮC NGHIỆM: ${activeNotebook.title.toUpperCase()}`,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        })
      )

      paragraphs.push(
        new Paragraph({
          text: `Môn học: ${activeNotebook.subject} | Số câu: ${latestQuiz.questionCount} câu | Tạo bởi: NoteBook ND`,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })
      )

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) {
          paragraphs.push(new Paragraph({ text: '', spacing: { after: 100 } }))
          continue
        }

        const isQuestion = /^Câu\s*\d+[\.:]/i.test(line)
        const isBoldOption = line.startsWith('**') && line.endsWith('**')

        if (isQuestion) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: true,
                  size: 26,
                  font: 'Times New Roman'
                })
              ],
              spacing: { before: 200, after: 120 }
            })
          )
        } else if (isBoldOption) {
          // Đáp án đúng in đậm toàn bộ
          const cleanOpt = line.replace(/^\*\*|\*\*$/g, '')
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: cleanOpt,
                  bold: true,
                  size: 24,
                  font: 'Times New Roman',
                  color: '1a56db'
                })
              ],
              indent: { left: 400 },
              spacing: { after: 80 }
            })
          )
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  bold: false,
                  size: 24,
                  font: 'Times New Roman'
                })
              ],
              indent: { left: 400 },
              spacing: { after: 80 }
            })
          )
        }
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: paragraphs
          }
        ]
      })

      Packer.toBlob(doc).then((blob: Blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${activeNotebook.title}_TrắcNghiệm_NoteBookND.docx`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        showToast('Đã tải xuống file Word (.docx) thành công!', 'success')
      })
    } catch (err: any) {
      showToast(`Lỗi xuất file Word: ${err.message}`, 'error')
    }
  }

  // --- CHAT WITH SOURCE (ACTION: CHAT) ---
  const handleSendChat = async () => {
    if (!chatInput.trim() || !activeNotebook || isChatting) return

    const q = chatInput.trim()
    setChatInput('')
    setChatMessages(prev => [...prev, { role: 'user', text: q }])
    setIsChatting(true)

    const activeSources = activeNotebook.sources.filter(s => s.active)
    const combinedContent = activeSources.map(s => `=== TÀI LIỆU: ${s.name} ===\n${s.content}`).join('\n\n')

    try {
      const res = await fetch('/api/notebook-nd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          subjectName: activeNotebook.subject,
          sourceContent: combinedContent,
          chatPrompt: q
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Lỗi phản hồi')

      setChatMessages(prev => [...prev, { role: 'assistant', text: data.result || 'Không có câu trả lời.' }])
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: 'assistant', text: `⚠️ Lỗi: ${e.message}` }])
    } finally {
      setIsChatting(false)
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER 1: DANH SÁCH SỔ GHI CHÚ (NOTEBOOK LIST VIEW - NOTEBOOKLM STYLE)
  // ──────────────────────────────────────────────────────────────────────────
  if (!activeNotebookId) {
    const filteredNotebooks = notebooks.filter(n =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subject.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
      <div className="space-y-6 animate-fade-in pb-16">
        {/* Top Banner NotebookLM Style */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-bold border border-blue-400/30 backdrop-blur-md">
                <Sparkles size={14} className="text-cyan-300 animate-pulse" />
                <span>NoteBook ND • AI Studio Chuẩn Sư Phạm</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                Sổ Ghi Chú & Ngân Hàng Câu Hỏi AI
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                Tải lên tài liệu (PDF, Word, PowerPoint, Text) và Đề mẫu của giáo viên. AI sẽ tự động phân tích chi tiết, bóc tách các chủ đề và sinh bộ câu hỏi trắc nghiệm đa tầng tư duy bám sát 100% tài liệu.
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all cursor-pointer"
            >
              <Plus size={18} />
              <span>Tạo sổ ghi chú mới</span>
            </button>
          </div>
        </div>

        {/* Search & Stats Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sổ ghi chú, môn học..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-3">
            <span>Tổng cộng: <strong className="text-slate-800 dark:text-slate-100">{notebooks.length}</strong> sổ</span>
            <span>•</span>
            <span>Tài liệu: <strong className="text-blue-600">{notebooks.reduce((acc, n) => acc + n.sources.length, 0)}</strong> nguồn</span>
          </div>
        </div>

        {/* Notebooks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Create New Card */}
          <div
            onClick={() => setShowCreateModal(true)}
            className="group rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 p-6 flex flex-col items-center justify-center text-center gap-3 bg-white/60 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/80 transition-all cursor-pointer min-h-[220px]"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Plus size={26} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Tạo Sổ Ghi Chú Mới</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Ôn tập chuyên đề, môn học hoặc giáo trình</p>
            </div>
          </div>

          {/* Existing Notebooks Cards */}
          {filteredNotebooks.map(nb => {
            const activeSourcesCount = nb.sources.filter(s => s.active).length
            const quizzesCount = nb.generatedQuizzes.length
            return (
              <div
                key={nb.id}
                onClick={() => setActiveNotebookId(nb.id)}
                className="group relative rounded-3xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 p-5 flex flex-col justify-between hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer min-h-[220px]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="px-2.5 py-1 rounded-xl text-[11px] font-extrabold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 truncate max-w-[180px]">
                      {nb.subject || 'Tổng quát'}
                    </span>
                    <button
                      onClick={e => handleDeleteNotebook(nb.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                      title="Xóa sổ ghi chú này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-lg leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                    {nb.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg flex items-center gap-1">
                      <FileText size={12} className="text-blue-500" />
                      {activeSourcesCount}/{nb.sources.length} tài liệu
                    </span>
                    {nb.sampleExam && (
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/40 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-amber-200 dark:border-amber-800/60">
                        ⭐ Có đề mẫu
                      </span>
                    )}
                    {nb.topics.length > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40 px-2 py-0.5 rounded-lg flex items-center gap-1">
                        <Layers size={12} className="text-emerald-500" />
                        {nb.topics.length} chủ đề
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-between mt-4">
                  <span className="text-[11px] text-slate-400 font-medium">
                    {quizzesCount > 0 ? `Đã tạo ${quizzesCount} bộ đề` : 'Chưa tạo đề'}
                  </span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>Mở sổ</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal: Tạo sổ ghi chú mới */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-pop-in">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-300 flex items-center justify-center">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Tạo Sổ Ghi Chú NoteBook ND</h3>
                    <p className="text-xs text-slate-400">Không gian học tập và tạo đề thi theo tài liệu</p>
                  </div>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Tên Sổ Ghi Chú *
                  </label>
                  <input
                    type="text"
                    value={newNotebookTitle}
                    onChange={e => setNewNotebookTitle(e.target.value)}
                    placeholder="VD: Ôn Thi Vi Sinh K45, Dược Lý Chuyên Sâu..."
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Môn Học / Chuyên Đề
                  </label>
                  <input
                    type="text"
                    value={newNotebookSubject}
                    onChange={e => setNewNotebookSubject(e.target.value)}
                    placeholder="VD: Y Dược, Sinh Học, Toán, Tiếng Anh..."
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Cấu Trúc Tài Liệu Nguồn Của Bạn
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setNewNotebookSourceType('single_topic')}
                      className={`p-3.5 rounded-2xl border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                        newNotebookSourceType === 'single_topic'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">1 Chủ đề duy nhất</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Toàn bộ tài liệu tập trung 1 bài học</span>
                    </label>

                    <label
                      onClick={() => setNewNotebookSourceType('multi_topic')}
                      className={`p-3.5 rounded-2xl border-2 flex flex-col gap-1 cursor-pointer transition-all ${
                        newNotebookSourceType === 'multi_topic'
                          ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">Nhiều chủ đề / chương</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">AI tự động phân tích tách các chủ đề</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  Hủy
                </button>
                <button
                  onClick={handleCreateNotebook}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-500/20 active:scale-95 transition"
                >
                  Tạo Sổ Ngay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER 2: WORKSPACE BÊN TRONG 1 SỔ GHI CHÚ (3-PANEL NOTEBOOKLM EXPERIENCE)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 animate-fade-in pb-16">
      {/* Top Header of the Notebook */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setActiveNotebookId(null)}
            className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors cursor-pointer flex-shrink-0"
            title="Quay lại danh sách sổ ghi chú"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                value={activeNotebook.title}
                onChange={e => {
                  const val = e.target.value
                  updateActiveNotebook(nb => ({ ...nb, title: val, updatedAt: Date.now() }))
                }}
                className="font-black text-lg sm:text-xl text-slate-900 dark:text-slate-100 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none transition-colors"
                title="Bấm để sửa tên sổ"
              />
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                {activeNotebook.subject}
              </span>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {activeNotebook.sourceType === 'multi_topic' ? 'Nhiều chủ đề' : '1 Chủ đề'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              NoteBook ND • AI Studio tự động tạo đề từ tài liệu
            </p>
          </div>
        </div>

        {/* Mode Switcher: Tạo Đề Trắc Nghiệm vs Hỏi Đáp */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <button
              onClick={() => setWorkspaceMode('generator')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                workspaceMode === 'generator'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles size={13} />
              <span>Tạo Trắc Nghiệm</span>
            </button>
            <button
              onClick={() => setWorkspaceMode('chat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                workspaceMode === 'chat'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MessageSquare size={13} />
              <span>Hỏi Đáp Tài Liệu</span>
            </button>
          </div>

          <button
            onClick={() => handleDeleteNotebook(activeNotebook.id)}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
            title="Xóa sổ ghi chú này"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Loading Status Indicator */}
      {loading && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg flex items-center gap-3 animate-pulse">
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold">{loadingStep || 'AI đang xử lý...'}</p>
            <p className="text-[10px] text-cyan-200">Đang phân tích sâu và áp dụng thuật toán chống ảo giác</p>
          </div>
        </div>
      )}

      {/* 3-Column Grid Workspace (NotebookLM 99.99%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* ─── CỘT 1: NGUỒN TÀI LIỆU & ĐỀ MẪU & CHỦ ĐỀ (3.5 cols) ─── */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Tài Liệu Nguồn */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-cyan-300 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Nguồn Tài Liệu</h3>
                  <p className="text-[11px] text-slate-400">PDF, Word, PPT, Text</p>
                </div>
              </div>

              <button
                onClick={() => setShowAddSourceModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-slate-700 text-blue-600 dark:text-cyan-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
              >
                <Plus size={14} />
                <span>Thêm</span>
              </button>
            </div>

            {/* Danh sách file nguồn đã thêm */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {activeNotebook.sources.length === 0 ? (
                <div
                  onClick={() => setShowAddSourceModal(true)}
                  className="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center hover:border-blue-400 transition cursor-pointer space-y-2"
                >
                  <FileUp size={24} className="mx-auto text-slate-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Chưa có tài liệu nguồn nào</p>
                  <p className="text-[11px] text-slate-400">Bấm vào đây để tải lên PDF, Word, PowerPoint hoặc dán văn bản</p>
                </div>
              ) : (
                activeNotebook.sources.map(src => (
                  <div
                    key={src.id}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                      src.active
                        ? 'border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={src.active}
                        onChange={() => handleToggleSourceActive(src.id)}
                        className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        title={src.active ? 'Bỏ chọn nguồn này' : 'Chọn nguồn này'}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate" title={src.name}>
                          {src.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {src.type.toUpperCase()} • ~{src.content.length.toLocaleString()} ký tự
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSource(src.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 transition"
                      title="Xóa nguồn này"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Card 2: Clone Phong Cách Đề Mẫu Của Giáo Viên */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  ⭐
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">File Đề Thi Mẫu</h3>
                  <p className="text-[10px] text-slate-400">Clone phong cách ra đề của GV</p>
                </div>
              </div>

              {!activeNotebook.sampleExam ? (
                <button
                  onClick={() => setShowSampleExamModal(true)}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Tải lên</span>
                </button>
              ) : (
                <button
                  onClick={handleRemoveSampleExam}
                  className="text-xs text-rose-500 hover:underline font-bold"
                >
                  Gỡ bỏ
                </button>
              )}
            </div>

            {activeNotebook.sampleExam ? (
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-900 dark:text-amber-200 truncate">
                    {activeNotebook.sampleExam.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-extrabold">
                    CLONE ACTIVE
                  </span>
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                  AI sẽ bám sát phong cách đặt câu, cách gài bẫy và cấu trúc 4 phương án của đề mẫu này khi tạo câu hỏi.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tùy chọn: Tải file đề mẫu để AI bắt chước chuẩn xác phong cách ra đề, kiểu câu hỏi và văn phong của thầy cô.
              </p>
            )}
          </div>

          {/* Card 3: Danh Sách Chủ Đề / Chương (Khi chọn Nhiều chủ đề) */}
          {activeNotebook.sourceType === 'multi_topic' && (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Chủ Đề Kiến Thức</h3>
                    <p className="text-[10px] text-slate-400">Tick chọn để tạo trắc nghiệm</p>
                  </div>
                </div>

                <button
                  onClick={handleExtractTopics}
                  disabled={loading}
                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                  title="Cho phép AI tự động phân tích và chia nhỏ tài liệu"
                >
                  <Sparkles size={12} />
                  <span>{activeNotebook.topics.length > 0 ? 'Phân tích lại' : 'Tách chủ đề AI'}</span>
                </button>
              </div>

              {activeNotebook.topics.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>Đã chọn: <strong className="text-emerald-600">{activeNotebook.topics.filter(t => t.selected).length}/{activeNotebook.topics.length}</strong></span>
                    <div className="flex gap-2 font-bold text-blue-600">
                      <button onClick={() => handleToggleSelectAllTopics(true)} className="hover:underline">Chọn tất cả</button>
                      <span>•</span>
                      <button onClick={() => handleToggleSelectAllTopics(false)} className="hover:underline">Bỏ chọn</button>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {activeNotebook.topics.map(tp => (
                      <label
                        key={tp.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition text-left ${
                          tp.selected
                            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/40 dark:bg-emerald-950/20'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/40 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={tp.selected}
                          onChange={() => handleToggleTopic(tp.id)}
                          className="mt-0.5 w-4 h-4 rounded text-emerald-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">
                            {tp.name}
                          </div>
                          {tp.summary && (
                            <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                              {tp.summary}
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">
                    Chưa bóc tách các chủ đề. Bấm nút <strong>"Tách chủ đề AI"</strong> ở trên để AI tự động phân tích và chia tài liệu thành từng chương mục!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ─── CỘT 2: STUDIO CẤU HÌNH TẠO ĐỀ HOẶC CHAT (4 cols) ─── */}
        <div className="lg:col-span-4 space-y-4">
          {workspaceMode === 'generator' ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-5">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Cấu Hình Tạo Trắc Nghiệm</h3>
                  <p className="text-xs text-slate-400">Tùy biến số lượng và độ khó theo yêu cầu</p>
                </div>
                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                  <SlidersHorizontal size={16} />
                </div>
              </div>

              {/* 1. Chọn số lượng câu */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Số Lượng Câu Hỏi
                  </label>
                  <span className="text-sm font-black text-blue-600 bg-blue-50 dark:bg-blue-900/50 px-2.5 py-0.5 rounded-full">
                    {activeNotebook.quizConfig.questionCount} câu
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-2">
                  {[10, 20, 30, 40].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => updateActiveNotebook(nb => ({
                        ...nb,
                        quizConfig: { ...nb.quizConfig, questionCount: cnt }
                      }))}
                      className={`py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                        activeNotebook.quizConfig.questionCount === cnt
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cnt} câu
                    </button>
                  ))}
                </div>

                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={activeNotebook.quizConfig.questionCount}
                  onChange={e => {
                    const val = parseInt(e.target.value) || 20
                    updateActiveNotebook(nb => ({
                      ...nb,
                      quizConfig: { ...nb.quizConfig, questionCount: val }
                    }))
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* 2. Phân bổ % Mức độ tư duy */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tỉ Lệ Mức Độ Tư Duy
                  </label>
                  <span className="text-[11px] text-slate-400">Tổng: 100%</span>
                </div>

                {/* Progress bar trực quan 2 màu */}
                <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    style={{ width: `${activeNotebook.quizConfig.easyMediumPercent}%` }}
                    className="bg-emerald-500 h-full transition-all duration-300"
                    title={`Nhận biết & Thông hiểu: ${activeNotebook.quizConfig.easyMediumPercent}%`}
                  />
                  <div
                    style={{ width: `${activeNotebook.quizConfig.hardPercent}%` }}
                    className="bg-violet-600 h-full transition-all duration-300"
                    title={`Vận dụng & Vận dụng cao: ${activeNotebook.quizConfig.hardPercent}%`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-200 block">
                      Nhận biết & Thông hiểu
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeNotebook.quizConfig.easyMediumPercent}
                        onChange={e => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                          updateActiveNotebook(nb => ({
                            ...nb,
                            quizConfig: {
                              ...nb.quizConfig,
                              easyMediumPercent: val,
                              hardPercent: 100 - val
                            }
                          }))
                        }}
                        className="w-16 p-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 text-sm font-black text-emerald-800 text-center"
                      />
                      <span className="font-bold text-xs text-emerald-800">%</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/60">
                    <span className="text-[11px] font-bold text-violet-800 dark:text-violet-200 block">
                      Vận dụng & VD Cao
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={activeNotebook.quizConfig.hardPercent}
                        onChange={e => {
                          const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0))
                          updateActiveNotebook(nb => ({
                            ...nb,
                            quizConfig: {
                              ...nb.quizConfig,
                              hardPercent: val,
                              easyMediumPercent: 100 - val
                            }
                          }))
                        }}
                        className="w-16 p-1 rounded-lg bg-white dark:bg-slate-900 border border-violet-300 text-sm font-black text-violet-800 text-center"
                      />
                      <span className="font-bold text-xs text-violet-800">%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Ghi chú thêm / Yêu cầu bổ sung */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Ghi Chú & Lưu Ý Thêm Cho Đề
                </label>
                <textarea
                  rows={3}
                  value={activeNotebook.quizConfig.customNotes}
                  onChange={e => {
                    const val = e.target.value
                    updateActiveNotebook(nb => ({
                      ...nb,
                      quizConfig: { ...nb.quizConfig, customNotes: val }
                    }))
                  }}
                  placeholder="VD: Tập trung ra câu hỏi tình huống lâm sàng, hỏi xoáy vào các trường hợp ngoại lệ..."
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {/* Nút Tạo Đề Lớn Nổi Bật */}
              <button
                type="button"
                onClick={handleGenerateQuiz}
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-black text-sm sm:text-base shadow-xl shadow-indigo-500/25 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-50"
              >
                <Sparkles size={20} className="animate-spin text-cyan-200" />
                <span>BẮT ĐẦU TẠO BỘ TRẮC NGHIỆM</span>
              </button>
            </div>
          ) : (
            /* Chat Mode: NotebookLM Chat */
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm h-[560px] flex flex-col justify-between">
              <div className="border-b border-slate-100 dark:border-slate-700 pb-2.5">
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Tra Cứu & Hỏi Đáp Tài Liệu</h3>
                <p className="text-[11px] text-slate-400">100% dựa trên tài liệu nguồn, không ảo giác</p>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
                {chatMessages.length === 0 ? (
                  <div className="text-center p-6 text-slate-400 text-xs">
                    Hãy hỏi bất kỳ câu hỏi nào về tài liệu nguồn của bạn. AI sẽ trích dẫn câu trả lời chính xác từ giáo trình!
                  </div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white ml-6 font-medium'
                          : 'bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 mr-6'
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))
                )}
                {isChatting && (
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-500 text-xs animate-pulse">
                    Đang tìm kiếm thông tin trong tài liệu...
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                  placeholder="Đặt câu hỏi về tài liệu..."
                  className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendChat}
                  disabled={isChatting}
                  className="p-2.5 rounded-xl bg-blue-600 text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── CỘT 3: KẾT QUẢ & CÔNG CỤ XUẤT BẢN (4.5 cols) ─── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-700 pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Bộ Câu Hỏi Trắc Nghiệm
                </h3>
                <p className="text-xs text-slate-400">
                  {latestQuiz ? `${latestQuiz.questionCount} câu đã tạo` : 'Chưa có kết quả'}
                </p>
              </div>

              <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-900 flex text-xs font-bold">
                <button
                  onClick={() => setOutputTab('preview')}
                  className={`px-2.5 py-1 rounded-lg transition ${outputTab === 'preview' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Trực quan
                </button>
                <button
                  onClick={() => setOutputTab('markdown')}
                  className={`px-2.5 py-1 rounded-lg transition ${outputTab === 'markdown' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'}`}
                >
                  Markdown
                </button>
              </div>
            </div>

            {/* 3 NÚT CÔNG CỤ THẦN THÁNH THEO YÊU CẦU: COPY, TẠO BÀI TEST, TẢI WORD */}
            {latestQuiz && (
              <div className="grid grid-cols-3 gap-2">
                {/* 1. BUTTON COPY */}
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="py-2.5 px-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
                  title="Sao chép toàn bộ Markdown"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  <span>{copied ? 'Đã chép' : 'COPY'}</span>
                </button>

                {/* 2. BUTTON TẠO BÀI TEST (IMPORT TẤT CẢ VÀO Ô SOẠN THẢO) */}
                <button
                  type="button"
                  onClick={handleCreateTestFromNotebook}
                  className="py-2.5 px-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer shadow-md shadow-blue-500/20"
                  title="Mở chế độ tạo bài test, tự import tất cả câu vào ô soạn thảo"
                >
                  <ExternalLink size={16} />
                  <span>TẠO TEST</span>
                </button>

                {/* 3. BUTTON TẢI FILE WORD (.DOCX) */}
                <button
                  type="button"
                  onClick={handleExportDocx}
                  className="py-2.5 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-extrabold text-xs flex flex-col items-center justify-center gap-1 transition active:scale-95 cursor-pointer"
                  title="Tải file Word (.docx) chuẩn format có in đậm phương án đúng"
                >
                  <Download size={16} />
                  <span>TẢI WORD</span>
                </button>
              </div>
            )}

            {/* Nội dung câu hỏi hiển thị */}
            <div className="h-[440px] overflow-y-auto rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-700/60 font-mono text-xs text-slate-800 dark:text-slate-200">
              {!latestQuiz ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 gap-2 font-sans">
                  <Sparkles size={28} className="text-slate-300" />
                  <p className="font-bold text-xs">Chưa có bộ câu hỏi nào được tạo</p>
                  <p className="text-[11px]">Bấm nút "BẮT ĐẦU TẠO BỘ TRẮC NGHIỆM" ở cột giữa để sinh đề theo tài liệu nguồn!</p>
                </div>
              ) : outputTab === 'markdown' ? (
                <pre className="whitespace-pre-wrap leading-relaxed font-mono select-all">
                  {latestQuiz.markdown}
                </pre>
              ) : (
                <div className="space-y-4 font-sans text-xs">
                  {latestQuiz.markdown.split(/(?:^|\n)(?=Câu\s*\d+[\.:])/i).filter(b => b.trim()).map((block, idx) => {
                    const lines = block.trim().split('\n')
                    const qTitle = lines[0] || ''
                    const opts = lines.slice(1)

                    return (
                      <div key={idx} className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 text-[13px] leading-snug">
                          {qTitle}
                        </div>
                        <div className="space-y-1 pl-2">
                          {opts.map((opt, oIdx) => {
                            const isBold = opt.startsWith('**') && opt.endsWith('**')
                            const clean = opt.replace(/^\*\*|\*\*$/g, '')
                            return (
                              <div
                                key={oIdx}
                                className={`py-1 px-2.5 rounded-lg leading-relaxed ${
                                  isBold
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-black border border-emerald-300 dark:border-emerald-700'
                                    : 'text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {clean}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: THÊM TÀI LIỆU NGUỒN */}
      {showAddSourceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Thêm Nguồn Tài Liệu</h3>
              <button onClick={() => setShowAddSourceModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 text-xs font-bold">
              <button
                onClick={() => setSourceInputType('file')}
                className={`flex-1 py-1.5 rounded-lg transition ${sourceInputType === 'file' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'}`}
              >
                Tải lên File (PDF, Word, PPTX)
              </button>
              <button
                onClick={() => setSourceInputType('text')}
                className={`flex-1 py-1.5 rounded-lg transition ${sourceInputType === 'text' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-xs' : 'text-slate-500'}`}
              >
                Dán Văn Bản Trực Tiếp
              </button>
            </div>

            {sourceInputType === 'file' ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20 text-center space-y-3 cursor-pointer hover:bg-blue-100/40 transition"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md"
                  className="hidden"
                />
                <Upload size={32} className="mx-auto text-blue-600 animate-bounce" />
                <div>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-200">Bấm để chọn file tài liệu</p>
                  <p className="text-xs text-slate-400 mt-1">Hỗ trợ: PDF (.pdf), Word (.docx, .doc), PowerPoint (.pptx), Text (.txt, .md)</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={manualTextTitle}
                  onChange={e => setManualTextTitle(e.target.value)}
                  placeholder="Tiêu đề tài liệu nguồn (VD: Bài 3: Kháng Sinh)"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
                <textarea
                  rows={8}
                  value={manualTextContent}
                  onChange={e => setManualTextContent(e.target.value)}
                  placeholder="Dán toàn bộ nội dung bài học hoặc giáo trình vào đây..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 outline-none resize-none font-sans"
                />
                <button
                  onClick={handleAddManualText}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Lưu Tài Liệu Này
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: TẢI ĐỀ THI MẪU CỦA GIÁO VIÊN */}
      {showSampleExamModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 animate-pop-in">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">⭐</span>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Upload Đề Thi Mẫu Giáo Viên</h3>
              </div>
              <button onClick={() => setShowSampleExamModal(false)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Mục đích: AI phân tích để <strong>CLONE PHONG CÁCH, Ý TƯỞNG, CẤU TRÚC CÂU, CÁCH RA ĐỀ VÀ GÀI BẪY</strong> của giáo viên qua file đề mẫu.
            </p>

            <div
              onClick={() => sampleExamInputRef.current?.click()}
              className="p-6 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/40 text-center space-y-2 cursor-pointer hover:bg-amber-100/40 transition"
            >
              <input
                type="file"
                ref={sampleExamInputRef}
                onChange={handleSampleExamUpload}
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
              />
              <FileSpreadsheet size={28} className="mx-auto text-amber-600" />
              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">Chọn file đề mẫu (PDF, Word, TXT)</p>
            </div>

            <div className="text-center text-xs text-slate-400 font-bold">HOẶC DÁN NỘI DUNG ĐỀ MẪU</div>

            <textarea
              rows={5}
              value={sampleExamContent}
              onChange={e => setSampleExamContent(e.target.value)}
              placeholder="Dán câu hỏi hoặc đề mẫu của thầy cô vào đây..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs resize-none"
            />

            <button
              onClick={handleSaveManualSampleExam}
              className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs"
            >
              Kích Hoạt Clone Đề Mẫu Này
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
