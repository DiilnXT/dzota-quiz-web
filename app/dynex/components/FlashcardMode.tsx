'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Eye, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  ZoomIn, 
  ZoomOut, 
  Lock, 
  LogIn, 
  Brain, 
  Key, 
  Sparkles, 
  Flame, 
  Check, 
  ArrowRight, 
  RefreshCw,
  Trophy,
  Volume2,
  VolumeX,
  Shuffle
} from 'lucide-react'
import { soundService } from '../services/soundService'
import { ankiService } from '../services/ankiService'
import { authService, DynexUser } from '../services/authService'
import { Lesson, ImageItem, Mask } from '../services/storageService'

interface FlashcardModeProps {
  projects: any[]
  defaultLessonId?: string
  currentUser?: DynexUser | null
  onOpenShare?: (lesson: any) => void
  onOpenLogin?: () => void
}

function normalizeText(str: string) {
  if (!str) return ''
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function FlashcardMode({
  projects,
  defaultLessonId,
  currentUser,
  onOpenShare,
  onOpenLogin
}: FlashcardModeProps) {
  // Collect all lessons with images
  const allLessons: any[] = useMemo(() => {
    const list: any[] = []
    projects.forEach(p => {
      p.categories?.forEach((cat: any) => {
        cat.subFolders?.forEach((sub: any) => {
          sub.lessons?.forEach((les: any) => {
            if (les.images && les.images.length > 0) {
              list.push({
                ...les,
                projectName: p.name,
                categoryName: cat.name,
                subFolderName: sub.name
              })
            }
          })
        })
      })
    })
    return list
  }, [projects])

  const [selectedLessonId, setSelectedLessonId] = useState<string>(
    defaultLessonId || allLessons[0]?.id || ''
  )
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Current lesson & image
  const currentLesson = allLessons.find(l => l.id === selectedLessonId) || allLessons[0]
  const currentImage: ImageItem | undefined =
    currentLesson?.images?.[currentImageIndex] || currentLesson?.images?.[0]
  const masks: Mask[] = currentImage?.masks || []

  // Check access permission
  const [isPinUnlocked, setIsPinUnlocked] = useState(false)
  const [inputPin, setInputPin] = useState('')
  const [pinError, setPinError] = useState('')

  const accessCheck = authService.checkAccess(currentLesson, currentUser)
  const isAccessible = accessCheck.allowed || isPinUnlocked

  // Study Modes:
  // 'anki': Spaced Repetition não bộ (Again lặp lại sau, Hard, Good, Easy)
  // 'quiz': Trắc nghiệm 4 đáp án nhanh
  // 'type': Tự gõ tên cấu trúc (Active Recall)
  // 'overview': Khám phá toàn cảnh (click mở từng ô)
  const [studyMode, setStudyMode] = useState<'anki' | 'quiz' | 'type' | 'overview'>('anki')

  // Zoom
  const [zoomLevel, setZoomLevel] = useState(1.0)

  // ─── ANKI BRAIN SPACED REPETITION ENGINE (DYNAMIC QUEUE) ───
  // studyQueue contains array of mask indices to be reviewed
  const [studyQueue, setStudyQueue] = useState<number[]>([])
  const [graduatedIndices, setGraduatedIndices] = useState<Set<number>>(new Set())
  const [learningIndices, setLearningIndices] = useState<Set<number>>(new Set())
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [sessionCompleted, setSessionCompleted] = useState(false)
  const [totalReviewsCount, setTotalReviewsCount] = useState(0)

  // Type-in state
  const [typeAnswerInput, setTypeAnswerInput] = useState('')
  const [typeAnswerResult, setTypeAnswerResult] = useState<'correct' | 'wrong' | null>(null)

  // Quiz state
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null)
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null)

  // Overview mode revealed masks
  const [revealedOverviewMasks, setRevealedOverviewMasks] = useState<Set<string>>(new Set())

  // Current active mask index being tested
  const activeMaskIndex = studyQueue.length > 0 ? studyQueue[0] : 0
  const activeMask: Mask | undefined = masks[activeMaskIndex]

  // Initialize or reset study queue when lesson, image or mode changes
  const initStudySession = () => {
    if (masks.length > 0) {
      const initialQueue = Array.from({ length: masks.length }, (_, i) => i)
      setStudyQueue(initialQueue)
    } else {
      setStudyQueue([])
    }
    setGraduatedIndices(new Set())
    setLearningIndices(new Set())
    setIsFlipped(false)
    setShowHint(false)
    setSessionCompleted(false)
    setTotalReviewsCount(0)
    setTypeAnswerInput('')
    setTypeAnswerResult(null)
    setSelectedQuizOption(null)
    setQuizResult(null)
    setRevealedOverviewMasks(new Set())
  }

  useEffect(() => {
    initStudySession()
  }, [selectedLessonId, currentImageIndex, masks.length])

  // Generate quiz options when active mask changes
  useEffect(() => {
    if (!activeMask || masks.length === 0) return
    const correctLabel = activeMask.label || 'Chưa đặt tên'
    const otherLabels = masks
      .map(m => m.label)
      .filter(l => l && l !== correctLabel)
    const shuffledOthers = [...new Set(otherLabels)].sort(() => 0.5 - Math.random())
    const distractors = shuffledOthers.slice(0, 3)
    const combined = [correctLabel, ...distractors].sort(() => 0.5 - Math.random())
    setQuizOptions(combined)
    setSelectedQuizOption(null)
    setQuizResult(null)
  }, [activeMaskIndex, activeMask, masks])

  // ─── ANKI RATING HANDLER (BRAIN REPETITION) ───
  const handleAnkiRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeMask || studyQueue.length === 0) return

    // Record review to persistent anki service
    ankiService.submitReview(activeMask.id, rating)
    setTotalReviewsCount(prev => prev + 1)

    const currentIdx = studyQueue[0]
    const remainingQueue = studyQueue.slice(1)

    if (rating === 'again') {
      // BẮT BUỘC HỌC LẠI: Thẻ chưa thuộc, đẩy lại vào hàng đợi hôm nay!
      soundService.playWarning()
      setLearningIndices(prev => new Set(prev).add(currentIdx))

      // Nếu hàng đợi còn nhiều hơn 3 thẻ, chèn sau 3 thẻ để não bộ kịp quên rồi nhắc lại
      let newQueue: number[]
      if (remainingQueue.length >= 3) {
        newQueue = [
          ...remainingQueue.slice(0, 3),
          currentIdx,
          ...remainingQueue.slice(3)
        ]
      } else {
        newQueue = [...remainingQueue, currentIdx]
      }
      setStudyQueue(newQueue)
      setIsFlipped(false)
      setShowHint(false)

    } else if (rating === 'hard') {
      soundService.playStationChime()
      setLearningIndices(prev => new Set(prev).add(currentIdx))

      // Khó: Đẩy về sau 5 thẻ hoặc cuối hàng đợi
      let newQueue: number[]
      if (remainingQueue.length >= 5) {
        newQueue = [
          ...remainingQueue.slice(0, 5),
          currentIdx,
          ...remainingQueue.slice(5)
        ]
      } else {
        newQueue = [...remainingQueue, currentIdx]
      }
      setStudyQueue(newQueue)
      setIsFlipped(false)
      setShowHint(false)

    } else {
      // 'good' hoặc 'easy': ĐÃ THUỘC THÀNH CÔNG!
      if (rating === 'easy') {
        soundService.playSuccess()
      } else {
        soundService.playStationChime()
      }

      setGraduatedIndices(prev => new Set(prev).add(currentIdx))
      setStudyQueue(remainingQueue)
      setIsFlipped(false)
      setShowHint(false)

      // Kiểm tra nếu hàng đợi trống -> HOÀN THÀNH TOÀN BỘ BUỔI HỌC
      if (remainingQueue.length === 0) {
        setSessionCompleted(true)
        soundService.playSuccess()
      }
    }
  }

  // Quiz Option Click
  const handleSelectQuizOption = (opt: string) => {
    if (quizResult || !activeMask) return
    setSelectedQuizOption(opt)

    const isCorrect = opt === activeMask.label
    if (isCorrect) {
      setQuizResult('correct')
      soundService.playSuccess()
      ankiService.submitReview(activeMask.id, 'good')
      setTimeout(() => {
        handleAnkiRating('good')
      }, 900)
    } else {
      setQuizResult('wrong')
      soundService.playWarning()
      ankiService.submitReview(activeMask.id, 'again')
      setTimeout(() => {
        handleAnkiRating('again')
      }, 1400)
    }
  }

  // Type answer submit
  const handleCheckTypeAnswer = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeMask || !typeAnswerInput.trim()) return

    const userNorm = normalizeText(typeAnswerInput)
    const officialNorm = normalizeText(activeMask.label)

    let isMatch = userNorm === officialNorm
    if (!isMatch && activeMask.synonyms) {
      for (const syn of activeMask.synonyms) {
        if (userNorm === normalizeText(syn)) {
          isMatch = true
          break
        }
      }
    }

    if (isMatch) {
      setTypeAnswerResult('correct')
      soundService.playSuccess()
      ankiService.submitReview(activeMask.id, 'good')
      setTimeout(() => {
        handleAnkiRating('good')
        setTypeAnswerInput('')
        setTypeAnswerResult(null)
      }, 1000)
    } else {
      setTypeAnswerResult('wrong')
      soundService.playWarning()
      ankiService.submitReview(activeMask.id, 'again')
      setTimeout(() => {
        handleAnkiRating('again')
        setTypeAnswerInput('')
        setTypeAnswerResult(null)
      }, 1500)
    }
  }

  // Unlock with PIN
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault()
    const success = authService.unlockWithPin(
      currentLesson.id,
      inputPin,
      currentLesson.accessPassword
    )
    if (success) {
      setIsPinUnlocked(true)
      soundService.playSuccess()
      setPinError('')
    } else {
      setPinError('Mã PIN không chính xác! Hãy kiểm tra lại mã PIN lớp học của bạn.')
      soundService.playWarning()
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return
      }

      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        if (studyMode === 'anki') {
          if (!isFlipped) {
            setIsFlipped(true)
            soundService.playTick()
          }
        }
      } else if (studyMode === 'anki' && isFlipped) {
        if (e.key === '1') handleAnkiRating('again')
        else if (e.key === '2') handleAnkiRating('hard')
        else if (e.key === '3') handleAnkiRating('good')
        else if (e.key === '4') handleAnkiRating('easy')
      } else if (studyMode === 'quiz' && !quizResult) {
        if (['1', 'a', 'A'].includes(e.key) && quizOptions[0]) handleSelectQuizOption(quizOptions[0])
        else if (['2', 'b', 'B'].includes(e.key) && quizOptions[1]) handleSelectQuizOption(quizOptions[1])
        else if (['3', 'c', 'C'].includes(e.key) && quizOptions[2]) handleSelectQuizOption(quizOptions[2])
        else if (['4', 'd', 'D'].includes(e.key) && quizOptions[3]) handleSelectQuizOption(quizOptions[3])
      }

      if (e.key === 'h' || e.key === 'H') {
        setShowHint(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [studyMode, isFlipped, studyQueue, quizOptions, quizResult, activeMask])

  if (!currentLesson || !currentImage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#111827] border border-slate-800 rounded-3xl">
        <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Chưa có bài học nào chứa hình ảnh</h3>
        <p className="text-xs text-slate-400">
          Vui lòng chuyển sang tab <strong>Studio Soạn Đề</strong> để tạo bài học và thêm sơ đồ giải phẫu.
        </p>
      </div>
    )
  }

  // ─── ACCESS CONTROL LOCK SCREEN ───
  if (!isAccessible) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-3xl bg-[#111827] border border-rose-500/40 shadow-2xl text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <div>
          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-rose-950 text-rose-400 border border-rose-800 tracking-wider">
            Bảo Mật & Bản Quyền Y Khoa
          </span>
          <h3 className="text-xl font-black text-white mt-2">Mô-đun Yêu Cầu Cấp Quyền Học Tập</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed mt-1">
            {accessCheck.message || 'Mô-đun này yêu cầu tài khoản học viên trong Lớp học được cấp phép hoặc mở bằng mã PIN lớp.'}
          </p>
        </div>

        {/* User status */}
        <div className="p-3.5 bg-[#0B0F19] rounded-2xl border border-slate-800 text-xs text-slate-400 max-w-md mx-auto">
          {currentUser?.isLoggedIn ? (
            <div>
              Gmail đang đăng nhập: <strong className="text-indigo-400 font-mono">{currentUser.email}</strong>
              <div className="text-[11px] text-slate-500 mt-1">
                (Gmail này chưa nằm trong danh sách Lớp học được gán bài học này)
              </div>
            </div>
          ) : (
            <div>Bạn chưa đăng nhập tài khoản Google.</div>
          )}
        </div>

        {/* PIN Unlock Form */}
        <form onSubmit={handleUnlockWithPin} className="max-w-xs mx-auto space-y-2">
          <div className="relative">
            <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputPin}
              onChange={e => {
                setInputPin(e.target.value)
                setPinError('')
              }}
              placeholder="Nhập mã PIN lớp học..."
              className="w-full pl-9 pr-3 py-2 bg-[#070b14] border border-amber-500/40 rounded-xl text-xs font-mono font-bold text-amber-300 uppercase focus:outline-none focus:border-amber-400"
            />
          </div>
          {pinError && <p className="text-[11px] text-rose-400 font-bold">{pinError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
          >
            Mở Khóa Bằng Mã PIN Lớp
          </button>
        </form>

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập Gmail Học Viên Khác</span>
          </button>
        </div>
      </div>
    )
  }

  // ─── SESSION COMPLETED CELEBRATION SCREEN ───
  if (sessionCompleted) {
    return (
      <div className="max-w-2xl mx-auto my-8 p-8 rounded-3xl bg-gradient-to-b from-[#111827] to-[#070b14] border border-emerald-500/50 shadow-2xl text-center space-y-6 animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-emerald-950/80 border border-emerald-500/60 flex items-center justify-center text-emerald-400 mx-auto shadow-2xl">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            Trí Nhớ Dài Hạn Anki SM-2
          </span>
          <h2 className="text-2xl font-black text-white">
            🎉 Tuyệt Vời! Đã Thuộc 100% Cấu Trúc Giải Phẫu!
          </h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            Bạn đã nạp thành công toàn bộ <strong>{masks.length}</strong> vị trí giải phẫu của sơ đồ này vào trí nhớ dài hạn.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng số thẻ</span>
            <span className="text-xl font-mono font-black text-cyan-300">{masks.length}</span>
          </div>
          <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Lượt ôn luyện</span>
            <span className="text-xl font-mono font-black text-indigo-400">{totalReviewsCount}</span>
          </div>
          <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tỷ lệ nhớ</span>
            <span className="text-xl font-mono font-black text-emerald-400">100%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={initStudySession}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Học Lại Sơ Đồ Này</span>
          </button>
        </div>
      </div>
    )
  }

  // ─── ACTIVE STUDY SCREEN ───
  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      
      {/* ─── 1. TOP CONTROL BAR ─── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#111827] border border-slate-800 p-3 sm:p-4 rounded-3xl shadow-lg">
        {/* Lesson Selector */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="p-2 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <Brain className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {currentLesson.categoryName} • {currentLesson.subFolderName}
            </div>
            <select
              value={selectedLessonId}
              onChange={e => {
                setSelectedLessonId(e.target.value)
                setCurrentImageIndex(0)
              }}
              className="w-full bg-transparent text-sm sm:text-base font-black text-white focus:outline-none cursor-pointer truncate"
            >
              {allLessons.map(l => (
                <option key={l.id} value={l.id} className="bg-[#111827] text-white">
                  {l.title} ({l.images?.reduce((sum: number, img: any) => sum + (img.masks?.length || 0), 0)} vị trí)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-2xl border border-slate-800 shrink-0 overflow-x-auto">
          <button
            onClick={() => setStudyMode('anki')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'anki'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🧠 Não Bộ Anki (SM-2)
          </button>
          <button
            onClick={() => setStudyMode('quiz')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'quiz'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🎯 Trắc Nghiệm 4 Đáp Án
          </button>
          <button
            onClick={() => setStudyMode('type')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'type'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ✍️ Gõ Đáp Án
          </button>
          <button
            onClick={() => setStudyMode('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'overview'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔍 Toàn Cảnh
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-[#070b14] px-2 py-1 rounded-2xl border border-slate-800 shrink-0 self-end lg:self-center">
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
            className="p-1 text-slate-400 hover:text-white"
            title="Thu nhỏ"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono text-slate-300 min-w-[36px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))))}
            className="p-1 text-slate-400 hover:text-white"
            title="Phóng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ─── 2. PROGRESS BAR & ANKI METRICS (BRAIN RETENTION) ─── */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
            <Brain className="w-4 h-4" />
            Hàng Đợi Ôn Tập: {studyQueue.length} Thẻ
          </span>
          <div className="w-28 sm:w-40 bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (graduatedIndices.size / Math.max(1, masks.length)) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-3 text-xs font-mono font-bold">
          <span className="text-amber-400">⏳ Cần lặp lại: {studyQueue.length}</span>
          <span className="text-rose-400">🔁 Đang học lại: {learningIndices.size}</span>
          <span className="text-emerald-400">✅ Đã thuộc: {graduatedIndices.size} / {masks.length}</span>
        </div>
      </div>

      {/* ─── 3. ANATOMY CANVAS (100% SOLID ZERO-LEAK COVERS) ─── */}
      <div className="bg-[#070b14] border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden select-none">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="relative inline-block border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black transition-transform duration-150"
        >
          <img
            src={currentImage.url}
            alt={currentImage.title}
            className="max-h-[50vh] sm:max-h-[55vh] w-auto object-contain block pointer-events-none"
          />

          {/* ─── RENDER MASKS (100% SOLID ZERO LEAK) ─── */}
          {masks.map((mask, idx) => {
            const isCurrentlyActive = idx === activeMaskIndex
            const isRevealedInOverview = revealedOverviewMasks.has(mask.id)

            // When to show revealed label
            const showRevealed =
              studyMode === 'overview'
                ? isRevealedInOverview
                : isCurrentlyActive &&
                  (isFlipped ||
                    (studyMode === 'quiz' && quizResult !== null) ||
                    (studyMode === 'type' && typeAnswerResult !== null))

            // 1. ACTIVE MASK (Being Tested)
            if (isCurrentlyActive && studyMode !== 'overview') {
              return (
                <div
                  key={mask.id}
                  style={{
                    left: `${mask.x}%`,
                    top: `${mask.y}%`,
                    width: `${mask.width}%`,
                    height: `${mask.height}%`
                  }}
                  className="absolute z-30 transition-all pointer-events-none"
                >
                  <div
                    style={{
                      backgroundColor: showRevealed ? '#064e3b' : '#070b14',
                      borderColor: showRevealed ? '#10b981' : '#f59e0b',
                      opacity: 1.0
                    }}
                    className={`w-full h-full rounded-md border-2 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.85)] relative overflow-hidden transition-colors ${
                      !showRevealed ? 'animate-pulse' : ''
                    }`}
                  >
                    {showRevealed ? (
                      <div className="px-2 py-0.5 text-center truncate">
                        <span className="text-[11px] sm:text-xs font-black text-emerald-200 block truncate">
                          {mask.label}
                        </span>
                      </div>
                    ) : (
                      <div className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-lg font-mono">
                        <span>?</span>
                        <span className="text-[9px]">#{idx + 1}</span>
                      </div>
                    )}
                  </div>

                  {/* Bouncing Direction Pointer when card is face down */}
                  {!showRevealed && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40">
                      <div className="w-4 h-4 bg-amber-400 rotate-45 border-2 border-black shadow-[0_0_15px_#f59e0b] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            // 2. OVERVIEW MODE: Clickable to toggle reveal
            if (studyMode === 'overview') {
              return (
                <div
                  key={mask.id}
                  onClick={() => {
                    setRevealedOverviewMasks(prev => {
                      const next = new Set(prev)
                      if (next.has(mask.id)) next.delete(mask.id)
                      else next.add(mask.id)
                      return next
                    })
                    soundService.playTick()
                  }}
                  style={{
                    left: `${mask.x}%`,
                    top: `${mask.y}%`,
                    width: `${mask.width}%`,
                    height: `${mask.height}%`,
                    backgroundColor: isRevealedInOverview ? '#064e3b' : '#070b14',
                    borderColor: isRevealedInOverview ? '#10b981' : '#475569',
                    opacity: 1.0
                  }}
                  className="absolute z-20 rounded-md border flex items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-md"
                >
                  {isRevealedInOverview ? (
                    <span className="text-[10px] font-black text-emerald-200 px-1 truncate">
                      {mask.label}
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 font-bold">
                      #{idx + 1}
                    </span>
                  )}
                </div>
              )
            }

            // 3. OTHER MASKS: 100% Solid opaque dark cover so answers never leak
            return (
              <div
                key={mask.id}
                style={{
                  left: `${mask.x}%`,
                  top: `${mask.y}%`,
                  width: `${mask.width}%`,
                  height: `${mask.height}%`,
                  backgroundColor: '#070b14',
                  opacity: 1.0
                }}
                className="absolute z-10 rounded-md border border-slate-800 flex items-center justify-center pointer-events-none"
              >
                <span className="text-[9px] text-slate-600 font-mono">#{idx + 1}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ─── 4. INTERACTION PANELS (BY STUDY MODE) ─── */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
        
        {/* 4A. ANKI SM-2 BRAIN REPETITION MODE */}
        {studyMode === 'anki' && (
          <div>
            {!isFlipped ? (
              // FRONT OF CARD: Question + Prompt to flip
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-base font-black text-white flex items-center gap-2">
                    <span>Vị trí cấu trúc giải phẫu</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                      #{activeMaskIndex + 1}
                    </span>
                    <span>là gì?</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Hãy nhớ lại tên gọi trong đầu hoặc mở gợi ý lâm sàng trước khi lật đáp án.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  {activeMask?.hint && (
                    <button
                      onClick={() => setShowHint(!showHint)}
                      className="px-3.5 py-2.5 rounded-2xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <HelpCircle className="w-4 h-4 text-cyan-400" />
                      <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý lâm sàng (H)'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsFlipped(true)
                      soundService.playTick()
                    }}
                    className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>LẬT MẶT SAU (Phím Space)</span>
                  </button>
                </div>
              </div>
            ) : (
              // BACK OF CARD: Answer Revealed + 4 Anki Evaluation Buttons
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-2xl bg-[#0B0F19] border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
                  <div>
                    <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                      Đáp Án Giải Phẫu Chính Thức (#{activeMaskIndex + 1})
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">
                      {activeMask?.label || 'Chưa đặt tên'}
                    </h3>
                    {activeMask?.synonyms && activeMask.synonyms.length > 0 && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Tên gọi khác / Latinh:{' '}
                        <strong className="text-slate-200">{activeMask.synonyms.join(', ')}</strong>
                      </p>
                    )}
                  </div>

                  {activeMask?.hint && (
                    <div className="text-xs text-cyan-300/90 bg-cyan-950/40 border border-cyan-800/60 px-3 py-2 rounded-xl max-w-md">
                      💡 <strong>Gợi ý lâm sàng:</strong> {activeMask.hint}
                    </div>
                  )}
                </div>

                {/* 4 Anki Brain Rating Buttons */}
                <div>
                  <div className="text-center text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wider">
                    Đánh Giá Khả Năng Ghi Nhớ Của Não Bộ (Phím 1, 2, 3, 4):
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Again Button */}
                    <button
                      onClick={() => handleAnkiRating('again')}
                      className="p-3 rounded-2xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/50 text-rose-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span className="w-5 h-5 rounded-md bg-rose-900 border border-rose-600 flex items-center justify-center text-[10px]">
                          1
                        </span>
                        <span>HỌC LẠI</span>
                      </div>
                      <span className="text-[11px] text-rose-400/80 font-mono">Lặp lại sau 3 thẻ</span>
                    </button>

                    {/* Hard Button */}
                    <button
                      onClick={() => handleAnkiRating('hard')}
                      className="p-3 rounded-2xl bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/50 text-amber-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span className="w-5 h-5 rounded-md bg-amber-900 border border-amber-600 flex items-center justify-center text-[10px]">
                          2
                        </span>
                        <span>KHÓ</span>
                      </div>
                      <span className="text-[11px] text-amber-400/80 font-mono">10 phút</span>
                    </button>

                    {/* Good Button */}
                    <button
                      onClick={() => handleAnkiRating('good')}
                      className="p-3 rounded-2xl bg-sky-950/40 hover:bg-sky-900/60 border border-sky-500/50 text-sky-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span className="w-5 h-5 rounded-md bg-sky-900 border border-sky-600 flex items-center justify-center text-[10px]">
                          3
                        </span>
                        <span>TỐT</span>
                      </div>
                      <span className="text-[11px] text-sky-400/80 font-mono">1 ngày (Thuộc)</span>
                    </button>

                    {/* Easy Button */}
                    <button
                      onClick={() => handleAnkiRating('easy')}
                      className="p-3 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-300 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md"
                    >
                      <div className="flex items-center gap-1.5 font-black text-sm">
                        <span className="w-5 h-5 rounded-md bg-emerald-900 border border-emerald-600 flex items-center justify-center text-[10px]">
                          4
                        </span>
                        <span>DỄ</span>
                      </div>
                      <span className="text-[11px] text-emerald-400/80 font-mono">4 ngày (Thuộc ngay)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4B. MULTIPLE CHOICE QUIZ MODE */}
        {studyMode === 'quiz' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Chọn tên đúng cho vị trí</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                #{activeMaskIndex + 1}
              </span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {quizOptions.map((opt, oIdx) => {
                const keyLetter = ['A', 'B', 'C', 'D'][oIdx]
                const isSelected = selectedQuizOption === opt
                const isCorrect = opt === activeMask?.label

                let btnStyle = 'bg-[#0B0F19] border-slate-700 text-slate-200 hover:border-indigo-500'
                if (quizResult !== null) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                  } else if (isSelected) {
                    btnStyle = 'bg-rose-950/70 border-rose-500 text-rose-200'
                  }
                }

                return (
                  <button
                    key={opt}
                    onClick={() => handleSelectQuizOption(opt)}
                    disabled={quizResult !== null}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${btnStyle}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {keyLetter}
                    </span>
                    <span className="text-xs sm:text-sm font-bold truncate">{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 4C. TYPE ANSWER MODE */}
        {studyMode === 'type' && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Gõ tên chi tiết giải phẫu cho vị trí</span>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                #{activeMaskIndex + 1}
              </span>
            </h4>

            <form onSubmit={handleCheckTypeAnswer} className="flex gap-2">
              <input
                type="text"
                value={typeAnswerInput}
                onChange={e => setTypeAnswerInput(e.target.value)}
                placeholder="Nhập tên tiếng Việt hoặc tên Latinh..."
                className="flex-1 px-4 py-2.5 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!typeAnswerInput.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs cursor-pointer"
              >
                Kiểm Tra
              </button>
            </form>

            {typeAnswerResult && (
              <div
                className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  typeAnswerResult === 'correct'
                    ? 'bg-emerald-950/60 border border-emerald-500 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500 text-rose-300'
                }`}
              >
                {typeAnswerResult === 'correct' ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Chính xác! Cấu trúc: {activeMask?.label}</span>
                  </>
                ) : (
                  <>
                    <span className="text-rose-400">✕</span>
                    <span>Chưa đúng! Đáp án chính xác là: {activeMask?.label}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4D. OVERVIEW MODE GUIDE */}
        {studyMode === 'overview' && (
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>
              💡 Chế độ Toàn Cảnh: Bấm trực tiếp vào từng ô số trên sơ đồ để mở xem nhãn giải phẫu hoặc che lại.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setRevealedOverviewMasks(new Set(masks.map(m => m.id)))}
                className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
              >
                Mở tất cả ({masks.length})
              </button>
              <span>•</span>
              <button
                onClick={() => setRevealedOverviewMasks(new Set())}
                className="text-slate-400 hover:text-slate-300 font-bold cursor-pointer"
              >
                Che tất cả
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  )
}
