'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Zap,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  Search,
  Flag,
  Check,
  ShieldCheck,
  X,
  Share2,
  Lock,
  Unlock,
  GraduationCap,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Smartphone,
  Laptop
} from 'lucide-react'
import confetti from 'canvas-confetti'
import { soundService } from '../services/soundService'
import { storageService, DynexExamPaper, DynexExamStation, Project } from '../services/storageService'

interface MedicalSpottingExamProps {
  projects: Project[]
  onSaveExamResult?: (result: any) => void
  initialExamPaper?: DynexExamPaper | null
  isExamCandidateMode?: boolean
  onExitExam?: () => void
}

/**
 * Normalizes text for medical anatomy answer comparison
 */
function normalizeText(str: string) {
  if (!str) return ''
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '')
    .trim()
}

function checkMedicalAnswer(userAnswer: string, officialAnswer: string, synonyms: string[] = []) {
  const cleanUser = normalizeText(userAnswer)
  const cleanOfficial = normalizeText(officialAnswer)

  if (!cleanUser) return false
  if (cleanUser === cleanOfficial) return true

  for (const syn of synonyms) {
    if (cleanUser === normalizeText(syn)) return true
  }

  if (cleanUser.length > 5 && (cleanOfficial.includes(cleanUser) || cleanUser.includes(cleanOfficial))) {
    return true
  }

  return false
}

