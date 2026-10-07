'use client'

import React, { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Có lỗi xảy ra khi tải bảng điều khiển
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
            Hệ thống đang được cập nhật hoặc phiên đăng nhập cần được làm mới. Vui lòng bấm thử lại hoặc đăng nhập lại.
          </p>
          {error?.message && (
            <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-[11px] font-mono text-slate-600 dark:text-slate-300 text-left overflow-x-auto max-h-24">
              {error.message}
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Thử lại</span>
          </button>
          <Link
            href="/login"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition no-underline flex items-center gap-1.5"
          >
            <Home size={14} />
            <span>Đăng nhập lại</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
