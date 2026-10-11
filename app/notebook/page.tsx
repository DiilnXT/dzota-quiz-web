import React from 'react'
import prisma from '@/lib/prisma'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NotebookAppClient from './NotebookAppClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'NoteBook ND - Trợ lý AI Ôn Tập & Soạn Thảo Đề Thi Đẳng Cấp',
  description: 'Giao diện tương tự Google NotebookLM, phân tích tài liệu nguồn sâu sắc và tạo trắc nghiệm chuẩn sư phạm.'
}

export default async function NotebookPage() {
  const cookieStore = await cookies()
  const sessionStr = cookieStore.get('dzota_session')?.value
  
  if (!sessionStr) {
    redirect('/login')
  }
  
  let session: any = null
  try {
    session = JSON.parse(sessionStr)
  } catch (e) {
    redirect('/login')
  }

  if (!session) {
    redirect('/login')
  }

  let currentUser: any = null
  try {
    const orConditions: any[] = []
    if (session.id) orConditions.push({ id: session.id })
    if (session.email) orConditions.push({ email: session.email })
    if (session.username) orConditions.push({ username: session.username })

    if (orConditions.length > 0) {
      currentUser = await prisma.user.findFirst({
        where: { OR: orConditions },
        select: {
          id: true,
          username: true,
          email: true,
          name: true,
          avatar: true,
          phone: true,
          role: true,
          maxTests: true,
          createdAt: true
        }
      })
    }
  } catch (e) {
    console.error('Error fetching currentUser in notebook page:', e)
  }

  return (
    <main className="w-screen h-screen max-h-screen overflow-hidden bg-slate-50 dark:bg-[#0B0F19] text-slate-800 dark:text-slate-100 flex flex-col">
      <NotebookAppClient currentUser={currentUser || session} />
    </main>
  )
}
