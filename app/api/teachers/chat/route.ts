import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function getSessionUser() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return null
  let sessionData: any = null
  try {
    sessionData = JSON.parse(sessionStr)
  } catch (e) {
    return null
  }

  const orConditions: any[] = []
  if (sessionData.id) orConditions.push({ id: sessionData.id })
  if (sessionData.email) orConditions.push({ email: sessionData.email })
  if (sessionData.username) orConditions.push({ username: sessionData.username })
  if (orConditions.length === 0) return null

  const user = await prisma.user.findFirst({
    where: { OR: orConditions },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      avatar: true,
      phone: true
    }
  })

  if (!user) return null

  const isSuperAdmin =
    user.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com' ||
    user.username?.toLowerCase() === 'duylniedu' ||
    sessionData.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com' ||
    sessionData.username?.toLowerCase() === 'duylniedu'

  const role = isSuperAdmin ? 'ADMIN' : (user.role?.toUpperCase() || 'STUDENT')
  return {
    ...user,
    role
  }
}

function isTeacherOrAdmin(user: any) {
  if (!user) return false
  const role = user.role?.toUpperCase() || ''
  return role === 'ADMIN' || role === 'TEACHER' || role === 'USER'
}

// GET: Lấy lịch sử tin nhắn trò chuyện với 1 giáo viên
export async function GET(request: Request) {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  if (!isTeacherOrAdmin(user)) {
    return NextResponse.json({ error: 'Chỉ Giáo viên mới có quyền sử dụng tính năng nhắn tin' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const friendId = searchParams.get('friendId')

  if (!friendId) {
    return NextResponse.json({ error: 'Thiếu ID giáo viên cần trò chuyện' }, { status: 400 })
  }

  const myId = user.id

  // Cập nhật trạng thái Online của bản thân
  try {
    await prisma.user.update({
      where: { id: myId },
      data: { lastActiveAt: new Date() }
    })
  } catch (e) {}

  // Kiểm tra quan hệ bạn bè (chỉ chat được khi đã là bạn bè ACCEPTED)
  const isAdmin = user.role?.toUpperCase() === 'ADMIN'

  if (!isAdmin && friendId !== myId) {
    const friendship = await prisma.friendship.findFirst({
      where: {
        status: 'ACCEPTED',
        OR: [
          { requesterId: myId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: myId }
        ]
      }
    })

    if (!friendship) {
      return NextResponse.json({
        error: 'Hai bạn cần kết bạn trước khi bắt đầu nhắn tin trực tuyến!'
      }, { status: 403 })
    }
  }

  try {
    // Lấy thông tin đối phương và trạng thái Online
    const friend = await prisma.user.findUnique({
      where: { id: friendId },
      select: {
        id: true,
        username: true,
        name: true,
        avatar: true,
        phone: true,
        lastActiveAt: true
      }
    })

    if (!friend) {
      return NextResponse.json({ error: 'Giáo viên không tồn tại' }, { status: 404 })
    }

    const now = Date.now()
    const isOnline = Boolean(
      friend.lastActiveAt &&
      now - new Date(friend.lastActiveAt).getTime() < 3 * 60 * 1000
    )

    // Lấy danh sách tin nhắn giữa 2 người
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: myId, receiverId: friendId, deletedForSender: false },
          { senderId: friendId, receiverId: myId, deletedForReceiver: false }
        ]
      },
      orderBy: { createdAt: 'asc' },
      take: 150
    })

    const formattedMessages = messages.map(m => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      isMe: m.senderId === myId,
      content: m.isRecalled ? 'Tin nhắn đã được thu hồi' : m.content,
      type: m.type,
      quizId: m.quizId,
      quizTitle: m.quizTitle,
      isRecalled: m.isRecalled,
      createdAt: m.createdAt
    }))

    return NextResponse.json({
      success: true,
      friend: {
        ...friend,
        name: friend.name || friend.username,
        isOnline
      },
      messages: formattedMessages
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Gửi tin nhắn mới (văn bản, emoji, chia sẻ đề thi)
export async function POST(request: Request) {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  if (!isTeacherOrAdmin(user)) {
    return NextResponse.json({ error: 'Chỉ Giáo viên mới có quyền sử dụng tính năng nhắn tin' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { receiverId, content, type = 'TEXT', quizId, quizTitle } = body

    if (!receiverId) {
      return NextResponse.json({ error: 'Thiếu người nhận' }, { status: 400 })
    }

    const myId = user.id

    // Kiểm tra quan hệ bạn bè
    const isAdmin = user.role?.toUpperCase() === 'ADMIN'

    if (!isAdmin && receiverId !== myId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          status: 'ACCEPTED',
          OR: [
            { requesterId: myId, addresseeId: receiverId },
            { requesterId: receiverId, addresseeId: myId }
          ]
        }
      })

      if (!friendship) {
        return NextResponse.json({
          error: 'Chỉ có thể nhắn tin cho giáo viên đã kết bạn!'
        }, { status: 403 })
      }
    }

    const cleanContent = String(content || '').trim()
    if (!cleanContent && type === 'TEXT') {
      return NextResponse.json({ error: 'Nội dung tin nhắn không được để trống' }, { status: 400 })
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        senderId: myId,
        receiverId,
        content: cleanContent || (type === 'QUIZ' ? (quizTitle || 'Đề thi được chia sẻ') : ''),
        type: type === 'QUIZ' ? 'QUIZ' : 'TEXT',
        quizId: quizId || null,
        quizTitle: quizTitle || null
      }
    })

    // Cập nhật trạng thái hoạt động của người gửi
    try {
      await prisma.user.update({
        where: { id: myId },
        data: { lastActiveAt: new Date() }
      })
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        senderId: newMessage.senderId,
        receiverId: newMessage.receiverId,
        isMe: true,
        content: newMessage.content,
        type: newMessage.type,
        quizId: newMessage.quizId,
        quizTitle: newMessage.quizTitle,
        isRecalled: false,
        createdAt: newMessage.createdAt
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH: Thu hồi tin nhắn, xóa tin nhắn, hoặc xóa tin nhắn trong ngày
export async function PATCH(request: Request) {
  const user = await getSessionUser()
  if (!user?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action, messageId, friendId } = body
    const myId = user.id

    // THU HỒI TIN NHẮN (Recall) - Chỉ người gửi mới được thu hồi
    if (action === 'recall') {
      if (!messageId) {
        return NextResponse.json({ error: 'Thiếu mã tin nhắn' }, { status: 400 })
      }

      const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } })
      if (!msg) {
        return NextResponse.json({ error: 'Tin nhắn không tồn tại' }, { status: 404 })
      }

      if (msg.senderId !== myId) {
        return NextResponse.json({ error: 'Bạn chỉ có thể thu hồi tin nhắn do chính mình gửi' }, { status: 403 })
      }

      const updated = await prisma.chatMessage.update({
        where: { id: messageId },
        data: {
          isRecalled: true,
          content: 'Tin nhắn đã được thu hồi'
        }
      })

      return NextResponse.json({ success: true, message: 'Đã thu hồi tin nhắn', messageId: updated.id })
    }

    // XÓA 1 TIN NHẮN (Delete for me)
    if (action === 'delete') {
      if (!messageId) {
        return NextResponse.json({ error: 'Thiếu mã tin nhắn' }, { status: 400 })
      }

      const msg = await prisma.chatMessage.findUnique({ where: { id: messageId } })
      if (!msg) {
        return NextResponse.json({ error: 'Tin nhắn không tồn tại' }, { status: 404 })
      }

      if (msg.senderId === myId) {
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: { deletedForSender: true }
        })
      } else if (msg.receiverId === myId) {
        await prisma.chatMessage.update({
          where: { id: messageId },
          data: { deletedForReceiver: true }
        })
      }

      return NextResponse.json({ success: true, message: 'Đã xóa tin nhắn phía bạn' })
    }

    // XÓA TẤT CẢ TIN NHẮN TRONG NGÀY (Clear today's messages)
    if (action === 'clear_today') {
      if (!friendId) {
        return NextResponse.json({ error: 'Thiếu mã người bạn' }, { status: 400 })
      }

      // Thời điểm bắt đầu ngày hôm nay (00:00:00)
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)

      // Cập nhật ẩn các tin nhắn tôi gửi hôm nay
      await prisma.chatMessage.updateMany({
        where: {
          senderId: myId,
          receiverId: friendId,
          createdAt: { gte: startOfDay }
        },
        data: { deletedForSender: true }
      })

      // Cập nhật ẩn các tin nhắn tôi nhận hôm nay
      await prisma.chatMessage.updateMany({
        where: {
          senderId: friendId,
          receiverId: myId,
          createdAt: { gte: startOfDay }
        },
        data: { deletedForReceiver: true }
      })

      return NextResponse.json({
        success: true,
        message: 'Đã xóa toàn bộ tin nhắn trong ngày hôm nay thành công!'
      })
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
