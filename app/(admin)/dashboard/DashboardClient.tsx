'use client'

import React, { useState } from 'react'
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
  Image as ImageIcon
} from 'lucide-react'

interface UserItem {
  id: string
  username: string
  role: string
  maxTests: number
  password?: string
  createdAt?: string | Date
  _count: {
    quizzes: number
  }
}

interface QuizItem {
  id: string
  title: string
  createdAt: string | Date
  author?: {
    username: string
  } | null
}

interface DashboardClientProps {
  initialUsers: UserItem[]
  initialQuizzes: QuizItem[]
  session: {
    id?: string
    username?: string
    role?: string
  }
}

export default function DashboardClient({ initialUsers, initialQuizzes, session }: DashboardClientProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  // Form states for Add User
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('USER')
  const [newMaxTests, setNewMaxTests] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form states for Edit User
  const [editMaxTests, setEditMaxTests] = useState(10)
  const [editPassword, setEditPassword] = useState('')
  const [editRole, setEditRole] = useState('USER')

  // Gemini AI Settings states
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

  // Fetch AI & System settings when opening settings modal
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
    } catch (e) {
      console.error('Failed to load settings', e)
    }
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

  const handleAddCustomModel = () => {
    const trimmed = customModelInput.trim()
    if (!trimmed) return
    if (!availableModels.includes(trimmed)) {
      const updated = [...availableModels, trimmed]
      setAvailableModels(updated)
      setGeminiModel(trimmed)
      setCustomModelInput('')
      showToast(`Đã thêm model "${trimmed}" vào danh sách!`)
    } else {
      setGeminiModel(trimmed)
      setCustomModelInput('')
    }
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Refresh user data from API
  const refreshUsers = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/users')
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
        showToast('Đã làm mới dữ liệu người dùng thành công!')
      } else {
        showToast('Không thể tải lại danh sách người dùng', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi làm mới dữ liệu', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUsername.trim() || !newPassword.trim()) {
      showToast('Vui lòng nhập đầy đủ tên tài khoản và mật khẩu', 'error')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newPassword.trim(),
          role: newRole,
          maxTests: Number(newMaxTests) || 10
        })
      })
      const result = await res.json()
      if (res.ok) {
        showToast(`Tạo tài khoản "${newUsername}" thành công!`)
        setIsAddUserOpen(false)
        setNewUsername('')
        setNewPassword('')
        setNewMaxTests(10)
        setNewRole('USER')
        await refreshUsers()
      } else {
        showToast(result.error || 'Tạo tài khoản thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi tạo tài khoản', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Open Edit User Modal
  const openEditModal = (u: UserItem) => {
    setEditingUser(u)
    setEditMaxTests(u.maxTests)
    setEditPassword('')
    setEditRole(u.role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER')
  }

  // Handle Edit User
  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          maxTests: Number(editMaxTests),
          password: editPassword.trim() ? editPassword.trim() : undefined,
          role: editRole
        })
      })
      const result = await res.json()
      if (res.ok) {
        showToast(`Cập nhật thông tin cho "${editingUser.username}" thành công!`)
        setEditingUser(null)
        await refreshUsers()
      } else {
        showToast(result.error || 'Cập nhật thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi cập nhật tài khoản', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle Delete User
  const handleDeleteUser = async (u: UserItem) => {
    if (u.username?.toLowerCase() === 'duylniedu') {
      showToast('Không thể xóa tài khoản Quản trị viên tối cao!', 'error')
      return
    }

    if (!confirm(`Bạn có chắc chắn muốn xóa tài khoản "${u.username}" không? Tất cả đề thi của tài khoản này sẽ bị ảnh hưởng.`)) {
      return
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: u.id })
      })
      const result = await res.json()
      if (res.ok) {
        showToast(`Đã xóa tài khoản "${u.username}" thành công!`)
        setUsers(users.filter(x => x.id !== u.id))
      } else {
        showToast(result.error || 'Xóa tài khoản thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi xóa tài khoản', 'error')
    }
  }

  // Handle Export CSV Report
  const handleExportReport = () => {
    try {
      let csvContent = '\uFEFF' // UTF-8 BOM for Excel in Vietnamese
      csvContent += 'BÁO CÁO THỐNG KÊ HỆ THỐNG DZOTA QUIZ\n'
      csvContent += `Thời gian xuất: ${new Date().toLocaleString('vi-VN')}\n`
      csvContent += `Người xuất: ${session.username || 'Admin'}\n\n`

      csvContent += '--- THỐNG KÊ TỔNG QUAN ---\n'
      csvContent += `Tổng số giáo viên: ${totalUsers}\n`
      csvContent += `Tổng số đề thi: ${totalQuizzes}\n`
      csvContent += `Số giáo viên đang hoạt động: ${activeTeachers}\n\n`

      csvContent += '--- DANH SÁCH GIÁO VIÊN ---\n'
      csvContent += 'STT,Tên đăng nhập,Vai trò,Mật khẩu,Số đề đã tạo,Giới hạn đề\n'
      users.forEach((u, idx) => {
        const roleText = u.role?.toUpperCase() === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'
        csvContent += `${idx + 1},"${u.username}","${roleText}","${u.password || ''}",${u._count?.quizzes || 0},${u.maxTests}\n`
      })

      csvContent += '\n--- DANH SÁCH ĐỀ THI GẦN ĐÂY ---\n'
      csvContent += 'STT,Tiêu đề đề thi,Người tạo,Ngày tạo,Link trực tiếp\n'
      quizzes.forEach((q, idx) => {
        const authorName = q.author?.username || 'Ẩn danh'
        const dateStr = new Date(q.createdAt).toLocaleDateString('vi-VN')
        const link = `https://dzota.vercel.app/?id=${q.id}`
        csvContent += `${idx + 1},"${q.title.replace(/"/g, '""')}","${authorName}","${dateStr}","${link}"\n`
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Bao_Cao_Dzota_Quiz_${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast('Đã xuất báo cáo CSV thành công!')
    } catch (e) {
      showToast('Lỗi khi xuất báo cáo', 'error')
    }
  }

  // Filtered users
  const filteredUsers = users.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculations
  const totalUsers = users.length
  const totalQuizzes = quizzes.length
  const activeTeachers = users.filter(u => (u._count?.quizzes || 0) > 0).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-bold flex items-center gap-3 transition-all transform animate-in slide-in-from-bottom-5 ${
          toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : <X size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-100 text-indigo-700 font-black text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              {session.username === 'DuylniEdu' ? 'Super Admin' : 'Admin Panel'}
            </span>
            <span className="text-slate-400 text-xs font-semibold">• Đang hoạt động</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-slate-500 mt-1 font-medium">Theo dõi hoạt động, quản lý tài khoản giáo viên & đề thi</p>
        </div>
        
        {/* Header Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={refreshUsers}
            disabled={isLoading}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={handleExportReport}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all flex items-center gap-2"
          >
            <Download size={16} />
            <span>Xuất Báo Cáo</span>
          </button>

          <button
            onClick={() => {
              loadAiSettings()
              setIsSettingsOpen(true)
            }}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2"
          >
            <Settings size={16} />
            <span>Cài Đặt</span>
          </button>

          <Link
            href="/tests"
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2"
            title="Quản lý toàn bộ danh sách bài test"
          >
            <FileText size={16} />
            <span>Danh Sách Đề</span>
          </Link>

          <Link
            href="/creator"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Tạo Đề Mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Row: 2 cols on mobile, 4 cols on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 dark:bg-blue-950/40 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <Users size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-1">{totalUsers}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Tổng Giáo Viên</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 dark:bg-indigo-950/40 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <FileText size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-1">{totalQuizzes}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Đề Thi Đã Tạo</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-950/40 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <Activity size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-1">{activeTeachers}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Giáo Viên Hoạt Động</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-100 dark:border-slate-700/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 dark:bg-purple-950/40 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 dark:bg-purple-900/60 text-purple-600 dark:text-purple-400 rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
              <TrendingUp size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-1">{(totalQuizzes / (totalUsers || 1)).toFixed(1)}</div>
            <div className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400">Trung bình đề/GV</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users Table */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white z-10">
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                Danh Sách Giáo Viên
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Quản lý phân quyền và hạn mức tạo đề</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm giáo viên..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 w-36 sm:w-48 font-medium transition-all"
                />
              </div>

              {/* Add user button */}
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap"
              >
                <Plus size={14} /> Thêm Tài Khoản
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto bg-slate-50/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-100">Tài khoản</th>
                  <th className="p-4 font-bold border-b border-slate-100">Quyền</th>
                  <th className="p-4 font-bold border-b border-slate-100">Mật khẩu</th>
                  <th className="p-4 font-bold border-b border-slate-100">Đã Tạo</th>
                  <th className="p-4 font-bold border-b border-slate-100">Hạn mức</th>
                  <th className="p-4 font-bold border-b border-slate-100 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                      Không tìm thấy giáo viên nào
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          {u.username}
                          {u.username?.toLowerCase() === 'duylniedu' && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-bold">Chính</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">ID: {u.id.substring(0, 8)}...</div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          u.role?.toLowerCase() === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {u.role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
                        </span>
                      </td>
                      <td className="p-4">
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-mono">
                          {u.password || '••••••'}
                        </code>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{u._count?.quizzes || 0} đề</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-700">{u.maxTests} đề</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Sửa thông tin"
                          >
                            <Edit2 size={15} />
                          </button>
                          {u.username?.toLowerCase() !== 'duylniedu' && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

        {/* Recent Quizzes */}
        <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white z-10">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              Đề Thi Mới Nhất
            </h2>
            <Link href="/creator" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              + Tạo mới
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 max-h-[500px]">
            {quizzes.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                Chưa có đề thi nào được tạo
              </div>
            ) : (
              quizzes.slice(0, 10).map(q => (
                <Link
                  href={`/?id=${q.id}`}
                  key={q.id}
                  target="_blank"
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group block"
                >
                  <h3 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
                    {q.title}
                  </h3>
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Users size={12} /> {q.author?.username || 'Ẩn danh'}
                    </span>
                    <span className="flex items-center gap-1">
                      {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                      <ExternalLink size={11} className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600" />
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
          <div className="p-4 border-t border-slate-50 bg-white text-center">
            <Link href="/tests" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
              Xem toàn bộ đề thi &rarr;
            </Link>
          </div>
        </div>

      </div>

      {/* Modal: Thêm Tài Khoản */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Plus size={18} className="text-indigo-600" /> Thêm Tài Khoản Mới
              </h3>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: giaovien_toan"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Mật khẩu</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập mật khẩu"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Hạn mức tạo đề</label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={newMaxTests}
                    onChange={e => setNewMaxTests(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vai trò</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-indigo-600"
                  >
                    <option value="USER">Giáo viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
                >
                  {isSubmitting ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sửa Tài Khoản */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Edit2 size={18} className="text-indigo-600" /> Sửa Tài Khoản: {editingUser.username}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  disabled
                  value={editingUser.username}
                  className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-medium text-sm text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Đổi mật khẩu mới <span className="text-slate-400 lowercase font-normal">(bỏ trống nếu giữ nguyên)</span>
                </label>
                <input
                  type="text"
                  placeholder="Để trống nếu không đổi"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Giới hạn đề thi</label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={editMaxTests}
                    onChange={e => setEditMaxTests(Number(e.target.value))}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:outline-none focus:border-indigo-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vai trò</label>
                  <select
                    value={editRole}
                    onChange={e => setEditRole(e.target.value)}
                    disabled={editingUser.username?.toLowerCase() === 'duylniedu'}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-sm focus:outline-none focus:border-indigo-600 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="USER">Giáo viên</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Cài Đặt Hệ Thống */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-100 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Settings size={18} className="text-indigo-600" /> Cài Đặt & Thông Tin Hệ Thống
              </h3>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Tài khoản Quản trị</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Shield size={18} className="text-indigo-600" />
                    <span className="font-bold text-slate-800">{session.username || 'DuylniEdu'}</span>
                  </div>
                  <span className="bg-rose-100 text-rose-700 font-bold text-xs px-2.5 py-0.5 rounded-full">
                    Quản trị viên tối cao
                  </span>
                </div>
              </div>

              {/* Gemini AI Multi-Key & Model Settings */}
              <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase flex items-center gap-1.5">
                    <Key size={14} /> Cấu hình Gemini AI Trợ Giảng
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-100 dark:bg-indigo-900 px-2 py-0.5 rounded-full">
                    Tự động xoay vòng Keys
                  </span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Danh sách Gemini API Keys:
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {geminiKeys.split(/[\n,;]+/).filter(k => k.trim().length > 5).length} keys đã nhập
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={geminiKeys}
                    onChange={(e) => setGeminiKeys(e.target.value)}
                    placeholder="Dán các API Key vào đây, cách nhau bởi dấu phẩy hoặc xuống dòng (Key1, Key2, Key3...)"
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    💡 Hệ thống sẽ random chọn key cho mỗi câu hỏi và tự động chuyển đổi ngay sang key khác nếu một key bị giới hạn quota.
                  </p>
                </div>

                {/* Model Selection & Custom Add */}
                <div className="space-y-2 pt-1 border-t border-indigo-100/80 dark:border-indigo-900/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      Model Gemini đang dùng:
                    </label>
                    <select
                      value={geminiModel}
                      onChange={(e) => setGeminiModel(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none focus:border-indigo-500"
                    >
                      {availableModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Add Custom Model */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Thêm model ID (vd: gemini-2.5-flash-thinking)..."
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomModel}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap"
                    >
                      + Thêm model
                    </button>
                  </div>
                </div>
              </div>

              {/* Cài đặt Giao diện & Ảnh nền lúc làm bài */}
              <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase flex items-center gap-1.5">
                    <ImageIcon size={15} className="text-indigo-600 dark:text-indigo-400" /> Ảnh nền khi làm bài thi & luyện tập
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeBgEnabled 
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300' 
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}>
                    {activeBgEnabled ? 'Đang BẬT' : 'Đang TẮT (Nền trắng)'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="pr-4">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                      Hiển thị hình nền khi thí sinh làm bài
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                      Khi tắt, giao diện làm bài sẽ tự động quay về <b>nền trắng sạch</b> như cũ trên cả laptop và điện thoại.
                    </p>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => setActiveBgEnabled(!activeBgEnabled)}
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      activeBgEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    role="switch"
                    aria-checked={activeBgEnabled}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                        activeBgEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase">Hạ tầng & Dịch vụ</div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Database size={16} className="text-emerald-500" /> Cơ sở dữ liệu:
                  </span>
                  <span className="font-semibold text-slate-800">PostgreSQL (Vercel Neon)</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Activity size={16} className="text-blue-500" /> Trạng thái máy chủ:
                  </span>
                  <span className="bg-emerald-100 text-emerald-700 font-bold text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Hoạt động tốt
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <Key size={16} className="text-amber-500" /> Chế độ tạo đề:
                  </span>
                  <span className="font-bold text-indigo-600">Bản Gốc (Upload Word & Paste Text)</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleSaveAiSettings}
                  disabled={isSavingSettings}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-60"
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
