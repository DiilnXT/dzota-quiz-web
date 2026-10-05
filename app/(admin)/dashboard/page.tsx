import React from 'react'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Users, FileText, Activity, TrendingUp, Settings, ChevronRight, Download } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
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

  if (session.role?.toLowerCase() !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="bg-red-50 text-red-500 px-6 py-4 rounded-xl font-bold shadow-sm border border-red-100">
          Truy cập bị từ chối. Bạn không có quyền Admin.
        </div>
      </div>
    )
  }

  // Fetch data
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      maxTests: true,
      password: true,
      _count: {
        select: { quizzes: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const quizzes = await prisma.quickQuiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { username: true }
      }
    }
  })

  // Stats calculations
  const totalUsers = users.length
  const totalQuizzes = quizzes.length
  const activeTeachers = users.filter(u => u._count.quizzes > 0).length

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-slate-500 mt-2 font-medium">Theo dõi và quản lý dữ liệu Dzota Quiz Platform</p>
        </div>
        <div className="flex gap-3">
           <button className="bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
             <Download size={16} /> Xuất Báo Cáo
           </button>
           <button className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-300 transition-all flex items-center gap-2">
             <Settings size={16} /> Cài Đặt
           </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Users size={24} />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">{totalUsers}</div>
            <div className="text-sm font-semibold text-slate-500">Tổng Giáo Viên</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">{totalQuizzes}</div>
            <div className="text-sm font-semibold text-slate-500">Đề Thi Đã Tạo</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Activity size={24} />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">{activeTeachers}</div>
            <div className="text-sm font-semibold text-slate-500">Giáo Viên Đang Hoạt Động</div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out"></div>
          <div className="relative">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-4">
              <TrendingUp size={24} />
            </div>
            <div className="text-3xl font-black text-slate-800 mb-1">{(totalQuizzes / (totalUsers || 1)).toFixed(1)}</div>
            <div className="text-sm font-semibold text-slate-500">Trung bình đề/GV</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users Table */}
        <div className="lg:col-span-2 bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-white z-10">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
              Danh Sách Giáo Viên
            </h2>
            <button title="Tính năng đang phát triển" className="text-sm font-bold text-indigo-400 bg-indigo-50/50 px-4 py-2 rounded-xl cursor-not-allowed">
              + Thêm Tài Khoản
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-50/30">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-100">Tài khoản</th>
                  <th className="p-4 font-bold border-b border-slate-100">Quyền</th>
                  <th className="p-4 font-bold border-b border-slate-100">Đã Tạo</th>
                  <th className="p-4 font-bold border-b border-slate-100">Giới hạn</th>
                  <th className="p-4 font-bold border-b border-slate-100 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{u.username}</div>
                      <div className="text-xs text-slate-400 font-medium">ID: {u.id.substring(0,8)}...</div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold \${
                        u.role?.toLowerCase() === 'admin' ? 'bg-rose-100 text-rose-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {u.role?.toLowerCase() === 'admin' ? 'Quản trị viên' : 'Giáo viên'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{u._count.quizzes} đề</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-700">{u.maxTests} đề</div>
                    </td>
                    <td className="p-4 text-right">
                      <button title="Tính năng đang phát triển" className="text-slate-300 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-end w-full gap-1 cursor-not-allowed">
                        Sửa <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="bg-white border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 bg-white z-10">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              Đề Thi Mới Nhất
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 max-h-[500px]">
            {quizzes.slice(0, 10).map(q => (
              <Link href={`/test/${q.id}`} key={q.id} target="_blank" className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-colors cursor-pointer group block">
                <h3 className="font-bold text-slate-800 text-sm mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">{q.title}</h3>
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                  <span className="flex items-center gap-1.5"><Users size={12}/> {q.author?.username || 'Ẩn danh'}</span>
                  <span>{new Date(q.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="p-4 border-t border-slate-50 bg-white text-center">
            <Link href="/tests" className="text-sm font-bold text-emerald-600 hover:text-emerald-700">
              Xem toàn bộ đề thi &rarr;
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}
