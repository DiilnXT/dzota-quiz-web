import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const dynamic = 'force-dynamic'

const FALLBACK_DIR = path.join(os.tmpdir(), 'dynex_data')
const FALLBACK_FILE = path.join(FALLBACK_DIR, 'saved_exams.json')

function getLocalExams(): any[] {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const raw = fs.readFileSync(FALLBACK_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (e) {
    console.warn('Error reading local fallback exams:', e)
  }
  return []
}

function saveLocalExams(exams: any[]): void {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true })
    }
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(exams), 'utf8')
  } catch (e) {
    console.warn('Error saving local fallback exams:', e)
  }
}

// Compress / De-duplicate station images to prevent Vercel 4.5MB limit
function compressExamForStorage(exam: any): any {
  if (!exam || !exam.stations) return exam
  const imagesMap: Record<string, string> = {}
  
  const optimizedStations = exam.stations.map((st: any) => {
    const imgKey = st.imageId || `img_${st.stationIndex}`
    if (st.imageUrl && !imagesMap[imgKey]) {
      imagesMap[imgKey] = st.imageUrl
    }

    return {
      ...st,
      // Keep reference to image key to avoid repeating huge base64 strings
      imageKey: imgKey,
      imageUrl: st.imageUrl?.startsWith('http') ? st.imageUrl : undefined // only keep full url if short
    }
  })

  return {
    ...exam,
    imagesMap,
    stations: optimizedStations
  }
}

// Decompress / Restore station images when returning to client
function decompressExam(exam: any): any {
  if (!exam || !exam.stations) return exam
  const imagesMap = exam.imagesMap || {}

  const restoredStations = exam.stations.map((st: any) => {
    const fallbackUrl = st.imageKey ? imagesMap[st.imageKey] : undefined
    return {
      ...st,
      imageUrl: st.imageUrl || fallbackUrl || ''
    }
  })

  return {
    ...exam,
    stations: restoredStations
  }
}

// GET /api/dynex/exams?id=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const examId = searchParams.get('id')

  try {
    // 1. Try Prisma QuickQuiz or SystemSetting
    if (prisma) {
      if (examId) {
        // A. Check QuickQuiz
        try {
          const found = await prisma.quickQuiz.findUnique({
            where: { id: examId }
          })
          if (found && found.data) {
            const dataObj = JSON.parse(found.data)
            const rawExam = dataObj.exam || dataObj
            return NextResponse.json({ exam: decompressExam(rawExam) })
          }
        } catch (e) {}

        // B. Check SystemSetting
        try {
          const setting = await prisma.systemSetting.findUnique({
            where: { key: `dynex_exam_${examId}` }
          })
          if (setting && setting.value) {
            const rawExam = JSON.parse(setting.value)
            return NextResponse.json({ exam: decompressExam(rawExam) })
          }
        } catch (e) {}
      } else {
        // List all exams
        try {
          const rows = await prisma.quickQuiz.findMany({
            where: {
              data: { contains: 'dynex_osce' }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
          })
          if (rows && rows.length > 0) {
            const exams = rows.map((r: any) => {
              try {
                const parsed = JSON.parse(r.data)
                return decompressExam(parsed.exam || parsed)
              } catch {
                return null
              }
            }).filter(Boolean)
            if (exams.length > 0) {
              return NextResponse.json({ exams })
            }
          }
        } catch (e) {}
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
      return NextResponse.json({ exam: decompressExam(found) })
    }
    return NextResponse.json({ error: 'Không tìm thấy đề thi với mã này' }, { status: 404 })
  }

  return NextResponse.json({ exams: localList.map(decompressExam) })
}

// POST /api/dynex/exams (Save/Publish exam across devices)
export async function POST(req: NextRequest) {
  try {
    const rawExam = await req.json()
    if (!rawExam || !rawExam.id) {
      return NextResponse.json({ error: 'Dữ liệu đề thi không hợp lệ' }, { status: 400 })
    }

    const exam = compressExamForStorage(rawExam)

    // 1. Save to local fallback file
    const localList = getLocalExams()
    const idx = localList.findIndex((item: any) => item.id === exam.id)
    if (idx >= 0) {
      localList[idx] = exam
    } else {
      localList.unshift(exam)
    }
    saveLocalExams(localList)

    // 2. Try saving to Prisma QuickQuiz & SystemSetting
    let dbSaved = false
    try {
      if (prisma) {
        const payloadData = JSON.stringify({
          type: 'dynex_osce',
          exam
        })

        // A. Upsert QuickQuiz
        try {
          await prisma.quickQuiz.upsert({
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
          dbSaved = true
        } catch (errQ) {
          console.warn('QuickQuiz upsert error, trying SystemSetting:', errQ)
        }

        // B. Upsert SystemSetting as secondary backup
        try {
          await prisma.systemSetting.upsert({
            where: { key: `dynex_exam_${exam.id}` },
            update: { value: JSON.stringify(exam) },
            create: { key: `dynex_exam_${exam.id}`, value: JSON.stringify(exam) }
          })
          dbSaved = true
        } catch (errS) {
          console.warn('SystemSetting upsert error:', errS)
        }
      }
    } catch (e) {
      console.warn('Prisma database sync failed:', e)
    }

    return NextResponse.json({ success: true, exam: decompressExam(exam), dbSaved })
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
    if (prisma) {
      await prisma.quickQuiz.delete({ where: { id: examId } }).catch(() => {})
      await prisma.systemSetting.delete({ where: { key: `dynex_exam_${examId}` } }).catch(() => {})
    }
  } catch (e) {}

  return NextResponse.json({ success: true })
}
