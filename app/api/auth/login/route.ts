import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

function sanitizeSessionPayload(user: {
  id: string
  role?: string | null
  username: string
  email?: string | null
  name?: string | null
  avatar?: string | null
  phone?: string | null
}, overrideRole?: string) {
  const safeAvatar =
    user.avatar && !user.avatar.startsWith('data:') && user.avatar.length < 300
      ? user.avatar
      : null
  return {
    id: user.id,
    role: overrideRole || user.role || 'STUDENT',
    username: user.username,
    email: user.email || null,
    name: user.name || user.username,
    avatar: safeAvatar,
    phone: user.phone || null,
  }
}

const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 30,
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password, name, email: rawEmail, action, googleUser } = body

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
            sub: decoded.sub,
          }
        }
      } catch (e) {}
    }

    if (!resolvedGoogleUser && body.accessToken) {
      try {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${body.accessToken}` },
        })
        if (gRes.ok) {
          resolvedGoogleUser = await gRes.json()
        }
      } catch (e) {}
    }

    // ─── 1. ĐĂNG NHẬP BẰNG GOOGLE OAUTH ──────────────────────────────────
    if (resolvedGoogleUser && resolvedGoogleUser.email) {
      const email = String(resolvedGoogleUser.email).trim().toLowerCase()
      const isSuperAdminEmail = email === 'lenhatduy.vietnam@gmail.com'

      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: email, mode: 'insensitive' as const } },
            { username: { equals: email, mode: 'insensitive' as const } },
            ...(isSuperAdminEmail ? [{ username: { equals: 'DuylniEdu', mode: 'insensitive' as const } }] : []),
          ],
        },
      })

      if (!user) {
        const targetUsername = isSuperAdminEmail ? 'DuylniEdu' : (resolvedGoogleUser.name || email.split('@')[0]).trim()
        let uniqueUsername = targetUsername
        const exists = await prisma.user.findFirst({
          where: { username: { equals: uniqueUsername, mode: 'insensitive' } },
        })
        if (exists && !isSuperAdminEmail) {
          uniqueUsername = `${uniqueUsername}_${Date.now().toString().slice(-4)}`
        }

        user = await prisma.user.create({
          data: {
            username: isSuperAdminEmail ? 'DuylniEdu' : uniqueUsername,
            email,
            name: resolvedGoogleUser.name || (isSuperAdminEmail ? 'Lê Nhật Duy' : uniqueUsername),
            password: 'GOOGLE_OAUTH_USER',
            role: isSuperAdminEmail ? 'ADMIN' : 'STUDENT',
            maxTests: isSuperAdminEmail ? 9999 : 0,
            avatar: resolvedGoogleUser.picture || null,
          },
        })
      } else {
        const updateData: any = {}
        if (!user.email) updateData.email = email
        if (isSuperAdminEmail) {
          updateData.role = 'ADMIN'
          updateData.maxTests = 9999
        } else if (user.role === 'USER') {
          updateData.role = 'STUDENT'
        }
        if (!user.avatar && resolvedGoogleUser.picture) {
          updateData.avatar = resolvedGoogleUser.picture
        }
        if (Object.keys(updateData).length > 0) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          })
        }
      }

      const role = isSuperAdminEmail ? 'ADMIN' : (user.role || 'STUDENT')
      const sessionData = sanitizeSessionPayload(user, role)
      const cookieStore = await cookies()
      cookieStore.set('dzota_session', JSON.stringify(sessionData), COOKIE_OPTIONS)

      return NextResponse.json({ success: true, ...sessionData })
    }

    // ─── 2. ĐĂNG KÝ TÀI KHOẢN MỚI (STUDENT) ──────────────────────────────
    if (action === 'register') {
      const cleanUsername = String(username || '').trim()
      const cleanPassword = String(password || '').trim()
      const cleanName = String(name || '').trim()
      const cleanEmail = rawEmail
        ? String(rawEmail).trim().toLowerCase()
        : cleanUsername.includes('@')
          ? cleanUsername.toLowerCase()
          : null

      if (!cleanUsername || cleanUsername.length < 3) {
        return NextResponse.json(
          { error: 'Tên tài khoản hoặc Email phải có ít nhất 3 ký tự.' },
          { status: 400 }
        )
      }
      if (!cleanPassword || cleanPassword.length < 4) {
        return NextResponse.json(
          { error: 'Mật khẩu phải có ít nhất 4 ký tự.' },
          { status: 400 }
        )
      }

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username: { equals: cleanUsername, mode: 'insensitive' } },
            ...(cleanEmail ? [{ email: { equals: cleanEmail, mode: 'insensitive' } }] : []),
          ],
        },
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Tài khoản hoặc Email này đã được đăng ký. Vui lòng chuyển sang Đăng nhập!' },
          { status: 409 }
        )
      }

      const isSuperAdmin =
        cleanEmail === 'lenhatduy.vietnam@gmail.com' ||
        cleanUsername.toLowerCase() === 'duylniedu'

      const newUser = await prisma.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          name: cleanName || (cleanEmail ? cleanEmail.split('@')[0] : cleanUsername),
          password: cleanPassword,
          role: isSuperAdmin ? 'ADMIN' : 'STUDENT',
          maxTests: isSuperAdmin ? 9999 : 0,
        },
      })

      const sessionData = sanitizeSessionPayload(newUser)
      const cookieStore = await cookies()
      cookieStore.set('dzota_session', JSON.stringify(sessionData), COOKIE_OPTIONS)

      return NextResponse.json({ success: true, ...sessionData })
    }

    // ─── 3. ĐĂNG NHẬP BẰNG TÊN TÀI KHOẢN HOẶC EMAIL ─────────────────────
    const cleanInput = String(username || '').trim()
    const rawPass = String(password || '')

    if (!cleanInput || !rawPass) {
      return NextResponse.json(
        { error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' },
        { status: 400 }
      )
    }

    // Kiểm tra tài khoản trong DB (không phân biệt hoa thường, hỗ trợ cả username và email)
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanInput, mode: 'insensitive' } },
          { email: { equals: cleanInput.toLowerCase(), mode: 'insensitive' } },
        ],
      },
    })

    // Khởi tạo tự động Super Admin nếu đăng nhập lần đầu bằng tài khoản gốc
    if (!user && cleanInput.toLowerCase() === 'duylniedu' && rawPass === 'The@2412@') {
      user = await prisma.user.create({
        data: {
          username: 'DuylniEdu',
          password: 'The@2412@',
          role: 'ADMIN',
          maxTests: 9999,
          name: 'Lê Nhật Duy',
        },
      })
    }

    const isSuperAdminAccount =
      user &&
      (user.username.toLowerCase() === 'duylniedu' ||
        user.email?.toLowerCase() === 'lenhatduy.vietnam@gmail.com')

    const passwordMatched =
      user &&
      (user.password === rawPass ||
        user.password === rawPass.trim() ||
        (isSuperAdminAccount && rawPass === 'The@2412@'))

    if (user && passwordMatched) {
      if (isSuperAdminAccount && user.role !== 'ADMIN') {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN', maxTests: 9999 },
        })
      }

      const effectiveRole = isSuperAdminAccount ? 'ADMIN' : (user.role || 'STUDENT')
      const sessionData = sanitizeSessionPayload(user, effectiveRole)
      const cookieStore = await cookies()
      cookieStore.set('dzota_session', JSON.stringify(sessionData), COOKIE_OPTIONS)

      return NextResponse.json({ success: true, ...sessionData })
    }

    return NextResponse.json(
      { error: 'Tài khoản hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại!' },
      { status: 401 }
    )
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi máy chủ xác thực' }, { status: 500 })
  }
}
