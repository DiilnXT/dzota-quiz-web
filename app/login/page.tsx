'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  LogIn,
  GraduationCap,
  FileText,
  BarChart2,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Zap,
  Check
} from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [logoClicked, setLogoClicked] = useState(false)
  
  // Interactive 3D Card Tilt & Mouse Spotlight Glow
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, active: false })

  const router = useRouter()

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // Max tilt ~ 6 degrees for smooth natural feel
    const tiltX = ((y - centerY) / centerY) * -5
    const tiltY = ((x - centerX) / centerX) * 5

    setTilt({ x: tiltX, y: tiltY })
    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      active: true
    })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
    setSpotlight(prev => ({ ...prev, active: false }))
  }

  const handleLogoClick = () => {
    setLogoClicked(true)
    setTimeout(() => setLogoClicked(false), 800)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) {
      setError('Vui lòng nhập tên đăng nhập.')
      return
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()

      if (res.ok) {
        if (data.role === 'ADMIN') {
          router.push('/dashboard')
        } else {
          router.push('/creator')
        }
      } else {
        setError(data.error || 'Tên đăng nhập hoặc mật khẩu không chính xác.')
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full relative flex items-center justify-center overflow-x-hidden p-3 sm:p-6 lg:p-10 select-none dzota-login-bg">
      {/* Background Dimming & Blur Overlay to enhance readability while keeping artwork vibrant */}
      <div className="absolute inset-0 bg-slate-900/10 lg:bg-slate-900/5 backdrop-blur-[0.5px] pointer-events-none" />

      {/* Floating Animated Sunbeams & Ambient Glow Orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.22) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'floatSlow1 10s ease-in-out infinite'
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 sm:w-[450px] sm:h-[450px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(129, 140, 248, 0.2) 0%, transparent 70%)',
          filter: 'blur(70px)',
          animation: 'floatSlow2 12s ease-in-out infinite'
        }}
      />

      {/* Ambient Floating Dust/Light Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/60 blur-[1px] animate-pulse"
            style={{
              width: `${(i % 3) + 3}px`,
              height: `${(i % 3) + 3}px`,
              top: `${15 + (i * 14)}%`,
              left: `${10 + (i * 15)}%`,
              animation: `particleFloat ${6 + (i * 2)}s ease-in-out infinite alternate`
            }}
          />
        ))}
      </div>

      {/* Main Outer Container */}
      <div
        className="relative w-full z-10 mx-auto flex items-center justify-between"
        style={{ maxWidth: 1280 }}
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[580px]">
          
          {/* ══════════════════════════════════════════════════════════════════════
              DESKTOP LEFT SIDE: Interactive Ambient Badges (Không che mất tranh)
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between py-6 h-full pointer-events-auto">
            {/* Top Brand Pill with Logo */}
            <div className="inline-flex items-center gap-3 p-2 pr-5 rounded-2xl bg-white/80 hover:bg-white/95 backdrop-blur-xl border border-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 hover:scale-105 hover:shadow-lg w-fit cursor-default group">
              <div className="w-11 h-11 rounded-xl bg-white p-1 flex items-center justify-center shadow-xs border border-blue-100 group-hover:rotate-6 transition-transform">
                <img src="/logo-dzota.png" alt="Dzota Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">Dzota</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                    Edu AI
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Hệ thống quản lý đề thi & học tập</p>
              </div>
            </div>

            {/* Middle Welcome & Interactive Highlights */}
            <div className="my-auto py-8 max-w-[480px]">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-600/90 text-white text-xs font-bold mb-4 shadow-md backdrop-blur-md animate-bounce-subtle">
                <Sparkles size={14} className="text-amber-300" />
                <span>Nền tảng khảo thí & ôn luyện thông minh</span>
              </div>

              <h1 className="text-4xl xl:text-5xl font-black text-slate-900 tracking-tight leading-[1.15] mb-4 drop-shadow-sm">
                Quản lý đề thi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
                  Dễ Dàng & Hiệu Quả
                </span>
              </h1>

              <p className="text-slate-700 font-medium text-base leading-relaxed mb-6 bg-white/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/60 shadow-xs">
                Tạo đề thi trắc nghiệm bằng AI, nhập liệu từ Word/PDF tự động, và giải thích chi tiết câu hỏi chuẩn từng bước.
              </p>

              {/* Floating Mini Feature Badges with Hover Interactions */}
              <div className="flex flex-wrap gap-2.5">
                {[
                  { icon: Zap, text: 'Chuẩn hóa Markdown Dzota', color: 'text-amber-600 bg-amber-50/90 border-amber-200' },
                  { icon: GraduationCap, text: 'Trợ lý Giảng Viên AI (?)', color: 'text-indigo-600 bg-indigo-50/90 border-indigo-200' },
                  { icon: BarChart2, text: 'Thống kê & Chấm điểm tự động', color: 'text-emerald-600 bg-emerald-50/90 border-emerald-200' },
                  { icon: ShieldCheck, text: 'Bảo mật an toàn 100%', color: 'text-blue-600 bg-blue-50/90 border-blue-200' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-xs backdrop-blur-md transition-all duration-200 hover:scale-105 hover:shadow-md cursor-default ${item.color}`}
                  >
                    <item.icon size={15} />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Slogan Note */}
            <div className="text-xs font-bold text-slate-600/90 flex items-center gap-2 bg-white/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/70 w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Hệ thống hoạt động trực tuyến 24/7</span>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              RIGHT SIDE / MOBILE: Glassmorphic 3D Interactive Login Card
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-6 xl:col-span-5 w-full max-w-[460px] mx-auto lg:ml-auto">
            
            {/* Mobile Header Brand */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-white p-1.5 flex items-center justify-center shadow-lg border border-white/80">
                <img src="/logo-dzota.png" alt="Dzota Logo" className="w-full h-full object-contain" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-black text-slate-900 leading-tight drop-shadow-xs">Dzota</h2>
                <p className="text-xs text-slate-700 font-bold">Hệ thống quản lý đề thi</p>
              </div>
            </div>

            {/* 3D Tilt & Mouse-Glow Card Wrapper */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full rounded-[32px] p-7 sm:p-9 md:p-10 transition-transform duration-200 ease-out"
              style={{
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(28px)',
                WebkitBackdropFilter: 'blur(28px)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 25px 70px rgba(15, 30, 65, 0.18), 0 0 40px rgba(59, 130, 246, 0.1)',
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Dynamic Torchlight / Spotlight Following Mouse */}
              {spotlight.active && (
                <div
                  className="absolute inset-0 rounded-[32px] pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(350px circle at ${spotlight.x}% ${spotlight.y}%, rgba(59, 130, 246, 0.15), transparent 75%)`
                  }}
                />
              )}

              {/* Card Top Brand Logo with Click / Hover Effects */}
              <div className="text-center mb-6 sm:mb-8 relative z-10">
                <div
                  onClick={handleLogoClick}
                  className={`relative w-20 h-20 sm:w-22 sm:h-22 mx-auto rounded-3xl bg-white p-2.5 flex items-center justify-center shadow-xl shadow-blue-500/20 border-2 border-white/90 mb-4 cursor-pointer group transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/30 ${
                    logoClicked ? 'animate-logo-spin' : ''
                  }`}
                  style={{
                    animation: logoClicked ? undefined : 'floatGentle 5s ease-in-out infinite'
                  }}
                  title="Nhấn vào để xem hiệu ứng xoay logo!"
                >
                  <img
                    src="/logo-dzota.png"
                    alt="Dzota Logo"
                    className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Subtle pulsing badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                    <Sparkles size={11} className="text-amber-300" />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight">
                  Đăng nhập Dzota
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
                  Hệ thống quản lý và làm bài thi trực tuyến
                </p>
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2.5 animate-shake shadow-xs">
                  <AlertCircle size={17} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                {/* Username Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 pl-1 flex items-center justify-between">
                    <span>Tài khoản</span>
                    {focusedField === 'username' && (
                      <span className="text-[11px] font-bold text-blue-600 animate-fade-in">Đang nhập...</span>
                    )}
                  </label>
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
                        focusedField === 'username' ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <User size={19} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nhập tên đăng nhập"
                      autoComplete="username"
                      required
                      className="w-full h-13 sm:h-14 pl-11 pr-4 bg-slate-50/90 border-2 border-slate-200/80 rounded-2xl text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:scale-[1.01]"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5 pl-1 flex items-center justify-between">
                    <span>Mật khẩu</span>
                    {focusedField === 'password' && (
                      <span className="text-[11px] font-bold text-blue-600 animate-fade-in">Bảo mật</span>
                    )}
                  </label>
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
                        focusedField === 'password' ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    >
                      <Lock size={19} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      placeholder="Nhập mật khẩu"
                      autoComplete="current-password"
                      required
                      className="w-full h-13 sm:h-14 pl-11 pr-12 bg-slate-50/90 border-2 border-slate-200/80 rounded-2xl text-sm sm:text-base font-bold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15 focus:scale-[1.01]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Hiển thị hoặc ẩn mật khẩu"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 hover:scale-115 active:scale-95 transition-all cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={19} className="text-blue-600" /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="pt-1 flex items-center justify-between text-xs sm:text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-600 hover:text-slate-900 transition-colors group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer transition-transform group-active:scale-90"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => alert('Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu hoặc đổi mật khẩu mới.')}
                    className="font-bold text-blue-600 hover:text-indigo-600 hover:underline transition-colors cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* High-Impact Animated Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative overflow-hidden w-full h-13 sm:h-14 rounded-2xl font-bold text-white text-base shadow-[0_10px_28px_rgba(37,99,235,0.32)] hover:shadow-[0_16px_36px_rgba(37,99,235,0.45)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:pointer-events-none group"
                    style={{
                      background: 'linear-gradient(100deg, #2563EB 0%, #4F46FF 50%, #7C3AED 100%)',
                      backgroundSize: '200% 100%'
                    }}
                  >
                    {/* Continuous Shimmer Light Sweep */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full pointer-events-none"
                      style={{ animation: 'shimmerSweep 3s infinite ease-in-out' }}
                    />

                    {loading ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang đăng nhập...</span>
                      </div>
                    ) : (
                      <>
                        <LogIn size={19} className="transition-transform group-hover:scale-110" />
                        <span className="tracking-wide">Đăng nhập hệ thống</span>
                        <ArrowRight
                          size={19}
                          className="transition-transform duration-200 group-hover:translate-x-1.5"
                        />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Footnote */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500">
                <ShieldCheck size={16} className="text-emerald-500" />
                <span>Thông tin được bảo mật và mã hóa an toàn</span>
              </div>
            </div>

            {/* Mobile Bottom Mini Features */}
            <div className="lg:hidden mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: Zap, label: 'Chuẩn hóa đề' },
                { icon: GraduationCap, label: 'Giảng viên AI' },
                { icon: ShieldCheck, label: 'Bảo mật 100%' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/80 backdrop-blur-md rounded-2xl p-2.5 border border-white/90 shadow-sm flex flex-col items-center gap-1 transition-all active:scale-95"
                >
                  <item.icon size={16} className="text-blue-600" />
                  <span className="text-[11px] font-bold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>

      {/* Global Embedded Styles for Animations & Responsive Background */}
      <style>{`
        /* Responsive Background Image Setup */
        .dzota-login-bg {
          background-image: url('/bg-login-mobile.png'), url('https://i.ibb.co/9kyXLchK/f268cd60-295b-4376-a64c-b0cd9f4e25b9.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          background-attachment: fixed;
        }

        @media (min-width: 1024px) {
          .dzota-login-bg {
            background-image: url('/bg-login-desktop.png'), url('https://i.ibb.co/Gf87wSCQ/6151ea27-2022-4704-a5d5-61ece517d68f.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
          }
        }

        /* Keyframes */
        @keyframes floatGentle {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(1deg);
          }
        }

        @keyframes floatSlow1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(30px, -20px) scale(1.1);
          }
        }

        @keyframes floatSlow2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-25px, 25px) scale(1.08);
          }
        }

        @keyframes particleFloat {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0.3;
          }
          100% {
            transform: translateY(-40px) scale(1.4);
            opacity: 0.9;
          }
        }

        @keyframes shimmerSweep {
          0% {
            transform: translateX(-100%);
          }
          50%, 100% {
            transform: translateX(150%);
          }
        }

        @keyframes logoSpin {
          0% {
            transform: scale(1) rotate(0deg);
          }
          50% {
            transform: scale(1.2) rotate(180deg);
          }
          100% {
            transform: scale(1) rotate(360deg);
          }
        }

        .animate-logo-spin {
          animation: logoSpin 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes bounceSubtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }

        .animate-bounce-subtle {
          animation: bounceSubtle 3s ease-in-out infinite;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </main>
  )
}
