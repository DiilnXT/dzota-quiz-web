import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function getAuth() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return null
  try {
    const session = JSON.parse(sessionStr)
    const isSuperAdminEmail = session.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
    const isDuylni = session.username?.toLowerCase() === 'duylniedu'
    const isAdmin = session.role?.toLowerCase() === 'admin' || isDuylni || isSuperAdminEmail
    return { ...session, isAdmin }
  } catch (e) {
    return null
  }
}

export async function GET() {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const whereClause: any = {}
    if (!auth.isAdmin) {
      whereClause.teacherId = auth.id
    }

    const classes = await prisma.classroom.findMany({
      where: whereClause,
      include: {
        students: {
          orderBy: { createdAt: 'desc' }
        },
        teacher: {
          select: { id: true, name: true, username: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ classes })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const body = await request.json()
    const { name, description, studentEmails } = body

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Vui lòng nhập tên Lớp học' }, { status: 400 })
    }

    // Parse student emails
    const rawEmails: string[] = Array.isArray(studentEmails)
      ? studentEmails
      : String(studentEmails || '').split('\n')

    const cleanEmails = Array.from(
      new Set(
        rawEmails
          .map(e => e.trim().toLowerCase())
          .filter(e => e.length > 0 && e.includes('@'))
      )
    )

    const classroom = await prisma.classroom.create({
      data: {
        name: name.trim(),
        description: description ? description.trim() : null,
        teacherId: auth.id,
        students: {
          create: cleanEmails.map(email => ({
            email,
            name: email.split('@')[0]
          }))
        }
      },
      include: {
        students: true
      }
    })

    return NextResponse.json({ success: true, classroom })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const body = await request.json()
    const { id, name, description, studentEmails } = body

    if (!id) return NextResponse.json({ error: 'Thiếu ID lớp học' }, { status: 400 })

    const existing = await prisma.classroom.findUnique({
      where: { id },
      include: { students: true }
    })

    if (!existing) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 })
    if (!auth.isAdmin && existing.teacherId !== auth.id) {
      return NextResponse.json({ error: 'Bạn không có quyền chỉnh sửa lớp học này' }, { status: 403 })
    }

    // Parse emails if provided
    let studentsUpdate: any = undefined
    if (studentEmails !== undefined) {
      const rawEmails: string[] = Array.isArray(studentEmails)
        ? studentEmails
        : String(studentEmails || '').split('\n')

      const cleanEmails = Array.from(
        new Set(
          rawEmails
            .map(e => e.trim().toLowerCase())
            .filter(e => e.length > 0 && e.includes('@'))
        )
      )

      // Xóa học sinh cũ và thêm danh sách mới
      await prisma.classroomStudent.deleteMany({ where: { classId: id } })
      studentsUpdate = {
        create: cleanEmails.map(email => ({
          email,
          name: email.split('@')[0]
        }))
      }
    }

    const updated = await prisma.classroom.update({
      where: { id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        description: description !== undefined ? (description?.trim() || null) : existing.description,
        ...(studentsUpdate ? { students: studentsUpdate } : {})
      },
      include: { students: true }
    })

    return NextResponse.json({ success: true, classroom: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Thiếu ID lớp học' }, { status: 400 })

    const existing = await prisma.classroom.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Không tìm thấy lớp học' }, { status: 404 })
    if (!auth.isAdmin && existing.teacherId !== auth.id) {
      return NextResponse.json({ error: 'Bạn không có quyền xóa lớp học này' }, { status: 403 })
    }

    await prisma.classroom.delete({ where: { id } })
    return NextResponse.json({ success: true, message: 'Đã xóa lớp học thành công' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
