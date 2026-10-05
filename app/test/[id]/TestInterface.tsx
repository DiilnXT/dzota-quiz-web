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
        className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
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

        {/* Main layout */}
        <div
          className="relative w-full flex items-center justify-center gap-16"
          style={{ maxWidth: 1250 }}
        >
          {/* Illustration - desktop only */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative select-none" style={{ maxWidth: 570 }}>
            {/* Floating animation wrapper */}
            <div className="relative w-full h-[420px]">
              {/* Big book stack */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{ animation: 'floatMain 5s ease-in-out infinite' }}>
                <div className="flex flex-col gap-2 items-center">
                  <div className="w-36 h-20 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg,#3F8CFF,#1677FF)' }}>
                    <BookOpen size={40} className="text-white opacity-90" />
                  </div>
                  <div className="w-40 h-6 rounded-xl" style={{ background: 'linear-gradient(90deg,#4FC3FF,#1677FF)', opacity: 0.6 }} />
                  <div className="w-44 h-6 rounded-xl" style={{ background: 'linear-gradient(90deg,#1677FF,#3F8CFF)', opacity: 0.4 }} />
                </div>
              </div>

              {/* Graduation cap */}
              <div className="absolute" style={{ top: '8%', left: '50%', transform: 'translateX(-50%)', animation: 'floatSlow 6s ease-in-out infinite' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: '#E7F1FF' }}>
                  <GraduationCap size={28} style={{ color: '#216BFF' }} />
                </div>
              </div>

              {/* Checklist card */}
              <div className="absolute right-4 top-1/3 rounded-2xl p-4 shadow-xl" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.9)', animation: 'floatRight 4.5s ease-in-out infinite', minWidth: 130 }}>
                <div className="text-[11px] font-black text-[#102A56] mb-2 uppercase tracking-wider">Tiến độ</div>
                {['Câu 1', 'Câu 2', 'Câu 3'].map((label, i) => (
                  <div key={i} className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded-full flex items-center justify-center" style={{ background: i < 2 ? '#22C55E' : '#E5E7EB' }}>
                      {i < 2 && <span className="text-white text-[7px] font-black">✓</span>}
                    </div>
                    <span className="text-[11px] text-[#64748B] font-medium">{label}</span>
                  </div>
                ))}
              </div>

              {/* Pen icon */}
              <div className="absolute left-6 bottom-1/4" style={{ animation: 'floatLeft 5.5s ease-in-out infinite' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: '#E7F1FF' }}>
                  <PenLine size={22} style={{ color: '#246BFF' }} />
                </div>
              </div>

              {/* Clock */}
              <div className="absolute right-2 bottom-8" style={{ animation: 'floatSlow 4s ease-in-out infinite' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg,#3F8CFF,#1677FF)' }}>
                  <Clock size={26} className="text-white" />
                </div>
              </div>

              {/* Analytics */}
              <div className="absolute left-2 top-10" style={{ animation: 'floatRight 6s ease-in-out infinite' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md" style={{ background: '#E7F1FF' }}>
                  <BarChart2 size={22} style={{ color: '#1677FF' }} />
                </div>
              </div>

              {/* Sparkles */}
              {[
                { top: '5%', left: '20%', size: 14, delay: '0s' },
                { top: '15%', right: '10%', size: 10, delay: '0.5s' },
                { top: '70%', left: '10%', size: 12, delay: '1s' },
                { bottom: '10%', right: '20%', size: 10, delay: '1.5s' },
                { top: '45%', left: '2%', size: 8, delay: '0.8s' },
                { top: '80%', right: '5%', size: 10, delay: '0.3s' },
              ].map((s, i) => (
                <div key={i} className="absolute text-blue-300" style={{ ...s, animation: `sparkle 3s ease-in-out ${s.delay} infinite` }}>
                  <Sparkles size={s.size} />
                </div>
              ))}
            </div>
          </div>

          {/* Main Card */}
          <div
            className={`relative w-full lg:max-w-[610px] rounded-3xl overflow-hidden transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.9)',
              boxShadow: '0 25px 70px rgba(40,100,180,0.18)'
            }}
          >
            {/* Top gradient accent */}
            <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg,#1677FF,#4FC3FF)' }} />

            <div className="p-8 md:p-12">
              {/* Header */}
              <div className="text-center mb-8">
                {/* Document icon */}
                <div
                  className="w-20 h-20 md:w-[84px] md:h-[84px] rounded-[22px] mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg,#3F8CFF,#1677FF)',
                    boxShadow: '0 12px 30px rgba(22,119,255,0.25)',
                    animation: 'floatSlow 4s ease-in-out infinite'
                  }}
                >
                  <FileText size={36} className="text-white" />
                </div>

                {/* Category badge */}
                {test.subject && (
                  <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full mb-4 text-sm font-semibold" style={{ background: '#E7F1FF', color: '#1677FF' }}>
                    <Sparkles size={13} />
                    <span>{test.subject}</span>
                  </div>
                )}

                {/* Title */}
                <h1 className="text-3xl md:text-[42px] font-extrabold leading-tight text-[#102A56] mb-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                  {test.title}
                </h1>

                {/* Subtitle */}
                <p className="text-[#64748B] text-base md:text-lg">
                  {test.mode === 'practice' ? 'Bài kiểm tra luyện tập trực tuyến' : 'Bài kiểm tra thi thử trực tuyến'}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div
                  className="rounded-2xl p-5 flex items-center gap-3"
                  style={{ background: 'rgba(235,244,255,0.85)', border: '1px solid rgba(255,255,255,0.9)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(22,119,255,0.12)' }}>
                    <Clock size={20} style={{ color: '#1677FF' }} />
                  </div>
                  <div>
                    <div className="text-2xl font-black" style={{ color: '#1677FF' }}>{test.timeLimit}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Phút làm bài</div>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-5 flex items-center gap-3"
                  style={{ background: 'rgba(231,250,242,0.85)', border: '1px solid rgba(255,255,255,0.9)' }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(22,163,106,0.12)' }}>
                    <BarChart2 size={20} style={{ color: '#16A36A' }} />
                  </div>
                  <div>
                    <div className="text-2xl font-black" style={{ color: '#16A36A' }}>{test.questions.length}</div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Tổng số câu</div>
                  </div>
                </div>
              </div>

              {/* Mode badge */}
              <div className="flex justify-center mb-6">
                <span
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold"
                  style={{
                    background: test.mode === 'practice' ? 'rgba(34,197,94,0.12)' : 'rgba(22,119,255,0.12)',
                    color: test.mode === 'practice' ? '#16A36A' : '#1677FF'
                  }}
                >
                  {test.mode === 'practice' ? (
                    <><BookOpen size={15} /> Chế độ luyện tập – Xem đáp án ngay</>
                  ) : (
                    <><Clock size={15} /> Chế độ thi – Đếm ngược thời gian</>
                  )}
                </span>
              </div>

              {/* Start Button */}
              <button
                onClick={() => setIsStarted(true)}
                className="w-full font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                style={{
                  height: 64,
                  borderRadius: 999,
                  background: 'linear-gradient(100deg,#1677FF,#168BFF,#4CC9FF)',
                  boxShadow: '0 14px 30px rgba(22,119,255,0.28)',
                  fontSize: 18,
                  border: 'none',
                  cursor: 'pointer'
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 18px 38px rgba(22,119,255,0.35)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
                  ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 14px 30px rgba(22,119,255,0.28)'
                }}
              >
                <Play size={20} fill="white" />
                <span>Bắt Đầu Làm Bài</span>
                <ArrowRight size={20} />
              </button>

              {/* Footer */}
              <p className="text-center mt-7 text-sm text-[#64748B]">
                Bản quyền thuộc về <span className="font-bold text-[#102A56]">Nhật Duy Y Khoa K26</span>
              </p>
            </div>
          </div>
        </div>

        {/* Keyframe styles */}
        <style>{`
          @keyframes floatMain {
            0%, 100% { transform: translate(-50%, -50%) translateY(0px); }
            50% { transform: translate(-50%, -50%) translateY(-14px); }
          }
          @keyframes floatSlow {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }
          @keyframes floatRight {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(1deg); }
          }
          @keyframes floatLeft {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-12px) rotate(-1deg); }
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
