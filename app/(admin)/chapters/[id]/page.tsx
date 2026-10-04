import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Home } from 'lucide-react'
import ChapterManager from './ChapterManager'

export default async function ChapterPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const chapter = await prisma.chapter.findUnique({
    where: { id: resolvedParams.id },
    include: {
      subject: true,
      questions: {
        include: { questions: true },
        orderBy: { createdAt: 'asc' }
      }
    }
  })

  if (!chapter) notFound()

  return (
    <div className="min-h-screen pb-12 bg-[#F2F2F7]">
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-30 pt-safe">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href={`/subjects/${chapter.subjectId}`} className="text-slate-400 hover:text-slate-600"><ArrowLeft size={20}/></Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium truncate max-w-[150px]">{chapter.subject.name}</span>
            <span className="text-slate-300">/</span>
            <h1 className="text-xl font-bold text-black tracking-tight">{chapter.name}</h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <ChapterManager chapter={chapter} />
      </main>
    </div>
  )
}
