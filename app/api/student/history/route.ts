import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

// Helper: Tự động dọn dẹp lịch sử của các ngày trước (chỉ giữ lại ngày hôm nay)
async function cleanOldHistory(userId: string) {
  try {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    await prisma.quizHistory.deleteMany({
      where: {
        userId,
        createdAt: { lt: startOfToday }
      }
    })
  } catch (e) {
    console.error('Error cleaning old quiz history:', e)
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ history: [] })
    }

    const session = JSON.parse(sessionStr)
    if (!session?.id) return NextResponse.json({ history: [] })

    // Dọn dẹp dữ liệu cũ sang ngày mới để tiết kiệm bộ nhớ
    await cleanOldHistory(session.id)

    const history = await prisma.quizHistory.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ history })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ success: false, guest: true, message: 'Khách chưa đăng nhập' })
    }

    const session = JSON.parse(sessionStr)
    if (!session?.id) {
      return NextResponse.json({ success: false, guest: true })
    }

    const body = await request.json()
    const { quizId, quizTitle, score, correctCount, totalCount, timeSpent, details } = body

    if (!quizId) {
      return NextResponse.json({ error: 'Thiếu mã đề thi (quizId)' }, { status: 400 })
    }

    // Tự động dọn dẹp dữ liệu của ngày cũ
    await cleanOldHistory(session.id)

    const record = await prisma.quizHistory.create({
      data: {
        userId: session.id,
        quizId: String(quizId),
        quizTitle: quizTitle ? String(quizTitle) : 'Bài thi',
        score: typeof score === 'number' ? score : Number(score) || 0,
        correctCount: Number(correctCount) || 0,
        totalCount: Number(totalCount) || 0,
        timeSpent: Number(timeSpent) || 0,
        details: details ? (typeof details === 'string' ? details : JSON.stringify(details)) : null
      }
    })

    return NextResponse.json({ success: true, historyId: record.id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
