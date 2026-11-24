'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  BookOpen,
  Activity,
  Award,
  AlertCircle,
  Loader2,
} from 'lucide-react'

declare global {
  interface Window {
    google?: any
  }
}

export default function LoginClient() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'register' || params.get('mode') === 'register') {
      setMode('register')
    }

    let cancelled = false
    let attempts = 0

    const setupGoogle = async () => {
      try {
        const res = await fetch('/api/auth/google-config')
        const data = await res.json()
        const clientId = data?.clientId
        if (!clientId) return

        const tryRender = () => {
          if (cancelled) return
          if (window.google?.accounts?.id && googleBtnRef.current) {
            window.google.accounts.id.initialize({
              client_id: clientId,
              callback: handleGoogleCallback,
              auto_select: false,
            })
            googleBtnRef.current.innerHTML = ''
            const btnWidth = Math.max(220, Math.min(window.innerWidth - 72, 340))
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: 'filled_black',
              size: 'large',
              shape: 'pill',
              width: btnWidth,
              text: 'continue_with',
            })
          } else if (attempts < 25) {
            attempts += 1
            setTimeout(tryRender, 250)
          }
        }
        tryRender()
      } catch {}
    }

    setupGoogle()
    return () => {
      cancelled = true
    }
  }, [])

  const handleGoogleCallback = async (response: any) => {
    if (!response?.credential) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg('Xác thực Google thành công! Đang chuyển vào Bàn học Dzota...')
        const nextUrl = new URLSearchParams(window.location.search).get('next') || '/dashboard'
        window.location.href = nextUrl
      } else {
        setError(data.error || 'Đăng nhập Google không thành công.')
        setLoading(false)
      }
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const payload =
        mode === 'register'
          ? { action: 'register', username: username.trim(), password, name: name.trim() }
          : { username: username.trim(), password }

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        setSuccessMsg(
          mode === 'register'
            ? 'Tạo tài khoản thành công! Đang mở không gian học tập...'
            : 'Đăng nhập thành công! Đang chuyển vào Bàn học...'
        )
        const nextUrl = new URLSearchParams(window.location.search).get('next') || '/dashboard'
        window.location.href = nextUrl
      } else {
        setError(data.error || 'Thông tin xác thực chưa chính xác.')
        setLoading(false)
      }
    } catch {
      setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra mạng và thử lại.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col lg:flex-row relative overflow-hidden selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Subtle Ambient Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-emerald-500/10 blur-[130px]" />
        <div className="absolute bottom-0 right-0 w-[520px] h-[520px] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Left Showcase Column (Desktop) */}
      <div className="hidden lg:flex lg:w-[52%] relative z-10 flex-col justify-between p-12 xl:p-16 border-r border-white/[0.07] bg-gradient-to-br from-[#080D1A]/90 via-[#060913]/90 to-[#0A1324]/90">
        <div className="flex items-center justify-between">
          <a href="/" className="inline-flex items-center gap-3 group no-underline">
            <div className="w-11 h-11 rounded-2xl bg-white/95 p-1.5 shadow-lg shadow-emerald-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
              <img src="/logo-dzota.png" alt="Dzota" className="w-full h-full object-contain" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block leading-none">
                DZOTA <span className="text-emerald-400">EDU</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400 tracking-wide">
                Nền Tảng Học Tập & Khảo Thí Thông Minh
              </span>
            </div>
          </a>

          <a
            href="/"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về Trang Chủ</span>
          </a>
        </div>

        <div className="max-w-xl space-y-8 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Hệ Sinh Thái Giáo Dục & Y Khoa Toàn Diện</span>
          </div>

          <h1 className="text-4xl xl:text-5xl font-black tracking-tight text-white leading-[1.15]">
            Một tài khoản duy nhất cho{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              mọi kỳ thi & học phần.
            </span>
          </h1>

          <p className="text-base text-slate-400 leading-relaxed">
            Đồng bộ tức thì lịch sử làm bài, Sổ tay lỗi sai AI, Trợ lý nghiên cứu giáo trình NoteBook ND, Cẩm nang 423+ hoạt chất Dược lý và Phòng thi chạy trạm OSCE.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white">Khảo Thí & Ngân Hàng Đề</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tạo đề AI chuẩn ma trận Bloom, thi Offline & đấu trường Battle.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold text-white">Dược Lý & OSCE Chạy Trạm</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                423+ thuốc lâm sàng, thẻ nhớ Anki SM-2 & tiêu bản giải phẫu.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 border-t border-white/[0.06] pt-6">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-400" />
            <span>Phát triển bởi <strong className="text-slate-300">Lê Nhật Duy (Y Khoa K26)</strong></span>
          </div>
          <span>Zalo hỗ trợ: <strong className="text-emerald-400">0914659511</strong></span>
        </div>
      </div>

      {/* Right Auth Form Column */}
      <div className="flex-1 relative z-10 flex flex-col justify-center items-center px-3.5 py-5 sm:px-8 sm:py-8 min-h-[100dvh]">
        {/* Mobile Top Bar */}
        <div className="w-full max-w-md flex lg:hidden items-center justify-between mb-4">
          <a href="/" className="inline-flex items-center gap-2 no-underline">
            <div className="w-8 h-8 rounded-xl bg-white p-1 flex items-center justify-center shadow">
              <img src="/logo-dzota.png" alt="Dzota" className="w-full h-full object-contain" />
            </div>
            <span className="text-base font-black text-white tracking-tight">
              DZOTA <span className="text-emerald-400">EDU</span>
            </span>
          </a>
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/10 text-xs font-semibold text-slate-300 no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trang chủ</span>
          </a>
        </div>

        <div className="w-full max-w-md bg-[#0D1322]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
          {/* Header */}
          <div className="text-center space-y-1.5 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cổng Xác Thực Bảo Mật Dzota</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === 'login' ? 'Chào mừng bạn quay lại' : 'Tạo tài khoản học tập'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              {mode === 'login'
                ? 'Đăng nhập để mở Bảng điều khiển, Đề thi & Sổ tay AI'
                : 'Đăng ký miễn phí chỉ trong 10 giây để lưu kết quả học tập'}
            </p>
          </div>

          {/* Segmented Switch */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-[#070B14] border border-white/[0.07] mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login')
                setError(null)
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register')
                setError(null)
              }}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Đăng ký mới
            </button>
          </div>

          {/* Google Sign-In Container */}
          <div className="flex flex-col items-center mb-5">
            <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
          </div>

          <div className="relative flex items-center justify-center my-5">
            <div className="border-t border-white/10 w-full" />
            <span className="bg-[#0D1322] px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              hoặc dùng tài khoản
            </span>
            <div className="border-t border-white/10 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Họ và tên hiển thị
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Anh"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#070B14] border border-white/10 focus:border-emerald-400 focus:outline-none text-sm text-white placeholder:text-slate-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                {mode === 'login' ? 'Tên đăng nhập hoặc Email' : 'Tên đăng nhập hoặc Gmail *'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập username hoặc địa chỉ email..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#070B14] border border-white/10 focus:border-emerald-400 focus:outline-none text-sm text-white placeholder:text-slate-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Mật khẩu *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'login' ? 'Nhập mật khẩu của bạn...' : 'Tối thiểu 4 ký tự...'}
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-[#070B14] border border-white/10 focus:border-emerald-400 focus:outline-none text-sm text-white placeholder:text-slate-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                  aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Vào Bàn Học Dzota' : 'Tạo Tài Khoản & Vào Học'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer helper */}
          <div className="mt-6 pt-5 border-t border-white/[0.07] text-center text-xs text-slate-400">
            Cần cấp quyền Giáo viên hoặc hỗ trợ lớp học?{' '}
            <a
              href="https://zalo.me/0914659511"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 font-bold underline underline-offset-2"
            >
              Liên hệ Zalo 0914659511
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
