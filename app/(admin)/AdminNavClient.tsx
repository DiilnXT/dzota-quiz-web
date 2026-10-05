'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  BarChart2,
  FileText,
  Users,
  User,
  Clock,
  Settings,
  Sparkles,
  BookOpen,
  Folder,
  Tag,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Sun,
  Moon,
  Plus,
  Shield,
  Key,
  Database,
  Download,
  Upload,
  Check,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { useTheme } from '../ThemeContext'

interface AdminNavClientProps {
  session: {
    id?: string
    username?: string
    role?: string
  }
}

type ModalType = 'logs' | 'bank' | null

export default function AdminNavClient({ session }: AdminNavClientProps) {
  const pathname = usePathname()
  const { theme, isDark, toggleTheme } = useTheme()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<ModalType>(null)
  const [modalFeedback, setModalFeedback] = useState<string | null>(null)

  const isTestsActive = pathname.startsWith('/tests')
  const isDashboardActive = pathname === '/dashboard'
  const isCreatorActive = pathname.startsWith('/creator')
  const isSubjectsActive = pathname.startsWith('/subjects')

  const username = session.username || 'DuylniEdu'
  const isDuylni = username.toLowerCase() === 'duylniedu'
  const roleName = isDuylni || session.role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Giáo viên'

  const showFeedback = (msg: string) => {
    setModalFeedback(msg)
    setTimeout(() => setModalFeedback(null), 3000)
  }

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs transition-colors">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Mở Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight block leading-tight">Dzota Admin</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium block leading-tight">Hệ thống quản lý đề thi</span>
            </div>
          </Link>
        </div>

        {/* Right tools (Theme switch, create, avatar) */}
        <div className="flex items-center gap-2">
          {/* Theme switch button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {isDark ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
          </button>

          <Link
            href="/creator"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
          >
            <Sparkles size={13} />
            <span>Tạo đề</span>
          </Link>
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
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transform transition-transform group-hover:scale-105">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight block leading-tight">Dzota Admin</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-semibold block leading-tight">Hệ thống quản lý đề thi</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Section 1: TỔNG QUAN */}
          <div>
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Tổng quan
            </h3>
            <div className="space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isDashboardActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>

          {/* Section 2: QUẢN LÝ HỆ THỐNG */}
          <div>
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Quản lý hệ thống
            </h3>
            <div className="space-y-1">
              <Link
                href="/tests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all relative ${
                  isTestsActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className={isTestsActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'} />
                  <span>Quản lý Bài test</span>
                </div>
                {isTestsActive && (
                  <div className="w-1.5 h-6 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </Link>

              <button
                onClick={() => { setActiveModal('logs'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left"
              >
                <Clock size={18} className="text-slate-400 dark:text-slate-500" />
                <span>Nhật ký hoạt động</span>
              </button>
            </div>
          </div>

          {/* Section 3: CÔNG CỤ GIÁO DỤC */}
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
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-blue-500" />
                  <span>Tạo Đề Mới (Bản Gốc)</span>
                </div>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                  Mới
                </span>
              </Link>

              <button
                onClick={() => { setActiveModal('bank'); setMobileMenuOpen(false); }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-left"
              >
                <BookOpen size={18} className="text-slate-400 dark:text-slate-500" />
                <span>Ngân hàng câu hỏi</span>
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
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
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
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-100 dark:border-rose-900/50 rounded-xl transition-all"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </form>
        </div>
      </aside>

      {/* ─── MODALS FOR ALL FEATURE MENUS ─── */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  {activeModal === 'logs' && <Clock size={18} />}
                  {activeModal === 'bank' && <BookOpen size={18} />}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    {activeModal === 'logs' && 'Nhật Ký Hoạt Động (Audit Log)'}
                    {activeModal === 'bank' && 'Ngân Hàng Câu Hỏi Tự Động'}
                  </h3>
                  <p className="text-xs text-slate-400">Dzota Admin Control Center</p>
                </div>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Feedback banner */}
            {modalFeedback && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{modalFeedback}</span>
              </div>
            )}

            {/* Modal Content */}
            <div className="py-4 text-sm text-slate-600 dark:text-slate-300 space-y-4">
              {/* NHẬT KÝ HOẠT ĐỘNG */}
              {activeModal === 'logs' && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[
                    { action: 'Đổi giao diện Sáng / Tối', user: username, time: 'Vừa xong' },
                    { action: 'Mở đề thi: Vi Sinh Câu 101-159', user: 'DuylniEdu', time: '10 phút trước' },
                    { action: 'Tạo đề mới từ Word (50 câu)', user: 'DuylniEdu', time: '1 giờ trước' },
                    { action: 'Đăng nhập vào hệ thống', user: username, time: 'Hôm nay' },
                  ].map((log, i) => (
                    <div key={i} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{log.action}</div>
                        <div className="text-[11px] text-slate-400">Bởi {log.user}</div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* NGÂN HÀNG CÂU HỎI */}
              {activeModal === 'bank' && (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-900 text-xs text-blue-700 dark:text-blue-300">
                    Ngân hàng câu hỏi cho phép bạn import hàng trăm câu hỏi và tự động bốc ngẫu nhiên (random pick) theo từng lần thi!
                  </div>
                  <Link
                    href="/creator"
                    onClick={() => setActiveModal(null)}
                    className="block text-center py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Mở Trình Soạn Thảo & Tạo Ngân Hàng Đề Mới →
                  </Link>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-colors"
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
