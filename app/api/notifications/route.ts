import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function getSession() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return null
  try {
    return JSON.parse(sessionStr)
  } catch (e) {
    return null
  }
}

// GET: Lấy danh sách thông báo của user hiện tại
export async function GET() {
  const session = await getSession()
  if (!session?.id) {
    return NextResponse.json({ notifications: [], unreadCount: 0 })
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: 'desc' }
    })

    const unreadCount = notifications.filter(n => !n.isRead).length
    return NextResponse.json({ notifications, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ notifications: [], unreadCount: 0, error: error.message }, { status: 500 })
  }
}

// POST: Gửi thông báo (Chỉ Admin)
export async function POST(request: Request) {
  const session = await getSession()
  const isUserAdmin = session?.role?.toLowerCase() === 'admin' || session?.username?.toLowerCase() === 'duylniedu'
  if (!isUserAdmin) {
    return NextResponse.json({ error: 'Chỉ Quản trị viên mới có quyền gửi thông báo' }, { status: 403 })
  }

  try {
    const { userId, targetAll, title, message } = await request.json()
    if (!title || !message) {
      return NextResponse.json({ error: 'Vui lòng nhập tiêu đề và nội dung thông báo' }, { status: 400 })
    }

    if (targetAll) {
      // Gửi cho tất cả giáo viên và user trong hệ thống
      const users = await prisma.user.findMany({ select: { id: true } })
      const notificationsData = users.map(u => ({
        userId: u.id,
        title: title.trim(),
        message: message.trim()
      }))

      await prisma.notification.createMany({
        data: notificationsData
      })

      return NextResponse.json({ success: true, count: users.length, message: `Đã gửi thông báo đến ${users.length} tài khoản!` })
    } else {
      if (!userId) {
        return NextResponse.json({ error: 'Vui lòng chọn tài khoản nhận thông báo' }, { status: 400 })
      }

      const notif = await prisma.notification.create({
        data: {
          userId,
          title: title.trim(),
          message: message.trim()
        }
      })

      return NextResponse.json({ success: true, notification: notif, message: 'Đã gửi thông báo thành công!' })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Đánh dấu đã đọc
export async function PATCH(request: Request) {
  const session = await getSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  try {
    const { id, markAllAsRead } = await request.json()

    if (markAllAsRead) {
      await prisma.notification.updateMany({
        where: { userId: session.id, isRead: false },
        data: { isRead: true }
      })
      return NextResponse.json({ success: true, message: 'Đã đánh dấu tất cả là đã đọc' })
    }

    if (id) {
      await prisma.notification.update({
        where: { id },
        data: { isRead: true }
      })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE: Xóa thông báo
export async function DELETE(request: Request) {
  const session = await getSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    await prisma.notification.delete({
      where: { id }
    })
    return NextResponse.json({ success: true, message: 'Đã xóa thông báo' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
