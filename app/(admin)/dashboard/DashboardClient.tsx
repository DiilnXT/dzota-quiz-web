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
  AlertCircle,
  BookOpen,
  GraduationCap,
  School,
  CheckSquare,
  Square,
  FolderPlus,
  UserPlus,
  Phone,
  MessageCircle,
  AlertTriangle,
  Filter,
  ChevronDown,
  ChevronRight,
  Layers,
  Award,
  BarChart2,
  BarChart3,
  Info,
  UserCheck,
  CheckCircle2,
  ChevronLeft,
  User as UserIcon,
  LayoutDashboard
} from 'lucide-react'

interface TeacherQuiz {
  id: string
  title: string
  createdAt: string
  isActive: boolean
  category: string
  timeLimit: number
  password?: string
  accessType?: string
  allowedGmails?: string[]
}

interface UserItem {
  id: string
  username: string
  email?: string | null
  name?: string | null
  avatar?: string | null
  phone?: string | null
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
  accessType?: string
  allowedGmails?: string[]
  author?: {
    id?: string
    username: string
    name?: string
    phone?: string
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

interface ClassroomStudentItem {
  id: string
  classId: string
  email: string
  name?: string | null
  allowedSubjects?: string | null
  allowedQuizIds?: string | null
  createdAt?: string | Date
}

interface ClassroomItem {
  id: string
  name: string
  description?: string | null
  teacherId: string
  teacher?: { id: string; name?: string; username: string; email?: string }
  students: ClassroomStudentItem[]
  createdAt?: string | Date
}

interface SubjectItem {
  id: string
  name: string
  quizzes: { id: string; title: string }[]
}

interface QuizHistoryItem {
  id: string
  quizId: string
  quizTitle: string
  score: number
  correctCount: number
  totalCount: number
  timeSpent: number
  createdAt: string | Date
}

interface DashboardClientProps {
  initialUsers: UserItem[]
  initialQuizzes: QuizItem[]
  initialNotifications?: NotificationItem[]
  initialClasses?: ClassroomItem[]
  initialHistory?: QuizHistoryItem[]
  availableSubjects?: SubjectItem[]
  isTeacher?: boolean
  isStudent?: boolean
  currentUserInfo?: UserItem | null
  session: {
    id?: string
    username?: string
    role?: string
    email?: string
    name?: string
    avatar?: string
    phone?: string
  }
}

// Danh sách Avatar đẹp có sẵn
const PRESET_AVATARS = [
  { id: 'av1', label: 'Học sinh Nam 1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' },
  { id: 'av2', label: 'Học sinh Nữ 1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80' },
  { id: 'av3', label: 'Thầy Giáo', url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&q=80' },
  { id: 'av4', label: 'Cô Giáo', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80' },
  { id: 'av5', label: 'Năng động', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80' },
  { id: 'av6', label: 'Trí thức', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80' },
  { id: 'av7', label: 'Sinh viên', url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80' },
  { id: 'av8', label: 'Bác học', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80' }
]

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
  initialClasses = [],
  initialHistory = [],
  availableSubjects = [],
  isTeacher = false,
  isStudent = false,
  currentUserInfo = null,
  session
}: DashboardClientProps) {
  const isAdmin = !isTeacher && !isStudent

  // Navigation Tabs State
  const defaultTab = isStudent ? 'history' : 'dashboard'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'quizzes' | 'classes' | 'teachers' | 'settings' | 'profile' | 'history'>(defaultTab)

  const switchTab = (tab: 'dashboard' | 'quizzes' | 'classes' | 'teachers' | 'settings' | 'profile' | 'history') => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', `/dashboard?tab=${tab}`)
      window.dispatchEvent(new CustomEvent('dzota_tab_change', { detail: tab }))
    }
  }

  // User management filtering & editing
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'teacher' | 'student' | 'admin'>('all')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [editMaxTests, setEditMaxTests] = useState(10)
  const [editRole, setEditRole] = useState('TEACHER')
  const [editPassword, setEditPassword] = useState('')
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null)

  const [users, setUsers] = useState<UserItem[]>(initialUsers || [])
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes || [])
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications || [])
  const [classes, setClasses] = useState<ClassroomItem[]>(initialClasses || [])
  const [history, setHistory] = useState<QuizHistoryItem[]>(initialHistory || [])
  const [subjects, setSubjects] = useState<SubjectItem[]>(availableSubjects || [])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Tất cả')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  // Notifications Drawer & Alert
  const [isNotifOpen, setIsNotifOpen] = useState(false)
  const [notifAlert, setNotifAlert] = useState<{ show: boolean; count: number } | null>(null)
  const unreadCount = (notifications || []).filter(n => !n?.isRead).length

  // Quick Gmail Grant State (Admin)
  const [quickGmail, setQuickGmail] = useState('')

  // Batch Quiz Selection State
  const [selectedQuizIds, setSelectedQuizIds] = useState<string[]>([])

  // Quiz Access Control Modal State
  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false)
  const [accessTargetQuizzes, setAccessTargetQuizzes] = useState<QuizItem[]>([])
  const [accessTypeChoice, setAccessTypeChoice] = useState<'public' | 'restricted'>('restricted')
  const [allowedGmailsInput, setAllowedGmailsInput] = useState('')
  const [selectedClassToAdd, setSelectedClassToAdd] = useState('')
  const [isSavingAccess, setIsSavingAccess] = useState(false)
  const [quickClassName, setQuickClassName] = useState('')
  const [showQuickCreateClass, setShowQuickCreateClass] = useState(false)

