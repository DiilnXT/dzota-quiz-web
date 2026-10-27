import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

const FALLBACK_DIR = path.join(process.cwd(), '.dynex_data')
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'saved_exams.json')

function getLocalExams(): any[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.error('Error reading local fallback exams:', e)
  }
  return []
}

function saveLocalExams(exams: any[]): void {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true })
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(exams, null, 2), 'utf8')
  } catch (e) {
    console.error('Error saving local fallback exams:', e)
  }
}

// GET /api/dynex/exams?id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const examId = searchParams.get('id')

  try {
    // 1. Try Prisma QuickQuiz table
    if (prisma && (prisma as any).quickQuiz) {
      if (examId) {
        const found = await (prisma as any).quickQuiz.findUnique({
          where: { id: examId }
        })
        if (found) {
          try {
            const dataObj = JSON.parse(found.data)
            const exam = dataObj.exam || dataObj
            return NextResponse.json({ exam })
          } catch (e) {}
        }
      } else {
        // List all
        const rows = await (prisma as any).quickQuiz.findMany({
          where: {
            data: { contains: 'dynex_osce' }
          },
          orderBy: { createdAt: 'desc' }
        })
        if (rows && rows.length > 0) {
          const exams = rows.map((r: any) => {
            try {
              const parsed = JSON.parse(r.data)
              return parsed.exam || parsed
            } catch {
              return null
            }
          }).filter(Boolean)
          if (exams.length > 0) {
            return NextResponse.json({ exams })
          }
        }
      }
    }
  } catch (e) {
    console.warn('Prisma exams query skipped:', e)
  }

  // 2. Fallback to local file cache
  const localList = getLocalExams()
  if (examId) {
    const found = localList.find((e: any) => e.id === examId)
    if (found) {
      return NextResponse.json({ exam: found })
    }
    return NextResponse.json({ error: 'Không tìm thấy đề thi với mã này' }, { status: 404 })
  }

  return NextResponse.json({ exams: localList })
}

// POST /api/dynex/exams (Save/Publish exam)
export async function POST(req: NextRequest) {
  try {
    const exam = await req.json()
    if (!exam || !exam.id) {
      return NextResponse.json({ error: 'Dữ liệu đề thi không hợp lệ' }, { status: 400 })
    }

    // 1. Save to local fallback file
    const localList = getLocalExams()
    const idx = localList.findIndex((item: any) => item.id === exam.id)
    if (idx >= 0) {
      localList[idx] = exam
    } else {
      localList.unshift(exam)
    }
    saveLocalExams(localList)

    // 2. Try saving to Prisma QuickQuiz
    try {
      if (prisma && (prisma as any).quickQuiz) {
        const payloadData = JSON.stringify({
          type: 'dynex_osce',
          exam
        })
        await (prisma as any).quickQuiz.upsert({
          where: { id: exam.id },
          update: {
            title: exam.title || 'Đề Thi Chạy Trạm OSCE',
            data: payloadData
          },
          create: {
            id: exam.id,
            title: exam.title || 'Đề Thi Chạy Trạm OSCE',
            data: payloadData
          }
        })
      }
    } catch (e) {
      console.warn('Prisma quickQuiz upsert skipped:', e)
    }

    return NextResponse.json({ success: true, exam })
  } catch (e: any) {
    console.error('Error in POST /api/dynex/exams:', e)
    return NextResponse.json({ error: e?.message || 'Lỗi lưu đề thi' }, { status: 500 })
  }
}

// DELETE /api/dynex/exams?id=...
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const examId = searchParams.get('id')
  if (!examId) {
    return NextResponse.json({ error: 'Thiếu examId' }, { status: 400 })
  }

  // 1. Delete from local cache
  const localList = getLocalExams()
  const filtered = localList.filter((item: any) => item.id !== examId)
  saveLocalExams(filtered)

  // 2. Delete from Prisma
  try {
    if (prisma && (prisma as any).quickQuiz) {
      await (prisma as any).quickQuiz.delete({
        where: { id: examId }
      })
    }
  } catch (e) {}

  return NextResponse.json({ success: true })
}
