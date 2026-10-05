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
  Table as TableIcon
} from 'lucide-react'

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

  // Copy helper
  const handleCopy = (text: string, label: string, idToMark?: string) => {
    try {
      navigator.clipboard.writeText(text)
      if (idToMark) {
        setCopiedId(idToMark)
        setTimeout(() => setCopiedId(null), 2000)
      }
      showToast(`Đã copy ${label}: "${text.length > 30 ? text.substring(0, 30) + '...' : text}"`)
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
    if (c.includes('vi sinh')) return 'bg-[#EDE9FE] text-[#7C3AED] border-[#DDD6FE]'
    if (c.includes('sinh học') || c.includes('sinh')) return 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]'
    if (c.includes('dược') || c.includes('hóa')) return 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]'
    if (c.includes('giải phẫu')) return 'bg-[#FCE7F3] text-[#DB2777] border-[#FBCFE8]'
    return 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]'
  }

  // Filtering
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter(q => {
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

      return titleMatch && categoryMatch && statusMatch && creatorMatch && myMatch
    })
  }, [quizzes, searchTerm, categoryFilter, statusFilter, creatorFilter, onlyMine, currentUsername])

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

      {/* ─── Top Header Bar (Breadcrumbs, Quick Search, User Info) ─── */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl px-4 sm:px-6 py-3 border border-slate-200/80 shadow-2xs flex items-center justify-between gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 overflow-hidden">
          <span className="text-slate-400">Kho đề thi</span>
          <span className="text-slate-300">›</span>
          <span className="text-blue-600 font-bold truncate">Quản lý bài test</span>
        </div>

        {/* Right tools (Search, Notifications, User) */}
        <div className="flex items-center gap-3">
          {/* Quick Search */}
          <div className="relative hidden md:block w-52 lg:w-64">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="search-quiz-input"
              placeholder="Tìm kiếm nhanh..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50/80 border border-slate-200 rounded-full text-xs font-medium text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Notification bell */}
          <button className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          </button>

          {/* User profile dropdown pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-xs flex items-center justify-center shadow-xs">
              {currentUsername.charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">{currentUsername}</div>
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
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
              Quản Lý Danh Sách Bài Test
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
              Bảng thống kê toàn bộ đề thi, quản lý mật khẩu, trạng thái và đường link làm bài
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all active:scale-95"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <button
            onClick={refreshQuizzes}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-50 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-2xs transition-all active:scale-95"
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

      {/* ─── 4 KPI Summary Cards (Exact UI from screenshot) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Tổng số đề thi */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
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
            <div className="text-xs font-semibold text-slate-500">Tổng số đề thi</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{totalCount}</div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
              <span>↗</span>
              <span>+2 đề trong tháng</span>
            </div>
          </div>
        </div>

        {/* Card 2: Đang mở */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
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
            <div className="text-xs font-semibold text-slate-500">Đang mở</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{activeCount}</div>
            <div className="text-[11px] font-bold text-emerald-600 mt-1">
              {activePercent}% đang mở
            </div>
          </div>
        </div>

        {/* Card 3: Đã khóa */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shadow-xs">
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
            <div className="text-xs font-semibold text-slate-500">Đã khóa</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{lockedCount}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              {lockedCount === 0 ? 'Chưa có đề khóa' : `${lockedCount} đề đang khóa`}
            </div>
          </div>
        </div>

        {/* Card 4: Có mật khẩu VIP */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden group hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs">
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
            <div className="text-xs font-semibold text-slate-500">Có mật khẩu VIP</div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight mt-0.5">{passCount}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-1">
              {passCount === 0 ? 'Chưa thiết lập' : `${passCount} đề bảo vệ`}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Search & Filters Bar ─── */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/80 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          {/* Main search input */}
          <div className="relative flex-1 sm:w-72 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên bài test, ID, người tạo..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-14 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-200/60 px-1.5 py-0.5 rounded-md pointer-events-none">
              Ctrl + K
            </span>
          </div>

          {/* Subject Filter */}
          <select
            value={categoryFilter}
            onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
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
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang mở</option>
            <option value="locked">Đã khóa</option>
          </select>

          {/* Creator Filter */}
          <select
            value={creatorFilter}
            onChange={e => { setCreatorFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer"
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
                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
            }`}
          >
            <Lock size={12} />
            <span>Đề của tôi</span>
          </button>
        </div>

        {/* Right tools (Clear filters / Advanced filter) */}
        <div className="flex items-center gap-2">
          {(searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' || creatorFilter !== 'all' || onlyMine) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('all')
                setStatusFilter('all')
                setCreatorFilter('all')
                setOnlyMine(false)
                setCurrentPage(1)
              }}
              className="text-xs font-semibold text-rose-500 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
            >
              Xóa bộ lọc
            </button>
          )}

          <button
            onClick={() => showToast('Bộ lọc đã được tối ưu hóa đầy đủ!')}
            className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Bộ lọc nâng cao</span>
          </button>
        </div>
      </div>

      {/* ─── Main Table Container ─── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-[0_4px_25px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col">
        
        {/* Table Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <FileText size={15} />
            </div>
            <h2 className="text-base font-extrabold text-slate-800">Danh sách bài test</h2>
            <span className="bg-blue-50 text-blue-600 font-extrabold text-xs px-2 py-0.5 rounded-full border border-blue-100">
              {filteredQuizzes.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile View Switcher (Cards vs Table) */}
            <div className="flex md:hidden items-center bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setMobileViewMode('card')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  mobileViewMode === 'card' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
                title="Dạng thẻ"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                onClick={() => setMobileViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  mobileViewMode === 'table' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'
                }`}
                title="Dạng bảng"
              >
                <TableIcon size={14} />
              </button>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Hiển thị</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-700 outline-none cursor-pointer"
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
              <tr className="bg-slate-50/75 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-100">
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
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {paginatedQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400 font-medium">
                    <div className="max-w-xs mx-auto">
                      <FileText size={40} className="mx-auto text-slate-300 mb-2" />
                      <div className="font-bold text-slate-700 mb-1">Không tìm thấy bài test nào</div>
                      <div className="text-xs text-slate-400">Hãy thử tìm với từ khóa khác hoặc điều chỉnh bộ lọc</div>
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
                      className={`hover:bg-blue-50/30 transition-colors group ${
                        isSelected ? 'bg-blue-50/50' : ''
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
                        <div className="font-extrabold text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
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
                        <div className="font-black text-slate-800 text-sm">{questionCount}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">câu hỏi</div>
                      </td>

                      {/* Thời gian */}
                      <td className="py-4 px-3 text-center">
                        <div className="font-black text-slate-800 text-sm">{timeLimit}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">phút</div>
                      </td>

                      {/* Mật khẩu */}
                      <td className="py-4 px-3 text-center">
                        {password ? (
                          <button
                            onClick={() => handleCopy(password, 'mật khẩu', `pass_${q.id}`)}
                            title="Bấm để sao chép mật khẩu VIP"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A] hover:bg-amber-200/60 active:scale-95 transition-all shadow-2xs"
                          >
                            <Key size={12} />
                            <span>VIP</span>
                            {isPassCopied ? <Check size={12} className="text-emerald-700 ml-0.5" /> : null}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold text-slate-400 bg-slate-100">
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
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
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
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border-slate-200'
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
                            className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      </td>

                      {/* Người tạo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                          <User size={13} className="text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{authorName}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit / Open in Editor */}
                          <Link
                            href={`/?id=${q.id}`}
                            title="Xem chi tiết đề"
                            className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit size={15} />
                          </Link>

                          {/* Toggle Active */}
                          <button
                            onClick={e => handleToggleActive(q, e)}
                            title={isActive ? 'Khóa bài thi' : 'Mở khóa bài thi'}
                            className={`p-2 rounded-xl transition-colors ${
                              isActive
                                ? 'text-amber-500 hover:text-amber-700 hover:bg-amber-50'
                                : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            {isActive ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={e => handleDeleteQuiz(q, e)}
                            title="Xóa bài thi"
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
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
              <FileText size={36} className="mx-auto text-slate-300 mb-2" />
              <div className="font-bold text-slate-700">Không tìm thấy bài test nào</div>
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
                  className={`bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs transition-all relative ${
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]"
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
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{isActive ? 'Đang mở' : 'Đã khóa'}</span>
                    </button>
                  </div>

                  {/* Title */}
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug line-clamp-2 mb-1">
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
                  <div className="grid grid-cols-3 gap-2 bg-slate-50/80 rounded-xl p-2 mb-3 text-center border border-slate-100">
                    <div>
                      <div className="text-xs font-black text-slate-800">{questionCount}</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Câu hỏi</div>
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800">{timeLimit}p</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Thời gian</div>
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-black text-slate-800 truncate">{authorName}</div>
                      <div className="text-[10px] font-semibold text-slate-400 uppercase">Người tạo</div>
                    </div>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleCopy(quizUrl, 'link làm bài', `link_${q.id}`)}
                      className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                        isLinkCopied
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-blue-50 text-blue-600 border-blue-200 active:bg-blue-100'
                      }`}
                    >
                      {isLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                      <span>{isLinkCopied ? 'Đã copy' : 'Copy Link'}</span>
                    </button>

                    <a
                      href={quizUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      title="Mở đề thi"
                    >
                      <ExternalLink size={16} />
                    </a>

                    <button
                      onClick={e => handleToggleActive(q, e)}
                      className={`p-2 rounded-xl transition-colors border ${
                        isActive
                          ? 'bg-amber-50 text-amber-600 border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                      }`}
                      title={isActive ? 'Khóa' : 'Mở khóa'}
                    >
                      {isActive ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>

                    <button
                      onClick={e => handleDeleteQuiz(q, e)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors"
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
        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Bulk actions */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Đã chọn <strong className="text-blue-600">{selectedIds.length}</strong> bài test
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={bulkAction}
                onChange={e => setBulkAction(e.target.value)}
                disabled={selectedIds.length === 0}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none disabled:opacity-50 cursor-pointer"
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
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors"
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
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <span className="text-xs font-semibold text-slate-400 ml-2">
              Tổng {filteredQuizzes.length} bài test
            </span>
          </div>
        </div>

      </div>

    </div>
  )
}
