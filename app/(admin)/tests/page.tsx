import React from 'react'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TestsClient from './TestsClient'

export const dynamic = 'force-dynamic'

export default async function TestsPage() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  
  if (!sessionStr) {
    redirect('/login')
  }
  
  let session
  try {
    session = JSON.parse(sessionStr)
  } catch (e) {
    redirect('/login')
  }

  // Ensure DuylniEdu is always authorized as Admin
  const isUserAdmin = session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'

  if (!isUserAdmin) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="bg-red-50 text-red-600 px-6 py-5 rounded-2xl font-bold shadow-sm border border-red-100 max-w-md text-center space-y-2">
          <div className="text-lg">Truy cập bị từ chối</div>
          <div className="text-sm font-medium text-red-500">Tài khoản &quot;{session.username}&quot; không có quyền Quản trị viên. Vui lòng đăng nhập bằng tài khoản Admin.</div>
        </div>
      </div>
    )
  }

  try {
    const defaultAdmin = await prisma.user.findFirst({
      where: { OR: [{ username: { equals: 'DuylniEdu', mode: 'insensitive' } }, { role: 'ADMIN' }] }
    })

    if (defaultAdmin) {
      await prisma.quickQuiz.updateMany({
        where: { authorId: null },
        data: { authorId: defaultAdmin.id }
      })
    }
  } catch (e) {
    console.error('Error backfilling authorId:', e)
  }

  // Fetch all QuickQuizzes
  const quizzes = await prisma.quickQuiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { username: true }
      }
    }
  })

  const formattedQuizzes = quizzes.map(q => {
    let parsed: any = {}
    try {
      parsed = JSON.parse(q.data)
    } catch (e) {}

    return {
      id: q.id,
      title: q.title,
      createdAt: q.createdAt.toISOString(),
      author: q.author ? { username: q.author.username } : { username: 'DuylniEdu' },
      data: parsed
    }
  })

  return <TestsClient initialQuizzes={formattedQuizzes} session={{ id: session.id, username: session.username, role: session.role }} />
}
