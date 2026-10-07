'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  FileText,
  Activity,
  TrendingUp,
  Settings,
  Download,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Search,
  RefreshCw,
  Shield,
  Key,
  Database,
  ExternalLink,
  Bell,
  Send,
  Mail,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Clock,
  Sparkles,
  MessageSquare,
  AlertCircle
} from 'lucide-react'

interface TeacherQuiz {
  id: string
  title: string
  createdAt: string
  isActive: boolean
  category: string
  timeLimit: number
  password?: string
}

interface UserItem {
  id: string
  username: string
  email?: string | null
  name?: string | null
  role: string
  maxTests: number
  password?: string
  createdAt?: string | Date
  _count?: {
    quizzes: number
    notifications?: number
  }
  quizzes?: TeacherQuiz[]
}

interface QuizItem {
  id: string
  title: string
  createdAt: string | Date
  isActive?: boolean
  category?: string
  timeLimit?: number
  password?: string
  author?: {
    id?: string
    username: string
  } | null
}

interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  isRead: boolean
  createdAt: string | Date
}

interface DashboardClientProps {
  initialUsers: UserItem[]
  initialQuizzes: QuizItem[]
  initialNotifications?: NotificationItem[]
  isTeacher?: boolean
  currentUserInfo?: UserItem | null
  session: {
    id?: string
    username?: string
    role?: string
    email?: string
  }
}

// Helper định dạng thời gian
function formatTimeAgo(dateInput: string | Date) {
  try {
    const d = new Date(dateInput)
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)
    if (diffSec < 60) return 'Vừa xong'
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`
    if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} ngày trước`
    return d.toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return 'Vừa xong'
  }
}

