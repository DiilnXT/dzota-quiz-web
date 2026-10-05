'use client'

import React, { useState } from 'react'
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
  ShieldCheck,
  Sparkles,
  LayoutDashboard
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
    }
    questions?: any[]
  }
}

interface TestsClientProps {
  initialQuizzes: QuizItem[]
}

export default function TestsClient({ initialQuizzes }: TestsClientProps) {
  const [quizzes, setQuizzes] = useState<QuizItem[]>(initialQuizzes)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Copy helper
  const handleCopy = (text: string, label: string, idToMark?: string) => {
    try {
      navigator.clipboard.writeText(text)
      if (idToMark) {
        setCopiedId(idToMark)
        setTimeout(() => setCopiedId(null), 2000)
      }
      showToast(`Đã copy ${label}: "${text}"`)
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
  const handleToggleActive = async (q: QuizItem) => {
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
  const handleDeleteQuiz = async (q: QuizItem) => {
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
        showToast(`Đã xóa đề thi "${q.title}" thành công!`)
      } else {
        showToast('Xóa đề thi thất bại', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối khi xóa đề thi', 'error')
    }
  }

  // Extract unique categories
  const categories = Array.from(
    new Set(quizzes.map(q => q.data?.config?.category || 'Chung').filter(Boolean))
  )

  // Filtering
  const filteredQuizzes = quizzes.filter(q => {
    const titleMatch = (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const cat = q.data?.config?.category || 'Chung'
    const categoryMatch = categoryFilter === 'all' || cat === categoryFilter

    const isActive = q.data?.config?.isActive !== false
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'active' && isActive) ||
      (statusFilter === 'locked' && !isActive)

    return titleMatch && categoryMatch && statusMatch
  })

  // Quick Stats
  const totalQuizzes = quizzes.length
  const lockedCount = quizzes.filter(q => q.data?.config?.isActive === false).length
  const activeCount = totalQuizzes - lockedCount
  const passCount = quizzes.filter(q => Boolean(q.data?.config?.password)).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl text-white font-bold flex items-center gap-3 transition-all transform animate-in slide-in-from-bottom-5 ${
          toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'
        }`}>
          {toast.type === 'error' ? <Lock size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-100 text-indigo-700 font-black text-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
              Kho Đề Thi
            </span>
            <span className="text-slate-400 text-xs font-semibold">• Đã đồng bộ trực tiếp</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản Lý Danh Sách Bài Test</h1>
          <p className="text-slate-500 mt-1 font-medium">Bảng thống kê toàn bộ đề thi, quản lý mật khẩu, trạng thái và đường link làm bài</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 hover:text-indigo-600 transition-all flex items-center gap-2"
            title="Về bảng điều khiển Quản trị viên"
          >
            <LayoutDashboard size={16} />
            <span>Dashboard</span>
          </Link>

          <button
            onClick={refreshQuizzes}
            disabled={isLoading}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin text-indigo-600' : ''} />
            <span>Đồng bộ lại</span>
          </button>

          <Link
            href="/creator"
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Tạo Bài Test Mới</span>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Layers size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{totalQuizzes}</div>
              <div className="text-xs font-semibold text-slate-400">Tổng Số Đề Thi</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <Unlock size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{activeCount}</div>
              <div className="text-xs font-semibold text-slate-400">Đang Mở</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
              <Lock size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{lockedCount}</div>
              <div className="text-xs font-semibold text-slate-400">Đã Khóa</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Key size={20} />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800">{passCount}</div>
              <div className="text-xs font-semibold text-slate-400">Có Mật Khẩu VIP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden flex flex-col">
        
        {/* Table Filters Header */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên bài test, ID..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-indigo-500 w-52 sm:w-64"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả môn học ({categories.length})</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang mở</option>
              <option value="locked">Đã khóa</option>
            </select>
          </div>

          <div className="text-xs font-bold text-slate-400">
            Hiển thị <span className="text-indigo-600 font-extrabold">{filteredQuizzes.length}</span> / {totalQuizzes} bài test
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 text-slate-500 text-[11px] uppercase tracking-wider font-extrabold border-b border-slate-100">
                <th className="py-4 px-4 text-center w-12">STT</th>
                <th className="py-4 px-4 min-w-[220px]">Tên Bài Test</th>
                <th className="py-4 px-4">Môn Học</th>
                <th className="py-4 px-4 text-center">Số Câu</th>
                <th className="py-4 px-4 text-center">Thời Gian</th>
                <th className="py-4 px-4 min-w-[130px]">Mật Khẩu</th>
                <th className="py-4 px-4 min-w-[180px]">Link Làm Bài</th>
                <th className="py-4 px-4">Người Tạo</th>
                <th className="py-4 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm bg-white">
              {filteredQuizzes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy bài test nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredQuizzes.map((q, idx) => {
                  const cfg = q.data?.config || {}
                  const questionCount = q.data?.questions?.length || 0
                  const timeLimit = cfg.timeLimit || 15
                  const category = cfg.category || 'Chung'
                  const password = cfg.password || ''
                  const isActive = cfg.isActive !== false
                  const quizUrl = `https://dzota.vercel.app/?id=${q.id}`
                  const isPassCopied = copiedId === `pass_${q.id}`
                  const isLinkCopied = copiedId === `link_${q.id}`

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* STT */}
                      <td className="py-4 px-4 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Tên bài test */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                          {q.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                            isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {isActive ? 'Đang mở' : 'Đã khóa'}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {q.id.substring(0, 16)}...
                          </span>
                        </div>
                      </td>

                      {/* Môn học */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 whitespace-nowrap">
                          {category}
                        </span>
                      </td>

                      {/* Số câu */}
                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-slate-700">{questionCount}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">câu hỏi</div>
                      </td>

                      {/* Thời gian */}
                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-slate-700">{timeLimit}</div>
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">phút</div>
                      </td>

                      {/* Mật khẩu (Click to copy) */}
                      <td className="py-4 px-4">
                        {password ? (
                          <button
                            onClick={() => handleCopy(password, 'mật khẩu', `pass_${q.id}`)}
                            title="Bấm để sao chép mật khẩu"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 active:scale-95 transition-all group/btn shadow-2xs"
                          >
                            <Key size={13} className="text-amber-600" />
                            <span>{password}</span>
                            {isPassCopied ? (
                              <Check size={13} className="text-emerald-600" />
                            ) : (
                              <Copy size={13} className="opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                            )}
                          </button>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-[11px] font-semibold text-slate-400 bg-slate-100">
                            Công khai
                          </span>
                        )}
                      </td>

                      {/* Link làm bài */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(quizUrl, 'link làm bài', `link_${q.id}`)}
                            title="Sao chép link làm bài"
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
                              isLinkCopied
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 border-slate-200'
                            }`}
                          >
                            {isLinkCopied ? <Check size={13} /> : <Copy size={13} />}
                            <span>{isLinkCopied ? 'Đã copy link' : 'Copy link'}</span>
                          </button>

                          <a
                            href={quizUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Mở đề thi trong tab mới"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <ExternalLink size={16} />
                          </a>
                        </div>
                      </td>

                      {/* Người tạo */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                          <Users size={12} className="text-slate-400" />
                          <span>{q.author?.username || 'Admin'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {new Date(q.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Lock Button */}
                          <button
                            onClick={() => handleToggleActive(q)}
                            title={isActive ? 'Khóa bài thi' : 'Mở khóa bài thi'}
                            className={`p-2 rounded-xl text-xs font-bold transition-colors ${
                              isActive
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {isActive ? <Lock size={15} /> : <Unlock size={15} />}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteQuiz(q)}
                            title="Xóa đề thi"
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

      </div>

    </div>
  )
}
