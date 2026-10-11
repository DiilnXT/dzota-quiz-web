import React from 'react'
import { Clock, BookOpen, Sparkles } from 'lucide-react'

export default function LoadingTest() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex flex-col items-center justify-start p-4 sm:p-6 text-slate-800 dark:text-slate-100 animate-fade-in">
      {/* Top Header Skeleton */}
      <div className="w-full max-w-4xl flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Sparkles size={20} className="animate-spin" />
          </div>
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
            <div className="h-3 w-24 bg-slate-100 dark:bg-slate-850 rounded-lg animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-pulse">
          <Clock size={16} className="text-blue-500" />
          <div className="h-3 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>

      {/* Hero Card / Instructions Skeleton */}
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="space-y-3">
          <div className="h-7 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-850 rounded-lg animate-pulse" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="h-3 w-12 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-5 w-16 bg-slate-300 dark:bg-slate-600 rounded animate-pulse" />
            </div>
          ))}
        </div>

        {/* Start Button Skeleton */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
          <div className="h-12 w-52 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 animate-pulse">
            <BookOpen size={18} />
            <span>Đang tải đề thi siêu tốc...</span>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-y-1">
        <p className="text-xs font-bold text-slate-400">Dzota Quiz đang chuẩn bị toàn bộ câu hỏi...</p>
        <p className="text-[11px] text-slate-400/80">Tự động kết nối và đồng bộ dữ liệu thi</p>
      </div>
    </div>
  )
}
