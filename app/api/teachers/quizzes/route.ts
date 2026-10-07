import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function getSession() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return null
  try {
    return JSON.parse(sessionStr)
  } catch (e) {
    return null
  }
}

function isTeacherOrAdmin(session: any) {
  if (!session) return false
  const role = session.role?.toUpperCase() || ''
  const username = session.username?.toLowerCase() || ''
  const email = session.email?.toLowerCase() || ''
  return (
    role === 'ADMIN' ||
    role === 'TEACHER' ||
    username === 'duylniedu' ||
    email === 'lenhatduy.vietnam@gmail.com'
  )
}

// GET: Lấy danh sách đề thi của bạn bè (CHỈ XEM & LÀM BÀI, KHÔNG SỬA / XÓA)
export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  if (!isTeacherOrAdmin(session)) {
    return NextResponse.json({ error: 'Chỉ Giáo viên mới có quyền xem kho đề chia sẻ' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const teacherId = searchParams.get('teacherId')

  if (!teacherId) {
    return NextResponse.json({ error: 'Thiếu ID giáo viên cần xem đề' }, { status: 400 })
  }

  const myId = session.id
  const isAdmin =
    session.role?.toUpperCase() === 'ADMIN' ||
    session.username?.toLowerCase() === 'duylniedu' ||
    session.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'

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
