import React from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Đăng Nhập & Tạo Tài Khoản — Dzota Academy',
  description: 'Cổng đăng nhập thống nhất hệ sinh thái học tập & khảo thí thông minh Dzota.',
}

export default async function LoginPage() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value

  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr)
      if (session && (session.id || session.username || session.email)) {
        const orConditions: any[] = []
        if (session.id) orConditions.push({ id: session.id })
        if (session.email) orConditions.push({ email: session.email })
        if (session.username) orConditions.push({ username: session.username })

        if (orConditions.length > 0) {
          const dbUser = await prisma.user.findFirst({
            where: { OR: orConditions },
            select: { id: true },
          })
          if (dbUser) {
            redirect('/dashboard')
          }
        }
      }
    } catch (e: any) {
      if (e?.digest?.startsWith('NEXT_REDIRECT')) {
        throw e
      }
    }
  }

  return <LoginClient />
}
