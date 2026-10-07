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

  if (!session) {
    redirect('/login')
  }

  // Lấy thông tin user hiện tại từ database an toàn
  let currentUser: any = null
  try {
    const orConditions: any[] = []
    if (session.id) orConditions.push({ id: session.id })
    if (session.email) orConditions.push({ email: session.email })
    if (session.username) orConditions.push({ username: session.username })

    if (orConditions.length > 0) {
      currentUser = await prisma.user.findFirst({
        where: { OR: orConditions },
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
    }
  } catch (e) {
    console.error('Error fetching currentUser in dashboard:', e)
  }

  const userId = currentUser?.id || session.id || ''

  // Phân biệt quyền Admin, Giáo viên và Học sinh
  const sessionEmail = (session.email || currentUser?.email || '').toLowerCase()
  const sessionUsername = (session.username || currentUser?.username || '').toLowerCase()
  const isSuperAdminEmail = sessionEmail === 'lenhatduy.vietnam@gmail.com'
  const isDuylni = sessionUsername === 'duylniedu'
  const isUserAdmin = currentUser?.role?.toLowerCase() === 'admin' || session.role?.toLowerCase() === 'admin' || isDuylni || isSuperAdminEmail
  const isTeacher = !isUserAdmin && currentUser?.role?.toUpperCase() === 'TEACHER'
  const isStudent = !isUserAdmin && !isTeacher

  const currentRole = isUserAdmin ? 'ADMIN' : (isTeacher ? 'TEACHER' : 'STUDENT')

  // Lấy danh sách thông báo của user an toàn
  let notifications: any[] = []
  if (userId) {
    try {
      if ((prisma as any).notification) {
        notifications = await (prisma as any).notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })
      }
    } catch (e) {
      console.error('Error fetching notifications:', e)
    }
  }

  // ─── 1. DÀNH CHO HỌC SINH (STUDENT PORTAL) ──────────────────────────
  if (isStudent) {
    let studentHistory: any[] = []
    if (userId) {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      try {
        await prisma.quizHistory.deleteMany({
          where: {
            userId,
            createdAt: { lt: startOfToday }
          }
        })
      } catch (e) {}

      try {
        studentHistory = await prisma.quizHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })
      } catch (e) {}
    }

    return (
      <DashboardClient
        initialUsers={currentUser ? [JSON.parse(JSON.stringify(currentUser))] : []}
        initialQuizzes={[]}
        initialNotifications={JSON.parse(JSON.stringify(notifications || []))}
        initialClasses={[]}
        initialHistory={JSON.parse(JSON.stringify(studentHistory || []))}
        availableSubjects={[]}
        isTeacher={false}
        isStudent={true}
        currentUserInfo={currentUser ? JSON.parse(JSON.stringify(currentUser)) : null}
        session={{
          id: userId,
          username: currentUser?.name || session.username || 'Học sinh',
          role: 'STUDENT',
          email: currentUser?.email || session.email,
          avatar: currentUser?.avatar || session.avatar,
          phone: currentUser?.phone || session.phone
        }}
      />
    )
  }

  // ─── 2. DÀNH CHO ADMIN & GIÁO VIÊN ──────────────────────────────────
  // Lấy danh sách lớp học an toàn
  let classes: any[] = []
  try {
    const classWhereClause = isUserAdmin ? {} : (userId ? { teacherId: userId } : { id: 'none' })
    classes = await prisma.classroom.findMany({
      where: classWhereClause,
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
  } catch (e) {
    console.error('Error fetching classes:', e)
  }

  // Lấy danh sách bài test an toàn
  let quizzes: any[] = []
  try {
    const quizWhereClause = isUserAdmin ? {} : (userId ? { authorId: userId } : { id: 'none' })
    quizzes = await prisma.quickQuiz.findMany({
      where: quizWhereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, username: true, name: true, phone: true }
        }
      }
    })
  } catch (e) {
    console.error('Error fetching quizzes:', e)
  }

  // Lấy tất cả bài test hệ thống để xây dựng danh sách môn học cho phân quyền học sinh
  let allSystemQuizzes: any[] = []
  try {
    allSystemQuizzes = await prisma.quickQuiz.findMany({
      select: { id: true, title: true, data: true },
      orderBy: { createdAt: 'desc' }
    })
  } catch (e) {
    console.error('Error fetching all system quizzes:', e)
  }

  const subjectMap: Record<string, { id: string; name: string; quizzes: { id: string; title: string }[] }> = {}
  ;(allSystemQuizzes || []).forEach(q => {
    let parsedConfig: any = {}
    try { parsedConfig = JSON.parse(q.data)?.config || {} } catch (e) {}
    const catName = parsedConfig.category || parsedConfig.subject || 'Chung'
    if (!subjectMap[catName]) {
      subjectMap[catName] = { id: catName, name: catName, quizzes: [] }
    }
    subjectMap[catName].quizzes.push({ id: q.id, title: q.title })
  })
  const availableSubjects = Object.values(subjectMap)

  // Danh sách người dùng (nếu là admin) an toàn
  let users: any[] = []
  if (isUserAdmin) {
    try {
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
    } catch (e) {
      console.error('Error fetching admin users list:', e)
      try {
        users = await prisma.user.findMany({
          orderBy: { createdAt: 'desc' }
        })
      } catch (e2) {}
    }
  }

  const formattedUsers = (users || []).map(u => ({
    ...u,
    quizzes: (u.quizzes || []).map((q: any) => {
      let parsedConfig: any = {}
      try {
        const d = JSON.parse(q.data)
        parsedConfig = d.config || {}
      } catch (e) {}
      return {
        id: q.id,
        title: q.title,
        createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : new Date().toISOString(),
        isActive: parsedConfig.isActive !== false,
        category: parsedConfig.category || 'Chung',
        timeLimit: parsedConfig.timeLimit || 15
      }
    })
  }))

  const formattedQuizzes = (quizzes || []).map(q => {
    let parsedConfig: any = {}
    try {
      const d = JSON.parse(q.data)
      parsedConfig = d.config || {}
    } catch (e) {}
    return {
      id: q.id,
      title: q.title,
      createdAt: q.createdAt ? new Date(q.createdAt).toISOString() : new Date().toISOString(),
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
      initialNotifications={JSON.parse(JSON.stringify(notifications || []))}
      initialClasses={JSON.parse(JSON.stringify(classes || []))}
      initialHistory={[]}
      availableSubjects={JSON.parse(JSON.stringify(availableSubjects || []))}
      isTeacher={isTeacher}
      isStudent={false}
      currentUserInfo={currentUser ? JSON.parse(JSON.stringify(currentUser)) : null}
      session={{
        id: userId,
        username: currentUser?.name || session.username || 'Người dùng',
        role: currentRole,
        email: currentUser?.email || session.email,
        avatar: currentUser?.avatar || session.avatar,
        phone: currentUser?.phone || session.phone
      }}
    />
  )
}
