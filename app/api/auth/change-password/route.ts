import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    let session: any = null
    try {
      session = JSON.parse(sessionStr)
    } catch (e) {
      return NextResponse.json({ error: 'Phiên đăng nhập không hợp lệ' }, { status: 401 })
    }

    const isUserAdmin =
      session.role?.toLowerCase() === 'admin' ||
      session.username?.toLowerCase() === 'duylniedu' ||
      session.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'

    const { newPassword, targetUserId } = await request.json()

    if (!newPassword || String(newPassword).trim().length < 4) {
      return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 4 ký tự' }, { status: 400 })
    }

    const cleanPassword = String(newPassword).trim()
    const targetId = targetUserId || session.id

    // Nếu sửa mật khẩu của tài khoản khác thì bắt buộc phải là Admin
    if (targetId !== session.id && !isUserAdmin) {
      return NextResponse.json({ error: 'Bạn không có quyền đổi mật khẩu người khác' }, { status: 403 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { password: cleanPassword }
    })

    return NextResponse.json({
      success: true,
      message: `Đã đổi mật khẩu cho tài khoản "${updatedUser.name || updatedUser.username}" thành công!`,
      username: updatedUser.username
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi khi cập nhật mật khẩu' }, { status: 500 })
  }
}
