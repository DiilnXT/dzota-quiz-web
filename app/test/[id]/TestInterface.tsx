'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Play, ArrowRight, FileText, BarChart2, Sparkles, BookOpen, GraduationCap, PenLine } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TestInterface({ test }: { test: any }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(!test.password)
  const [isStarted, setIsStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60)
  const [mounted, setMounted] = useState(false)
  
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showExplanation, setShowExplanation] = useState<Record<string, 'correct' | 'incorrect'>>({})
  
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let timer: any
    if (isStarted && !submitted && test.mode === 'exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isStarted, submitted, timeLeft, test.mode])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }
  
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === test.password) {
      setIsAuthenticated(true)
    } else {
      alert("Sai mật khẩu!")
    }
  }

  const handleSelectAnswer = (qId: string, optKey: string) => {
    if (submitted && test.mode === 'exam') return
    setAnswers(prev => ({ ...prev, [qId]: optKey }))
    
    if (test.mode === 'practice') {
      const q = test.questions.find((tq: any) => tq.question.id === qId).question
      if (q.correctOption === optKey) {
        setShowExplanation(prev => ({ ...prev, [qId]: 'correct' }))
      } else {
        setShowExplanation(prev => ({ ...prev, [qId]: 'incorrect' }))
      }
    }
  }

  const handleSubmit = () => {
    let correctCount = 0
    test.questions.forEach((tq: any) => {
      if (answers[tq.question.id] === tq.question.correctOption) {
        correctCount++
      }
    })
    setScore(parseFloat(((correctCount / test.questions.length) * 10).toFixed(1)))
    setSubmitted(true)
  }

  if (!test.isActive) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F2F7]">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Đã Khóa</h1>
          <p className="text-slate-500">Bài test này hiện đang bị tạm khóa.</p>
        </div>
      </div>
    )
  }

  // ─── Password Gate ───────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #E8F2FF 0%, #F7FBFF 60%, #fff 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full pointer-events-none" style={{ background: '#BBD7FF', opacity: 0.35, filter: 'blur(40px)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: '#9BC8FF', opacity: 0.25, filter: 'blur(50px)', transform: 'translate(30%, 30%)' }} />

        <div
          className="relative w-full max-w-sm rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.9)', boxShadow: '0 25px 70px rgba(40,100,180,0.18)' }}
        >
          <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg,#1677FF,#4FC3FF)' }} />
          <form onSubmit={handleAuth} className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3F8CFF,#1677FF)', boxShadow: '0 12px 30px rgba(22,119,255,0.25)' }}>
              <FileText size={32} className="text-white" />
            </div>
            <h1 className="text-xl font-extrabold text-[#102A56] mb-1">{test.title}</h1>
            <p className="text-[#64748B] text-sm mb-6">Vui lòng nhập mật khẩu để truy cập</p>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3.5 rounded-2xl mb-4 text-sm font-medium focus:outline-none"
              style={{ background: 'rgba(235,244,255,0.85)', border: '1px solid rgba(255,255,255,0.9)' }}
              placeholder="Nhập mật khẩu bài test"
              required
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-full font-bold text-white text-base transition-all"
              style={{ background: 'linear-gradient(100deg,#1677FF,#168BFF,#4CC9FF)', boxShadow: '0 14px 30px rgba(22,119,255,0.28)' }}
            >
              Xác Nhận
            </button>
            <p className="mt-6 text-xs text-[#64748B]">Bản quyền thuộc về <span className="font-bold text-[#102A56]">Nhật Duy Y Khoa K26</span></p>
          </form>
        </div>
      </div>
    )
  }

  // ─── Landing Page (before start) ─────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center p-4 py-24 sm:py-32 md:p-8 relative overflow-x-hidden"
        style={{ background: 'radial-gradient(ellipse at 60% 40%, #E8F2FF 0%, #F7FBFF 60%, #fff 100%)' }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: '#BBD7FF', opacity: 0.35, filter: 'blur(40px)', transform: 'translate(-30%, -30%)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full pointer-events-none" style={{ background: '#9BC8FF', opacity: 0.25, filter: 'blur(50px)', transform: 'translate(30%, 30%)' }} />

        {/* Dot grid top-right */}
        <div className="absolute top-8 right-8 hidden md:grid" style={{ gridTemplateColumns: 'repeat(4,14px)', gap: '14px', opacity: 0.65 }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#69A7FF' }} />
          ))}
        </div>
        {/* Dot grid bottom-left */}
        <div className="absolute bottom-8 left-8 hidden md:grid" style={{ gridTemplateColumns: 'repeat(4,14px)', gap: '14px', opacity: 0.45 }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#69A7FF' }} />
          ))}
        </div>

        {/* Main responsive composition */}
        <div
          className="relative w-full flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-10 xl:gap-14 py-4 sm:py-6"
          style={{ maxWidth: 1280 }}
        >
          {/* Left 3D Illustration (Desktop Only) */}
          <div className="hidden lg:flex flex-1 justify-end items-center select-none" style={{ maxWidth: 360 }}>
            <div className="relative w-full max-w-[340px]" style={{ animation: 'floatGentleLeft 6s ease-in-out infinite' }}>
              <img
                src="/illustration-left.png"
                alt="3D Study Artwork"
                className="w-full h-auto object-contain pointer-events-none"
                style={{ filter: 'drop-shadow(0 20px 30px rgba(22, 119, 255, 0.12))' }}
              />
            </div>
          </div>

          {/* Center Glassmorphic Quiz Card Wrapper (with mobile 3D floating decorations) */}
          <div className="relative w-full max-w-[440px] sm:max-w-[480px] lg:max-w-[500px] mx-auto z-10 my-16 sm:my-20">
            
            {/* Mobile 3D Illustration: Top (Books & Cap) - Placed clearly ABOVE the card */}
            <div
              className="lg:hidden absolute -top-28 sm:-top-36 -left-2 sm:-left-6 w-48 sm:w-56 pointer-events-none select-none z-0"
              style={{ animation: 'floatGentleLeft 5s ease-in-out infinite' }}
            >
              <img
                src="/illustration-left.png"
                alt="3D Study Background"
                className="w-full h-auto object-contain opacity-95"
                style={{ filter: 'drop-shadow(0 15px 25px rgba(22, 119, 255, 0.25))' }}
              />
            </div>

            {/* Mobile 3D Illustration: Bottom (Checklist & Clock) - Placed clearly BELOW the card */}
            <div
              className="lg:hidden absolute -bottom-28 sm:-bottom-36 -right-2 sm:-right-6 w-52 sm:w-60 pointer-events-none select-none z-0"
              style={{ animation: 'floatGentleRight 5s ease-in-out infinite' }}
            >
              <img
                src="/illustration-right.png"
                alt="3D Exam Background"
                className="w-full h-auto object-contain opacity-95"
                style={{ filter: 'drop-shadow(0 15px 25px rgba(22, 119, 255, 0.25))' }}
              />
            </div>

            {/* Center Glassmorphic Quiz Card */}
            <div
              className={`relative z-10 w-full rounded-[32px] overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{
                background: 'rgba(255, 255, 255, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1.5px solid rgba(255, 255, 255, 0.95)',
                boxShadow: '0 25px 60px -10px rgba(22, 119, 255, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.6) inset'
              }}
            >
              {/* Top soft blue gradient strip */}
              <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #1677FF, #4FC3FF)' }} />

              <div className="p-6 sm:p-8 md:p-10 text-center">
                {/* Top Icon with radial halo */}
                <div className="relative mx-auto mb-4 w-20 h-20 sm:w-22 sm:h-22 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-3xl" style={{ background: 'radial-gradient(circle, rgba(79, 195, 255, 0.4) 0%, rgba(22, 119, 255, 0) 70%)', transform: 'scale(1.4)' }} />
                  <div
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center relative shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #4FC3FF 0%, #1677FF 100%)',
                      boxShadow: '0 12px 28px rgba(22, 119, 255, 0.32)'
                    }}
                  >
                    <FileText size={32} className="text-white" />
                  </div>
                </div>

                {/* Category pill badge */}
                {test.subject && (
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full mb-3 text-xs font-bold" style={{ background: '#E8F2FF', color: '#1677FF', border: '1px solid #D0E4FF' }}>
                    <Sparkles size={13} />
                    <span>{test.subject}</span>
                  </div>
                )}

                {/* Quiz Title with Dual Color */}
                {(() => {
                  const rawTitle = (test.title || 'Bài Kiểm Tra Mới').trim();
                  const titleWords = rawTitle.split(/\s+/);
                  let titlePart1 = rawTitle;
                  let titlePart2 = '';
                  if (titleWords.length > 1) {
                    const splitIdx = Math.ceil(titleWords.length / 2);
                    titlePart1 = titleWords.slice(0, splitIdx).join(' ');
                    titlePart2 = titleWords.slice(splitIdx).join(' ');
                  }
                  return (
                    <h1 className="text-2xl sm:text-3xl font-extrabold mb-1.5 leading-snug tracking-tight">
                      <span className="text-[#0F294D]">{titlePart1} </span>
                      {titlePart2 && <span className="text-[#1677FF]">{titlePart2}</span>}
                    </h1>
                  );
                })()}

                {/* Subtitle */}
                <p className="text-[#64748B] text-xs sm:text-sm font-semibold uppercase tracking-wider mb-6">
                  {test.mode === 'practice' ? 'Bài kiểm tra ôn luyện trực tuyến' : 'Bài thi trắc nghiệm trực tuyến'}
                </p>

                {/* Dual Stats Grid (Time & Question count) */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                  {/* Stat 1: Time */}
                  <div
                    className="rounded-2xl p-3.5 sm:p-4 text-center transition-all hover:scale-[1.02]"
                    style={{ background: '#EDF5FF', border: '1px solid #D9EAFE' }}
                  >
                    <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(22, 119, 255, 0.12)', color: '#1677FF' }}>
                      <Clock size={16} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#1677FF] leading-none mb-1">
                      {test.timeLimit}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      Phút làm bài
                    </div>
                  </div>

                  {/* Stat 2: Total Questions */}
                  <div
                    className="rounded-2xl p-3.5 sm:p-4 text-center transition-all hover:scale-[1.02]"
                    style={{ background: '#EDFAF3', border: '1px solid #D1F2DF' }}
                  >
                    <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.14)', color: '#22C55E' }}>
                      <BarChart2 size={16} />
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-[#22C55E] leading-none mb-1">
                      {test.questions.length}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                      Tổng số câu
                    </div>
                  </div>
                </div>

                {/* Mode badge */}
                <div className="flex justify-center mb-6">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: test.mode === 'practice' ? 'rgba(34,197,94,0.12)' : 'rgba(22,119,255,0.12)',
                      color: test.mode === 'practice' ? '#16A36A' : '#1677FF'
                    }}
                  >
                    {test.mode === 'practice' ? (
                      <><BookOpen size={13} /> Ôn tập – Xem đáp án tức thì</>
                    ) : (
                      <><Clock size={13} /> Thi thử – Bấm giờ chuẩn</>
                    )}
                  </span>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setIsStarted(true)}
                  className="w-full py-3.5 sm:py-4 px-6 rounded-full font-bold text-white text-base sm:text-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 group cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #1677FF 0%, #288CFF 50%, #4FC3FF 100%)',
                    boxShadow: '0 12px 28px rgba(22, 119, 255, 0.32)',
                    border: 'none'
                  }}
                >
                  <Play size={18} fill="currentColor" />
                  <span className="tracking-wide">Bắt Đầu Làm Bài</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>

                {/* Prominent Glowing Copyright Badge for Nhật Duy Y Khoa K26 */}
                <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-2">
                  <span className="text-xs font-medium text-[#64748B]">Bản quyền thuộc về</span>
                  <div
                    className="relative inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-black text-white shadow-md overflow-hidden group select-none cursor-default"
                    style={{
                      background: 'linear-gradient(135deg, #0958D9 0%, #1677FF 50%, #4096FF 100%)',
                      boxShadow: '0 4px 16px rgba(22, 119, 255, 0.45), 0 0 20px rgba(79, 195, 255, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    {/* Shimmer sweep effect */}
                    <div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full pointer-events-none"
                      style={{ animation: 'sweepShine 3.2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }}
                    />
                    <span className="text-amber-300 text-xs">✨</span>
                    <span className="tracking-wider text-white drop-shadow font-extrabold">Nhật Duy Y Khoa K26</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse ml-0.5" />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Right 3D Illustration (Desktop Only) */}
          <div className="hidden lg:flex flex-1 justify-start items-center select-none" style={{ maxWidth: 360 }}>
            <div className="relative w-full max-w-[340px]" style={{ animation: 'floatGentleRight 6s ease-in-out infinite' }}>
              <img
                src="/illustration-right.png"
                alt="3D Exam Checklist Artwork"
                className="w-full h-auto object-contain pointer-events-none"
                style={{ filter: 'drop-shadow(0 20px 30px rgba(22, 119, 255, 0.12))' }}
              />
            </div>
          </div>
        </div>

        {/* Keyframe styles */}
        <style>{`
          @keyframes floatGentleLeft {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(-1.5deg); }
          }
          @keyframes floatGentleRight {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(1.5deg); }
          }
          @keyframes sweepShine {
            0% { transform: translateX(-150%); }
            40% { transform: translateX(150%); }
            100% { transform: translateX(150%); }
          }
          @keyframes sparkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
        `}</style>
      </div>
    )
  }

  // ─── Exam Result (submitted + exam mode) ─────────────────────────────────────
  if (submitted && test.mode === 'exam') {
    return (
      <div className="min-h-screen bg-[#F2F2F7] py-12 px-4 flex flex-col items-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center w-full max-w-2xl mb-8">
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-4">Hoàn Thành</h2>
          <div className="text-[80px] font-extrabold text-black leading-none mb-2 tracking-tight">
             {score}<span className="text-[32px] text-slate-300">/10</span>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 bg-slate-100 text-[#007AFF] px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            Làm lại
          </button>
        </div>
        
        {/* Review list */}
        <div className="w-full max-w-2xl space-y-6">
          {test.questions.map((tq: any, i: number) => {
            const q = tq.question
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correctOption
            const opts = JSON.parse(q.options)
            
            return (
              <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm border-l-4 overflow-hidden relative" style={{borderLeftColor: isCorrect ? '#34C759' : '#FF3B30'}}>
                <div className="flex gap-2 mb-4">
                  <span className={`font-bold flex-shrink-0 ${isCorrect ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>Câu {i + 1}:</span>
                  <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: q.content }} />
                </div>
                
                <div className="space-y-2 mt-4">
                  {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => {
                    if (!opts[k]) return null
                    const isRightOpt = k === q.correctOption
                    const isSelected = k === userAnswer
                    
                    return (
                      <div key={k} className={`p-3 rounded-xl flex items-center
                        ${isRightOpt ? 'bg-green-50 border border-green-200' : ''}
                        ${isSelected && !isRightOpt ? 'bg-red-50 border border-red-200' : ''}
                        ${!isSelected && !isRightOpt ? 'bg-slate-50 border border-slate-100' : ''}
                      `}>
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3
                          ${isRightOpt ? 'bg-[#34C759] text-white' : ''}
                          ${isSelected && !isRightOpt ? 'bg-[#FF3B30] text-white' : ''}
                          ${!isSelected && !isRightOpt ? 'bg-white text-slate-500 border border-slate-300' : ''}
                        `}>{k}</span>
                        <span className="text-sm flex-1">{opts[k]}</span>
                        {isRightOpt && <CheckCircle size={18} className="text-[#34C759]"/>}
                        {isSelected && !isRightOpt && <XCircle size={18} className="text-[#FF3B30]"/>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── Active test-taking view ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#F2F2F7]">
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 flex justify-between items-center fixed top-0 w-full z-20">
        <div className="font-bold text-slate-800 truncate max-w-[50%]">{test.title}</div>
        {test.mode === 'exam' ? (
          <div className="flex items-center gap-3">
            <div className={`font-mono text-[17px] font-bold flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full ${timeLeft < 60 ? 'text-[#FF3B30] animate-pulse' : 'text-slate-800'}`}>
              <Clock size={16}/> {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmit} className="bg-[#007AFF] text-white px-4 py-1.5 rounded-full font-semibold text-sm hover:bg-blue-600 transition-colors">Nộp Bài</button>
          </div>
        ) : (
          <div className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">Chế độ luyện tập</div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 pt-20 max-w-3xl mx-auto w-full pb-20 space-y-6">
        {test.questions.map((tq: any, i: number) => {
          const q = tq.question
          const isSelected = answers[q.id]
          const status = showExplanation[q.id]
          const opts = JSON.parse(q.options)
          
          return (
            <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm">
              <div className="flex gap-3 mb-6">
                 <span className="flex-shrink-0 bg-[#007AFF] text-white font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm">{i + 1}</span>
                 <div className="prose prose-sm max-w-none text-slate-800 pt-1" dangerouslySetInnerHTML={{ __html: q.content }} />
              </div>
              
              <div className="space-y-3">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => {
                  if (!opts[k]) return null
                  
                  return (
                    <div key={k} onClick={() => handleSelectAnswer(q.id, k)} 
                      className={`
                        p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center
                        ${isSelected === k ? 'border-[#007AFF] bg-blue-50/50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}
                        ${test.mode === 'practice' && status === 'correct' && (isSelected === k || q.correctOption === k) ? '!border-[#34C759] !bg-green-50' : ''}
                        ${test.mode === 'practice' && status === 'incorrect' && isSelected === k ? '!border-[#FF3B30] !bg-red-50' : ''}
                      `}>
                      <span className={`w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-bold transition-colors
                         ${isSelected === k ? 'bg-[#007AFF] border-[#007AFF] text-white' : 'border-slate-300 text-slate-500 bg-white'}
                         ${test.mode === 'practice' && status === 'correct' && (isSelected === k || q.correctOption === k) ? '!bg-[#34C759] !border-[#34C759] !text-white' : ''}
                         ${test.mode === 'practice' && status === 'incorrect' && isSelected === k ? '!bg-[#FF3B30] !border-[#FF3B30] !text-white' : ''}
                      `}>{k}</span>
                      <span className="text-slate-800 text-sm flex-1">{opts[k]}</span>
                      {test.mode === 'practice' && status === 'correct' && (isSelected === k || q.correctOption === k) && <CheckCircle size={20} className="text-[#34C759] ml-2"/>}
                      {test.mode === 'practice' && status === 'incorrect' && isSelected === k && <XCircle size={20} className="text-[#FF3B30] ml-2"/>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {test.mode === 'practice' && (
           <div className="text-center pt-4">
             <button onClick={handleSubmit} className="bg-[#007AFF] text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors">
               Kết Thúc &amp; Xem Điểm
             </button>
           </div>
        )}
      </div>
    </div>
  )
}
