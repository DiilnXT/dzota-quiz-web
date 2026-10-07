import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    if (!sessionStr) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const session = JSON.parse(sessionStr)
    const isSuperAdminEmail = session.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com'
    const isDuylni = session.username?.toLowerCase() === 'duylniedu'
    const isUserAdmin = session.role?.toLowerCase() === 'admin' || isDuylni || isSuperAdminEmail

    const body = await request.json()
    const { quizIds, accessType, allowedGmails, mode } = body

    if (!Array.isArray(quizIds) || quizIds.length === 0) {
      return NextResponse.json({ error: 'Vui lòng chọn ít nhất 1 bài thi' }, { status: 400 })
    }

    // Chuẩn hóa danh sách Gmail (viết thường, loại bỏ trùng lặp và khoảng trắng)
    const cleanGmails: string[] = Array.from(
      new Set(
        (Array.isArray(allowedGmails) ? allowedGmails : String(allowedGmails || '').split('\n'))
          .map(g => String(g).trim().toLowerCase())
          .filter(g => g.length > 0 && g.includes('@'))
      )
    )

    let updatedCount = 0

    for (const qId of quizIds) {
      const quiz = await prisma.quickQuiz.findUnique({
        where: { id: qId },
        select: { id: true, authorId: true, data: true }
      })

      if (!quiz) continue

      // Kiểm tra quyền: Admin hoặc tác giả mới được sửa quyền đề
      if (!isUserAdmin && quiz.authorId && quiz.authorId !== session.id) {
        continue
      }

      let parsed: any = {}
      try {
        parsed = JSON.parse(quiz.data)
      } catch (e) {
        parsed = {}
      }

      if (!parsed.config) parsed.config = {}

      parsed.config.accessType = accessType || (cleanGmails.length > 0 ? 'restricted' : 'public')

      if (mode === 'append' && Array.isArray(parsed.config.allowedGmails)) {
        const existingSet = new Set(parsed.config.allowedGmails.map((e: string) => e.toLowerCase()))
        cleanGmails.forEach(g => existingSet.add(g))
        parsed.config.allowedGmails = Array.from(existingSet)
      } else {
        parsed.config.allowedGmails = cleanGmails
      }

      await prisma.quickQuiz.update({
        where: { id: qId },
        data: {
          data: JSON.stringify(parsed)
        }
      })
      updatedCount++
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `Đã cập nhật quyền làm bài cho ${updatedCount} bài thi thành công!`
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
