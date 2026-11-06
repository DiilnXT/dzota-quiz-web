'use client'

import { useEffect } from 'react'

export default function QuickQuizRedirect({ id }: { id: string }) {
  useEffect(() => {
    window.location.replace(`/?id=${encodeURIComponent(id)}`)
  }, [id])

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-sm p-8 max-w-sm w-full text-center space-y-5 border border-gray-100">
        <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-bold text-slate-800">Đang mở phòng thi...</h3>
          <p className="text-xs text-slate-400 font-medium">Hệ thống đang tải câu hỏi trắc nghiệm Dzota</p>
        </div>
      </div>
    </div>
  )
}
