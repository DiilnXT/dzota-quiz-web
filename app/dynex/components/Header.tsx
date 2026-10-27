'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { 
  Activity, 
  Layers, 
  BookOpen, 
  Award, 
  Settings, 
  Volume2, 
  VolumeX, 
  ShieldCheck,
  Flame,
  Zap,
  LogIn,
  ArrowLeft,
  LayoutDashboard
} from 'lucide-react'
import { soundService } from '../services/soundService'

interface HeaderProps {
  currentTab: string
  setCurrentTab: (tab: string) => void
  onOpenSettings: () => void
  geminiModel?: string
  hasApiKey?: boolean
  currentUser?: any
  onOpenLogin: () => void
}

export default function Header({ 
  currentTab, 
  setCurrentTab, 
  onOpenSettings,
  geminiModel,
  hasApiKey,
  currentUser,
  onOpenLogin
}: HeaderProps) {
  const [muted, setMuted] = useState(false)

  const toggleMute = () => {
    const nextState = !muted
    setMuted(nextState)
    soundService.muted = nextState
  }

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F19]/90 backdrop-blur-2xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          
          {/* Logo Dzota + DYNEX Branding & Back to Dzota */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              title="Quay lại Bảng điều khiển Dzota"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0B0F19]"></div>
            </div>

            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight dzota-animated-gradient-text">
                  DYNEX
                </span>
                <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-bold bg-indigo-950/80 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 shadow-xs">
                  <Zap className="w-2.5 h-2.5 text-indigo-400 fill-current" /> Dzota Y Khoa
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 hidden md:block font-medium leading-tight">
                Hệ Thống Giải Phẫu & Thi Chạy Trạm Y Khoa AI (OSCE)
              </p>
            </div>
          </div>

          {/* Dzota-Style Navigation Pills */}
          <nav className="flex items-center gap-1 bg-[#111827]/90 p-1 sm:p-1.5 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto max-w-[50vw] sm:max-w-none">
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                currentTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Soạn Đề & Ngân Hàng</span>
              <span className="lg:hidden">Soạn Đề</span>
            </button>

            <button
              onClick={() => setCurrentTab('flashcard')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                currentTab === 'flashcard'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Học Flashcard (Anki)</span>
              <span className="lg:hidden">Flashcard</span>
            </button>

            <button
              onClick={() => setCurrentTab('exam')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                currentTab === 'exam'
                  ? 'bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-lg shadow-rose-600/40 animate-pulse'
                  : 'text-rose-400 hover:text-rose-200 hover:bg-rose-950/40'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Thi Chạy Trạm (20 Trạm)</span>
              <span className="sm:hidden">Thi OSCE</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer whitespace-nowrap ${
                currentTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Bảng Điểm & Thành Tích</span>
              <span className="lg:hidden">Bảng Điểm</span>
            </button>
          </nav>

          {/* Right Action Tools & Author Signature */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Sound Toggle */}
            <button
              onClick={toggleMute}
              className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                muted 
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' 
                  : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-white'
              }`}
              title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* AI Settings Button */}
            <button
              onClick={onOpenSettings}
              className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
                hasApiKey
                  ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-400 shadow-xs'
                  : 'bg-slate-900 border-slate-700/80 text-amber-400 hover:bg-slate-800'
              }`}
              title={hasApiKey ? `Gemini Vision AI: ${geminiModel || 'Sẵn sàng'}` : 'Cài đặt Gemini API Key'}
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Copyright Pill */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-400 font-medium">Bản quyền:</span>
              <span className="text-white font-black">Nhật Duy</span>
            </div>

            {/* User Session Profile / Login */}
            {currentUser?.isLoggedIn ? (
              <div 
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-500 cursor-pointer transition-all"
                title={`Đang đăng nhập: ${currentUser.email} (${currentUser.role})`}
              >
                <div className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                  {currentUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-[11px] font-bold text-slate-200 hidden lg:inline max-w-[85px] truncate">
                  {currentUser.name}
                </span>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs active:scale-95 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
