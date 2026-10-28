'use client'

import React, { useState } from 'react'
import { 
  X, 
  Share2, 
  Lock, 
  Globe, 
  Key, 
  Mail, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  QrCode,
  Brain,
  Flame,
  Smartphone
} from 'lucide-react'
import { soundService } from '../services/soundService'

interface ShareAccessModalProps {
  isOpen: boolean
  onClose: () => void
  lesson: any
  onUpdateLessonAccess: (lessonId: string, accessConfig: any) => void
}

export default function ShareAccessModal({ isOpen, onClose, lesson, onUpdateLessonAccess }: ShareAccessModalProps) {
  if (!isOpen || !lesson) return null

  const [activeTab, setActiveTab] = useState<'exam' | 'flashcard'>('exam')
  const [accessMode, setAccessMode] = useState<'public' | 'whitelist' | 'password'>(lesson.accessMode || 'public')
  const [allowedEmails, setAllowedEmails] = useState<string[]>(lesson.allowedEmails || [])
  const [accessPassword, setAccessPassword] = useState(lesson.accessPassword || '')
  const [newEmailInput, setNewEmailInput] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dzota.vercel.app'
  const currentShareUrl = activeTab === 'exam' 
    ? `${baseUrl}/dynex?mode=exam&lessonId=${lesson.id}` 
    : `${baseUrl}/dynex?mode=flashcard&lessonId=${lesson.id}`

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentShareUrl)
      setCopiedLink(true)
      soundService.playStationChime()
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmailInput.trim()) return

    const raw = newEmailInput.split(/[\s,]+/)
    const validEmails = raw
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes('@') && !allowedEmails.includes(e))

    if (validEmails.length > 0) {
      setAllowedEmails([...allowedEmails, ...validEmails])
      setNewEmailInput('')
      soundService.playTick()
    }
  }

  const handleRemoveEmail = (email: string) => {
    setAllowedEmails(allowedEmails.filter(e => e !== email))
    soundService.playTick()
  }

  const handleSave = () => {
    onUpdateLessonAccess(lesson.id, {
      accessMode,
      allowedEmails,
      accessPassword
    })
    soundService.playSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#0c1222] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-[#070b14] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-600/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white truncate max-w-xs sm:max-w-md">
                Chia Sẻ & Cấp Quyền Bài Học
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                {lesson.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. SHARE LINK SELECTION TABS */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Loại Liên Kết Cần Chia Sẻ:
            </label>
            
            <div className="grid grid-cols-2 gap-2 bg-[#070b14] p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => { setActiveTab('exam'); setCopiedLink(false); soundService.playClick(); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'exam'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-300" />
                <span>Link Thi Chạy Trạm (OSCE)</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('flashcard'); setCopiedLink(false); soundService.playClick(); }}
                className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeTab === 'flashcard'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Brain className="w-4 h-4 text-cyan-300" />
                <span>Link Học Não Bộ (Flashcard)</span>
              </button>
            </div>

            {/* Clean Single URL Bar & Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <div className="flex-1 flex items-center bg-[#070b14] border border-slate-700/80 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate select-all">
                <span className="truncate">{currentShareUrl}</span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-cyan-600/30 cursor-pointer active:scale-95"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'Đã sao chép!' : 'Sao chép link'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                    showQrCode 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Hiện mã QR điện thoại"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* QR Code Container */}
            {showQrCode && (
              <div className="p-4 rounded-2xl bg-[#070b14] border border-slate-800 flex flex-col sm:flex-row items-center gap-4 animate-fadeIn">
                <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(currentShareUrl)}`}
                    alt="QR Code"
                    className="w-28 h-28 block"
                  />
                </div>
                <div className="space-y-1 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-cyan-400">
                    <Smartphone className="w-4 h-4" />
                    <span>Quét mã QR bằng điện thoại</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Học sinh có thể dùng Camera điện thoại hoặc Zalo để quét và vào thẳng bài học hoặc phòng thi chạy trạm ngay tức thì.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 2. ACCESS CONTROL CONFIGURATION */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Quyền Truy Cập Bài Học:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option 1: Public */}
              <div
                onClick={() => setAccessMode('public')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  accessMode === 'public'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500 shadow-lg shadow-emerald-950/30'
                    : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Globe className="w-4 h-4 text-emerald-400" />
                    <span>Công Khai</span>
                  </div>
                  {accessMode === 'public' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bất kỳ ai có liên kết đều vào học và thi tự do.
                </p>
              </div>

              {/* Option 2: Password PIN */}
              <div
                onClick={() => setAccessMode('password')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  accessMode === 'password'
                    ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500 shadow-lg shadow-cyan-950/30'
                    : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <span>Mật Khẩu PIN</span>
                  </div>
                  {accessMode === 'password' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Yêu cầu học sinh nhập đúng mã PIN để mở bài.
                </p>
              </div>

              {/* Option 3: Whitelist Gmail */}
              <div
                onClick={() => setAccessMode('whitelist')}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  accessMode === 'whitelist'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 shadow-lg shadow-indigo-950/30'
                    : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <Mail className="w-4 h-4 text-indigo-400" />
                    <span>Phân Quyền Gmail</span>
                  </div>
                  {accessMode === 'whitelist' && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Chỉ các học viên trong danh sách được cấp phép.
                </p>
              </div>
            </div>

            {/* Additional inputs based on mode */}
            {accessMode === 'password' && (
              <div className="p-3.5 bg-[#070b14] border border-cyan-500/30 rounded-2xl space-y-1.5 animate-fadeIn">
                <label className="block text-xs font-bold text-slate-300">
                  Mã PIN bảo vệ bài học:
                </label>
                <input
                  type="text"
                  value={accessPassword}
                  onChange={(e) => setAccessPassword(e.target.value)}
                  placeholder="Ví dụ: YK47, 123456..."
                  className="w-full px-3 py-2 bg-[#0c1222] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 font-mono tracking-wider"
                />
              </div>
            )}

            {accessMode === 'whitelist' && (
              <div className="p-3.5 bg-[#070b14] border border-indigo-500/30 rounded-2xl space-y-3 animate-fadeIn">
                <form onSubmit={handleAddEmail} className="flex gap-2">
                  <input
                    type="text"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="Nhập email học viên (hoặc nhiều email cách nhau bằng dấu phẩy)..."
                    className="flex-1 px-3 py-2 bg-[#0c1222] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm</span>
                  </button>
                </form>

                {allowedEmails.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                    {allowedEmails.map(email => (
                      <span 
                        key={email}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-[11px] text-indigo-200"
                      >
                        <span>{email}</span>
                        <button 
                          type="button"
                          onClick={() => handleRemoveEmail(email)} 
                          className="hover:text-red-400 cursor-pointer ml-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic">
                    Chưa có email nào trong danh sách. Hãy nhập email học viên ở trên.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-[#070b14] flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition-all cursor-pointer"
          >
            Lưu Quyền & Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  )
}
