import React from 'react'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
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

  // Fetch data
  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      role: true,
      maxTests: true,
      password: true,
      createdAt: true,
      _count: {
        select: { quizzes: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const quizzes = await prisma.quickQuiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { username: true }
      }
    }
  })

  return (
    <DashboardClient
      initialUsers={JSON.parse(JSON.stringify(users))}
      initialQuizzes={JSON.parse(JSON.stringify(quizzes))}
      session={{
        id: session.id,
        username: session.username,
        role: session.role
      }}
    />
  )
}
