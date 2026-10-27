'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Eye, 
  EyeOff, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  HelpCircle, 
  BookOpen, 
  ZoomIn, 
  ZoomOut,
  Layers,
  Flame,
  Award,
  Check,
  Clock,
  Lock,
  LogIn,
  Share2,
  Brain,
  Key,
  Volume2,
  VolumeX,
  ListFilter,
  CheckSquare,
  Edit3,
  Shuffle
} from 'lucide-react'
import { soundService } from '../services/soundService'
import { ankiService } from '../services/ankiService'
import { authService } from '../services/authService'

interface FlashcardModeProps {
  projects: any[]
  defaultLessonId?: string
  currentUser?: any
  onOpenShare?: (lesson: any) => void
  onOpenLogin?: () => void
}

/**
 * Text normalization for Active Recall matching
 */
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
  // Extract all lessons across projects
  const allLessons: any[] = []
  projects.forEach(p => {
    p.categories?.forEach((cat: any) => {
      cat.subFolders?.forEach((sub: any) => {
        sub.lessons?.forEach((les: any) => {
          if (les.images && les.images.length > 0) {
            allLessons.push({
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

  const [selectedLessonId, setSelectedLessonId] = useState(
    defaultLessonId || allLessons[0]?.id || ''
  )
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // 4 Study Modes:
  // 'anki': Anki SM-2 Spaced Repetition (Lật thẻ 3D + 4 nút đánh giá thời gian)
  // 'quiz': Multiple Choice (Trắc nghiệm 4 đáp án nhanh)
  // 'type': Active Recall (Tự gõ đáp án và chấm tự động)
  // 'overview': Khám phá sơ đồ toàn cảnh (Click để mở từng ô)
  const [studyMode, setStudyMode] = useState<'anki' | 'quiz' | 'type' | 'overview'>('anki')

  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Type-in answer mode state
  const [typeAnswerInput, setTypeAnswerInput] = useState('')
  const [typeAnswerResult, setTypeAnswerResult] = useState<'correct' | 'wrong' | null>(null)

  // Multiple-choice mode state
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [selectedQuizOption, setSelectedQuizOption] = useState<string | null>(null)
  const [quizResult, setQuizResult] = useState<'correct' | 'wrong' | null>(null)

  // PIN Unlock modal inside page
  const [inputPin, setInputPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [isPinUnlocked, setIsPinUnlocked] = useState(false)

  // Overview mode states
  const [revealedMaskIds, setRevealedMaskIds] = useState<Set<string>>(new Set())

  // Streak & study session stats
  const [cardsReviewedSession, setCardsReviewedSession] = useState(0)

  const currentLesson = allLessons.find(l => l.id === selectedLessonId) || allLessons[0]
  const currentImage = currentLesson?.images?.[currentImageIndex] || currentLesson?.images?.[0]
  const masks: any[] = currentImage?.masks || []

  // Check access permission
  const accessCheck = authService.checkAccess(currentLesson, currentUser)
  const isAccessible = accessCheck.allowed || isPinUnlocked

  // Deck stats from Anki engine
  const deckStats = ankiService.getDeckStats(masks)

  // Target mask for active card
  const activeMask = masks[currentCardIndex] || masks[0]

  // Reset when lesson or image changes
  useEffect(() => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setShowHint(false)
    setTypeAnswerInput('')
    setTypeAnswerResult(null)
    setSelectedQuizOption(null)
    setQuizResult(null)
    setRevealedMaskIds(new Set())
  }, [selectedLessonId, currentImageIndex])

  // Generate 4 multiple-choice options when activeMask or currentCardIndex changes
  useEffect(() => {
    if (!activeMask || masks.length === 0) return
    const correctLabel = activeMask.label || 'Chưa đặt tên'
    
    // Pick other labels as distractors
    const otherLabels = masks
      .map(m => m.label)
      .filter(l => l && l !== correctLabel)

    // Shuffle other labels
    const shuffledOthers = [...new Set(otherLabels)].sort(() => 0.5 - Math.random())
    const distractors = shuffledOthers.slice(0, 3)

    // Fallback generic anatomy terms if diagram has fewer than 4 masks
    const fallbackTerms = ['Ống gan chung', 'Động mạch chủ bụng', 'Tĩnh mạch cửa', 'Mạc nối nhỏ', 'Dây chằng liềm']
    while (distractors.length < 3) {
      const term = fallbackTerms[distractors.length]
      if (!distractors.includes(term) && term !== correctLabel) {
        distractors.push(term)
      }
    }

    const allOpts = [correctLabel, ...distractors].sort(() => 0.5 - Math.random())
    setQuizOptions(allOpts)
    setSelectedQuizOption(null)
    setQuizResult(null)
  }, [currentCardIndex, activeMask, masks])

  // Keyboard shortcuts
  useEffect(() => {
    if (!isAccessible) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return

      if (studyMode === 'anki') {
        if (e.code === 'Space') {
          e.preventDefault()
          setIsFlipped(prev => !prev)
          soundService.playTick()
        } else if (isFlipped) {
          if (e.key === '1') handleAnkiRating('again')
          else if (e.key === '2') handleAnkiRating('hard')
          else if (e.key === '3') handleAnkiRating('good')
          else if (e.key === '4') handleAnkiRating('easy')
        }
      } else if (studyMode === 'quiz' && !quizResult) {
        if (['1', 'a', 'A'].includes(e.key) && quizOptions[0]) handleSelectQuizOption(quizOptions[0])
        else if (['2', 'b', 'B'].includes(e.key) && quizOptions[1]) handleSelectQuizOption(quizOptions[1])
        else if (['3', 'c', 'C'].includes(e.key) && quizOptions[2]) handleSelectQuizOption(quizOptions[2])
        else if (['4', 'd', 'D'].includes(e.key) && quizOptions[3]) handleSelectQuizOption(quizOptions[3])
      }

      if (e.key === 'ArrowRight') {
        handleNextCard()
      } else if (e.key === 'ArrowLeft') {
        handlePrevCard()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [studyMode, isFlipped, currentCardIndex, masks, isAccessible, quizOptions, quizResult])

  // Advance card
  const handleNextCard = () => {
    if (currentCardIndex < masks.length - 1) {
      setCurrentCardIndex(prev => prev + 1)
      setIsFlipped(false)
      setShowHint(false)
      setTypeAnswerInput('')
      setTypeAnswerResult(null)
      setSelectedQuizOption(null)
      setQuizResult(null)
    } else {
      soundService.playSuccess()
      alert('🎉 Chúc mừng! Bạn đã hoàn thành toàn bộ danh sách thẻ của sơ đồ này!')
      setCurrentCardIndex(0)
      setIsFlipped(false)
    }
  }

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1)
      setIsFlipped(false)
      setShowHint(false)
      setTypeAnswerInput('')
      setTypeAnswerResult(null)
      setSelectedQuizOption(null)
      setQuizResult(null)
    }
  }

  // Handle Anki Rating
  const handleAnkiRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!activeMask) return
    ankiService.submitReview(activeMask.id, rating)
    setCardsReviewedSession(prev => prev + 1)

    if (rating === 'again') {
      soundService.playWarning()
    } else {
      soundService.playStationChime()
    }

    handleNextCard()
  }

  // Handle Quiz Option Selection
  const handleSelectQuizOption = (opt: string) => {
    if (quizResult || !activeMask) return
    setSelectedQuizOption(opt)
    
    const isCorrect = opt === activeMask.label
    if (isCorrect) {
      setQuizResult('correct')
      soundService.playSuccess()
      setCardsReviewedSession(prev => prev + 1)
      ankiService.submitReview(activeMask.id, 'good')
    } else {
      setQuizResult('wrong')
      soundService.playWarning()
      ankiService.submitReview(activeMask.id, 'again')
    }
  }

  // Handle Type Answer Submission
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
      setCardsReviewedSession(prev => prev + 1)
      ankiService.submitReview(activeMask.id, 'good')
    } else {
      setTypeAnswerResult('wrong')
      soundService.playWarning()
      ankiService.submitReview(activeMask.id, 'again')
    }
  }

  // PIN Unlock handler
  const handleUnlockWithPin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentLesson?.accessPassword) {
      setIsPinUnlocked(true)
      return
    }
    if (inputPin.trim().toLowerCase() === currentLesson.accessPassword.trim().toLowerCase()) {
      setIsPinUnlocked(true)
      soundService.playSuccess()
      setPinError('')
    } else {
      setPinError('Mã PIN không chính xác! Vui lòng liên hệ giảng viên hoặc tác giả.')
      soundService.playWarning()
    }
  }

  if (!currentLesson || !currentImage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#111827] border border-slate-800 rounded-3xl">
        <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Chưa có bài học nào chứa hình ảnh</h3>
        <p className="text-xs text-slate-400">
          Vui lòng chuyển sang tab <strong>Soạn Đề & Ngân Hàng</strong> để tạo bài học và thêm sơ đồ giải phẫu.
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
          <h3 className="text-xl font-black text-white mt-2">Mô-đun Giới Hạn Quyền Truy Cập</h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed mt-1">
            {accessCheck.message || 'Mô-đun bài học này yêu cầu tài khoản học viên trong Whitelist được cấp phép hoặc mở bằng mã PIN.'}
          </p>
        </div>

        {/* User login status box */}
        <div className="p-3.5 bg-[#0B0F19] rounded-2xl border border-slate-800 text-xs text-slate-400 max-w-md mx-auto">
          {currentUser?.isLoggedIn ? (
            <div>
              Tài khoản đang đăng nhập: <strong className="text-rose-400 font-mono">{currentUser.email}</strong>
              <div className="text-[11px] text-slate-500 mt-1">
                (Tài khoản này chưa có trong danh sách được cấp phép của giảng viên)
              </div>
            </div>
          ) : (
            <div>Bạn chưa đăng nhập tài khoản Google.</div>
          )}
        </div>

        {/* PIN Unlock Option */}
        {currentLesson.accessMode === 'password' && (
          <form onSubmit={handleUnlockWithPin} className="max-w-xs mx-auto space-y-2">
            <div className="relative">
              <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value)
                  setPinError('')
                }}
                placeholder="Nhập mã PIN lớp học..."
                className="w-full pl-9 pr-3 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
              />
            </div>
            {pinError && <p className="text-[11px] text-rose-400">{pinError}</p>}
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
            >
              Mở Khóa Bằng Mã PIN
            </button>
          </form>
        )}

        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <button
            onClick={onOpenLogin}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập Bằng Gmail Học Viên</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* ─── 1. TOP CONTROLLER & NAVIGATION ─── */}
      <div className="bg-[#111827] border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Lesson Selector & Module info */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Bài Học:</span>
          </label>
          <select
            value={selectedLessonId}
            onChange={(e) => {
              setSelectedLessonId(e.target.value)
              setCurrentImageIndex(0)
            }}
            className="flex-1 md:w-80 px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400 shadow-inner truncate"
          >
            {allLessons.map(l => (
              <option key={l.id} value={l.id}>
                {l.categoryName} » {l.title}
              </option>
            ))}
          </select>
        </div>

        {/* 4 Study Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-2xl border border-slate-800 shadow-inner overflow-x-auto max-w-full">
          <button
            onClick={() => setStudyMode('anki')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'anki'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Anki Lật Thẻ</span>
          </button>

          <button
            onClick={() => setStudyMode('quiz')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'quiz'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" />
            <span>Trắc Nghiệm (A-D)</span>
          </button>

          <button
            onClick={() => setStudyMode('type')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'type'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Gõ Tự Luận</span>
          </button>

          <button
            onClick={() => setStudyMode('overview')}
            className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              studyMode === 'overview'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Toàn Cảnh</span>
          </button>
        </div>

        {/* Right tools (Share, Zoom) */}
        <div className="flex items-center gap-2 shrink-0">
          {onOpenShare && (
            <button
              onClick={() => onOpenShare(currentLesson)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#1E293B] hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-all active:scale-95"
              title="Chia sẻ & Phân quyền học sinh"
            >
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Phân Quyền</span>
            </button>
          )}

          <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Thu nhỏ sơ đồ"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 min-w-[34px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.15).toFixed(2))))}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              title="Phóng to sơ đồ"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Multiple images strip if lesson has > 1 diagrams */}
      {currentLesson.images && currentLesson.images.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto p-2 bg-[#111827] border border-slate-800 rounded-2xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2">
            Chọn Sơ Đồ:
          </span>
          {currentLesson.images.map((img: any, idx: number) => (
            <button
              key={img.id}
              onClick={() => setCurrentImageIndex(idx)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                currentImageIndex === idx
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              Sơ đồ {idx + 1}: {img.title || 'Mặt giải phẫu'} ({img.masks?.length || 0} vị trí)
            </button>
          ))}
        </div>
      )}

      {/* ─── 2. ACTIVE FLASHCARD / QUESTION CARD ─── */}
      {studyMode !== 'overview' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Progress Bar & Stats */}
          <div className="bg-[#111827] border border-slate-800 rounded-2xl px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                Vị trí {currentCardIndex + 1} / {masks.length}
              </span>
              <div className="w-28 sm:w-36 bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentCardIndex + 1) / Math.max(1, masks.length)) * 100}%` }}
                />
              </div>
            </div>

            {/* Quick Card Navigator */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevCard}
                disabled={currentCardIndex === 0}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Vị trí trước (Mũi tên trái)"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-mono font-bold text-slate-300">
                #{currentCardIndex + 1}
              </span>
              <button
                onClick={handleNextCard}
                disabled={currentCardIndex === masks.length - 1}
                className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Vị trí kế tiếp (Mũi tên phải)"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Deck statistics */}
            <div className="flex items-center gap-3 text-xs font-mono font-bold">
              <span className="text-sky-400">Mới: {deckStats.newCards}</span>
              <span className="text-amber-400">Đang học: {deckStats.learningCards}</span>
              <span className="text-emerald-400">Thuộc: {deckStats.masteredCards}</span>
              {cardsReviewedSession > 0 && (
                <span className="text-indigo-400 border-l border-slate-700 pl-3">
                  🔥 Đã ôn: {cardsReviewedSession}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Visual Canvas Area */}
          <div className="bg-[#070b14] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden select-none">
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="relative inline-block border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black transition-transform duration-150"
            >
              <img
                src={currentImage.url}
                alt={currentImage.title}
                className="max-h-[50vh] sm:max-h-[55vh] w-auto object-contain block pointer-events-none"
              />

              {/* RENDER MASKS: Only active mask is highlighted as question */}
              {masks.map((mask, idx) => {
                const isActive = idx === currentCardIndex
                const showRevealed = isFlipped || (studyMode === 'quiz' && quizResult !== null) || (studyMode === 'type' && typeAnswerResult !== null)

                if (isActive) {
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
                      {/* Active Mask Box */}
                      <div
                        style={{
                          backgroundColor: showRevealed ? '#064e3b' : '#070b14',
                          borderColor: showRevealed ? '#10b981' : '#f59e0b',
                          opacity: 1.0
                        }}
                        className={`w-full h-full rounded-md border-2 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.8)] relative overflow-hidden transition-colors ${
                          !showRevealed ? 'animate-pulse' : ''
                        }`}
                      >
                        {showRevealed ? (
                          <div className="px-1.5 py-0.5 text-center truncate">
                            <span className="text-[11px] font-black text-emerald-200 block truncate">
                              {mask.label}
                            </span>
                          </div>
                        ) : (
                          <div className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-lg font-mono">
                            <span>?</span>
                            <span className="text-[9px]">#{idx + 1}</span>
                          </div>
                        )}
                      </div>

                      {/* Direction Pointer Pin when unflipped */}
                      {!showRevealed && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40">
                          <div className="w-4 h-4 bg-amber-400 rotate-45 border-2 border-black shadow-[0_0_15px_#f59e0b] flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }

                // Other masks are dimmed/solid covered so they don't spoil answers
                return (
                  <div
                    key={mask.id}
                    style={{
                      left: `${mask.x}%`,
                      top: `${mask.y}%`,
                      width: `${mask.width}%`,
                      height: `${mask.height}%`,
                      backgroundColor: '#070b14',
                      opacity: 0.92
                    }}
                    className="absolute z-10 rounded-md border border-slate-800 flex items-center justify-center pointer-events-none"
                  >
                    <span className="text-[9px] text-slate-600 font-mono">#{idx + 1}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ─── 3. INTERACTIVE LEARNING PANEL (MODE-SPECIFIC) ─── */}
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4">
            
            {/* 3A. ANKI FLIP & REVIEW MODE */}
            {studyMode === 'anki' && (
              <div>
                {!isFlipped ? (
                  // Front of Card
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-base font-black text-white flex items-center gap-2">
                        <span>Vị trí giải phẫu</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                          #{currentCardIndex + 1}
                        </span>
                        <span>là cấu trúc nào?</span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Hãy nhớ lại tên gọi trong đầu hoặc mở gợi ý y khoa trước khi lật đáp án.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      {activeMask?.hint && (
                        <button
                          onClick={() => setShowHint(!showHint)}
                          className="px-3.5 py-2.5 rounded-2xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <HelpCircle className="w-4 h-4 text-cyan-400" />
                          <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý lâm sàng'}</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsFlipped(true)
                          soundService.playTick()
                        }}
                        className="flex-1 sm:flex-initial px-6 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>LẬT MẶT SAU (Phím Space)</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  // Back of Card: Answer Revealed + 4 Anki Buttons
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 rounded-2xl bg-[#0B0F19] border border-emerald-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-inner">
                      <div>
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          Đáp Án Giải Phẫu Chính Thức (#{currentCardIndex + 1})
                        </span>
                        <h3 className="text-lg font-black text-white mt-0.5">
                          {activeMask?.label || 'Chưa đặt tên'}
                        </h3>
                        {activeMask?.synonyms?.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Tên gọi khác / Latinh: <strong className="text-slate-200">{activeMask.synonyms.join(', ')}</strong>
                          </p>
                        )}
                      </div>

                      {activeMask?.hint && (
                        <div className="text-xs text-cyan-300/90 bg-cyan-950/40 border border-cyan-800/60 px-3 py-2 rounded-xl max-w-md">
                          💡 <strong>Gợi ý lâm sàng:</strong> {activeMask.hint}
                        </div>
                      )}
                    </div>

                    {/* 4 Anki Rating Buttons */}
                    <div>
                      <div className="text-center text-xs font-bold text-slate-400 mb-2.5">
                        Đánh giá mức độ ghi nhớ (Thuật toán lặp lại ngắt quãng Anki SM-2):
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          onClick={() => handleAnkiRating('again')}
                          className="p-3 rounded-2xl bg-[#2A1215] hover:bg-[#3D1A1E] border border-rose-500/50 text-rose-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                        >
                          <span className="text-sm font-black text-rose-400">🔴 Học Lại</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {ankiService.getIntervalLabel('again', activeMask?.id)} (Phím 1)
                          </span>
                        </button>

                        <button
                          onClick={() => handleAnkiRating('hard')}
                          className="p-3 rounded-2xl bg-[#2E1D10] hover:bg-[#432A17] border border-amber-500/50 text-amber-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                        >
                          <span className="text-sm font-black text-amber-400">🟠 Khó</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {ankiService.getIntervalLabel('hard', activeMask?.id)} (Phím 2)
                          </span>
                        </button>

                        <button
                          onClick={() => handleAnkiRating('good')}
                          className="p-3 rounded-2xl bg-[#0E281F] hover:bg-[#153D30] border border-emerald-500/50 text-emerald-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                        >
                          <span className="text-sm font-black text-emerald-400">🟢 Đã Hiểu</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {ankiService.getIntervalLabel('good', activeMask?.id)} (Phím 3)
                          </span>
                        </button>

                        <button
                          onClick={() => handleAnkiRating('easy')}
                          className="p-3 rounded-2xl bg-[#10233D] hover:bg-[#18365E] border border-sky-500/50 text-sky-300 font-bold text-xs flex flex-col items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                        >
                          <span className="text-sm font-black text-sky-400">🔵 Dễ / Nhớ Rõ</span>
                          <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                            {ankiService.getIntervalLabel('easy', activeMask?.id)} (Phím 4)
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3B. MULTIPLE-CHOICE QUIZ MODE (TRẮC NGHIỆM 4 ĐÁP ÁN) */}
            {studyMode === 'quiz' && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-white flex items-center gap-2">
                    <span>Chọn đáp án đúng cho vị trí</span>
                    <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 font-mono">
                      #{currentCardIndex + 1}
                    </span>
                  </h4>
                  {activeMask?.hint && (
                    <span className="text-xs text-slate-400 italic">
                      💡 {activeMask.hint}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {quizOptions.map((opt, i) => {
                    const letters = ['A', 'B', 'C', 'D']
                    const isSelected = selectedQuizOption === opt
                    const isCorrect = opt === activeMask.label

                    let btnClass = 'bg-[#0B0F19] border-slate-700 text-slate-200 hover:border-cyan-400 hover:bg-slate-800/80'
                    if (quizResult) {
                      if (isCorrect) {
                        btnClass = 'bg-emerald-950/80 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/50'
                      } else if (isSelected && !isCorrect) {
                        btnClass = 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50'
                      } else {
                        btnClass = 'bg-[#0B0F19]/50 border-slate-800 text-slate-500 opacity-60'
                      }
                    }

                    return (
                      <button
                        key={i}
                        disabled={quizResult !== null}
                        onClick={() => handleSelectQuizOption(opt)}
                        className={`p-3.5 rounded-2xl border-2 text-left font-bold text-xs flex items-center gap-3 transition-all cursor-pointer ${btnClass}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs shrink-0 ${
                          isSelected ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {letters[i]}
                        </span>
                        <span className="truncate">{opt}</span>
                        {quizResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                        {quizResult && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-rose-400 ml-auto shrink-0" />}
                      </button>
                    )
                  })}
                </div>

                {quizResult && (
                  <div className="pt-2 flex items-center justify-between">
                    <span className={`text-xs font-black ${quizResult === 'correct' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {quizResult === 'correct' ? '🎉 Chính xác!' : `❌ Sai rồi! Đáp án đúng là: ${activeMask.label}`}
                    </span>
                    <button
                      onClick={handleNextCard}
                      className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer active:scale-95"
                    >
                      Sang Vị Trí Tiếp Theo →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3C. ACTIVE RECALL TYPE-IN MODE (GÕ TỰ LUẬN) */}
            {studyMode === 'type' && (
              <div className="space-y-3.5">
                <form onSubmit={handleCheckTypeAnswer} className="space-y-3">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Nhập tên chi tiết giải phẫu tại vị trí #{currentCardIndex + 1}:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      disabled={typeAnswerResult !== null}
                      value={typeAnswerInput}
                      onChange={(e) => setTypeAnswerInput(e.target.value)}
                      placeholder="Gõ tên cơ quan (VD: Thùy gan phải, Tá tràng, Duodenum)..."
                      className="flex-1 px-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-emerald-400"
                    />
                    {typeAnswerResult === null ? (
                      <button
                        type="submit"
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md cursor-pointer active:scale-95"
                      >
                        Kiểm Tra
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleNextCard}
                        className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md cursor-pointer active:scale-95"
                      >
                        Câu Kế Tiếp →
                      </button>
                    )}
                  </div>
                </form>

                {typeAnswerResult && (
                  <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between ${
                    typeAnswerResult === 'correct'
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-500/50 text-rose-300'
                  }`}>
                    <div>
                      <strong>{typeAnswerResult === 'correct' ? '🎉 Bạn đã trả lời đúng!' : '❌ Chưa chính xác!'}</strong>
                      <div className="mt-0.5 text-slate-300">
                        Đáp án chuẩn: <strong className="text-white">{activeMask.label}</strong>
                        {activeMask.synonyms?.length > 0 && ` (Hoặc: ${activeMask.synonyms.join(', ')})`}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Hint Box popup */}
            {showHint && activeMask?.hint && !isFlipped && (
              <div className="p-3 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-xs text-cyan-200 animate-fadeIn">
                <strong>💡 Gợi ý lâm sàng & định hướng:</strong> {activeMask.hint}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── 4. OVERVIEW FULL DIAGRAM MODE ─── */}
      {studyMode === 'overview' && (
        <div className="bg-[#070b14] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl flex flex-col items-center justify-center relative select-none animate-fadeIn">
          <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-400">
            <span>Click trực tiếp vào từng ô số để lật mở hoặc che đáp án</span>
            <div className="flex gap-2">
              <button
                onClick={() => setRevealedMaskIds(new Set(masks.map(m => m.id)))}
                className="px-2.5 py-1 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                Mở tất cả ({masks.length})
              </button>
              <button
                onClick={() => setRevealedMaskIds(new Set())}
                className="px-2.5 py-1 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                Che tất cả
              </button>
            </div>
          </div>

          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="relative inline-block border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black"
          >
            <img
              src={currentImage.url}
              alt={currentImage.title}
              className="max-h-[60vh] w-auto object-contain block pointer-events-none"
            />

            {masks.map((mask, idx) => {
              const isRevealed = revealedMaskIds.has(mask.id)

              return (
                <div
                  key={mask.id}
                  onClick={() => {
                    setRevealedMaskIds(prev => {
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
                    backgroundColor: isRevealed ? '#064e3b' : '#070b14',
                    borderColor: isRevealed ? '#10b981' : '#6366f1',
                    opacity: 1.0
                  }}
                  className="absolute z-20 rounded-md border-2 flex items-center justify-center cursor-pointer shadow-lg hover:border-cyan-300 transition-colors"
                >
                  {isRevealed ? (
                    <span className="text-[11px] font-black text-emerald-200 truncate px-1">
                      {mask.label}
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-indigo-300 font-mono">
                      #{idx + 1}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