export default function DashboardClient({
  initialUsers,
  initialQuizzes,
  initialNotifications = [],
  isTeacher = false,
  currentUserInfo = null,
  session
}: DashboardClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes)
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Notifications Drawer State
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const unreadCount = notifications.filter(n => !n.isRead).length

  // Quick Gmail Grant State (Admin)
  const [quickGmail, setQuickGmail] = useState('')

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [viewingUserQuizzes, setViewingUserQuizzes] = useState<UserItem | null>(null)
  const [sendNotifModal, setSendNotifModal] = useState<{ isOpen: boolean; targetUser: UserItem | null; targetAll: boolean }>({
    isOpen: false,
    targetUser: null,
    targetAll: false
  })
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [isSendingNotif, setIsSendingNotif] = useState(false)

  // Form states for Add / Edit User
  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('Gv@123456')
  const [formRole, setFormRole] = useState('TEACHER')
  const [formMaxTests, setFormMaxTests] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Teacher Dashboard Password peek
  const [showPasswordMap, setShowPasswordMap] = useState<Record<string, boolean>>({})

  // Gemini AI Settings states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [geminiKeys, setGeminiKeys] = useState('')
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash')
  const [availableModels, setAvailableModels] = useState<string[]>([
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ])
  const [customModelInput, setCustomModelInput] = useState('')
  const [activeBgEnabled, setActiveBgEnabled] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  // Show welcome notification toast when logging in with unread items
  useEffect(() => {
    if (unreadCount > 0) {
      showToast(`🔔 Bạn có ${unreadCount} thông báo mới! Bấm chuông để xem chi tiết.`, 'info')
    }
  }, [])

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  // --- NOTIFICATION HANDLERS ---
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        showToast('Đã đánh dấu tất cả thông báo là đã đọc!')
      }
    } catch (e) {}
  }

  const handleDeleteNotif = async (id: string) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        showToast('Đã xóa thông báo')
      }
    } catch (e) {}
  }

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifMessage.trim()) {
      showToast('Vui lòng nhập tiêu đề và nội dung thông báo', 'error')
      return
    }

    setIsSendingNotif(true)
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: sendNotifModal.targetUser?.id,
          targetAll: sendNotifModal.targetAll,
          title: notifTitle.trim(),
          message: notifMessage.trim()
        })
      })
      const result = await res.json()
      if (res.ok) {
        showToast(result.message || 'Gửi thông báo thành công!')
        setSendNotifModal({ isOpen: false, targetUser: null, targetAll: false })
        setNotifTitle('')
        setNotifMessage('')
      } else {
        showToast(result.error || 'Gửi thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi gửi thông báo', 'error')
    } finally {
      setIsSendingNotif(false)
    }
  }

  // --- REFRESH DATA ---
  const refreshData = async () => {
    setIsLoading(true)
    try {
      if (!isTeacher) {
        const res = await fetch('/api/admin/users')
        if (res.ok) {
          const data = await res.json()
          setUsers(data)
        }
      }
      const qRes = await fetch('/api/quick-quiz?id=all')
      if (qRes.ok) {
        const qData = await qRes.json()
        setQuizzes(qData)
      }
      const nRes = await fetch('/api/notifications')
      if (nRes.ok) {
        const nData = await nRes.json()
        setNotifications(nData.notifications || [])
      }
      showToast('Đã làm mới dữ liệu thành công!')
    } catch (e) {
      showToast('Lỗi kết nối khi làm mới dữ liệu', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // --- QUICK GMAIL GRANT ---
  const handleQuickGmailSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const email = quickGmail.trim().toLowerCase()
    if (!email || !email.includes('@')) {
      showToast('Vui lòng nhập đúng địa chỉ Gmail hợp lệ', 'error')
      return
    }
    setFormEmail(email)
    setFormUsername(email.split('@')[0])
    setFormName('Thầy/Cô ' + email.split('@')[0])
    setFormRole('TEACHER')
    setFormMaxTests(10)
    setFormPassword('Gv@123456')
    setIsAddUserOpen(true)
    setQuickGmail('')
  }

  // --- USER CREATION & EDIT ---
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const isEditing = Boolean(editingUser)
      const url = '/api/admin/users'
      const method = isEditing ? 'PUT' : 'POST'
      const payload: any = {
        name: formName.trim(),
        email: formEmail.trim().toLowerCase() || null,
        username: formUsername.trim(),
        role: formRole,
        maxTests: Number(formMaxTests) || 10
      }
      if (isEditing) {
        payload.id = editingUser!.id
        if (formPassword.trim()) payload.password = formPassword.trim()
      } else {
        payload.password = formPassword.trim() || 'Gv@123456'
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (res.ok) {
        showToast(isEditing ? 'Cập nhật tài khoản thành công!' : 'Cấp quyền giáo viên thành công!')
        setIsAddUserOpen(false)
        setEditingUser(null)
        await refreshData()
      } else {
        showToast(result.error || 'Thao tác thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditModal = (u: UserItem) => {
    setEditingUser(u)
    setFormName(u.name || '')
    setFormEmail(u.email || '')
    setFormUsername(u.username)
    setFormRole(u.role)
    setFormMaxTests(u.maxTests)
    setFormPassword('')
    setIsAddUserOpen(true)
  }

  const handleDeleteUser = async (u: UserItem) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${u.name || u.username}"? Mọi đề thi của tài khoản này sẽ bị xóa.`)) {
      return
    }
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id })
      })
      if (res.ok) {
        showToast(`Đã xóa tài khoản "${u.name || u.username}"`)
        await refreshData()
      } else {
        const data = await res.json()
        showToast(data.error || 'Xóa thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi khi xóa tài khoản', 'error')
    }
  }

  // --- QUIZ ACTIONS (TEACHER & ADMIN) ---
  const handleToggleQuizStatus = async (id: string, currentStatus: boolean) => {
    const newStatus = !currentStatus
    try {
      const res = await fetch('/api/quick-quiz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: newStatus })
      })
      if (res.ok) {
        setQuizzes(prev => prev.map(q => q.id === id ? { ...q, isActive: newStatus } : q))
        showToast(`Đã ${newStatus ? 'Mở' : 'Khóa'} bài thi`)
      } else {
        const err = await res.json()
        showToast(err.error || 'Không thể đổi trạng thái', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error')
    }
  }

  const handleDeleteQuiz = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn bài thi "${title}"?`)) return
    try {
      const res = await fetch('/api/quick-quiz', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== id))
        showToast(`Đã xóa bài thi "${title}" thành công!`)
      } else {
        const err = await res.json()
        showToast(err.error || 'Không thể xóa bài thi', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi xóa bài thi', 'error')
    }
  }

  const handleCopyLink = (id: string) => {
    const url = `${window.location.origin}/?id=${id}`
    navigator.clipboard.writeText(url)
    showToast('Đã sao chép liên kết bài thi vào bộ nhớ tạm!')
  }

  // --- SETTINGS (GEMINI & BG) ---
  const loadAiSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      if (res.ok) {
        const data = await res.json()
        if (data.apiKeys !== undefined) setGeminiKeys(data.apiKeys)
        if (data.activeModel) setGeminiModel(data.activeModel)
        if (data.availableModels && Array.isArray(data.availableModels)) {
          setAvailableModels(data.availableModels)
        }
        if (data.activeBgEnabled !== undefined) {
          setActiveBgEnabled(Boolean(data.activeBgEnabled))
        }
      }
    } catch (e) {}
  }

  const handleSaveAiSettings = async () => {
    setIsSavingSettings(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeys: geminiKeys,
          activeModel: geminiModel,
          availableModels: availableModels,
          activeBgEnabled: activeBgEnabled
        })
      })
      if (res.ok) {
        showToast('Đã lưu cấu hình cài đặt hệ thống thành công!')
        setIsSettingsOpen(false)
      } else {
        showToast('Không thể lưu cấu hình', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi lưu cấu hình', 'error')
    } finally {
      setIsSavingSettings(false)
    }
  }

  // --- FILTERED LISTS ---
  const categories = Array.from(new Set(['Tất cả', ...quizzes.map(q => q.category || 'Chung')]))

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = (q.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Tất cả' || (q.category || 'Chung') === selectedCategory
    const isActive = q.isActive !== false
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && isActive) || (statusFilter === 'inactive' && !isActive)
    return matchesSearch && matchesCategory && matchesStatus
  })

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase()
    return (
      (u.name || '').toLowerCase().includes(term) ||
      (u.username || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term)
    )
  })

  // Stats calculation
  const totalUsers = users.length
  const totalQuizzes = quizzes.length
  const activeQuizzesCount = quizzes.filter(q => q.isActive !== false).length
  const inactiveQuizzesCount = quizzes.filter(q => q.isActive === false).length
  const teacherLimit = currentUserInfo?.maxTests || 10

  return (
    <div className="min-h-screen bg-slate-50/70 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-white font-bold flex items-center gap-3 transition-all animate-bounce-short ${
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'info' ? 'bg-indigo-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : toast.type === 'info' ? <Bell size={18} /> : <X size={18} />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center p-2 flex-shrink-0">
            <img src="/logo-dzota.png" alt="Dzota" className="w-full h-full object-contain" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isTeacher ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
              }`}>
                {isTeacher ? 'Giáo Viên' : 'Quản Trị Viên (Super Admin)'}
              </span>
              <span className="text-slate-400 text-xs font-semibold">• Đang trực tuyến</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight mt-0.5">
              {isTeacher ? `Bảng Điều Khiển: ${currentUserInfo?.name || session.username}` : 'Hệ Thống Quản Trị Dzota'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              {isTeacher
                ? `Quản lý ${quizzes.length}/${teacherLimit} bài test của bạn • Email: ${currentUserInfo?.email || session.email || 'Chưa cập nhật'}`
                : `Chào mừng ${session.username}! Quản lý cấp quyền giáo viên, đề thi & thông báo`}
            </p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Nút Chuông Thông Báo */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative bg-white border border-slate-200 text-slate-700 p-2.5 sm:px-4 sm:py-2.5 rounded-xl font-bold shadow-xs hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2 cursor-pointer"
            title="Xem hộp thư thông báo"
          >
            <Bell size={18} className={unreadCount > 0 ? 'text-indigo-600 animate-wiggle' : ''} />
            <span className="hidden sm:inline text-xs">Thông báo</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 sm:relative sm:top-auto sm:right-auto bg-rose-500 text-white text-[11px] font-black px-1.5 py-0.2 rounded-full min-w-5 h-5 flex items-center justify-center shadow-xs">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-semibold shadow-xs hover:bg-slate-50 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          {!isTeacher && (
            <button
              onClick={() => {
                loadAiSettings()
                setIsSettingsOpen(true)
              }}
              className="bg-white border border-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl font-semibold shadow-xs hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Settings size={15} />
              <span>Cài Đặt</span>
            </button>
          )}

          <Link
            href="/creator"
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Tạo Đề Mới</span>
          </Link>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTeacher ? 'Đề thi của bạn' : 'Tổng Giáo Viên'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              {isTeacher ? <FileText size={16} /> : <Users size={16} />}
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            {isTeacher ? `${quizzes.length}/${teacherLimit}` : totalUsers}
          </div>
          <div className="text-[11px] font-medium text-slate-400 mt-1">
            {isTeacher ? `Đã dùng ${Math.round((quizzes.length / teacherLimit) * 100)}% hạn mức` : 'Tài khoản hoạt động'}
          </div>
          {isTeacher && (
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  quizzes.length >= teacherLimit ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${Math.min(100, (quizzes.length / teacherLimit) * 100)}%` }}
              />
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isTeacher ? 'Đang mở (Công khai)' : 'Tổng Đề Thi'}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">
            {isTeacher ? activeQuizzesCount : totalQuizzes}
          </div>
          <div className="text-[11px] font-medium text-emerald-600 mt-1">
            Học sinh có thể truy cập
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Đã Khóa</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Lock size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">{inactiveQuizzesCount}</div>
          <div className="text-[11px] font-medium text-slate-400 mt-1">Tạm dừng nhận bài</div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-xs relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hộp Thư</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bell size={16} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-800">{notifications.length}</div>
          <div className="text-[11px] font-bold text-indigo-600 mt-1 cursor-pointer" onClick={() => setIsNotifOpen(true)}>
            {unreadCount > 0 ? `${unreadCount} tin chưa đọc ➔` : 'Đã đọc hết'}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          GIAO DIỆN ADMIN: CẤP QUYỀN GIÁO VIÊN BẰNG GMAIL & QUẢN LÝ TÀI KHOẢN
      ───────────────────────────────────────────────────────────── */}
      {!isTeacher && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
          {/* Thanh Cấp Quyền Giáo Viên Nhanh bằng Gmail */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 p-4 sm:p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white p-1 rounded-lg">
                  <Mail size={16} />
                </span>
                <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                  Cấp Quyền Giáo Viên Bằng Gmail
                </h3>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Google Login
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Nhập Gmail của giáo viên để cấp quyền tạo đề thi. Khi giáo viên đăng nhập bằng Google với Gmail này, họ sẽ tự nhận quyền Giáo viên.
              </p>
            </div>

            <form onSubmit={handleQuickGmailSubmit} className="flex items-center gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Nhập Gmail (vd: giaovien@gmail.com)..."
                value={quickGmail}
                onChange={(e) => setQuickGmail(e.target.value)}
                className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 w-full md:w-72 shadow-2xs"
                required
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex-shrink-0 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Cấp quyền</span>
                <span className="hidden sm:inline">➔</span>
              </button>
            </form>
          </div>

          {/* User Table Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2.5 h-6 bg-indigo-600 rounded-full"></div>
                Danh Sách Giáo Viên & Tài Khoản ({users.length})
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Xem số lượng đề đã tạo, danh sách bài test của từng giáo viên và gửi thông báo trực tiếp
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSendNotifModal({ isOpen: true, targetUser: null, targetAll: true })}
                className="px-3.5 py-2 bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send size={14} /> Gửi thông báo toàn trường
              </button>
              <button
                onClick={() => {
                  setEditingUser(null)
                  setFormName('')
                  setFormEmail('')
                  setFormUsername('')
                  setFormPassword('Gv@123456')
                  setFormRole('TEACHER')
                  setFormMaxTests(10)
                  setIsAddUserOpen(true)
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <Plus size={14} /> Thêm Thủ Công
              </button>
            </div>
          </div>

          {/* User Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                  <th className="p-3.5 border-b border-slate-100">Giáo Viên / Tài Khoản</th>
                  <th className="p-3.5 border-b border-slate-100">Email (Google)</th>
                  <th className="p-3.5 border-b border-slate-100">Quyền hạn</th>
                  <th className="p-3.5 border-b border-slate-100">Số đề đã tạo</th>
                  <th className="p-3.5 border-b border-slate-100">Hạn mức</th>
                  <th className="p-3.5 border-b border-slate-100 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Không tìm thấy giáo viên nào
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5">
                        <div className="font-extrabold text-slate-800 flex items-center gap-1.5">
                          {u.name || u.username}
                          {u.username?.toLowerCase() === 'duylniedu' && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-black">Admin Tối Cao</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">@{u.username}</div>
                      </td>

                      <td className="p-3.5">
                        {u.email ? (
                          <span className="font-medium text-slate-700 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg">
                            {u.email}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Chưa liên kết</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.role?.toLowerCase() === 'admin'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {u.role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <button
                          onClick={() => setViewingUserQuizzes(u)}
                          className="font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Xem chi tiết các bài test của giáo viên này"
                        >
                          <FileText size={13} />
                          <span>{u._count?.quizzes || u.quizzes?.length || 0} đề (Xem DS)</span>
                        </button>
                      </td>

                      <td className="p-3.5">
                        <span className="font-bold text-slate-700">{u.maxTests} đề</span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Gửi thông báo riêng */}
                          <button
                            onClick={() => setSendNotifModal({ isOpen: true, targetUser: u, targetAll: false })}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title={`Gửi thông báo riêng cho ${u.name || u.username}`}
                          >
                            <Send size={15} />
                          </button>

                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin & Hạn mức"
                          >
                            <Edit2 size={15} />
                          </button>

                          {u.username?.toLowerCase() !== 'duylniedu' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          BẢNG QUẢN LÝ BÀI TEST (CHO GIÁO VIÊN HOẶC TOÀN HỆ THỐNG ADMIN)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2.5 h-6 bg-emerald-500 rounded-full"></div>
              {isTeacher ? 'Danh Sách Bài Test Của Bạn' : 'Tất Cả Bài Test Trong Hệ Thống'}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isTeacher
                ? 'Quản lý, sao chép liên kết, khóa/mở bài thi và xem kết quả của chính bạn'
                : 'Theo dõi và quản lý mọi đề thi của các giáo viên trên toàn trường'}
            </p>
          </div>

          {/* Bộ lọc & Tìm kiếm */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên đề thi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 w-44 sm:w-56"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'active' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Đang mở
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === 'inactive' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Đã khóa
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Table */}
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold text-[11px]">
                <th className="p-3.5 border-b border-slate-100">Tên bài thi</th>
                <th className="p-3.5 border-b border-slate-100">Môn / Danh mục</th>
                <th className="p-3.5 border-b border-slate-100">Thời gian</th>
                <th className="p-3.5 border-b border-slate-100">Mật khẩu</th>
                <th className="p-3.5 border-b border-slate-100">Trạng thái (Khóa/Mở)</th>
                <th className="p-3.5 border-b border-slate-100">Ngày tạo</th>
                <th className="p-3.5 border-b border-slate-100 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    <FileText size={36} className="mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">Chưa có đề thi nào</p>
                    <p className="text-xs text-slate-400 mt-1">Bấm nút &quot;+ Tạo Đề Mới&quot; ở trên để bắt đầu soạn đề thi.</p>
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map(q => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5">
                      <a
                        href={`/?id=${q.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-extrabold text-slate-800 hover:text-indigo-600 transition-colors line-clamp-1 flex items-center gap-1.5"
                      >
                        <span>{q.title}</span>
                        <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
                      </a>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {q.id}</div>
                    </td>

                    <td className="p-3.5">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md text-xs">
                        {q.category || 'Chung'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="font-medium text-slate-600 flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" /> {q.timeLimit || 15} phút
                      </span>
                    </td>

                    <td className="p-3.5">
                      {q.password ? (
                        <div className="flex items-center gap-1.5">
                          <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-700">
                            {showPasswordMap[q.id] ? q.password : '••••••'}
                          </code>
                          <button
                            type="button"
                            onClick={() => setShowPasswordMap(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                            className="text-slate-400 hover:text-slate-600 p-0.5"
                            title="Hiện/Ẩn mật khẩu"
                          >
                            {showPasswordMap[q.id] ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Không có</span>
                      )}
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleToggleQuizStatus(q.id, q.isActive !== false)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          q.isActive !== false
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                        title="Bấm để Đóng hoặc Mở đề thi"
                      >
                        {q.isActive !== false ? <Unlock size={12} /> : <Lock size={12} />}
                        <span>{q.isActive !== false ? 'Đang mở' : 'Đã khóa'}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-slate-500 font-medium text-xs">
                      {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                    </td>

                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleCopyLink(q.id)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                          title="Sao chép link làm bài"
                        >
                          <Copy size={15} />
                        </button>

                        <a
                          href={`/creator?id=${q.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Chỉnh sửa đề thi"
                        >
                          <Edit2 size={15} />
                        </a>

                        <button
                          onClick={() => handleDeleteQuiz(q.id, q.title)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa đề thi"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          DRAWER: HỘP THƯ THÔNG BÁO CỦA TÀI KHOẢN (CÓ THỜI GIAN THỰC)
      ───────────────────────────────────────────────────────────── */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex justify-end animate-fade-in">
          <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-slide-in-right">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Hộp Thư Thông Báo</h3>
                  <p className="text-[11px] font-medium text-slate-500">
                    {unreadCount > 0 ? `${unreadCount} thông báo mới chưa đọc` : 'Không có thông báo mới'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Đọc tất cả
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notifications.length === 0 ? (
                <div className="py-20 text-center text-slate-400">
                  <Bell size={36} className="mx-auto mb-2 text-slate-200" />
                  <p className="font-bold text-sm text-slate-600">Hộp thư trống</p>
                  <p className="text-xs text-slate-400 mt-1">Bạn chưa có thông báo nào từ hệ thống.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all relative ${
                      !n.isRead
                        ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                        : 'bg-white border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 animate-pulse" />
                        )}
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm">
                          {n.title}
                        </h4>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1 flex-shrink-0">
                        <Clock size={11} /> {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-normal whitespace-pre-line pl-4">
                      {n.message}
                    </p>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100/70 text-[11px] text-slate-400">
                      <span>{new Date(n.createdAt).toLocaleDateString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      <button
                        onClick={() => handleDeleteNotif(n.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: XEM DANH SÁCH BÀI TEST CỦA MỘT GIÁO VIÊN (ADMIN)
      ───────────────────────────────────────────────────────────── */}
      {viewingUserQuizzes && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText size={20} className="text-indigo-600" />
                  Đề Thi Của: {viewingUserQuizzes.name || viewingUserQuizzes.username}
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Email: {viewingUserQuizzes.email || 'Chưa liên kết'} • Đã tạo: {viewingUserQuizzes.quizzes?.length || 0} / {viewingUserQuizzes.maxTests} đề
                </p>
              </div>
              <button
                onClick={() => setViewingUserQuizzes(null)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {!viewingUserQuizzes.quizzes || viewingUserQuizzes.quizzes.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText size={32} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-sm text-slate-600">Giáo viên này chưa tạo bài test nào</p>
                </div>
              ) : (
                viewingUserQuizzes.quizzes.map(q => (
                  <div
                    key={q.id}
                    className="p-4 bg-slate-50/70 border border-slate-200/70 rounded-2xl flex items-center justify-between gap-3 hover:bg-white hover:shadow-xs transition-all"
                  >
                    <div>
                      <a
                        href={`/?id=${q.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-extrabold text-slate-800 hover:text-indigo-600 text-sm flex items-center gap-1.5"
                      >
                        <span>{q.title}</span>
                        <ExternalLink size={12} className="text-slate-400" />
                      </a>
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-1">
                        <span>Môn: {q.category}</span>
                        <span>•</span>
                        <span>{q.timeLimit} phút</span>
                        <span>•</span>
                        <span>{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                        q.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {q.isActive ? 'Đang mở' : 'Đã khóa'}
                      </span>
                      <button
                        onClick={() => handleCopyLink(q.id)}
                        className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 rounded-lg cursor-pointer"
                        title="Copy link"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingUserQuizzes(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: GỬI THÔNG BÁO CHO GIÁO VIÊN (ADMIN)
      ───────────────────────────────────────────────────────────── */}
      {sendNotifModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {sendNotifModal.targetAll
                      ? 'Gửi Thông Báo Toàn Trường'
                      : `Gửi Cho: ${sendNotifModal.targetUser?.name || sendNotifModal.targetUser?.username}`}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Thông báo sẽ xuất hiện ngay lập tức trong hộp thư của tài khoản
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSendNotifModal({ isOpen: false, targetUser: null, targetAll: false })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tiêu đề thông báo</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cập nhật hạn mức đề thi mới / Chúc mừng bạn..."
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nội dung thông báo</label>
                <textarea
                  rows={4}
                  placeholder="Nhập nội dung chi tiết muốn gửi..."
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSendNotifModal({ isOpen: false, targetUser: null, targetAll: false })}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <Send size={14} />
                  <span>{isSendingNotif ? 'Đang gửi...' : 'Gửi Ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: THÊM / SỬA TÀI KHOẢN GIÁO VIÊN
      ───────────────────────────────────────────────────────────── */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" />
                {editingUser ? `Chỉnh Sửa: ${editingUser.name || editingUser.username}` : 'Cấp Quyền Giáo Viên Mới'}
              </h3>
              <button
                onClick={() => {
                  setIsAddUserOpen(false)
                  setEditingUser(null)
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên Giáo Viên</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thầy Nguyễn Văn Nam"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email / Gmail (Đăng nhập Google)</label>
                <input
                  type="email"
                  placeholder="ví dụ: giaovien@gmail.com"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tên đăng nhập (Username)</label>
                <input
                  type="text"
                  placeholder="Username đăng nhập"
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Quyền Hạn</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="TEACHER">Giáo Viên</option>
                    <option value="ADMIN">Quản Trị Viên</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Hạn Mức Đề Thi</label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={formMaxTests}
                    onChange={(e) => setFormMaxTests(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  {editingUser ? 'Mật khẩu mới (Để trống nếu không đổi)' : 'Mật khẩu dự phòng'}
                </label>
                <input
                  type="text"
                  placeholder={editingUser ? 'Nhập mật khẩu mới...' : 'Mặc định: Gv@123456'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddUserOpen(false)
                    setEditingUser(null)
                  }}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CÀI ĐẶT HỆ THỐNG & GEMINI API (ADMIN)
      ───────────────────────────────────────────────────────────── */}
      {isSettingsOpen && !isTeacher && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" />
                Cài Đặt Hệ Thống & Trí Tuệ Nhân Tạo
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 mt-4">
              {/* Active Background Switch */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">Ảnh Nền Khi Làm Bài Thi</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                    Bật ảnh nền đẹp mắt khi học sinh làm bài thi / luyện tập. Tắt đi sẽ quay về nền trắng tối giản.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={activeBgEnabled}
                  onChange={(e) => setActiveBgEnabled(e.target.checked)}
                  className="w-5 h-5 accent-indigo-600 cursor-pointer"
                />
              </div>

              {/* Gemini API Keys */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Gemini API Keys (Phân cách bằng dấu phẩy)
                </label>
                <textarea
                  rows={3}
                  value={geminiKeys}
                  onChange={(e) => setGeminiKeys(e.target.value)}
                  placeholder="AIzaSy..., AIzaSy..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none focus:border-indigo-600"
                />
              </div>

              {/* Active Model */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Model AI Đang Sử Dụng</label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiSettings}
                  disabled={isSavingSettings}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettings ? 'Đang lưu...' : 'Lưu Cài Đặt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