  // Classes & Student Management States
  const [activeClassView, setActiveClassView] = useState<ClassroomItem | null>(null)
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false)
  const [newClassName, setNewClassName] = useState('')
  const [newClassDesc, setNewClassDesc] = useState('')
  const [newClassGmails, setNewClassGmails] = useState('')
  const [isSavingClass, setIsSavingClass] = useState(false)

  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [newStudentEmail, setNewStudentEmail] = useState('')
  const [newStudentName, setNewStudentName] = useState('')
  const [isSavingStudent, setIsSavingStudent] = useState(false)

  // Student Individual Permissions Modal
  const [editingStudentPerms, setEditingStudentPerms] = useState<ClassroomStudentItem | null>(null)
  const [studentPermSubjects, setStudentPermSubjects] = useState<string[]>([])
  const [studentPermQuizIds, setStudentPermQuizIds] = useState<string[]>([])
  const [isSavingStudentPerms, setIsSavingStudentPerms] = useState(false)
  const [expandedSubjectId, setExpandedSubjectId] = useState<string | null>(null)

  // Profile Settings State
  const [profileName, setProfileName] = useState(currentUserInfo?.name || session.name || session.username || '')
  const [profileAvatar, setProfileAvatar] = useState(currentUserInfo?.avatar || session.avatar || '')
  const [profilePhone, setProfilePhone] = useState(currentUserInfo?.phone || session.phone || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  // Modals state: Add User / Edit User
  const [isAddUserOpen, setIsAddUserOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [isNotifSendOpen, setIsNotifSendOpen] = useState(false)
  const [notifTargetUserId, setNotifTargetUserId] = useState<string | null>(null)
  const [notifTargetName, setNotifTargetName] = useState('')
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [isSendingNotif, setIsSendingNotif] = useState(false)

  const [formName, setFormName] = useState('')
  const [formEmail, setFormEmail] = useState('')
  const [formUsername, setFormUsername] = useState('')
  const [formPassword, setFormPassword] = useState('Gv@123456')
  const [formRole, setFormRole] = useState('TEACHER')
  const [formMaxTests, setFormMaxTests] = useState(10)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // System Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [geminiKeys, setGeminiKeys] = useState('')
  const defaultModels = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ]
  const [availableModels, setAvailableModels] = useState<string[]>(defaultModels)
  const [customModelInput, setCustomModelInput] = useState('')
  const [geminiModel, setGeminiModel] = useState('gemini-2.5-flash')
  const [activeBgEnabled, setActiveBgEnabled] = useState(true)
  const [isSavingSettings, setIsSavingSettings] = useState(false)

  const handleAddCustomModel = () => {
    const trimmed = customModelInput.trim()
    if (!trimmed) return
    if (!availableModels.includes(trimmed)) {
      const updated = [...availableModels, trimmed]
      setAvailableModels(updated)
      setGeminiModel(trimmed)
      setCustomModelInput('')
      try {
        const savedCustom = localStorage.getItem('dzota_custom_gemini_models')
        const currentList: string[] = savedCustom ? JSON.parse(savedCustom) : []
        if (!currentList.includes(trimmed)) {
          localStorage.setItem('dzota_custom_gemini_models', JSON.stringify([...currentList, trimmed]))
        }
      } catch (e) {}
      showToast(`Đã thêm model "${trimmed}" vào danh sách!`, 'success')
    } else {
      setGeminiModel(trimmed)
      setCustomModelInput('')
      showToast(`Đã chọn model "${trimmed}"`, 'info')
    }
  }

  // Quiz Password Change Modal State
  const [editingQuizPass, setEditingQuizPass] = useState<QuizItem | null>(null)
  const [quizPassInput, setQuizPassInput] = useState('')
  const [isSavingQuizPass, setIsSavingQuizPass] = useState(false)

  // Account Password Change Modal State
  const [isChangeAccPassOpen, setIsChangeAccPassOpen] = useState(false)
  const [newAccPassword, setNewAccPassword] = useState('')
  const [confirmAccPassword, setConfirmAccPassword] = useState('')
  const [isSavingAccPass, setIsSavingAccPass] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true })
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (e) {}
  }

  // Kiểm tra và hiển thị thông báo mới: chỉ hiển thị 1 lần duy nhất, khi nào có thông báo mới nữa mới hiển thị lại
  useEffect(() => {
    const checkNotificationAlert = (notifs: NotificationItem[]) => {
      if (!Array.isArray(notifs)) return
      const unreads = notifs.filter(n => !n?.isRead)
      if (unreads.length === 0) return

      const latestUnread = unreads[0]
      if (!latestUnread?.id) return
      const storageKey = `dzota_alerted_notif_${session?.id || 'current'}`
      const lastAlertedId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null

      if (lastAlertedId !== latestUnread.id) {
        setNotifAlert({ show: true, count: unreads.length })
        if (typeof window !== 'undefined') {
          localStorage.setItem(storageKey, latestUnread.id)
        }
      }
    }

    checkNotificationAlert(notifications)

    // Polling định kỳ mỗi 45s để phát hiện thông báo mới theo thời gian thực
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.notifications)) {
            setNotifications(data.notifications)
            checkNotificationAlert(data.notifications)
          }
        }
      } catch (e) {}
    }, 45000)

    return () => clearInterval(interval)
  }, [session?.id])

  // Tự động ẩn popup thông báo mới sau 10 giây nếu người dùng không thao tác
  useEffect(() => {
    if (notifAlert?.show) {
      const timer = setTimeout(() => {
        setNotifAlert(null)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [notifAlert])

  // Listen for tab navigation from the left vertical sidebar
  useEffect(() => {
    const handleSidebarTabChange = (e: any) => {
      if (e.detail) {
        setActiveTab(e.detail)
      }
    }
    window.addEventListener('dzota_tab_change', handleSidebarTabChange)
    return () => {
      window.removeEventListener('dzota_tab_change', handleSidebarTabChange)
    }
  }, [])

  // Sync tab with URL search parameter (?tab=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab && ['dashboard', 'overview', 'quizzes', 'classes', 'teachers', 'settings', 'profile', 'history'].includes(tab)) {
        if (isStudent && (tab === 'history' || tab === 'profile')) {
          setActiveTab(tab as any)
        } else if (!isStudent) {
          setActiveTab(tab as any)
        }
      }
    }
  }, [isStudent])

  // Tải cài đặt hệ thống cho Admin & custom models
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem('dzota_custom_gemini_models')
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAvailableModels(prev => Array.from(new Set([...prev, ...parsed])))
        }
      }
    } catch (e) {}

    if (!isTeacher && !isStudent) {
      fetch('/api/admin/settings')
        .then(r => r.json())
        .then(data => {
          if (data.apiKeys) setGeminiKeys(data.apiKeys)
          if (data.activeModel) {
            setGeminiModel(data.activeModel)
            setAvailableModels(prev => prev.includes(data.activeModel) ? prev : [...prev, data.activeModel])
          }
          if (data.activeBgEnabled !== undefined) setActiveBgEnabled(Boolean(data.activeBgEnabled))
        })
        .catch(() => {})
    }
  }, [isTeacher, isStudent])

  // Validation số điện thoại Zalo theo thời gian thực
  const validatePhone = (val: string) => {
    const clean = val.trim()
    if (!clean) {
      setPhoneError(null)
      return true
    }
    const regex = /^0\d{9}$/
    if (!regex.test(clean)) {
      setPhoneError('Số Zalo phải có đúng 10 chữ số, chỉ chứa số và bắt đầu bằng số 0 (Ví dụ: 0912345678).')
      return false
    }
    setPhoneError(null)
    return true
  }

  // --- REFRESH DATA ---
  const refreshData = async () => {
    setIsLoading(true)
    try {
      if (!isStudent) {
        const qRes = await fetch('/api/quick-quiz?id=all')
        if (qRes.ok) {
          const qData = await qRes.json()
          if (Array.isArray(qData)) {
            const formatted = qData.map(q => ({
              id: q.id,
              title: q.title,
              createdAt: q.createdAt || new Date(),
              isActive: q.config?.isActive !== false,
              category: q.config?.category || 'Chung',
              timeLimit: q.config?.timeLimit || 15,
              password: q.config?.password || '',
              accessType: q.config?.accessType || (Array.isArray(q.config?.allowedGmails) && q.config.allowedGmails.length > 0 ? 'restricted' : 'public'),
              allowedGmails: Array.isArray(q.config?.allowedGmails) ? q.config.allowedGmails : [],
              author: q.author || null
            }))
            setQuizzes(formatted)
          }
        }

        const classRes = await fetch('/api/classes')
        if (classRes.ok) {
          const cData = await classRes.json()
          if (cData.classes) setClasses(cData.classes)
        }
      } else {
        const histRes = await fetch('/api/student/history')
        if (histRes.ok) {
          const hData = await histRes.json()
          if (hData.history) setHistory(hData.history)
        }
      }

      // Làm mới thông báo
      try {
        const notifRes = await fetch('/api/notifications')
        if (notifRes.ok) {
          const nData = await notifRes.json()
          if (Array.isArray(nData.notifications)) {
            setNotifications(nData.notifications)
            const unreads = nData.notifications.filter((n: any) => !n.isRead)
            if (unreads.length > 0) {
              const latestUnread = unreads[0]
              const storageKey = `dzota_alerted_notif_${session?.id || 'current'}`
              const lastAlertedId = typeof window !== 'undefined' ? localStorage.getItem(storageKey) : null
              if (lastAlertedId !== latestUnread.id) {
                setNotifAlert({ show: true, count: unreads.length })
                if (typeof window !== 'undefined') {
                  localStorage.setItem(storageKey, latestUnread.id)
                }
              }
            }
          }
        }
      } catch (e) {}

      showToast('Đã làm mới dữ liệu!')
    } catch (e) {
      showToast('Không thể làm mới dữ liệu', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  // --- ACCESS CONTROL MODAL HANDLERS ---
  const handleOpenAccessModal = (targetQuizzes: QuizItem[]) => {
    if (targetQuizzes.length === 0) return
    setAccessTargetQuizzes(targetQuizzes)

    // Nếu chỉ có 1 bài thi thì điền sẵn cấu hình hiện tại
    if (targetQuizzes.length === 1) {
      const q = targetQuizzes[0]
      setAccessTypeChoice(q.accessType === 'restricted' ? 'restricted' : 'public')
      setAllowedGmailsInput((q.allowedGmails || []).join('\n'))
    } else {
      setAccessTypeChoice('restricted')
      setAllowedGmailsInput('')
    }
    setShowQuickCreateClass(false)
    setQuickClassName('')
    setIsAccessModalOpen(true)
  }

  const handleAddClassGmailsToAccessInput = () => {
    if (!selectedClassToAdd) return
    const targetClass = classes.find(c => c.id === selectedClassToAdd)
    if (!targetClass || !targetClass.students) return

    const classEmails = targetClass.students.map(s => s.email.trim().toLowerCase()).filter(Boolean)
    if (classEmails.length === 0) {
      showToast('Lớp học này hiện chưa có học sinh nào', 'info')
      return
    }

    const currentEmails = allowedGmailsInput
      .split('\n')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean)

    const merged = Array.from(new Set([...currentEmails, ...classEmails]))
    setAllowedGmailsInput(merged.join('\n'))
    showToast(`Đã thêm ${classEmails.length} học sinh từ lớp "${targetClass.name}"!`)
  }

  const handleQuickSaveClassFromAccessInput = async () => {
    if (!quickClassName.trim()) {
      showToast('Vui lòng nhập tên Lớp học', 'error')
      return
    }
    const cleanEmails = allowedGmailsInput
      .split('\n')
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@'))

    if (cleanEmails.length === 0) {
      showToast('Danh sách Gmail học sinh hiện đang trống', 'error')
      return
    }

    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quickClassName.trim(),
          description: `Tạo nhanh từ phân quyền đề thi (${new Date().toLocaleDateString('vi-VN')})`,
          studentEmails: cleanEmails
        })
      })
      const data = await res.json()
      if (res.ok && data.classroom) {
        setClasses(prev => [data.classroom, ...prev])
        setShowQuickCreateClass(false)
        setQuickClassName('')
        showToast(`Đã lưu thành công Lớp học "${data.classroom.name}"!`)
      } else {
        showToast(data.error || 'Lỗi lưu lớp học', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi lưu lớp học', 'error')
    }
  }

  const handleSaveAccessControl = async (e: React.FormEvent) => {
    e.preventDefault()
    if (accessTargetQuizzes.length === 0) return

    const quizIds = accessTargetQuizzes.map(q => q.id)
    const cleanEmails = accessTypeChoice === 'restricted'
      ? allowedGmailsInput
          .split('\n')
          .map(e => e.trim().toLowerCase())
          .filter(e => e.includes('@'))
      : []

    setIsSavingAccess(true)
    try {
      const res = await fetch('/api/quizzes/access-control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizIds,
          accessType: accessTypeChoice,
          allowedGmails: cleanEmails,
          mode: 'replace'
        })
      })
      const data = await res.json()
      if (res.ok) {
        // Cập nhật state cục bộ
        setQuizzes(prev => prev.map(q => {
          if (quizIds.includes(q.id)) {
            return {
              ...q,
              accessType: accessTypeChoice,
              allowedGmails: cleanEmails
            }
          }
          return q
        }))
        setIsAccessModalOpen(false)
        setSelectedQuizIds([])
        showToast(`Đã cập nhật phân quyền cho ${quizIds.length} bài thi thành công!`)
      } else {
        showToast(data.error || 'Lỗi cập nhật quyền bài thi', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSavingAccess(false)
    }
  }

  // --- CLASSES & STUDENT HANDLERS ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newClassName.trim()) {
      showToast('Vui lòng nhập tên lớp học', 'error')
      return
    }

    setIsSavingClass(true)
    try {
      const cleanEmails = newClassGmails
        .split('\n')
        .map(e => e.trim().toLowerCase())
        .filter(e => e.includes('@'))

      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newClassName.trim(),
          description: newClassDesc.trim(),
          studentEmails: cleanEmails
        })
      })
      const data = await res.json()
      if (res.ok && data.classroom) {
        setClasses(prev => [data.classroom, ...prev])
        setIsCreateClassOpen(false)
        setNewClassName('')
        setNewClassDesc('')
        setNewClassGmails('')
        showToast(`Đã tạo lớp "${data.classroom.name}" thành công!`)
      } else {
        showToast(data.error || 'Lỗi tạo lớp học', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSavingClass(false)
    }
  }

  const handleDeleteClass = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa lớp học "${name}" không?`)) return
    try {
      const res = await fetch('/api/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (res.ok) {
        setClasses(prev => prev.filter(c => c.id !== id))
        if (activeClassView?.id === id) setActiveClassView(null)
        showToast(`Đã xóa lớp "${name}"`)
      } else {
        showToast('Không thể xóa lớp học', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error')
    }
  }

  const handleAddStudentToClass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeClassView || !newStudentEmail.trim()) {
      showToast('Vui lòng nhập email học sinh', 'error')
      return
    }

    setIsSavingStudent(true)
    try {
      const res = await fetch('/api/classes/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: activeClassView.id,
          email: newStudentEmail.trim().toLowerCase(),
          name: newStudentName.trim() || newStudentEmail.trim().split('@')[0]
        })
      })
      const data = await res.json()
      if (res.ok && data.student) {
        const updatedStudents = [data.student, ...(activeClassView.students || [])]
        const updatedClass = { ...activeClassView, students: updatedStudents }
        setActiveClassView(updatedClass)
        setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c))
        setIsAddStudentOpen(false)
        setNewStudentEmail('')
        setNewStudentName('')
        showToast(`Đã thêm học sinh ${data.student.email} vào lớp!`)
      } else {
        showToast(data.error || 'Lỗi thêm học sinh', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error')
    } finally {
      setIsSavingStudent(false)
    }
  }

  const handleDeleteStudentFromClass = async (studentId: string, email: string) => {
    if (!confirm(`Xóa học sinh "${email}" khỏi lớp?`)) return
    try {
      const res = await fetch('/api/classes/student', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      })
      if (res.ok) {
        if (activeClassView) {
          const updatedStudents = activeClassView.students.filter(s => s.id !== studentId)
          const updatedClass = { ...activeClassView, students: updatedStudents }
          setActiveClassView(updatedClass)
          setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c))
        }
        showToast(`Đã xóa học sinh ${email}`)
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error')
    }
  }

  // Mở popup cài đặt phân quyền cho học sinh cụ thể
  const handleOpenStudentPerms = (student: ClassroomStudentItem) => {
    setEditingStudentPerms(student)
    let parsedSubjects: string[] = []
    let parsedQuizzes: string[] = []
    try {
      if (student.allowedSubjects) parsedSubjects = JSON.parse(student.allowedSubjects)
      if (student.allowedQuizIds) parsedQuizzes = JSON.parse(student.allowedQuizIds)
    } catch (e) {}
    setStudentPermSubjects(parsedSubjects)
    setStudentPermQuizIds(parsedQuizzes)
    setExpandedSubjectId(null)
  }

  const handleToggleSubjectForStudent = (subject: SubjectItem) => {
    const isSelected = studentPermSubjects.includes(subject.name)
    const newSubjects = isSelected
      ? studentPermSubjects.filter(s => s !== subject.name)
      : [...studentPermSubjects, subject.name]

    setStudentPermSubjects(newSubjects)

    // Nếu chọn môn học, tự động tick chọn tất cả bài thi của môn học đó
    if (!isSelected) {
      const subjectQuizIds = subject.quizzes.map(q => q.id)
      setStudentPermQuizIds(prev => Array.from(new Set([...prev, ...subjectQuizIds])))
    } else {
      // Bỏ chọn môn học
      const subjectQuizIds = subject.quizzes.map(q => q.id)
      setStudentPermQuizIds(prev => prev.filter(id => !subjectQuizIds.includes(id)))
    }
  }

  const handleToggleQuizForStudent = (quizId: string) => {
    setStudentPermQuizIds(prev =>
      prev.includes(quizId) ? prev.filter(id => id !== quizId) : [...prev, quizId]
    )
  }

  const handleSaveStudentPerms = async () => {
    if (!editingStudentPerms) return
    setIsSavingStudentPerms(true)
    try {
      const res = await fetch('/api/classes/student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: editingStudentPerms.id,
          allowedSubjects: studentPermSubjects,
          allowedQuizIds: studentPermQuizIds
        })
      })
      const data = await res.json()
      if (res.ok) {
        if (activeClassView) {
          const updatedStudents = activeClassView.students.map(s =>
            s.id === editingStudentPerms.id ? { ...s, allowedSubjects: JSON.stringify(studentPermSubjects), allowedQuizIds: JSON.stringify(studentPermQuizIds) } : s
          )
          const updatedClass = { ...activeClassView, students: updatedStudents }
          setActiveClassView(updatedClass)
          setClasses(prev => prev.map(c => c.id === updatedClass.id ? updatedClass : c))
        }
        setEditingStudentPerms(null)
        showToast('Đã lưu phân quyền chi tiết cho học sinh thành công!')
      } else {
        showToast(data.error || 'Lỗi lưu phân quyền', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSavingStudentPerms(false)
    }
  }

  // --- PROFILE UPDATE HANDLER ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePhone(profilePhone)) {
      showToast('Số điện thoại Zalo chưa đúng định dạng 10 chữ số bắt đầu bằng 0', 'error')
      return
    }

    setIsSavingProfile(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileName.trim(),
          avatar: profileAvatar.trim(),
          phone: profilePhone.trim()
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast('Đã lưu thông tin cá nhân và số Zalo thành công!')
      } else {
        showToast(data.error || 'Lỗi cập nhật thông tin', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }

  // --- QUIZ STATUS & PASSWORD HANDLERS ---
  const handleToggleQuizStatus = async (quiz: QuizItem) => {
    const newStatus = quiz.isActive === false
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quiz.id, isActive: newStatus })
      })
      if (res.ok) {
        setQuizzes(prev => prev.map(q => q.id === quiz.id ? { ...q, isActive: newStatus } : q))
        showToast(`Đã ${newStatus ? 'mở' : 'khóa'} đề thi "${quiz.title}"!`)
      }
    } catch (e) {
      showToast('Lỗi cập nhật trạng thái', 'error')
    }
  }

  const handleDeleteQuiz = async (quiz: QuizItem) => {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn bài test "${quiz.title}" không?`)) return
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: quiz.id })
      })
      if (res.ok) {
        setQuizzes(prev => prev.filter(q => q.id !== quiz.id))
        setSelectedQuizIds(prev => prev.filter(id => id !== quiz.id))
        showToast(`Đã xóa đề thi "${quiz.title}"!`)
      }
    } catch (e) {
      showToast('Không thể xóa bài test', 'error')
    }
  }

  const handleSaveQuizPass = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuizPass) return
    setIsSavingQuizPass(true)
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingQuizPass.id, password: quizPassInput.trim() })
      })
      if (res.ok) {
        setQuizzes(prev => prev.map(q => q.id === editingQuizPass.id ? { ...q, password: quizPassInput.trim() } : q))
        setEditingQuizPass(null)
        showToast('Đã cập nhật mật khẩu đề thi!')
      }
    } catch (e) {
      showToast('Lỗi lưu mật khẩu', 'error')
    } finally {
      setIsSavingQuizPass(false)
    }
  }

  const handleSaveAccPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newAccPassword.length < 4) {
      showToast('Mật khẩu mới phải có ít nhất 4 ký tự', 'error')
      return
    }
    if (newAccPassword !== confirmAccPassword) {
      showToast('Xác nhận mật khẩu mới không khớp', 'error')
      return
    }
    setIsSavingAccPass(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: newAccPassword })
      })
      if (res.ok) {
        setIsChangeAccPassOpen(false)
        setNewAccPassword('')
        setConfirmAccPassword('')
        showToast('Đổi mật khẩu tài khoản thành công!')
      } else {
        const d = await res.json()
        showToast(d.error || 'Lỗi đổi mật khẩu', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSavingAccPass(false)
    }
  }

  // --- USER MANAGEMENT HANDLERS (ADMIN) ---
  const handleOpenEditUser = (user: UserItem) => {
    setEditingUser(user)
    setEditName(user.name || '')
    setEditEmail(user.email || '')
    setEditRole(user.role || 'TEACHER')
    setEditMaxTests(user.maxTests || 10)
    setEditPassword('')
  }

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
          name: editName.trim(),
          email: editEmail.trim(),
          role: editRole,
          maxTests: Number(editMaxTests),
          password: editPassword.trim() || undefined
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(`Đã cập nhật quyền hạn và hạn mức cho ${editingUser.name || editingUser.username}!`)
        setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...data } : u))
        setEditingUser(null)
      } else {
        showToast(data.error || 'Lỗi cập nhật người dùng', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickUpdateRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, role: newRole })
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
        showToast(`Đã chuyển vai trò sang ${newRole}!`)
      } else {
        showToast(data.error || 'Lỗi cập nhật vai trò', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    }
  }

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa tài khoản "${name}" không?`)) return
    setIsDeletingUser(id)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      const data = await res.json()
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id))
        showToast(`Đã xóa tài khoản "${name}"`)
      } else {
        showToast(data.error || 'Không thể xóa tài khoản', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsDeletingUser(null)
    }
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
          userId: notifTargetUserId,
          targetAll: !notifTargetUserId,
          title: notifTitle.trim(),
          message: notifMessage.trim()
        })
      })
      const data = await res.json()
      if (res.ok) {
        showToast(data.message || 'Đã gửi thông báo thành công!')
        setIsNotifSendOpen(false)
        setNotifTitle('')
        setNotifMessage('')
        setNotifTargetUserId(null)
        setNotifTargetName('')
      } else {
        showToast(data.error || 'Lỗi gửi thông báo', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSendingNotif(false)
    }
  }

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setIsSavingSettings(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKeys: geminiKeys,
          activeModel: geminiModel,
          activeBgEnabled
        })
      })
      if (res.ok) {
        showToast('Đã lưu cấu hình hệ thống & AI thành công!')
      } else {
        const d = await res.json()
        showToast(d.error || 'Lỗi lưu cấu hình', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setIsSavingSettings(false)
    }
  }

  // --- BATCH SELECTION LOGIC ---
  const toggleSelectQuiz = (id: string) => {
    setSelectedQuizIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const toggleSelectAllQuizzes = () => {
    if (selectedQuizIds.length === filteredQuizzes.length && filteredQuizzes.length > 0) {
      setSelectedQuizIds([])
    } else {
      setSelectedQuizIds(filteredQuizzes.map(q => q.id))
    }
  }

  // Filter quizzes
  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = (q.title || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'Tất cả' || (q.category || 'Chung') === selectedCategory
    const isActive = q.isActive !== false
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && isActive) || (statusFilter === 'inactive' && !isActive)
    return matchesSearch && matchesCategory && matchesStatus
  })

  // Stats
  const activeQuizzesCount = (quizzes || []).filter(q => q.isActive !== false).length
  const inactiveQuizzesCount = (quizzes || []).filter(q => q.isActive === false).length
  const teacherLimit = currentUserInfo?.maxTests || 10

  // Categories list
  const allCategories = ['Tất cả', ...Array.from(new Set((quizzes || []).map(q => q.category || 'Chung')))]

  // Student Stats Calculation
  const totalTestsTakenToday = (history || []).length
  const avgScoreToday = totalTestsTakenToday > 0
    ? ((history || []).reduce((acc, cur) => acc + (cur.score || 0), 0) / totalTestsTakenToday).toFixed(1)
    : '0.0'
  const highestScoreToday = totalTestsTakenToday > 0
    ? Math.max(...(history || []).map(h => h.score || 0)).toFixed(1)
    : '0.0'

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-transparent p-3 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl text-white font-bold flex items-center gap-3 transition-all animate-bounce-short ${
          toast.type === 'success' ? 'bg-emerald-600' : toast.type === 'info' ? 'bg-indigo-600' : 'bg-rose-600'
        }`}>
          {toast.type === 'success' ? <Check size={18} /> : toast.type === 'info' ? <Bell size={18} /> : <X size={18} />}
          <span className="text-sm">{toast.message}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          POPUP THÔNG BÁO MỚI (CHỈ HIỂN THỊ 1 LẦN DUY NHẤT CHO MỖI THÔNG BÁO MỚI)
      ───────────────────────────────────────────────────────────── */}
      {notifAlert?.show && !toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-slate-900/95 dark:bg-[#111827]/95 backdrop-blur-md border border-indigo-500/40 text-white p-4 rounded-2xl shadow-2xl shadow-indigo-950/50 flex items-center justify-between gap-3 relative overflow-hidden group">
            {/* Glow effect */}
            <div className="absolute -left-6 -top-6 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

            <div
              onClick={() => {
                setIsNotifOpen(true)
                setNotifAlert(null)
              }}
              className="flex items-center gap-3.5 flex-1 cursor-pointer"
            >
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:scale-105 transition-transform">
                  <Bell size={18} className="animate-wiggle" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
                </span>
              </div>

              <div>
                <h4 className="font-black text-sm text-white tracking-tight flex items-center gap-2">
                  <span>Bạn có thông báo mới</span>
                  <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded-full">
                    Mới
                  </span>
                </h4>
                <p className="text-[11px] text-slate-300 font-medium mt-0.5 flex items-center gap-1">
                  <span>Bấm để xem chi tiết tin nhắn</span>
                  <ChevronRight size={12} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => {
                  setIsNotifOpen(true)
                  setNotifAlert(null)
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer shadow-xs active:scale-95"
              >
                Xem
              </button>
              <button
                onClick={() => setNotifAlert(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-indigo-50 dark:bg-slate-800 border border-indigo-100 dark:border-slate-700 flex items-center justify-center p-2 flex-shrink-0">
            {profileAvatar ? (
              <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover rounded-xl" />
            ) : (
              <img src="/logo-dzota.png" alt="Dzota" className="w-full h-full object-contain" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                isStudent
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                  : isTeacher
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                    : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
              }`}>
                {isStudent ? 'Học Sinh (Student)' : isTeacher ? 'Giáo Viên (Teacher)' : 'Quản Trị Viên (Super Admin)'}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-xs font-semibold">• Đang trực tuyến</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5">
              {profileName || session.username}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isStudent
                ? `Tài khoản Google: ${session.email || 'Chưa cập nhật'} • Lịch sử tự động làm mới hàng ngày`
                : isTeacher
                  ? `Quản lý ${quizzes.length}/${teacherLimit} bài test của bạn • Email: ${session.email || 'Chưa cập nhật'}`
                  : `Chào mừng Quản trị viên tối cao! Toàn quyền quản trị đề thi, lớp học & giáo viên`}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Chuông Thông Báo */}
          <button
            onClick={() => setIsNotifOpen(true)}
            className="relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-2 cursor-pointer text-xs"
            title="Xem thông báo"
          >
            <Bell size={16} className={unreadCount > 0 ? 'text-indigo-600 dark:text-indigo-400 animate-wiggle' : ''} />
            <span className="hidden sm:inline">Thông báo</span>
            {unreadCount > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={refreshData}
            disabled={isLoading}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>

          <button
            onClick={() => setIsChangeAccPassOpen(true)}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl font-semibold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Key size={14} />
            <span className="hidden sm:inline">Đổi Mật Khẩu</span>
          </button>

          {!isStudent && (
            <Link
              href="/creator"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 no-underline cursor-pointer"
            >
              <Plus size={15} />
              <span>Tạo Đề Mới</span>
            </Link>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB: STUDENT PORTAL (LỊCH SỬ LÀM BÀI HÔM NAY)
      ───────────────────────────────────────────────────────────── */}
      {isStudent && (activeTab === 'history' || activeTab === 'dashboard') && (
        <div className="space-y-6">
          {/* Banner thông báo dọn dẹp hàng ngày */}
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-950/40 dark:via-indigo-950/40 dark:to-purple-950/40 border border-indigo-200/80 dark:border-indigo-900/50 rounded-3xl p-5 flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-indigo-300 dark:shadow-indigo-950">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base">
                Lịch sử làm bài thi cá nhân hôm nay
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Mọi bài thi bạn làm khi đăng nhập tài khoản Google sẽ được lưu lại tự động tại đây. Để tối ưu tốc độ và dung lượng máy chủ, lịch sử làm bài sẽ được <strong>làm mới tự động mỗi ngày</strong>.
              </p>
            </div>
          </div>

          {/* Student Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đề thi đã làm hôm nay</p>
                <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">{totalTestsTakenToday} bài</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Award size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm cao nhất hôm nay</p>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{highestScoreToday} / 10</p>
              </div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <BarChart3 size={22} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Điểm trung bình hôm nay</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{avgScoreToday} / 10</p>
              </div>
            </div>
          </div>

          {/* History List Table */}
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mb-4 flex items-center gap-2">
              <Clock size={18} className="text-indigo-600 dark:text-indigo-400" />
              Chi Tiết Các Lần Làm Bài Hôm Nay
            </h3>

            {history.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <FileText size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Hôm nay bạn chưa làm bài thi nào</p>
                <p className="text-xs text-slate-400 mt-0.5">Hãy chọn một đề thi và bắt đầu làm bài để ghi nhận điểm số!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                      <th className="pb-3 font-extrabold">Tên Bài Thi</th>
                      <th className="pb-3 font-extrabold text-center">Điểm Số</th>
                      <th className="pb-3 font-extrabold text-center">Số Câu Đúng</th>
                      <th className="pb-3 font-extrabold text-center">Thời Gian Làm</th>
                      <th className="pb-3 font-extrabold text-right">Giờ Nộp</th>
                      <th className="pb-3 font-extrabold text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.map(item => {
                      const scoreColor =
                        item.score >= 8 ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800' :
                        item.score >= 5 ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800' :
                        'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800'

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                          <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                            {item.quizTitle}
                          </td>
                          <td className="py-3.5 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-full font-black text-xs border ${scoreColor}`}>
                              {item.score.toFixed(1)} / 10
                            </span>
                          </td>
                          <td className="py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                            {item.correctCount} / {item.totalCount}
                          </td>
                          <td className="py-3.5 text-center text-slate-500 dark:text-slate-400 font-medium">
                            {Math.floor(item.timeSpent / 60)}p {item.timeSpent % 60}s
                          </td>
                          <td className="py-3.5 text-right text-slate-400 text-xs">
                            {formatTimeAgo(item.createdAt)}
                          </td>
                          <td className="py-3.5 text-right">
                            <a
                              href={`/?id=${item.quizId}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition no-underline"
                            >
                              Làm Lại
                            </a>
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
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: TỔNG QUAN DASHBOARD (ADMIN & GIÁO VIÊN)
      ───────────────────────────────────────────────────────────── */}
      {!isStudent && activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Welcome Banner & Quick Action Shortcuts */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold text-white">
                  <Sparkles size={14} className="text-amber-300" />
                  <span>{isTeacher ? 'Bảng Điều Khiển Giáo Viên' : 'Trung Tâm Điều Hành Quản Trị'}</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Xin chào, {profileName || session.username}! 👋
                </h2>
                <p className="text-white/80 text-sm font-medium leading-relaxed">
                  {isTeacher
                    ? `Bạn đã tạo ${quizzes.length}/${teacherLimit} đề thi được phân bổ. Dễ dàng quản lý bài test, phân quyền danh sách học sinh theo lớp và theo dõi kết quả.`
                    : 'Toàn quyền kiểm soát hệ thống thi trắc nghiệm Dzota: quản lý đề thi, phê duyệt giáo viên, cấu hình trí tuệ nhân tạo Gemini và phân quyền lớp học.'}
                </p>
              </div>

              {/* Fast Actions in Banner */}
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/creator"
                  className="px-5 py-3 rounded-2xl bg-white text-indigo-700 hover:bg-slate-50 font-black text-sm shadow-md transition-all flex items-center gap-2 active:scale-95 no-underline cursor-pointer"
                >
                  <Plus size={18} />
                  <span>Tạo Đề Mới</span>
                </Link>
                <button
                  onClick={() => switchTab('quizzes')}
                  className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer border border-white/20"
                >
                  <FileText size={18} />
                  <span>{isTeacher ? 'Đề thi của tôi' : 'Quản lý Bài test'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Stats Overview Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div
              onClick={() => switchTab('quizzes')}
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isTeacher ? 'Đề thi của bạn' : 'Tổng Đề Thi'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <FileText size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                {isTeacher ? `${quizzes.length}/${teacherLimit}` : quizzes.length}
              </div>
              {isTeacher && (
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      quizzes.length >= teacherLimit ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, (quizzes.length / teacherLimit) * 100)}%` }}
                  />
                </div>
              )}
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                <span>Xem chi tiết</span>
                <ChevronRight size={12} />
              </div>
            </div>

            <div
              onClick={() => switchTab('quizzes')}
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đang Mở</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CheckCircle2 size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                {activeQuizzesCount}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                <span>Học sinh có thể làm</span>
                <ChevronRight size={12} />
              </div>
            </div>

            <div
              onClick={() => switchTab('quizzes')}
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group cursor-pointer hover:border-rose-300 dark:hover:border-rose-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đã Khóa</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Lock size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                {inactiveQuizzesCount}
              </div>
              <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                <span>Tạm dừng truy cập</span>
                <ChevronRight size={12} />
              </div>
            </div>

            <div
              onClick={() => switchTab('classes')}
              className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group cursor-pointer hover:border-purple-300 dark:hover:border-purple-500 hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isAdmin ? 'Lớp & Học Sinh' : 'Lớp Của Bạn'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <School size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                {classes.length}
              </div>
              <div className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold mt-2 flex items-center gap-1 group-hover:underline">
                <span>Quản lý phân quyền</span>
                <ChevronRight size={12} />
              </div>
            </div>
          </div>

          {/* Quick Modules Shortcuts Grid */}
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-3 flex items-center gap-2">
              <LayoutDashboard size={18} className="text-blue-600 dark:text-blue-400" />
              <span>Phân Hệ Quản Lý Chính</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card 1: Quản lý đề thi */}
              <div
                onClick={() => switchTab('quizzes')}
                className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {isTeacher ? 'Đề Thi Của Tôi' : 'Quản Lý Bài Test'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                    Xem danh sách, tìm kiếm, lọc đề thi, khóa/mở bài test, xem mật khẩu, sao chép link và phân quyền học sinh.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                  <span>Mở Quản Lý Bài Test</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 2: Lớp học & Học sinh */}
              <div
                onClick={() => switchTab('classes')}
                className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-purple-400 dark:hover:border-purple-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <School size={24} />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Lớp Học & Học Sinh
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                    Tạo lớp học, quản lý danh sách học sinh theo Gmail, gán học sinh vào lớp và thiết lập quyền làm bài cho từng môn.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                  <span>Mở Quản Lý Lớp Học</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Card 3: Người dùng & Phân quyền (Admin only) */}
              {isAdmin && (
                <div
                  onClick={() => switchTab('teachers')}
                  className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-amber-400 dark:hover:border-amber-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Shield size={24} />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                      Người Dùng & Phân Quyền
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                      Phê duyệt quyền Giáo viên, chỉnh sửa hạn mức tạo đề, quản lý tài khoản Học sinh và gửi thông báo toàn hệ thống.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400">
                    <span>Mở Phân Quyền</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )}

              {/* Card 4: Cài đặt Web & AI (Admin only) */}
              {isAdmin && (
                <div
                  onClick={() => switchTab('settings')}
                  className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-emerald-400 dark:hover:border-emerald-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Settings size={24} />
                    </div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Cài Đặt Web & AI
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                      Cấu hình Gemini API Keys đa tầng, chọn model Gemini 2.5 Flash / Pro, quản lý hiệu ứng và hình nền đăng nhập.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Mở Cài Đặt Hệ Thống</span>
                    <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              )}

              {/* Card 5: Cá nhân & Zalo */}
              <div
                onClick={() => switchTab('profile')}
                className="bg-white dark:bg-[#1E293B] p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xs hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UserIcon size={24} />
                  </div>
                  <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Hồ Sơ & Zalo Liên Hệ
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 leading-relaxed">
                    Cập nhật Tên hiển thị, Ảnh đại diện, và Số điện thoại Zalo để học sinh bấm liên hệ trực tiếp khi làm bài.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  <span>Cập Nhật Thông Tin</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Recent Quizzes Preview Table */}
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight flex items-center gap-2">
                  <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                  <span>{isTeacher ? 'Đề Thi Gần Đây Của Bạn' : 'Đề Thi Mới Nhất Trên Hệ Thống'}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {quizzes.length > 0 ? `Hiển thị 5 đề mới nhất trong tổng số ${quizzes.length} đề thi` : 'Chưa có đề thi nào'}
                </p>
              </div>

              <button
                onClick={() => switchTab('quizzes')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-bold text-xs transition cursor-pointer self-start sm:self-auto"
              >
                <span>Xem tất cả trong Quản lý Bài test</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {quizzes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                Chưa có bài test nào. Bấm nút <strong>&quot;Tạo Đề Mới&quot;</strong> để bắt đầu soạn đề!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-black uppercase text-slate-400 dark:text-slate-500">
                      <th className="pb-3">Tên Đề Thi</th>
                      <th className="pb-3 text-center">Môn Học</th>
                      <th className="pb-3 text-center">Trạng Thái</th>
                      <th className="pb-3 text-center">Số Câu</th>
                      <th className="pb-3 text-right">Ngày Tạo</th>
                      <th className="pb-3 text-right">Thao Tác Nhanh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {quizzes.slice(0, 5).map(quiz => (
                      <tr key={quiz.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100 max-w-xs truncate">
                          <a
                            href={`/?id=${quiz.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-blue-400 transition no-underline flex items-center gap-1.5"
                          >
                            <span>{quiz.title}</span>
                            <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
                          </a>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                            {quiz.category || 'Chung'}
                          </span>
                        </td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-black text-[11px] ${
                            quiz.isActive !== false ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                          }`}>
                            {quiz.isActive !== false ? <CheckCircle2 size={12} /> : <Lock size={12} />}
                            <span>{quiz.isActive !== false ? 'Đang mở' : 'Đã khóa'}</span>
                          </span>
                        </td>
                        <td className="py-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
                          {quiz.questions?.length || 0}
                        </td>
                        <td className="py-3.5 text-right text-slate-400 dark:text-slate-500 text-xs font-medium">
                          {formatTimeAgo(quiz.createdAt)}
                        </td>
                        <td className="py-3.5 text-right space-x-2">
                          <button
                            onClick={() => copyShareLink(quiz.id)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer inline-flex items-center"
                            title="Copy link làm bài"
                          >
                            <Copy size={13} />
                          </button>
                          <a
                            href={`/?id=${quiz.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 transition cursor-pointer inline-flex items-center no-underline"
                            title="Làm thử"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: QUẢN LÝ ĐỀ THI (ADMIN & GIÁO VIÊN)
      ───────────────────────────────────────────────────────────── */}
      {!isStudent && activeTab === 'quizzes' && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {isTeacher ? 'Đề thi của bạn' : 'Tổng Đề Thi'}
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <FileText size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">
                {isTeacher ? `${quizzes.length}/${teacherLimit}` : quizzes.length}
              </div>
              {isTeacher && (
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      quizzes.length >= teacherLimit ? 'bg-rose-500' : 'bg-indigo-600'
                    }`}
                    style={{ width: `${Math.min(100, (quizzes.length / teacherLimit) * 100)}%` }}
                  />
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đang Mở</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Activity size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">{activeQuizzesCount}</div>
              <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">Học sinh có thể làm bài</div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Đã Khóa</span>
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Lock size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">{inactiveQuizzesCount}</div>
              <div className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1">Tạm dừng nhận bài</div>
            </div>

            <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-xs relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Lớp Học</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <School size={16} />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100">{classes.length}</div>
              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mt-1 cursor-pointer" onClick={() => setActiveTab('classes')}>
                Xem danh sách lớp ➔
              </div>
            </div>
          </div>

          {/* Floating Sticky Bar khi chọn nhiều bài test cùng lúc */}
          {selectedQuizIds.length > 0 && (
            <div className="sticky top-4 z-40 bg-slate-900 text-white p-3.5 sm:px-5 rounded-2xl shadow-2xl flex items-center justify-between gap-3 animate-pop-in border border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-full">
                  {selectedQuizIds.length} bài đã chọn
                </span>
                <span className="text-xs sm:text-sm font-semibold text-slate-300 hidden sm:inline">
                  Thao tác hàng loạt trên các đề thi đã tick
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const targets = quizzes.filter(q => selectedQuizIds.includes(q.id))
                    handleOpenAccessModal(targets)
                  }}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Shield size={15} />
                  <span>Phân Quyền {selectedQuizIds.length} Đề Này</span>
                </button>
                <button
                  onClick={() => setSelectedQuizIds([])}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>
          )}

          {/* Quizzes Table Card */}
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
            {/* Table Filters & Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên đề thi..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Lọc theo môn */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  {allCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                {/* Lọc trạng thái */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang mở</option>
                  <option value="inactive">Đã khóa</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    <th className="pb-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedQuizIds.length > 0 && selectedQuizIds.length === filteredQuizzes.length}
                        onChange={toggleSelectAllQuizzes}
                        className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer"
                        title="Chọn tất cả"
                      />
                    </th>
                    <th className="pb-3 font-extrabold">Tên Bài Test</th>
                    <th className="pb-3 font-extrabold">Môn Học</th>
                    <th className="pb-3 font-extrabold text-center">Quyền Truy Cập</th>
                    <th className="pb-3 font-extrabold text-center">Trạng Thái</th>
                    <th className="pb-3 font-extrabold text-center">Mật Khẩu</th>
                    <th className="pb-3 font-extrabold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQuizzes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">
                        Không tìm thấy bài test nào phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredQuizzes.map(quiz => {
                      const isSelected = selectedQuizIds.includes(quiz.id)
                      const isRestricted = quiz.accessType === 'restricted' || (quiz.allowedGmails && quiz.allowedGmails.length > 0)
                      const gmailsCount = quiz.allowedGmails?.length || 0

                      return (
                        <tr key={quiz.id} className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/30' : ''}`}>
                          <td className="py-3.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectQuiz(quiz.id)}
                              className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 max-w-xs font-bold text-slate-800 dark:text-slate-100">
                            <div className="truncate">{quiz.title}</div>
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                              Tạo {formatTimeAgo(quiz.createdAt)}
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              {quiz.category || 'Chung'}
                            </span>
                          </td>
                          <td className="py-3.5 text-center">
                            {isRestricted ? (
                              <button
                                onClick={() => handleOpenAccessModal([quiz])}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition cursor-pointer"
                                title="Bấm để chỉnh sửa danh sách Gmail được phép"
                              >
                                <Lock size={11} /> {gmailsCount} Gmail
                              </button>
                            ) : (
                              <button
                                onClick={() => handleOpenAccessModal([quiz])}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer"
                                title="Bấm để phân quyền giới hạn Gmail"
                              >
                                <GlobeIcon size={11} /> Công khai
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => handleToggleQuizStatus(quiz)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black border transition cursor-pointer ${
                                quiz.isActive !== false
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                              }`}
                            >
                              {quiz.isActive !== false ? <Unlock size={11} /> : <Lock size={11} />}
                              {quiz.isActive !== false ? 'Đang mở' : 'Đã khóa'}
                            </button>
                          </td>
                          <td className="py-3.5 text-center">
                            <button
                              onClick={() => {
                                setEditingQuizPass(quiz)
                                setQuizPassInput(quiz.password || '')
                              }}
                              className={`p-1.5 rounded-lg border text-xs font-mono transition cursor-pointer ${
                                quiz.password
                                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700 hover:text-slate-700 dark:hover:text-slate-300'
                              }`}
                              title={quiz.password ? `Pass: ${quiz.password}` : 'Chưa đặt mật khẩu'}
                            >
                              <Key size={14} />
                            </button>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Nút phân quyền siêu đặc biệt */}
                              <button
                                onClick={() => handleOpenAccessModal([quiz])}
                                className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
                                title="Phân quyền truy cập đề thi theo Gmail / Lớp học"
                              >
                                <Shield size={15} />
                              </button>

                              {/* Copy Link */}
                              <button
                                onClick={() => {
                                  const url = `${window.location.origin}/?id=${quiz.id}`
                                  navigator.clipboard.writeText(url)
                                  showToast('Đã copy link bài thi!')
                                }}
                                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                                title="Copy link làm bài"
                              >
                                <Copy size={15} />
                              </button>

                              {/* Edit in Creator */}
                              <Link
                                href={`/creator?id=${quiz.id}`}
                                className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition cursor-pointer"
                                title="Mở trong trình soạn thảo"
                              >
                                <Edit2 size={15} />
                              </Link>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteQuiz(quiz)}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 transition cursor-pointer"
                                title="Xóa bài thi"
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
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: QUẢN LÝ LỚP HỌC & HỌC SINH (TEACHER & ADMIN)
      ───────────────────────────────────────────────────────────── */}
      {!isStudent && activeTab === 'classes' && (
        <div className="space-y-6">
          {/* Header Bar Lớp học */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1E293B] p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <School size={22} className="text-indigo-600 dark:text-indigo-400" />
                {activeClassView ? `Lớp Học: ${activeClassView.name}` : 'Quản Lý Lớp Học & Học Sinh'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {activeClassView
                  ? `Danh sách ${activeClassView.students?.length || 0} học sinh • Cài đặt phân quyền môn học & đề thi chi tiết`
                  : 'Tạo lớp học, lưu danh sách Gmail học sinh và phân quyền làm bài thi tiện lợi'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeClassView ? (
                <>
                  <button
                    onClick={() => setActiveClassView(null)}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} /> Quay lại danh sách lớp
                  </button>
                  <button
                    onClick={() => setIsAddStudentOpen(true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus size={16} /> Thêm Học Sinh
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsCreateClassOpen(true)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-200 dark:shadow-indigo-950"
                >
                  <Plus size={16} /> Tạo Lớp Học Mới
                </button>
              )}
            </div>
          </div>

          {/* VIEW 1: DANH SÁCH LỚP HỌC */}
          {!activeClassView && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white dark:bg-[#1E293B] rounded-3xl border border-dashed border-slate-200 dark:border-slate-700">
                  <School size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                  <p className="font-bold text-slate-700 dark:text-slate-200 text-base">Chưa có lớp học nào được tạo</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Tạo lớp học giúp bạn gom danh sách Gmail học sinh để cấp quyền làm bài nhanh chóng chỉ trong 1 click!
                  </p>
                  <button
                    onClick={() => setIsCreateClassOpen(true)}
                    className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Tạo Lớp Học Đầu Tiên
                  </button>
                </div>
              ) : (
                classes.map(c => (
                  <div key={c.id} className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs hover:shadow-md transition space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                          {c.students?.length || 0} Học Sinh
                        </span>
                        <h3 className="font-black text-slate-900 dark:text-slate-100 text-base mt-1.5">{c.name}</h3>
                        {c.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{c.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                          title="Xóa lớp học"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Tạo {formatTimeAgo(c.createdAt || new Date())}
                      </span>
                      <button
                        onClick={() => setActiveClassView(c)}
                        className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                      >
                        <span>Xem Học Sinh</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* VIEW 2: DANH SÁCH HỌC SINH TRONG LỚP */}
          {activeClassView && (
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="pb-3 font-extrabold">Tên Học Sinh</th>
                      <th className="pb-3 font-extrabold">Gmail (Google Login)</th>
                      <th className="pb-3 font-extrabold text-center">Môn & Đề Được Cấp</th>
                      <th className="pb-3 font-extrabold text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {(!activeClassView.students || activeClassView.students.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">
                          Lớp này chưa có học sinh nào. Bấm nút <strong>"+ Thêm Học Sinh"</strong> ở trên để thêm.
                        </td>
                      </tr>
                    ) : (
                      activeClassView.students.map(student => {
                        let parsedSubs: string[] = []
                        let parsedQs: string[] = []
                        try {
                          if (student.allowedSubjects) parsedSubs = JSON.parse(student.allowedSubjects)
                          if (student.allowedQuizIds) parsedQs = JSON.parse(student.allowedQuizIds)
                        } catch (e) {}

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                            <td className="py-3.5 font-bold text-slate-800 dark:text-slate-100">
                              {student.name || student.email.split('@')[0]}
                            </td>
                            <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">
                              {student.email}
                            </td>
                            <td className="py-3.5 text-center">
                              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50">
                                {parsedSubs.length > 0 ? `${parsedSubs.length} Môn` : ''} {parsedQs.length > 0 ? `${parsedQs.length} Đề` : (parsedSubs.length === 0 ? 'Mặc định' : '')}
                              </span>
                            </td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleOpenStudentPerms(student)}
                                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                                  title="Cài đặt phân quyền môn học & bài test riêng biệt cho học sinh này"
                                >
                                  <Settings size={14} /> Cài Đặt Quyền
                                </button>
                                <button
                                  onClick={() => handleDeleteStudentFromClass(student.id, student.email)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                                  title="Xóa khỏi lớp"
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
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: QUẢN LÝ NGƯỜI DÙNG & PHÂN QUYỀN (ADMIN ONLY)
      ───────────────────────────────────────────────────────────── */}
      {!isTeacher && !isStudent && activeTab === 'teachers' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          {/* Header & Gửi Thông Báo Toàn Hệ Thống */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Shield size={22} className="text-purple-600 dark:text-purple-400" />
                Quản Lý Người Dùng & Phân Quyền Hệ Thống
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Xem danh sách thành viên, nâng cấp vai trò Giáo viên / Học sinh, điều chỉnh hạn mức tạo đề và gửi thông báo cá nhân.
              </p>
            </div>

            <button
              onClick={() => {
                setNotifTargetUserId(null)
                setNotifTargetName('Tất cả người dùng')
                setIsNotifSendOpen(true)
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer self-start md:self-auto"
            >
              <Send size={14} /> Gửi Thông Báo Toàn Web
            </button>
          </div>

          {/* Cấp quyền giáo viên nhanh bằng Gmail */}
          <div className="bg-gradient-to-r from-indigo-50/80 via-blue-50/50 to-slate-50 dark:from-indigo-950/40 dark:via-blue-950/30 dark:to-slate-900/40 p-4 sm:p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base flex items-center gap-2">
                <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                Cấp Quyền Giáo Viên Nhanh Bằng Gmail
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Nhập địa chỉ Gmail của giáo viên và bấm Enter hoặc Cấp Quyền để kích hoạt ngay
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (!quickGmail.trim()) return
                try {
                  const res = await fetch('/api/admin/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: quickGmail.trim(), role: 'TEACHER', maxTests: 15 })
                  })
                  if (res.ok) {
                    showToast(`Đã cấp quyền Giáo viên thành công cho ${quickGmail}!`)
                    setQuickGmail('')
                    refreshData()
                  } else {
                    const d = await res.json()
                    showToast(d.error || 'Lỗi cấp quyền', 'error')
                  }
                } catch (err) {
                  showToast('Lỗi kết nối máy chủ', 'error')
                }
              }}
              className="flex items-center gap-2"
            >
              <input
                type="email"
                placeholder="Ví dụ: giaovien@gmail.com..."
                value={quickGmail}
                onChange={(e) => setQuickGmail(e.target.value)}
                className="px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600 w-64 shadow-xs"
                required
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
              >
                Cấp Quyền
              </button>
            </form>
          </div>

          {/* Thanh công cụ: Bộ Lọc Vai Trò & Ô Tìm Kiếm */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center flex-wrap gap-1.5">
              <button
                onClick={() => setUserRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  userRoleFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Tất cả ({users.length})
              </button>
              <button
                onClick={() => setUserRoleFilter('teacher')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                  userRoleFilter === 'teacher'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>👨‍🏫 Giáo viên</span>
                <span className="opacity-80">({users.filter(u => u.role === 'TEACHER' || u.role === 'USER').length})</span>
              </button>
              <button
                onClick={() => setUserRoleFilter('student')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                  userRoleFilter === 'student'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🎓 Học sinh</span>
                <span className="opacity-80">({users.filter(u => u.role === 'STUDENT').length})</span>
              </button>
              <button
                onClick={() => setUserRoleFilter('admin')}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                  userRoleFilter === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span>🛡️ Quản trị viên</span>
                <span className="opacity-80">({users.filter(u => u.role === 'ADMIN').length})</span>
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Tìm kiếm tài khoản..."
                value={userSearchTerm}
                onChange={e => setUserSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
              />
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Danh sách người dùng */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                  <th className="pb-3 font-extrabold">Tài Khoản</th>
                  <th className="pb-3 font-extrabold">Gmail / Liên Hệ</th>
                  <th className="pb-3 font-extrabold text-center">Vai Trò (Bấm Đổi)</th>
                  <th className="pb-3 font-extrabold text-center">Hạn Mức Đề</th>
                  <th className="pb-3 font-extrabold text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users
                  .filter(u => {
                    if (userRoleFilter === 'teacher') return u.role === 'TEACHER' || u.role === 'USER'
                    if (userRoleFilter === 'student') return u.role === 'STUDENT'
                    if (userRoleFilter === 'admin') return u.role === 'ADMIN'
                    return true
                  })
                  .filter(u => {
                    if (!userSearchTerm.trim()) return true
                    const s = userSearchTerm.toLowerCase()
                    return (
                      (u.name && u.name.toLowerCase().includes(s)) ||
                      (u.username && u.username.toLowerCase().includes(s)) ||
                      (u.email && u.email.toLowerCase().includes(s))
                    )
                  })
                  .map(u => {
                    const isMainAdmin = u.username?.toLowerCase() === 'duylniedu' || u.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-xs flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-600">
                              {(u.name || u.username).charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                <span>{u.name || u.username}</span>
                                {isMainAdmin && (
                                  <span className="text-[10px] bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-extrabold px-1.5 py-0.2 rounded-full">
                                    Root
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 font-mono text-slate-600 dark:text-slate-300">
                          {u.email || <span className="text-slate-400 dark:text-slate-500 italic">Chưa có Gmail</span>}
                        </td>
                        <td className="py-3.5 text-center">
                          {isMainAdmin ? (
                            <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300">
                              ADMIN
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              onChange={(e) => handleQuickUpdateRole(u.id, e.target.value)}
                              className={`px-2 py-1 rounded-lg text-xs font-bold border border-transparent outline-none cursor-pointer transition ${
                                u.role === 'ADMIN'
                                  ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:border-purple-300'
                                  : u.role === 'TEACHER' || u.role === 'USER'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:border-emerald-300'
                                  : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 hover:border-blue-300'
                              }`}
                              title="Bấm để đổi quyền hạn trực tiếp"
                            >
                              <option value="STUDENT">🎓 STUDENT (Học sinh)</option>
                              <option value="TEACHER">👨‍🏫 TEACHER (Giáo viên)</option>
                              <option value="ADMIN">🛡️ ADMIN (Quản trị)</option>
                            </select>
                          )}
                        </td>
                        <td className="py-3.5 text-center">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="Bấm để chỉnh sửa hạn mức đề"
                          >
                            <span>{u._count?.quizzes || 0} / {u.maxTests}</span>
                            <Edit2 size={12} className="text-slate-400" />
                          </button>
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditUser(u)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                              title="Chỉnh sửa thông tin & hạn mức"
                            >
                              <Edit2 size={14} />
                            </button>

                            <button
                              onClick={() => {
                                setNotifTargetUserId(u.id)
                                setNotifTargetName(u.name || u.username)
                                setIsNotifSendOpen(true)
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
                              title="Gửi thông báo cá nhân"
                            >
                              <Send size={14} />
                            </button>

                            {!isMainAdmin && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name || u.username)}
                                disabled={isDeletingUser === u.id}
                                className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 transition cursor-pointer disabled:opacity-50"
                                title="Xóa tài khoản"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: CÀI ĐẶT WEB & AI (ADMIN ONLY)
      ───────────────────────────────────────────────────────────── */}
      {!isTeacher && !isStudent && activeTab === 'settings' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Settings size={22} className="text-indigo-600 dark:text-indigo-400" />
                Cài Đặt Hệ Thống & Cấu Hình Trí Tuệ Nhân Tạo (AI)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                Quản lý chìa khóa Gemini API, lựa chọn mô hình AI giải thích câu hỏi, bật tắt ảnh nền thi và thông tin vận hành máy chủ.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* Card 1: Gemini API Keys & Model */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-4">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-extrabold text-sm">
                  <Sparkles size={18} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Google Gemini API (Giải thích câu hỏi tự động)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Danh Sách Gemini API Keys
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Dán các API Key của Google AI Studio tại đây, phân tách bởi dấu phẩy nếu dùng nhiều key xoay vòng..."
                    value={geminiKeys}
                    onChange={e => setGeminiKeys(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    💡 Hỗ trợ xoay vòng nhiều keys tự động: key1, key2, key3... giúp không bao giờ bị giới hạn lượt gọi (Rate Limit).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mô Hình Gemini Mặc Định
                  </label>
                  <div className="space-y-2.5">
                    <select
                      value={geminiModel}
                      onChange={e => setGeminiModel(e.target.value)}
                      className="w-full sm:w-80 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-600 cursor-pointer"
                    >
                      {availableModels.map(m => (
                        <option key={m} value={m}>
                          {m === 'gemini-2.5-flash' ? '⚡ gemini-2.5-flash (Siêu nhanh, tối ưu nhất)' :
                           m === 'gemini-2.5-pro' ? '🧠 gemini-2.5-pro (Thông minh chuyên sâu)' :
                           m === 'gemini-2.0-flash' ? '🚀 gemini-2.0-flash (Tốc độ cao)' :
                           m === 'gemini-1.5-flash' ? '⚡ gemini-1.5-flash (Bản ổn định)' :
                           m === 'gemini-1.5-pro' ? '🎯 gemini-1.5-pro (Suy luận tốt)' :
                           `✨ ${m} (Tùy chỉnh)`}
                        </option>
                      ))}
                    </select>

                    {/* Input tự điền model tùy chỉnh và lưu */}
                    <div className="flex items-center gap-2 max-w-lg">
                      <input
                        type="text"
                        placeholder="Tự điền model ID (vd: gemini-2.5-flash-thinking, gemini-3.0-pro)..."
                        value={customModelInput}
                        onChange={(e) => setCustomModelInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCustomModel()
                          }
                        }}
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomModel}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer whitespace-nowrap active:scale-95"
                      >
                        + Thêm & Chọn Model
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      💡 Bạn có thể tự điền bất kỳ mã model Gemini nào được Google AI Studio hỗ trợ, hệ thống sẽ tự động lưu lại để sử dụng cho các lần sau.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 2: Hình nền phòng thi */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <GlobeIcon size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Hình Nền Thi Sống Động (Active Background)</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md">
                    Hiển thị các ảnh phong cảnh thiên nhiên chất lượng cao chuyển động nhẹ khi thí sinh làm bài thi.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeBgEnabled}
                    onChange={e => setActiveBgEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Card 3: Thông tin máy chủ & cơ sở dữ liệu */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Hạ tầng & Dịch vụ</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 font-medium">Cơ sở dữ liệu</div>
                    <div className="font-black text-slate-800 dark:text-slate-100 mt-0.5">PostgreSQL (Neon)</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 font-medium">Máy chủ & CDN</div>
                    <div className="font-black text-slate-800 dark:text-slate-100 mt-0.5">Vercel Edge Cloud</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-400 font-medium">Tài khoản Quản trị</div>
                    <div className="font-black text-indigo-600 dark:text-indigo-400 mt-0.5 truncate">DuylniEdu (Root)</div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-2xl transition shadow-md shadow-indigo-200 dark:shadow-indigo-950 cursor-pointer disabled:opacity-60"
                >
                  {isSavingSettings ? 'Đang lưu cấu hình...' : 'Lưu Thay Đổi Cấu Hình'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB: THÔNG TIN CÁ NHÂN, AVATAR & SỐ ĐIỆN THOẠI ZALO
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <UserIcon size={22} className="text-indigo-600 dark:text-indigo-400" />
              Cài Đặt Thông Tin Cá Nhân & Liên Hệ Zalo
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              Thông tin này giúp học sinh nhận diện và hiển thị nút liên hệ Zalo khi cần xin quyền làm bài thi.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            {/* Tên hiển thị */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Tên Hiển Thị (Display Name)
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Ví dụ: Thầy Nhật Duy, Cô Mai Anh..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600 transition"
                required
              />
            </div>

            {/* Avatar URL & Preset Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Ảnh Đại Diện (Avatar)
              </label>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-indigo-200 dark:border-indigo-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-xs">
                  {profileAvatar ? (
                    <img src={profileAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon size={30} className="text-slate-400" />
                  )}
                </div>
                <input
                  type="url"
                  value={profileAvatar}
                  onChange={(e) => setProfileAvatar(e.target.value)}
                  placeholder="Dán link ảnh đại diện (https://...)"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                />
              </div>

              {/* Preset avatar selector */}
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Hoặc chọn avatar có sẵn:</p>
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {PRESET_AVATARS.map(av => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setProfileAvatar(av.url)}
                      className={`w-11 h-11 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer ${
                        profileAvatar === av.url ? 'border-indigo-600 scale-105 shadow-md' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                      title={av.label}
                    >
                      <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Số điện thoại Zalo */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Số Điện Thoại Zalo (Bắt đầu bằng số 0, đủ 10 chữ số)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={10}
                  value={profilePhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '') // Chỉ nhận số
                    setProfilePhone(val)
                    validatePhone(val)
                  }}
                  placeholder="Ví dụ: 0912345678"
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border rounded-xl text-sm font-mono font-bold text-slate-800 dark:text-slate-100 outline-none transition ${
                    phoneError ? 'border-rose-400 focus:border-rose-500 bg-rose-50/20 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-600'
                  }`}
                />
                {profilePhone && !phoneError && (
                  <CheckCircle2 size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                )}
              </div>

              {phoneError ? (
                <p className="text-xs text-rose-500 font-semibold mt-1.5 flex items-center gap-1">
                  <AlertCircle size={13} /> {phoneError}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-1.5 leading-relaxed">
                  💡 Số điện thoại Zalo này sẽ hiển thị thành <strong>Nút Nhắn Zalo</strong> trực tiếp trên màn hình bài thi khi học sinh chưa có quyền làm bài cần liên hệ với bạn.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-200 dark:shadow-none transition cursor-pointer disabled:opacity-60"
              >
                {isSavingProfile ? 'Đang lưu...' : 'Lưu Thay Đổi'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: PHÂN QUYỀN TRUY CẬP ĐỀ THI (SIÊU ĐẶC BIỆT)
      ───────────────────────────────────────────────────────────── */}
      {isAccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Phân Quyền Truy Cập Đề Thi
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Áp dụng cho {accessTargetQuizzes.length} bài thi được chọn
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccessControl} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0 overscroll-contain">
                {/* Danh sách đề thi áp dụng */}
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-3.5">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                    Các bài thi sẽ được áp dụng:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {accessTargetQuizzes.map(q => (
                      <span key={q.id} className="text-xs font-bold bg-white dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 truncate max-w-xs">
                        {q.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Chọn hình thức quyền */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-2">Hình Thức Truy Cập</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setAccessTypeChoice('public')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        accessTypeChoice === 'public'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GlobeIcon size={16} className={accessTypeChoice === 'public' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                        <span className="text-xs font-extrabold">Công Khai</span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-1">Mọi học sinh có link đều làm được bài</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccessTypeChoice('restricted')}
                      className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                        accessTypeChoice === 'restricted'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-bold shadow-xs'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Lock size={16} className={accessTypeChoice === 'restricted' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'} />
                        <span className="text-xs font-extrabold">Giới Hạn Gmail</span>
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-1">Chỉ Gmail chỉ định mới được làm bài</p>
                    </button>
                  </div>
                </div>

                {/* Textarea danh sách Gmail khi chọn Restricted */}
                {accessTypeChoice === 'restricted' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
                        Danh sách Gmail được phép (mỗi Gmail 1 dòng riêng biệt)
                      </label>
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">
                        {allowedGmailsInput.split('\n').filter(e => e.trim().includes('@')).length} Gmail hợp lệ
                      </span>
                    </div>

                    <textarea
                      rows={5}
                      value={allowedGmailsInput}
                      onChange={(e) => setAllowedGmailsInput(e.target.value)}
                      placeholder="hocsinh1@gmail.com&#10;hocsinh2@gmail.com&#10;hocsinh3@gmail.com"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    />

                    {/* Thêm nhanh từ Lớp học */}
                    {classes.length > 0 && (
                      <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2 flex-1">
                          <School size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          <select
                            value={selectedClassToAdd}
                            onChange={(e) => setSelectedClassToAdd(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                          >
                            <option value="">-- Chọn Lớp Học Đã Tạo --</option>
                            {classes.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.name} ({c.students?.length || 0} học sinh)
                              </option>
                            ))}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddClassGmailsToAccessInput}
                          disabled={!selectedClassToAdd}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer whitespace-nowrap"
                        >
                          + Thêm Học Sinh Lớp Này
                        </button>
                      </div>
                    )}

                    {/* Nút lưu danh sách Gmail này thành Lớp học mới */}
                    {!showQuickCreateClass ? (
                      <button
                        type="button"
                        onClick={() => setShowQuickCreateClass(true)}
                        className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1.5 cursor-pointer"
                      >
                        <FolderPlus size={14} />
                        Lưu danh sách Gmail này thành Lớp Học mới...
                      </button>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Nhập tên lớp học mới..."
                            value={quickClassName}
                            onChange={(e) => setQuickClassName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                          />
                          <button
                            type="button"
                            onClick={handleQuickSaveClassFromAccessInput}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            Lưu Lớp
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowQuickCreateClass(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 cursor-pointer"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsAccessModalOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAccess}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSavingAccess ? 'Đang lưu...' : 'Lưu & Cập Nhật'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TẠO LỚP HỌC MỚI
      ───────────────────────────────────────────────────────────── */}
      {isCreateClassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <School size={18} className="text-indigo-600 dark:text-indigo-400" />
                Tạo Lớp Học Mới
              </h3>
              <button
                onClick={() => setIsCreateClassOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0 overscroll-contain">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tên Lớp Học
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Lớp 12A1 - Toán VIP..."
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mô Tả Lớp (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nhóm ôn thi tốt nghiệp THPT 2026..."
                    value={newClassDesc}
                    onChange={(e) => setNewClassDesc(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Danh Sách Gmail Học Sinh (Mỗi dòng 1 email)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="hocsinh1@gmail.com&#10;hocsinh2@gmail.com"
                    value={newClassGmails}
                    onChange={(e) => setNewClassGmails(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsCreateClassOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingClass}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSavingClass ? 'Đang tạo...' : 'Tạo Lớp Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: THÊM HỌC SINH VÀO LỚP
      ───────────────────────────────────────────────────────────── */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
                Thêm Học Sinh Vào Lớp
              </h3>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddStudentToClass} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0 overscroll-contain">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Gmail Học Sinh (Google Login)
                  </label>
                  <input
                    type="email"
                    placeholder="hocsinh@gmail.com"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tên Học Sinh (Tùy chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingStudent}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSavingStudent ? 'Đang thêm...' : 'Thêm Vào Lớp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CÀI ĐẶT PHÂN QUYỀN MÔN & ĐỀ CHO TỪNG HỌC SINH RIÊNG BIỆT
      ───────────────────────────────────────────────────────────── */}
      {editingStudentPerms && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-xl w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <UserCheck size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Cài Đặt Quyền Cho: {editingStudentPerms.name || editingStudentPerms.email}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {editingStudentPerms.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingStudentPerms(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0 overscroll-contain">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                Chọn môn học hoặc các bài test cụ thể mà học sinh này được phép làm. Khi được tick, học sinh sẽ có quyền làm bài test tương ứng.
              </p>

              {/* Danh sách các Môn Học hiện có trong hệ thống */}
              <div className="space-y-3">
                {subjects.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    Chưa có môn học nào trong hệ thống.
                  </div>
                ) : (
                  subjects.map(sub => {
                    const isAllSubjectChecked = studentPermSubjects.includes(sub.name)
                    const isExpanded = expandedSubjectId === sub.id

                    return (
                      <div key={sub.id} className="border border-slate-200 dark:border-slate-700/80 rounded-2xl overflow-hidden bg-white dark:bg-[#1E293B] shadow-2xs">
                        {/* Môn Học Header */}
                        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-800/70 flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                            <input
                              type="checkbox"
                              checked={isAllSubjectChecked}
                              onChange={() => handleToggleSubjectForStudent(sub)}
                              className="w-4 h-4 rounded-md accent-indigo-600 cursor-pointer"
                            />
                            <div>
                              <span className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                                {sub.name}
                              </span>
                              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium ml-2">
                                ({sub.quizzes.length} bài test)
                              </span>
                            </div>
                          </label>

                          <button
                            type="button"
                            onClick={() => setExpandedSubjectId(isExpanded ? null : sub.id)}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                          >
                            <span>{isExpanded ? 'Ẩn đề' : 'Xem đề'}</span>
                            <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>

                        {/* Collapsible Danh sách các bài test của môn học */}
                        {isExpanded && (
                          <div className="p-3.5 bg-white dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                            {sub.quizzes.length === 0 ? (
                              <p className="text-xs text-slate-400 italic">Môn này chưa có bài test nào.</p>
                            ) : (
                              sub.quizzes.map(q => {
                                const isQuizChecked = studentPermQuizIds.includes(q.id)
                                return (
                                  <label key={q.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={isQuizChecked}
                                      onChange={() => handleToggleQuizForStudent(q.id)}
                                      className="w-3.5 h-3.5 rounded-md accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="font-medium truncate">{q.title}</span>
                                  </label>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 sticky bottom-0 z-10">
              <button
                type="button"
                onClick={() => setEditingStudentPerms(null)}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSaveStudentPerms}
                disabled={isSavingStudentPerms}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
              >
                {isSavingStudentPerms ? 'Đang lưu...' : 'Lưu Phân Quyền'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ĐỔI MẬT KHẨU BÀI THI (GIÁO VIÊN & ADMIN)
      ───────────────────────────────────────────────────────────── */}
      {editingQuizPass && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Key size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Đổi Mật Khẩu Bài Thi
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[240px]">
                    {editingQuizPass.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingQuizPass(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveQuizPass} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0 overscroll-contain">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Mật khẩu bài thi (để trống nếu muốn mở tự do)
                  </label>
                  <input
                    type="text"
                    placeholder="Nhập mật khẩu hoặc để trống..."
                    value={quizPassInput}
                    onChange={(e) => setQuizPassInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    autoFocus
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                    Học sinh sẽ cần nhập mật khẩu này để làm bài. Để trống nếu muốn ai có quyền cũng vào được trực tiếp.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => setEditingQuizPass(null)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingQuizPass}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSavingQuizPass ? 'Đang lưu...' : 'Lưu Mật Khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ĐỔI MẬT KHẨU TÀI KHOẢN CÁ NHÂN
      ───────────────────────────────────────────────────────────── */}
      {isChangeAccPassOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] sm:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Shield size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Đổi Mật Khẩu Tài Khoản
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    Tài khoản: {session.username || session.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsChangeAccPassOpen(false)
                  setNewAccPassword('')
                  setConfirmAccPassword('')
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAccPassword} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0 overscroll-contain">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu mới..."
                    value={newAccPassword}
                    onChange={(e) => setNewAccPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới..."
                    value={confirmAccPassword}
                    onChange={(e) => setConfirmAccPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0 sticky bottom-0 z-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsChangeAccPassOpen(false)
                    setNewAccPassword('')
                    setConfirmAccPassword('')
                  }}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingAccPass}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSavingAccPass ? 'Đang lưu...' : 'Xác Nhận Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: CHỈNH SỬA PHÂN QUYỀN & HẠN MỨC NGƯỜI DÙNG (ADMIN)
      ───────────────────────────────────────────────────────────── */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Edit2 size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Sửa Tài Khoản: {editingUser.name || editingUser.username}
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate max-w-[240px]">
                    @{editingUser.username} • {editingUser.email || 'Chưa có email'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tên hiển thị
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    placeholder="Ví dụ: Thầy Nguyễn Văn A..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Địa chỉ Gmail
                  </label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={e => setEditEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    placeholder="giaovien@gmail.com..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Vai trò
                    </label>
                    <select
                      value={editRole}
                      onChange={e => setEditRole(e.target.value)}
                      disabled={editingUser.username?.toLowerCase() === 'duylniedu' || editingUser.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600 disabled:opacity-50"
                    >
                      <option value="STUDENT">🎓 Học sinh</option>
                      <option value="TEACHER">👨‍🏫 Giáo viên</option>
                      <option value="ADMIN">🛡️ Quản trị viên</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                      Hạn mức đề tạo
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={editMaxTests}
                      onChange={e => setEditMaxTests(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Đổi mật khẩu mới <span className="text-slate-400 dark:text-slate-500 font-normal lowercase">(để trống nếu không đổi)</span>
                  </label>
                  <input
                    type="password"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới hoặc bỏ trống..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Quyền Hạn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: GỬI THÔNG BÁO CHO NGƯỜI DÙNG (ADMIN)
      ───────────────────────────────────────────────────────────── */}
      {isNotifSendOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <Send size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Gửi Thông Báo
                  </h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {notifTargetUserId ? `Gửi tới: ${notifTargetName}` : 'Gửi cho TẤT CẢ thành viên'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsNotifSendOpen(false)
                  setNotifTargetUserId(null)
                  setNotifTitle('')
                  setNotifMessage('')
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendNotification} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 min-h-0">
                <div className="p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                  <span className="font-bold">
                    Người nhận: {notifTargetUserId ? notifTargetName : '📢 Toàn bộ hệ thống'}
                  </span>
                  {notifTargetUserId && (
                    <button
                      type="button"
                      onClick={() => {
                        setNotifTargetUserId(null)
                        setNotifTargetName('Tất cả người dùng')
                      }}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      Đổi sang gửi tất cả
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Tiêu đề thông báo
                  </label>
                  <input
                    type="text"
                    required
                    value={notifTitle}
                    onChange={e => setNotifTitle(e.target.value)}
                    placeholder="Ví dụ: Chào mừng bạn / Thông báo quan trọng..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                    Nội dung thông báo
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={notifMessage}
                    onChange={e => setNotifMessage(e.target.value)}
                    placeholder="Nhập nội dung thông báo gửi vào hộp thư..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600 leading-relaxed"
                  />
                </div>

                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                  🕒 Thời gian gửi: <span className="font-semibold text-slate-600 dark:text-slate-300">{new Date().toLocaleTimeString('vi-VN')} ngày {new Date().toLocaleDateString('vi-VN')}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setIsNotifSendOpen(false)
                    setNotifTargetUserId(null)
                    setNotifTitle('')
                    setNotifMessage('')
                  }}
                  className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSendingNotif}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                >
                  <Send size={14} />
                  <span>{isSendingNotif ? 'Đang gửi...' : 'Gửi Thông Báo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          DRAWER / MODAL: HỘP THƯ THÔNG BÁO
      ───────────────────────────────────────────────────────────── */}
      {isNotifOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-end overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] h-full w-full max-w-md shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-slide-left">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Bell size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">Hộp Thư Thông Báo</h3>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                    {unreadCount > 0 ? `${unreadCount} tin nhắn chưa đọc` : 'Không có tin mới'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllNotificationsAsRead}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-2.5 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition cursor-pointer"
                  >
                    Đã đọc tất cả
                  </button>
                )}
                <button
                  onClick={() => setIsNotifOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {notifications.length === 0 ? (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <Bell size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2 opacity-60" />
                  <p className="font-bold text-sm">Hộp thư trống</p>
                  <p className="text-xs">Bạn chưa có thông báo nào.</p>
                </div>
              ) : (
                notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      n.isRead
                        ? 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-700/60 text-slate-600 dark:text-slate-300'
                        : 'bg-indigo-50/50 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/60 text-slate-900 dark:text-slate-100 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap">
                        {formatTimeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{n.message}</p>
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

function GlobeIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}
