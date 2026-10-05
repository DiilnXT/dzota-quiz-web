import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()
    
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
      cookieStore.set('dzota_session', JSON.stringify({ id: adminUser.id, role: 'ADMIN', username: adminUser.username }), { maxAge: 60 * 60 * 24 * 30, httpOnly: true, path: '/' })
      return NextResponse.json({ success: true, role: 'ADMIN' })
    }
    
    // Normal User check
    const user = await prisma.user.findUnique({ where: { username } })
    if (user && user.password === password) {
      const cookieStore = await cookies()
      cookieStore.set('dzota_session', JSON.stringify({ id: user.id, role: user.role, username }), { maxAge: 60 * 60 * 24 * 30, httpOnly: true, path: '/' })
      return NextResponse.json({ success: true, role: user.role })
    }
    
    return NextResponse.json({ error: 'Tài khoản hoặc mật khẩu không đúng' }, { status: 401 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
