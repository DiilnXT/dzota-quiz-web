'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle,
  XCircle,
  Play,
  ArrowRight,
  FileText,
  BarChart2,
  Sparkles,
  BookOpen,
  GraduationCap,
  PenLine,
  HelpCircle,
  Bot,
  X,
  Loader2,
  Check,
  Lightbulb,
  RotateCcw,
  CheckSquare
} from 'lucide-react'
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
  const [savedSession, setSavedSession] = useState<any | null>(null)
  const [restoredToast, setRestoredToast] = useState<string | null>(null)

  // AI Question Explanation Modal states
  const [activeExplainQ, setActiveExplainQ] = useState<any | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const [explanationContent, setExplanationContent] = useState<string | null>(null)
  const [explainError, setExplainError] = useState<string | null>(null)
  const [explanationCache, setExplanationCache] = useState<Record<string, string>>({})
  
  // Khôi phục đa nhiệm khi chuyển app / tải lại trang trên điện thoại
  useEffect(() => {
    setMounted(true)
    if (!test?.id) return

    const key = `dzota_quiz_session_${test.id}`
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const saved = JSON.parse(raw)
        if (saved && saved.isStarted && !saved.submitted) {
          setSavedSession(saved)
          const now = Date.now()
          const isExam = test.mode === 'exam'
          const remaining = saved.endTime ? Math.round((saved.endTime - now) / 1000) : saved.timeLeft

          if (isExam && remaining <= 0) {
            // Hết giờ làm bài trong lúc ở app khác -> tự động nộp bài
            setAnswers(saved.answers || {})
            setShowExplanation(saved.showExplanation || {})
            setIsStarted(true)
            setTimeLeft(0)
            let correctCount = 0
            test.questions.forEach((tq: any) => {
              if (saved.answers?.[tq.question.id] === tq.question.correctOption) {
                correctCount++
              }
            })
            setScore(parseFloat(((correctCount / test.questions.length) * 10).toFixed(1)))
            setSubmitted(true)
            setRestoredToast('Hết giờ làm bài trong lúc chuyển ứng dụng. Đã tự động nộp bài!')
            try { localStorage.removeItem(key) } catch (e) {}
            return
          }

          // Tự động khôi phục bài làm đang dở
          setAnswers(saved.answers || {})
          setShowExplanation(saved.showExplanation || {})
          setTimeLeft(isExam ? remaining : (saved.timeLeft || test.timeLimit * 60))
          setIsStarted(true)
          const ansCount = Object.keys(saved.answers || {}).length
          setRestoredToast(`🔄 Đã tự động khôi phục bài làm (${ansCount}/${test.questions?.length || 0} câu đã chọn)!`)
          setTimeout(() => setRestoredToast(null), 4500)
        }
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra session:', e)
    }
  }, [test?.id])

  // Lưu tiến trình bài làm liên tục vào localStorage
  const saveProgressToStorage = (overrideAnswers?: Record<string, string>, overrideExp?: Record<string, any>) => {
    if (!test?.id || submitted) return
    const key = `dzota_quiz_session_${test.id}`
    const now = Date.now()
    const curAnswers = overrideAnswers || answers
    const curExp = overrideExp || showExplanation
    
    let prevEndTime = null
    try {
      const raw = localStorage.getItem(key)
      if (raw) {
        const prev = JSON.parse(raw)
        prevEndTime = prev.endTime
      }
    } catch (e) {}

    const sessionData = {
      testId: test.id,
      isStarted: true,
      answers: curAnswers,
      showExplanation: curExp,
      timeLeft,
      endTime: test.mode === 'exam' ? (prevEndTime || (now + timeLeft * 1000)) : null,
      submitted: false,
      savedAt: now
    }
    try {
      localStorage.setItem(key, JSON.stringify(sessionData))
    } catch (e) {}
  }

  // Lắng nghe visibilitychange: khi người dùng chuyển app hoặc tắt màn hình điện thoại
  useEffect(() => {
    if (!test?.id) return
    const key = `dzota_quiz_session_${test.id}`

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (isStarted && !submitted) {
          saveProgressToStorage()
        }
      } else if (document.visibilityState === 'visible') {
        if (isStarted && !submitted && test.mode === 'exam') {
          try {
            const raw = localStorage.getItem(key)
            if (raw) {
              const data = JSON.parse(raw)
              if (data.endTime) {
                const remaining = Math.round((data.endTime - Date.now()) / 1000)
                if (remaining <= 0) {
                  setTimeLeft(0)
                  handleSubmit()
                } else {
                  setTimeLeft(remaining)
                }
              }
            }
          } catch (e) {}
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('pagehide', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('pagehide', handleVisibility)
    }
  }, [test?.id, isStarted, submitted, answers, showExplanation, timeLeft])

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

  const handleStartTest = (isResume = false) => {
    const key = `dzota_quiz_session_${test.id}`
    if (!isResume) {
      try { localStorage.removeItem(key) } catch (e) {}
      setAnswers({})
      setShowExplanation({})
      setTimeLeft(test.timeLimit * 60)
    }
    setIsStarted(true)
    const now = Date.now()
    const sessionData = {
      testId: test.id,
      isStarted: true,
      answers: isResume ? answers : {},
      showExplanation: isResume ? showExplanation : {},
      timeLeft: isResume ? timeLeft : test.timeLimit * 60,
      endTime: test.mode === 'exam' ? (now + (isResume ? timeLeft : test.timeLimit * 60) * 1000) : null,
      submitted: false,
      savedAt: now
    }
    try {
      localStorage.setItem(key, JSON.stringify(sessionData))
    } catch (e) {}
  }

  const handleSelectAnswer = (qId: string, optKey: string) => {
    if (submitted && test.mode === 'exam') return
    const nextAnswers = { ...answers, [qId]: optKey }
    setAnswers(nextAnswers)
    
    let nextExp = showExplanation
    if (test.mode === 'practice') {
      const q = test.questions.find((tq: any) => tq.question.id === qId).question
      if (q.correctOption === optKey) {
        nextExp = { ...showExplanation, [qId]: 'correct' }
      } else {
        nextExp = { ...showExplanation, [qId]: 'incorrect' }
      }
      setShowExplanation(nextExp)
    }

    saveProgressToStorage(nextAnswers, nextExp)
  }

  // Handle calling Gemini AI Teacher
  const handleAskTeacher = async (q: any) => {
    setActiveExplainQ(q)
    setExplainError(null)

    // Check cached explanation
    if (explanationCache[q.id]) {
      setExplanationContent(explanationCache[q.id])
      setExplainLoading(false)
      return
    }

    setExplainLoading(true)
    setExplanationContent(null)

    let parsedOpts: Record<string, string> = {}
    try {
      parsedOpts = JSON.parse(q.options)
    } catch (e) {
      parsedOpts = {}
    }

    try {
      const res = await fetch('/api/explain-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: q.content,
          options: parsedOpts,
          correctOption: q.correctOption,
          selectedOption: answers[q.id] || undefined,
          subjectName: test.subject || test.title
        })
      })

      const data = await res.json()
      if (res.ok && data.explanation) {
        setExplanationContent(data.explanation)
        setExplanationCache(prev => ({ ...prev, [q.id]: data.explanation }))
      } else {
        setExplainError(data.error || 'Không thể nhận phản hồi từ giảng viên AI.')
      }
    } catch (err: any) {
      setExplainError('Lỗi kết nối. Vui lòng kiểm tra lại mạng hoặc thử lại.')
    } finally {
      setExplainLoading(false)
    }
  }

  // Parse markdown bold text (**text** or *text*) neatly into HTML elements without leftover asterisks
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null
    const lines = text.split('\n')
    return (
      <div className="space-y-2 text-left leading-relaxed">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-1.5" />

          // Strip markdown headers from check for clean heading matching
          const cleanLine = trimmed.replace(/^[\s#*>\-]+/, '').trim()

          // Highlight Section Headings
          const isHeading1 = cleanLine.startsWith('Kiến thức liên quan cần biết') || cleanLine.startsWith('1. Kiến thức')
          const isHeading2 = cleanLine.startsWith('Tại sao chọn') || cleanLine.startsWith('2. Tại sao chọn')
          const isHeading3 = cleanLine.startsWith('Các phương án còn lại') || cleanLine.startsWith('3. Các phương án')

          // Helper to parse bold (both **word** and *word*) cleanly
          const parseInlineMarkdown = (content: string) => {
            // Split by **...** first, then *...*
            const parts = content.split(/(\*\*.*?\*\*|\*[^*]+?\*)/g)
            return parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
                return <strong key={pIdx} className="font-extrabold text-indigo-900 dark:text-indigo-200">{part.slice(2, -2)}</strong>
              }
              if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                return <strong key={pIdx} className="font-bold text-indigo-900 dark:text-indigo-200">{part.slice(1, -1)}</strong>
              }
              return <span key={pIdx}>{part}</span>
            })
          }

          if (isHeading1) {
            return (
              <div key={idx} className="mt-3 pt-2 text-sm sm:text-base font-extrabold text-blue-700 dark:text-blue-400 flex items-center gap-2 border-b border-blue-100 dark:border-blue-900/50 pb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span>{cleanLine}</span>
              </div>
            )
          }
          if (isHeading2) {
            return (
              <div key={idx} className="mt-4 pt-2 text-sm sm:text-base font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 border-b border-emerald-100 dark:border-emerald-900/50 pb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{cleanLine}</span>
              </div>
            )
          }
          if (isHeading3) {
            return (
              <div key={idx} className="mt-4 pt-2 text-sm sm:text-base font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-2 border-b border-rose-100 dark:border-rose-900/50 pb-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <span>{cleanLine}</span>
              </div>
            )
          }

          return (
            <p key={idx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              {parseInlineMarkdown(line)}
            </p>
          )
        })}
      </div>
    )
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
    if (test?.id) {
      try { localStorage.removeItem(`dzota_quiz_session_${test.id}`) } catch (e) {}
    }
  }

  const handleRestartPractice = () => {
    if (confirm('Làm lại từ đầu?\n\nToàn bộ các đáp án đã chọn sẽ được xóa và bạn sẽ bắt đầu lại từ đầu bài test. Bạn có chắc chắn không?')) {
      handleStartTest(false)
    }
  }

  const handlePracticeSubmit = () => {
    const answeredCount = Object.keys(answers).length
    const totalCount = test.questions?.length || 0
    if (confirm(`Nộp bài & xem điểm?\n\nBạn đã trả lời ${answeredCount}/${totalCount} câu hỏi. Bạn có chắc muốn nộp bài để xem kết quả chi tiết?`)) {
      handleSubmit()
    }
  }

  const renderCopyrightBadge = (className = "") => (
    <div className={`flex items-center justify-center my-3 select-none ${className}`}>
      <div className="relative group p-[2px] rounded-full dzota-animated-gradient-border shadow-[0_4px_20px_rgba(236,72,153,0.35)] transition-all hover:scale-105 active:scale-95">
        <div className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-950/85 backdrop-blur-xl flex items-center gap-2 sm:gap-2.5 border border-white/10">
          <span className="text-sm sm:text-base inline-block animate-[crownFloat_2.5s_ease-in-out_infinite] filter drop-shadow">👑</span>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-200 tracking-wide">
            Bản quyền thuộc về{' '}
            <span className="font-black tracking-wide dzota-animated-gradient-text text-xs sm:text-sm">
              Nhật Duy — Y Khoa K26
            </span>
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        </div>
      </div>
    </div>
  )

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
            {renderCopyrightBadge('mt-6')}
          </form>
        </div>
      </div>
    )
  }

  // ─── Landing Page (before start) ─────────────────────────────────────────────
  if (!isStarted) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center p-3.5 sm:p-6 lg:p-8 relative select-none dzota-test-bg font-sans">
        {/* Subtle ambient overlay */}
        <div className="absolute inset-0 bg-slate-900/[0.03] pointer-events-none" />

        {/* Center Glassmorphic Quiz Waiting Card (Chuẩn theo hình mẫu) */}
        <div
          className={`relative z-10 w-full max-w-[460px] sm:max-w-[500px] rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 pt-0 transition-all duration-500 animate-pop-in ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          style={{
            background: 'rgba(255, 255, 255, 0.90)',
            backdropFilter: 'blur(28px) saturate(180%)',
            WebkitBackdropFilter: 'blur(28px) saturate(180%)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            boxShadow: '0 25px 60px rgba(15, 35, 75, 0.16)'
          }}
        >
          {/* Floating Top Logo Card */}
          <div 
            className="rounded-3xl bg-white p-2.5 mx-auto shadow-xl shadow-blue-500/15 border-2 border-white flex items-center justify-center -mt-9 sm:-mt-10 mb-3.5 hover:scale-105 transition-transform duration-300"
            style={{ width: '74px', height: '74px', maxWidth: '74px', maxHeight: '74px' }}
          >
            <img 
              src="/logo-dzota.png" 
              alt="Dzota" 
              className="w-auto h-auto max-w-full max-h-full object-contain filter drop-shadow-sm" 
              style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
          </div>

          <div className="text-center">
            {/* Subject / Category pill badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-[#EBF3FF] text-[#1D68EE] border border-[#D5E6FF] mb-2.5">
              <FileText size={13} />
              <span>{test.subject || 'BÀI KIỂM TRA'}</span>
            </div>

            {/* Quiz Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-[#0F294D] tracking-tight mb-1 leading-tight uppercase">
              {test.title || 'TEST WEB'}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-[13px] font-bold text-[#64748B] uppercase tracking-wider mb-5 sm:mb-6">
              {test.mode === 'practice' ? 'BÀI KIỂM TRA ÔN LUYỆN TRỰC TUYẾN' : 'BÀI THI TRẮC NGHIỆM TRỰC TUYẾN'}
            </p>

            {/* 3 Info Cards Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3.5 mb-5 sm:mb-6 text-center">
              {/* Card 1: Thời gian */}
              <div className="bg-[#F4F8FF] border border-[#E0ECFF] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
                <div className="w-8 h-8 rounded-xl bg-[#E1EEFF] text-[#1D68EE] flex items-center justify-center mb-1.5 shadow-2xs">
                  <Clock size={16} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#64748B]">Thời gian làm bài</div>
                <div className="text-sm sm:text-base font-black text-[#1D68EE] mt-0.5">{test.timeLimit} phút</div>
              </div>

              {/* Card 2: Tổng số câu */}
              <div className="bg-[#F0FAF4] border border-[#DCF5E5] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
                <div className="w-8 h-8 rounded-xl bg-[#DCF5E5] text-[#10B981] flex items-center justify-center mb-1.5 shadow-2xs">
                  <FileText size={16} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#64748B]">Tổng số câu hỏi</div>
                <div className="text-sm sm:text-base font-black text-[#10B981] mt-0.5">{test.questions?.length || 0} câu</div>
              </div>

              {/* Card 3: Hình thức */}
              <div className="bg-[#FFF8F0] border border-[#FFE8D1] rounded-2xl p-2.5 sm:p-3 flex flex-col items-center justify-center hover:scale-[1.02] transition-transform">
                <div className="w-8 h-8 rounded-xl bg-[#FFE8D1] text-[#F59E0B] flex items-center justify-center mb-1.5 shadow-2xs">
                  <BarChart2 size={16} />
                </div>
                <div className="text-[10px] sm:text-[11px] font-semibold text-[#64748B]">Hình thức làm bài</div>
                <div className="text-sm sm:text-base font-black text-[#1E293B] mt-0.5">{test.mode === 'practice' ? 'Luyện tập' : 'Trắc nghiệm'}</div>
              </div>
            </div>

            {/* In-progress saved session box (nếu có bài làm dở từ trước) */}
            {savedSession && (
              <div className="mb-4 p-3.5 bg-blue-50/90 border border-blue-200/80 rounded-2xl text-left flex items-center justify-between gap-3 animate-fade-in shadow-xs">
                <div className="min-w-0">
                  <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                    <span>🔄</span> Có bài làm dở ({Object.keys(savedSession.answers || {}).length}/{test.questions?.length || 0} câu đã chọn)
                  </p>
                  <p className="text-[11px] text-blue-700/80 truncate">Đa nhiệm đã tự động lưu lại bài làm của bạn.</p>
                </div>
                <button
                  onClick={() => handleStartTest(true)}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs whitespace-nowrap active:scale-95 transition-all cursor-pointer"
                >
                  Tiếp tục
                </button>
              </div>
            )}

            {/* CTA Button */}
            <button
              onClick={() => handleStartTest(false)}
              className="relative overflow-hidden w-full py-3.5 sm:py-4 px-6 rounded-2xl sm:rounded-full font-black text-white text-[16px] sm:text-[18px] transition-all active:scale-[0.98] hover:-translate-y-0.5 flex items-center justify-center gap-3 shadow-[0_12px_28px_-4px_rgba(22,119,255,0.48),0_6px_12px_-2px_rgba(22,119,255,0.25)] hover:shadow-[0_16px_34px_rgba(22,119,255,0.55)] cursor-pointer group"
              style={{
                background: 'linear-gradient(90deg, #0052FF 0%, #1677FF 48%, #00C2FF 100%)',
                minHeight: '54px'
              }}
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Play size={15} fill="currentColor" className="ml-0.5 text-white" />
              </div>
              <span className="tracking-wide text-white drop-shadow-xs">Bắt Đầu Làm Bài</span>
              <ArrowRight size={19} className="transition-transform group-hover:translate-x-1.5" />
            </button>

            {/* Copyright Badge */}
            {renderCopyrightBadge('mt-4')}

          </div>
        </div>

        {/* Global style tag for test background */}
        <style>{`
          .dzota-test-bg {
            background-image: url('/bg-test-mobile.png'), url('https://i.ibb.co/N6fH63P0/e4606e83-bd1f-4029-9c91-189d9e1b12db.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
          }
          @media (min-width: 1024px) {
            .dzota-test-bg {
              background-image: url('/bg-test-desktop.png'), url('https://i.ibb.co/7dMpmdkR/4e4f0c4d-f019-48af-8424-2ca9fb0ee36c.png');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              background-attachment: fixed;
            }
          }

          /* Responsive Background cho lúc đang làm bài thi / bài text ôn luyện */
          .dzota-active-bg {
            background-image: url('/bg-active-mobile.png'), url('https://i.ibb.co/7NnQtYVb/b93ce28c-a278-4123-8650-771eb2a3be79.png');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
          }
          @media (min-width: 1024px) {
            .dzota-active-bg {
              background-image: url('/bg-active-desktop.png'), url('https://i.ibb.co/xqxLMLNj/1a348e38-aec7-4e9a-9bbe-69ff1c4af67d.png');
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              background-attachment: fixed;
            }
          }
        `}</style>
      </div>
    )
  }

  // ─── Quiz/Exam Result Overview (submitted for exam OR practice mode) ─────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F2F2F7] py-12 px-4 flex flex-col items-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center w-full max-w-2xl mb-8">
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-4">Hoàn Thành</h2>
          <div className="text-[80px] font-extrabold text-black leading-none mb-2 tracking-tight">
             {score}<span className="text-[32px] text-slate-300">/10</span>
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-2">
            Chế độ: {test.mode === 'practice' ? 'Ôn tập & Luyện tập' : 'Thi chính thức'}
          </p>
          <button onClick={() => window.location.reload()} className="mt-6 bg-slate-100 text-[#007AFF] px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
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
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex gap-2 items-start flex-1">
                    <span className={`font-bold flex-shrink-0 ${isCorrect ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>Câu {i + 1}:</span>
                    <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: q.content }} />
                  </div>
                  
                  {/* AI Explain Button (?) in Result Review */}
                  <button
                    onClick={() => handleAskTeacher(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex-shrink-0"
                    title="Hỏi giảng viên AI giải thích câu này"
                  >
                    <HelpCircle size={14} />
                    <span>Giải thích (?)</span>
                  </button>
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
        {renderCopyrightBadge('mt-6 mb-4')}

        {/* ─── POPUP GIẢI THÍCH CHUYÊN NGHIỆP CỦA GIẢNG VIÊN AI KHI XEM KẾT QUẢ ─── */}
        {activeExplainQ && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col p-5 sm:p-6 overflow-hidden animate-pop-in">
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-tight flex items-center gap-1.5">
                      <span>Giảng Viên AI Giải Thích</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 uppercase tracking-wide">
                        Dzota AI
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Phân tích chuyên sâu • Kiến thức cốt lõi
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveExplainQ(null)
                    setExplanationContent(null)
                    setExplainError(null)
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                  title="Đóng và học tiếp"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="py-4 overflow-y-auto space-y-4 flex-1 pr-1">
                
                {/* Question Content Box */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80">
                  <div className="text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Câu hỏi đang xét:
                  </div>
                  <div
                    className="prose prose-sm max-w-none text-slate-800 dark:text-slate-200 font-medium"
                    dangerouslySetInnerHTML={{ __html: activeExplainQ.content }}
                  />

                  {/* Options List Preview */}
                  {(() => {
                    let parsedOpts: any = {}
                    try { parsedOpts = JSON.parse(activeExplainQ.options) } catch (e) {}
                    return (
                      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                        {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => {
                          if (!parsedOpts[k]) return null
                          const isCorrect = activeExplainQ.correctOption === k
                          const isUserPick = answers[activeExplainQ.id] === k

                          return (
                            <div
                              key={k}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 ${
                                isCorrect
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 font-bold'
                                  : isUserPick
                                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-300 font-medium'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                  isCorrect
                                    ? 'bg-emerald-600 text-white'
                                    : isUserPick
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {k}
                              </span>
                              <span className="truncate flex-1">{parsedOpts[k]}</span>
                              {isCorrect && (
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 ml-auto whitespace-nowrap">
                                  ✓ Đáp án đúng
                                </span>
                              )}
                              {!isCorrect && isUserPick && (
                                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 ml-auto whitespace-nowrap">
                                  ✗ Bạn chọn
                                </span>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}
                </div>

                {/* Loading Animation with Teacher Wait Message */}
                {explainLoading && (
                  <div className="py-8 text-center flex flex-col items-center justify-center">
                    <div className="relative mb-3">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                        <Sparkles size={24} />
                      </div>
                      <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl animate-pulse"></div>
                    </div>
                    <p className="font-extrabold text-sm sm:text-base text-indigo-700 dark:text-indigo-400">
                      Đang hỏi giảng viên, chờ xíu nhé bây bii ✨
                    </p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Loader2 size={12} className="animate-spin" />
                      <span>Đang tổng hợp kiến thức và suy luận đa chiều...</span>
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {explainError && (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    <div className="font-bold mb-1">⚠️ Không thể tải lời giải thích:</div>
                    <p>{explainError}</p>
                    <button
                      onClick={() => handleAskTeacher(activeExplainQ)}
                      className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-colors"
                    >
                      Thử lại với API Key khác
                    </button>
                  </div>
                )}

                {/* AI Explanation Content Box */}
                {explanationContent && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 animate-fade-in">
                    {renderFormattedMarkdown(explanationContent)}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  Dzota AI Assistant
                </span>
                <button
                  onClick={() => {
                    setActiveExplainQ(null)
                    setExplanationContent(null)
                    setExplainError(null)
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Đóng và học bài tiếp</span>
                  <X size={14} />
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    )
  }

  // ─── Active test-taking view ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen dzota-active-bg font-sans relative overflow-y-auto">
      {/* Subtle ambient overlay */}
      <div className="absolute inset-0 bg-slate-900/[0.03] pointer-events-none" />

      {restoredToast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <span>✨</span>
          <span>{restoredToast}</span>
        </div>
      )}
      <header className="bg-white/90 backdrop-blur-md border-b border-white/80 px-3 sm:px-6 py-2.5 flex justify-between items-center fixed top-0 w-full z-20 shadow-xs">
        {/* Khung tên bài thi nổi bật thay vì màu trắng */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 max-w-[45%] sm:max-w-[48%] px-2.5 sm:px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 border border-blue-400/30 shadow-[0_4px_16px_rgba(26,115,232,0.25)]">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-md">
            <Sparkles size={16} />
          </div>
          <div className="min-w-0">
            <div className="font-black text-white text-xs sm:text-sm leading-tight truncate drop-shadow-xs">{test.title}</div>
            <div className="text-[9px] sm:text-[10px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>{test.mode === 'exam' ? 'Bài thi trắc nghiệm' : 'Chế độ luyện tập'}</span>
            </div>
          </div>
        </div>

        {/* Khung số câu đã làm trên n câu & Controls */}
        {test.mode === 'exam' ? (
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black shadow-[0_4px_14px_rgba(13,148,136,0.35)] border border-white/20 whitespace-nowrap">
              <CheckCircle size={14} className="text-cyan-200 hidden xs:inline" />
              <span>Đã làm <strong className="text-yellow-300 font-extrabold">{Object.keys(answers).length}</strong>/{test.questions.length}</span>
            </div>
            <div className={`font-mono text-xs sm:text-sm font-bold flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full ${timeLeft < 60 ? 'bg-[#fce8e6] text-[#c5221f] animate-pulse' : 'bg-white/90 border border-slate-200/80 text-slate-800'}`}>
              <Clock size={15}/> {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmit} className="bg-[#007AFF] text-white px-3 sm:px-4 py-1.5 rounded-full font-bold text-xs sm:text-sm hover:bg-blue-600 transition-colors cursor-pointer shadow-xs active:scale-95">Nộp Bài</button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Khung số câu đã làm trên n câu */}
            <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white text-xs font-black shadow-[0_4px_14px_rgba(79,70,229,0.35)] border border-white/25 whitespace-nowrap">
              <span className="text-cyan-200 hidden sm:inline">Đã làm</span>
              <span className="text-yellow-300 font-extrabold">{Object.keys(answers).length}</span>
              <span className="text-white font-extrabold">/{test.questions.length}</span>
              <span className="text-cyan-200 text-[10px] hidden xs:inline">câu</span>
            </div>
            <button
              onClick={handleRestartPractice}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-bold bg-white/90 hover:bg-slate-100 border border-slate-300 text-slate-700 shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Xóa làm lại từ đầu"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
            <button
              onClick={handlePracticeSubmit}
              className="inline-flex items-center gap-1 px-3 sm:px-3.5 py-1 sm:py-1.5 rounded-full text-xs font-bold bg-[#007AFF] hover:bg-blue-600 text-white shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Nộp bài và xem điểm ngay"
            >
              <CheckSquare size={14} />
              <span>Nộp Bài</span>
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto p-4 pt-20 max-w-3xl mx-auto w-full pb-20 space-y-6 relative z-10">
        {test.questions.map((tq: any, i: number) => {
          const q = tq.question
          const isSelected = answers[q.id]
          const status = showExplanation[q.id]
          const opts = JSON.parse(q.options)
          
          return (
            <div key={q.id} className="bg-white/95 backdrop-blur-md p-6 rounded-3xl shadow-[0_8px_30px_rgba(15,35,75,0.12)] border border-white/80">
              <div className="flex gap-3 mb-6">
                 <span className="flex-shrink-0 bg-[#007AFF] text-white font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm shadow-xs">{i + 1}</span>
                 <div className="prose prose-sm max-w-none text-slate-800 pt-1" dangerouslySetInnerHTML={{ __html: q.content }} />
              </div>
              
              <div className="space-y-3">
                {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => {
                  if (!opts[k]) return null
                  
                  return (
                    <div key={k} onClick={() => handleSelectAnswer(q.id, k)} 
                      className={`
                        p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center
                        ${isSelected === k ? 'border-[#007AFF] bg-blue-50/70 shadow-xs' : 'border-slate-200/80 hover:border-blue-300 hover:bg-blue-50/30 bg-white/80 active:bg-slate-50'}
                        ${test.mode === 'practice' && status === 'correct' && (isSelected === k || q.correctOption === k) ? '!border-[#34C759] !bg-green-50 shadow-xs' : ''}
                        ${test.mode === 'practice' && status === 'incorrect' && isSelected === k ? '!border-[#FF3B30] !bg-red-50 shadow-xs' : ''}
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

              {/* Practice Mode: Button (?) Hỏi Giảng Viên AI sau khi trả lời */}
              {test.mode === 'practice' && isSelected && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                    {status === 'correct' ? (
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <Check size={14} /> Chính xác!
                      </span>
                    ) : (
                      <span className="text-rose-600 font-bold flex items-center gap-1">
                        <X size={14} /> Chưa đúng. Đáp án chuẩn: {q.correctOption}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => handleAskTeacher(q)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    title="Hỏi giảng viên AI giải thích chi tiết"
                  >
                    <HelpCircle size={15} />
                    <span>Giải thích (?)</span>
                  </button>
                </div>
              )}
            </div>
          )
        })}
        {renderCopyrightBadge('my-4')}
      </div>

      {/* ─── POPUP GIẢI THÍCH CHUYÊN NGHIỆP CỦA GIẢNG VIÊN AI ─────────────────── */}
      {activeExplainQ && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-2xl w-full p-5 sm:p-7 border border-slate-200 dark:border-slate-700 shadow-2xl relative max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Giảng Viên AI Giải Thích</span>
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold">
                      Y Khoa Chuẩn
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Phân tích chi tiết câu hỏi & ghi nhớ kiến thức
                  </p>
                </div>
              </div>

              {/* Close Button X */}
              <button
                onClick={() => {
                  setActiveExplainQ(null)
                  setExplanationContent(null)
                  setExplainError(null)
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Đóng và học bài tiếp"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* Question Preview Box */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText size={13} /> Nội dung câu hỏi:
                </div>
                <div
                  className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200"
                  dangerouslySetInnerHTML={{ __html: activeExplainQ.content }}
                />
                
                {/* 4 Options preview */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {(() => {
                    let opts: any = {}
                    try { opts = JSON.parse(activeExplainQ.options) } catch (e) {}
                    return Object.entries(opts).map(([k, val]: any) => {
                      const isCorrect = k === activeExplainQ.correctOption
                      const isUserSelected = answers[activeExplainQ.id] === k
                      return (
                        <div
                          key={k}
                          className={`p-2 rounded-xl border flex items-start gap-2 ${
                            isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                              : isUserSelected
                              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                          }`}>
                            {k}
                          </span>
                          <span className="font-medium text-xs leading-tight">{val}</span>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Waiting Loading State: "Đang hỏi giảng viên, chờ xíu nhé bây bii" */}
              {explainLoading && (
                <div className="p-8 text-center flex flex-col items-center justify-center gap-3 animate-fade-in">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-bounce">
                      <GraduationCap size={28} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-indigo-700 dark:text-indigo-300">
                      Đang hỏi giảng viên, chờ xíu nhé bây bii ✨
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 flex items-center justify-center gap-1.5">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Đang tổng hợp kiến thức và suy luận đa chiều...</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {explainError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                  <div className="font-bold mb-1">⚠️ Không thể tải lời giải thích:</div>
                  <p>{explainError}</p>
                  <button
                    onClick={() => handleAskTeacher(activeExplainQ)}
                    className="mt-3 px-3 py-1.5 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition-colors"
                  >
                    Thử lại với API Key khác
                  </button>
                </div>
              )}

              {/* AI Explanation Content Box */}
              {explanationContent && (
                <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 animate-fade-in">
                  {renderFormattedMarkdown(explanationContent)}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-medium">
                Dzota AI Assistant
              </span>
              <button
                onClick={() => {
                  setActiveExplainQ(null)
                  setExplanationContent(null)
                  setExplainError(null)
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Đóng và học bài tiếp</span>
                <X size={14} />
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
