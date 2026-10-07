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
  
  let session: any = null
  try {
    session = JSON.parse(sessionStr)
  } catch (e) {
    redirect('/login')
  }

  // Phân biệt quyền Admin và Giáo viên
  const isUserAdmin = session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'

  // ─── 1. DÀNH CHO ADMIN ───────────────────────────────────────────────
  if (isUserAdmin) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        maxTests: true,
        password: true,
        createdAt: true,
        _count: {
          select: { quizzes: true, notifications: true }
        },
        quizzes: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            data: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const quizzes = await prisma.quickQuiz.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true }
        }
      }
    })

    let notifications: any[] = []
    try {
      if ((prisma as any).notification) {
        notifications = await (prisma as any).notification.findMany({
          where: { userId: session.id },
          orderBy: { createdAt: 'desc' }
        })
      }
    } catch (e) {}

    // Parse quiz data for list view
    const formattedUsers = users.map(u => ({
      ...u,
      quizzes: u.quizzes.map(q => {
        let parsedConfig: any = {}
        try {
          const d = JSON.parse(q.data)
          parsedConfig = d.config || {}
        } catch (e) {}
        return {
          id: q.id,
          title: q.title,
          createdAt: q.createdAt.toISOString(),
          isActive: parsedConfig.isActive !== false,
          category: parsedConfig.category || 'Chung',
          timeLimit: parsedConfig.timeLimit || 15
        }
      })
    }))

    const formattedQuizzes = quizzes.map(q => {
      let parsedConfig: any = {}
      try {
        const d = JSON.parse(q.data)
        parsedConfig = d.config || {}
      } catch (e) {}
      return {
        id: q.id,
        title: q.title,
        createdAt: q.createdAt.toISOString(),
        isActive: parsedConfig.isActive !== false,
        category: parsedConfig.category || 'Chung',
        timeLimit: parsedConfig.timeLimit || 15,
        password: parsedConfig.password || '',
        author: q.author ? { id: q.author.id, username: q.author.username } : null
      }
    })

    return (
      <DashboardClient
        initialUsers={JSON.parse(JSON.stringify(formattedUsers))}
        initialQuizzes={JSON.parse(JSON.stringify(formattedQuizzes))}
        initialNotifications={JSON.parse(JSON.stringify(notifications))}
        isTeacher={false}
        session={{
          id: session.id,
          username: session.username,
          role: 'ADMIN',
          email: session.email
        }}
      />
    )
  }

  // ─── 2. DÀNH CHO GIÁO VIÊN (DASHBOARD RIÊNG) ──────────────────────────
  // Lấy thông tin user hiện tại
  const currentUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      maxTests: true,
      createdAt: true
    }
  })

  // CHỈ LẤY các bài test do chính giáo viên này tạo
  const teacherQuizzes = await prisma.quickQuiz.findMany({
    where: { authorId: session.id },
    orderBy: { createdAt: 'desc' }
  })

  let notifications: any[] = []
  try {
    if ((prisma as any).notification) {
      notifications = await (prisma as any).notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' }
      })
    }
  } catch (e) {}

  const formattedQuizzes = teacherQuizzes.map(q => {
    let parsedConfig: any = {}
    try {
      const d = JSON.parse(q.data)
      parsedConfig = d.config || {}
    } catch (e) {}
    return {
      id: q.id,
      title: q.title,
      createdAt: q.createdAt.toISOString(),
      isActive: parsedConfig.isActive !== false,
      category: parsedConfig.category || 'Chung',
      timeLimit: parsedConfig.timeLimit || 15,
      password: parsedConfig.password || '',
      author: { id: session.id, username: session.username }
    }
  })

  return (
    <DashboardClient
      initialUsers={currentUser ? [JSON.parse(JSON.stringify(currentUser))] : []}
      initialQuizzes={JSON.parse(JSON.stringify(formattedQuizzes))}
      initialNotifications={JSON.parse(JSON.stringify(notifications))}
      isTeacher={true}
      currentUserInfo={currentUser ? JSON.parse(JSON.stringify(currentUser)) : null}
      session={{
        id: session.id,
        username: currentUser?.name || session.username,
        role: session.role || 'TEACHER',
        email: currentUser?.email || session.email
      }}
    />
  )
}
