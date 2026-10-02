import Link from 'next/link'
import { BookOpen, FileText, Plus, Settings } from 'lucide-react'
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
    <div className="min-h-screen pb-12 bg-[#F2F2F7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <h1 className="text-xl font-bold text-black tracking-tight">Trang Chủ Quản Trị</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Link href="/subjects" className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group flex items-center gap-6">
            <div className="w-16 h-16 bg-blue-50 text-[#007AFF] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <BookOpen size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Ngân Hàng Môn Học</h2>
              <p className="text-slate-500 mt-1">{subjectsCount} môn học hiện có</p>
            </div>
          </Link>

          <Link href="/tests" className="bg-white p-6 rounded-3xl shadow-sm hover:shadow-md transition-shadow group flex items-center gap-6">
            <div className="w-16 h-16 bg-green-50 text-[#34C759] rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
              <FileText size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Quản Lý Bài Test</h2>
              <p className="text-slate-500 mt-1">{testsCount} bài test hiện có</p>
            </div>
          </Link>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800">Bài Test Gần Đây</h2>
          <Link href="/tests/create" className="bg-[#007AFF] text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-blue-600 transition-colors">
            <Plus size={18} /> Tạo bài test
          </Link>
        </div>

        <div className="space-y-4">
          {recentTests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800">Chưa có bài test nào</h3>
              <p className="text-slate-500 text-sm mt-1">Tạo bài test đầu tiên của bạn ngay bây giờ!</p>
            </div>
          ) : (
            recentTests.map(test => (
              <div key={test.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{test.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500 mt-2">
                    <span className="flex items-center gap-1.5"><Settings size={14} /> Chế độ: {test.mode === 'exam' ? 'Thi thử' : 'Luyện tập'}</span>
                    <span>•</span>
                    <span>{test._count.questions} câu</span>
                    <span>•</span>
                    <span>{test.timeLimit} phút</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/test/${test.id}`} target="_blank" className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg font-medium text-sm hover:bg-slate-200">
                    Xem
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
