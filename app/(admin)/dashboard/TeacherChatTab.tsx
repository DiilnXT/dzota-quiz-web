'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Smile,
  Send,
  Trash2,
  RotateCcw,
  Share2,
  BookOpen,
  ExternalLink,
  MoreVertical,
  Check,
  Clock,
  Sparkles,
  X,
  ChevronRight,
  User as UserIcon,
  Calendar,
  AlertCircle,
  Copy
} from 'lucide-react'

interface TeacherChatTabProps {
  session: {
    id?: string
    username?: string
    name?: string
    email?: string
    avatar?: string
    phone?: string
    role?: string
  }
  userQuizzes?: any[]
}

const QUICK_EMOJIS = ['😊', '👍', '❤️', '😂', '🎉', '🔥', '👏', '💡', '🎓', '✨', '📚', '💪']

export default function TeacherChatTab({ session, userQuizzes = [] }: TeacherChatTabProps) {
  const myId = session.id || ''

  // Friend states
  const [friends, setFriends] = useState<any[]>([])
  const [incomingRequests, setIncomingRequests] = useState<any[]>([])
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([])
  const [activeFriend, setActiveFriend] = useState<any | null>(null)
  const [friendSubTab, setFriendSubTab] = useState<'friends' | 'requests'>('friends')

  // Search teacher states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  // Chat message states
  const [messages, setMessages] = useState<any[]>([])
  const [messageInput, setMessageInput] = useState('')
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showShareQuizModal, setShowShareQuizModal] = useState(false)
  const [showFriendQuizzesModal, setShowFriendQuizzesModal] = useState(false)
  const [friendQuizzes, setFriendQuizzes] = useState<any[]>([])
  const [isLoadingFriendQuizzes, setIsLoadingFriendQuizzes] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 1. Fetch friend list & requests
  const fetchFriends = async () => {
    try {
      const res = await fetch('/api/teachers/friends')
      const data = await res.json()
      if (data.success) {
        setFriends(data.friends || [])
        setIncomingRequests(data.incomingRequests || [])
        setOutgoingRequests(data.outgoingRequests || [])

        // Update active friend online status if selected
        if (activeFriend) {
          const updated = (data.friends || []).find((f: any) => f.id === activeFriend.id)
          if (updated) {
            setActiveFriend(updated)
          }
        }
      }
    } catch (e) {
      console.error('Lỗi tải danh sách bạn bè:', e)
    }
  }

  useEffect(() => {
    fetchFriends()
    const interval = setInterval(fetchFriends, 8000) // Poll friends & online status every 8s
    return () => clearInterval(interval)
  }, [activeFriend?.id])

  // 2. Fetch messages when activeFriend changes
  const fetchMessages = async (friendId: string) => {
    if (!friendId) return
    try {
      const res = await fetch(`/api/teachers/chat?friendId=${encodeURIComponent(friendId)}`)
      const data = await res.json()
      if (data.success) {
        setMessages(data.messages || [])
        if (data.friend) {
          setActiveFriend((prev: any) => ({ ...prev, ...data.friend }))
        }
      }
    } catch (e) {
      console.error('Lỗi tải tin nhắn:', e)
    }
  }

  useEffect(() => {
    if (!activeFriend?.id) return
    setIsLoadingMessages(true)
    fetchMessages(activeFriend.id).finally(() => setIsLoadingMessages(false))

    // Real-time delta polling every 3 seconds for active conversation
    const interval = setInterval(() => {
      fetchMessages(activeFriend.id)
    }, 3000)

    return () => clearInterval(interval)
  }, [activeFriend?.id])

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 3. Search teachers
  const handleSearchTeachers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch('/api/teachers/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'search', query: searchQuery.trim() })
      })
      const data = await res.json()
      setSearchResults(data.users || [])
    } catch (e) {
      console.error('Lỗi tìm kiếm giáo viên:', e)
    } finally {
      setIsSearching(false)
    }
  }

  // 4. Friend Actions: Send request, accept, reject, unfriend
  const handleSendFriendRequest = async (targetId: string) => {
    try {
      const res = await fetch('/api/teachers/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request', targetId })
      })
      const data = await res.json()
      if (data.success) {
        alert(data.message || 'Đã gửi lời mời kết bạn!')
        fetchFriends()
        handleSearchTeachers()
      } else {
        alert(data.error || 'Không thể gửi lời mời')
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi gửi lời mời')
    }
  }

  const handleAcceptFriendRequest = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/teachers/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', friendshipId })
      })
      const data = await res.json()
      if (data.success) {
        fetchFriends()
      } else {
        alert(data.error || 'Lỗi khi chấp nhận')
      }
    } catch (e) {
      alert('Đã xảy ra lỗi')
    }
  }

  const handleRejectFriendRequest = async (friendshipId: string) => {
    try {
      const res = await fetch('/api/teachers/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', friendshipId })
      })
      const data = await res.json()
      if (data.success) {
        fetchFriends()
      }
    } catch (e) {
      alert('Đã xảy ra lỗi')
    }
  }

  const handleUnfriend = async (friendId: string) => {
    if (!confirm('Bạn có chắc chắn muốn hủy kết bạn với giáo viên này không?')) return
    try {
      const res = await fetch('/api/teachers/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unfriend', targetId: friendId })
      })
      const data = await res.json()
      if (data.success) {
        fetchFriends()
        if (activeFriend?.id === friendId) {
          setActiveFriend(null)
          setMessages([])
        }
      }
    } catch (e) {
      alert('Đã xảy ra lỗi')
    }
  }

  // 5. Send Message (Text)
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!messageInput.trim() || !activeFriend?.id || isSending) return

    const textToSend = messageInput.trim()
    setMessageInput('')
    setIsSending(true)

    try {
      const res = await fetch('/api/teachers/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeFriend.id,
          content: textToSend,
          type: 'TEXT'
        })
      })
      const data = await res.json()
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message])
      } else if (data.error) {
        alert(data.error)
      }
    } catch (e) {
      console.error('Lỗi gửi tin nhắn:', e)
    } finally {
      setIsSending(false)
    }
  }

  // 6. Send Shared Quiz into Chat
  const handleSendQuiz = async (quiz: any) => {
    if (!activeFriend?.id) return
    setShowShareQuizModal(false)

    try {
      const res = await fetch('/api/teachers/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: activeFriend.id,
          content: `Đã chia sẻ đề thi: ${quiz.title}`,
          type: 'QUIZ',
          quizId: quiz.id,
          quizTitle: quiz.title
        })
      })
      const data = await res.json()
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message])
      } else if (data.error) {
        alert(data.error)
      }
    } catch (e) {
      alert('Không thể chia sẻ đề thi')
    }
  }

  // 7. Message actions: Recall, Delete, Clear Today
  const handleRecallMessage = async (messageId: string) => {
    if (!confirm('Bạn có chắc muốn thu hồi tin nhắn này không?')) return
    try {
      const res = await fetch('/api/teachers/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recall', messageId })
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev =>
          prev.map(m => m.id === messageId ? { ...m, isRecalled: true, content: 'Tin nhắn đã được thu hồi' } : m)
        )
      } else {
        alert(data.error || 'Không thể thu hồi')
      }
    } catch (e) {
      alert('Đã xảy ra lỗi')
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch('/api/teachers/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', messageId })
      })
      const data = await res.json()
      if (data.success) {
        setMessages(prev => prev.filter(m => m.id !== messageId))
      }
    } catch (e) {
      alert('Đã xảy ra lỗi')
    }
  }

  const handleClearTodayMessages = async () => {
    if (!activeFriend?.id) return
    if (!confirm('Bạn có chắc muốn xóa toàn bộ tin nhắn hôm nay trong cuộc trò chuyện này không?')) return
    setShowMoreMenu(false)

    try {
      const res = await fetch('/api/teachers/chat', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_today', friendId: activeFriend.id })
      })
      const data = await res.json()
      if (data.success) {
        fetchMessages(activeFriend.id)
        alert('Đã xóa tin nhắn trong ngày hôm nay thành công!')
      }
    } catch (e) {
      alert('Đã xảy ra lỗi')
    }
  }

  // 8. View friend's quizzes (Read-only)
  const handleOpenFriendQuizzes = async () => {
    if (!activeFriend?.id) return
    setShowFriendQuizzesModal(true)
    setIsLoadingFriendQuizzes(true)

    try {
      const res = await fetch(`/api/teachers/quizzes?teacherId=${encodeURIComponent(activeFriend.id)}`)
      const data = await res.json()
      if (data.success) {
        setFriendQuizzes(data.quizzes || [])
      } else {
        alert(data.error || 'Không thể xem đề thi')
      }
    } catch (e) {
      alert('Đã xảy ra lỗi khi tải đề thi của bạn bè')
    } finally {
      setIsLoadingFriendQuizzes(false)
    }
  }

  return (
    <div className="h-[calc(100vh-140px)] min-h-[580px] flex flex-col bg-white dark:bg-[#1E293B] rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* ─────────────────────────────────────────────────────────────
            CỘT TRÁI: DANH SÁCH BẠN BÈ & TÌM KIẾM
        ───────────────────────────────────────────────────────────── */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-100 dark:border-slate-800 flex flex-col flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/40 ${
          activeFriend ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Header cột trái */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <MessageCircle size={20} className="text-indigo-600 dark:text-indigo-400" />
                Cộng Đồng Giáo Viên
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Kết bạn & Chia sẻ đề thi trực tuyến
              </p>
            </div>
            <button
              onClick={() => {
                setIsSearchModalOpen(true)
                setSearchResults([])
                setSearchQuery('')
              }}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Tìm kiếm và kết bạn mới"
            >
              <UserPlus size={16} />
              <span className="hidden sm:inline">Tìm Bạn</span>
            </button>
          </div>

          {/* Subtabs: Bạn bè (số lượng) & Lời mời (số lượng) */}
          <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white/70 dark:bg-slate-800/40 p-1.5 gap-1.5">
            <button
              onClick={() => setFriendSubTab('friends')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                friendSubTab === 'friends'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <UserCheck size={14} />
              <span>Bạn Bè ({friends.length})</span>
            </button>

            <button
              onClick={() => setFriendSubTab('requests')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                friendSubTab === 'requests'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Clock size={14} />
              <span>Lời Mời ({incomingRequests.length})</span>
              {incomingRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse absolute top-2 right-2" />
              )}
            </button>
          </div>

          {/* Danh sách người dùng */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
            {friendSubTab === 'friends' ? (
              friends.length === 0 ? (
                <div className="text-center py-12 px-4 text-slate-400 dark:text-slate-500">
                  <UserPlus size={36} className="mx-auto mb-2.5 opacity-50 text-indigo-400" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Chưa có bạn bè nào</p>
                  <p className="text-[11px] mt-1 leading-relaxed">
                    Bấm <strong>&quot;Tìm Bạn&quot;</strong> để kết nối cùng các giáo viên khác qua Gmail hoặc Tên đăng nhập.
                  </p>
                </div>
              ) : (
                friends.map(f => {
                  const isSelected = activeFriend?.id === f.id
                  return (
                    <div
                      key={f.id}
                      onClick={() => setActiveFriend(f)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                          : 'bg-white dark:bg-slate-800/80 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50/70 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar kèm chấm Online */}
                        <div className="relative flex-shrink-0">
                          <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                            {f.avatar ? (
                              <img src={f.avatar} alt={f.name} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon size={20} className="text-slate-400" />
                            )}
                          </div>
                          {f.isOnline ? (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-xs"
                              title="Đang Online"
                            />
                          ) : (
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-400 border-2 border-white dark:border-slate-900 rounded-full"
                              title="Ngoại tuyến"
                            />
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                            {f.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                              {f.email || `@${f.username}`}
                            </span>
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded-md">
                              {f.quizCount} đề
                            </span>
                          </div>
                        </div>
                      </div>

                      <ChevronRight size={16} className={`text-slate-400 transition-transform ${isSelected ? 'rotate-90 text-indigo-600' : ''}`} />
                    </div>
                  )
                })
              )
            ) : (
              // TAB LỜI MỜI KẾT BẠN
              <div className="space-y-4">
                {/* Lời mời nhận được */}
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-2">
                    Lời Mời Nhận Được ({incomingRequests.length})
                  </h3>
                  {incomingRequests.length === 0 ? (
                    <p className="text-xs text-slate-400 italic px-2 py-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      Không có lời mời nào đang chờ.
                    </p>
                  ) : (
                    incomingRequests.map(req => (
                      <div
                        key={req.friendshipId}
                        className="p-3 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 mb-2"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                            {req.avatar ? (
                              <img src={req.avatar} alt={req.name} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon size={18} className="text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{req.name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{req.email || `@${req.username}`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                          <button
                            onClick={() => handleAcceptFriendRequest(req.friendshipId)}
                            className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            Đồng ý
                          </button>
                          <button
                            onClick={() => handleRejectFriendRequest(req.friendshipId)}
                            className="py-1.5 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Lời mời đã gửi */}
                {outgoingRequests.length > 0 && (
                  <div>
                    <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1 mb-2">
                      Đã Gửi Đi ({outgoingRequests.length})
                    </h3>
                    {outgoingRequests.map(req => (
                      <div
                        key={req.friendshipId}
                        className="p-2.5 bg-slate-100/70 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs mb-1.5"
                      >
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{req.name}</span>
                        <span className="text-[10px] text-slate-400 italic font-medium">Đang chờ...</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            CỘT PHẢI: KHUNG CHAT TRỰC TUYẾN
        ───────────────────────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col min-w-0 bg-white dark:bg-[#1E293B] ${
          !activeFriend ? 'hidden md:flex' : 'flex'
        }`}>
          {activeFriend ? (
            <>
              {/* Header Khung Chat */}
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Nút Back trên Mobile */}
                  <button
                    onClick={() => setActiveFriend(null)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 cursor-pointer"
                  >
                    <ChevronRight size={20} className="rotate-180" />
                  </button>

                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-700 overflow-hidden border border-slate-200 dark:border-slate-600 flex items-center justify-center">
                      {activeFriend.avatar ? (
                        <img src={activeFriend.avatar} alt={activeFriend.name} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon size={18} className="text-slate-400" />
                      )}
                    </div>
                    {activeFriend.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 truncate flex items-center gap-2">
                      {activeFriend.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px]">
                      {activeFriend.isOnline ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-medium">Ngoại tuyến</span>
                      )}
                      {activeFriend.phone && (
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                          • Zalo: {activeFriend.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Các nút công cụ trong phòng Chat */}
                <div className="flex items-center gap-2 relative">
                  {/* Nút Xem kho đề của bạn bè */}
                  <button
                    onClick={handleOpenFriendQuizzes}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Xem kho đề thi của giáo viên này"
                  >
                    <BookOpen size={15} />
                    <span className="hidden sm:inline">Kho Đề Của Bạn</span>
                  </button>

                  {/* Nút Chia sẻ đề thi của tôi vào Chat */}
                  <button
                    onClick={() => setShowShareQuizModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Gửi bài test cho đồng nghiệp làm thử"
                  >
                    <Share2 size={15} />
                    <span className="hidden sm:inline">Chia Sẻ Đề</span>
                  </button>

                  {/* More Menu (Xóa tin nhắn trong ngày, Hủy kết bạn) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <MoreVertical size={17} />
                    </button>

                    {showMoreMenu && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-white dark:bg-[#1E293B] rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 py-1.5 z-30 animate-in fade-in zoom-in-95">
                        <button
                          onClick={handleClearTodayMessages}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={14} />
                          Xóa tin nhắn trong ngày
                        </button>
                        <button
                          onClick={() => {
                            setShowMoreMenu(false)
                            handleUnfriend(activeFriend.id)
                          }}
                          className="w-full px-3.5 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                        >
                          <UserX size={14} />
                          Hủy kết bạn
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Danh sách Tin nhắn (Chat Flow) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 min-h-0 bg-slate-50/30 dark:bg-slate-900/20">
                {isLoadingMessages ? (
                  <div className="flex items-center justify-center py-16 text-slate-400 text-xs font-bold">
                    Đang tải cuộc trò chuyện...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                    <Sparkles size={36} className="mx-auto mb-2 text-indigo-400 opacity-60" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Bắt đầu trò chuyện!</p>
                    <p className="text-[11px] mt-1">
                      Hãy gửi lời chào, emoji vui nhộn hoặc chia sẻ đề thi cùng trao đổi chuyên môn nhé.
                    </p>
                  </div>
                ) : (
                  messages.map(m => {
                    const isMe = m.isMe
                    const timeStr = new Date(m.createdAt).toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-end gap-1.5 max-w-[85%] sm:max-w-[75%]">
                          {/* Nút hành động tin nhắn (Thu hồi / Xóa) */}
                          {isMe && !m.isRecalled && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 mb-1">
                              <button
                                onClick={() => handleRecallMessage(m.id)}
                                title="Thu hồi tin nhắn"
                                className="p-1 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <RotateCcw size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteMessage(m.id)}
                                title="Xóa tin nhắn ở phía tôi"
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          )}

                          {/* Bubble tin nhắn */}
                          <div
                            className={`p-3.5 rounded-3xl transition-all shadow-xs ${
                              isMe
                                ? 'bg-indigo-600 text-white rounded-br-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-slate-100 dark:border-slate-700'
                            }`}
                          >
                            {/* NẾU LÀ DẠNG THU HỒI */}
                            {m.isRecalled ? (
                              <p className="text-xs italic opacity-70 flex items-center gap-1">
                                <RotateCcw size={12} />
                                {m.content}
                              </p>
                            ) : m.type === 'QUIZ' ? (
                              /* NẾU LÀ DẠNG CHIA SẺ ĐỀ THI */
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2">
                                  <div className={`p-1.5 rounded-xl ${isMe ? 'bg-white/20' : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600'}`}>
                                    <BookOpen size={16} />
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80 block">
                                      Đề thi chia sẻ
                                    </span>
                                    <h4 className="text-xs sm:text-sm font-black line-clamp-2">
                                      {m.quizTitle || m.content}
                                    </h4>
                                  </div>
                                </div>

                                <a
                                  href={`/test/${m.quizId}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition no-underline shadow-xs ${
                                    isMe
                                      ? 'bg-white text-indigo-700 hover:bg-slate-50'
                                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                  }`}
                                >
                                  <span>📝 Vào Làm Bài Ngay</span>
                                  <ExternalLink size={13} />
                                </a>
                              </div>
                            ) : (
                              /* TIN NHẮN VĂN BẢN & EMOJI */
                              <p className="text-xs sm:text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {m.content}
                              </p>
                            )}

                            {/* Giờ gửi */}
                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                              isMe ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                              <span>{timeStr}</span>
                              {isMe && <Check size={11} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Dải Emoji Nhanh */}
              {showEmojiPicker && (
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none animate-in fade-in duration-200">
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setMessageInput(prev => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="w-8 h-8 rounded-xl hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-lg transition-transform active:scale-125 cursor-pointer flex-shrink-0"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Khung Nhập Tin Nhắn */}
              <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 rounded-2xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Chọn Emoji vui"
                  >
                    <Smile size={20} />
                  </button>

                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Nhập tin nhắn với giáo viên..."
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600 transition"
                  />

                  <button
                    type="submit"
                    disabled={!messageInput.trim() || isSending}
                    className="p-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-2xl font-bold shadow-md shadow-indigo-200 dark:shadow-none transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send size={16} />
                    <span className="hidden sm:inline text-xs">Gửi</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 dark:text-slate-500">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <MessageCircle size={32} />
              </div>
              <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1">
                Phòng Chat Trực Tuyến Giáo Viên
              </h3>
              <p className="text-xs max-w-sm leading-relaxed">
                Chọn một giáo viên ở danh sách bên trái để bắt đầu nhắn tin trực tuyến, trao đổi chuyên môn và chia sẻ đề thi trắc nghiệm.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL 1: TÌM KIẾM & KẾT BẠN GIÁO VIÊN
      ───────────────────────────────────────────────────────────── */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[88vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <UserPlus size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Tìm Kiếm & Kết Bạn Giáo Viên
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Qua Gmail, User ID hoặc Tên đăng nhập</p>
                </div>
              </div>
              <button
                onClick={() => setIsSearchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 flex-1 overflow-y-auto min-h-0">
              {/* Box hiển thị UID của chính mình để copy gửi cho bạn bè */}
              <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">
                    Mã UID của bạn:
                  </span>
                  <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300 text-xs truncate block select-all">
                    {myId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (myId && typeof navigator !== 'undefined') {
                      navigator.clipboard.writeText(myId)
                      alert('Đã sao chép mã UID của bạn!')
                    }
                  }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 font-bold text-[11px] rounded-lg border border-indigo-200 dark:border-indigo-800/80 transition flex items-center gap-1 cursor-pointer flex-shrink-0"
                >
                  <Copy size={12} />
                  <span>Sao chép</span>
                </button>
              </div>

              <form onSubmit={handleSearchTeachers} className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Dán mã UID, Gmail hoặc Tên giáo viên..."
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-600"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearching}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                >
                  {isSearching ? 'Đang tìm...' : 'Tìm'}
                </button>
              </form>

              {/* Kết quả tìm kiếm */}
              <div className="space-y-2">
                {searchResults.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-400">
                    {searchQuery ? 'Không tìm thấy giáo viên nào phù hợp' : 'Nhập từ khóa và bấm Tìm'}
                  </p>
                ) : (
                  searchResults.map(u => (
                    <div
                      key={u.id}
                      className="p-3 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            <UserIcon size={18} className="text-slate-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{u.name}</p>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300'
                                : u.role === 'TEACHER'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                            }`}>
                              {u.role === 'ADMIN' ? 'Admin' : u.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate">{u.email || `@${u.username}`}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                              {u.quizCount} bài test đã tạo
                            </span>
                            <span>•</span>
                            <span
                              onClick={() => {
                                if (typeof navigator !== 'undefined') {
                                  navigator.clipboard.writeText(u.id)
                                  alert(`Đã sao chép UID của ${u.name}!`)
                                }
                              }}
                              className="text-[9px] font-mono text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer bg-slate-100 dark:bg-slate-700/60 px-1 py-0.2 rounded"
                              title="Bấm để sao chép UID"
                            >
                              UID: {u.id.slice(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {u.friendStatus === 'friends' ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl">
                            Đã là bạn bè
                          </span>
                        ) : u.friendStatus === 'sent' ? (
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 rounded-xl">
                            Đã gửi lời mời
                          </span>
                        ) : u.friendStatus === 'received' ? (
                          <button
                            onClick={() => {
                              handleAcceptFriendRequest(u.friendshipId)
                              setIsSearchModalOpen(false)
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            Đồng ý kết bạn
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSendFriendRequest(u.id)}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                          >
                            + Kết bạn
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 2: CHIA SẺ ĐỀ THI CỦA TÔI VÀO PHÒNG CHAT
      ───────────────────────────────────────────────────────────── */}
      {showShareQuizModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-lg w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Share2 size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Chọn Đề Thi Để Chia Sẻ
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">Gửi trực tiếp vào cuộc trò chuyện với {activeFriend?.name}</p>
                </div>
              </div>
              <button
                onClick={() => setShowShareQuizModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-2 min-h-0">
              {userQuizzes.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">Bạn chưa tạo bài test nào để chia sẻ.</p>
              ) : (
                userQuizzes.map(quiz => (
                  <div
                    key={quiz.id}
                    className="p-3 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 truncate">
                        {quiz.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                        Môn: {quiz.subject || 'Tổng hợp'} • {quiz.questions?.length || 0} câu hỏi
                      </p>
                    </div>

                    <button
                      onClick={() => handleSendQuiz(quiz)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex-shrink-0"
                    >
                      Chia Sẻ
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL 3: XEM KHO ĐỀ CỦA BẠN BÈ (DẠNG CHỈ XEM ĐỂ VÀO LÀM THI)
      ───────────────────────────────────────────────────────────── */}
      {showFriendQuizzesModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-hidden animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#1E293B]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base">
                    Kho Đề Của Giáo Viên: {activeFriend?.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    (Chế độ chia sẻ: Chỉ xem và bấm vào làm bài, không thể sửa/xóa)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFriendQuizzesModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-3 min-h-0">
              {isLoadingFriendQuizzes ? (
                <div className="text-center py-12 text-xs font-bold text-slate-400">
                  Đang tải danh sách bài thi...
                </div>
              ) : friendQuizzes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-500">
                  <BookOpen size={36} className="mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-bold">Giáo viên này chưa có đề thi nào được tạo.</p>
                </div>
              ) : (
                friendQuizzes.map(quiz => (
                  <div
                    key={quiz.id}
                    className="p-4 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60">
                          {quiz.subject}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {quiz.questionCount} câu hỏi • {quiz.timeLimit} phút
                        </span>
                      </div>
                      <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 truncate">
                        {quiz.title}
                      </h4>
                    </div>

                    <a
                      href={`/test/${quiz.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 no-underline flex-shrink-0 cursor-pointer"
                    >
                      <span>📝 Làm Bài Thi</span>
                      <ExternalLink size={14} />
                    </a>
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
