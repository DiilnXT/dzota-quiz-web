'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  Copy,
  ExternalLink,
  School,
  Shield,
  Settings,
  Flame,
  ArrowRight,
  TrendingUp,
  Cpu,
  Zap,
  Activity,
  Layers,
  Award,
  Users,
  Eye,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Filter,
  Brain,
  Share2,
  Check,
  Send,
  RefreshCw,
  Sun,
  Moon,
  Sunset,
  Bell,
  Key,
  Folder
} from 'lucide-react'

export interface ModernAdminDashboardProps {
  quizzes: any[]
  classes: any[]
  users: any[]
  session: {
    id?: string
    username?: string
    role?: string
    email?: string
    name?: string
    avatar?: string
    phone?: string
  }
  isTeacher: boolean
  isAdmin: boolean
  teacherLimit: number
  geminiModel?: string
  unreadCount?: number
  isLoading?: boolean
  onOpenNotif?: () => void
  onRefresh?: () => void
  onOpenChangePass?: () => void
  onSwitchTab: (tab: string) => void
  onToggleQuizStatus: (quizId: string, currentStatus: boolean) => void
  onCopyShareLink: (quizId: string) => void
  onDeleteQuiz?: (quizId: string) => void
  formatTimeAgo: (date: string | Date) => string
}

