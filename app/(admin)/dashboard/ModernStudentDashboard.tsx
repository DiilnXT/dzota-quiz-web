'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  Sparkles,
  Award,
  BarChart3,
  Clock,
  ArrowRight,
  Flame,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Brain,
  ExternalLink,
  Target,
  Zap,
  TrendingUp,
  Sun,
  Sunset,
  Moon,
  Bell,
  Key,
  RefreshCw
} from 'lucide-react'

export interface ModernStudentDashboardProps {
  history: any[]
  session: {
    id?: string
    username?: string
    role?: string
    email?: string
    name?: string
    avatar?: string
  }
  unreadCount?: number
  isLoading?: boolean
  onOpenNotif?: () => void
  onRefresh?: () => void
  onOpenChangePass?: () => void
  onSwitchTab: (tab: string) => void
  formatTimeAgo: (date: string | Date) => string
}

export default function ModernStudentDashboard({
  history = [],
  session,
  unreadCount = 0,
  isLoading = false,
  onOpenNotif,
  onRefresh,
  onOpenChangePass,
  onSwitchTab,
  formatTimeAgo
}: ModernStudentDashboardProps) {
  const [filterScore, setFilterScore] = useState<'all' | 'high' | 'low'>('all')

  const safeHistory = Array.isArray(history) ? history : []
  const totalTests = safeHistory.length
  const avgScore = totalTests > 0
    ? (safeHistory.reduce((acc, cur) => acc + (cur.score || 0), 0) / totalTests).toFixed(1)
    : '0.0'
  const highestScore = totalTests > 0
    ? Math.max(...safeHistory.map(h => h.score || 0)).toFixed(1)
    : '0.0'
  
  const totalCorrect = safeHistory.reduce((acc, cur) => acc + (cur.correctCount || 0), 0)
  const totalAnswered = safeHistory.reduce((acc, cur) => acc + (cur.totalCount || 0), 0)
  const accuracyRate = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0

  // Filter history
  const filteredHistory = safeHistory.filter(item => {
    if (filterScore === 'high') return (item.score || 0) >= 8
    if (filterScore === 'low') return (item.score || 0) < 5
    return true
  })

  // Greeting
  const hour = new Date().getHours()
  const greetingText = hour < 12 ? 'Chào buổi sáng bạn học' : hour < 18 ? 'Chào buổi chiều học tốt' : 'Chào buổi tối ôn thi'

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* ─── 0. TOP USER PROFILE & ACTION BAR ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B0F19]/90 backdrop-blur-xl border border-slate-800/80 p-4 sm:px-6 sm:py-3.5 rounded-3xl shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 p-0.5 shadow-md shadow-amber-500/20 shrink-0">
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
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Học Viên Y Khoa
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate max-w-xs">{session.email || 'Học viên trực tuyến'}</p>
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

      {/* ─── 1. STUDENT HERO INTELLIGENCE BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0B0F19] via-[#0F172A] to-[#1E1B4B] border border-indigo-500/30 p-6 sm:p-8 lg:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{greetingText}, {session.name || session.username}!</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-300 border border-rose-500/30">
                <Flame className="w-3.5 h-3.5 text-rose-400 fill-current animate-pulse" />
                <span>Chuỗi Học Tập: Đang Tích Cực 🔥</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug">
              Không Gian Ôn Luyện & Đánh Giá Năng Lực
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Theo dõi kết quả làm bài thi trắc nghiệm, phân tích tỷ lệ câu đúng và ôn tập sơ đồ giải phẫu Y khoa chạy trạm DYNEX.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <button
                onClick={() => onSwitchTab('study')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Vào Đề Thi Được Cấp Phép</span>
              </button>

              <Link
                href="/dynex"
                target="_blank"
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 no-underline cursor-pointer"
              >
                <Brain className="w-4 h-4 text-cyan-200" />
                <span>Học Giải Phẫu DYNEX</span>
                <ExternalLink className="w-3.5 h-3.5 text-rose-200" />
              </Link>

              <button
                onClick={() => onSwitchTab('mistakes')}
                className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-bold text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Sổ Tay Câu Sai</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Circle */}
          <div className="bg-[#070b14]/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Hiệu Suất 3 Ngày Gần Nhất
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {accuracyRate}% Chính Xác
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Điểm Trung Bình</span>
                <div className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono mt-0.5">
                  {avgScore}
                  <span className="text-xs text-slate-400 font-normal">/10</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Điểm Cao Nhất</span>
                <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-0.5">
                  {highestScore}
                  <span className="text-xs text-slate-400 font-normal">/10</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. BENTO METRICS FOR STUDENTS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div className="rounded-3xl bg-[#111827] border border-slate-800 p-5 sm:p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Đề thi đã hoàn thành</p>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-0.5">{totalTests} bài</p>
          </div>
        </div>

        <div className="rounded-3xl bg-[#111827] border border-slate-800 p-5 sm:p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Số câu trả lời đúng</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-0.5">{totalCorrect}/{totalAnswered}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-[#111827] border border-slate-800 p-5 sm:p-6 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Độ chính xác tổng quan</p>
            <p className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono mt-0.5">{accuracyRate}%</p>
          </div>
        </div>
      </div>

      {/* ─── 3. DETAILED TEST HISTORY TABLE ─── */}
      <div className="rounded-3xl bg-[#111827] border border-slate-800 p-6 sm:p-7 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              <span>Lịch Sử Bài Thi Gần Đây</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono font-bold">
                Lưu trong 3 ngày
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống tự động dọn dẹp dữ liệu cũ sau 3 ngày để tối ưu dung lượng và bộ nhớ máy chủ.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setFilterScore('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterScore === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tất cả ({totalTests})
            </button>
            <button
              onClick={() => setFilterScore('high')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterScore === 'high' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Điểm giỏi (&gt;= 8.0)
            </button>
            <button
              onClick={() => setFilterScore('low')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterScore === 'low' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Cần ôn lại (&lt; 5.0)
            </button>
          </div>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center bg-[#070b14] border border-slate-800/80 rounded-2xl space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
              <FileText className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white">Chưa có bài thi nào được ghi nhận</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Hãy chọn một đề thi trong góc học tập và bắt đầu làm bài để ghi nhận điểm số!
            </p>
            <div className="pt-2">
              <button
                onClick={() => onSwitchTab('study')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>Xem Đề Thi Được Giao</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[#070b14] text-slate-400 font-black uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tên Bài Thi</th>
                  <th className="py-3 px-3 text-center">Điểm Số</th>
                  <th className="py-3 px-3 text-center">Số Câu Đúng</th>
                  <th className="py-3 px-3 text-center">Thời Gian Làm</th>
                  <th className="py-3 px-3 text-right">Thời Điểm Nộp</th>
                  <th className="py-3 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-[#070b14]/50">
                {filteredHistory.map(item => {
                  const scoreColor = item.score >= 8
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40'
                    : item.score >= 5
                    ? 'text-amber-400 bg-amber-950/60 border-amber-500/40'
                    : 'text-rose-400 bg-rose-950/60 border-rose-500/40'

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-white max-w-xs truncate">
                        <a
                          href={`/?id=${item.quizId}`}
                          className="text-white hover:text-indigo-400 no-underline"
                        >
                          {item.quizTitle}
                        </a>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-black font-mono text-xs border ${scoreColor}`}>
                          {item.score.toFixed(1)} / 10
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-200">
                        {item.correctCount} / {item.totalCount}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {Math.floor(item.timeSpent / 60)}p {item.timeSpent % 60}s
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400 text-xs">
                        {formatTimeAgo(item.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={`/?id=${item.quizId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer no-underline"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Làm Lại</span>
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
  )
}
