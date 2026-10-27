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
  Shuffle,
  Share2,
  ListFilter,
  Layers,
  GraduationCap
} from 'lucide-react'
import { soundService } from '../services/soundService'
import { ankiService } from '../services/ankiService'
import { authService, DynexUser } from '../services/authService'
import { Lesson, ImageItem, Mask, Project } from '../services/storageService'
import DeckSelectorModal from './DeckSelectorModal'

interface FlashcardModeProps {
  projects: Project[]
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

export interface ReviewStationItem {
  id: string
  mask: Mask
  image: ImageItem
  lesson: Lesson
  categoryName: string
  subFolderName: string
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

  // Multi-select deck state
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>(() => {
    if (defaultLessonId) return [defaultLessonId]
    return allLessons[0]?.id ? [allLessons[0].id] : []
  })
  const [isDeckSelectorOpen, setIsDeckSelectorOpen] = useState(false)
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false)

  // Build combined review items from all selected lessons
  const reviewDeckItems = useMemo<ReviewStationItem[]>(() => {
    const items: ReviewStationItem[] = []
    projects.forEach(proj => {
      proj.categories?.forEach(cat => {
        cat.subFolders?.forEach(sub => {
          sub.lessons?.forEach(les => {
            if (selectedLessonIds.includes(les.id)) {
              les.images?.forEach(img => {
                img.masks?.forEach(mask => {
                  items.push({
                    id: `${img.id}_${mask.id}`,
                    mask,
                    image: img,
                    lesson: les,
                    categoryName: cat.name,
                    subFolderName: sub.name
                  })
                })
              })
            }
          })
        })
      })
    })

    if (isShuffleEnabled) {
      return [...items].sort(() => 0.5 - Math.random())
    }
    return items
  }, [projects, selectedLessonIds, isShuffleEnabled])

  // Primary active lesson for info
  const primaryLesson = allLessons.find(l => selectedLessonIds.includes(l.id)) || allLessons[0]

  // Check access permission
  const [isPinUnlocked, setIsPinUnlocked] = useState(false)
  const [inputPin, setInputPin] = useState('')
  const [pinError, setPinError] = useState('')

  const accessCheck = authService.checkAccess(primaryLesson, currentUser)
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
  // studyQueue contains array of reviewDeckItems indices to be reviewed
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

  // Current active item being tested
  const activeDeckIndex = studyQueue.length > 0 ? studyQueue[0] : 0
  const activeItem: ReviewStationItem | undefined = reviewDeckItems[activeDeckIndex]
  const activeMask: Mask | undefined = activeItem?.mask
  const activeImage: ImageItem | undefined = activeItem?.image
  const activeLesson: Lesson | undefined = activeItem?.lesson

  // Initialize or reset study queue when deck changes
  const initStudySession = (newDeckLength?: number) => {
    const len = newDeckLength ?? reviewDeckItems.length
    if (len > 0) {
      const initialQueue = Array.from({ length: len }, (_, i) => i)
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
  }, [selectedLessonIds, isShuffleEnabled, reviewDeckItems.length])

  // Generate quiz options when active mask changes
  useEffect(() => {
    if (!activeMask || reviewDeckItems.length === 0) return
    const correctLabel = activeMask.label || 'Chưa đặt tên'
    const otherLabels = reviewDeckItems
      .map(item => item.mask.label)
      .filter(l => l && l !== correctLabel)
    const shuffledOthers = [...new Set(otherLabels)].sort(() => 0.5 - Math.random())
    const distractors = shuffledOthers.slice(0, 3)
    const combined = [correctLabel, ...distractors].sort(() => 0.5 - Math.random())
    setQuizOptions(combined)
    setSelectedQuizOption(null)
    setQuizResult(null)
  }, [activeDeckIndex, activeMask, reviewDeckItems])

