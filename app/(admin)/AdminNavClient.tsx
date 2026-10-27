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
  GraduationCap,
  Clock,
  Plus,
  Activity
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
    ? 'Quản trị viên'
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
  const isNotebookNDActive = pathname.startsWith('/notebook') || (isDashboardActive && activeTab === 'notebook_nd')
  const isDynexActive = pathname.startsWith('/dynex') || (isDashboardActive && activeTab === 'dynex')

  // Helper cho style nav item
  const getNavItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left cursor-pointer ${
      isActive
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 dark:bg-indigo-600 dark:text-white'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
    }`

  return (
    <>
      {/* ─── 1. MOBILE TOP NAVIGATION HEADER ─── */}
      <header className="md:hidden bg-white/90 dark:bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/80 px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 shadow-2xs transition-colors">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Mở Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <button
            onClick={() => handleNavigateTab(isStudent ? 'study' : 'dashboard')}
            className="flex items-center gap-2 text-left cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shadow-2xs border border-slate-200/80 dark:border-slate-700/80">
              <img src="/logo-dzota.png" alt="Dzota Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
                {isStudent ? 'Dzota Học Tập' : 'Dzota Admin'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block leading-tight">
                {roleName}
              </span>
            </div>
          </button>
        </div>

        {/* Right tools (Theme switch, create, avatar) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
          </button>

          {!isStudent && (
            <Link
              href="/creator"
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
            >
              <Plus size={13} />
              <span>Tạo đề</span>
            </Link>
          )}

          <div className="w-7 h-7 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* ─── 2. MOBILE DRAWER OVERLAY ─── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-50 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ─── 3. SIDEBAR (DESKTOP FIXED + MOBILE SLIDE-OVER) ─── */}
      <aside
        className={`w-68 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-5 border-b border-slate-100 dark:border-slate-800/80 shrink-0">
          <button
            onClick={() => handleNavigateTab(isStudent ? 'study' : 'dashboard')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center shadow-xs border border-slate-200/70 dark:border-slate-700/70 group-hover:scale-105 transition-transform">
              <img src="/logo-dzota.png" alt="Dzota Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">
                  Dzota Quiz
                </span>
                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/60 uppercase">
                  {roleName}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium block leading-tight mt-0.5">
                {isStudent ? 'Góc Rèn Luyện Học Sinh' : 'Hệ Thống Quản Trị Đề Thi'}
              </span>
            </div>
          </button>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-5 px-3.5 space-y-5 custom-scrollbar">
          {/* Section 1: HỌC TẬP HOẶC TỔNG QUAN */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              {isStudent ? 'Góc học tập' : 'Tổng quan'}
            </h3>
            <div className="space-y-1">
              {isStudent ? (
                <>
                  <button
                    onClick={() => handleNavigateTab('study')}
                    className={getNavItemClass(isStudyActive)}
                  >
                    <GraduationCap size={17} />
                    <span>Học tập & Đề thi</span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('mistakes')}
                    className={getNavItemClass(isMistakesActive)}
                  >
                    <Sparkles size={17} />
                    <span>Sổ tay lỗi sai</span>
                  </button>

                  <Link
                    href="/notebook"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left cursor-pointer ${
                      isNotebookNDActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={17} />
                      <span>NoteBook ND</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      isNotebookNDActive ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                    }`}>
                      AI LM
                    </span>
                  </Link>

                  <button
                    onClick={() => handleNavigateTab('dynex')}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left cursor-pointer ${
                      isDynexActive
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Activity size={17} className={isDynexActive ? 'text-white' : 'text-emerald-500'} />
                      <div>
                        <span className="block leading-tight">Giải Phẫu Y Khoa (DYNEX)</span>
                        <span className="block text-[10px] opacity-75 font-normal">Bản quyền: Nhật Duy</span>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                      isDynexActive ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      OSCE
                    </span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('history')}
                    className={getNavItemClass(isHistoryActive)}
                  >
                    <Clock size={17} />
                    <span>Lịch sử làm bài</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNavigateTab('dashboard')}
                    className={getNavItemClass(isDashboardItemActive)}
                  >
                    <LayoutDashboard size={17} />
                    <span>Bảng điều khiển</span>
                  </button>

                  <button
                    onClick={() => handleNavigateTab('mistakes')}
                    className={getNavItemClass(isMistakesActive)}
                  >
                    <Sparkles size={17} />
                    <span>Sổ tay lỗi sai AI</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Section 2: QUẢN LÝ HỆ THỐNG (GIÁO VIÊN & ADMIN) */}
          {!isStudent && (
            <div>
              <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Quản lý hệ thống
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => handleNavigateTab('quizzes')}
                  className={getNavItemClass(isQuizzesActive)}
                >
                  <FileText size={17} />
                  <span>{isTeacher ? 'Đề thi của tôi' : 'Quản lý Bài test'}</span>
                </button>

                <button
                  onClick={() => handleNavigateTab('classes')}
                  className={getNavItemClass(isClassesActive)}
                >
                  <School size={17} />
                  <span>Lớp học & Học sinh</span>
                </button>

                <button
                  onClick={() => handleNavigateTab('friends')}
                  className={getNavItemClass(isFriendsActive)}
                >
                  <MessageCircle size={17} />
                  <span>Kết Bạn & Chat GV</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleNavigateTab('teachers')}
                    className={getNavItemClass(isTeachersActive)}
                  >
                    <Shield size={17} />
                    <span>Người dùng & Phân quyền</span>
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => handleNavigateTab('settings')}
                    className={getNavItemClass(isSettingsActive)}
                  >
                    <Settings size={17} />
                    <span>Cài đặt Web & AI</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Section 3: CÔNG CỤ GIÁO DỤC (GIÁO VIÊN & ADMIN) */}
          {!isStudent && (
            <div>
              <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                Công cụ đề thi
              </h3>
              <div className="space-y-1">
                <Link
                  href="/creator"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isCreatorActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sparkles size={17} className={isCreatorActive ? 'text-white' : 'text-indigo-500'} />
                    <span>Tạo Đề Mới (AI)</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                    isCreatorActive ? 'bg-white/20 text-white' : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                  }`}>
                    Pro
                  </span>
                </Link>

                <Link
                  href="/notebook"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left cursor-pointer ${
                    isNotebookNDActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={17} className={isNotebookNDActive ? 'text-white' : 'text-indigo-500'} />
                    <span>NoteBook ND</span>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isNotebookNDActive ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    AI LM
                  </span>
                </Link>

                <button
                  onClick={() => handleNavigateTab('dynex')}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 text-left cursor-pointer ${
                    isDynexActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Activity size={17} className={isDynexActive ? 'text-white' : 'text-emerald-500'} />
                    <div>
                      <span className="block leading-tight">Giải Phẫu Y Khoa (DYNEX)</span>
                      <span className="block text-[10px] opacity-75 font-normal">Bản quyền: Nhật Duy</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-extrabold ${
                    isDynexActive ? 'bg-white/20 text-white' : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    Studio
                  </span>
                </button>

                <Link
                  href="/creator?view=bank"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-all text-left cursor-pointer"
                >
                  <BookOpen size={17} className="text-slate-400 dark:text-slate-500" />
                  <span>Ngân hàng câu hỏi</span>
                </Link>
              </div>
            </div>
          )}

          {/* Section 4: TÀI KHOẢN */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
              Cá nhân
            </h3>
            <div className="space-y-1">
              <button
                onClick={() => handleNavigateTab('profile')}
                className={getNavItemClass(isProfileActive)}
              >
                <UserIcon size={17} />
                <span>Hồ sơ & Zalo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Info, Theme Switch & Logout */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/70 transition-colors shrink-0 space-y-2.5">
          {/* User profile row with theme toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-800 dark:text-slate-100 text-xs truncate leading-tight">{username}</div>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">{roleName}</div>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors cursor-pointer shrink-0"
              title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
            >
              {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} />}
            </button>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 rounded-lg transition-all cursor-pointer"
            >
              <LogOut size={13} />
              <span>Đăng xuất</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ─── 4. MOBILE BOTTOM NAVIGATION DOCK (SIÊU TIỆN LỢI TRÊN ĐIỆN THOẠI) ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-[#0F172A]/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800/80 z-40 px-2 py-1 flex items-center justify-around shadow-lg shadow-slate-950/10">
        {isStudent ? (
          <>
            <button
              onClick={() => handleNavigateTab('study')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isStudyActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <GraduationCap size={19} />
              <span className="text-[10px] mt-0.5">Học tập</span>
            </button>

            <button
              onClick={() => handleNavigateTab('mistakes')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isMistakesActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <Sparkles size={19} />
              <span className="text-[10px] mt-0.5">Lỗi sai</span>
            </button>

            <Link
              href="/notebook"
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isNotebookNDActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <BookOpen size={19} />
              <span className="text-[10px] mt-0.5">NoteBook</span>
            </Link>

            <button
              onClick={() => handleNavigateTab('history')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isHistoryActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <Clock size={19} />
              <span className="text-[10px] mt-0.5">Lịch sử</span>
            </button>

            <button
              onClick={() => handleNavigateTab('profile')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isProfileActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <UserIcon size={19} />
              <span className="text-[10px] mt-0.5">Cá nhân</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => handleNavigateTab('dashboard')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isDashboardItemActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <LayoutDashboard size={19} />
              <span className="text-[10px] mt-0.5">Tổng quan</span>
            </button>

            <button
              onClick={() => handleNavigateTab('quizzes')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isQuizzesActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <FileText size={19} />
              <span className="text-[10px] mt-0.5">Đề thi</span>
            </button>

            <button
              onClick={() => handleNavigateTab('classes')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isClassesActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <School size={19} />
              <span className="text-[10px] mt-0.5">Lớp học</span>
            </button>

            <button
              onClick={() => handleNavigateTab('friends')}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                isFriendsActive
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600'
              }`}
            >
              <MessageCircle size={19} />
              <span className="text-[10px] mt-0.5">Chat GV</span>
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-slate-400 dark:text-slate-500 font-medium hover:text-slate-600 transition-all cursor-pointer"
            >
              <Menu size={19} />
              <span className="text-[10px] mt-0.5">Thêm</span>
            </button>
          </>
        )}
      </nav>

      {/* ─── 5. MODAL NGÂN HÀNG CÂU HỎI ─── */}
      {activeModal === 'bank' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
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
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300">
                Ngân hàng câu hỏi cho phép bạn import hàng trăm câu hỏi và tự động bốc ngẫu nhiên (random pick) theo từng lần thi!
              </div>
              <Link
                href="/creator?view=bank"
                onClick={() => setActiveModal(null)}
                className="block text-center py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition-colors"
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
