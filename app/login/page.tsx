'use client'

import React, { useState } from 'react'
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
  AlertCircle
} from 'lucide-react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
    <main
      className="min-h-screen w-full relative flex items-center justify-center overflow-x-hidden p-3 sm:p-6 lg:p-8 select-none"
      style={{
        background:
          'radial-gradient(circle at 15% 15%, rgba(129, 140, 248, 0.22), transparent 40%), radial-gradient(circle at 90% 20%, rgba(56, 189, 248, 0.2), transparent 40%), radial-gradient(circle at 50% 85%, rgba(99, 102, 241, 0.12), transparent 50%), linear-gradient(135deg, #F8FAFF 0%, #EEF4FF 100%)'
      }}
    >
      {/* Dynamic Background Glowing Orbs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 sm:w-[480px] sm:h-[480px] rounded-full pointer-events-none"
        style={{
          background: '#8B8AFB',
          opacity: 0.18,
          filter: 'blur(90px)',
          animation: 'pulseSlow 8s ease-in-out infinite alternate'
        }}
      />
      <div
        className="absolute -bottom-36 left-[15%] w-96 h-96 sm:w-[500px] sm:h-[500px] rounded-full pointer-events-none"
        style={{
          background: '#60A5FA',
          opacity: 0.2,
          filter: 'blur(100px)',
          animation: 'pulseSlow 10s ease-in-out infinite alternate'
        }}
      />
      <div
        className="absolute -top-28 -right-28 w-80 h-80 sm:w-[460px] sm:h-[460px] rounded-full pointer-events-none"
        style={{
          background: '#67E8F9',
          opacity: 0.16,
          filter: 'blur(95px)',
          animation: 'pulseSlow 9s ease-in-out infinite alternate'
        }}
      />

      {/* Main Outer Container */}
      <div
        className="relative w-full z-10 mx-auto flex items-center justify-center"
        style={{ maxWidth: 1240 }}
      >
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ══════════════════════════════════════════════════════════════════════
              DESKTOP LEFT SHOWCASE (Ẩn trên mobile / tablet nhỏ)
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:flex lg:col-span-7 flex-col justify-between relative rounded-[32px] p-8 xl:p-11 min-h-[620px] xl:min-h-[650px] overflow-hidden border border-white/80 shadow-[0_20px_70px_rgba(30,60,120,0.08)] bg-white/45 backdrop-blur-[24px]">
            {/* Top Bar inside Left Showcase */}
            <div className="flex items-center justify-between w-full relative z-10">
              {/* Brand Logo & Title */}
              <div className="flex items-center gap-3.5 group cursor-default">
                <div
                  className="w-13 h-13 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3"
                  style={{
                    background: 'linear-gradient(135deg, #4F46FF 0%, #2563EB 100%)'
                  }}
                >
                  <Sparkles size={24} className="text-white drop-shadow" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-[#10213F] tracking-tight leading-tight">
                    Dzota
                  </h2>
                  <p className="text-xs font-semibold text-[#64748B]">
                    Hệ thống quản lý đề thi
                  </p>
                </div>
              </div>

              {/* Admin Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-[#DCE6F3] text-[#475569] text-xs font-bold shadow-2xs backdrop-blur-md">
                <GraduationCap size={15} className="text-indigo-600" />
                <span>Dành cho giáo viên và quản trị viên</span>
              </div>
            </div>

            {/* Mid Headline & Subtitle */}
            <div className="relative z-10 my-auto py-6 max-w-[500px]">
              {/* Welcome Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#E8F0FF] text-[#2563EB] text-xs font-bold mb-4 shadow-2xs">
                <span>Chào mừng đến với Dzota</span>
                <span className="text-sm">👋</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl xl:text-5xl font-extrabold text-[#10213F] tracking-tight leading-[1.15] mb-3">
                Quản lý đề thi <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#4F46FF]">
                  hiệu quả hơn
                </span>
              </h1>

              <p className="text-base text-[#64748B] font-medium leading-relaxed mb-6">
                Hệ thống quản lý thư viện đề thi hiện đại, trực quan, hỗ trợ ngân hàng câu hỏi và chấm thi tự động.
              </p>

              {/* Feature Points */}
              <div className="space-y-3">
                {[
                  {
                    icon: FileText,
                    title: 'Quản lý đề thi',
                    desc: 'Lưu trữ, phân loại, tìm kiếm dễ dàng',
                    color: '#2563EB',
                    bg: 'rgba(37, 99, 235, 0.1)'
                  },
                  {
                    icon: BarChart2,
                    title: 'Thống kê chi tiết',
                    desc: 'Theo dõi, báo cáo trực quan',
                    color: '#4F46FF',
                    bg: 'rgba(79, 70, 229, 0.1)'
                  },
                  {
                    icon: Shield,
                    title: 'Bảo mật an toàn',
                    desc: 'Dữ liệu được bảo vệ tuyệt đối',
                    color: '#7C3AED',
                    bg: 'rgba(124, 58, 237, 0.1)'
                  }
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3.5 p-2.5 rounded-2xl transition-all duration-300 hover:bg-white/80 hover:shadow-xs group cursor-default"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                      style={{ background: item.bg, color: item.color }}
                    >
                      <item.icon size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[#10213F]">
                        {item.title}
                      </div>
                      <div className="text-xs text-[#64748B] font-medium">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom 3D Study Illustration Artwork */}
            <div
              className="absolute -bottom-4 right-2 xl:right-6 w-[270px] xl:w-[320px] pointer-events-none select-none z-0 opacity-95"
              style={{ animation: 'floatGentle 6s ease-in-out infinite' }}
            >
              <img
                src="/login-illustration.png"
                alt="3D Education Illustration"
                className="w-full h-auto object-contain"
                style={{ filter: 'drop-shadow(0 20px 30px rgba(37, 99, 235, 0.18))' }}
              />
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════════
              RIGHT / MOBILE LOGIN CARD
             ══════════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 w-full max-w-[480px] mx-auto">
            {/* Mobile Brand Header */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-500/25"
                style={{
                  background: 'linear-gradient(135deg, #4F46FF 0%, #2563EB 100%)'
                }}
              >
                <Sparkles size={22} className="text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-xl font-extrabold text-[#10213F] leading-tight">
                  Dzota
                </h2>
                <p className="text-xs text-[#64748B] font-medium">
                  Hệ thống quản lý đề thi
                </p>
              </div>
            </div>

            {/* Main Glassmorphic Login Card */}
            <div
              className="relative w-full rounded-[30px] p-7 sm:p-9 md:p-10 transition-all duration-300"
              style={{
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(25px)',
                WebkitBackdropFilter: 'blur(25px)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 25px 70px rgba(31, 45, 80, 0.14)'
              }}
            >
              {/* Card Center Logo & Titles */}
              <div className="text-center mb-7 sm:mb-8">
                <div
                  className="w-16 h-16 sm:w-18 sm:h-18 mx-auto rounded-2xl sm:rounded-[20px] flex items-center justify-center text-white shadow-xl shadow-indigo-500/25 mb-4 group cursor-pointer transition-transform duration-300 hover:scale-105"
                  style={{
                    background: 'linear-gradient(135deg, #4F46FF 0%, #2563EB 100%)'
                  }}
                >
                  <Sparkles size={28} className="text-white drop-shadow" />
                </div>
                <h1 className="text-2xl sm:text-[28px] font-black text-[#17233D] tracking-tight leading-tight">
                  Đăng nhập Dzota
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] font-semibold mt-1.5">
                  Hệ thống quản lý thư viện đề thi
                </p>
              </div>

              {/* Error Alert Banner */}
              {error && (
                <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-2.5 animate-shake">
                  <AlertCircle size={17} className="flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#17233D] mb-1.5 pl-1">
                    Tài khoản
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] transition-colors group-focus-within:text-[#4F46FF]">
                      <User size={19} />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Nhập tên đăng nhập"
                      autoComplete="username"
                      required
                      className="w-full h-13 sm:h-14 pl-11 pr-4 bg-[#F8FAFC] border border-[#DCE6F3] rounded-[18px] text-sm sm:text-base font-semibold text-[#17233D] placeholder-[#94A3B8] outline-none transition-all duration-200 focus:bg-white focus:border-[#4F46FF] focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-[#17233D] mb-1.5 pl-1">
                    Mật khẩu
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8] transition-colors group-focus-within:text-[#4F46FF]">
                      <Lock size={19} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      autoComplete="current-password"
                      required
                      className="w-full h-13 sm:h-14 pl-11 pr-12 bg-[#F8FAFC] border border-[#DCE6F3] rounded-[18px] text-sm sm:text-base font-semibold text-[#17233D] placeholder-[#94A3B8] outline-none transition-all duration-200 focus:bg-white focus:border-[#4F46FF] focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Hiển thị hoặc ẩn mật khẩu"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#94A3B8] hover:text-[#4F46FF] transition-colors cursor-pointer"
                    >
                      {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password Row */}
                <div className="pt-1 flex items-center justify-between text-xs sm:text-sm">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none font-medium text-[#475569] hover:text-[#17233D] transition-colors">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-indigo-500 border-[#CBD5E1] cursor-pointer"
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => alert('Vui lòng liên hệ Quản trị viên để đặt lại mật khẩu.')}
                    className="font-bold text-[#2563EB] hover:text-[#4F46FF] hover:underline transition-colors cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-13 sm:h-14 rounded-[18px] font-bold text-white text-base shadow-[0_12px_28px_rgba(37,99,235,0.28)] hover:shadow-[0_16px_34px_rgba(37,99,235,0.36)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-70 disabled:pointer-events-none group"
                    style={{
                      background:
                        'linear-gradient(100deg, #4F46FF 0%, #2563EB 55%, #7C3AED 100%)',
                      border: 'none'
                    }}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang đăng nhập...</span>
                      </div>
                    ) : (
                      <>
                        <LogIn size={18} />
                        <span>Đăng nhập hệ thống</span>
                        <ArrowRight
                          size={18}
                          className="transition-transform duration-200 group-hover:translate-x-1"
                        />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Security Footnote */}
              <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs font-semibold text-[#64748B]">
                <ShieldCheck size={15} className="text-emerald-500" />
                <span>Thông tin đăng nhập của bạn được bảo mật tuyệt đối</span>
              </div>
            </div>

            {/* Mobile Bottom Mini Features */}
            <div className="lg:hidden mt-6 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: FileText, label: 'Quản lý đề thi' },
                { icon: BarChart2, label: 'Thống kê' },
                { icon: Shield, label: 'Bảo mật' }
              ].map((item, i) => (
                <div
                  key={i}
                  className="bg-white/60 backdrop-blur-md rounded-2xl p-2.5 border border-white/80 shadow-2xs flex flex-col items-center gap-1"
                >
                  <item.icon size={16} className="text-[#2563EB]" />
                  <span className="text-[11px] font-bold text-[#475569]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Floating Keyframe Animation */}
      <style>{`
        @keyframes floatGentle {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-8px) rotate(0.5deg);
          }
        }
        @keyframes pulseSlow {
          0% {
            transform: scale(1);
          }
          100% {
            transform: scale(1.08);
          }
        }
      `}</style>
    </main>
  )
}
