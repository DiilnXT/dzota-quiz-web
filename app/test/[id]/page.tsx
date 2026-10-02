import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Metadata, ResolvingMetadata } from 'next'
import TestInterface from './TestInterface'

export async function generateMetadata(
  { params }: { params: { id: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const test = await prisma.test.findUnique({
    where: { id: params.id }
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

export default async function TestPage({ params }: { params: { id: string } }) {
  const test = await prisma.test.findUnique({
    where: { id: params.id },
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
