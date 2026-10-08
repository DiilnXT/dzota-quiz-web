import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function getUser() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return null
  try {
    return JSON.parse(sessionStr)
  } catch (e) {
    return null
  }
}

export async function GET() {
  try {
    const user = await getUser()
    if (!user?.id) {
      return NextResponse.json({ analyses: [] })
    }

    try {
      const analyses = await (prisma as any).mistakeAnalysis.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json({ success: true, analyses })
    } catch (dbErr) {
      return NextResponse.json({ success: true, analyses: [] })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Vui lòng đăng nhập để lưu trữ vào tài khoản' }, { status: 401 })
    }

    const body = await request.json()
    const { quizId, quizTitle, subject, mistakeCount, analysisText } = body

    if (!analysisText) {
      return NextResponse.json({ error: 'Thiếu nội dung phân tích' }, { status: 400 })
    }

    try {
      const saved = await (prisma as any).mistakeAnalysis.create({
        data: {
          userId: user.id,
          quizId: String(quizId || 'quiz'),
          quizTitle: String(quizTitle || 'Bài thi'),
          subject: subject ? String(subject) : 'Chung',
          mistakeCount: Number(mistakeCount) || 0,
          analysisText: String(analysisText)
        }
      })
      return NextResponse.json({ success: true, analysis: saved })
    } catch (dbErr: any) {
      return NextResponse.json({
        success: false,
        error: 'Chưa thể lưu vào cơ sở dữ liệu: ' + dbErr.message
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await getUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Thiếu ID bài phân tích' }, { status: 400 })
    }

    try {
      await (prisma as any).mistakeAnalysis.delete({
        where: { id }
      })
      return NextResponse.json({ success: true, message: 'Đã xóa bài phân tích' })
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
