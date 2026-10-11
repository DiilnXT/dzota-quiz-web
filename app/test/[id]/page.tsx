import prisma from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { Metadata, ResolvingMetadata } from 'next'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import TestInterface from './TestInterface'

export const revalidate = 60

// Tối ưu hóa truy vấn DB bằng React cache + Next.js Data Cache (unstable_cache)
// Đảm bảo cả generateMetadata và TestPage cùng tái sử dụng 1 truy vấn duy nhất
// và trả kết quả siêu tốc (<20ms) từ Edge Cache cho tất cả thí sinh truy cập link
const getTestData = cache(async (id: string) => {
  return await unstable_cache(
    async () => {
      return await prisma.test.findUnique({
        where: { id },
        include: {
          questions: {
            include: {
              question: true
            },
            orderBy: { order: 'asc' }
          }
        }
      })
    },
    [`test-data-v2-${id}`],
    { revalidate: 60, tags: [`test-${id}`] }
  )()
})

const getQuickQuizData = cache(async (id: string) => {
  return await unstable_cache(
    async () => {
      return await prisma.quickQuiz.findUnique({
        where: { id }
      })
    },
    [`quick-quiz-v2-${id}`],
    { revalidate: 60, tags: [`quickquiz-${id}`] }
  )()
})

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params
  const test = await getTestData(resolvedParams.id)
  
  if (!test) {
    const quickQuiz = await getQuickQuizData(resolvedParams.id)
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
  const test = await getTestData(resolvedParams.id)

  if (!test) {
    // Check if this ID is a QuickQuiz (created via creator or quick quiz)
    const quickQuiz = await getQuickQuizData(resolvedParams.id)
    if (quickQuiz) {
      redirect(`/?id=${resolvedParams.id}`)
    }
    notFound()
  }

  return <TestInterface test={test} />
}
