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

// Thêm 1 học sinh vào lớp
export async function POST(request: Request) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const body = await request.json()
    const { classId, email, name } = body

    if (!classId || !email) {
      return NextResponse.json({ error: 'Vui lòng cung cấp mã lớp và email' }, { status: 400 })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    if (!cleanEmail.includes('@')) {
      return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 })
    }

    const classroom = await prisma.classroom.findUnique({ where: { id: classId } })
    if (!classroom) return NextResponse.json({ error: 'Lớp học không tồn tại' }, { status: 404 })
    if (!auth.isAdmin && classroom.teacherId !== auth.id) {
      return NextResponse.json({ error: 'Không có quyền thao tác trên lớp này' }, { status: 403 })
    }

    // Kiểm tra học sinh đã có trong lớp chưa
    const existing = await prisma.classroomStudent.findFirst({
      where: { classId, email: cleanEmail }
    })
    if (existing) {
      return NextResponse.json({ error: 'Học sinh với email này đã có trong lớp' }, { status: 400 })
    }

    const newStudent = await prisma.classroomStudent.create({
      data: {
        classId,
        email: cleanEmail,
        name: name ? String(name).trim() : cleanEmail.split('@')[0]
      }
    })

    return NextResponse.json({ success: true, student: newStudent })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Cập nhật thông tin & phân quyền chi tiết cho từng học sinh
export async function PUT(request: Request) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const body = await request.json()
    const { studentId, name, allowedSubjects, allowedQuizIds } = body

    if (!studentId) return NextResponse.json({ error: 'Thiếu ID học sinh' }, { status: 400 })

    const student = await prisma.classroomStudent.findUnique({
      where: { id: studentId },
      include: { class: true }
    })

    if (!student) return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 })
    if (!auth.isAdmin && student.class.teacherId !== auth.id) {
      return NextResponse.json({ error: 'Không có quyền sửa đổi học sinh này' }, { status: 403 })
    }

    const email = student.email.toLowerCase()

    // Cập nhật bảng ClassroomStudent
    const updatedStudent = await prisma.classroomStudent.update({
      where: { id: studentId },
      data: {
        ...(name !== undefined ? { name: String(name).trim() || email.split('@')[0] } : {}),
        ...(allowedSubjects !== undefined ? { allowedSubjects: JSON.stringify(allowedSubjects) } : {}),
        ...(allowedQuizIds !== undefined ? { allowedQuizIds: JSON.stringify(allowedQuizIds) } : {})
      }
    })

    // Đồng bộ quyền truy cập vào các bài test (QuickQuiz)
    if (Array.isArray(allowedQuizIds)) {
      const targetQuizIds = allowedQuizIds

      // 1. Thêm email học sinh vào danh sách allowedGmails của các bài thi được cấp quyền
      for (const qId of targetQuizIds) {
        const quiz = await prisma.quickQuiz.findUnique({ where: { id: qId }, select: { data: true } })
        if (!quiz) continue

        let parsed: any = {}
        try { parsed = JSON.parse(quiz.data) } catch (e) { parsed = {} }
        if (!parsed.config) parsed.config = {}

        if (parsed.config.accessType !== 'public') {
          parsed.config.accessType = 'restricted'
        }
        const currentGmails: string[] = Array.isArray(parsed.config.allowedGmails)
          ? parsed.config.allowedGmails.map((g: string) => g.toLowerCase())
          : []

        if (!currentGmails.includes(email)) {
          currentGmails.push(email)
          parsed.config.allowedGmails = currentGmails

          await prisma.quickQuiz.update({
            where: { id: qId },
            data: { data: JSON.stringify(parsed) }
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      student: updatedStudent,
      message: 'Đã cập nhật phân quyền học sinh thành công!'
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Xóa học sinh khỏi lớp
export async function DELETE(request: Request) {
  const auth = await getAuth()
  if (!auth) return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })

  try {
    const { studentId } = await request.json()
    if (!studentId) return NextResponse.json({ error: 'Thiếu ID học sinh' }, { status: 400 })

    const student = await prisma.classroomStudent.findUnique({
      where: { id: studentId },
      include: { class: true }
    })

    if (!student) return NextResponse.json({ error: 'Không tìm thấy học sinh' }, { status: 404 })
    if (!auth.isAdmin && student.class.teacherId !== auth.id) {
      return NextResponse.json({ error: 'Không có quyền xóa học sinh này' }, { status: 403 })
    }

    await prisma.classroomStudent.delete({ where: { id: studentId } })
    return NextResponse.json({ success: true, message: 'Đã xóa học sinh khỏi lớp' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
