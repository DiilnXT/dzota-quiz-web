import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
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
  
  if (!test) return { title: 'Bài Test Không Tồn Tại' }
  
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

  if (!test) notFound()

  return <TestInterface test={test} />
}
