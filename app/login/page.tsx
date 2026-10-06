'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  LogIn,
  ShieldCheck,
  AlertCircle
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

    // Smooth subtle tilt
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
      {/* Background stays fully vibrant - minimal ambient overlay */}
      <div className="absolute inset-0 bg-slate-900/[0.03] pointer-events-none" />

      {/* Ambient Floating Dust / Light Particles (matching sunny window) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/70 blur-[1px] animate-pulse"
            style={{
              width: `${(i % 3) + 3}px`,
              height: `${(i % 3) + 3}px`,
              top: `${15 + (i * 14)}%`,
              left: `${8 + (i * 16)}%`,
              animation: `particleFloat ${7 + (i * 2)}s ease-in-out infinite alternate`
            }}
          />
        ))}
      </div>

      {/* Top-Left Minimalist Floating Glass Brand Pill on Desktop */}
      <div className="absolute top-6 left-6 z-20 hidden lg:inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white/20 hover:bg-white/35 backdrop-blur-md border border-white/40 shadow-sm transition-all duration-300 hover:scale-105 cursor-default group">
        <div className="w-8 h-8 rounded-xl bg-white/30 backdrop-blur-md p-1 flex items-center justify-center border border-white/50 group-hover:rotate-6 transition-transform">
          <img src="/logo-dzota.png" alt="Dzota" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-900 tracking-tight drop-shadow-xs">Dzota Education</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Main Outer Container: Centered on Laptop & Mobile */}
      <div className="relative w-full z-10 mx-auto flex flex-col items-center justify-center max-w-[460px]">
        {/* Mobile Header Brand (Trong suốt) */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-white/30 backdrop-blur-md p-1.5 flex items-center justify-center border border-white/50 shadow-md">
            <img src="/logo-dzota.png" alt="Dzota Logo" className="w-full h-full object-contain" />
          </div>
          <div className="text-left">
            <h2 className="text-xl font-black text-slate-900 leading-tight drop-shadow-xs">Dzota</h2>
            <p className="text-xs text-slate-800 font-bold drop-shadow-xs">Hệ thống quản lý đề thi</p>
          </div>
        </div>

            {/* 3D Tilt & Mouse-Glow PURE TRANSPARENT GLASS CARD */}
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative w-full rounded-[32px] p-7 sm:p-9 md:p-10 transition-transform duration-200 ease-out"
              style={{
                background: 'rgba(255, 255, 255, 0.22)',
                backdropFilter: 'blur(22px) saturate(180%)',
                WebkitBackdropFilter: 'blur(22px) saturate(180%)',
                border: '1.5px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 25px 60px rgba(15, 25, 55, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.7)',
                transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* Dynamic Torchlight / Spotlight Following Mouse */}
              {spotlight.active && (
                <div
                  className="absolute inset-0 rounded-[32px] pointer-events-none transition-opacity duration-300"
                  style={{
                    background: `radial-gradient(350px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.35), transparent 75%)`
                  }}
                />
              )}

              {/* Card Top Brand Logo (Trong suốt, hover phóng to, click xoay 360) */}
              <div className="text-center mb-6 sm:mb-8 relative z-10">
                <div
                  onClick={handleLogoClick}
                  className={`relative w-20 h-20 sm:w-22 sm:h-22 mx-auto rounded-3xl bg-white/30 backdrop-blur-md p-2.5 flex items-center justify-center shadow-lg border-2 border-white/60 mb-4 cursor-pointer group transition-all duration-300 hover:scale-110 hover:bg-white/45 ${
                    logoClicked ? 'animate-logo-spin' : ''
                  }`}
                  style={{
                    animation: logoClicked ? undefined : 'floatGentle 5s ease-in-out infinite'
                  }}
                  title="Bấm vào để xoay logo Dzota!"
                >
                  <img
                    src="/logo-dzota.png"
                    alt="Dzota Logo"
                    className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
                  />
                  {/* Subtle pulsing badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600/90 text-white flex items-center justify-center shadow-md border-2 border-white backdrop-blur-xs">
                    <Sparkles size={11} className="text-amber-300" />
                  </div>
                </div>

                <h1 className="text-2xl sm:text-[28px] font-black text-slate-900 tracking-tight leading-tight drop-shadow-xs">
                  Đăng nhập Dzota
                </h1>
                <p className="text-xs sm:text-sm text-slate-800 font-bold mt-1 drop-shadow-xs">
                  Hệ thống quản lý và làm bài thi trực tuyến
                </p>
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-400/50 text-rose-900 text-xs font-bold flex items-center gap-2.5 animate-shake shadow-sm">
                  <AlertCircle size={17} className="flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4 relative z-10">
                {/* Username Input (Trong suốt) */}
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-900 mb-1.5 pl-1 flex items-center justify-between drop-shadow-xs">
                    <span>Tài khoản</span>
                    {focusedField === 'username' && (
                      <span className="text-[11px] font-bold text-blue-700 animate-fade-in">Đang nhập...</span>
                    )}
                  </label>
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
                        focusedField === 'username' ? 'text-blue-700 scale-110' : 'text-slate-600 group-hover:text-slate-900'
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
                      className="w-full h-13 sm:h-14 pl-11 pr-4 bg-white/30 backdrop-blur-md border-2 border-white/55 rounded-2xl text-sm sm:text-base font-bold text-slate-900 placeholder-slate-600 outline-none transition-all duration-200 hover:border-white/80 focus:bg-white/45 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 focus:scale-[1.01]"
                    />
                  </div>
                </div>

                {/* Password Input (Trong suốt) */}
                <div>
                  <label className="block text-xs sm:text-sm font-black text-slate-900 mb-1.5 pl-1 flex items-center justify-between drop-shadow-xs">
                    <span>Mật khẩu</span>
                    {focusedField === 'password' && (
                      <span className="text-[11px] font-bold text-blue-700 animate-fade-in">Bảo mật</span>
                    )}
                  </label>
                  <div className="relative group">
                    <div
                      className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-all duration-200 ${
                        focusedField === 'password' ? 'text-blue-700 scale-110' : 'text-slate-600 group-hover:text-slate-900'
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
                      className="w-full h-13 sm:h-14 pl-11 pr-12 bg-white/30 backdrop-blur-md border-2 border-white/55 rounded-2xl text-sm sm:text-base font-bold text-slate-900 placeholder-slate-600 outline-none transition-all duration-200 hover:border-white/80 focus:bg-white/45 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/20 focus:scale-[1.01]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Hiển thị hoặc ẩn mật khẩu"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-600 hover:text-blue-700 hover:scale-115 active:scale-95 transition-all cursor-pointer"
                      title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff size={19} className="text-blue-700" /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="pt-1 flex items-center justify-between text-xs sm:text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none font-bold text-slate-900 hover:text-blue-900 transition-colors group drop-shadow-xs">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-white/70 cursor-pointer transition-transform group-active:scale-90"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => alert('Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu hoặc đổi mật khẩu mới.')}
                    className="font-black text-blue-700 hover:text-blue-900 hover:underline transition-colors cursor-pointer drop-shadow-xs"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Animated Transparent/Gradient Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative overflow-hidden w-full h-13 sm:h-14 rounded-2xl font-bold text-white text-base shadow-[0_10px_25px_rgba(37,99,235,0.35)] hover:shadow-[0_16px_36px_rgba(37,99,235,0.48)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:pointer-events-none group backdrop-blur-md"
                    style={{
                      background: 'linear-gradient(100deg, rgba(37, 99, 235, 0.92) 0%, rgba(79, 70, 229, 0.92) 50%, rgba(124, 58, 237, 0.92) 100%)'
                    }}
                  >
                    {/* Continuous Shimmer Light Sweep */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent -translate-x-full pointer-events-none"
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
              <div className="mt-6 pt-5 border-t border-white/35 flex items-center justify-center gap-1.5 text-xs font-bold text-slate-800 drop-shadow-xs">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Thông tin được bảo mật và mã hóa an toàn</span>
              </div>
            </div>

            {/* Mobile Bottom Mini Features (Trong suốt) */}
            <div className="lg:hidden mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: 'Chuẩn hóa đề' },
                { label: 'Giảng viên AI' },
                { label: 'Bảo mật 100%' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/20 backdrop-blur-md rounded-2xl p-2.5 border border-white/35 shadow-xs flex items-center justify-center transition-all active:scale-95"
                >
                  <span className="text-[11px] font-black text-slate-900 drop-shadow-xs">{item.label}</span>
                </div>
              ))}
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
