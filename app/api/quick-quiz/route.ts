import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const { id, title } = data
    
    await prisma.quickQuiz.create({
      data: {
        id,
        title: title || 'Quiz',
        data: JSON.stringify(data)
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
