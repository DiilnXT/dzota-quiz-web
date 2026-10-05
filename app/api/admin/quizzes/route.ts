import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function isAdmin() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return false
  try {
    const session = JSON.parse(sessionStr)
    return session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'
  } catch (e) { return false }
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const quizzes = await prisma.quickQuiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true } } }
  })
  return NextResponse.json(quizzes.map((q: any) => {
    let parsed = {}
    try { parsed = JSON.parse(q.data) } catch (e) {}
    return {
      id: q.id,
      title: q.title,
      author: q.author?.username || 'Unknown',
      createdAt: q.createdAt,
      data: parsed
    }
  }))
}
