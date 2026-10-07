import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function isAdmin() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return false
  try {
    const session = JSON.parse(sessionStr)
    return (
      session.role?.toLowerCase() === 'admin' ||
      session.username?.toLowerCase() === 'duylniedu' ||
      session.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
    )
  } catch (e) { return false }
}

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        maxTests: true,
        password: true,
        createdAt: true,
        _count: { select: { quizzes: true, notifications: true } },
        quizzes: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            data: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    // Parse quiz config for convenient stats
    const formatted = users.map(u => ({
      ...u,
      quizzes: u.quizzes.map(q => {
        let parsedConfig: any = {}
        try {
          const d = JSON.parse(q.data)
          parsedConfig = d.config || {}
        } catch (e) {}
        return {
          id: q.id,
          title: q.title,
          createdAt: q.createdAt,
          isActive: parsedConfig.isActive !== false,
          category: parsedConfig.category || 'Chung',
          timeLimit: parsedConfig.timeLimit || 15
        }
      })
    }))

    return NextResponse.json(formatted)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    let { email, name, username, password, maxTests, role } = body
    
    // Nếu nhập Gmail thì chuẩn hóa email
    const cleanEmail = email ? String(email).trim().toLowerCase() : null
    const cleanName = name ? String(name).trim() : null
    
    // Tên đăng nhập mặc định là email hoặc username
    let cleanUsername = username ? String(username).trim() : (cleanEmail || '')
    if (!cleanUsername) {
      return NextResponse.json({ error: 'Vui lòng nhập Email hoặc Tên tài khoản' }, { status: 400 })
    }

    // Mật khẩu mặc định nếu đăng nhập bằng mật khẩu
    const cleanPassword = password ? String(password).trim() : 'Gv@123456'
    const cleanRole = role ? String(role).toUpperCase() : 'TEACHER'
    const limit = Number(maxTests) > 0 ? Number(maxTests) : 10

    // Kiểm tra xem đã có user với email hoặc username này chưa
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          ...(cleanEmail ? [{ email: cleanEmail }] : [])
        ]
      }
    })

    if (existing) {
      // Nếu đã có sẵn thì cập nhật thông tin và cấp quyền
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: cleanEmail || existing.email,
          name: cleanName || existing.name,
          role: cleanRole,
          maxTests: limit,
          ...(password ? { password: cleanPassword } : {})
        }
      })
      return NextResponse.json({ ...updated, message: 'Đã cập nhật và phân quyền giáo viên thành công!' })
    }

    // Tạo mới tài khoản
    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        name: cleanName || (cleanEmail ? cleanEmail.split('@')[0] : cleanUsername),
        password: cleanPassword,
        role: cleanRole,
        maxTests: limit
      }
    })

    // Tự động tạo một thông báo chào mừng đầu tiên từ Admin
    try {
      await prisma.notification.create({
        data: {
          userId: newUser.id,
          title: 'Chào mừng bạn đến với Dzota Education!',
          message: `Tài khoản của bạn đã được Quản trị viên cấp quyền ${cleanRole === 'ADMIN' ? 'Quản trị viên' : 'Giáo viên'} với hạn mức tạo ${limit} đề thi. Chúc bạn làm việc hiệu quả!`
        }
      })
    } catch (e) {}

    return NextResponse.json(newUser)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}

export async function PUT(request: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const { id, name, email, maxTests, password, role } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing user id' }, { status: 400 })

    const updateData: any = {}
    if (name !== undefined) updateData.name = String(name).trim()
    if (email !== undefined) updateData.email = email ? String(email).trim().toLowerCase() : null
    if (maxTests !== undefined) updateData.maxTests = Number(maxTests)
    if (password) updateData.password = String(password).trim()
    if (role) updateData.role = String(role).toUpperCase()

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
    if (!user) return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })

    if (
      user.username?.toLowerCase() === 'duylniedu' ||
      user.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
    ) {
      return NextResponse.json({ error: 'Không thể xóa tài khoản Quản trị viên tối cao' }, { status: 400 })
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Đã xóa tài khoản' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
