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
  ShieldCheck, 
  Users, 
  ExternalLink 
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

  const [accessMode, setAccessMode] = useState(lesson.accessMode || 'public')
  const [allowedEmails, setAllowedEmails] = useState<string[]>(lesson.allowedEmails || [])
  const [accessPassword, setAccessPassword] = useState(lesson.accessPassword || '')
  const [newEmailInput, setNewEmailInput] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [selectedShareMode, setSelectedShareMode] = useState('flashcard') // 'flashcard' | 'exam' | 'admin'

  const shareUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/dynex?lessonId=${lesson.id}&tab=${selectedShareMode}`
    : `/dynex?lessonId=${lesson.id}&tab=${selectedShareMode}`

  const handleAddEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newEmailInput.trim()) return

    // Support comma or newline separated emails
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

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl)
      setCopiedLink(true)
      soundService.playStationChime()
      setTimeout(() => setCopiedLink(false), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-600/50 flex items-center justify-center text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                Chia Sẻ & Phân Quyền Mô-đun Giải Phẫu
              </h3>
              <p className="text-xs text-slate-400">
                Cấu hình thương mại hóa, bảo vệ bản quyền & cấp quyền học sinh
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Target Lesson Info */}
          <div className="p-3.5 rounded-2xl bg-[#0B0F19] border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">
                Mô-đun Đang Cấu Hình
              </span>
              <h4 className="text-sm font-bold text-white truncate max-w-md">{lesson.title}</h4>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono font-bold">
              {lesson.images?.length || 0} sơ đồ
            </span>
          </div>

          {/* Share Link Generation */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Liên kết học trực tiếp (Share URL):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedShareMode}
                onChange={(e) => setSelectedShareMode(e.target.value)}
                className="px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs font-semibold text-slate-200 focus:outline-none"
              >
                <option value="flashcard">Học Flashcard (Anki)</option>
                <option value="exam">Thi Chạy Trạm (OSCE)</option>
                <option value="admin">Soạn Đề & Ngân Hàng</option>
              </select>

              <div className="flex-1 flex items-center bg-[#070b14] border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate">
                <span className="truncate">{shareUrl}</span>
              </div>

              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 shrink-0 cursor-pointer active:scale-95"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                <span>{copiedLink ? 'Đã sao chép!' : 'Sao chép link'}</span>
              </button>
            </div>
          </div>

          {/* Access Control Modes */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
              Chế Độ Truy Cập & Bản Quyền:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Public Free */}
              <div
                onClick={() => setAccessMode('public')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  accessMode === 'public'
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/40'
                    : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Globe className={`w-4 h-4 ${accessMode === 'public' ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">Công Khai (Free)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Bất kỳ ai có đường link đều có thể mở học tự do không cần đăng nhập.
                </p>
              </div>

              {/* Option 2: Whitelist Google Emails */}
              <div
                onClick={() => setAccessMode('vip_emails')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  accessMode === 'vip_emails'
                    ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-950/40'
                    : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldCheck className={`w-4 h-4 ${accessMode === 'vip_emails' ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">VIP (Check Gmail)</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Chỉ các học viên có tài khoản Google trong danh sách cho phép mới vào được.
                </p>
              </div>

              {/* Option 3: Password Code */}
              <div
                onClick={() => setAccessMode('password')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  accessMode === 'password'
                    ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-950/40'
                    : 'bg-[#0B0F19] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Key className={`w-4 h-4 ${accessMode === 'password' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold text-white">Mật Khẩu PIN</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Học viên phải nhập đúng mật khẩu bảo vệ do giảng viên cấp để mở bài.
                </p>
              </div>
            </div>
          </div>

          {/* VIP WHITELIST EMAIL MANAGER */}
          {accessMode === 'vip_emails' && (
            <div className="p-4 rounded-2xl bg-[#0E1526] border border-indigo-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Danh Sách Gmail Học Viên Được Cấp Quyền ({allowedEmails.length})
                </label>
                <span className="text-[11px] text-slate-400">Tự động check khi học sinh Login</span>
              </div>

              {/* Add email form */}
              <form onSubmit={handleAddEmail} className="flex gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    placeholder="Nhập email học sinh (hỗ trợ dán nhiều email cách nhau bởi dấu phẩy hoặc dòng mới)..."
                    className="w-full pl-9 pr-3 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              </form>

              {/* Email Chips */}
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-[#070b14] rounded-xl border border-slate-800">
                {allowedEmails.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">
                    Chưa có học viên nào. Hãy nhập Gmail của học viên mua khóa học ở trên.
                  </span>
                ) : (
                  allowedEmails.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-xs text-slate-200 font-mono"
                    >
                      <span>{email}</span>
                      <button
                        onClick={() => handleRemoveEmail(email)}
                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PASSWORD SETUP */}
          {accessMode === 'password' && (
            <div className="p-4 rounded-2xl bg-[#0E1526] border border-amber-500/30 space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider">
                Mật Khẩu / Mã PIN Khóa Bài:
              </label>
              <input
                type="text"
                value={accessPassword}
                onChange={(e) => setAccessPassword(e.target.value)}
                placeholder="Ví dụ: DYNEX2026 hoặc YKHOA88"
                className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
              <p className="text-[11px] text-slate-400">
                Gửi mã PIN này cho học sinh để mở khóa làm bài trực tiếp trên điện thoại hoặc máy tính.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Đóng
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
          >
            Lưu Quyền & Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  )
}
