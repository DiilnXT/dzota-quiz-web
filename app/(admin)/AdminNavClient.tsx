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
  ChevronDown
} from 'lucide-react'

interface AdminNavClientProps {
  session: {
    id?: string
    username?: string
    role?: string
  }
}

export default function AdminNavClient({ session }: AdminNavClientProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isTestsActive = pathname.startsWith('/tests')
  const isDashboardActive = pathname === '/dashboard'
  const isCreatorActive = pathname.startsWith('/creator')
  const isSubjectsActive = pathname.startsWith('/subjects')

  const username = session.username || 'DuylniEdu'
  const isDuylni = username.toLowerCase() === 'duylniedu'
  const roleName = isDuylni || session.role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Giáo viên'

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
            aria-label="Mở Menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-sm font-black text-slate-800 tracking-tight block leading-tight">Dzota Admin</span>
              <span className="text-[10px] text-slate-400 font-medium block leading-tight">Hệ thống quản lý đề thi</span>
            </div>
          </Link>
        </div>

        {/* Right user avatar & mobile new quiz button */}
        <div className="flex items-center gap-2">
          <Link
            href="/creator"
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center gap-1 shadow-xs active:scale-95 transition-all"
          >
            <Sparkles size={13} />
            <span>Tạo đề</span>
          </Link>
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop Fixed + Mobile Slide-over) */}
      <aside
        className={`w-72 bg-white border-r border-slate-200/90 flex flex-col fixed inset-y-0 left-0 z-50 transition-transform duration-300 md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header Brand */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-100">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 transform transition-transform group-hover:scale-105">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-tight">Dzota Admin</span>
              <span className="text-xs text-slate-400 font-semibold block leading-tight">Hệ thống quản lý đề thi</span>
            </div>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
          {/* Section 1: TỔNG QUAN */}
          <div>
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Tổng quan
            </h3>
            <div className="space-y-1">
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isDashboardActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/dashboard#stats"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all"
              >
                <BarChart2 size={18} />
                <span>Thống kê</span>
              </Link>
            </div>
          </div>

          {/* Section 2: QUẢN LÝ HỆ THỐNG */}
          <div>
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Quản lý hệ thống
            </h3>
            <div className="space-y-1">
              <Link
                href="/tests"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all relative ${
                  isTestsActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className={isTestsActive ? 'text-blue-600' : 'text-slate-500'} />
                  <span>Quản lý Bài test</span>
                </div>
                {isTestsActive && (
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                )}
              </Link>

              <div
                title="Tính năng đang cập nhật"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <Users size={18} className="text-slate-400" />
                <span>Quản lý Giáo viên</span>
              </div>

              <div
                title="Tính năng đang cập nhật"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <User size={18} className="text-slate-400" />
                <span>Người dùng</span>
              </div>

              <div
                title="Tính năng đang cập nhật"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <Clock size={18} className="text-slate-400" />
                <span>Nhật ký hoạt động</span>
              </div>

              <div
                title="Tính năng đang cập nhật"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <Settings size={18} className="text-slate-400" />
                <span>Cài đặt hệ thống</span>
              </div>
            </div>
          </div>

          {/* Section 3: CÔNG CỤ GIÁO DỤC */}
          <div>
            <h3 className="px-3 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              Công cụ giáo dục
            </h3>
            <div className="space-y-1">
              <Link
                href="/creator"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-bold text-sm transition-all ${
                  isCreatorActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-700 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FileText size={18} className="text-blue-500" />
                  <span>Tạo Đề Mới (Bản Gốc)</span>
                </div>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                  Mới
                </span>
              </Link>

              <div
                title="Tính năng đang cập nhật"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <BookOpen size={18} className="text-slate-400" />
                <span>Ngân hàng câu hỏi</span>
              </div>

              <Link
                href="/subjects"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  isSubjectsActive
                    ? 'bg-blue-50 text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                }`}
              >
                <Folder size={18} />
                <span>Quản lý môn học</span>
              </Link>

              <div
                title="Tính năng đang cập nhật"
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm text-slate-400 hover:bg-slate-50 cursor-pointer transition-all"
              >
                <Tag size={18} className="text-slate-400" />
                <span>Thẻ & Danh mục</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-sm flex-shrink-0">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="font-extrabold text-slate-800 text-sm truncate">{username}</div>
                <div className="text-[11px] font-medium text-slate-400 truncate">{roleName}</div>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <Settings size={16} />
            </button>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100/80 border border-rose-100 rounded-xl transition-all"
            >
              <LogOut size={14} />
              <span>Đăng xuất</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  )
}