export default function ModernAdminDashboard({
  quizzes = [],
  classes = [],
  users = [],
  session,
  isTeacher,
  isAdmin,
  teacherLimit,
  geminiModel = 'gemini-3.8-flash',
  unreadCount = 0,
  isLoading = false,
  onOpenNotif,
  onRefresh,
  onOpenChangePass,
  onSwitchTab,
  onToggleQuizStatus,
  onCopyShareLink,
  onDeleteQuiz,
  formatTimeAgo
}: ModernAdminDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Determine time-of-day greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      return { text: 'Chào buổi sáng rực rỡ', icon: Sun, color: 'text-amber-400' }
    } else if (hour < 18) {
      return { text: 'Chào buổi chiều năng suất', icon: Sunset, color: 'text-orange-400' }
    } else {
      return { text: 'Chào buổi tối thảnh thơi', icon: Moon, color: 'text-indigo-400' }
    }
  }, [])

  // Safe collections
  const safeQuizzes = Array.isArray(quizzes) ? quizzes : []
  const safeClasses = Array.isArray(classes) ? classes : []
  const safeUsers = Array.isArray(users) ? users : []

  // Stats calculation
  const totalQuizzes = safeQuizzes.length
  const activeQuizzes = safeQuizzes.filter(q => q && q.isActive !== false).length
  const inactiveQuizzes = safeQuizzes.filter(q => q && q.isActive === false).length
  const activePercent = totalQuizzes > 0 ? Math.round((activeQuizzes / totalQuizzes) * 100) : 0

  const totalStudents = useMemo(() => {
    const emailSet = new Set<string>()
    safeClasses.forEach(c => {
      c?.students?.forEach((s: any) => {
        if (s?.email) emailSet.add(s.email.toLowerCase())
      })
    })
    return emailSet.size
  }, [safeClasses])

  // Unique categories list
  const categories = useMemo(() => {
    const set = new Set<string>()
    safeQuizzes.forEach(q => {
      if (q?.category) set.add(q.category)
    })
    return Array.from(set)
  }, [quizzes])

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return safeQuizzes.filter(q => {
      const matchSearch = (q.title || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (q.category || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (q.author?.name || q.author?.username || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
      
      const matchCat = selectedCategory === 'all' || q.category === selectedCategory
      const isActive = q.isActive !== false
      const matchStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && isActive) ||
        (statusFilter === 'inactive' && !isActive)

      return matchSearch && matchCat && matchStatus
    })
  }, [quizzes, searchQuery, selectedCategory, statusFilter])

  // Copy share handler
  const handleCopyLink = (id: string) => {
    onCopyShareLink(id)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const GreetingIcon = greeting.icon

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ─── 0. TOP USER PROFILE & ACTION BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B0F19]/90 backdrop-blur-xl border border-slate-800/80 p-4 sm:px-6 sm:py-3.5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-cyan-400 p-0.5 shadow-md shadow-indigo-500/20 shrink-0">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] overflow-hidden flex items-center justify-center">
              {session.avatar ? (
                <img src={session.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <img src="/logo-dzota.png" alt="Dzota" className="w-full h-full object-contain p-1" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-black text-white">{session.name || session.username}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                {isAdmin ? 'Super Admin' : isTeacher ? 'Giáo Viên' : 'Học Sinh'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs">{session.email || 'lenhatduy.vietnam@gmail.com'}</p>
          </div>
        </div>

        {/* Action utility buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {onOpenNotif && (
            <button
              onClick={onOpenNotif}
              className="relative p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Xem thông báo"
            >
              <Bell className={`w-4 h-4 ${unreadCount > 0 ? 'text-indigo-400 animate-wiggle' : ''}`} />
              <span className="hidden sm:inline">Thông báo</span>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          )}

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Làm mới dữ liệu từ máy chủ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
              <span className="hidden sm:inline">Làm mới</span>
            </button>
          )}

          {onOpenChangePass && (
            <button
              onClick={onOpenChangePass}
              className="p-2.5 sm:px-3 sm:py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 transition-all cursor-pointer text-xs font-bold flex items-center gap-1.5 shadow-sm"
              title="Đổi mật khẩu tài khoản"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Đổi Mật Khẩu</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── 1. HERO INTELLIGENCE BANNER & COMMAND HUB ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#111827] border border-indigo-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-indigo-950/40">
        {/* Glow ambient background lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            {/* Top Badges Pill */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                <GreetingIcon className={`w-3.5 h-3.5 ${greeting.color}`} />
                <span>{greeting.text}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{isAdmin ? 'Super Admin Trung Tâm' : 'Giáo Viên Giảng Dạy'}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI Neural: {geminiModel}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
              Bảng Điều Hành Thông Minh Dzota
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Hệ thống tạo đề trắc nghiệm AI thế hệ mới, phân quyền lớp học tự động theo Gmail và mô phỏng chạy trạm y khoa DYNEX chuẩn thi OSCE.
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <a
                href="/creator"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 no-underline cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Soạn Đề Mới (AI / Thủ Công)</span>
              </a>

              <a
                href="/creator?view=bank"
                className="px-4 py-2.5 rounded-xl bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-300 hover:text-white font-black text-xs sm:text-sm flex items-center gap-2 transition-all active:scale-95 no-underline cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                <Folder className="w-4 h-4 text-emerald-400" />
                <span>Ngân Hàng Câu Hỏi & Kho Đề</span>
              </a>

              <Link
                href="/dynex"
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 no-underline cursor-pointer"
              >
                <Flame className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>Mở DYNEX Y Khoa (OSCE)</span>
                <ExternalLink className="w-3.5 h-3.5 text-rose-200" />
              </Link>

              <button
                onClick={() => onSwitchTab('classes')}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <School className="w-4 h-4 text-purple-400" />
                <span>Quản Lý Lớp Học</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Circle & Summary Widget */}
          <div className="bg-[#070b14]/90 border border-slate-800/90 rounded-3xl p-5 sm:p-6 shadow-xl shrink-0 w-full sm:w-auto min-w-[280px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trạng Thái Hệ Thống</span>
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                100% Hoạt Động
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng Đề Thi</span>
                <div className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">
                  {totalQuizzes}
                  {isTeacher && <span className="text-xs text-slate-400 font-normal">/{teacherLimit}</span>}
                </div>
                <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 mt-1">
                  <span>{activeQuizzes} đang mở</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lớp & Học Viên</span>
                <div className="text-2xl sm:text-3xl font-black text-purple-400 font-mono mt-0.5">
                  {safeClasses.length}
                </div>
                <div className="text-[11px] text-slate-400 font-bold flex items-center gap-1 mt-1">
                  <span>{totalStudents} học sinh</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. INTERACTIVE BENTO GRID METRICS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Bento 1: Quizzes & Status Distribution */}
        <div
          onClick={() => onSwitchTab('quizzes')}
          className="rounded-3xl bg-[#111827] border border-slate-800 p-5 sm:p-6 shadow-xl hover:border-indigo-500/60 hover:shadow-indigo-500/10 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {isTeacher ? 'Đề Thi Của Bạn' : 'Tổng Kho Đề Thi'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-blue-500/20">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {totalQuizzes}
              <span className="text-xs font-normal text-slate-400 ml-1.5">bài test</span>
            </div>

            {/* Active ratio progress bar */}
            <div className="space-y-1.5 mt-3 pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {activeQuizzes} Đang mở
                </span>
                <span className="text-rose-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> {inactiveQuizzes} Đã khóa
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                <div className="bg-emerald-500 h-full" style={{ width: `${activePercent}%` }} />
                <div className="bg-rose-500 h-full flex-1" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
            <span>Vào kho đề thi</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Bento 2: Lớp Học & Học Viên */}
        <div
          onClick={() => onSwitchTab('classes')}
          className="rounded-3xl bg-[#111827] border border-slate-800 p-5 sm:p-6 shadow-xl hover:border-purple-500/60 hover:shadow-purple-500/10 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                {isTeacher ? 'Lớp Phụ Trách' : 'Hệ Thống Lớp Học'}
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-purple-500/20">
                <School className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black text-white font-mono">
              {safeClasses.length}
              <span className="text-xs font-normal text-slate-400 ml-1.5">lớp học</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Quản lý <strong className="text-purple-300">{totalStudents} học sinh</strong> qua Gmail và mã PIN lớp học bảo mật.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-purple-400 group-hover:text-purple-300">
            <span>Phân quyền lớp học</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Bento 3: DYNEX Y Khoa (OSCE & Spaced Repetition) */}
        <Link
          href="/dynex"
          target="_blank"
          className="rounded-3xl bg-gradient-to-b from-[#111827] to-[#160c1d] border border-rose-500/40 p-5 sm:p-6 shadow-xl hover:border-rose-500/80 hover:shadow-rose-500/20 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden no-underline"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/15 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-rose-400 fill-current animate-pulse" />
                <span>DYNEX Y Khoa</span>
              </span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-rose-500/30">
                <Brain className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-white">
              Thi Chạy Trạm OSCE
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Ngân hàng ô che giải phẫu 100% không lộ chữ, chuông 20 giây chuyển trạm & học thuộc não bộ Anki SM-2.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-rose-400 group-hover:text-rose-300">
            <span>Mở Studio DYNEX</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Bento 4: AI & Cài Đặt Hệ Thống */}
        <div
          onClick={() => onSwitchTab('settings')}
          className="rounded-3xl bg-[#111827] border border-slate-800 p-5 sm:p-6 shadow-xl hover:border-emerald-500/60 hover:shadow-emerald-500/10 transition-all duration-200 cursor-pointer group flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                AI & Cấu Hình Web
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform border border-emerald-500/20">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-400 truncate">
              {geminiModel}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Hệ thống đa tầng Gemini API Keys, quản lý người dùng, giao diện nền động và thông báo toàn máy chủ.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-emerald-400 group-hover:text-emerald-300">
            <span>Cài đặt hệ thống</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      {/* ─── 4. SMART QUIZ EXPLORER & QUICK ACTIONS ─── */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
        {/* Explorer Header with Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>{isTeacher ? 'Kho Đề Thi Của Bạn' : 'Ngân Hàng Đề Thi Toàn Hệ Thống'}</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
                {filteredQuizzes.length}/{totalQuizzes}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Tìm kiếm, kích hoạt/tạm khóa làm bài và sao chép link gửi cho học sinh trong nháy mắt.
            </p>
          </div>

          {/* View mode toggle & Quick Create */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Xem dạng thẻ lưới"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
                title="Xem dạng bảng chi tiết"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <a
              href="/creator?view=bank"
              className="px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center gap-1.5 no-underline transition-all cursor-pointer"
            >
              <Folder className="w-4 h-4 text-emerald-400" />
              <span>Ngân Hàng Câu Hỏi</span>
            </a>

            <a
              href="/creator"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 no-underline transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Tạo Đề Mới</span>
            </a>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên đề thi, môn học hoặc tác giả..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({totalQuizzes})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đang mở ({activeQuizzes})
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'inactive' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Đã khóa ({inactiveQuizzes})
            </button>
          </div>
        </div>

        {/* Category Pills Bar */}
        {categories.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              Tất cả chuyên mục
            </button>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredQuizzes.length === 0 ? (
          <div className="p-12 text-center bg-[#070b14] border border-slate-800/80 rounded-2xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">Không tìm thấy bài test nào phù hợp</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Thử thay đổi từ khóa tìm kiếm hoặc bấm nút Tạo Đề Mới để bắt đầu soạn đề thi!
            </p>
            <div className="pt-2">
              <a
                href="/creator"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md no-underline"
              >
                <Plus className="w-4 h-4" />
                <span>Soạn Đề Ngay</span>
              </a>
            </div>
          </div>
        ) : viewMode === 'cards' ? (
          /* Cards Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuizzes.map(quiz => {
              const isActive = quiz.isActive !== false
              const qCount = quiz.questionsCount || quiz.questions?.length || 0

              return (
                <div
                  key={quiz.id}
                  className="rounded-2xl bg-[#070b14] border border-slate-800 hover:border-indigo-500/50 p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group shadow-md hover:shadow-indigo-500/10"
                >
                  <div>
                    {/* Top row: Category & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                        {quiz.category || 'Chung'}
                      </span>

                      <button
                        onClick={() => onToggleQuizStatus(quiz.id, isActive)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
                          isActive
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                            : 'bg-rose-950/80 text-rose-300 border-rose-500/40 hover:bg-rose-900'
                        }`}
                        title={isActive ? 'Bấm để khóa bài thi' : 'Bấm để mở bài thi'}
                      >
                        {isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-rose-400" />}
                        <span>{isActive ? 'Đang mở' : 'Đã khóa'}</span>
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-indigo-300 transition-colors line-clamp-2 leading-snug">
                      <a
                        href={`/?id=${quiz.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white hover:text-indigo-300 no-underline"
                      >
                        {quiz.title}
                      </a>
                    </h3>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium mt-3 pt-3 border-t border-slate-800/80">
                      <span>{qCount} câu hỏi</span>
                      <span>•</span>
                      <span>{quiz.timeLimit || 15} phút</span>
                      <span>•</span>
                      <span>{formatTimeAgo(quiz.createdAt)}</span>
                    </div>

                    {quiz.author?.name && (
                      <p className="text-[11px] text-slate-500 mt-1">
                        Tác giả: <span className="text-slate-300 font-semibold">{quiz.author.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopyLink(quiz.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700/80 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Sao chép link làm bài"
                      >
                        {copiedId === quiz.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === quiz.id ? 'Đã chép' : 'Link'}</span>
                      </button>

                      <a
                        href={`/?id=${quiz.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 text-xs transition-colors cursor-pointer inline-flex items-center no-underline"
                        title="Làm thử bài thi (Tab mới)"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={`/creator?id=${quiz.id}`}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-300 border border-slate-700/80 text-xs transition-colors cursor-pointer inline-flex items-center no-underline"
                        title="Sửa đề thi trong Creator"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {onDeleteQuiz && (
                      <button
                        onClick={() => {
                          if (confirm(`Bạn có chắc chắn muốn xóa bài thi "${quiz.title}" không?`)) {
                            onDeleteQuiz(quiz.id)
                          }
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 border border-rose-800/40 text-xs transition-colors cursor-pointer"
                        title="Xóa bài thi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#070b14] text-slate-400 font-black uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tên Đề Thi</th>
                  <th className="py-3 px-3 text-center">Chuyên Mục</th>
                  <th className="py-3 px-3 text-center">Trạng Thái</th>
                  <th className="py-3 px-3 text-center">Số Câu</th>
                  <th className="py-3 px-3 text-center">Thời Lượng</th>
                  <th className="py-3 px-3 text-right">Ngày Tạo</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#070b14]/50">
                {filteredQuizzes.map(quiz => {
                  const isActive = quiz.isActive !== false
                  const qCount = quiz.questionsCount || quiz.questions?.length || 0

                  return (
                    <tr key={quiz.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                        <a
                          href={`/?id=${quiz.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-white hover:text-indigo-400 no-underline flex items-center gap-1.5"
                        >
                          <span className="truncate">{quiz.title}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                        </a>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
                          {quiz.category || 'Chung'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => onToggleQuizStatus(quiz.id, isActive)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900'
                              : 'bg-rose-950/80 text-rose-300 border-rose-500/40 hover:bg-rose-900'
                          }`}
                        >
                          {isActive ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-rose-400" />}
                          <span>{isActive ? 'Mở' : 'Khóa'}</span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                        {qCount}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {quiz.timeLimit || 15}p
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 text-xs">
                        {formatTimeAgo(quiz.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => handleCopyLink(quiz.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-indigo-900/60 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer inline-flex items-center"
                          title="Sao chép link làm bài"
                        >
                          {copiedId === quiz.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`/creator?id=${quiz.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-300 border border-slate-700/80 transition-colors cursor-pointer inline-flex items-center no-underline"
                          title="Sửa đề thi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </a>
                        {onDeleteQuiz && (
                          <button
                            onClick={() => {
                              if (confirm(`Bạn có chắc chắn muốn xóa bài thi "${quiz.title}" không?`)) {
                                onDeleteQuiz(quiz.id)
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-950/30 hover:bg-rose-900/50 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors cursor-pointer inline-flex items-center"
                            title="Xóa bài thi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
