'use client'

import React from 'react'
import DynexAppClient from '@/app/dynex/DynexAppClient'
import { Activity, ExternalLink, ShieldCheck, Sparkles } from 'lucide-react'
import Link from 'next/link'

interface DynexTabProps {
  currentUser?: any
}

export default function DynexTab({ currentUser }: DynexTabProps) {
  return (
    <div className="space-y-4">
      {/* Banner Giới thiệu & Điều hướng mở toàn màn hình */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-indigo-500/30 shadow-xl shadow-indigo-950/20">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/30 shrink-0">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
              <Activity className="w-6 h-6 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                DYNEX Anatomy Studio
                <span className="text-[10px] uppercase font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full">
                  Tính năng Tab Dzota
                </span>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-0.5">
              Hệ thống Giải Phẫu Y Khoa, Flashcard Anki SM-2 và Thi Chạy Trạm 20 Trạm OSCE bản quyền <span className="text-white font-bold">Nhật Duy</span>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/60">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Bản quyền: <b>Nhật Duy</b></span>
          </div>
          <Link
            href="/dynex"
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md shadow-indigo-600/30 active:scale-95"
          >
            <span>Mở Toàn Màn Hình</span>
            <ExternalLink size={15} />
          </Link>
        </div>
      </div>

      {/* Trình làm việc DYNEX trực tiếp trong Tab Dzota */}
      <div className="bg-[#0B0F19] rounded-2xl border border-slate-800/90 overflow-hidden shadow-2xl min-h-[85vh]">
        <DynexAppClient initialUser={currentUser} isEmbedded={true} />
      </div>
    </div>
  )
}
