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
    let isUserAdmin = false
    let currentUsername = 'DuylniEdu'
    
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        authorId = session.id
        currentUsername = session.username || 'DuylniEdu'
        isUserAdmin = session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'
        
        // Check max limits for non-admin
        if (!isUserAdmin) {
          const user = await prisma.user.findUnique({ where: { id: authorId }, include: { _count: { select: { quizzes: true } } } })
          if (user && user._count.quizzes >= user.maxTests) {
            return NextResponse.json({ error: `Bạn đã đạt giới hạn tạo tối đa ${user.maxTests} bài test.` }, { status: 403 })
          }
        }
      } catch (e) {}
    }
    
    // Check permission if updating an existing quiz
    const existing = await prisma.quickQuiz.findUnique({ 
      where: { id }, 
      select: { authorId: true, author: { select: { username: true } } } 
    })

    if (existing) {
      // Đề đã tồn tại: Chỉ tác giả hoặc Admin mới được phép chỉnh sửa
      if (!isUserAdmin && existing.authorId && existing.authorId !== authorId) {
        return NextResponse.json({ 
          error: 'Bạn không có quyền chỉnh sửa đề thi của người khác! Chỉ tác giả tạo đề hoặc Admin mới có quyền này.' 
        }, { status: 403 })
      }
    }

    // Attach author info into data object for convenience
    if (!data.author) {
      data.author = { id: authorId, username: currentUsername }
    }
    data.authorId = authorId || existing?.authorId || null

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
    const filter = searchParams.get('filter') // 'all' (only for admin), 'mine' or undefined
    
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    let currentSession: any = null
    let isUserAdmin = false
    
    if (sessionStr) {
      try {
        currentSession = JSON.parse(sessionStr)
        isUserAdmin = currentSession.role?.toLowerCase() === 'admin' || currentSession.username?.toLowerCase() === 'duylniedu'
      } catch (e) {}
    }

    // ─── 1. LẤY TOÀN BỘ DANH SÁCH CHO CREATOR / THƯ VIỆN ──────────────
    if (!id || id === 'all') {
      // Build filter query:
      // - Nếu là Admin và filter !== 'mine': cho phép xem tất cả (khi admin muốn)
      // - Nếu là Admin và filter === 'mine': chỉ xem đề của Admin
      // - Nếu là Giáo viên bình thường (non-admin): CHỈ XEM ĐỀ CỦA CHÍNH MÌNH (luôn luôn lọc theo authorId)
      let whereClause: any = {}
      if (!isUserAdmin) {
        if (currentSession?.id) {
          whereClause = { authorId: currentSession.id }
        } else {
          // Chưa đăng nhập mà gọi list: không trả về gì
          return NextResponse.json([])
        }
      } else {
        // Admin
        if (filter === 'mine' && currentSession?.id) {
          whereClause = { authorId: currentSession.id }
        }
      }

      const quizzes = await prisma.quickQuiz.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, username: true } }
        }
      })

      const list = quizzes.map(q => {
        try {
          const parsed = JSON.parse(q.data)
          return {
            ...parsed,
            id: q.id,
            title: q.title,
            authorId: q.authorId,
            author: q.author ? { id: q.author.id, username: q.author.username } : (parsed.author || null)
          }
        } catch (e) {
          return {
            id: q.id,
            title: q.title,
            authorId: q.authorId,
            author: q.author ? { id: q.author.id, username: q.author.username } : null,
            config: { title: q.title },
            questions: []
          }
        }
      })
      return NextResponse.json(list)
    }
    
    // ─── 2. LẤY MỘT ĐỀ CỤ THỂ ĐỂ LÀM BÀI HOẶC CHỈNH SỬA ───────────────
    const quiz = await prisma.quickQuiz.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true } }
      }
    })
    
    if (!quiz) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    const parsed = JSON.parse(quiz.data)
    return NextResponse.json({
      ...parsed,
      id: quiz.id,
      title: quiz.title,
      authorId: quiz.authorId,
      author: quiz.author ? { id: quiz.author.id, username: quiz.author.username } : (parsed.author || null)
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const isUserAdmin = session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'

    const existing = await prisma.quickQuiz.findUnique({ where: { id }, select: { authorId: true } })
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })
    }

    // Phân quyền xóa: Admin hoặc chính tác giả
    if (!isUserAdmin && existing.authorId && existing.authorId !== session.id) {
      return NextResponse.json({ 
        error: 'Bạn không thể xóa đề thi của người khác! Chỉ tác giả tạo đề mới có quyền này.' 
      }, { status: 403 })
    }

    await prisma.quickQuiz.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Đã xóa đề thi thành công!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, isActive } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ error: 'Bạn chưa đăng nhập' }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const isUserAdmin = session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'

    const existing = await prisma.quickQuiz.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Không tìm thấy đề thi' }, { status: 404 })
    }

    // Phân quyền bật/tắt (khóa/mở): Admin hoặc chính tác giả
    if (!isUserAdmin && existing.authorId && existing.authorId !== session.id) {
      return NextResponse.json({ 
        error: 'Bạn không có quyền thay đổi trạng thái đề thi của người khác!' 
      }, { status: 403 })
    }

    let parsed: any = {}
    try { parsed = JSON.parse(existing.data) } catch (e) {}
    if (!parsed.config) parsed.config = {}
    if (isActive !== undefined) {
      parsed.config.isActive = Boolean(isActive)
    }

    await prisma.quickQuiz.update({
      where: { id },
      data: { data: JSON.stringify(parsed) }
    })

    return NextResponse.json({ success: true, isActive: parsed.config.isActive })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
