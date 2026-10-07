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

  // Lấy thông tin user hiện tại từ database để đảm bảo mới nhất
  const currentUser = await prisma.user.findFirst({
    where: {
      OR: [
        { id: session.id },
        ...(session.email ? [{ email: session.email }] : []),
        ...(session.username ? [{ username: session.username }] : [])
      ]
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      avatar: true,
      phone: true,
      role: true,
      maxTests: true,
      createdAt: true
    }
  })

  // Phân biệt quyền Admin, Giáo viên và Học sinh
  const isSuperAdminEmail = session.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
  const isDuylni = session.username?.toLowerCase() === 'duylniedu'
  const isUserAdmin = currentUser?.role?.toLowerCase() === 'admin' || session.role?.toLowerCase() === 'admin' || isDuylni || isSuperAdminEmail
  const isTeacher = !isUserAdmin && currentUser?.role?.toUpperCase() === 'TEACHER'
  const isStudent = !isUserAdmin && !isTeacher

  const currentRole = isUserAdmin ? 'ADMIN' : (isTeacher ? 'TEACHER' : 'STUDENT')

  // Lấy danh sách thông báo của user
  let notifications: any[] = []
  try {
    if ((prisma as any).notification) {
      notifications = await (prisma as any).notification.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' }
      })
    }
  } catch (e) {}

  // ─── 1. DÀNH CHO HỌC SINH (STUDENT PORTAL) ──────────────────────────
  if (isStudent) {
    // Dọn dẹp dữ liệu cũ (chỉ giữ lại bài thi đã làm trong ngày hôm nay)
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    try {
      await prisma.quizHistory.deleteMany({
        where: {
          userId: session.id,
          createdAt: { lt: startOfToday }
        }
      })
    } catch (e) {}

    // Lấy lịch sử làm bài thi hôm nay
    let studentHistory: any[] = []
    try {
      studentHistory = await prisma.quizHistory.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: 'desc' }
      })
    } catch (e) {}

    return (
      <DashboardClient
        initialUsers={currentUser ? [JSON.parse(JSON.stringify(currentUser))] : []}
        initialQuizzes={[]}
        initialNotifications={JSON.parse(JSON.stringify(notifications))}
        initialClasses={[]}
        initialHistory={JSON.parse(JSON.stringify(studentHistory))}
        availableSubjects={[]}
        isTeacher={false}
        isStudent={true}
        currentUserInfo={currentUser ? JSON.parse(JSON.stringify(currentUser)) : null}
        session={{
          id: session.id,
          username: currentUser?.name || session.username,
          role: 'STUDENT',
          email: currentUser?.email || session.email,
          avatar: currentUser?.avatar || session.avatar,
          phone: currentUser?.phone || session.phone
        }}
      />
    )
  }

  // ─── 2. DÀNH CHO ADMIN & GIÁO VIÊN ──────────────────────────────────
  // Lấy danh sách lớp học
  let classes: any[] = []
  try {
    classes = await prisma.classroom.findMany({
      where: isUserAdmin ? {} : { teacherId: session.id },
      include: {
        students: {
          orderBy: { createdAt: 'desc' }
        },
        teacher: {
          select: { id: true, name: true, username: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  } catch (e) {}

  // Lấy danh sách bài test
  const quizWhereClause = isUserAdmin ? {} : { authorId: session.id }
  const quizzes = await prisma.quickQuiz.findMany({
    where: quizWhereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: { id: true, username: true, name: true, phone: true }
      }
    }
  })

  // Lấy tất cả bài test hệ thống để xây dựng danh sách môn học cho phân quyền học sinh
  const allSystemQuizzes = await prisma.quickQuiz.findMany({
    select: { id: true, title: true, data: true },
    orderBy: { createdAt: 'desc' }
  })

  const subjectMap: Record<string, { id: string; name: string; quizzes: { id: string; title: string }[] }> = {}
  allSystemQuizzes.forEach(q => {
    let parsedConfig: any = {}
    try { parsedConfig = JSON.parse(q.data)?.config || {} } catch (e) {}
    const catName = parsedConfig.category || parsedConfig.subject || 'Chung'
    if (!subjectMap[catName]) {
      subjectMap[catName] = { id: catName, name: catName, quizzes: [] }
    }
    subjectMap[catName].quizzes.push({ id: q.id, title: q.title })
  })
  const availableSubjects = Object.values(subjectMap)

  // Danh sách người dùng (nếu là admin)
  let users: any[] = []
  if (isUserAdmin) {
    users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
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
  }

  const formattedUsers = users.map(u => ({
    ...u,
    quizzes: u.quizzes.map((q: any) => {
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
      accessType: parsedConfig.accessType || (Array.isArray(parsedConfig.allowedGmails) && parsedConfig.allowedGmails.length > 0 ? 'restricted' : 'public'),
      allowedGmails: Array.isArray(parsedConfig.allowedGmails) ? parsedConfig.allowedGmails : [],
      author: q.author ? {
        id: q.author.id,
        username: q.author.username,
        name: q.author.name,
        phone: q.author.phone
      } : null
    }
  })

  return (
    <DashboardClient
      initialUsers={isUserAdmin ? JSON.parse(JSON.stringify(formattedUsers)) : (currentUser ? [JSON.parse(JSON.stringify(currentUser))] : [])}
      initialQuizzes={JSON.parse(JSON.stringify(formattedQuizzes))}
      initialNotifications={JSON.parse(JSON.stringify(notifications))}
      initialClasses={JSON.parse(JSON.stringify(classes))}
      initialHistory={[]}
      availableSubjects={JSON.parse(JSON.stringify(availableSubjects))}
      isTeacher={isTeacher}
      isStudent={false}
      currentUserInfo={currentUser ? JSON.parse(JSON.stringify(currentUser)) : null}
      session={{
        id: session.id,
        username: currentUser?.name || session.username,
        role: currentRole,
        email: currentUser?.email || session.email,
        avatar: currentUser?.avatar || session.avatar,
        phone: currentUser?.phone || session.phone
      }}
    />
  )
}
