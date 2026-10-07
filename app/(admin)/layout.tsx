import React from 'react'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminNavClient from './AdminNavClient'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  
  if (!sessionStr) {
    redirect('/login')
  }

  let session
  try {
    session = JSON.parse(sessionStr)
  } catch (e) {
    redirect('/login')
  }

  // Luôn lấy role mới nhất từ database để khi Admin cấp quyền Giáo viên cho Học sinh, menu cập nhật ngay lập tức
  let liveRole = session.role
  let liveName = session.name
  let liveAvatar = session.avatar
  try {
    const dbUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(session.id ? [{ id: session.id }] : []),
          ...(session.email ? [{ email: session.email }] : []),
          ...(session.username ? [{ username: session.username }] : [])
        ]
      },
      select: { id: true, role: true, name: true, avatar: true, email: true, username: true }
    })
    if (dbUser) {
      const email = (dbUser.email || session.email || '').toLowerCase()
      const username = (dbUser.username || session.username || '').toLowerCase()
      const isSuper = email === 'lenhatduy.vietnam@gmail.com' || username === 'duylniedu'
      liveRole = isSuper ? 'ADMIN' : (dbUser.role?.toUpperCase() || 'STUDENT')
      liveName = dbUser.name || session.name
      liveAvatar = dbUser.avatar || session.avatar
    }
  } catch (e) {}

  const enhancedSession = {
    ...session,
    role: liveRole,
    name: liveName,
    avatar: liveAvatar
  }

  return (
    <div className="min-h-screen bg-[#F4F8FC] dark:bg-[#0B0F19] flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <AdminNavClient session={enhancedSession} />
      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-3 sm:p-6 md:p-8 md:h-screen md:overflow-y-auto bg-transparent">
        {children}
      </main>
    </div>
  )
}
