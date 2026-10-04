import { getSubjects } from '@/app/actions/subject'
import TestCreator from './TestCreator'

export default async function CreateTestPage() {
  const subjects = await getSubjects()

  return (
    <div className="min-h-screen pb-12 bg-[#F2F2F7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <h1 className="text-xl font-bold text-black tracking-tight">Tạo Bài Test Tự Động</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <TestCreator subjects={subjects} />
      </main>
    </div>
  )
}
