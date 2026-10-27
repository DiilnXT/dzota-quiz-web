'use client'

import React, { useState } from 'react'
import { X, LogIn, ShieldCheck, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react'
import { authService, DynexUser } from '../services/authService'
import { soundService } from '../services/soundService'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLoginSuccess?: (user: DynexUser) => void
}

export default function LoginModal({ isOpen, onClose, onLoginSuccess }: LoginModalProps) {
  if (!isOpen) return null

  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) {
      setError('Vui lòng nhập địa chỉ Gmail hợp lệ!')
      return
    }

    const user = authService.loginWithGoogleEmail(email, name)
    soundService.playSuccess()
    if (onLoginSuccess) onLoginSuccess(user)
    onClose()
  }

  const handleQuickDemoAdmin = () => {
    const user = authService.loginWithGoogleEmail('lenhatduy.vietnam@gmail.com', 'Nhật Duy (Tác giả Dzota)')
    soundService.playSuccess()
    if (onLoginSuccess) onLoginSuccess(user)
    onClose()
  }

  const handleQuickDemoStudent = () => {
    const user = authService.loginWithGoogleEmail('hocvien.ykhoa@gmail.com', 'Sinh Viên Y Khoa')
    soundService.playSuccess()
    if (onLoginSuccess) onLoginSuccess(user)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#111827] border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-600/50 flex items-center justify-center text-cyan-400">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Đăng Nhập Tài Khoản Google</h3>
              <p className="text-[11px] text-slate-400">Xác thực quyền truy cập mô-đun Dzota Y Khoa</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Địa Chỉ Gmail <span className="text-rose-400">*</span>:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError('')
                  }}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Họ & Tên Sinh Viên:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Bác sĩ / Sinh viên Y"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                />
              </div>
            </div>

            {error && (
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Xác Thực & Vào Học</span>
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
              Tài khoản thử nghiệm nhanh:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleQuickDemoAdmin}
                className="p-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-slate-700 text-left text-xs text-slate-200 transition-all cursor-pointer"
              >
                <div className="font-bold text-indigo-400">Admin Nhật Duy</div>
                <div className="text-[10px] text-slate-400 truncate">lenhatduy.vietnam...</div>
              </button>

              <button
                type="button"
                onClick={handleQuickDemoStudent}
                className="p-2 rounded-xl bg-[#1E293B] hover:bg-slate-700 border border-slate-700 text-left text-xs text-slate-200 transition-all cursor-pointer"
              >
                <div className="font-bold text-emerald-400">Học Viên Y Khoa</div>
                <div className="text-[10px] text-slate-400 truncate">hocvien.ykhoa@...</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
