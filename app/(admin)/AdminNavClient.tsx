'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Sparkles,
  BookOpen,
  School,
  Shield,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  User as UserIcon,
  BarChart2,
  CheckCircle2,
  MessageCircle,
  GraduationCap
} from 'lucide-react'
import { useTheme } from '../ThemeContext'

interface AdminNavClientProps {
  session: {
    id?: string
    username?: string
    name?: string
    email?: string
    avatar?: string
    phone?: string
    role?: string
  }
}

type ModalType = 'bank' | null

export default function AdminNavClient({ session }: AdminNavClientProps) {
  const pathname = usePathname()
  const { theme, isDark, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)

  const isTestsActive = pathname.startsWith('/tests')
  const isDashboardActive = pathname === '/dashboard'
  const isCreatorActive = pathname.startsWith('/creator')

  const username = session.name || session.username || 'Người dùng'
  const email = session.email?.toLowerCase() || ''
  const isDuylni =
    session.username?.toLowerCase() === 'duylniedu' ||
    email === 'lenhatduy.vietnam@gmail.com'
  const role = session.role?.toUpperCase() || 'STUDENT'
  const isAdmin = isDuylni || role === 'ADMIN'
  const isStudent = !isAdmin && role === 'STUDENT'
  const isTeacher = !isAdmin && !isStudent

  const roleName = isAdmin
    ? 'Quản trị viên tối cao'
    : isTeacher
    ? 'Giáo viên'
    : 'Học sinh'

  // Tab điều hướng chính
  const [activeTab, setActiveTab] = useState<string>(isStudent ? 'study' : 'dashboard')

  useEffect(() => {
    const handleTabChange = (e: any) => {
      if (e.detail) setActiveTab(e.detail)
    }
    window.addEventListener('dzota_tab_change', handleTabChange)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      if (tab) {
        setActiveTab(tab)
      }
    }

    return () => {
      window.removeEventListener('dzota_tab_change', handleTabChange)
    }
  }, [isStudent])

  const handleNavigateTab = (tab: string) => {
    setMobileMenuOpen(false)
    setActiveTab(tab)
    if (pathname === '/dashboard') {
      window.history.pushState({}, '', `/dashboard?tab=${tab}`)
      window.dispatchEvent(new CustomEvent('dzota_tab_change', { detail: tab }))
    } else {
      window.location.href = `/dashboard?tab=${tab}`
    }
  }

  // Active status checks
  const isStudyActive = isDashboardActive && activeTab === 'study'
  const isMistakesActive = isDashboardActive && activeTab === 'mistakes'
  const isHistoryActive = isDashboardActive && activeTab === 'history'
  const isDashboardItemActive = isDashboardActive && (activeTab === 'dashboard' || activeTab === 'overview')
  const isQuizzesActive = isDashboardActive && activeTab === 'quizzes'
  const isClassesActive = isDashboardActive && activeTab === 'classes'
  const isTeachersActive = isDashboardActive && activeTab === 'teachers'
  const isFriendsActive = isDashboardActive && activeTab === 'friends'
  const isSettingsActive = isDashboardActive && activeTab === 'settings'
  const isProfileActive = isDashboardActive && activeTab === 'profile'

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Mở Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <button
            onClick={() => handleNavigateTab(isStudent ? 'history' : 'dashboard')}
            className="flex items-center gap-2.5 text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shadow-xs border border-slate-200/60 dark:border-slate-700/60">
              <img src="/logo-dzota.png" alt="Dzota Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight block leading-tight">
                {isStudent ? 'Dzota Học Tập' : 'Dzota Admin'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block leading-tight">
                {isStudent ? 'Cổng học sinh' : 'Quản lý thi trắc nghiệm'}
              </span>
            </div>
          </button>
        </div>

        {/* Right tools (Theme switch, create, avatar) */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          {!isStudent && (
            <Link
              href="/creator"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            >
              <Sparkles size={13} />
              <span>Tạo đề</span>
            </Link>
          )}

          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-800">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop Fixed + Mobile Slide-over) */}
      <aside
        className={`w-72 bg-white dark:bg-[#111827] border-r border-slate-200/90 dark:border-slate-800 flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800/80">
          <button
            onClick={() => handleNavigateTab(isStudent ? 'history' : 'dashboard')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <div className="w-11 h-11 rounded-2xl bg-white dark:bg-slate-800 p-1.5 flex items-center justify-center shadow-sm border border-slate-200/70 dark:border-slate-700/70 transform transition-transform group-hover:scale-105">
              <img src="/logo-dzota.png" alt="Dzota Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
                {isStudent ? 'Dzota Học Tập' : 'Dzota Admin'}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block leading-tight">
                {isStudent ? 'Cổng rèn luyện học sinh' : 'Hệ thống quản lý đề thi'}
              </span>
            </div>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Section 1: TỔNG QUAN / HỌC TẬP */}
          <div>
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              {isStudent ? 'Góc học tập' : 'Tổng quan'}
            </h3>
            <div className="space-y-1">
              {isStudent ? (
                <>
                  <button
                    onClick={() => handleNavigateTab('study')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                      isStudyActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <GraduationCap size={18} />
                    <span>Học tập & Đề thi</span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('mistakes')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                      isMistakesActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Sparkles size={18} />
                    <span>Sổ tay lỗi sai</span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('history')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                      isHistoryActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Lịch sử làm bài</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigateTab('dashboard')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                      isDashboardItemActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <LayoutDashboard size={18} />
                    <span>Bảng điều khiển</span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('mistakes')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                      isMistakesActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Sparkles size={18} />
                    <span>Sổ tay lỗi sai AI</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Section 2: QUẢN LÝ HỆ THỐNG (CHỈ DÀNH CHO GIÁO VIÊN & ADMIN) */}
          {!isStudent && (
            <div>
              <h3 className="px-3 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Quản lý hệ thống
              </h3>
              <div className="space-y-1">
                {/* Quản lý đề thi */}
                <button
                  onClick={() => handleNavigateTab('quizzes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    isQuizzesActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <FileText size={18} />
                  <span>{isTeacher ? 'Đề thi của tôi' : 'Quản lý Bài test'}</span>
                </button>

                {/* Quản lý Lớp học & Học sinh */}
                <button
                  onClick={() => handleNavigateTab('classes')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    isClassesActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <School size={18} />
                  <span>Lớp học & Học sinh</span>
                </button>

                {/* Kết Bạn & Chat Giáo Viên */}
                <button
                  onClick={() => handleNavigateTab('friends')}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                    isFriendsActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <MessageCircle size={18} />
                  <span>Kết Bạn & Chat Giáo Viên</span>
                </button>

                {/* Quản lý Người dùng & Phân quyền (Chỉ Admin) */}
                {isAdmin && (
                  <button
                    onClick={() => handleNavigateTab('teachers')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                      isTeachersActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Shield size={18} />
                    <span>Người dùng & Phân quyền</span>
                  </button>
                )}

                {/* Cài đặt Web & Hệ thống (Chỉ Admin) */}
                {isAdmin && (
                  <button
                    onClick={() => handleNavigateTab('settings')}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                      isSettingsActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <Settings size={18} />
                    <span>Cài đặt Web & AI</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 3: CÔNG CỤ GIÁO DỤC (CHỈ DÀNH CHO GIÁO VIÊN & ADMIN) */}
          {!isStudent && (
            <div>
              <h3 className="px-3 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Công cụ giáo dục
              </h3>
              <div className="space-y-1">
                <Link
                  href="/creator"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                    isCreatorActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles size={18} className={isCreatorActive ? 'text-white' : 'text-blue-500'} />
                    <span>Tạo Đề Mới (Bản Gốc)</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    isCreatorActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  }`}>
                    Mới
                  </span>
                </Link>

                <Link
                  href="/creator?view=bank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer"
                >
                  <BookOpen size={18} className="text-slate-400 dark:text-slate-500" />
                  <span>Ngân hàng câu hỏi</span>
                </Link>
              </div>
            </div>
          )}

          {/* Section 4: TÀI KHOẢN & LIÊN HỆ */}
          <div>
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Tài khoản
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigateTab('profile')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all text-left cursor-pointer ${
                  isProfileActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <UserIcon size={18} />
                <span>Cá nhân & Zalo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Info, Theme Switch & Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/60 transition-colors">
          {/* Light / Dark Mode Toggle Pill */}
          <div className="mb-3 flex items-center justify-between p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
              {isDark ? <Moon size={15} className="text-blue-400" /> : <Sun size={15} className="text-amber-500" />}
              <span>{isDark ? 'Giao diện Tối' : 'Giao diện Sáng'}</span>
            </span>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                isDark ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-3 shadow-2xs mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="font-extrabold text-slate-800 dark:text-slate-100 text-xs truncate">{username}</div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-400 truncate">{roleName}</div>
              </div>
            </div>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-100 dark:border-rose-900/50 rounded-xl transition-all cursor-pointer"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ─── MODAL NGÂN HÀNG CÂU HỎI ─── */}
      {activeModal === 'bank' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    Ngân Hàng Câu Hỏi Tự Động
                  </h3>
                  <p className="text-xs text-slate-400">Dzota Admin Control Center</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 text-sm text-slate-600 dark:text-slate-300 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
                Ngân hàng câu hỏi cho phép bạn import hàng trăm câu hỏi và tự động bốc ngẫu nhiên (random pick) theo từng lần thi!
              </div>
              <Link
                href="/creator?view=bank"
                onClick={() => setActiveModal(null)}
                className="block text-center py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                Mở Thư Viện Ngân Hàng Đề Thi →
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
