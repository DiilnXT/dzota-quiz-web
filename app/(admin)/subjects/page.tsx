import Link from 'next/link'
import { BookOpen, ChevronRight, Plus, Trash2, Home } from 'lucide-react'
import { getSubjects, createSubject, deleteSubject } from '@/app/actions/subject'

export default async function SubjectsPage() {
  const subjects = await getSubjects()

  return (
    <div className="min-h-screen pb-12 bg-[#F2F2F7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-slate-400 hover:text-slate-600"><Home size={20}/></Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-xl font-bold text-black tracking-tight">Ngân Hàng Môn Học</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white p-6 rounded-3xl shadow-sm mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Thêm Môn Học Mới</h2>
          <form action={async (formData) => {
            'use server'
            const name = formData.get('name') as string
            if (name) await createSubject(name)
          }} className="flex gap-4">
            <input 
              name="name" 
              type="text" 
              placeholder="Nhập tên môn học (VD: Toán Học, Lịch Sử...)" 
              required
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all"
            />
            <button type="submit" className="bg-[#007AFF] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-600 transition-colors">
              <Plus size={20} /> Thêm Môn
            </button>
          </form>
        </div>

        <div className="space-y-4">
          {subjects.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm">
              <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800">Chưa có môn học nào</h3>
              <p className="text-slate-500 text-sm mt-1">Hãy thêm môn học đầu tiên để bắt đầu tạo ngân hàng câu hỏi.</p>
            </div>
          ) : (
            subjects.map(subject => (
              <div key={subject.id} className="bg-white p-5 rounded-2xl shadow-sm flex items-center justify-between group">
                <Link href={`/subjects/${subject.id}`} className="flex-1 flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-[#007AFF] rounded-xl flex items-center justify-center">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 group-hover:text-[#007AFF] transition-colors">{subject.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">{subject.chapters.length} chương</p>
                  </div>
                </Link>
                
                <div className="flex items-center gap-4">
                  <form action={async () => {
                    'use server'
                    await deleteSubject(subject.id)
                  }}>
                    <button type="submit" className="w-10 h-10 rounded-full text-slate-400 hover:text-[#FF3B30] hover:bg-red-50 flex items-center justify-center transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </form>
                  <Link href={`/subjects/${subject.id}`} className="text-slate-400 group-hover:text-[#007AFF] transition-colors">
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
