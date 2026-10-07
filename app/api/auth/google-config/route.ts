import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

const DEFAULT_GOOGLE_CLIENT_ID = '900284408463-uie2edl4gq37pkk81a7bkhuud3fooeh2.apps.googleusercontent.com'

// GET: Lấy Google Client ID đã cấu hình
export async function GET() {
  try {
    let clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || ''

    if (!clientId) {
      try {
        if ((prisma as any).systemSetting) {
          const setting = await (prisma as any).systemSetting.findUnique({
            where: { key: 'GOOGLE_CLIENT_ID' }
          })
          if (setting?.value) {
            clientId = setting.value
          }
        }
      } catch (e) {}
    }

    if (!clientId) {
      clientId = DEFAULT_GOOGLE_CLIENT_ID
    }

    return NextResponse.json({ clientId: clientId.trim() })
  } catch (error: any) {
    return NextResponse.json({ clientId: DEFAULT_GOOGLE_CLIENT_ID })
  }
}

// POST: Lưu Google Client ID (cho phép Admin hoặc cấu hình ban đầu)
export async function POST(request: Request) {
  try {
    const { clientId } = await request.json()
    const cleanId = String(clientId || '').trim()

    if (!cleanId) {
      return NextResponse.json({ error: 'Vui lòng cung cấp Client ID hợp lệ từ Google.' }, { status: 400 })
    }

    if (!cleanId.includes('.apps.googleusercontent.com')) {
      return NextResponse.json({ 
        error: 'Google Client ID phải có đuôi kết thúc bằng ".apps.googleusercontent.com". Vui lòng kiểm tra lại.' 
      }, { status: 400 })
    }

    // Kiểm tra quyền: nếu đã có phiên admin hoặc chưa có client id nào trong hệ thống
    const cookieStore = await cookies()
    const sessionStr = cookieStore.get('dzota_session')?.value
    let isUserAdmin = false
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr)
        isUserAdmin = session.role?.toLowerCase() === 'admin' || session.username?.toLowerCase() === 'duylniedu'
      } catch (e) {}
    }

    let existingSetting: any = null
    try {
      if ((prisma as any).systemSetting) {
        existingSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GOOGLE_CLIENT_ID' } })
      }
    } catch (e) {}

    // Cho phép lưu nếu:
    // 1. Chưa có client ID nào trong DB (cấu hình lần đầu)
    // 2. Hoặc người lưu là Admin
    if (existingSetting?.value && !isUserAdmin) {
      return NextResponse.json({ error: 'Chỉ Quản trị viên (Admin) mới có quyền thay đổi Google Client ID.' }, { status: 403 })
    }

    try {
      if ((prisma as any).systemSetting) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'GOOGLE_CLIENT_ID' },
          update: { value: cleanId },
          create: { key: 'GOOGLE_CLIENT_ID', value: cleanId }
        })
      }
    } catch (e: any) {
      console.warn('Could not save Google Client ID into systemSetting table:', e)
    }

    return NextResponse.json({ success: true, clientId: cleanId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
