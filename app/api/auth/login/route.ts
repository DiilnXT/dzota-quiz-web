import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, googleUser } = body

    let resolvedGoogleUser = googleUser
    if (!resolvedGoogleUser && body.credential) {
      try {
        const payloadPart = body.credential.split('.')[1]
        const decoded = JSON.parse(Buffer.from(payloadPart, 'base64').toString('utf8'))
        if (decoded.email) {
          resolvedGoogleUser = {
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
            sub: decoded.sub
          }
        }
      } catch (e) {}
    }

    if (!resolvedGoogleUser && body.accessToken) {
      try {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${body.accessToken}` }
        })
        if (gRes.ok) {
          resolvedGoogleUser = await gRes.json()
        }
      } catch (e) {}
    }

    // ─── 1. XỬ LÝ ĐĂNG NHẬP BẰNG GOOGLE ──────────────────────────────────
    if (resolvedGoogleUser && resolvedGoogleUser.email) {
      const email = String(resolvedGoogleUser.email).trim().toLowerCase()
      const isSuperAdminEmail = email === 'lenhatduy.vietnam@gmail.com'

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' as const } },
            { username: { equals: email, mode: 'insensitive' as const } },
            ...(isSuperAdminEmail ? [{ username: { equals: 'DuylniEdu', mode: 'insensitive' as const } }] : [])
          ]
        }
      })

      if (!user) {
        // Tự động tạo user mới nếu đăng nhập lần đầu bằng Google
        const targetUsername = isSuperAdminEmail ? 'DuylniEdu' : (resolvedGoogleUser.name || email.split('@')[0])
        let uniqueUsername = targetUsername
        const exists = await prisma.user.findUnique({ where: { username: uniqueUsername } })
        if (exists && !isSuperAdminEmail) {
          uniqueUsername = `${uniqueUsername}_${Date.now().toString().slice(-4)}`
        }

        user = await prisma.user.create({
          data: {
            username: isSuperAdminEmail ? 'DuylniEdu' : uniqueUsername,
            email,
            name: resolvedGoogleUser.name || (isSuperAdminEmail ? 'DuylniEdu' : uniqueUsername),
            password: 'GOOGLE_OAUTH_USER',
            role: isSuperAdminEmail ? 'ADMIN' : 'USER',
            maxTests: isSuperAdminEmail ? 9999 : 10
          }
        })
      } else {
        // Cập nhật thông tin nếu cần
        const updateData: any = {}
        if (!user.email) updateData.email = email
        if (isSuperAdminEmail) {
          updateData.role = 'ADMIN'
          updateData.maxTests = 9999
        }
        if (Object.keys(updateData).length > 0) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData
          })
        }
      }

      const role = isSuperAdminEmail ? 'ADMIN' : user.role
      const cookieStore = await cookies()
      cookieStore.set(
        'dzota_session',
        JSON.stringify({ id: user.id, role, username: user.username, email }),
        { maxAge: 60 * 60 * 24 * 30, httpOnly: true, path: '/' }
      )

      return NextResponse.json({ success: true, role, username: user.username, email })
    }

    // ─── 2. XỬ LÝ ĐĂNG NHẬP BẰNG TÀI KHOẢN CŨ (TRUYỀN THỐNG) ────────────
    // Hardcoded Admin check
    if (username?.trim().toLowerCase() === 'duylniedu' && password === 'The@2412@') {
      let adminUser = await prisma.user.findFirst({
        where: { username: { equals: 'DuylniEdu', mode: 'insensitive' } }
      })
      if (!adminUser) {
        adminUser = await prisma.user.create({
          data: { username: 'DuylniEdu', password: 'The@2412@', role: 'ADMIN', maxTests: 9999 }
        })
      } else if (adminUser.role !== 'ADMIN') {
        adminUser = await prisma.user.update({
          where: { id: adminUser.id },
          data: { role: 'ADMIN' }
        })
      }
      
      const cookieStore = await cookies()
      cookieStore.set(
        'dzota_session',
        JSON.stringify({ id: adminUser.id, role: 'ADMIN', username: adminUser.username }),
        { maxAge: 60 * 60 * 24 * 30, httpOnly: true, path: '/' }
      )
      return NextResponse.json({ success: true, role: 'ADMIN' })
    }
    
    // Normal User check
    const user = await prisma.user.findUnique({ where: { username } })
    if (user && user.password === password) {
      const cookieStore = await cookies()
      cookieStore.set(
        'dzota_session',
        JSON.stringify({ id: user.id, role: user.role, username }),
        { maxAge: 60 * 60 * 24 * 30, httpOnly: true, path: '/' }
      )
      return NextResponse.json({ success: true, role: user.role })
    }
    
    return NextResponse.json({ error: 'Tài khoản hoặc mật khẩu không đúng' }, { status: 401 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
