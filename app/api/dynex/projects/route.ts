import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'
import os from 'os'

export const dynamic = 'force-dynamic'

const FALLBACK_DIR = path.join(os.tmpdir(), 'dynex_data')
const PROJECTS_FILE = path.join(FALLBACK_DIR, 'shared_projects.json')

function getLocalProjects(): any[] | null {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const raw = fs.readFileSync(PROJECTS_FILE, 'utf8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    }
  } catch (e) {
    console.warn('Error reading local fallback projects:', e)
  }
  return null
}

function saveLocalProjects(projects: any[]): void {
  try {
    if (!fs.existsSync(FALLBACK_DIR)) {
      fs.mkdirSync(FALLBACK_DIR, { recursive: true })
    }
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(projects), 'utf8')
  } catch (e) {
    console.warn('Error saving local fallback projects:', e)
  }
}

// GET /api/dynex/projects (Sync curriculum across devices & incognito)
export async function GET() {
  try {
    // 1. Try Prisma SystemSetting
    if (prisma) {
      try {
        const setting = await prisma.systemSetting.findUnique({
          where: { key: 'dynex_global_curriculum_v2' }
        })
        if (setting && setting.value) {
          const parsed = JSON.parse(setting.value)
          if (Array.isArray(parsed) && parsed.length > 0) {
            return NextResponse.json({ projects: parsed })
          }
        }
      } catch (e) {}

      // Try QuickQuiz container
      try {
        const quiz = await prisma.quickQuiz.findUnique({
          where: { id: 'dynex_global_curriculum' }
        })
        if (quiz && quiz.data) {
          const parsed = JSON.parse(quiz.data)
          if (Array.isArray(parsed.projects)) {
            return NextResponse.json({ projects: parsed.projects })
          }
        }
      } catch (e) {}
    }
  } catch (e) {
    console.warn('Prisma projects fetch skipped:', e)
  }

  // 2. Fallback to local file
  const localList = getLocalProjects()
  if (localList) {
    return NextResponse.json({ projects: localList })
  }

  return NextResponse.json({ projects: [] })
}

// POST /api/dynex/projects (Save full curriculum from Admin)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const projects = Array.isArray(body) ? body : body.projects
    if (!Array.isArray(projects)) {
      return NextResponse.json({ error: 'Dữ liệu projects không hợp lệ' }, { status: 400 })
    }

    saveLocalProjects(projects)

    // Save to Prisma
    if (prisma) {
      try {
        await prisma.systemSetting.upsert({
          where: { key: 'dynex_global_curriculum_v2' },
          update: { value: JSON.stringify(projects) },
          create: { key: 'dynex_global_curriculum_v2', value: JSON.stringify(projects) }
        }).catch(() => {})

        await prisma.quickQuiz.upsert({
          where: { id: 'dynex_global_curriculum' },
          update: {
            title: 'DYNEX Global Medical Curriculum',
            data: JSON.stringify({ type: 'dynex_projects', projects })
          },
          create: {
            id: 'dynex_global_curriculum',
            title: 'DYNEX Global Medical Curriculum',
            data: JSON.stringify({ type: 'dynex_projects', projects })
          }
        }).catch(() => {})
      } catch (e) {}
    }

    return NextResponse.json({ success: true, count: projects.length })
  } catch (e: any) {
    console.error('Error in POST /api/dynex/projects:', e)
    return NextResponse.json({ error: e?.message || 'Lỗi lưu projects' }, { status: 500 })
  }
}
