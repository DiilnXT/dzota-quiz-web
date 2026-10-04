import Link from 'next/link'
import { LayoutDashboard, Library, FileText, Settings, User, Bell, Search, Sparkles } from 'lucide-react'
import React from 'react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200/60 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20">
        <div className="h-20 flex items-center px-8 border-b border-slate-100">
          <div className="font-extrabold text-2xl tracking-tight text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <Sparkles size={20} />
            </div>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">Dzota Quiz</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-8 px-5 flex flex-col gap-2 scrollbar-hide">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-3">Overview</div>
          
          <Link href="/" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all font-semibold group">
            <LayoutDashboard size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            Bảng Điều Khiển
          </Link>
          <Link href="/subjects" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all font-semibold group">
            <Library size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            Ngân Hàng Môn Học
          </Link>
          <Link href="/tests" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-50 text-slate-600 hover:text-indigo-600 transition-all font-semibold group">
            <FileText size={20} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
            Quản Lý Bài Test
          </Link>
          <a href="/v1.html" className="flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-indigo-50 text-indigo-600 font-semibold group mt-2">
            <Sparkles size={20} className="text-indigo-500" />
            Tạo Đề Nhanh (Bản Gốc)
          </a>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-slate-200/60 shadow-sm cursor-pointer hover:border-indigo-200 transition-colors">
            <div className="w-11 h-11 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-200/50">
              <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-800 truncate">Admin Workspace</div>
              <div className="text-xs text-slate-500 font-medium truncate">admin@dzota.vn</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center px-10 shrink-0 z-10 justify-between sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-96 hidden md:block">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Tìm kiếm nhanh bài test, môn học..." className="w-full pl-11 pr-4 py-2.5 bg-slate-100/50 border border-transparent rounded-full text-sm font-medium focus:outline-none focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
            </div>
          </div>
          <div className="flex items-center gap-5">
            <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
              <Bell size={22} />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            </button>
            <div className="w-px h-8 bg-slate-200"></div>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <Settings size={22} />
            </button>
          </div>
        </header>
        
        {/* Scrollable Area */}
        <div className="flex-1 overflow-auto p-10">
          <div className="max-w-[1200px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
