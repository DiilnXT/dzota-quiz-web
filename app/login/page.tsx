'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/app/ThemeContext'
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  LogIn,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  X,
  Key,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react'

const DEFAULT_GOOGLE_CLIENT_ID = '900284408463-uie2edl4gq37pkk81a7bkhuud3fooeh2.apps.googleusercontent.com'

export default function LoginPage() {
  const router = useRouter()
  const { theme, isDark, toggleTheme } = useTheme()

  // Phương thức đăng nhập: 'google' (mặc định) hoặc 'account' (tài khoản thường)
  const [authMethod, setAuthMethod] = useState<'google' | 'account'>('google')

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [logoClicked, setLogoClicked] = useState(false)

  // Google OAuth States
  const [googleClientId, setGoogleClientId] = useState(DEFAULT_GOOGLE_CLIENT_ID)
  const [showGoogleModal, setShowGoogleModal] = useState(false)
  const [tempClientId, setTempClientId] = useState(DEFAULT_GOOGLE_CLIENT_ID)
  const [isSavingClientId, setIsSavingClientId] = useState(false)

  // Interactive 3D Card Tilt, Parallax & Mouse Spotlight Glow
  const cardRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, active: false })

  useEffect(() => {
    const fetchGoogleConfig = async () => {
      try {
        const localId = typeof window !== 'undefined' ? localStorage.getItem('dzota_google_client_id') || '' : ''
        const envId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''
        let id = envId || localId || DEFAULT_GOOGLE_CLIENT_ID
        if (!id) {
          const res = await fetch('/api/auth/google-config')
          if (res.ok) {
            const data = await res.json()
            if (data.clientId) id = data.clientId
          }
        }
        if (id) {
          setGoogleClientId(id)
          setTempClientId(id)
        }
      } catch (e) {}
    }
    fetchGoogleConfig()
  }, [])

  // Xử lý di chuyển chuột tạo hiệu ứng 3D Parallax & vệt sáng spotlight
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    // 3D Tilt mượt mà
    const tiltX = ((y - centerY) / centerY) * -6
    const tiltY = ((x - centerX) / centerX) * 6

    setTilt({ x: tiltX, y: tiltY })
    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      active: true
    })
    setMousePos({ x: e.clientX, y: e.clientY })
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

  // Xử lý đăng nhập bằng Google
  const handleGoogleSuccess = async (userInfo: { email: string; name?: string; picture?: string; sub?: string }) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleUser: userInfo })
      })
      const data = await res.json()

      if (res.ok) {
        if (data.role === 'ADMIN') {
          router.push('/dashboard')
        } else {
          router.push('/creator')
        }
      } else {
        setError(data.error || 'Đăng nhập Google thất bại.')
      }
    } catch (err) {
      setError('Lỗi kết nối máy chủ khi đăng nhập Google.')
    } finally {
      setLoading(false)
    }
  }

  // Khởi động cửa sổ đăng nhập Google
  const launchGoogleAuth = (clientId: string) => {
    if (typeof window === 'undefined') return

    // 1. Dùng Google OAuth2 Token Client (Popup chuẩn Google)
    if ((window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              if (tokenResponse.error !== 'popup_closed_by_user') {
                setError('Đăng nhập Google thất bại: ' + tokenResponse.error)
              }
              return
            }
            if (tokenResponse?.access_token) {
              setLoading(true)
              setError('')
              try {
                const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                })
                const userInfo = await userRes.json()
                await handleGoogleSuccess(userInfo)
              } catch (err) {
                setError('Không thể lấy thông tin tài khoản Google.')
              } finally {
                setLoading(false)
              }
            }
          }
        })
        client.requestAccessToken({ prompt: 'select_account' })
        return
      } catch (e) {
        console.error('Error initTokenClient:', e)
      }
    }

    // 2. Fallback sang Google Identity Services
    if ((window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response?.credential) {
              setLoading(true)
              setError('')
              try {
                const res = await fetch('/api/auth/login', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ credential: response.credential })
                })
                const data = await res.json()
                if (res.ok) {
                  if (data.role === 'ADMIN') router.push('/dashboard')
                  else router.push('/creator')
                } else {
                  setError(data.error || 'Đăng nhập Google thất bại.')
                }
              } catch (err) {
                setError('Lỗi kết nối máy chủ.')
              } finally {
                setLoading(false)
              }
            }
          }
        })
        (window as any).google.accounts.id.prompt()
        return
      } catch (e) {
        console.error('Error id.prompt:', e)
      }
    }

    setError('Đang tải thư viện Google, vui lòng thử lại sau 1-2 giây.')
  }

  const triggerGooglePrompt = () => {
    const activeId = googleClientId || (typeof window !== 'undefined' ? localStorage.getItem('dzota_google_client_id') : '') || DEFAULT_GOOGLE_CLIENT_ID
    if (!activeId || !activeId.includes('.apps.googleusercontent.com')) {
      setShowGoogleModal(true)
      return
    }
    launchGoogleAuth(activeId)
  }

  const handleSaveAndAuthGoogle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const id = tempClientId.trim()
    if (!id) {
      setError('Vui lòng nhập Google Client ID.')
      return
    }
    if (!id.includes('.apps.googleusercontent.com')) {
      setError('Google Client ID phải kết thúc bằng ".apps.googleusercontent.com"')
      return
    }

    setIsSavingClientId(true)
    setError('')
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('dzota_google_client_id', id)
      }
      setGoogleClientId(id)
      await fetch('/api/auth/google-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: id })
      })
      setShowGoogleModal(false)
      setTimeout(() => {
        launchGoogleAuth(id)
      }, 250)
    } catch (err) {
      setShowGoogleModal(false)
      launchGoogleAuth(id)
    } finally {
      setIsSavingClientId(false)
    }
  }

  return (
    <main
      ref={containerRef}
      className={`min-h-screen h-[100dvh] max-h-screen w-full relative flex items-center justify-center overflow-hidden p-3 sm:p-5 select-none dzota-login-bg ${
        isDark ? 'dark-login' : 'light-login'
      }`}
    >
      {/* Background Ambient Glow & Lighting Overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
        isDark ? 'bg-slate-950/60 backdrop-blur-[2px]' : 'bg-slate-900/[0.04]'
      }`} />

      {/* Interactive Cursor Spotlight Aura in Background */}
      <div
        className="absolute pointer-events-none transition-opacity duration-300 blur-3xl rounded-full"
        style={{
          width: '500px',
          height: '500px',
          left: `${mousePos.x - 250}px`,
          top: `${mousePos.y - 250}px`,
          background: isDark
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, rgba(59, 130, 246, 0.08) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(217, 70, 239, 0.08) 50%, transparent 70%)',
          opacity: spotlight.active ? 1 : 0.4
        }}
      />

      {/* Ambient Floating Dust / Light Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full blur-[1px] ${
              isDark ? 'bg-indigo-300/40' : 'bg-white/80'
            }`}
            style={{
              width: `${(i % 3) + 3}px`,
              height: `${(i % 3) + 3}px`,
              top: `${12 + (i * 15)}%`,
              left: `${8 + (i * 16)}%`,
              animation: `particleFloat ${7 + (i * 2)}s ease-in-out infinite alternate`
            }}
          />
        ))}
      </div>

      {/* Top Bar: Brand Pill on Left & Theme Toggle Button on Right */}
      <header className="absolute top-3 sm:top-5 left-3 sm:left-6 right-3 sm:right-6 z-30 flex items-center justify-between pointer-events-auto">
        {/* Left Brand Badge */}
        <div className="inline-flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-white/30 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-sm transition-all duration-300 hover:scale-105 cursor-default group">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/40 dark:bg-slate-800/60 backdrop-blur-md p-1 flex items-center justify-center border border-white/50 dark:border-white/15 group-hover:rotate-6 transition-transform">
            <img src="/logo-dzota.png" alt="Dzota" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight drop-shadow-xs">Dzota Education</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        {/* Right: Theme Toggle Button (Light / Dark) */}
        <button
          onClick={toggleTheme}
          type="button"
          aria-label={isDark ? "Chuyển sang giao diện Sáng" : "Chuyển sang giao diện Tối"}
          className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/40 dark:bg-slate-900/60 hover:bg-white/60 dark:hover:bg-slate-800/80 backdrop-blur-md border border-white/50 dark:border-white/15 shadow-sm text-slate-800 dark:text-slate-100 font-bold text-xs cursor-pointer transition-all active:scale-95 group"
          title={isDark ? "Bật giao diện Sáng" : "Bật giao diện Tối"}
        >
          {isDark ? (
            <>
              <Sun size={16} className="text-amber-400 group-hover:rotate-90 transition-transform duration-300" />
              <span className="hidden xs:inline">Giao diện Sáng</span>
            </>
          ) : (
            <>
              <Moon size={16} className="text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
              <span className="hidden xs:inline">Giao diện Tối</span>
            </>
          )}
        </button>
      </header>

      {/* Main Container - Compact and vertically centered to fit 100% without scrolling */}
      <div className="relative w-full z-20 mx-auto flex flex-col items-center justify-center max-w-[430px] my-auto">
        {/* 3D Tilt & Mouse-Glow Glass Card */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative w-full rounded-[28px] sm:rounded-[32px] p-5 sm:p-7 transition-all duration-200 ease-out"
          style={{
            background: isDark
              ? 'rgba(15, 23, 42, 0.58)'
              : 'rgba(255, 255, 255, 0.32)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: isDark
              ? '1.5px solid rgba(255, 255, 255, 0.12)'
              : '1.5px solid rgba(255, 255, 255, 0.65)',
            boxShadow: isDark
              ? '0 25px 60px rgba(0, 0, 0, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.15)'
              : '0 25px 60px rgba(15, 25, 55, 0.15), inset 0 1px 1px rgba(255, 255, 255, 0.75)',
            transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Dynamic Spotlight Following Mouse inside the Card */}
          {spotlight.active && (
            <div
              className="absolute inset-0 rounded-[28px] sm:rounded-[32px] pointer-events-none transition-opacity duration-300"
              style={{
                background: isDark
                  ? `radial-gradient(320px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.12), transparent 75%)`
                  : `radial-gradient(320px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255, 255, 255, 0.45), transparent 75%)`
              }}
            />
          )}

          {/* Card Top: Logo & Title (Compact header) */}
          <div className="text-center mb-4 relative z-10">
            <div
              onClick={handleLogoClick}
              className={`relative w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-white/40 dark:bg-slate-800/50 backdrop-blur-md p-2 flex items-center justify-center shadow-md border-2 border-white/60 dark:border-white/20 mb-2.5 cursor-pointer group transition-all duration-300 hover:scale-110 ${
                logoClicked ? 'animate-logo-spin' : ''
              }`}
              style={{
                animation: logoClicked ? undefined : 'floatGentle 4.5s ease-in-out infinite'
              }}
              title="Bấm vào để xoay logo Dzota!"
            >
              <img
                src="/logo-dzota.png"
                alt="Dzota Logo"
                className="w-full h-full object-contain filter drop-shadow-md transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md border-2 border-white">
                <Sparkles size={9} className="text-amber-300" />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight drop-shadow-xs">
              Đăng nhập Dzota
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold mt-0.5 drop-shadow-xs">
              Hệ thống trắc nghiệm & quản lý đề thi trực tuyến
            </p>
          </div>

          {/* Interactive Method Selector: [ Google ] vs [ Tài khoản ] */}
          <div className="relative z-10 mb-4 p-1 rounded-2xl bg-white/40 dark:bg-slate-900/60 border border-white/50 dark:border-white/10 flex items-center gap-1 shadow-inner">
            {/* Tab: Google */}
            <button
              type="button"
              onClick={() => { setAuthMethod('google'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                authMethod === 'google'
                  ? 'bg-white dark:bg-indigo-600 text-blue-700 dark:text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Bằng Google</span>
            </button>

            {/* Tab: Tài khoản */}
            <button
              type="button"
              onClick={() => { setAuthMethod('account'); setError(''); }}
              className={`flex-1 py-2 px-3 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                authMethod === 'account'
                  ? 'bg-white dark:bg-indigo-600 text-blue-700 dark:text-white shadow-md scale-[1.02]'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <User size={15} />
              <span>Bằng Tài Khoản</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-3.5 p-3 rounded-2xl bg-rose-500/20 backdrop-blur-md border border-rose-400/50 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2 animate-shake shadow-sm">
              <AlertCircle size={16} className="flex-shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* VIEW 1: GOOGLE LOGIN (Gọn gàng, 1 click, vừa khít mọi màn hình) */}
          {authMethod === 'google' && (
            <div className="relative z-10 space-y-3.5 py-1 animate-fade-in">
              <div className="p-3.5 rounded-2xl bg-white/40 dark:bg-slate-900/40 border border-white/60 dark:border-white/10 text-center">
                <p className="text-xs text-slate-800 dark:text-slate-200 font-bold leading-relaxed">
                  Đăng nhập an toàn, tiện lợi qua Gmail của bạn.
                </p>
                <div className="flex items-center justify-center gap-2 mt-1.5 text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                  <CheckCircle2 size={13} />
                  <span>Tự động nhận diện Giáo viên & Admin</span>
                </div>
              </div>

              {/* Big Prominent Google Button */}
              <button
                type="button"
                onClick={triggerGooglePrompt}
                disabled={loading}
                className="relative overflow-hidden w-full h-13 sm:h-14 rounded-2xl font-black text-slate-800 dark:text-slate-900 text-sm sm:text-base bg-white hover:bg-slate-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer border-2 border-white shadow-[0_10px_30px_rgba(66,133,244,0.3)] hover:shadow-[0_16px_36px_rgba(66,133,244,0.45)] group disabled:opacity-70 disabled:pointer-events-none"
              >
                {/* Continuous Shimmer Light */}
                <div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent -translate-x-full pointer-events-none"
                  style={{ animation: 'shimmerSweep 2.8s infinite ease-in-out' }}
                />

                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <span>Đang kết nối Google...</span>
                  </div>
                ) : (
                  <>
                    <svg className="w-6 h-6 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Tiếp tục với Google</span>
                    <ArrowRight size={18} className="text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setAuthMethod('account')}
                  className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
                >
                  Hoặc sử dụng tên đăng nhập & mật khẩu ➔
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: TÀI KHOẢN & MẬT KHẨU (Gọn gàng) */}
          {authMethod === 'account' && (
            <form onSubmit={handleLogin} className="space-y-3 relative z-10 animate-fade-in">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-white mb-1 pl-1 flex items-center justify-between">
                  <span>Tên đăng nhập</span>
                  {focusedField === 'username' && (
                    <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-300">Đang nhập...</span>
                  )}
                </label>
                <div className="relative group">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-all ${
                      focusedField === 'username' ? 'text-blue-600 dark:text-cyan-300 scale-110' : 'text-slate-500'
                    }`}
                  >
                    <User size={17} />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Nhập username"
                    autoComplete="username"
                    required
                    className="w-full h-11 sm:h-12 pl-10 pr-3 bg-white/40 dark:bg-slate-900/50 border-2 border-white/60 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder-slate-500 outline-none transition-all focus:bg-white/60 dark:focus:bg-slate-900/80 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-black text-slate-900 dark:text-white mb-1 pl-1 flex items-center justify-between">
                  <span>Mật khẩu</span>
                  {focusedField === 'password' && (
                    <span className="text-[10px] font-bold text-blue-700 dark:text-cyan-300">Bảo mật</span>
                  )}
                </label>
                <div className="relative group">
                  <div
                    className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-all ${
                      focusedField === 'password' ? 'text-blue-600 dark:text-cyan-300 scale-110' : 'text-slate-500'
                    }`}
                  >
                    <Lock size={17} />
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
                    className="w-full h-11 sm:h-12 pl-10 pr-10 bg-white/40 dark:bg-slate-900/50 border-2 border-white/60 dark:border-white/10 rounded-xl text-xs sm:text-sm font-bold text-slate-900 dark:text-white placeholder-slate-500 outline-none transition-all focus:bg-white/60 dark:focus:bg-slate-900/80 focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-blue-600 cursor-pointer"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Back to Google */}
              <div className="flex items-center justify-between text-[11px] sm:text-xs pt-0.5">
                <label className="inline-flex items-center gap-1.5 cursor-pointer font-bold text-slate-800 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                  />
                  <span>Ghi nhớ</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAuthMethod('google')}
                  className="font-bold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
                >
                  Đăng nhập Google ➔
                </button>
              </div>

              {/* Submit Button */}
              <div className="pt-1.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="relative overflow-hidden w-full h-11 sm:h-12 rounded-xl font-bold text-white text-xs sm:text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 group"
                  style={{
                    background: 'linear-gradient(100deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%)'
                  }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full pointer-events-none"
                    style={{ animation: 'shimmerSweep 3s infinite ease-in-out' }}
                  />
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Đang đăng nhập...</span>
                    </div>
                  ) : (
                    <>
                      <LogIn size={17} className="transition-transform group-hover:scale-110" />
                      <span>Đăng nhập tài khoản</span>
                      <ArrowRight size={17} className="transition-transform duration-200 group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Security Footnote */}
          <div className="mt-4 pt-3 border-t border-white/40 dark:border-white/10 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
            <ShieldCheck size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span>Mã hóa bảo mật an toàn 100%</span>
          </div>
        </div>
      </div>

      {/* MODAL CẤU HÌNH GOOGLE CLIENT ID (NẾU CẦN) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in select-text">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative animate-pop-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white">Cấu hình Google OAuth Client ID</h3>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 flex items-center justify-center cursor-pointer"
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleSaveAndAuthGoogle} className="pt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Google Client ID của bạn:
                </label>
                <input
                  type="text"
                  value={tempClientId}
                  onChange={(e) => setTempClientId(e.target.value)}
                  placeholder="...apps.googleusercontent.com"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white outline-none focus:border-blue-600"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isSavingClientId}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {isSavingClientId ? 'Đang lưu...' : 'Lưu & Đăng Nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Global Embedded Styles for Animations & Responsive Background */}
      <style>{`
        .dzota-login-bg {
          background-image: url('/bg-login-mobile.png'), url('https://i.ibb.co/9kyXLchK/f268cd60-295b-4376-a64c-b0cd9f4e25b9.png');
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
        }

        @media (min-width: 1024px) {
          .dzota-login-bg {
            background-image: url('/bg-login-desktop.png'), url('https://i.ibb.co/Gf87wSCQ/6151ea27-2022-4704-a5d5-61ece517d68f.png');
          }
        }

        @keyframes floatGentle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(1deg); }
        }

        @keyframes particleFloat {
          0% { transform: translateY(0) scale(1); opacity: 0.3; }
          100% { transform: translateY(-35px) scale(1.3); opacity: 0.85; }
        }

        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          50%, 100% { transform: translateX(160%); }
        }

        @keyframes logoSpin {
          0% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
          100% { transform: scale(1) rotate(360deg); }
        }

        .animate-logo-spin {
          animation: logoSpin 0.75s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-5px); }
          40%, 80% { transform: translateX(5px); }
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </main>
  )
}
