import React from 'react'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Users, FileText, Settings, LogOut, ChevronRight, Sparkles } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  
  if (!sessionStr) {
    redirect('/login')
  }

  let session
  try {
    session = JSON.parse(sessionStr)
  } catch (e) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans">
      
      {/* Mobile Top Navigation Header */}
      <header className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
            <Sparkles size={16} />
          </div>
          <span className="text-base font-black text-slate-800 tracking-tight">Dzota Admin</span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Link 
            href="/dashboard" 
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1 transition-colors"
            title="Tổng quan"
          >
            <LayoutDashboard size={16} />
            <span className="hidden xs:inline">Tổng quan</span>
          </Link>
          <Link 
            href="/tests" 
            className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1 transition-colors"
            title="Quản lý bài test"
          >
            <FileText size={16} />
            <span className="hidden xs:inline">Bài test</span>
          </Link>
          <Link 
            href="/creator" 
            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
            title="Tạo đề thi mới"
          >
            <Sparkles size={14} />
            <span>Tạo đề</span>
          </Link>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-screen z-20 transition-all duration-300">
        {/* Logo */}
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 transform transition-transform hover:scale-105">
            <Sparkles size={20} className="animate-pulse" />
          </div>
          <span className="ml-3 text-xl font-black text-slate-800 tracking-tight">Dzota Admin</span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-8 px-5 space-y-8">
          
          <div>
            <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quản trị hệ thống</h3>
            <div className="space-y-1.5">
              <Link href="/dashboard" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group font-semibold text-sm">
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} className="group-hover:text-indigo-600 transition-colors" />
                  <span>Tổng quan</span>
                </div>
              </Link>

              <Link href="/tests" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group font-semibold text-sm">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="group-hover:text-indigo-600 transition-colors" />
                  <span>Quản lý Bài test</span>
                </div>
              </Link>
              
              <Link href="#" title="Tính năng đang phát triển" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all group font-semibold text-sm cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                  <span>Quản lý Giáo viên</span>
                </div>
              </Link>
            </div>
          </div>

          <div>
             <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Công cụ giáo dục</h3>
             <div className="space-y-1.5">
                <Link href="/creator" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/80 transition-all group font-semibold text-sm">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                    <span>Tạo Đề Mới (Bản Gốc)</span>
                  </div>
                  <div className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Mới</div>
                </Link>
             </div>
          </div>

        </div>

        {/* User Info & Logout */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold shadow-inner">
                {session.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-slate-800 text-sm truncate">{session.username}</div>
                <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu' ? 'Quản trị viên' : 'Giáo viên'}</div>
              </div>
            </div>
          </div>
          
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 hover:border-rose-200 rounded-xl transition-all">
              <LogOut size={16} /> Đăng xuất
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-4 sm:p-6 md:p-10 md:h-screen md:overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