  // TTS Speech Synthesis pronunciation
  const handleSpeak = (text?: string) => {
    const targetText = text || activeMask?.label
    if (!targetText) return
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(targetText)
      utterance.lang = 'vi-VN'
      utterance.rate = 0.95
      window.speechSynthesis.speak(utterance)
      soundService.playTick()
    }
  }

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

      // Nếu hàng đợi còn nhiều hơn 3 thẻ, chèn sau 3 thẻ để não bộ lặp lại
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
    if (!primaryLesson) return
    const success = authService.unlockWithPin(
      primaryLesson.id,
      inputPin,
      primaryLesson.accessPassword
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
      } else if (e.key === 's' || e.key === 'S') {
        handleSpeak()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [studyMode, isFlipped, studyQueue, quizOptions, quizResult, activeMask])

  if (allLessons.length === 0 || !activeImage) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-[#111827] border border-slate-800 rounded-3xl">
        <BookOpen className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-lg font-bold text-white mb-2">Chưa có bài học nào chứa hình ảnh sơ đồ</h3>
        <p className="text-xs text-slate-400">
          Vui lòng bấm nút <strong>+ Tạo Mới</strong> trên thanh điều hướng để thêm bài học giải phẫu và hình ảnh.
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
            Bạn đã nạp thành công toàn bộ <strong>{reviewDeckItems.length}</strong> vị trí giải phẫu đã chọn vào trí nhớ dài hạn.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <div className="p-3 bg-[#0B0F19] rounded-2xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Tổng số thẻ</span>
            <span className="text-xl font-mono font-black text-cyan-300">{reviewDeckItems.length}</span>
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
            onClick={() => initStudySession()}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Học Lại Bộ Thẻ Này</span>
          </button>
          <button
            onClick={() => setIsDeckSelectorOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer"
          >
            <ListFilter className="w-4 h-4 text-cyan-400" />
            <span>Chọn Đề Khác / Thêm Bài</span>
          </button>
        </div>
      </div>
    )
  }

  // ─── ACTIVE STUDY SCREEN (DESKTOP SIDE-BY-SIDE + NO SCROLLING REQUIRED) ───
  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      
      {/* ─── 1. TOP CONTROL & DECK SELECTION BAR ─── */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-[#111827] border border-slate-800 p-3 sm:p-4 rounded-3xl shadow-lg">
        
        {/* Left: Deck & Multi-lesson Selector Button */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={() => setIsDeckSelectorOpen(true)}
            className="p-2 rounded-2xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 shrink-0 cursor-pointer transition-all"
            title="Bấm để chọn nhiều bài học hoặc nhiều chương cùng lúc"
          >
            <ListFilter className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">
                {selectedLessonIds.length > 1
                  ? `Ôn Luyện Đa Chương (${selectedLessonIds.length} Bài)`
                  : `${activeItem?.categoryName || ''} • ${activeItem?.subFolderName || ''}`}
              </span>
              {isShuffleEnabled && (
                <span className="px-1.5 py-0.5 rounded-md bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-bold flex items-center gap-1">
                  <Shuffle className="w-2.5 h-2.5" /> Ngẫu nhiên
                </span>
              )}
            </div>

            {selectedLessonIds.length === 1 ? (
              <select
                value={selectedLessonIds[0]}
                onChange={e => setSelectedLessonIds([e.target.value])}
                className="w-full bg-transparent text-sm sm:text-base font-black text-white focus:outline-none cursor-pointer truncate"
              >
                {allLessons.map(l => (
                  <option key={l.id} value={l.id} className="bg-[#111827] text-white">
                    {l.title} ({l.images?.reduce((sum: number, img: any) => sum + (img.masks?.length || 0), 0)} vị trí)
                  </option>
                ))}
              </select>
            ) : (
              <button
                onClick={() => setIsDeckSelectorOpen(true)}
                className="text-left text-sm sm:text-base font-black text-white hover:text-indigo-300 transition-colors truncate block w-full"
              >
                Bộ thẻ tổng hợp ({reviewDeckItems.length} vị trí từ {selectedLessonIds.length} bài) ▾
              </button>
            )}
          </div>

          {/* Multi-select button */}
          <button
            onClick={() => setIsDeckSelectorOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs shrink-0 cursor-pointer transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chọn Đa Chương</span>
          </button>
        </div>

        {/* Center: Mode Selector Tabs */}
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

        {/* Right: Quick Tools (Shuffle, Share, Zoom) */}
        <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
          <button
            onClick={() => setIsShuffleEnabled(prev => !prev)}
            className={`p-2 rounded-xl text-xs border transition-colors cursor-pointer ${
              isShuffleEnabled
                ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                : 'bg-[#070b14] border-slate-800 text-slate-400 hover:text-white'
            }`}
            title={isShuffleEnabled ? 'Đang trộn ngẫu nhiên câu hỏi' : 'Bật trộn ngẫu nhiên'}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {onOpenShare && primaryLesson && (
            <button
              onClick={() => onOpenShare(primaryLesson)}
              className="p-2 rounded-xl text-xs bg-[#070b14] border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              title="Tạo link chia sẻ bài học này"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-1 bg-[#070b14] px-2 py-1 rounded-2xl border border-slate-800">
            <button
              onClick={() => setZoomLevel(prev => Math.max(0.7, Number((prev - 0.15).toFixed(2))))}
              className="p-1 text-slate-400 hover:text-white"
              title="Thu nhỏ"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-[11px] font-mono text-slate-300 min-w-[34px] text-center">
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
      </div>

      {/* ─── 2. MAIN 2-COLUMN VIEW (NO VERTICAL SCROLLING NEEDED ON LAPTOP) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-start">
        
        {/* ─── LEFT COLUMN: ANATOMICAL DIAGRAM CANVAS (lg:col-span-7) ─── */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#070b14] border border-slate-800 rounded-3xl p-3 sm:p-5 shadow-2xl relative overflow-hidden select-none">
          
          <div
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            className="relative inline-block border-2 border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black transition-transform duration-150"
          >
            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="max-h-[46vh] sm:max-h-[50vh] lg:max-h-[66vh] w-auto object-contain block pointer-events-none"
            />

            {/* ─── RENDER MASKS (100% SOLID ZERO LEAK) ─── */}
            {activeImage.masks?.map((mask, idx) => {
              const isCurrentlyActive = mask.id === activeMask?.id
              const isRevealedInOverview = revealedOverviewMasks.has(mask.id)

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
                      className="w-full h-full rounded-md border-2 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.9)] relative overflow-hidden transition-colors"
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
                          <span className="text-[9px]">#{activeDeckIndex + 1}</span>
                        </div>
                      )}
                    </div>

                    {/* Bouncing Direction Pointer Arrow when card is face down */}
                    {!showRevealed && (
                      <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40 pointer-events-none filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.9)]">
                        <div className="px-2 py-0.5 rounded-full bg-amber-400 border border-amber-300 text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                          <span>Chỉ điểm</span>
                        </div>
                        {/* SVG Downward Pointer Arrow */}
                        <svg className="w-5 h-5 text-amber-400 -mt-1 drop-shadow" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21L4 11H9V3H15V11H20L12 21Z" stroke="#000" strokeWidth="1.5" strokeLinejoin="round" />
                        </svg>
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

              // 3. OTHER MASKS: 100% Solid opaque dark cover
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

          {/* Diagram Title Footnote */}
          <div className="mt-2 text-center text-[11px] text-slate-400 truncate max-w-full">
            {activeImage.title || 'Sơ đồ giải phẫu'} ({activeImage.masks?.length || 0} vị trí)
          </div>
        </div>

        {/* ─── RIGHT COLUMN: LEARNING DECK & RATING BUTTONS (lg:col-span-5) ─── */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Progress Bar & Brain Stats */}
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="text-indigo-400 flex items-center gap-1.5">
                <Brain className="w-4 h-4" />
                Hàng Đợi: {studyQueue.length} Thẻ
              </span>
              <span className="text-emerald-400">
                Đã Thuộc: {graduatedIndices.size} / {reviewDeckItems.length} (
                {Math.round((graduatedIndices.size / Math.max(1, reviewDeckItems.length)) * 100)}%)
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (graduatedIndices.size / Math.max(1, reviewDeckItems.length)) * 100)}%`
                }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
              <span className="text-amber-400">⏳ Cần lặp lại: {studyQueue.length}</span>
              <span className="text-rose-400">🔁 Đang học lại: {learningIndices.size}</span>
              <span className="text-indigo-400">🔥 Đã ôn: {totalReviewsCount}</span>
            </div>
          </div>

          {/* Question / Interaction Card */}
          <div className="bg-[#111827] border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
            
            {/* 4A. ANKI BRAIN MODE */}
            {studyMode === 'anki' && (
              <div className="space-y-4">
                
                {/* Question Header & Tools */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Thẻ số #{activeDeckIndex + 1} • {activeLesson?.title?.split(':')[0] || 'Giải Phẫu'}
                    </span>
                    <h4 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
                      <span>Vị trí</span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                        #{activeDeckIndex + 1}
                      </span>
                      <span>là cấu trúc gì?</span>
                    </h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Speak Button */}
                    {isFlipped && (
                      <button
                        onClick={() => handleSpeak()}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-white cursor-pointer transition-colors"
                        title="Nghe phát âm chuẩn (Phím S)"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Clinical Hint Button */}
                    <button
                      onClick={() => setShowHint(prev => !prev)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                        showHint
                          ? 'bg-cyan-950 border-cyan-500 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                      }`}
                      title="Gợi ý lâm sàng (Phím H)"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{showHint ? 'Ẩn gợi ý' : 'Gợi ý (H)'}</span>
                    </button>
                  </div>
                </div>

                {/* ─── CLINICAL HINT DISPLAY BOX (FIXED: ALWAYS RENDERS WHEN CLICKED!) ─── */}
                {showHint && (
                  <div className="p-3.5 bg-gradient-to-r from-cyan-950/70 to-indigo-950/60 border border-cyan-500/60 rounded-2xl text-xs text-cyan-200 animate-fadeIn space-y-1 shadow-lg">
                    <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>Gợi Ý Lâm Sàng Y Khoa:</span>
                    </div>
                    <p className="leading-relaxed pl-5">
                      {activeMask?.hint || `Cấu trúc giải phẫu trọng tâm thuộc "${activeLesson?.title}". Thường xuất hiện trong đề thi chạy trạm OSCE 20 giây.`}
                    </p>
                  </div>
                )}

                {/* Front View (Not Flipped) */}
                {!isFlipped ? (
                  <div className="space-y-4 pt-1">
                    <p className="text-xs text-slate-300 leading-relaxed bg-[#070b14] p-3 rounded-2xl border border-slate-800/80">
                      💡 Nhớ lại tên gọi trong đầu (hoặc mở gợi ý lâm sàng), sau đó bấm nút lật mặt sau để tự đánh giá mức độ ghi nhớ não bộ.
                    </p>

                    <button
                      onClick={() => {
                        setIsFlipped(true)
                        soundService.playTick()
                      }}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>LẬT MẶT SAU (Phím Space)</span>
                    </button>
                  </div>
                ) : (
                  // Back View (Answer Revealed + THE 4 ANKI RATING BUTTONS RIGHT HERE!)
                  <div className="space-y-4 animate-fadeIn">
                    <div className="p-4 rounded-2xl bg-[#070b14] border border-emerald-500/50 shadow-inner space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
                          Đáp Án Chính Thức
                        </span>
                        <button
                          onClick={() => handleSpeak()}
                          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Phát âm</span>
                        </button>
                      </div>

                      <h3 className="text-lg font-black text-white leading-tight">
                        {activeMask?.label || 'Chưa đặt tên'}
                      </h3>

                      {activeMask?.synonyms && activeMask.synonyms.length > 0 && (
                        <p className="text-xs text-slate-400">
                          Tên Latinh / Đồng nghĩa:{' '}
                          <strong className="text-slate-200">{activeMask.synonyms.join(', ')}</strong>
                        </p>
                      )}
                    </div>

                    {/* ─── 4 ANKI BRAIN BUTTONS (PROMINENT & EASY TO CLICK WITHOUT SCROLLING) ─── */}
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                        Đánh Giá Khả Năng Nhớ Của Não Bộ (Phím 1, 2, 3, 4):
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        {/* 1. AGAIN */}
                        <button
                          onClick={() => handleAnkiRating('again')}
                          className="p-3 rounded-2xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-500/60 text-rose-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md hover:border-rose-400"
                        >
                          <div className="flex items-center gap-1.5 font-black text-sm">
                            <span className="w-5 h-5 rounded-md bg-rose-900 border border-rose-600 flex items-center justify-center text-[10px]">
                              1
                            </span>
                            <span>HỌC LẠI</span>
                          </div>
                          <span className="text-[10px] text-rose-400 font-mono font-bold">
                            Lặp lại sau 3 thẻ
                          </span>
                        </button>

                        {/* 2. HARD */}
                        <button
                          onClick={() => handleAnkiRating('hard')}
                          className="p-3 rounded-2xl bg-amber-950/50 hover:bg-amber-900/80 border border-amber-500/60 text-amber-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md hover:border-amber-400"
                        >
                          <div className="flex items-center gap-1.5 font-black text-sm">
                            <span className="w-5 h-5 rounded-md bg-amber-900 border border-amber-600 flex items-center justify-center text-[10px]">
                              2
                            </span>
                            <span>KHÓ</span>
                          </div>
                          <span className="text-[10px] text-amber-400 font-mono font-bold">
                            10 phút
                          </span>
                        </button>

                        {/* 3. GOOD */}
                        <button
                          onClick={() => handleAnkiRating('good')}
                          className="p-3 rounded-2xl bg-sky-950/50 hover:bg-sky-900/80 border border-sky-500/60 text-sky-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md hover:border-sky-400"
                        >
                          <div className="flex items-center gap-1.5 font-black text-sm">
                            <span className="w-5 h-5 rounded-md bg-sky-900 border border-sky-600 flex items-center justify-center text-[10px]">
                              3
                            </span>
                            <span>TỐT</span>
                          </div>
                          <span className="text-[10px] text-sky-400 font-mono font-bold">
                            1 ngày (Thuộc)
                          </span>
                        </button>

                        {/* 4. EASY */}
                        <button
                          onClick={() => handleAnkiRating('easy')}
                          className="p-3 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/80 border border-emerald-500/60 text-emerald-200 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer shadow-md hover:border-emerald-400"
                        >
                          <div className="flex items-center gap-1.5 font-black text-sm">
                            <span className="w-5 h-5 rounded-md bg-emerald-900 border border-emerald-600 flex items-center justify-center text-[10px]">
                              4
                            </span>
                            <span>DỄ</span>
                          </div>
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            4 ngày (Thuộc ngay)
                          </span>
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
                    #{activeDeckIndex + 1}
                  </span>
                </h4>

                <div className="grid grid-cols-1 gap-2">
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
                        className={`p-3 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer text-left ${btnStyle}`}
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

            {/* 4C. TYPE-IN MODE */}
            {studyMode === 'type' && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Gõ tên chi tiết giải phẫu:</span>
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                    #{activeDeckIndex + 1}
                  </span>
                </h4>

                <form onSubmit={handleCheckTypeAnswer} className="flex gap-2">
                  <input
                    type="text"
                    value={typeAnswerInput}
                    onChange={e => setTypeAnswerInput(e.target.value)}
                    placeholder="Nhập tên tiếng Việt hoặc Latinh..."
                    className="flex-1 px-3.5 py-2.5 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
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

            {/* 4D. OVERVIEW MODE */}
            {studyMode === 'overview' && (
              <div className="space-y-3 text-xs text-slate-300">
                <p>
                  💡 <strong>Chế độ Toàn Cảnh:</strong> Bấm trực tiếp vào từng ô số trên sơ đồ bên trái để lật mở xem nhãn giải phẫu hoặc che lại.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setRevealedOverviewMasks(new Set(activeImage.masks.map(m => m.id)))}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 font-bold cursor-pointer"
                  >
                    Mở tất cả ({activeImage.masks.length})
                  </button>
                  <button
                    onClick={() => setRevealedOverviewMasks(new Set())}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                  >
                    Che tất cả
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* ─── 3. DECK SELECTOR MODAL (MULTI-LESSON / MULTI-CHAPTER) ─── */}
      {isDeckSelectorOpen && (
        <DeckSelectorModal
          isOpen={isDeckSelectorOpen}
          onClose={() => setIsDeckSelectorOpen(false)}
          projects={projects}
          initialSelectedLessonIds={selectedLessonIds}
          onStartSession={({ selectedLessonIds: newLessonIds, shuffle }) => {
            setSelectedLessonIds(newLessonIds)
            setIsShuffleEnabled(shuffle)
          }}
          defaultMode="anki"
        />
      )}

    </div>
  )
}
