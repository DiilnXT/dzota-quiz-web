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
    let activeBgSetting: any = null
    let activeBgDesktopSetting: any = null
    let activeBgMobileSetting: any = null
    let activeBgGallerySetting: any = null

    try {
      if ((prisma as any).systemSetting) {
        keysSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_API_KEYS' } })
        modelSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_ACTIVE_MODEL' } })
        availableModelsSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_AVAILABLE_MODELS' } })
        activeBgSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'ACTIVE_BG_ENABLED' } })
        activeBgDesktopSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'ACTIVE_BG_DESKTOP' } })
        activeBgMobileSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'ACTIVE_BG_MOBILE' } })
        activeBgGallerySetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'ACTIVE_BG_GALLERY' } })
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
    // Mặc định là true (bật ảnh background) trừ khi admin tắt explicitly thành 'false'
    const activeBgEnabled = activeBgSetting ? activeBgSetting.value !== 'false' : true
    const activeBgDesktop = activeBgDesktopSetting?.value || ''
    const activeBgMobile = activeBgMobileSetting?.value || ''
    
    // Thư viện ảnh mặc định
    const defaultGallery = [
      { id: 'def_d1', name: 'Thiên Nhiên Núi Rừng (Mặc định PC)', device: 'desktop', url: 'https://i.ibb.co/xqxLMLNj/1a348e38-aec7-4e9a-9bbe-69ff1c4af67d.png' },
      { id: 'def_m1', name: 'Thung Lũng Xanh (Mặc định Mobile)', device: 'mobile', url: 'https://i.ibb.co/7NnQtYVb/b93ce28c-a278-4123-8650-771eb2a3be79.png' },
      { id: 'def_d2', name: 'Bình Minh Trên Đỉnh Núi', device: 'desktop', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1920&q=80' },
      { id: 'def_m2', name: 'Hoàng Hôn Sông Nước', device: 'mobile', url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=800&q=80' },
      { id: 'def_d3', name: 'Cực Quang Huyền Ảo', device: 'desktop', url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1920&q=80' },
      { id: 'def_m3', name: 'Biển Đêm Tĩnh Lặng', device: 'mobile', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80' }
    ]

    let activeBgGallery = defaultGallery
    if (activeBgGallerySetting?.value) {
      try {
        const parsed = JSON.parse(activeBgGallerySetting.value)
        if (Array.isArray(parsed) && parsed.length > 0) activeBgGallery = parsed
      } catch (e) {}
    }

    if (!isUserAdmin) {
      // Non-admin chỉ cần biết cấu hình đã có key hay chưa, model đang dùng, và trạng thái bật/tắt background
      return NextResponse.json({
        hasKeys: Boolean(apiKeys.trim()),
        activeModel,
        keyCount: apiKeys.split(',').filter(Boolean).length,
        activeBgEnabled,
        activeBgDesktop,
        activeBgMobile
      })
    }

    return NextResponse.json({
      apiKeys,
      activeModel,
      availableModels,
      activeBgEnabled,
      activeBgDesktop,
      activeBgMobile,
      activeBgGallery
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST: Lưu cài đặt Gemini API & Models & Background (chỉ admin)
export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'Bạn không có quyền thực hiện thao tác này.' }, { status: 403 })
  }

  try {
    const {
      apiKeys,
      activeModel,
      availableModels,
      activeBgEnabled,
      activeBgDesktop,
      activeBgMobile,
      activeBgGallery
    } = await request.json()

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

      if (activeBgEnabled !== undefined) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'ACTIVE_BG_ENABLED' },
          update: { value: String(activeBgEnabled) },
          create: { key: 'ACTIVE_BG_ENABLED', value: String(activeBgEnabled) }
        })
      }

      if (activeBgDesktop !== undefined) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'ACTIVE_BG_DESKTOP' },
          update: { value: String(activeBgDesktop).trim() },
          create: { key: 'ACTIVE_BG_DESKTOP', value: String(activeBgDesktop).trim() }
        })
      }

      if (activeBgMobile !== undefined) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'ACTIVE_BG_MOBILE' },
          update: { value: String(activeBgMobile).trim() },
          create: { key: 'ACTIVE_BG_MOBILE', value: String(activeBgMobile).trim() }
        })
      }

      if (activeBgGallery !== undefined) {
        await (prisma as any).systemSetting.upsert({
          where: { key: 'ACTIVE_BG_GALLERY' },
          update: { value: JSON.stringify(activeBgGallery) },
          create: { key: 'ACTIVE_BG_GALLERY', value: JSON.stringify(activeBgGallery) }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Đã lưu cấu hình cài đặt hệ thống thành công!' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
