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

function isTeacherOrAdmin(session: any) {
  if (!session) return false
  const role = session.role?.toUpperCase() || ''
  const username = session.username?.toLowerCase() || ''
  const email = session.email?.toLowerCase() || ''
  return (
    role === 'ADMIN' ||
    role === 'TEACHER' ||
    username === 'duylniedu' ||
    email === 'lenhatduy.vietnam@gmail.com'
  )
}

// GET: Lấy danh sách bạn bè, lời mời kết bạn và cập nhật trạng thái Online
export async function GET() {
  const session = await getSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  if (!isTeacherOrAdmin(session)) {
    return NextResponse.json({ error: 'Tính năng chỉ dành riêng cho Giáo viên & Quản trị viên' }, { status: 403 })
  }

  try {
    const myId = session.id

    // Cập nhật trạng thái đang hoạt động (Online heartbeat)
    try {
      await prisma.user.update({
        where: { id: myId },
        data: { lastActiveAt: new Date() }
      })
    } catch (e) {
      // Bỏ qua lỗi nếu user chưa có lastActiveAt
    }

    // Lấy tất cả quan hệ kết bạn
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: myId }, { addresseeId: myId }]
      },
      include: {
        requester: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            role: true,
            lastActiveAt: true,
            _count: { select: { quizzes: true } }
          }
        },
        addressee: {
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            avatar: true,
            phone: true,
            role: true,
            lastActiveAt: true,
            _count: { select: { quizzes: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const now = Date.now()
    const ONLINE_THRESHOLD = 3 * 60 * 1000 // 3 phút

    const friends: any[] = []
    const incomingRequests: any[] = []
    const outgoingRequests: any[] = []

    for (const f of friendships) {
      const isRequester = f.requesterId === myId
      const otherUser = isRequester ? f.addressee : f.requester

      const isOnline = Boolean(
        otherUser.lastActiveAt &&
        now - new Date(otherUser.lastActiveAt).getTime() < ONLINE_THRESHOLD
      )

      const friendData = {
        friendshipId: f.id,
        id: otherUser.id,
        username: otherUser.username,
        name: otherUser.name || otherUser.username,
        email: otherUser.email,
        avatar: otherUser.avatar,
        phone: otherUser.phone,
        role: otherUser.role,
        quizCount: otherUser._count?.quizzes || 0,
        isOnline,
        lastActiveAt: otherUser.lastActiveAt,
        status: f.status,
        createdAt: f.createdAt
      }

      if (f.status === 'ACCEPTED') {
        friends.push(friendData)
      } else if (f.status === 'PENDING') {
        if (isRequester) {
          outgoingRequests.push(friendData)
        } else {
          incomingRequests.push(friendData)
        }
      }
    }

    return NextResponse.json({
      success: true,
      friends,
      incomingRequests,
      outgoingRequests
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Tìm kiếm giáo viên, gửi lời mời, đồng ý, từ chối, hủy kết bạn
export async function POST(request: Request) {
  const session = await getSession()
  if (!session?.id) {
    return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
  }

  if (!isTeacherOrAdmin(session)) {
    return NextResponse.json({ error: 'Tính năng chỉ dành riêng cho Giáo viên & Quản trị viên' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action, query, targetId, friendshipId } = body
    const myId = session.id

    // ACTION: SEARCH TEACHERS
    if (action === 'search') {
      const q = String(query || '').trim()
      if (!q) {
        return NextResponse.json({ users: [] })
      }

      // Tìm kiếm user (khác chính mình) qua UID, Gmail, Tên đăng nhập hoặc Họ tên
      // Tự động tìm kiếm linh hoạt, không phân biệt hoa thường
      const users = await prisma.user.findMany({
        where: {
          id: { not: myId },
          OR: [
            { id: { equals: q } },
            { id: { contains: q, mode: 'insensitive' } },
            { username: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          avatar: true,
          phone: true,
          role: true,
          lastActiveAt: true,
          _count: { select: { quizzes: true } }
        },
        take: 10
      })

      // Lấy trạng thái kết bạn với từng user tìm thấy
      const userIds = users.map(u => u.id)
      const existingFriendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: myId, addresseeId: { in: userIds } },
            { requesterId: { in: userIds }, addresseeId: myId }
          ]
        }
      })

      const now = Date.now()
      const ONLINE_THRESHOLD = 3 * 60 * 1000

      const mappedUsers = users.map(u => {
        const rel = existingFriendships.find(
          f => (f.requesterId === myId && f.addresseeId === u.id) ||
               (f.requesterId === u.id && f.addresseeId === myId)
        )

        let friendStatus = 'none'
        let currentFriendshipId = null
        if (rel) {
          currentFriendshipId = rel.id
          if (rel.status === 'ACCEPTED') friendStatus = 'friends'
          else if (rel.requesterId === myId) friendStatus = 'sent'
          else friendStatus = 'received'
        }

        const isOnline = Boolean(
          u.lastActiveAt &&
          now - new Date(u.lastActiveAt).getTime() < ONLINE_THRESHOLD
        )

        return {
          id: u.id,
          username: u.username,
          name: u.name || u.username,
          email: u.email,
          avatar: u.avatar,
          phone: u.phone,
          role: u.role,
          quizCount: u._count?.quizzes || 0,
          isOnline,
          friendStatus,
          friendshipId: currentFriendshipId
        }
      })

      return NextResponse.json({ users: mappedUsers })
    }

    // ACTION: SEND FRIEND REQUEST
    if (action === 'request') {
      if (!targetId || targetId === myId) {
        return NextResponse.json({ error: 'Tài khoản không hợp lệ' }, { status: 400 })
      }

      // Kiểm tra người nhận có phải giáo viên / admin không
      const targetUser = await prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, role: true, name: true, username: true }
      })

      if (!targetUser || (targetUser.role !== 'TEACHER' && targetUser.role !== 'ADMIN')) {
        return NextResponse.json({ error: 'Chỉ có thể kết bạn với tài khoản Giáo viên hoặc Quản trị viên' }, { status: 400 })
      }

      // Kiểm tra đã có quan hệ chưa
      const existing = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: myId, addresseeId: targetId },
            { requesterId: targetId, addresseeId: myId }
          ]
        }
      })

      if (existing) {
        if (existing.status === 'ACCEPTED') {
          return NextResponse.json({ error: 'Hai bạn đã là bạn bè từ trước' }, { status: 400 })
        }
        if (existing.status === 'PENDING') {
          return NextResponse.json({ error: 'Đang có lời mời kết bạn chờ phản hồi' }, { status: 400 })
        }
        // Nếu trước đó rejected, cập nhật lại thành pending
        const updated = await prisma.friendship.update({
          where: { id: existing.id },
          data: { requesterId: myId, addresseeId: targetId, status: 'PENDING' }
        })
        return NextResponse.json({ success: true, message: 'Đã gửi lời mời kết bạn!', friendship: updated })
      }

      const created = await prisma.friendship.create({
        data: {
          requesterId: myId,
          addresseeId: targetId,
          status: 'PENDING'
        }
      })

      // Gửi thông báo tới giáo viên nhận
      try {
        const senderName = session.name || session.username || 'Một đồng nghiệp'
        await prisma.notification.create({
          data: {
            userId: targetId,
            title: '🤝 Lời mời kết bạn mới',
            message: `Giáo viên ${senderName} đã gửi lời mời kết bạn đến bạn trên Dzota.`
          }
        })
      } catch (e) {
        // bỏ qua
      }

      return NextResponse.json({ success: true, message: 'Đã gửi lời mời kết bạn thành công!', friendship: created })
    }

    // ACTION: ACCEPT FRIEND REQUEST
    if (action === 'accept') {
      const fId = friendshipId
      let targetFriendship = null

      if (fId) {
        targetFriendship = await prisma.friendship.findUnique({ where: { id: fId } })
      } else if (targetId) {
        targetFriendship = await prisma.friendship.findFirst({
          where: { requesterId: targetId, addresseeId: myId }
        })
      }

      if (!targetFriendship || targetFriendship.addresseeId !== myId) {
        return NextResponse.json({ error: 'Lời mời kết bạn không tồn tại hoặc không dành cho bạn' }, { status: 404 })
      }

      const accepted = await prisma.friendship.update({
        where: { id: targetFriendship.id },
        data: { status: 'ACCEPTED' }
      })

      // Gửi thông báo cho người gửi lời mời
      try {
        const myName = session.name || session.username || 'Giáo viên'
        await prisma.notification.create({
          data: {
            userId: targetFriendship.requesterId,
            title: '🎉 Lời mời kết bạn được chấp nhận',
            message: `Giáo viên ${myName} đã đồng ý kết bạn với bạn! Bây giờ 2 bạn có thể trò chuyện và chia sẻ đề thi cho nhau.`
          }
        })
      } catch (e) {}

      return NextResponse.json({ success: true, message: 'Đã đồng ý kết bạn!', friendship: accepted })
    }

    // ACTION: REJECT FRIEND REQUEST
    if (action === 'reject') {
      const fId = friendshipId
      let targetFriendship = null

      if (fId) {
        targetFriendship = await prisma.friendship.findUnique({ where: { id: fId } })
      } else if (targetId) {
        targetFriendship = await prisma.friendship.findFirst({
          where: { requesterId: targetId, addresseeId: myId }
        })
      }

      if (!targetFriendship) {
        return NextResponse.json({ error: 'Lời mời không tồn tại' }, { status: 404 })
      }

      await prisma.friendship.delete({
        where: { id: targetFriendship.id }
      })

      return NextResponse.json({ success: true, message: 'Đã từ chối lời mời kết bạn.' })
    }

    // ACTION: UNFRIEND
    if (action === 'unfriend') {
      if (!targetId) {
        return NextResponse.json({ error: 'Thiếu thông tin người bạn' }, { status: 400 })
      }

      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: myId, addresseeId: targetId },
            { requesterId: targetId, addresseeId: myId }
          ]
        }
      })

      if (friendship) {
        await prisma.friendship.delete({ where: { id: friendship.id } })
      }

      return NextResponse.json({ success: true, message: 'Đã hủy kết bạn thành công.' })
    }

    return NextResponse.json({ error: 'Hành động không hợp lệ' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
