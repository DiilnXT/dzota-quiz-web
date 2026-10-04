import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

function isAdmin() {
  const sessionStr = cookies().get('dzota_session')?.value
  if (!sessionStr) return false
  try {
    const session = JSON.parse(sessionStr)
    return session.role === 'ADMIN'
  } catch (e) { return false }
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
