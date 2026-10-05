import Link from 'next/link'
import { FileText, ChevronRight, Plus, Trash2, Home, Lock, Settings } from 'lucide-react'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export default async function TestsPage() {
  const tests = await prisma.test.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { questions: true } } }
  })

  async function deleteTest(id: string) {
    'use server'
    await prisma.test.delete({ where: { id } })
    revalidatePath('/tests')
  }

  async function toggleStatus(id: string, current: boolean) {
    'use server'
    await prisma.test.update({ where: { id }, data: { isActive: !current } })
    revalidatePath('/tests')
  }

  return (
    <div className="min-h-screen pb-12 bg-[#F2F2F7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600"><Home size={20}/></Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-xl font-bold text-black tracking-tight">Quản Lý Bài Test</h1>
          </div>
          <Link href="/creator" className="bg-[#007AFF] text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-600 transition-colors text-sm">
            <Plus size={18} /> Tạo Bài Test
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-4">
          {tests.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
              <FileText size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800">Chưa có bài test nào</h3>
              <p className="text-slate-500 text-sm mt-1">Tạo bài test tự động từ ngân hàng câu hỏi ngay.</p>
            </div>
          ) : (
            tests.map(test => (
              <div key={test.id} className="bg-white p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between group gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#007AFF] bg-blue-50 px-2 py-0.5 rounded-md">
                      {test.mode === 'exam' ? 'Thi Thử' : 'Luyện Tập'}
                    </span>
                    {!test.isActive && (
                      <span className="text-[11px] font-bold uppercase tracking-wide text-[#FF3B30] bg-red-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Lock size={10}/> Đã khóa
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{test.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span>{test.timeLimit} phút</span>
                    <span>•</span>
                    <span>{test._count.questions} câu</span>
                    {test.password && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Lock size={12}/> Có mật khẩu</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 w-full md:w-auto justify-end border-t border-slate-100 pt-4 md:border-0 md:pt-0">
                  <form action={async () => {
                    'use server'
                    await toggleStatus(test.id, test.isActive)
                  }}>
                    <button type="submit" className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${test.isActive ? 'bg-red-50 text-red-500 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}>
                      {test.isActive ? 'Khóa Test' : 'Mở Khóa'}
                    </button>
                  </form>
                  <form action={async () => {
                    'use server'
                    await deleteTest(test.id)
                  }}>
                    <button type="submit" className="w-10 h-10 rounded-lg text-slate-400 hover:text-[#FF3B30] hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </form>
                  <Link href={`/test/${test.id}`} target="_blank" className="text-slate-400 group-hover:text-[#007AFF] transition-colors">
                    <ChevronRight size={24} />
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
