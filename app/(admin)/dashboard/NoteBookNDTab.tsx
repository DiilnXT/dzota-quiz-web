'use client'

import React from 'react'
import NotebookAppClient from '@/app/notebook/NotebookAppClient'
import { ExternalLink, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface NoteBookNDTabProps {
  currentUser?: any
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

export default function NoteBookNDTab({ currentUser, showToast }: NoteBookNDTabProps) {
  return (
    <div className="space-y-4">
      {/* Banner mở trang riêng chuẩn Google NotebookLM */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg shadow-indigo-500/15">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <Sparkles size={22} className="text-amber-300" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
              NoteBook ND Studio
              <span className="text-[10px] uppercase font-black bg-white/20 px-2 py-0.5 rounded-full border border-white/30">
                Toàn màn hình
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 font-medium">
              Bạn có thể thao tác ngay bên dưới hoặc mở trang độc lập chuẩn NotebookLM với không gian rộng 100% màn hình.
            </p>
          </div>
        </div>
        <Link
          href="/notebook"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 hover:bg-blue-50 font-black text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 shrink-0"
        >
          <span>Mở Trang Riêng Toàn Màn Hình</span>
          <ExternalLink size={16} />
        </Link>
      </div>

      {/* Trình làm việc NoteBook ND */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm min-h-[85vh]">
        <NotebookAppClient currentUser={currentUser} />
      </div>
    </div>
  )
}
