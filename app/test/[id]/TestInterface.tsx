'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  CheckCircle,
  CheckCircle2,
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
  CheckSquare,
  CloudDownload,
  CloudOff,
  Trash2,
  WifiOff,
  Download,
  Bookmark,
  Target,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  LayoutList,
  SlidersHorizontal,
  ShieldAlert,
  Flame
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TestInterface({ test }: { test: any }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(!test.password)
  const [isStarted, setIsStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60)
  const [mounted, setMounted] = useState(false)
  
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({})
  const handleToggleFlag = (qId: string) => {
    setFlaggedQuestions(prev => ({
      ...prev,
      [qId]: !prev[qId]
    }))
  }
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showExplanation, setShowExplanation] = useState<Record<string, 'correct' | 'incorrect'>>({})
  const [savedSession, setSavedSession] = useState<any | null>(null)
  const [restoredToast, setRestoredToast] = useState<string | null>(null)
  const [activeBgEnabled, setActiveBgEnabled] = useState(true)
  const [activeBgDesktop, setActiveBgDesktop] = useState('')
  const [activeBgMobile, setActiveBgMobile] = useState('')

  // Offline Quiz Storage State (Lưu trữ đề để làm offline khi mất mạng)
  const [isSavedOffline, setIsSavedOffline] = useState(false)
  const [offlineToast, setOfflineToast] = useState<string | null>(null)

  // AI Question Explanation Modal states
  const [activeExplainQ, setActiveExplainQ] = useState<any | null>(null)
  const [explainLoading, setExplainLoading] = useState(false)
  const [explanationContent, setExplanationContent] = useState<string | null>(null)
  const [explainError, setExplainError] = useState<string | null>(null)
  const [explanationCache, setExplanationCache] = useState<Record<string, string>>({})

  // Review Wrong Questions & AI Analysis states
  const [wrongQuestionsList, setWrongQuestionsList] = useState<any[]>([])
  const [firstAttempts, setFirstAttempts] = useState<Record<string, string>>({})
  const [isWrongReviewMode, setIsWrongReviewMode] = useState(false)
  const [reviewQuestions, setReviewQuestions] = useState<any[]>([])
  const [showMistakeReviewModal, setShowMistakeReviewModal] = useState(false)
  const [showMistakeAnalysisModal, setShowMistakeAnalysisModal] = useState(false)
  const [isAnalyzingMistakes, setIsAnalyzingMistakes] = useState(false)
  const [mistakeAnalysisText, setMistakeAnalysisText] = useState<string | null>(null)
  const [mistakeAnalysisSaved, setMistakeAnalysisSaved] = useState(false)

  // ─── FOCUS MEDICAL PRO & FOCUS MODE STATES ──────────────────────────────
  const [focusMode, setFocusMode] = useState(false)
  const [showFocusModal, setShowFocusModal] = useState(false)
  const [focusPreset, setFocusPreset] = useState<number | 'custom' | 'unlimited'>(25) // 25p Pomodoro chuẩn y khoa
  const [customFocusMinutes, setCustomFocusMinutes] = useState(25)
  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60)
  const [focusUnlimitedElapsed, setFocusUnlimitedElapsed] = useState(0)
  const [focusIsUnlimited, setFocusIsUnlimited] = useState(false)
  const [focusWarningToast, setFocusWarningToast] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'single' | 'list'>('single') // Mặc định: Một câu hỏi làm trung tâm
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [showPaletteModal, setShowPaletteModal] = useState(false)

  // Timer cho chế độ tập trung Focus Medical Pro
  useEffect(() => {
    let timer: any = null
    if (focusMode) {
      timer = setInterval(() => {
        if (focusIsUnlimited) {
          setFocusUnlimitedElapsed(prev => prev + 1)
        } else {
          setFocusSecondsLeft(prev => {
            if (prev <= 1) {
              setFocusWarningToast('⏰ Hoàn thành chu kỳ tập trung y khoa! Bạn có thể tiếp tục hoặc giải lao ngắn.')
              return 0
            }
            return prev - 1
          })
        }
      }, 1000)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [focusMode, focusIsUnlimited])

  // Cơ chế chống xao nhãng, chặn back, chặn thoát khi đang bật Chế độ tập trung
  useEffect(() => {
    if (!focusMode) return

    // 1. Chặn Back Button trên điện thoại & laptop bằng pushState
    try {
      window.history.pushState({ focusLock: true }, '')
    } catch (e) {}

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault()
      try {
        window.history.pushState({ focusLock: true }, '')
      } catch (err) {}
      setFocusWarningToast('🛡️ Chế độ tập trung đang bật! Vui lòng nhấn nút "Thoát tập trung" ở góc trên nếu bạn muốn dừng.')
      setTimeout(() => setFocusWarningToast(null), 4500)
    }
    window.addEventListener('popstate', handlePopState)

    // 2. Chặn reload / đóng tab ngoài ý muốn (beforeunload)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Bạn đang trong Chế độ Tập Trung Y Khoa Focus Medical Pro. Bạn có chắc muốn rời đi?'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // 3. Cảnh báo khi người dùng vô tình thoát fullscreen
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement && focusMode) {
        setFocusWarningToast('⚠️ Đã thu nhỏ toàn màn hình. Bạn có thể nhấn lại nút Toàn màn hình để giữ độ tập trung tối đa.')
        setTimeout(() => setFocusWarningToast(null), 4000)
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)

    // 4. Thêm class lên body để ẩn triệt để toàn bộ mini-chat zalo/mess/widget
    document.body.classList.add('focus-medical-locked')

    return () => {
      window.removeEventListener('popstate', handlePopState)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.body.classList.remove('focus-medical-locked')
    }
  }, [focusMode])

  // Phím tắt điều hướng nhanh trên máy tính: Mũi tên trái / phải để đổi câu, số 1-7 hoặc A-G để chọn đáp án
  useEffect(() => {
    if (!isStarted || submitted) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeList = isWrongReviewMode ? reviewQuestions : test.questions
      if (!activeList || activeList.length === 0) return

      // Tránh bắt phím khi đang nhập liệu trong ô input / textarea
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setCurrentQuestionIndex(prev => Math.max(0, prev - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        setCurrentQuestionIndex(prev => Math.min(activeList.length - 1, prev + 1))
      } else if (['1', '2', '3', '4', '5', '6', '7'].includes(e.key)) {
        const keyMap: Record<string, string> = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', '5': 'E', '6': 'F', '7': 'G' }
        const optKey = keyMap[e.key]
        const currentQ = activeList[currentQuestionIndex]?.question || activeList[currentQuestionIndex]
        if (currentQ && optKey) {
          handleSelectAnswer(currentQ.id, optKey)
        }
      } else if (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(e.key)) {
        const optKey = e.key.toUpperCase()
        const currentQ = activeList[currentQuestionIndex]?.question || activeList[currentQuestionIndex]
        if (currentQ && optKey) {
          handleSelectAnswer(currentQ.id, optKey)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isStarted, submitted, isWrongReviewMode, reviewQuestions, test.questions, currentQuestionIndex])

  // Kích hoạt Chế độ tập trung y khoa
  const handleStartFocusMode = () => {
    setShowFocusModal(false)
    let minutes = 25
    if (focusPreset === 'unlimited') {
      setFocusIsUnlimited(true)
      setFocusUnlimitedElapsed(0)
    } else if (focusPreset === 'custom') {
      minutes = Math.max(1, Number(customFocusMinutes) || 25)
      setFocusIsUnlimited(false)
      setFocusSecondsLeft(minutes * 60)
    } else {
      minutes = Number(focusPreset) || 25
      setFocusIsUnlimited(false)
      setFocusSecondsLeft(minutes * 60)
    }
    setFocusMode(true)

    // Bật Fullscreen nếu trình duyệt hỗ trợ
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {})
      } else if ((document.documentElement as any).webkitRequestFullscreen) {
        (document.documentElement as any).webkitRequestFullscreen()
      }
    } catch (e) {}
  }

  // Tắt / Thoát Chế độ tập trung y khoa
  const handleExitFocusMode = () => {
    setFocusMode(false)
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      } else if ((document as any).webkitFullscreenElement) {
        (document as any).webkitExitFullscreen()
      }
    } catch (e) {}
  }

  // Check offline storage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && test?.id) {
      try {
        const stored = localStorage.getItem(`dzota_offline_quiz_${test.id}`)
        if (stored) setIsSavedOffline(true)
      } catch (e) {}
    }
  }, [test?.id])

  // Load wrong questions for this test from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && test?.id) {
      try {
        const raw = localStorage.getItem(`dzota_wrong_questions_${test.id}`)
        if (raw) {
          const list = JSON.parse(raw)
          if (Array.isArray(list)) setWrongQuestionsList(list)
        }
      } catch (e) {}
    }
  }, [test?.id])

  const handleSaveOffline = () => {
    if (typeof window === 'undefined' || !test?.id) return
    try {
      const payload = {
        test,
        savedAt: Date.now(),
        offlineVersion: '1.0'
      }
      localStorage.setItem(`dzota_offline_quiz_${test.id}`, JSON.stringify(payload))
      setIsSavedOffline(true)

      if ('caches' in window) {
        caches.open('dzota-quiz-offline-v2').then(async (cache) => {
          try { await cache.add(window.location.href) } catch (e) {}
          try { await cache.add('/') } catch (e) {}
        }).catch(() => {})
      }
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'CACHE_OFFLINE_QUIZ',
          url: window.location.href
        })
      }

      setOfflineToast('⚡ Đã lưu trữ đề thi vào bộ nhớ máy! Bạn có thể mở lại link hoặc F5 làm bài bất cứ lúc nào kể cả khi ngắt kết nối mạng.')
      setTimeout(() => setOfflineToast(null), 6000)
    } catch (e) {
      alert('Không thể lưu trữ do bộ nhớ máy đã đầy!')
    }
  }

  const handleRemoveOffline = () => {
    if (typeof window === 'undefined' || !test?.id) return
    if (!confirm('Bạn có chắc muốn xóa bản lưu trữ offline của đề thi này khỏi thiết bị?')) return
    try {
      localStorage.removeItem(`dzota_offline_quiz_${test.id}`)
      setIsSavedOffline(false)
      setOfflineToast('Đã xóa dữ liệu đề thi offline thành công!')
      setTimeout(() => setOfflineToast(null), 4000)
    } catch (e) {}
  }

  // Fetch admin settings for active background mode and custom images (với sessionStorage cache)
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('dzota_cached_bg_settings')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed.activeBgEnabled !== undefined) setActiveBgEnabled(Boolean(parsed.activeBgEnabled))
        if (parsed.activeBgDesktop) setActiveBgDesktop(parsed.activeBgDesktop)
        if (parsed.activeBgMobile) setActiveBgMobile(parsed.activeBgMobile)
      }
    } catch (e) {}

    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(data => {
        if (data && data.activeBgEnabled !== undefined) {
          setActiveBgEnabled(Boolean(data.activeBgEnabled))
        }
        if (data?.activeBgDesktop) setActiveBgDesktop(data.activeBgDesktop)
        if (data?.activeBgMobile) setActiveBgMobile(data.activeBgMobile)
        try {
          sessionStorage.setItem('dzota_cached_bg_settings', JSON.stringify({
            activeBgEnabled: data.activeBgEnabled,
            activeBgDesktop: data.activeBgDesktop,
            activeBgMobile: data.activeBgMobile
          }))
        } catch (e) {}
      })
      .catch(() => {})
  }, [])

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

          // Giữ ở màn hình Chờ, KHÔNG tự ý ép vào bài thi để tránh tình trạng câu hỏi bị tự chọn đáp án cũ trước khi làm bài
          // Người dùng có thể bấm "Tiếp tục" trên thẻ bài làm dở hoặc bấm "Bắt đầu làm bài" mới 100%
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
    setIsWrongReviewMode(false)
    setFirstAttempts({})
    const key = `dzota_quiz_session_${test.id}`
    if (!isResume) {
      try { localStorage.removeItem(key) } catch (e) {}
      setAnswers({})
      setShowExplanation({})
      setFlaggedQuestions({})
      setTimeLeft(test.timeLimit * 60)
      setSavedSession(null)
    } else if (savedSession) {
      setAnswers(savedSession.answers || {})
      setShowExplanation(savedSession.showExplanation || {})
      setFlaggedQuestions(savedSession.flaggedQuestions || {})
      setTimeLeft(savedSession.timeLeft || test.timeLimit * 60)
    }
    setIsStarted(true)
    const now = Date.now()
    const curTime = isResume && savedSession ? (savedSession.timeLeft || test.timeLimit * 60) : test.timeLimit * 60
    const sessionData = {
      testId: test.id,
      isStarted: true,
      answers: isResume && savedSession ? (savedSession.answers || {}) : {},
      showExplanation: isResume && savedSession ? (savedSession.showExplanation || {}) : {},
      timeLeft: curTime,
      endTime: test.mode === 'exam' ? (now + curTime * 1000) : null,
      submitted: false,
      savedAt: now
    }
    try {
      localStorage.setItem(key, JSON.stringify(sessionData))
    } catch (e) {}
  }

  const handleSelectAnswer = (qId: string, optKey: string) => {
    if (submitted && test.mode === 'exam') return
    if (!isWrongReviewMode) {
      setFirstAttempts(prev => {
        if (prev[qId] === undefined) {
          return { ...prev, [qId]: optKey }
        }
        return prev
      })
    }
    const nextAnswers = { ...answers, [qId]: optKey }
    setAnswers(nextAnswers)
    
    let nextExp = showExplanation
    if (test.mode === 'practice') {
      const activeList = isWrongReviewMode ? reviewQuestions : test.questions
      const foundItem = activeList.find((tq: any) => (tq.question?.id || tq.id) === qId)
      const q = foundItem?.question || foundItem
      if (q && q.correctOption === optKey) {
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

  // Parse markdown bold text (**text** or *text*) and KaTeX math ($...$) neatly without leftover asterisks
  const renderFormattedMarkdown = (text: string) => {
    if (!text) return null
    const lines = text.split('\n')

    // Helper render công thức KaTeX ($...$ hoặc $$...$$) với fallback ký tự Hy Lạp
    const renderMathText = (str: string, keyPrefix: string) => {
      const parts = str.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g)
      return parts.map((part, pIdx) => {
        const k = `${keyPrefix}_m_${pIdx}`
        if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) {
          const math = part.slice(2, -2).trim()
          if (typeof window !== 'undefined' && (window as any).katex) {
            try {
              const html = (window as any).katex.renderToString(math, { displayMode: true, throwOnError: false })
              return <span key={k} dangerouslySetInnerHTML={{ __html: html }} className="block my-2 overflow-x-auto text-center" />
            } catch (e) {}
          }
          return <code key={k} className="block my-1.5 p-1 font-mono text-xs bg-slate-100 dark:bg-slate-800 rounded">{math}</code>
        }
        if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
          const math = part.slice(1, -1).trim()
          if (typeof window !== 'undefined' && (window as any).katex) {
            try {
              const html = (window as any).katex.renderToString(math, { displayMode: false, throwOnError: false })
              return <span key={k} dangerouslySetInnerHTML={{ __html: html }} className="inline-block px-0.5" />
            } catch (e) {}
          }
          const greek = math
            .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ')
            .replace(/\\delta/g, 'δ').replace(/\\Delta/g, 'Δ').replace(/\\theta/g, 'θ')
            .replace(/\\lambda/g, 'λ').replace(/\\mu/g, 'μ').replace(/\\pi/g, 'π')
            .replace(/\\sigma/g, 'σ').replace(/\\omega/g, 'ω').replace(/\\to/g, '→')
            .replace(/\\le/g, '≤').replace(/\\ge/g, '≥').replace(/\\neq/g, '≠')
          return <span key={k} className="font-semibold text-indigo-700 dark:text-indigo-300">{greek}</span>
        }
        return <span key={k}>{part}</span>
      })
    }

    // Helper xử lý in đậm, in nghiêng và đảm bảo khoảng cách chữ chuẩn xác
    const parseInline = (content: string, keyPrefix: string) => {
      // 1. Chuẩn hóa: Nếu dấu hai chấm dính liền với ** mở thì thêm dấu cách
      const sanitized = content.replace(/:(\*\*)/g, ': $1')

      // 2. Tách chuỗi theo cú pháp **in đậm** và *in nghiêng*
      const tokens = sanitized.split(/(\*\*[\s\S]*?\*\*|\*[^*]+?\*)/g)

      return tokens.map((token, pIdx) => {
        const k = `${keyPrefix}_p_${pIdx}`
        if (!token) return null

        if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
          const inner = token.slice(2, -2).trim()

          // Kiểm tra xem token trước đó có kết thúc bằng chữ/số không -> nếu có thì thêm dấu cách phía trước
          const prev = tokens[pIdx - 1]
          const needsSpaceBefore = prev && /[a-zA-Z0-9_\u00C0-\u1EF9]$/.test(prev)

          // Kiểm tra xem token sau đó có bắt đầu bằng chữ/số không -> nếu có thì thêm dấu cách phía sau
          const next = tokens[pIdx + 1]
          const needsSpaceAfter = next && /^[a-zA-Z0-9_\u00C0-\u1EF9]/.test(next)

          return (
            <span key={k}>
              {needsSpaceBefore ? ' ' : ''}
              <strong className="font-extrabold text-slate-900 dark:text-white">
                {renderMathText(inner, `${k}_b`)}
              </strong>
              {needsSpaceAfter ? ' ' : ''}
            </span>
          )
        }

        if (token.startsWith('*') && token.endsWith('*') && token.length >= 2 && !token.startsWith('**')) {
          const inner = token.slice(1, -1).trim()
          const prev = tokens[pIdx - 1]
          const needsSpaceBefore = prev && /[a-zA-Z0-9_\u00C0-\u1EF9]$/.test(prev)
          const next = tokens[pIdx + 1]
          const needsSpaceAfter = next && /^[a-zA-Z0-9_\u00C0-\u1EF9]/.test(next)

          return (
            <span key={k}>
              {needsSpaceBefore ? ' ' : ''}
              <em className="italic text-indigo-900 dark:text-indigo-200">
                {renderMathText(inner, `${k}_i`)}
              </em>
              {needsSpaceAfter ? ' ' : ''}
            </span>
          )
        }

        const cleaned = token.replace(/^\*{1,2}/, '').replace(/\*{1,2}$/, '')
        return <span key={k}>{renderMathText(cleaned, `${k}_t`)}</span>
      })
    }

    return (
      <div className="space-y-2.5 text-left leading-relaxed text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-1.5" />

          // Xóa các ký hiệu markdown để nhận diện mục chính
          const cleanLine = trimmed
            .replace(/^[\s#*>\-•+]+/, '')
            .replace(/\*\*:\s*$/, '')
            .replace(/\*\*\s*$/, '')
            .trim()

          // 1. Nhóm / Chuyên đề lớn (### NHÓM...)
          if (trimmed.startsWith('### ') || trimmed.startsWith('## ') || trimmed.startsWith('# ')) {
            const hText = trimmed.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim()
            return (
              <div key={idx} className="mt-5 mb-2.5 p-3 rounded-2xl bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-pink-50/60 dark:from-indigo-950/70 dark:via-purple-950/40 dark:to-slate-800 border border-indigo-200/80 dark:border-indigo-800 shadow-xs flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">🎯</span>
                <h4 className="text-sm sm:text-base font-extrabold text-indigo-950 dark:text-indigo-100">{hText}</h4>
              </div>
            )
          }

          // 2. Các mục chuyên môn cốt lõi
          const isCoreKnowledge = cleanLine.includes('Bản chất kiến thức') || cleanLine.startsWith('Kiến thức liên quan') || cleanLine.startsWith('1. Kiến thức')
          const isTrapAnalysis = cleanLine.includes('Tại sao chọn') || cleanLine.includes('Bẫy cần tránh') || cleanLine.includes('Phân tích bẫy') || cleanLine.startsWith('2. Tại sao chọn')
          const isGoldenRule = cleanLine.includes('Quy tắc vàng') || cleanLine.includes('Mẹo phản xạ') || cleanLine.includes('Các phương án còn lại') || cleanLine.startsWith('3. Các phương án')

          if (isCoreKnowledge && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.length < 80)) {
            return (
              <div key={idx} className="mt-3.5 pt-1 mb-1.5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-100/90 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200 font-extrabold text-xs sm:text-sm tracking-wide shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  🧠 {cleanLine.replace(/:$/, '')}
                </span>
              </div>
            )
          }

          if (isTrapAnalysis && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.length < 80)) {
            return (
              <div key={idx} className="mt-3.5 pt-1 mb-1.5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100/90 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-extrabold text-xs sm:text-sm tracking-wide shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  🎯 {cleanLine.replace(/:$/, '')}
                </span>
              </div>
            )
          }

          if (isGoldenRule && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.length < 80)) {
            return (
              <div key={idx} className="mt-3.5 pt-1 mb-1.5">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-100/90 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 font-extrabold text-xs sm:text-sm tracking-wide shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  ⚡ {cleanLine.replace(/:$/, '')}
                </span>
              </div>
            )
          }

          // 3. Question Item Card (Ví dụ: "+ Câu 7 - Kháng sinh ưu tiên..." hoặc "Câu 1 (Đáp án A)...")
          const isQuestionItem = /^(?:[+\-*•]\s*)?(?:\*\*)?Câu\s+\d+/i.test(trimmed)
          if (isQuestionItem) {
            const content = trimmed.replace(/^[+\-*•]\s*/, '')
            return (
              <div key={idx} className="mt-4 mb-2 p-3 sm:p-3.5 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
                  ?
                </span>
                <div className="flex-1 font-bold text-indigo-950 dark:text-indigo-200 text-xs sm:text-sm">
                  {parseInline(content, `q_${idx}`)}
                </div>
              </div>
            )
          }

          // 4. Correct Answer Row (Ví dụ: "* ✅ Đáp án đúng C..." hoặc "-> Do đó, Beta-lactam (C)...")
          const isCorrectAnswer = /^(?:[+\-*•]\s*)?(?:✅|->\s*|=>\s*)?(?:\*\*)?Đáp án đúng/i.test(trimmed) || trimmed.includes('✅') || /->\s*Do đó/i.test(trimmed)
          if (isCorrectAnswer) {
            const content = trimmed.replace(/^[+\-*•]\s*/, '')
            return (
              <div key={idx} className="flex items-start gap-2.5 ml-3 sm:ml-5 my-1.5 p-2 sm:p-2.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-emerald-950 dark:text-emerald-200 text-xs sm:text-sm">
                <span className="shrink-0 text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✅</span>
                <div className="flex-1 leading-relaxed">
                  {parseInline(content.replace(/^[✅\s]+/, ''), `ca_${idx}`)}
                </div>
              </div>
            )
          }

          // 5. Trap Header (Ví dụ: "* ⚠️ Bẫy các phương án sai..." hoặc "⚠️ Bẫy...")
          const isTrapHeader = /^(?:[+\-*•]\s*)?⚠️/i.test(trimmed) || cleanLine.startsWith('Bẫy các phương án') || cleanLine.startsWith('Bẫy phương án')
          if (isTrapHeader) {
            return (
              <div key={idx} className="flex items-center gap-2 ml-3 sm:ml-5 mt-2.5 mb-1 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200">
                <span className="shrink-0 text-amber-600 dark:text-amber-400">⚠️</span>
                <span>{cleanLine.replace(/:$/, '')}</span>
              </div>
            )
          }

          // 6. Trap Option Details (Ví dụ: "- A (Macrolid): ..." hoặc "Macrolid (A): ...")
          const isOptionTrap = /^[+\-*•]\s*(?:Phương án\s*)?[A-D]\s*[\(:]/i.test(trimmed) || /^[+\-*•]\s*[\w\s-]+\s*\([A-D]\)\s*:/i.test(trimmed)
          if (isOptionTrap) {
            const content = trimmed.replace(/^[+\-*•]\s*/, '')
            return (
              <div key={idx} className="flex items-start gap-2 ml-5 sm:ml-7 my-1 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                <div className="flex-1 leading-relaxed">
                  {parseInline(content, `ot_${idx}`)}
                </div>
              </div>
            )
          }

          // 7. Sub-bullets (+ hoặc thụt dòng)
          if (trimmed.startsWith('+ ') || trimmed.startsWith('  + ') || trimmed.startsWith('    - ')) {
            const content = trimmed.replace(/^[\s+]+/, '')
            return (
              <div key={idx} className="flex items-start gap-2.5 ml-4 sm:ml-5 my-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 mt-2 shrink-0" />
                <div className="flex-1 leading-relaxed">{parseInline(content, `sb_${idx}`)}</div>
              </div>
            )
          }

          // 8. Bullets thông thường (- hoặc * hoặc •)
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
            const content = trimmed.slice(2)
            return (
              <div key={idx} className="flex items-start gap-2.5 ml-2 my-1.5">
                <span className="w-2 h-2 rounded-md bg-indigo-400 dark:bg-indigo-500 mt-1.5 shrink-0 opacity-70" />
                <div className="flex-1 leading-relaxed font-medium">{parseInline(content, `b_${idx}`)}</div>
              </div>
            )
          }

          // 9. Đoạn văn thường
          return (
            <p key={idx} className="my-1.5 leading-relaxed">
              {parseInline(trimmed, `p_${idx}`)}
            </p>
          )
        })}
      </div>
    )
  }

  const renderMistakeModals = () => (
    <>
      {/* Modal 1: Ôn Lại Câu Sai */}
      {showMistakeReviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-pop-in">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                  <RotateCcw size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                    <span>Ôn Lại Câu Sai</span>
                    <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold">
                      {wrongQuestionsList.length} câu
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 truncate max-w-[260px] sm:max-w-xs">{test.title || 'Bài thi'}</p>
                </div>
              </div>
              <button
                onClick={() => setShowMistakeReviewModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-600">
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-amber-900 space-y-1.5 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-amber-800">
                  <HelpCircle size={15} />
                  <span>Quy tắc ôn luyện thông minh:</span>
                </div>
                <p className="text-[12px] text-amber-800/90 leading-relaxed">
                  Các câu hỏi trong danh sách này <strong>chỉ biến mất</strong> khi bạn làm lượt thi chính thức ở phần <strong>"Bắt Đầu Làm Bài"</strong> và trả lời đúng ngay lần đầu tiên.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                <div className="px-4 py-2.5 bg-slate-50 font-bold text-slate-700 text-xs flex justify-between items-center">
                  <span>Danh sách câu hỏi cần củng cố</span>
                  <span className="text-slate-400 font-normal">{wrongQuestionsList.length} câu</span>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 p-1">
                  {wrongQuestionsList.map((q, idx) => (
                    <div key={idx} className="p-2.5 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition flex gap-2 items-start">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center shrink-0 text-[11px] mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="line-clamp-2 leading-relaxed" dangerouslySetInnerHTML={{ __html: q.content || q.text || 'Câu hỏi' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-2.5 items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleRequestMistakeAnalysis}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Sparkles size={16} />
                <span>✨ Phân tích lỗi sai với AI</span>
              </button>

              <button
                type="button"
                onClick={handleStartWrongQuestionsPractice}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs sm:text-sm shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play size={15} fill="currentColor" />
                <span>Bắt đầu ôn luyện ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Phân Tích Lỗi Sai Với AI */}
      {showMistakeAnalysisModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden animate-pop-in">
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-indigo-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-base sm:text-lg flex items-center gap-2">
                    <span>Giảng Viên AI - Phân Tích Lỗi Sai</span>
                  </h3>
                  <p className="text-xs text-indigo-700 font-medium">Tổng hợp kiến thức trọng tâm cho {wrongQuestionsList.length} câu hỏi sai</p>
                </div>
              </div>
              <button
                onClick={() => setShowMistakeAnalysisModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-4">
              {isAnalyzingMistakes ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center animate-spin">
                    <RotateCcw size={24} className="text-indigo-600" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm sm:text-base">Đang tổng hợp kiến thức từ Giảng viên AI...</h4>
                  <p className="text-xs text-slate-500 max-w-sm">
                    Hệ thống đang phân tích các câu hỏi bạn làm sai, cô đọng kiến thức then chốt để giúp bạn làm đúng 100% trong lần ôn tập này.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-xs flex items-center justify-between">
                    <span>💡 Hãy đọc kỹ phần tóm tắt cốt lõi bên dưới trước khi bắt đầu ôn luyện.</span>
                    <span className="font-bold shrink-0 ml-2">{wrongQuestionsList.length} câu hỏi</span>
                  </div>
                  <div className="bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200 text-xs sm:text-sm leading-relaxed max-h-[50vh] overflow-y-auto">
                    {renderFormattedMarkdown(mistakeAnalysisText || '')}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2.5 items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMistakeAnalysis}
                  disabled={isAnalyzingMistakes || !mistakeAnalysisText}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                  title="Sao chép nội dung phân tích"
                >
                  <FileText size={14} />
                  <span>Sao chép</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveMistakeAnalysisToAccount}
                  disabled={isAnalyzingMistakes || !mistakeAnalysisText || mistakeAnalysisSaved}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    mistakeAnalysisSaved
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                  } disabled:opacity-50`}
                  title="Lưu bài phân tích này vào tab Sổ tay lỗi sai"
                >
                  <BookOpen size={14} />
                  <span>{mistakeAnalysisSaved ? '✓ Đã lưu vào sổ tay' : 'Lưu vào sổ tay'}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowMistakeAnalysisModal(false)
                  handleStartWrongQuestionsPractice()
                }}
                disabled={isAnalyzingMistakes}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <span>Đóng & Vào làm bài</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  const handleSubmit = () => {
    const questionsToGrade = isWrongReviewMode ? reviewQuestions : test.questions
    let correctCount = 0
    questionsToGrade.forEach((tq: any) => {
      const q = tq.question || tq
      if (answers[q.id] === q.correctOption) {
        correctCount++
      }
    })
    setScore(parseFloat(((correctCount / questionsToGrade.length) * 10).toFixed(1)))
    setSubmitted(true)
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'instant' })
        if (typeof document !== 'undefined') {
          document.documentElement.scrollTop = 0
          document.body.scrollTop = 0
        }
      }, 60)
    }

    // Cập nhật ngân hàng câu sai chỉ khi làm ở lượt thi chính thức (!isWrongReviewMode)
    if (!isWrongReviewMode && test?.id) {
      try {
        let currentWrong: any[] = []
        try {
          const raw = localStorage.getItem(`dzota_wrong_questions_${test.id}`)
          if (raw) currentWrong = JSON.parse(raw) || []
        } catch (e) {}

        test.questions.forEach((tq: any) => {
          const q = tq.question || tq
          const firstAns = firstAttempts[q.id] !== undefined ? firstAttempts[q.id] : answers[q.id]
          const isFirstTryCorrect = firstAns !== undefined && firstAns !== null && firstAns === q.correctOption

          if (isFirstTryCorrect) {
            // Đúng ngay lần đầu làm bài chính thức -> xóa khỏi danh sách câu sai
            currentWrong = currentWrong.filter((wq: any) => wq.id !== q.id && wq.content !== q.content)
          } else {
            // Sai hoặc chưa chọn lần đầu -> thêm vào danh sách câu sai nếu chưa có
            const alreadyIn = currentWrong.some((wq: any) => wq.id === q.id || wq.content === q.content)
            if (!alreadyIn) {
              currentWrong.push({
                id: q.id,
                content: q.content,
                options: q.options,
                correctOption: q.correctOption,
                explanation: q.explanation || ''
              })
            }
          }
        })

        localStorage.setItem(`dzota_wrong_questions_${test.id}`, JSON.stringify(currentWrong))
        setWrongQuestionsList(currentWrong)
      } catch (e) {
        console.error("Lỗi cập nhật danh sách câu sai:", e)
      }
    }

    if (test?.id) {
      try { localStorage.removeItem(`dzota_quiz_session_${test.id}`) } catch (e) {}
    }
  }

  const handleStartWrongQuestionsPractice = () => {
    if (wrongQuestionsList.length === 0) {
      alert("Bạn chưa có dữ liệu câu sai nào trong bài này!")
      return
    }
    setShowMistakeReviewModal(false)
    setShowMistakeAnalysisModal(false)
    setIsWrongReviewMode(true)
    setFirstAttempts({})
    setAnswers({})
    setShowExplanation({})
    setSubmitted(false)
    setScore(0)
    setTimeLeft(test.timeLimit * 60)
    
    const formatted = wrongQuestionsList.map((wq, idx) => ({
      id: `review_${wq.id || idx}`,
      question: {
        id: wq.id || `q_rev_${idx}`,
        content: wq.content || wq.question || wq.questionText || wq.text || '',
        options: typeof wq.options === 'string' ? wq.options : JSON.stringify(wq.options || {}),
        correctOption: wq.correctOption || wq.correct || '',
        explanation: wq.explanation || ''
      }
    }))
    setReviewQuestions(formatted)
    setIsStarted(true)
  }

  const handleRequestMistakeAnalysis = async () => {
    if (wrongQuestionsList.length === 0) return
    setShowMistakeAnalysisModal(true)
    setMistakeAnalysisSaved(false)
    if (mistakeAnalysisText) return

    setIsAnalyzingMistakes(true)
    try {
      const res = await fetch('/api/analyze-mistakes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizTitle: test.title || 'Bài thi',
          subjectName: test.subject || 'Chung',
          mistakes: wrongQuestionsList.map((q: any) => ({
            questionText: q.content || q.question || q.questionText || q.text || '',
            options: typeof q.options === 'string' ? JSON.parse(q.options || '{}') : (q.options || {}),
            correctOption: q.correctOption || q.correct || ''
          }))
        })
      })
      const data = await res.json()
      if (res.ok && data.analysis) {
        setMistakeAnalysisText(data.analysis)
      } else {
        setMistakeAnalysisText(`❌ Không thể phân tích: ${data.error || 'Lỗi kết nối máy chủ'}`)
      }
    } catch (err: any) {
      setMistakeAnalysisText('❌ Lỗi kết nối đến máy chủ giảng viên AI. Vui lòng thử lại sau.')
    } finally {
      setIsAnalyzingMistakes(false)
    }
  }

  const handleSaveMistakeAnalysisToAccount = async () => {
    if (!mistakeAnalysisText || !test?.id) return
    try {
      const localSaved = JSON.parse(localStorage.getItem('dzota_saved_mistake_analyses') || '[]')
      let newItemId = 'analysis_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)

      try {
        const sRes = await fetch('/api/student/mistakes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quizId: test.id,
            quizTitle: test.title || 'Bài thi',
            subject: test.subject || 'Chung',
            mistakeCount: wrongQuestionsList.length,
            analysisText: mistakeAnalysisText
          })
        })
        const sData = await sRes.json()
        if (sData.success && sData.analysis?.id) {
          newItemId = sData.analysis.id
        }
      } catch (err) {}

      const newItem = {
        id: newItemId,
        quizId: test.id,
        quizTitle: test.title || 'Bài thi',
        subject: test.subject || 'Chung',
        mistakeCount: wrongQuestionsList.length,
        analysisText: mistakeAnalysisText,
        createdAt: new Date().toISOString()
      }
      const updatedLocal = [newItem, ...localSaved.filter((item: any) => item.analysisText !== mistakeAnalysisText)]
      localStorage.setItem('dzota_saved_mistake_analyses', JSON.stringify(updatedLocal))

      setMistakeAnalysisSaved(true)
      alert("💾 Đã lưu bài phân tích vào Sổ tay lỗi sai thành công!")
    } catch (e: any) {
      alert("Lưu bài phân tích thất bại: " + e.message)
    }
  }

  const handleCopyMistakeAnalysis = () => {
    if (!mistakeAnalysisText) return
    navigator.clipboard.writeText(mistakeAnalysisText)
      .then(() => alert("📋 Đã sao chép nội dung phân tích vào clipboard!"))
      .catch(() => alert("Không thể sao chép tự động."))
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

            {/* Offline Toast Notification */}
            {offlineToast && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-xs text-left">
                <CheckCircle size={16} className="text-emerald-600 flex-shrink-0" />
                <span>{offlineToast}</span>
              </div>
            )}

            {/* Offline Storage Actions: Lưu đề làm offline khi mất mạng & Xóa lưu trữ */}
            <div className="mb-4 flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-left">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${isSavedOffline ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                  {isSavedOffline ? <Check size={16} /> : <CloudDownload size={16} />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>Làm bài khi mất mạng (Offline)</span>
                    {isSavedOffline && (
                      <span className="text-[10px] bg-emerald-600 text-white font-black px-1.5 py-0.2 rounded-md">
                        Đã Lưu
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium truncate">
                    {isSavedOffline ? 'Đề thi đã sẵn sàng trong máy không cần internet' : 'Lưu trữ đề vào thiết bị để làm bài khi không có mạng'}
                  </div>
                </div>
              </div>

              {isSavedOffline ? (
                <button
                  onClick={handleRemoveOffline}
                  type="button"
                  className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1 transition cursor-pointer border border-rose-200 flex-shrink-0"
                  title="Xóa đề đã lưu trữ offline"
                >
                  <Trash2 size={13} />
                  <span>Xóa lưu trữ</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveOffline}
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shadow-xs flex-shrink-0"
                  title="Tải về máy để làm bài khi offline"
                >
                  <CloudDownload size={14} />
                  <span>Lưu Offline</span>
                </button>
              )}
            </div>

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

            {/* Subtle Review Wrong Questions Button */}
            <button
              type="button"
              onClick={() => {
                if (!wrongQuestionsList || wrongQuestionsList.length === 0) {
                  alert('Bạn chưa có dữ liệu câu sai nào cho đề thi này!')
                  return
                }
                setShowMistakeReviewModal(true)
              }}
              className="w-full mt-2.5 py-2.5 px-4 rounded-xl sm:rounded-2xl border border-amber-200/90 bg-amber-50/70 hover:bg-amber-100/80 text-amber-900 text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]"
              title="Ôn tập lại các câu hỏi từng làm sai"
            >
              <RotateCcw size={15} className="text-amber-600 flex-shrink-0" />
              <span>Ôn lại câu sai</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                wrongQuestionsList && wrongQuestionsList.length > 0
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-amber-200/70 text-amber-800'
              }`}>
                {wrongQuestionsList ? wrongQuestionsList.length : 0} câu
              </span>
            </button>

            {/* Copyright Badge */}
            {renderCopyrightBadge('mt-4')}

          </div>
        </div>

        {/* Global style tag for test background & customizable active background */}
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
            background-image: ${activeBgMobile ? `url('${activeBgMobile}')` : `url('/bg-active-mobile.png'), url('https://i.ibb.co/7NnQtYVb/b93ce28c-a278-4123-8650-771eb2a3be79.png')`};
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            background-attachment: fixed;
          }
          @media (min-width: 1024px) {
            .dzota-active-bg {
              background-image: ${activeBgDesktop ? `url('${activeBgDesktop}')` : `url('/bg-active-desktop.png'), url('https://i.ibb.co/xqxLMLNj/1a348e38-aec7-4e9a-9bbe-69ff1c4af67d.png')`};
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              background-attachment: fixed;
            }
          }
        `}</style>
        {renderMistakeModals()}
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
          <button onClick={() => window.location.reload()} className="mt-6 w-full bg-slate-100 text-[#007AFF] px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            Làm lại
          </button>
          <button
            type="button"
            onClick={() => {
              if (wrongQuestionsList.length === 0) {
                alert('Chúc mừng! Bạn không có câu sai nào cần ôn tập.')
                return
              }
              setShowMistakeReviewModal(true)
            }}
            className="mt-3 w-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.98]"
          >
            <RotateCcw size={16} className="text-amber-600" />
            <span>Ôn Lại Câu Sai</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-extrabold ${
              wrongQuestionsList.length > 0 ? 'bg-amber-500 text-white' : 'bg-amber-200 text-amber-800'
            }`}>
              {wrongQuestionsList.length} câu
            </span>
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
        {renderMistakeModals()}
      </div>
    )
  }

  // ─── Active test-taking view (Focus Medical Pro) ──────────────────────────────
  const activeQuestions = isWrongReviewMode ? reviewQuestions : test.questions
  const currentQ = activeQuestions[currentQuestionIndex]?.question || activeQuestions[currentQuestionIndex]

  // Render một thẻ câu hỏi chuẩn Focus Medical Pro
  const renderFocusMedicalQuestionCard = (qItem: any, idx: number, isSingleView: boolean = true) => {
    if (!qItem) return null
    const q = qItem.question || qItem
    const qId = q.id
    const isSelected = answers[qId]
    const status = showExplanation[qId]
    let opts: any = {}
    try {
      opts = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || {})
    } catch (e) {
      opts = {}
    }
    const isFlagged = !!flaggedQuestions[qId]

    return (
      <div
        key={qId}
        id={`test-question-card-${idx}`}
        className={`focus-medical-card p-4 sm:p-6 mb-4 relative select-none ${
          isFlagged ? 'focus-medical-card-flagged' : ''
        }`}
      >
        {/* Banner đánh dấu xem lại nếu được flag */}
        {isFlagged && (
          <div className="mb-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Bookmark size={13} fill="currentColor" className="text-amber-600" />
            <span>⭐ Câu hỏi đang được lưu ý xem lại</span>
          </div>
        )}

        {/* Khung nội dung câu hỏi: Font Times New Roman, chữ Navy #17324D */}
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0 transition-all ${
                isFlagged 
                  ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-300' 
                  : 'bg-[#17324D] text-white shadow-xs'
              }`}>
                {idx + 1}
              </span>
              <div className="flex-1">
                <div
                  className="font-times text-[#17324D] text-[15.5px] sm:text-[17px] leading-relaxed font-semibold"
                  dangerouslySetInnerHTML={{ __html: q.content }}
                />
              </div>
            </div>

            {/* Nút Đánh dấu xem lại */}
            <button
              type="button"
              onClick={() => handleToggleFlag(qId)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                isFlagged
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 ring-2 ring-amber-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title={isFlagged ? 'Bỏ đánh dấu xem lại câu này' : 'Đánh dấu để xem lại câu này'}
            >
              <Bookmark size={13} fill={isFlagged ? 'currentColor' : 'none'} className={isFlagged ? 'text-amber-600' : 'text-slate-500'} />
              <span className="hidden xs:inline">{isFlagged ? 'Đã lưu ý' : 'Xem lại'}</span>
            </button>
          </div>
        </div>

        {/* Danh sách phương án: Chuẩn Focus Medical Pro - Toàn bộ hàng bấm được, cao 54-64px PC, 44-48px mobile */}
        <div className="space-y-2.5 sm:space-y-3 pt-1">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(k => {
            if (!opts[k]) return null
            const isUserPick = isSelected === k
            const isRightOpt = q.correctOption === k
            const isPractice = test.mode === 'practice'

            let optionClass = 'focus-medical-option'
            let letterClass = 'focus-medical-letter'

            if (isPractice && status === 'correct' && (isUserPick || isRightOpt)) {
              optionClass += ' focus-medical-option-correct'
              letterClass += ' focus-medical-letter-correct'
            } else if (isPractice && status === 'incorrect' && isUserPick) {
              optionClass += ' focus-medical-option-incorrect'
              letterClass += ' focus-medical-letter-incorrect'
            } else if (isUserPick) {
              optionClass += isFlagged ? ' focus-medical-option-flagged-selected' : ' focus-medical-option-selected'
              letterClass += ' focus-medical-letter-selected'
            }

            return (
              <div
                key={k}
                onClick={() => handleSelectAnswer(qId, k)}
                className={optionClass}
              >
                <span className={letterClass}>{k}</span>
                <span className="font-times text-[15px] sm:text-[16px] leading-snug flex-1 text-[#17324D] font-normal">
                  {opts[k]}
                </span>
                {isPractice && status === 'correct' && (isUserPick || isRightOpt) && (
                  <CheckCircle size={20} className="text-[#087F8C] ml-2 flex-shrink-0" />
                )}
                {isPractice && status === 'incorrect' && isUserPick && (
                  <XCircle size={20} className="text-[#E53E3E] ml-2 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>

        {/* Chế độ Luyện tập: Phản hồi đúng/sai và nút Giảng viên AI */}
        {test.mode === 'practice' && isSelected && (
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs font-semibold">
              {status === 'correct' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F5EE] text-[#0E6245] font-bold border border-[#087F8C]/30">
                  <Check size={14} /> Chính xác!
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2F2] text-[#9B2C2C] font-bold border border-[#E53E3E]/30">
                  <X size={14} /> Chưa đúng. Đáp án chuẩn: <strong className="font-bold underline">{q.correctOption}</strong>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => handleAskTeacher(q)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#087F8C] hover:bg-[#066772] text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Hỏi giảng viên AI phân tích chi tiết"
            >
              <HelpCircle size={14} />
              <span>Giảng viên AI giải thích (?)</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`focus-medical-root focus-medical-bg flex flex-col min-h-screen relative overflow-y-auto ${focusMode ? 'focus-medical-fullscreen' : ''}`}>
      
      {/* Toast thông báo cảnh báo Focus Mode */}
      {focusWarningToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-[#17324D] text-white px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 border border-cyan-400/30 animate-bounce max-w-[90vw] text-center">
          <ShieldAlert size={16} className="text-cyan-400 flex-shrink-0" />
          <span>{focusWarningToast}</span>
        </div>
      )}

      {/* Toast khôi phục phiên thi */}
      {restoredToast && !focusWarningToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-40 bg-[#087F8C] text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 animate-fade-in">
          <Sparkles size={14} />
          <span>{restoredToast}</span>
        </div>
      )}

      {/* ─── HEADER: FOCUS MEDICAL PRO ────────────────────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-md border-b border-[#E2E8F0] px-3 sm:px-6 py-2.5 flex justify-between items-center fixed top-0 w-full z-30 shadow-xs h-14 sm:h-16">
        
        {/* Bên trái: Tên bài thi & Chế độ */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#17324D] text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
            <Target size={18} className="text-[#087F8C]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-times font-bold text-[#17324D] text-xs sm:text-sm leading-tight truncate">
              {test.title}
            </div>
            <div className="text-[10px] sm:text-[11px] font-semibold text-[#087F8C] flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#087F8C] animate-pulse"></span>
              <span>{focusMode ? '🎯 CHẾ ĐỘ TẬP TRUNG Y KHOA' : (test.mode === 'exam' ? 'Thi trắc nghiệm chính thức' : 'Luyện tập y khoa')}</span>
            </div>
          </div>
        </div>

        {/* Ở giữa / Bên phải: Bộ điều khiển, Đếm giờ, Bảng câu hỏi, Chế độ tập trung & Nộp bài */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          
          {/* Nút kích hoạt / thoát Chế độ Tập Trung Focus Medical Pro */}
          {focusMode ? (
            <button
              type="button"
              onClick={handleExitFocusMode}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Thoát chế độ tập trung"
            >
              <Minimize2 size={14} />
              <span className="hidden sm:inline">Thoát tập trung</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowFocusModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#EBF7F8] hover:bg-[#D9F1F3] text-[#087F8C] border border-[#087F8C]/40 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Bật chế độ tập trung toàn màn hình, loại bỏ mọi xao nhãng"
            >
              <Target size={14} className="text-[#087F8C]" />
              <span className="font-bold">Chế độ tập trung</span>
            </button>
          )}

          {/* Đồng hồ mini đếm ngược Chế độ tập trung (khi đang bật Focus Mode) */}
          {focusMode && (
            <div className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#17324D] text-white text-xs font-mono font-bold shadow-xs">
              <Clock size={13} className="text-cyan-300 animate-pulse" />
              <span className="text-cyan-300">
                {focusIsUnlimited ? formatTime(focusUnlimitedElapsed) : formatTime(focusSecondsLeft)}
              </span>
            </div>
          )}

          {/* Đồng hồ thời gian làm bài thi (nếu là bài thi exam) */}
          {test.mode === 'exam' && (
            <div className={`font-mono text-xs sm:text-sm font-bold flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full ${
              timeLeft < 60 ? 'bg-rose-100 text-rose-700 animate-pulse border border-rose-300' : 'bg-slate-100 text-[#17324D] border border-slate-200'
            }`}>
              <Clock size={14} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          )}

          {/* Khung số câu đã làm trên tổng số câu - Bấm để mở Bảng câu hỏi */}
          <button
            type="button"
            onClick={() => setShowPaletteModal(true)}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#F0FAFA] hover:bg-[#E2F6F7] text-[#087F8C] text-xs font-bold border border-[#087F8C]/30 shadow-xs cursor-pointer transition-all active:scale-95"
            title="Xem danh sách bảng câu hỏi"
          >
            <LayoutList size={14} />
            <span>Đã làm: <strong>{Object.keys(answers).length}</strong>/{activeQuestions.length}</span>
            {Object.keys(flaggedQuestions).length > 0 && (
              <span className="bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded-full text-[10px] font-black ml-0.5">
                ★{Object.keys(flaggedQuestions).length}
              </span>
            )}
          </button>

          {/* Nút chuyển đổi View Mode: 1 Câu trung tâm vs Xem danh sách */}
          {!focusMode && (
            <button
              type="button"
              onClick={() => setViewMode(prev => prev === 'single' ? 'list' : 'single')}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all cursor-pointer"
              title={viewMode === 'single' ? 'Chuyển sang xem toàn bộ danh sách' : 'Chuyển sang xem 1 câu hỏi trung tâm'}
            >
              <SlidersHorizontal size={13} />
              <span>{viewMode === 'single' ? '1 Câu' : 'Danh sách'}</span>
            </button>
          )}

          {/* Nút Nộp Bài */}
          <button
            type="button"
            onClick={test.mode === 'exam' ? handleSubmit : handlePracticeSubmit}
            className="px-3.5 sm:px-4 py-1.5 rounded-full bg-[#087F8C] hover:bg-[#066772] text-white font-bold text-xs sm:text-sm shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            Nộp Bài
          </button>
        </div>
      </header>

      {/* ─── NỘI DUNG LÀM BÀI TRẮC NGHIỆM: MỘT CÂU HỎI LÀM TRUNG TÂM ──────────── */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-6 pt-20 sm:pt-24 pb-24 relative z-10 flex flex-col justify-start">
        
        {/* Thanh tiến độ mảnh y khoa */}
        <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden mb-4 sm:mb-6">
          <div
            className="bg-[#087F8C] h-full transition-all duration-200"
            style={{ width: `${((Object.keys(answers).length) / Math.max(1, activeQuestions.length)) * 100}%` }}
          />
        </div>

        {/* TH1: CHẾ ĐỘ MỘT CÂU HỎI LÀM TRUNG TÂM (Default & Focus Mode) */}
        {viewMode === 'single' || focusMode ? (
          <div className="flex flex-col flex-1 justify-between">
            
            {/* Header nhỏ hiển thị vị trí câu hỏi */}
            <div className="flex items-center justify-between mb-3 px-1 text-xs font-bold text-slate-500">
              <span className="font-times text-sm text-[#17324D] font-bold">
                Câu hỏi {currentQuestionIndex + 1} / {activeQuestions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {answers[currentQ?.id] ? '✓ Đã chọn đáp án' : 'Chưa trả lời'}
                </span>
              </div>
            </div>

            {/* Thẻ câu hỏi trung tâm */}
            {renderFocusMedicalQuestionCard(currentQ, currentQuestionIndex, true)}

            {/* Thanh điều hướng Trước / Sau & Công cụ dưới chân thẻ */}
            <div className="mt-4 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-[#17324D] font-bold text-xs sm:text-sm border border-[#E2E8F0] shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft size={16} />
                <span>Câu trước</span>
              </button>

              {/* Nút xem nhanh danh sách câu */}
              <button
                type="button"
                onClick={() => setShowPaletteModal(true)}
                className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-600 font-bold text-xs border border-[#E2E8F0] shadow-xs transition-all active:scale-95 cursor-pointer"
                title="Bảng câu hỏi"
              >
                <span>{currentQuestionIndex + 1}/{activeQuestions.length}</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentQuestionIndex(prev => Math.min(activeQuestions.length - 1, prev + 1))}
                disabled={currentQuestionIndex === activeQuestions.length - 1}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-2xl bg-[#087F8C] hover:bg-[#066772] text-white font-bold text-xs sm:text-sm shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Gợi ý phím tắt trên máy tính */}
            <div className="mt-6 text-center text-slate-400 text-xs hidden sm:block font-times">
              Dùng phím mũi tên <strong>←</strong> / <strong>→</strong> để chuyển câu • Phím <strong>1, 2, 3, 4</strong> hoặc <strong>A, B, C, D</strong> để chọn đáp án
            </div>
          </div>
        ) : (
          /* TH2: CHẾ ĐỘ XEM TOÀN BỘ DANH SÁCH CÂU HỎI */
          <div className="space-y-4">
            {activeQuestions.map((tq: any, i: number) => renderFocusMedicalQuestionCard(tq, i, false))}
          </div>
        )}

        {renderCopyrightBadge('my-6')}
      </main>

      {/* ─── MODAL SETUP CHẾ ĐỘ TẬP TRUNG Y KHOA (FOCUS MODE) ────────────────── */}
      {showFocusModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md p-5 sm:p-6 overflow-hidden animate-pop-in">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF7F8] text-[#087F8C] flex items-center justify-center shadow-xs">
                  <Target size={22} />
                </div>
                <div>
                  <h3 className="font-times font-bold text-base sm:text-lg text-[#17324D] leading-tight">
                    Chế Độ Tập Trung Y Khoa
                  </h3>
                  <p className="text-[11px] text-[#087F8C] font-semibold">
                    Focus Medical Pro • Giảm xao nhãng tối đa
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowFocusModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body: Lựa chọn thời gian tập trung */}
            <div className="py-4 space-y-4">
              <p className="font-times text-xs sm:text-sm text-slate-600 leading-relaxed">
                Khi kích hoạt, hệ thống sẽ mở <strong>toàn màn hình</strong>, khóa đa nhiệm và ẩn toàn bộ thông báo (Zalo, Messenger, chat widget) để bạn tập trung 100% vào bài thi.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#17324D] mb-2 uppercase tracking-wider">
                  Chọn thời gian tập trung:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '15 phút', value: 15 },
                    { label: '20 phút', value: 20 },
                    { label: '25 phút (Pomodoro)', value: 25 },
                    { label: '30 phút', value: 30 },
                    { label: '60 phút', value: 60 },
                    { label: 'Tùy chỉnh', value: 'custom' },
                  ].map(item => (
                    <button
                      key={String(item.value)}
                      type="button"
                      onClick={() => setFocusPreset(item.value as any)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        focusPreset === item.value
                          ? 'bg-[#087F8C] text-white border-[#087F8C] shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                {/* Nút Không giới hạn thời gian (Tự do) */}
                <button
                  type="button"
                  onClick={() => setFocusPreset('unlimited')}
                  className={`mt-2 w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                    focusPreset === 'unlimited'
                      ? 'bg-[#087F8C] text-white border-[#087F8C] shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span>⏱️ Không giới hạn thời gian (Tự do bật/tắt)</span>
                </button>

                {/* Input khi chọn tùy chỉnh */}
                {focusPreset === 'custom' && (
                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-xs text-slate-600 font-bold whitespace-nowrap">Số phút tập trung:</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={customFocusMinutes}
                      onChange={e => setCustomFocusMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-2 py-1 rounded-lg border border-slate-300 text-xs font-bold text-center bg-white"
                    />
                    <span className="text-xs text-slate-500 font-medium">phút</span>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowFocusModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleStartFocusMode}
                className="px-5 py-2.5 rounded-xl bg-[#087F8C] hover:bg-[#066772] text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <Maximize2 size={15} />
                <span>Bắt Đầu Tập Trung Ngay</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── MODAL BẢNG DANH SÁCH CÂU HỎI (PALETTE) ─────────────────────────── */}
      {showPaletteModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setShowPaletteModal(false)}
        >
          <div
            className="w-full max-h-[85vh] sm:max-h-[80vh] sm:max-w-xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Header Modal Palette */}
            <div className="px-4 py-3.5 sm:px-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#EBF7F8] text-[#087F8C] flex items-center justify-center">
                  <LayoutList size={18} />
                </div>
                <div>
                  <h3 className="font-times font-bold text-[#17324D] text-sm sm:text-base leading-tight">
                    Danh Sách Câu Hỏi
                  </h3>
                  <p className="text-[11px] text-slate-500">Chạm câu hỏi để nhảy nhanh tới câu đó</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaletteModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chú giải trạng thái câu hỏi */}
            <div className="grid grid-cols-3 gap-2 px-3 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#0E6245] bg-[#E7F5EE] px-2 py-1.5 rounded-xl border border-[#087F8C]/30">
                <span className="w-2.5 h-2.5 rounded-full bg-[#087F8C] flex-shrink-0"></span>
                <span>Đã làm: <strong>{Object.keys(answers).length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-rose-800 bg-rose-50 px-2 py-1.5 rounded-xl border border-rose-200">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0"></span>
                <span>Chưa làm: <strong>{activeQuestions.length - Object.keys(answers).length}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-amber-900 bg-amber-50 px-2 py-1.5 rounded-xl border border-amber-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                <span>Lưu ý: <strong>{Object.keys(flaggedQuestions).length}</strong></span>
              </div>
            </div>

            {/* Grid danh sách câu hỏi */}
            <div className="p-3 sm:p-5 overflow-y-auto flex-1 max-h-[55vh]">
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {activeQuestions.map((tq: any, idx: number) => {
                  const q = tq.question || tq
                  const isAns = !!answers[q.id]
                  const isFlg = !!flaggedQuestions[q.id]
                  const isCur = currentQuestionIndex === idx

                  let btnClass = 'bg-rose-500 text-white'
                  if (isFlg) {
                    btnClass = 'bg-amber-400 text-amber-950 font-black ring-2 ring-amber-300'
                  } else if (isAns) {
                    btnClass = 'bg-[#087F8C] text-white font-bold'
                  }

                  return (
                    <button
                      key={q.id || idx}
                      type="button"
                      onClick={() => {
                        setCurrentQuestionIndex(idx)
                        setShowPaletteModal(false)
                        if (viewMode === 'list') {
                          const el = document.getElementById(`test-question-card-${idx}`)
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        }
                      }}
                      className={`h-10 sm:h-11 rounded-xl flex items-center justify-center text-xs sm:text-sm transition-all duration-150 cursor-pointer active:scale-95 ${btnClass} ${
                        isCur ? 'ring-3 ring-[#17324D]' : ''
                      }`}
                    >
                      <span>{idx + 1}</span>
                      {isFlg && <span className="ml-0.5 text-[9px]">★</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Tổng: <strong className="text-[#17324D]">{activeQuestions.length} câu</strong>
              </span>
              <button
                type="button"
                onClick={() => setShowPaletteModal(false)}
                className="px-4 py-1.5 rounded-full bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 cursor-pointer"
              >
                Đóng
              </button>
            </div>

          </div>
        </div>
      )}

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
      {renderMistakeModals()}
    </div>
  )
}
