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
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, role: true, maxTests: true, password: true, _count: { select: { quizzes: true } } }
  })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { username, password, maxTests } = await request.json()
  try {
    const user = await prisma.user.create({
      data: { username, password, maxTests: Number(maxTests) }
    })
    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, maxTests } = await request.json()
  const user = await prisma.user.update({
    where: { id },
    data: { maxTests: Number(maxTests) }
  })
  return NextResponse.json(user)
}

export async function DELETE(request: Request) {
  if (!isAdmin()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await request.json()
  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
