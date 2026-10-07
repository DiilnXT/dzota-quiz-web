import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function getSessionUser() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return null
  let sessionData: any = null
  try {
    sessionData = JSON.parse(sessionStr)
  } catch (e) {
    return null
  }

  const orConditions: any[] = []
  if (sessionData.id) orConditions.push({ id: sessionData.id })
  if (sessionData.email) orConditions.push({ email: sessionData.email })
  if (sessionData.username) orConditions.push({ username: sessionData.username })
  if (orConditions.length === 0) return null

  const user = await prisma.user.findFirst({
    where: { OR: orConditions },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      phone: true
    }
  })

  if (!user) return null

  const isSuperAdmin =
    user.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com' ||
    user.username?.toLowerCase() === 'duylniedu' ||
    sessionData.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com' ||
    sessionData.username?.toLowerCase() === 'duylniedu'

  const role = isSuperAdmin ? 'ADMIN' : (user.role?.toUpperCase() || 'STUDENT')
  return {
    ...user,
    role
  }
}

function isTeacherOrAdmin(user: any) {
  if (!user) return false
  const role = user.role?.toUpperCase() || ''
  return role === 'ADMIN' || role === 'TEACHER' || role === 'USER'
}

// GET: Lấy danh sách đề thi của bạn bè (CHỈ XEM & LÀM BÀI, KHÔNG SỬA / XÓA)
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  if (!isTeacherOrAdmin(user)) {
    return NextResponse.json({ error: 'Chỉ Giáo viên mới có quyền xem kho đề chia sẻ' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get('teacherId')

  if (!teacherId) {
    return NextResponse.json({ error: 'Thiếu ID giáo viên cần xem đề' }, { status: 400 })
  }

  const myId = user.id
  const isAdmin = user.role?.toUpperCase() === 'ADMIN'

  // Kiểm tra quan hệ bạn bè (hoặc là Admin)
  if (!isAdmin && teacherId !== myId) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: myId, addresseeId: teacherId },
          { requesterId: teacherId, addresseeId: myId }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json({
        error: 'Bạn chỉ có thể xem kho đề thi khi 2 giáo viên đã kết bạn với nhau!'
      }, { status: 403 })
    }
  }

  try {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      select: { id: true, name: true, username: true, avatar: true }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Giáo viên không tồn tại' }, { status: 404 })
    }

    const quizzes = await prisma.quickQuiz.findMany({
      where: { authorId: teacherId },
      orderBy: { createdAt: 'desc' }
    })

    const formattedQuizzes = quizzes.map(q => {
      let subject = 'Tổng hợp'
      let questionCount = 0
      let timeLimit = 15

      try {
        const parsed = JSON.parse(q.data)
        subject = parsed.subject || parsed.category || 'Tổng hợp'
        questionCount = Array.isArray(parsed.questions) ? parsed.questions.length : 0
        timeLimit = parsed.timeLimit || 15
      } catch (e) {
        // fallback
      }

      return {
        id: q.id,
        title: q.title,
        subject,
        questionCount,
        timeLimit,
        createdAt: q.createdAt,
        authorName: teacher.name || teacher.username,
        authorAvatar: teacher.avatar
      }
    })

    return NextResponse.json({
      success: true,
      teacher: {
        id: teacher.id,
        name: teacher.name || teacher.username,
        avatar: teacher.avatar
      },
      quizzes: formattedQuizzes
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
