'use client'

import React, { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Trash2,
  Lock,
  Unlock,
  ExternalLink,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  Key,
  Clock,
  Layers,
  Users,
  User,
  Sparkles,
  LayoutDashboard,
  Bell,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  CheckSquare,
  Square,
  Eye,
  Edit,
  TrendingUp,
  LayoutGrid,
  Table as TableIcon,
  Sun,
  Moon,
  Download,
  CopyCheck,
  X,
  HelpCircle,
  FileDown
} from 'lucide-react'
import { useTheme } from '../../ThemeContext'

export interface QuizItem {
  id: string
  title: string
  createdAt: string | Date
  author?: {
    username: string
  } | null
  data?: {
    config?: {
      title?: string
      category?: string
      timeLimit?: number
      password?: string
      mode?: string
      isActive?: boolean
      randomPickCount?: number
      quizType?: string
    }
    questions?: any[]
  }
}

interface TestsClientProps {
  initialQuizzes: QuizItem[]
  session?: {
    id?: string
    username?: string
    role?: string
  }
}

export default function TestsClient({ initialQuizzes, session }: TestsClientProps) {
  const { theme, isDark, toggleTheme } = useTheme()
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [creatorFilter, setCreatorFilter] = useState('all')
  const [onlyMine, setOnlyMine] = useState(false)
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [mobileViewMode, setMobileViewMode] = useState<'card' | 'table'>('card')
  const [bulkAction, setBulkAction] = useState('')
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  // Advanced Filters State
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [minQuestions, setMinQuestions] = useState<number | ''>('')
  const [vipFilter, setVipFilter] = useState<'all' | 'vip' | 'public'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_questions' | 'name'>('newest')

  // Preview Modal State
  const [previewQuiz, setPreviewQuiz] = useState<QuizItem | null>(null)
  // Password Edit Modal State
  const [editPassQuiz, setEditPassQuiz] = useState<QuizItem | null>(null)
  const [newPasswordVal, setNewPasswordVal] = useState('')

  const currentUsername = session?.username || 'DuylniEdu'

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Keyboard shortcut Ctrl + K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        const el = document.getElementById('search-quiz-input')
        el?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close row menu on click outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null)
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [])

  // Copy helper
  const handleCopy = (text: string, label: string, idToMark?: string) => {
    try {
      navigator.clipboard.writeText(text)
      if (idToMark) {
        setCopiedId(idToMark)
        setTimeout(() => setCopiedId(null), 2000)
      }
      showToast(`Đã copy ${label}: "${text.length > 28 ? text.substring(0, 28) + '...' : text}"`)
    } catch (e) {
      showToast(`Không thể copy ${label}`, 'error')
    }
  }

  // Refresh quizzes
  const refreshQuizzes = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/quizzes')
      if (res.ok) {
        const data = await res.json()
        setQuizzes(data)
        showToast('Đã đồng bộ và làm mới danh sách đề thi!')
      } else {
        showToast('Không thể tải lại danh sách đề thi', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi đồng bộ', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle Lock/Unlock
  const handleToggleActive = async (q: QuizItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const currentActive = q.data?.config?.isActive !== false
    const newActive = !currentActive

    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id, isActive: newActive })
      })
      if (res.ok) {
        setQuizzes(prev =>
          prev.map(item => {
            if (item.id === q.id) {
              const updatedData = { ...item.data }
              if (!updatedData.config) updatedData.config = {}
              updatedData.config.isActive = newActive
              return { ...item, data: updatedData }
            }
            return item
          })
        )
        showToast(newActive ? `Đã mở khóa đề: "${q.title}"` : `Đã khóa đề: "${q.title}"`)
      } else {
        showToast('Cập nhật trạng thái thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error')
    }
  }

  // Update Password
  const handleSavePassword = async () => {
    if (!editPassQuiz) return
    try {
      const updatedData = { ...editPassQuiz.data }
      if (!updatedData.config) updatedData.config = {}
      updatedData.config.password = newPasswordVal.trim()

      const res = await fetch('/api/admin/quizzes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editPassQuiz.id, password: newPasswordVal.trim() })
      })
      if (res.ok) {
        setQuizzes(prev =>
          prev.map(item => item.id === editPassQuiz.id ? { ...item, data: updatedData } : item)
        )
        showToast('Đã cập nhật mật khẩu đề thi thành công!')
        setEditPassQuiz(null)
      } else {
        showToast('Lỗi khi cập nhật mật khẩu', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error')
    }
  }

  // Duplicate Quiz
  const handleDuplicateQuiz = (q: QuizItem) => {
    const duplicatedTitle = `${q.title} (Bản sao)`
    const newQuiz: QuizItem = {
      ...q,
      id: `quiz_${Date.now()}`,
      title: duplicatedTitle,
      createdAt: new Date(),
      data: {
        ...q.data,
        config: {
          ...q.data?.config,
          title: duplicatedTitle
        }
      }
    }
    setQuizzes(prev => [newQuiz, ...prev])
    showToast(`Đã nhân bản đề thi: "${duplicatedTitle}"`)
  }

  // Export Quiz to JSON
  const handleExportJSON = (q: QuizItem) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(q, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${q.title.replace(/\s+/g, '_')}.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    showToast(`Đã xuất file JSON cho đề thi: "${q.title}"`)
  }

  // Delete Quiz
  const handleDeleteQuiz = async (q: QuizItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!confirm(`Bạn có chắc chắn muốn xóa bài thi "${q.title}" không? Hành động này không thể hoàn tác.`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: q.id })
      })
      if (res.ok) {
        setQuizzes(prev => prev.filter(item => item.id !== q.id))
        setSelectedIds(prev => prev.filter(id => id !== q.id))
        showToast(`Đã xóa đề thi "${q.title}" thành công!`)
      } else {
        showToast('Xóa đề thi thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi xóa đề thi', 'error')
    }
  }

  // Bulk actions handler
  const handleApplyBulk = async () => {
    if (!bulkAction || selectedIds.length === 0) return

    if (bulkAction === 'delete') {
      if (!confirm(`Xác nhận xóa ${selectedIds.length} bài test đã chọn? Hành động này không thể hoàn tác.`)) return
      setIsLoading(true)
      try {
        for (const id of selectedIds) {
          await fetch('/api/admin/quizzes', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
          })
        }
        setQuizzes(prev => prev.filter(q => !selectedIds.includes(q.id)))
        setSelectedIds([])
        showToast(`Đã xóa ${selectedIds.length} bài test thành công!`)
      } catch (e) {
        showToast('Lỗi khi thực hiện thao tác hàng loạt', 'error')
      } finally {
        setIsLoading(false)
        setBulkAction('')
      }
    } else if (bulkAction === 'lock' || bulkAction === 'unlock') {
      const newActive = bulkAction === 'unlock'
      setIsLoading(true)
      try {
        for (const id of selectedIds) {
          await fetch('/api/admin/quizzes', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, isActive: newActive })
          })
        }
        setQuizzes(prev =>
          prev.map(item => {
            if (selectedIds.includes(item.id)) {
              const updatedData = { ...item.data }
              if (!updatedData.config) updatedData.config = {}
              updatedData.config.isActive = newActive
              return { ...item, data: updatedData }
            }
            return item
          })
        )
        showToast(`Đã ${newActive ? 'mở khóa' : 'khóa'} ${selectedIds.length} bài test thành công!`)
        setSelectedIds([])
      } catch (e) {
        showToast('Lỗi khi cập nhật trạng thái', 'error')
      } finally {
        setIsLoading(false)
        setBulkAction('')
      }
    }
  }

  // Select all / Deselect all
  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedQuizzes.length && paginatedQuizzes.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(paginatedQuizzes.map(q => q.id))
    }
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  // Author name extraction helper
  const getAuthorName = (q: QuizItem): string => {
    if (!q.author) return 'DuylniEdu'
    if (typeof q.author === 'string') return q.author
    return q.author.username || 'DuylniEdu'
  }

  // Categories & creators list
  const categories = useMemo(() => {
    return Array.from(
      new Set(quizzes.map(q => q.data?.config?.category || 'Chung').filter(Boolean))
    ).sort()
  }, [quizzes])

  const creators = useMemo(() => {
    return Array.from(
      new Set(quizzes.map(getAuthorName).filter(Boolean))
    ).sort()
  }, [quizzes])

  // Subject badge color helper
  const getCategoryBadgeClass = (category: string) => {
    const c = category.toLowerCase()
    if (c.includes('vi sinh')) return 'bg-[#EDE9FE] dark:bg-[#3B1F70] text-[#7C3AED] dark:text-[#C4B5FD] border-[#DDD6FE] dark:border-[#5B21B6]'
    if (c.includes('sinh học') || c.includes('sinh')) return 'bg-[#DCFCE7] dark:bg-[#14532D] text-[#16A34A] dark:text-[#86EFAC] border-[#BBF7D0] dark:border-[#166534]'
    if (c.includes('dược') || c.includes('hóa')) return 'bg-[#FEF3C7] dark:bg-[#78350F] text-[#D97706] dark:text-[#FDE68A] border-[#FDE68A] dark:border-[#92400E]'
    if (c.includes('giải phẫu')) return 'bg-[#FCE7F3] dark:bg-[#831843] text-[#DB2777] dark:text-[#FBCFE8] border-[#FBCFE8] dark:border-[#9D174D]'
    return 'bg-[#E0F2FE] dark:bg-[#0C4A6E] text-[#0284C7] dark:text-[#7DD3FC] border-[#BAE6FD] dark:border-[#0369A1]'
  }

  // Filtering & Sorting
  const filteredQuizzes = useMemo(() => {
    let result = quizzes.filter(q => {
      const term = searchTerm.toLowerCase().trim()
      const titleMatch = (q.title || '').toLowerCase().includes(term) || q.id.toLowerCase().includes(term)
      
      const cat = q.data?.config?.category || 'Chung'
      const categoryMatch = categoryFilter === 'all' || cat === categoryFilter

      const isActive = q.data?.config?.isActive !== false
      const statusMatch =
        statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'locked' && !isActive)

      const authorName = getAuthorName(q)
      const creatorMatch =
        creatorFilter === 'all' ||
        authorName.toLowerCase() === creatorFilter.toLowerCase()

      const myMatch = !onlyMine || authorName.toLowerCase() === currentUsername.toLowerCase()

      // VIP filter
      const hasPassword = Boolean(q.data?.config?.password)
      const vipMatch =
        vipFilter === 'all' ||
        (vipFilter === 'vip' && hasPassword) ||
        (vipFilter === 'public' && !hasPassword)

      // Min questions
      const qCount = q.data?.config?.randomPickCount || q.data?.questions?.length || 0
      const countMatch = minQuestions === '' || qCount >= Number(minQuestions)

      return titleMatch && categoryMatch && statusMatch && creatorMatch && myMatch && vipMatch && countMatch
    })

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'most_questions') {
        const countA = a.data?.config?.randomPickCount || a.data?.questions?.length || 0
        const countB = b.data?.config?.randomPickCount || b.data?.questions?.length || 0
        return countB - countA
      }
      if (sortBy === 'name') return a.title.localeCompare(b.title)
      return 0
    })

    return result
  }, [quizzes, searchTerm, categoryFilter, statusFilter, creatorFilter, onlyMine, vipFilter, minQuestions, sortBy, currentUsername])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredQuizzes.length / pageSize))
  const paginatedQuizzes = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredQuizzes.slice(start, start + pageSize)
  }, [filteredQuizzes, currentPage, pageSize])

  // KPI Metrics
  const totalCount = quizzes.length
  const lockedCount = quizzes.filter(q => q.data?.config?.isActive === false).length
  const activeCount = totalCount - lockedCount
  const passCount = quizzes.filter(q => Boolean(q.data?.config?.password)).length
  const activePercent = totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-20">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-bold flex items-center gap-3 transition-all transform animate-in slide-in-from-bottom-5 ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
          }`}
        >
          {toast.type === 'error' ? <Lock size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* ─── Top Header Bar (Breadcrumbs, Quick Search, Theme Toggle, User Info) ─── */}
      <div className="bg-white/80 dark:bg-[#1E293B]/90 backdrop-blur-md rounded-2xl px-4 sm:px-6 py-3 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between gap-4 transition-colors">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 overflow-hidden">
          <span className="text-slate-400 dark:text-slate-500">Kho đề thi</span>
          <span className="text-slate-300 dark:text-slate-600">›</span>
          <span className="text-blue-600 dark:text-blue-400 font-bold truncate">Quản lý bài test</span>
        </div>

        {/* Right tools (Search, Theme switch, Notifications, User) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick Search */}
          <div className="relative hidden md:block w-48 lg:w-60">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="search-quiz-input"
              placeholder="Tìm kiếm nhanh..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
          </div>

          {/* Theme Toggle Button (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {/* Notification bell */}
          <button
            onClick={() => showToast('Không có thông báo mới!')}
            className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* User profile pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">{currentUsername}</div>
              <div className="text-[10px] text-slate-400 leading-tight">Quản trị viên</div>
            </div>
            <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
          </div>
        </div>
      </div>

      {/* ─── Page Title & Action Bar ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 flex-shrink-0 mt-0.5">
            <FileText size={24} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Quản Lý Danh Sách Bài Test
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">
              Bảng thống kê toàn bộ đề thi, quản lý mật khẩu, trạng thái và đường link làm bài
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all active:scale-95"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <button
            onClick={refreshQuizzes}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all active:scale-95"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-blue-600' : ''} />
            <span>Đồng bộ lại</span>
          </button>

          <Link
            href="/creator"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-blue-500/25 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>Tạo Bài Test Mới</span>
          </Link>
        </div>
      </div>

      {/* ─── 4 KPI Summary Cards (Exact UI from screenshot with dark theme support) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Tổng số đề thi */}
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs">
              <Layers size={20} />
            </div>
            {/* Wave sparkline graphic */}
            <div className="text-blue-500 opacity-70">
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="overflow-visible">
                <path d="M0 20 C 12 18, 18 8, 28 14 C 36 18, 40 4, 48 6" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 20 C 12 18, 18 8, 28 14 C 36 18, 40 4, 48 6 L 48 24 L 0 24 Z" fill="#DBEAFE" opacity="0.4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tổng số đề thi</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5">{totalCount}</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              <span>↗</span>
              <span>+2 đề trong tháng</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đang mở */}
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Unlock size={20} />
            </div>
            {/* Green wave sparkline */}
            <div className="text-emerald-500 opacity-70">
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="overflow-visible">
                <path d="M0 22 C 14 20, 20 6, 32 10 C 38 12, 42 2, 48 4" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 22 C 14 20, 20 6, 32 10 C 38 12, 42 2, 48 4 L 48 24 L 0 24 Z" fill="#DCFCE7" opacity="0.4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đang mở</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5">{activeCount}</div>
            <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {activePercent}% đang mở
            </div>
          </div>
        </div>

        {/* Card 3: Đã khóa */}
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs">
              <Lock size={20} />
            </div>
            {/* Rose wave sparkline */}
            <div className="text-rose-500 opacity-70">
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="overflow-visible">
                <path d="M0 18 C 14 16, 22 22, 34 16 C 40 12, 44 14, 48 10" stroke="#E11D48" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 18 C 14 16, 22 22, 34 16 C 40 12, 44 14, 48 10 L 48 24 L 0 24 Z" fill="#FFE4E6" opacity="0.4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Đã khóa</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5">{lockedCount}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              {lockedCount === 0 ? 'Chưa có đề khóa' : `${lockedCount} đề đang khóa`}
            </div>
          </div>
        </div>

        {/* Card 4: Có mật khẩu VIP */}
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
              <Key size={20} />
            </div>
            {/* Amber wave sparkline */}
            <div className="text-amber-500 opacity-70">
              <svg width="48" height="24" viewBox="0 0 48 24" fill="none" className="overflow-visible">
                <path d="M0 20 C 16 18, 24 10, 34 14 C 40 16, 44 8, 48 10" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M0 20 C 16 18, 24 10, 34 14 C 40 16, 44 8, 48 10 L 48 24 L 0 24 Z" fill="#FEF3C7" opacity="0.4" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Có mật khẩu VIP</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5">{passCount}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              {passCount === 0 ? 'Chưa thiết lập' : `${passCount} đề bảo vệ`}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-3 sm:p-4 border border-slate-200/80 dark:border-slate-700 shadow-2xs flex flex-wrap items-center justify-between gap-3 transition-colors">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Main search input */}
          <div className="relative flex-1 sm:w-72 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên bài test, ID, người tạo..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-14 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-1.5 py-0.5 rounded-md pointer-events-none">
              Ctrl + K
            </span>
          </div>

          {/* Subject Filter */}
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả môn học ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang mở</option>
            <option value="locked">Đã khóa</option>
          </select>

          {/* Creator Filter */}
          <select
            value={creatorFilter}
            onChange={e => { setCreatorFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả người tạo</option>
            {creators.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* "Đề của tôi" Toggle button */}
          <button
            onClick={() => { setOnlyMine(!onlyMine); setCurrentPage(1); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
              onlyMine
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-slate-700'
            }`}
          >
            <Lock size={12} />
            <span>Đề của tôi</span>
          </button>
        </div>

        {/* Right tools (Clear filters / Advanced filter) */}
        <div className="flex items-center gap-2">
          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || creatorFilter !== 'all' || onlyMine || vipFilter !== 'all' || minQuestions !== '') && (
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
                setStatusFilter('all')
                setCreatorFilter('all')
                setOnlyMine(false)
                setVipFilter('all')
                setMinQuestions('')
                setCurrentPage(1)
              }}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all ${
              showAdvancedFilters
                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Bộ lọc nâng cao</span>
          </button>
        </div>
      </div>

      {/* ─── Expandable Advanced Filters Panel ─── */}
      {showAdvancedFilters && (
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-inner grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-3">
          {/* VIP filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Loại mật khẩu
            </label>
            <select
              value={vipFilter}
              onChange={e => setVipFilter(e.target.value as any)}
              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="all">Tất cả đề</option>
              <option value="vip">Chỉ đề có mật khẩu VIP</option>
              <option value="public">Chỉ đề công khai (không pass)</option>
            </select>
          </div>

          {/* Min questions filter */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Số câu tối thiểu
            </label>
            <input
              type="number"
              placeholder="VD: 50 câu"
              value={minQuestions}
              onChange={e => setMinQuestions(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Sắp xếp theo
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
            >
              <option value="newest">Mới nhất trước</option>
              <option value="oldest">Cũ nhất trước</option>
              <option value="most_questions">Nhiều câu hỏi nhất</option>
              <option value="name">Tên bài thi A - Z</option>
            </select>
          </div>
        </div>
      )}

      {/* ─── Main Table Container ─── */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-[0_4px_25px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col transition-colors">
        
        {/* Table Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <FileText size={15} />
            </div>
            <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100">Danh sách bài test</h2>
            <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold text-xs px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900">
              {filteredQuizzes.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile View Switcher (Cards vs Table) */}
            <div className="flex md:hidden items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setMobileViewMode('card')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  mobileViewMode === 'card' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'
                }`}
                title="Dạng thẻ"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setMobileViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  mobileViewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-slate-500'
                }`}
                title="Dạng bảng"
              >
                <TableIcon size={14} />
              </button>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span>/ {filteredQuizzes.length} bài test</span>
            </div>
          </div>
        </div>

        {/* ─── Desktop View: Full Table ─── */}
        <div className={`${mobileViewMode === 'card' ? 'hidden md:block' : 'block'} overflow-x-auto`}>
          <table className="w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-100 dark:border-slate-800">
                <th className="py-3.5 px-3 text-center w-10">
                  <input
                    type="checkbox"
                    checked={paginatedQuizzes.length > 0 && selectedIds.length === paginatedQuizzes.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3 text-center w-12">STT</th>
                <th className="py-3.5 px-4 min-w-[240px]">TÊN BÀI TEST</th>
                <th className="py-3.5 px-3">MÔN HỌC</th>
                <th className="py-3.5 px-3 text-center">SỐ CÂU</th>
                <th className="py-3.5 px-3 text-center">THỜI GIAN</th>
                <th className="py-3.5 px-3 text-center">MẬT KHẨU</th>
                <th className="py-3.5 px-3 text-center">TRẠNG THÁI</th>
                <th className="py-3.5 px-3 min-w-[150px]">LINK LÀM BÀI</th>
                <th className="py-3.5 px-4">NGƯỜI TẠO</th>
                <th className="py-3.5 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm bg-white dark:bg-[#1E293B]">
              {paginatedQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400 font-medium">
                    <div className="max-w-xs mx-auto">
                      <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                      <div className="font-bold text-slate-700 dark:text-slate-300 mb-1">Không tìm thấy bài test nào</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">Hãy thử tìm với từ khóa khác hoặc điều chỉnh bộ lọc</div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedQuizzes.map((q, idx) => {
                  const cfg = q.data?.config || {}
                  const questionCount = cfg.randomPickCount && cfg.randomPickCount > 0
                    ? cfg.randomPickCount
                    : (q.data?.questions?.length || 0)
                  const timeLimit = cfg.timeLimit || 15
                  const category = cfg.category || 'Chung'
                  const password = cfg.password || ''
                  const isActive = cfg.isActive !== false
                  const quizUrl = `https://dzota.vercel.app/?id=${q.id}`
                  const authorName = getAuthorName(q)
                  const isSelected = selectedIds.includes(q.id)
                  const isPassCopied = copiedId === `pass_${q.id}`
                  const isLinkCopied = copiedId === `link_${q.id}`
                  const isIdCopied = copiedId === `id_${q.id}`

                  const globalIdx = (currentPage - 1) * pageSize + idx + 1

                  return (
                    <tr
                      key={q.id}
                      className={`hover:bg-blue-50/30 dark:hover:bg-slate-800/50 transition-colors group ${
                        isSelected ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(q.id)}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </td>

                      {/* STT */}
                      <td className="py-4 px-3 text-center font-bold text-slate-400 text-xs">
                        {globalIdx}
                      </td>

                      {/* Tên bài test & Quiz ID */}
                      <td className="py-4 px-4">
                        <div
                          onClick={() => setPreviewQuiz(q)}
                          className="font-extrabold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors cursor-pointer"
                          title="Bấm để xem trước đề thi"
                        >
                          {q.title}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[11px] font-mono text-slate-400 truncate max-w-[150px]">
                            {q.id}
                          </span>
                          <button
                            onClick={() => handleCopy(q.id, 'ID bài test', `id_${q.id}`)}
                            title="Copy ID bài test"
                            className="text-slate-400 hover:text-blue-600 p-0.5 rounded transition-colors"
                          >
                            {isIdCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Môn học badge */}
                      <td className="py-4 px-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold border whitespace-nowrap shadow-2xs ${getCategoryBadgeClass(
                            category
                          )}`}
                        >
                          {category}
                        </span>
                      </td>

                      {/* Số câu */}
                      <td className="py-4 px-3 text-center">
                        <div className="font-black text-slate-800 dark:text-slate-200 text-sm">{questionCount}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">câu hỏi</div>
                      </td>

                      {/* Thời gian */}
                      <td className="py-4 px-3 text-center">
                        <div className="font-black text-slate-800 dark:text-slate-200 text-sm">{timeLimit}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">phút</div>
                      </td>

                      {/* Mật khẩu */}
                      <td className="py-4 px-3 text-center">
                        {password ? (
                          <button
                            onClick={() => {
                              handleCopy(password, 'mật khẩu VIP', `pass_${q.id}`)
                            }}
                            title={`Bấm để sao chép mật khẩu: "${password}"`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FEF3C7] dark:bg-[#78350F] text-[#D97706] dark:text-[#FDE68A] border border-[#FDE68A] dark:border-[#92400E] hover:scale-105 active:scale-95 transition-all shadow-2xs"
                          >
                            <Key size={12} />
                            <span>VIP</span>
                            {isPassCopied ? <Check size={12} className="text-emerald-600 ml-0.5" /> : null}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800">
                            Công khai
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-4 px-3 text-center">
                        <button
                          onClick={e => handleToggleActive(q, e)}
                          title="Bấm để chuyển đổi trạng thái"
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all border ${
                            isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          <span>{isActive ? 'Đang mở' : 'Đã khóa'}</span>
                        </button>
                      </td>

                      {/* Link làm bài */}
                      <td className="py-4 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopy(quizUrl, 'link làm bài', `link_${q.id}`)}
                            title="Copy link làm bài"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                              isLinkCopied
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                                : 'bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-blue-600 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {isLinkCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span>{isLinkCopied ? 'Đã copy' : 'Copy link'}</span>
                          </button>

                          <a
                            href={quizUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mở link bài thi trong tab mới"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      </td>

                      {/* Người tạo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200 text-xs">
                          <User size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{authorName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* Preview Button */}
                          <button
                            onClick={() => setPreviewQuiz(q)}
                            title="Xem trước đề thi"
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye size={15} />
                          </button>

                          {/* Toggle Active */}
                          <button
                            onClick={e => handleToggleActive(q, e)}
                            title={isActive ? 'Khóa bài thi' : 'Mở khóa bài thi'}
                            className={`p-2 rounded-xl transition-colors ${
                              isActive
                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {isActive ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={e => handleDeleteQuiz(q, e)}
                            title="Xóa bài thi"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>

                          {/* More Options Dropdown */}
                          <div className="relative">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                setActiveMenuId(activeMenuId === q.id ? null : q.id)
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <MoreVertical size={15} />
                            </button>

                            {activeMenuId === q.id && (
                              <div
                                onClick={e => e.stopPropagation()}
                                className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl z-30 py-1 text-left animate-in fade-in"
                              >
                                <button
                                  onClick={() => { handleDuplicateQuiz(q); setActiveMenuId(null); }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Copy size={13} />
                                  <span>Nhân bản đề thi</span>
                                </button>

                                <button
                                  onClick={() => {
                                    setEditPassQuiz(q)
                                    setNewPasswordVal(q.data?.config?.password || '')
                                    setActiveMenuId(null)
                                  }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <Key size={13} />
                                  <span>Đổi mật khẩu VIP</span>
                                </button>

                                <button
                                  onClick={() => { handleExportJSON(q); setActiveMenuId(null); }}
                                  className="w-full px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                >
                                  <FileDown size={13} />
                                  <span>Xuất file JSON</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile View: Card List (Optimized for Phones) ─── */}
        <div className={`${mobileViewMode === 'card' ? 'block md:hidden' : 'hidden'} p-3 space-y-3`}>
          {paginatedQuizzes.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium">
              <FileText size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <div className="font-bold text-slate-700 dark:text-slate-300">Không tìm thấy bài test nào</div>
            </div>
          ) : (
            paginatedQuizzes.map((q, idx) => {
              const cfg = q.data?.config || {}
              const questionCount = cfg.randomPickCount && cfg.randomPickCount > 0
                ? cfg.randomPickCount
                : (q.data?.questions?.length || 0)
              const timeLimit = cfg.timeLimit || 15
              const category = cfg.category || 'Chung'
              const password = cfg.password || ''
              const isActive = cfg.isActive !== false
              const quizUrl = `https://dzota.vercel.app/?id=${q.id}`
              const authorName = getAuthorName(q)
              const isSelected = selectedIds.includes(q.id)
              const isPassCopied = copiedId === `pass_${q.id}`
              const isLinkCopied = copiedId === `link_${q.id}`
              const isIdCopied = copiedId === `id_${q.id}`

              return (
                <div
                  key={q.id}
                  className={`bg-white dark:bg-[#1E293B] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-all relative ${
                    isSelected ? 'ring-2 ring-blue-500 bg-blue-50/20' : ''
                  }`}
                >
                  {/* Top Bar inside Card: Badges & Checkbox */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(q.id)}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${getCategoryBadgeClass(category)}`}>
                        {category}
                      </span>
                      {password && (
                        <button
                          onClick={() => handleCopy(password, 'mật khẩu', `pass_${q.id}`)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#FEF3C7] dark:bg-[#78350F] text-[#D97706] dark:text-[#FDE68A] border border-[#FDE68A]"
                        >
                          <Key size={11} />
                          <span>VIP {isPassCopied ? '✓' : ''}</span>
                        </button>
                      )}
                    </div>

                    <button
                      onClick={e => handleToggleActive(q, e)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${
                        isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{isActive ? 'Đang mở' : 'Đã khóa'}</span>
                    </button>
                  </div>

                  {/* Title */}
                  <h3
                    onClick={() => setPreviewQuiz(q)}
                    className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-1 cursor-pointer hover:text-blue-600"
                  >
                    {q.title}
                  </h3>

                  {/* Quiz ID with Copy button */}
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 mb-3">
                    <span className="truncate max-w-[180px]">{q.id}</span>
                    <button
                      onClick={() => handleCopy(q.id, 'ID bài test', `id_${q.id}`)}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      {isIdCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    </button>
                  </div>

                  {/* Stats Pill Row */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl p-2 mb-3 text-center border border-slate-100 dark:border-slate-700">
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{questionCount}</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Câu hỏi</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200">{timeLimit}p</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Thời gian</div>
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-slate-800 dark:text-slate-200 truncate">{authorName}</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Người tạo</div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleCopy(quizUrl, 'link làm bài', `link_${q.id}`)}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        isLinkCopied
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                          : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 active:bg-blue-100'
                      }`}
                    >
                      {isLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isLinkCopied ? 'Đã copy' : 'Copy Link'}</span>
                    </button>

                    <button
                      onClick={() => setPreviewQuiz(q)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      title="Xem trước câu hỏi"
                    >
                      <Eye size={16} />
                    </button>

                    <a
                      href={quizUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      title="Mở đề thi"
                    >
                      <ExternalLink size={16} />
                    </a>

                    <button
                      onClick={e => handleToggleActive(q, e)}
                      className={`p-2 rounded-xl transition-colors border ${
                        isActive
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200'
                      }`}
                      title={isActive ? 'Khóa' : 'Mở khóa'}
                    >
                      {isActive ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>

                    <button
                      onClick={e => handleDeleteQuiz(q, e)}
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ─── Table Footer Bar (Bulk Actions & Pagination) ─── */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Bulk actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Đã chọn <strong className="text-blue-600 dark:text-blue-400">{selectedIds.length}</strong> bài test
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={bulkAction}
                onChange={e => setBulkAction(e.target.value)}
                disabled={selectedIds.length === 0}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 outline-none disabled:opacity-50 cursor-pointer"
              >
                <option value="">Thao tác hàng loạt ▾</option>
                <option value="unlock">Mở khóa đã chọn</option>
                <option value="lock">Khóa đã chọn</option>
                <option value="delete">Xóa đã chọn</option>
              </select>
              {bulkAction && (
                <button
                  onClick={handleApplyBulk}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors"
                >
                  Áp dụng
                </button>
              )}
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const p = i + 1
              if (totalPages > 6 && Math.abs(p - currentPage) > 2 && p !== 1 && p !== totalPages) {
                return null
              }
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-xl font-bold text-xs transition-all ${
                    currentPage === p
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-400 ml-2">
              Tổng {filteredQuizzes.length} bài test
            </span>
          </div>
        </div>

      </div>

      {/* ─── MODAL 1: PREVIEW QUIZ CONTENT ─── */}
      {previewQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                  {previewQuiz.title}
                </h3>
                <p className="text-xs text-slate-400">
                  {previewQuiz.data?.config?.category || 'Chung'} • {previewQuiz.data?.questions?.length || 0} câu hỏi • Thời gian: {previewQuiz.data?.config?.timeLimit || 15} phút
                </p>
              </div>
              <button
                onClick={() => setPreviewQuiz(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {(!previewQuiz.data?.questions || previewQuiz.data.questions.length === 0) ? (
                <div className="py-8 text-center text-slate-400 font-medium text-xs">
                  Không tìm thấy nội dung câu hỏi chi tiết.
                </div>
              ) : (
                previewQuiz.data.questions.slice(0, 15).map((qObj: any, qIdx: number) => {
                  const q = qObj.variants ? qObj.variants[0] : (qObj.question || qObj)
                  return (
                    <div key={qIdx} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-xs">
                      <div className="font-bold text-slate-800 dark:text-slate-100 mb-2">
                        Câu {qIdx + 1}: {q.text || 'Nội dung câu hỏi'}
                      </div>
                      {q.options && (
                        <div className="space-y-1.5 pl-2">
                          {Object.entries(q.options).map(([k, val]: any) => {
                            const isCorrect = q.correct === k
                            return (
                              <div
                                key={k}
                                className={`p-2 rounded-xl border flex items-center gap-2 ${
                                  isCorrect
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                }`}
                              >
                                <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px]">
                                  {k}
                                </span>
                                <span>{val}</span>
                                {isCorrect && <Check size={12} className="text-emerald-600 ml-auto" />}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-medium">
                Hiển thị tối đa 15 câu xem trước
              </span>
              <button
                onClick={() => setPreviewQuiz(null)}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                Đóng xem trước
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: EDIT VIP PASSWORD ─── */}
      {editPassQuiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">
              Đổi Mật Khẩu VIP
            </h3>
            <p className="text-xs text-slate-400 mb-4 line-clamp-1">
              {editPassQuiz.title}
            </p>

            <div className="mb-4">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Mật khẩu mới (để trống nếu muốn công khai)
              </label>
              <input
                type="text"
                placeholder="Nhập mật khẩu VIP..."
                value={newPasswordVal}
                onChange={e => setNewPasswordVal(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditPassQuiz(null)}
                className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleSavePassword}
                className="flex-1 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700"
              >
                Lưu mật khẩu
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
