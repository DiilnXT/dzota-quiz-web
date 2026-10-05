import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Metadata, ResolvingMetadata } from 'next'
import TestInterface from './TestInterface'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const test = await prisma.test.findUnique({
    where: { id: resolvedParams.id }
  })
  
  if (!test) {
    const quickQuiz = await prisma.quickQuiz.findUnique({
      where: { id: resolvedParams.id }
    })
    if (quickQuiz) {
      return {
        title: quickQuiz.title,
        description: `Bắt đầu làm bài thi: ${quickQuiz.title}`
      }
    }
    return { title: 'Bài Test Không Tồn Tại' }
  }
  
  return {
    title: test.title,
    description: `Tham gia bài test ${test.title} - Thời gian: ${test.timeLimit} phút`,
    openGraph: {
      title: test.title,
      description: `Tham gia bài test ${test.title} - Thời gian: ${test.timeLimit} phút`,
      type: 'website',
    }
  }
}

export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const test = await prisma.test.findUnique({
    where: { id: resolvedParams.id },
    include: {
      questions: {
        include: {
          question: true
        },
        orderBy: { order: 'asc' }
      }
    }
  })

  if (!test) {
    // Check if this ID is a QuickQuiz (created via creator or quick quiz)
    const quickQuiz = await prisma.quickQuiz.findUnique({
      where: { id: resolvedParams.id }
    })
    if (quickQuiz) {
      redirect(`/?id=${resolvedParams.id}`)
    }
    notFound()
  }

  return <TestInterface test={test} />
}
