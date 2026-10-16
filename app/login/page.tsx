'use client'

import { useEffect } from 'react'

export default function LoginPage() {
  useEffect(() => {
    window.location.replace('/login')
  }, [])

  return (
    <div className="min-h-screen bg-sky-50 dark:bg-[#070b14] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )
}
