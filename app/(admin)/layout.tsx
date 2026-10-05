import React from 'react'
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

  return (
    <div className="min-h-screen bg-[#F4F8FC] dark:bg-[#0B0F19] flex flex-col md:flex-row font-sans text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <AdminNavClient session={session} />
      {/* Main Content Area */}
      <main className="flex-1 md:ml-72 p-3 sm:p-6 md:p-8 md:h-screen md:overflow-y-auto bg-transparent">
        {children}
      </main>
    </div>
  )
}
