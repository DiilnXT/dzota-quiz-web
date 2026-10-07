import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const isSuperAdminEmail = session.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
    const isDuylni = session.username?.toLowerCase() === 'duylniedu'
    const isSuperAdmin = isSuperAdminEmail || isDuylni

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: session.id },
          ...(session.email ? [{ email: session.email }] : []),
          ...(session.username ? [{ username: session.username }] : [])
        ]
      },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        role: true,
        maxTests: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const role = isSuperAdmin ? 'ADMIN' : (user.role || 'STUDENT')

    return NextResponse.json({
      authenticated: true,
      user: {
        ...user,
        role
      }
    })
  } catch (error: any) {
    return NextResponse.json({ authenticated: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const body = await request.json()
    const { name, avatar, phone } = body

    const updateData: any = {}
    if (name !== undefined) {
      updateData.name = String(name).trim() || null
    }
    if (avatar !== undefined) {
      updateData.avatar = String(avatar).trim() || null
    }
    if (phone !== undefined) {
      const cleanPhone = String(phone).trim()
      if (cleanPhone) {
        // Kiểm tra số điện thoại: bắt đầu bằng 0, chỉ chứa chữ số, đúng 10 chữ số
        const phoneRegex = /^0\d{9}$/
        if (!phoneRegex.test(cleanPhone)) {
          return NextResponse.json({
            error: 'Số điện thoại Zalo không hợp lệ! Vui lòng nhập đúng 10 chữ số và bắt đầu bằng số 0 (Ví dụ: 0912345678).'
          }, { status: 400 })
        }
        updateData.phone = cleanPhone
      } else {
        updateData.phone = null
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        avatar: true,
        phone: true,
        role: true
      }
    })

    // Cập nhật lại cookie session với dữ liệu mới
    cookieStore.set(
      'dzota_session',
      JSON.stringify({
        ...session,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        phone: updatedUser.phone
      }),
      { maxAge: 60 * 60 * 24 * 30, httpOnly: true, path: '/' }
    )

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Cập nhật thông tin thành công!'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
