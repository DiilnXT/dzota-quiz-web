import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { id, title } = data
    
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    let authorId = null
    
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        authorId = session.id
        
        // Check max limits
        if (session.role !== 'ADMIN') {
          const user = await prisma.user.findUnique({ where: { id: authorId }, include: { _count: { select: { quizzes: true } } } })
          if (user && user._count.quizzes >= user.maxTests) {
            return NextResponse.json({ error: `Bạn đã đạt giới hạn tạo tối đa ${user.maxTests} bài test.` }, { status: 403 })
          }
        }
      } catch (e) {}
    }
    
    // UPSERT to support updating
    // On update: also backfill authorId if currently null and we have a valid session
    const existing = await prisma.quickQuiz.findUnique({ where: { id }, select: { authorId: true } })
    const updatePayload: any = {
      title: title || 'Quiz',
      data: JSON.stringify(data)
    }
    if (authorId && (!existing || !existing.authorId)) {
      updatePayload.authorId = authorId
    }

    await prisma.quickQuiz.upsert({
      where: { id },
      update: updatePayload,
      create: {
        id,
        title: title || 'Quiz',
        data: JSON.stringify(data),
        authorId
      }
    })
    
    return NextResponse.json({ success: true, id })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }
    
    const quiz = await prisma.quickQuiz.findUnique({
      where: { id }
    })
    
    if (!quiz) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    return NextResponse.json(JSON.parse(quiz.data))
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
