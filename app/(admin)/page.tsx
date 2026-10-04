import Link from 'next/link'
import { BookOpen, FileText, Plus, Settings, TrendingUp, Users, Activity } from 'lucide-react'
import prisma from '@/lib/prisma'

export default async function Dashboard() {
  const testsCount = await prisma.test.count()
  const subjectsCount = await prisma.subject.count()
  
  const recentTests = await prisma.test.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } }
  })

  return (
    <div className="pb-12">
      <main>
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Tổng Quan</h1>
          <p className="text-slate-500 mt-2 text-sm">Quản lý và theo dõi hệ thống ngân hàng câu hỏi của bạn.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <BookOpen size={28} />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Môn Học</p>
              <h2 className="text-3xl font-extrabold text-slate-800">{subjectsCount}</h2>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <FileText size={28} />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Bài Test</p>
              <h2 className="text-3xl font-extrabold text-slate-800">{testsCount}</h2>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center gap-6 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full blur-2xl group-hover:bg-orange-100 transition-colors"></div>
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Activity size={28} />
            </div>
            <div className="relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Lượt Làm Bài</p>
              <h2 className="text-3xl font-extrabold text-slate-800">--</h2>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800">Bài Test Gần Đây</h2>
              <p className="text-sm text-slate-500 mt-1">Các bài test vừa được tạo trên hệ thống.</p>
            </div>
            <a href="/v1.html" className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
              <Plus size={18} /> Tạo Đề Nhanh (V1)
            </a>
          </div>

          <div className="space-y-4">
            {recentTests.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Chưa có bài test nào</h3>
                <p className="text-slate-500 text-sm mt-2">Nhấn vào nút "Tạo bài test" để bắt đầu nhé!</p>
              </div>
            ) : (
              recentTests.map(test => (
                <div key={test.id} className="bg-slate-50 hover:bg-slate-100 p-5 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors group">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{test.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-slate-500 mt-1.5 font-medium">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${test.mode === 'exam' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                          {test.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}
                        </span>
                        <span>•</span>
                        <span>{test._count.questions} câu</span>
                        <span>•</span>
                        <span>{test.timeLimit} phút</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Link href={`/test/${test.id}`} target="_blank" className="bg-white text-indigo-600 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-50 border border-slate-200 shadow-sm transition-colors">
                      Xem Test
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
