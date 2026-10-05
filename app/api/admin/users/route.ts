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
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, username: true, role: true, maxTests: true, password: true, _count: { select: { quizzes: true } } }
  })
  return NextResponse.json(users)
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { username, password, maxTests, role } = await request.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return NextResponse.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 400 })
    }
    const user = await prisma.user.create({
      data: {
        username,
        password,
        role: role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER',
        maxTests: Number(maxTests) || 10
      }
    })
    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, maxTests, password, role } = await request.json()
    const updateData: any = {}
    if (maxTests !== undefined) updateData.maxTests = Number(maxTests)
    if (password) updateData.password = password
    if (role) updateData.role = role?.toUpperCase() === 'ADMIN' ? 'ADMIN' : 'USER'

    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })
    return NextResponse.json(user)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id } = await request.json()
    const user = await prisma.user.findUnique({ where: { id } })
    if (user?.username?.toLowerCase() === 'duylniedu') {
      return NextResponse.json({ error: 'Không thể xóa tài khoản Quản trị viên tối cao' }, { status: 400 })
    }
    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