export default function MedicalSpottingExam({
  projects,
  onSaveExamResult,
  initialExamPaper = null,
  isExamCandidateMode = false,
  onExitExam
}: MedicalSpottingExamProps) {
  const [activeExamPaper, setActiveExamPaper] = useState<DynexExamPaper | null>(initialExamPaper)
  const [examStatus, setExamStatus] = useState<'setup' | 'running' | 'finished'>('setup')

  // Setup state
  const [candidateName, setCandidateName] = useState('Sinh Viên Y Khoa')
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Runtime state
  const [stations, setStations] = useState<any[]>([])
  const [currentStationIndex, setCurrentStationIndex] = useState(0)
  const [secondsPerStation, setSecondsPerStation] = useState(initialExamPaper?.timePerStation || 20)
  const [timeLeft, setTimeLeft] = useState(secondsPerStation)
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({})
  const [currentInput, setCurrentInput] = useState('')
  const [flaggedStations, setFlaggedStations] = useState<Record<number, boolean>>({})

  // Finished state
  const [examSummary, setExamSummary] = useState<any>(null)

  // Zoom controls
  const [zoomLevel, setZoomLevel] = useState(1.0)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Sync initialExamPaper changes
  useEffect(() => {
    if (initialExamPaper) {
      setActiveExamPaper(initialExamPaper)
      setSecondsPerStation(initialExamPaper.timePerStation || 20)
    }
  }, [initialExamPaper])

  // Timer loop when running
  useEffect(() => {
    if (examStatus !== 'running') return

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNextStation(true)
          return secondsPerStation
        }
        if (prev === 6) {
          soundService.playTick()
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [examStatus, currentStationIndex, secondsPerStation, stations.length, userAnswers, currentInput])

  // Auto focus input when switching stations
  useEffect(() => {
    if (examStatus === 'running') {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [currentStationIndex, examStatus])

  // Start Exam Handler
  const handleStartExam = () => {
    // Password check
    if (activeExamPaper?.accessPassword) {
      if (passwordInput.trim() !== activeExamPaper.accessPassword.trim()) {
        setPasswordError('Mật khẩu phòng thi không chính xác!')
        soundService.playWarning()
        return
      }
    }
    setPasswordError('')

    let preparedStations: any[] = []

    if (activeExamPaper && activeExamPaper.stations && activeExamPaper.stations.length > 0) {
      preparedStations = activeExamPaper.stations
    } else {
      // Auto-collect from projects
      const collected = storageService.collectAllStations(projects)
      if (collected && collected.length > 0) {
        preparedStations = collected.slice(0, 20).map((st, i) => ({
          ...st,
          stationIndex: i,
          stationId: `station_${i + 1}`
        }))
      }
    }

    if (preparedStations.length === 0) {
      alert('Đề thi này chưa có trạm thi nào! Vui lòng kiểm tra lại sơ đồ và các ô che trong bài học.')
      return
    }

    setStations(preparedStations)
    setCurrentStationIndex(0)
    setTimeLeft(activeExamPaper?.timePerStation || secondsPerStation)
    setUserAnswers({})
    setCurrentInput('')
    setFlaggedStations({})
    setZoomLevel(1.0)
    setExamStatus('running')
    soundService.playSuccess()
  }

  // Next / Previous Station
  const handleNextStation = (isTimeout = false) => {
    const updatedAnswers = {
      ...userAnswers,
      [currentStationIndex]: currentInput.trim()
    }
    setUserAnswers(updatedAnswers)

    if (isTimeout) {
      soundService.playStationChime()
    } else {
      soundService.playTick()
    }

    if (currentStationIndex < stations.length - 1) {
      const nextIdx = currentStationIndex + 1
      setCurrentStationIndex(nextIdx)
      setTimeLeft(secondsPerStation)
      setCurrentInput(updatedAnswers[nextIdx] || '')
    } else {
      finishExam(updatedAnswers)
    }
  }

  const handlePrevStation = () => {
    if (currentStationIndex > 0) {
      const updatedAnswers = {
        ...userAnswers,
        [currentStationIndex]: currentInput.trim()
      }
      setUserAnswers(updatedAnswers)
      const prevIdx = currentStationIndex - 1
      setCurrentStationIndex(prevIdx)
      setTimeLeft(secondsPerStation)
      setCurrentInput(updatedAnswers[prevIdx] || '')
      soundService.playClick()
    }
  }

  const handleJumpToStation = (idx: number) => {
    const updatedAnswers = {
      ...userAnswers,
      [currentStationIndex]: currentInput.trim()
    }
    setUserAnswers(updatedAnswers)
    setCurrentStationIndex(idx)
    setTimeLeft(secondsPerStation)
    setCurrentInput(updatedAnswers[idx] || '')
    soundService.playClick()
  }

  const toggleFlagCurrentStation = () => {
    setFlaggedStations(prev => ({
      ...prev,
      [currentStationIndex]: !prev[currentStationIndex]
    }))
    soundService.playTick()
  }

  // Finish & Grade Exam
  const finishExam = (finalAnswers: Record<number, string>) => {
    if (timerRef.current) clearInterval(timerRef.current)

    let correctCount = 0
    const details = stations.map((st, idx) => {
      const ans = finalAnswers[idx] || ''
      const official = st.officialAnswer || st.targetMask?.label || st.targetMask?.customAnswer || ''
      const isCorrect = checkMedicalAnswer(ans, official, st.synonyms || st.targetMask?.synonyms || [])
      if (isCorrect) correctCount++

      return {
        stationIndex: idx,
        lessonTitle: st.lessonTitle,
        imageUrl: st.imageUrl,
        userAnswer: ans,
        officialAnswer: official,
        synonyms: st.synonyms || st.targetMask?.synonyms || [],
        isCorrect
      }
    })

    const score = stations.length > 0 ? Number(((correctCount / stations.length) * 10).toFixed(1)) : 0

    const summary = {
      examTitle: activeExamPaper?.title || 'Kỳ Thi Chạy Trạm Giải Phẫu OSCE',
      subject: activeExamPaper?.subject || 'Giải Phẫu Học',
      candidateName,
      totalStations: stations.length,
      correctCount,
      score,
      completedAt: new Date().toISOString(),
      details
    }

    setExamSummary(summary)
    setExamStatus('finished')
    onSaveExamResult?.(summary)

    soundService.playComplete()
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    } catch (e) {
      // ignore
    }
  }

  const currentStation = stations[currentStationIndex]

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1: CANDIDATE LOBBY (SẢNH CHỜ THI - HOÀN TOÀN MỚI, KHÔNG CÓ NÚT ADMIN)
  // ═══════════════════════════════════════════════════════════════════════════
  if (examStatus === 'setup') {
    return (
      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 max-w-2xl mx-auto w-full animate-fadeIn select-none">
        {/* Minimal Candidate Header Bar */}
        <div className="w-full flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-black tracking-wider uppercase text-rose-300">
              Phòng Thi Chạy Trạm Y Khoa (OSCE)
            </span>
          </div>

          {onExitExam && (
            <button
              type="button"
              onClick={onExitExam}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span>Thoát Phòng Thi</span>
            </button>
          )}
        </div>

        {/* Lobby Card */}
        <div className="w-full bg-[#0c1222] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Exam Title & Subject */}
          <div className="space-y-2 relative z-10">
            <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              Môn Học: {activeExamPaper?.subject || 'Giải Phẫu Y Khoa'}
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
              {activeExamPaper?.title || 'Kỳ Thi Chạy Trạm OSCE Chuẩn'}
            </h1>
            <p className="text-xs text-slate-400">
              Đề thi tự động chuyển trạm khi hết giờ • Ô che 100% che kín bảo mật
            </p>
          </div>

          {/* Specs Chips */}
          <div className="grid grid-cols-3 gap-2.5 bg-[#070b14] border border-slate-800 rounded-2xl p-3.5 text-center">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Số Lượng Trạm</div>
              <div className="text-lg sm:text-xl font-black text-rose-400 font-mono mt-0.5">
                {activeExamPaper?.totalStations || 10} Trạm
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Thời Gian</div>
              <div className="text-lg sm:text-xl font-black text-cyan-400 font-mono mt-0.5">
                {activeExamPaper?.timePerStation || secondsPerStation}s / Trạm
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Hình Thức</div>
              <div className="text-lg sm:text-xl font-black text-emerald-400 font-mono mt-0.5">
                Spotting
              </div>
            </div>
          </div>

          {/* Candidate Form */}
          <div className="bg-[#070b14] border border-slate-800 rounded-2xl p-4 sm:p-5 text-left space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Họ và Tên Thí Sinh: <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                autoFocus
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Nhập họ và tên hoặc mã sinh viên..."
                className="w-full px-3.5 py-2.5 bg-[#0c1222] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-400"
              />
            </div>

            {/* PIN Password if required */}
            {activeExamPaper?.accessPassword && (
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1.5 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mật Khẩu PIN Phòng Thi:</span>
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Nhập mã PIN do giám thị cấp..."
                  className="w-full px-3.5 py-2.5 bg-[#0c1222] border border-amber-500/50 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                />
                {passwordError && (
                  <p className="text-[11px] text-red-400 mt-1 font-semibold">{passwordError}</p>
                )}
              </div>
            )}
          </div>

          {/* Launch Button */}
          <button
            type="button"
            onClick={handleStartExam}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-sm tracking-wide shadow-xl shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5 fill-current text-amber-300" />
            <span>BẮT ĐẦU VÀO PHÒNG THI CHẠY TRẠM</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: RUNNING TEST SCREEN (CHẠY TRẠM OSCE - GIAO DIỆN TỐI ƯU CẢ ĐIỆN THOẠI & LAPTOP)
  // ═══════════════════════════════════════════════════════════════════════════
  if (examStatus === 'running' && currentStation) {
    const isTargetTimeCritical = timeLeft <= 5

    return (
      <div className="flex-1 flex flex-col max-w-7xl mx-auto w-full p-2 sm:p-4 gap-3 sm:gap-4 animate-fadeIn select-none">
        {/* Top Header Bar for Candidate */}
        <div className="bg-[#0c1222] border border-slate-800/80 rounded-2xl p-2.5 sm:p-3.5 flex items-center justify-between gap-3 shadow-lg shrink-0">
          {/* Station Counter */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-rose-600 to-red-600 flex items-center justify-center text-white font-mono font-black text-base sm:text-lg shadow-md shadow-rose-600/30">
              {currentStationIndex + 1}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current" />
                Thi Chạy Trạm OSCE
              </span>
              <div className="text-xs sm:text-sm font-black text-white font-mono">
                Trạm {currentStationIndex + 1} / {stations.length}
              </div>
            </div>
          </div>

          {/* Central High-Tech Countdown Timer */}
          <div className="flex items-center gap-2 bg-[#070b14] px-3.5 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
            <Clock className={`w-4 h-4 ${isTargetTimeCritical ? 'text-rose-400 animate-pulse' : 'text-cyan-400'}`} />
            <div className="flex flex-col items-center">
              <span className={`font-mono font-black text-base sm:text-lg leading-none ${
                isTargetTimeCritical ? 'text-rose-400 animate-pulse scale-105' : 'text-white'
              }`}>
                00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}s
              </span>
            </div>
          </div>

          {/* Quick Actions: Flag & Submit Early */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFlagCurrentStation}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                flaggedStations[currentStationIndex]
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-800'
              }`}
              title="Cắm cờ nghi vấn trạm này"
            >
              <Flag className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">Cắm cờ</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Bạn có chắc chắn muốn nộp bài thi ngay bây giờ?')) {
                  const updatedAnswers = {
                    ...userAnswers,
                    [currentStationIndex]: currentInput.trim()
                  }
                  finishExam(updatedAnswers)
                }
              }}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Nộp Bài
            </button>
          </div>
        </div>

        {/* Responsive Content Grid: Laptop 2 columns, Mobile 2 rows */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 min-h-0">
          {/* LEFT / TOP: SƠ ĐỒ GIẢI PHẪU VỚI MŨI TÊN CHỈ ĐIỂM RÕ RÀNG */}
          <div className="lg:col-span-8 bg-[#0c1222] border border-slate-800 rounded-3xl p-3 sm:p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[300px] lg:min-h-[500px]">
            {/* Zoom Controls */}
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#070b14]/90 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.8, prev - 0.2))}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-300 px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(2.0, prev + 0.2))}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Diagram with Target Mask & Direction Arrow */}
            <div className="relative inline-block border border-slate-800 rounded-2xl overflow-hidden shadow-2xl bg-black select-none max-w-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={currentStation.imageUrl}
                alt={currentStation.imageTitle || 'Sơ đồ giải phẫu'}
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center' }}
                className="max-h-[36vh] sm:max-h-[46vh] lg:max-h-[56vh] w-auto object-contain block pointer-events-none transition-transform"
              />

              {/* Mask Overlays */}
              {currentStation.allImageMasks?.map((mask: any) => {
                const isTarget = mask.id === (currentStation.targetMask?.id || currentStation.maskId)

                if (isTarget) {
                  return (
                    <div
                      key={mask.id}
                      className="absolute z-30 pointer-events-none"
                      style={{
                        left: `${Math.max(0, mask.x - 1)}%`,
                        top: `${Math.max(0, mask.y - 1)}%`,
                        width: `${Math.min(100, mask.width + 2)}%`,
                        height: `${Math.min(100, mask.height + 2)}%`
                      }}
                    >
                      {/* 100% Solid Mask */}
                      <div 
                        className="w-full h-full rounded-md border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.95)] flex items-center justify-center relative overflow-hidden"
                        style={{ backgroundColor: '#070b14', opacity: 1.0 }}
                      >
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px] font-mono border border-rose-400">
                          TRẠM #{currentStationIndex + 1}
                        </span>
                      </div>

                      {/* Animated Pointer Arrow */}
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40">
                        <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider shadow">
                          Chỉ điểm
                        </span>
                        <svg className="w-4 h-4 text-rose-500 -mt-1" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 21L4 11H9V3H15V11H20L12 21Z" stroke="#000" strokeWidth="1.5" />
                        </svg>
                      </div>
                    </div>
                  )
                }

                // Other Non-target Masks (also 100% solid, zero answer leak)
                return (
                  <div
                    key={mask.id}
                    className="absolute z-10 pointer-events-none"
                    style={{
                      left: `${mask.x}%`,
                      top: `${mask.y}%`,
                      width: `${mask.width}%`,
                      height: `${mask.height}%`
                    }}
                  >
                    <div 
                      className="w-full h-full rounded-md border border-slate-800"
                      style={{ backgroundColor: '#070b14', opacity: 1.0 }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          {/* RIGHT / BOTTOM: KHU VỰC TRẢ LỜI & ĐIỀU HƯỚNG TRẠM */}
          <div className="lg:col-span-4 bg-[#0c1222] border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4 shadow-xl">
            <div className="space-y-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 block mb-1">
                  Câu hỏi Trạm #{currentStationIndex + 1}:
                </span>
                <p className="text-xs font-semibold text-slate-200 leading-relaxed">
                  Quan sát chi tiết giải phẫu học đang được chỉ điểm tại ô viền đỏ và nhập tên gọi chuẩn:
                </p>
              </div>

              {/* Answer Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  handleNextStation(false)
                }}
                className="space-y-3"
              >
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Nhập tên chi tiết giải phẫu..."
                    className="w-full px-4 py-3 bg-[#070b14] border-2 border-rose-500/60 focus:border-rose-400 rounded-2xl text-xs sm:text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-rose-500/20 transition-all shadow-inner"
                  />
                  {currentInput && (
                    <button
                      type="button"
                      onClick={() => setCurrentInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs p-1"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrevStation}
                    disabled={currentStationIndex === 0}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-slate-900 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Trước</span>
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>{currentStationIndex === stations.length - 1 ? 'Nộp Bài Thi' : 'Xác Nhận & Tiếp Theo'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              <p className="text-[10px] text-slate-500 text-center">
                💡 Trên laptop: Bấm <strong>Enter</strong> để gửi và chuyển trạm nhanh
              </p>
            </div>

            {/* Station Dots Track (Điều hướng trạm) */}
            <div className="pt-3 border-t border-slate-800/80">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                Danh Sách {stations.length} Trạm Thi:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-none">
                {stations.map((_, idx) => {
                  const isCurrent = currentStationIndex === idx
                  const isAnswered = Boolean(userAnswers[idx])
                  const isFlagged = Boolean(flaggedStations[idx])

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleJumpToStation(idx)}
                      className={`w-7 h-7 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center border ${
                        isCurrent
                          ? 'bg-rose-600 text-white border-rose-400 shadow-md ring-2 ring-rose-400/50 scale-105'
                          : isFlagged
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                          : isAnswered
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/60'
                          : 'bg-[#070b14] text-slate-500 border-slate-800 hover:text-white'
                      }`}
                      title={`Đến trạm ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: FINISHED RESULTS SCREEN (BẢNG ĐIỂM & ĐÁNH GIÁ CHI TIẾT)
  // ═══════════════════════════════════════════════════════════════════════════
  if (examStatus === 'finished' && examSummary) {
    return (
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5 animate-fadeIn select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-black text-white">Kết Quả Kỳ Thi Chạy Trạm OSCE</h2>
          </div>

          {onExitExam && (
            <button
              type="button"
              onClick={onExitExam}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Thoát Về Trang Chủ
            </button>
          )}
        </div>

        {/* Score Banner Hero */}
        <div className="bg-gradient-to-br from-rose-950/80 via-[#0c1222] to-indigo-950/80 border border-rose-500/40 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          <span className="text-[11px] font-black uppercase tracking-wider text-rose-300 block mb-1">
            Thí Sinh: {candidateName}
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
            {examSummary.score} / 10 Điểm
          </h1>
          <p className="text-xs text-slate-300 mb-6">
            Đạt <strong>{examSummary.correctCount} / {examSummary.totalStations}</strong> trạm thi chuẩn xác.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStartExam}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi Lại Đề Này</span>
            </button>

            {onExitExam && (
              <button
                type="button"
                onClick={onExitExam}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              >
                Về Góc Học Tập
              </button>
            )}
          </div>
        </div>

        {/* Detailed Station Table */}
        <div className="bg-[#0c1222] border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-3">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Chi Tiết Từng Trạm Thi
          </h3>

          <div className="space-y-2">
            {examSummary.details?.map((item: any, idx: number) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs ${
                  item.isCorrect
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-7 h-7 rounded-lg font-mono font-bold flex items-center justify-center shrink-0 ${
                    item.isCorrect ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    #{idx + 1}
                  </span>
                  <div>
                    <div className="font-bold text-white">
                      Trả lời: {item.userAnswer || <span className="italic text-slate-500">Chưa nhập</span>}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Đáp án chuẩn: <strong className="text-slate-200">{item.officialAnswer}</strong>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-1.5 font-bold">
                  {item.isCorrect ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Đúng
                    </span>
                  ) : (
                    <span className="text-rose-400 flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> Sai
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
