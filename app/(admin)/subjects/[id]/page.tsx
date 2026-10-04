import Link from 'next/link'
import { Folder, ChevronRight, Plus, Trash2, Home, ArrowLeft } from 'lucide-react'
import { createChapter, deleteChapter } from '@/app/actions/subject'
import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'

export default async function SubjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const subject = await prisma.subject.findUnique({
    where: { id: resolvedParams.id },
    include: {
      chapters: {
        include: { _count: { select: { questions: true } } },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!subject) notFound()

  return (
    <div className="min-h-screen pb-12 bg-[#F2F2F7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/subjects" className="text-slate-400 hover:text-slate-600"><ArrowLeft size={20}/></Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-xl font-bold text-black tracking-tight">{subject.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Thêm Chương Mới</h2>
          <form action={async (formData) => {
            'use server'
            const name = formData.get('name') as string
            if (name) await createChapter(subject.id, name)
          }} className="flex gap-4">
            <input 
              name="name" 
              type="text" 
              placeholder="Nhập tên chương (VD: Chương 1: Hàm số...)" 
              required
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all"
            />
            <button type="submit" className="bg-[#007AFF] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-600 transition-colors">
              <Plus size={20} /> Thêm Chương
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {subject.chapters.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
              <Folder size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800">Chưa có chương nào</h3>
              <p className="text-slate-500 text-sm mt-1">Thêm chương để phân loại ngân hàng câu hỏi tốt hơn.</p>
            </div>
          ) : (
            subject.chapters.map(chapter => (
              <div key={chapter.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between group">
                <Link href={`/chapters/${chapter.id}`} className="flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center">
                    <Folder size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-amber-500 transition-colors">{chapter.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{chapter._count.questions} nhóm câu hỏi</p>
                  </div>
                </Link>
                
                <div className="flex items-center gap-4">
                  <form action={async () => {
                    'use server'
                    await deleteChapter(chapter.id, subject.id)
                  }}>
                    <button type="submit" className="w-10 h-10 rounded-full text-slate-400 hover:text-[#FF3B30] hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </form>
                  <Link href={`/chapters/${chapter.id}`} className="text-slate-400 group-hover:text-amber-500 transition-colors">
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
