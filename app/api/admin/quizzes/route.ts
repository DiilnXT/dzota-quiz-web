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
  
  try {
    const defaultAdmin = await prisma.user.findFirst({
      where: { OR: [{ username: { equals: 'DuylniEdu', mode: 'insensitive' } }, { role: 'ADMIN' }] }
    })

    if (defaultAdmin) {
      await prisma.quickQuiz.updateMany({
        where: { authorId: null },
        data: { authorId: defaultAdmin.id }
      })
    }
  } catch (e) {
    console.error('Error backfilling authorId:', e)
  }

  const quizzes = await prisma.quickQuiz.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true } } }
  })

  return NextResponse.json(quizzes.map((q: any) => {
    let parsed: any = {}
    try { parsed = JSON.parse(q.data) } catch (e) {}
    return {
      id: q.id,
      title: q.title,
      author: q.author ? { username: q.author.username } : { username: 'DuylniEdu' },
      createdAt: q.createdAt,
      data: parsed
    }
  }))
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, isActive } = await request.json()
    const quiz = await prisma.quickQuiz.findUnique({ where: { id } })
    if (!quiz) return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })

    let parsed: any = {}
    try { parsed = JSON.parse(quiz.data) } catch (e) {}
    if (!parsed.config) parsed.config = {}
    if (isActive !== undefined) {
      parsed.config.isActive = Boolean(isActive)
    }

    await prisma.quickQuiz.update({
      where: { id },
      data: { data: JSON.stringify(parsed) }
    })

    return NextResponse.json({ success: true, isActive: parsed.config.isActive })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await request.json()
    await prisma.quickQuiz.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
