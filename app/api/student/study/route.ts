import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    let session: any = null
    try {
      session = JSON.parse(sessionStr)
    } catch (e) {
      return NextResponse.json({ error: 'Phiên không hợp lệ' }, { status: 401 })
    }

    const userId = session.id
    const userEmail = (session.email || '').toLowerCase()
    const username = (session.username || '').toLowerCase()

    // 1. Tìm các lớp học mà học sinh này tham gia (qua email)
    const classroomStudents = userEmail
      ? await prisma.classroomStudent.findMany({
          where: { email: userEmail },
          include: {
            class: {
              include: {
                teacher: {
                  select: { id: true, name: true, username: true, email: true }
                }
              }
            }
          }
        })
      : []

    const enrolledClasses = classroomStudents.map(cs => {
      let allowedSubjects: string[] = []
      let allowedQuizIds: string[] = []
      try {
        if (cs.allowedSubjects) allowedSubjects = JSON.parse(cs.allowedSubjects)
      } catch (e) {}
      try {
        if (cs.allowedQuizIds) allowedQuizIds = JSON.parse(cs.allowedQuizIds)
      } catch (e) {}

      return {
        id: cs.class.id,
        name: cs.class.name,
        description: cs.class.description,
        teacher: cs.class.teacher,
        allowedSubjects,
        allowedQuizIds
      }
    })

    // Tập hợp toàn bộ môn học và quizId được cấp quyền
    const allAllowedQuizIds = new Set<string>()
    const allAllowedSubjects = new Set<string>()

    enrolledClasses.forEach(c => {
      c.allowedQuizIds.forEach(id => allAllowedQuizIds.add(id))
      c.allowedSubjects.forEach(s => allAllowedSubjects.add(s.toLowerCase()))
    })

    // 2. Lấy toàn bộ đề thi QuickQuiz
    const allQuizzes = await prisma.quickQuiz.findMany({
      select: {
        id: true,
        title: true,
        createdAt: true,
        author: {
          select: { id: true, name: true, username: true }
        },
        data: true
      },
      orderBy: { createdAt: 'desc' }
    })

    // 3. Tự động dọn dẹp lịch sử quá 3 ngày và lấy lịch sử làm bài của học sinh
    try {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      await prisma.quizHistory.deleteMany({
        where: { createdAt: { lt: threeDaysAgo } }
      })
    } catch (e) {}

    const histories = userId
      ? await prisma.quizHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        })
      : []

    // Map thống kê lịch sử theo quizId
    const historyMap: Record<string, { attempts: number; highestScore: number; lastScore: number; lastTakenAt: Date }> = {}
    histories.forEach(h => {
      const qId = h.quizId
      if (!historyMap[qId]) {
        historyMap[qId] = {
          attempts: 1,
          highestScore: h.score,
          lastScore: h.score,
          lastTakenAt: h.createdAt
        }
      } else {
        historyMap[qId].attempts += 1
        if (h.score > historyMap[qId].highestScore) {
          historyMap[qId].highestScore = h.score
        }
      }
    })

    // 4. Lọc các đề thi mà học sinh được cấp quyền hoặc phân công làm
    const assignedQuizzes: any[] = []

    allQuizzes.forEach(quiz => {
      let parsed: any = {}
      try {
        parsed = JSON.parse(quiz.data)
      } catch (e) {}

      const config = parsed.config || {}
      const category = (config.category || 'Chung').trim()
      const allowedGmails: string[] = Array.isArray(config.allowedGmails)
        ? config.allowedGmails.map((g: string) => g.toLowerCase())
        : []

      const isExplicitlyAllowed = allAllowedQuizIds.has(quiz.id)
      const isSubjectAllowed = allAllowedSubjects.has(category.toLowerCase())
      const isGmailAllowed = userEmail && allowedGmails.includes(userEmail)
      const isPublic = config.accessType === 'public' || (!config.accessType && !config.password)

      // Nếu được phân công cụ thể trong lớp HOẶC trong danh sách gmail cho phép HOẶC là bài thi công khai
      if (isExplicitlyAllowed || isSubjectAllowed || isGmailAllowed || isPublic) {
        // Tìm lớp nào cấp quyền đề này
        const matchingClass = enrolledClasses.find(
          c => c.allowedQuizIds.includes(quiz.id) || c.allowedSubjects.map(s => s.toLowerCase()).includes(category.toLowerCase())
        )

        const hist = historyMap[quiz.id]

        assignedQuizzes.push({
          id: quiz.id,
          title: quiz.title || config.title || 'Bài thi trắc nghiệm',
          category,
          timeLimit: config.timeLimit || 15,
          mode: config.mode || 'exam',
          questionsCount: Array.isArray(parsed.questions) ? parsed.questions.length : 0,
          author: quiz.author?.name || quiz.author?.username || 'Giáo viên',
          assignedClass: matchingClass ? matchingClass.name : (isGmailAllowed ? 'Phân quyền riêng' : 'Mở công khai'),
          isSpecialPermission: isExplicitlyAllowed || isGmailAllowed,
          link: `/?id=${quiz.id}`,
          hasTaken: Boolean(hist),
          attempts: hist?.attempts || 0,
          highestScore: hist ? hist.highestScore : null,
          lastScore: hist ? hist.lastScore : null,
          lastTakenAt: hist ? hist.lastTakenAt : null,
          createdAt: quiz.createdAt
        })
      }
    })

    return NextResponse.json({
      success: true,
      enrolledClasses,
      assignedQuizzes,
      history: histories
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
