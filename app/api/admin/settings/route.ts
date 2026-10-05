import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

async function isAdmin() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  if (!sessionStr) return false
  try {
    const session = JSON.parse(sessionStr)
    return session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'
  } catch (e) {
    return false
  }
}

// GET: Lấy cài đặt Gemini API & Models (chỉ admin xem được đầy đủ keys, client làm test chỉ gọi qua server API giải thích)
export async function GET() {
  try {
    const isUserAdmin = await isAdmin()
    
    // Thử lấy từ database
    let keysSetting: any = null
    let modelSetting: any = null
    let availableModelsSetting: any = null

    try {
      if ((prisma as any).systemSetting) {
        keysSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_API_KEYS' } })
        modelSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_ACTIVE_MODEL' } })
        availableModelsSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_AVAILABLE_MODELS' } })
      }
    } catch (e) {
      console.warn('SystemSetting table not ready in DB, using fallback')
    }

    const defaultModels = [
      'gemini-2.5-flash',
      'gemini-2.5-pro',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ]

    const apiKeys = keysSetting?.value || process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || ''
    const activeModel = modelSetting?.value || 'gemini-2.5-flash'
    const availableModels = availableModelsSetting?.value
      ? JSON.parse(availableModelsSetting.value)
      : defaultModels

    if (!isUserAdmin) {
      // Non-admin chỉ cần biết cấu hình đã có key hay chưa và model đang dùng
      return NextResponse.json({
        hasKeys: Boolean(apiKeys.trim()),
        activeModel,
        keyCount: apiKeys.split(',').filter(Boolean).length
      })
    }

    return NextResponse.json({
      apiKeys,
      activeModel,
      availableModels
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Lưu cài đặt Gemini API & Models (chỉ admin)
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 })
  }

  try {
    const { apiKeys, activeModel, availableModels } = await request.json()

    if ((prisma as any).systemSetting) {
      if (apiKeys !== undefined) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'GEMINI_API_KEYS' },
          update: { value: String(apiKeys).trim() },
          create: { key: 'GEMINI_API_KEYS', value: String(apiKeys).trim() }
        })
      }

      if (activeModel !== undefined) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'GEMINI_ACTIVE_MODEL' },
          update: { value: String(activeModel).trim() },
          create: { key: 'GEMINI_ACTIVE_MODEL', value: String(activeModel).trim() }
        })
      }

      if (availableModels !== undefined) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'GEMINI_AVAILABLE_MODELS' },
          update: { value: JSON.stringify(availableModels) },
          create: { key: 'GEMINI_AVAILABLE_MODELS', value: JSON.stringify(availableModels) }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Đã lưu cấu hình AI Gemini thành công!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
