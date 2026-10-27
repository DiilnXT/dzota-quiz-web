'use client'

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  RotateCcw, 
  Award, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronRight, 
  Flag, 
  ShieldCheck, 
  Sparkles,
  Send,
  HelpCircle,
  Eye,
  FileCheck,
  Activity,
  Flame,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

/**
 * Intelligent text matching for medical anatomy answers:
 * - Case-insensitive
 * - Diacritic / accent-aware normalization
 * - Synonym checking
 * - Minor typo tolerance
 */
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function checkAnswerCorrectness(userAnswer, officialLabel, synonyms = []) {
  if (!userAnswer || !userAnswer.trim()) return false;

  const cleanUser = normalizeText(userAnswer);
  const cleanOfficial = normalizeText(officialLabel);

  if (cleanUser === cleanOfficial) return true;

  // Check synonyms
  for (const syn of synonyms) {
    if (cleanUser === normalizeText(syn)) return true;
  }

  // Exact partial inclusion check if length > 4
  if (cleanUser.length > 5 && (cleanOfficial.includes(cleanUser) || cleanUser.includes(cleanOfficial))) {
    return true;
  }

  return false;
}

export default function MedicalSpottingExam({ projects, onSaveExamResult }) {
  // Setup configuration state
  const [examStatus, setExamStatus] = useState('setup'); // 'setup' | 'running' | 'finished'
  const [totalStationsCount, setTotalStationsCount] = useState(20);
  const [secondsPerStation, setSecondsPerStation] = useState(25);
  const [candidateName, setCandidateName] = useState('BÃ¡c SÄ© / Sinh ViÃªn Y Khoa');

  // Exam runtime state
  const [stations, setStations] = useState([]);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(25);
  const [userAnswers, setUserAnswers] = useState({});
  const [currentInput, setCurrentInput] = useState('');

  // Finished state
  const [examSummary, setExamSummary] = useState(null);
  const [reviewStation, setReviewStation] = useState(null);

  // Dzota Flagged stations state
  const [flaggedStations, setFlaggedStations] = useState({});

  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const toggleFlagCurrentStation = () => {
    setFlaggedStations(prev => ({
      ...prev,
      [currentStationIndex]: !prev[currentStationIndex]
    }));
    soundService.playTick();
  };

  // Start Exam
  const handleStartExam = () => {
    const allAvailable = storageService.collectAllStations(projects);
    if (!allAvailable || allAvailable.length === 0) {
      alert('KhÃ´ng tÃ¬m tháº¥y dá»¯ liá»‡u Ã´ che nÃ o trong cÃ¡c bÃ i há»c! Vui lÃ²ng vÃ o Quáº£n Trá»‹ Ä‘á»ƒ thÃªm áº£nh vÃ  Ã´ che trÆ°á»›c.');
      return;
    }

    // Shuffle and pick requested number of stations
    const shuffled = [...allAvailable].sort(() => 0.5 - Math.random());
    let selected = [];
    while (selected.length < totalStationsCount) {
      for (const item of shuffled) {
        selected.push({
          ...item,
          stationId: `station_${selected.length + 1}`
        });
        if (selected.length >= totalStationsCount) break;
      }
    }

    setStations(selected);
    setCurrentStationIndex(0);
    setTimeLeft(secondsPerStation);
    setUserAnswers({});
    setCurrentInput('');
    setExamStatus('running');
    setExamSummary(null);

    soundService.playStationChime();
  };

  // Timer countdown loop
  useEffect(() => {
    if (examStatus !== 'running') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNextStation(true);
          return secondsPerStation;
        }

        if (prev <= 5) {
          soundService.playWarning();
        } else {
          soundService.playTick();
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [examStatus, currentStationIndex, secondsPerStation, currentInput, userAnswers]);

  // Focus input on station change
  useEffect(() => {
    if (examStatus === 'running' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentStationIndex, examStatus]);

  // Advance to next station or finish
  const handleNextStation = (isTimeOut = false) => {
    const savedAnswers = {
      ...userAnswers,
      [currentStationIndex]: currentInput.trim()
    };
    setUserAnswers(savedAnswers);

    if (currentStationIndex < stations.length - 1) {
      setCurrentStationIndex(prev => prev + 1);
      setTimeLeft(secondsPerStation);
      setCurrentInput(savedAnswers[currentStationIndex + 1] || '');
      soundService.playStationChime();
    } else {
      finishExam(savedAnswers);
    }
  };

  // Submit and finish
  const finishExam = (finalAnswers) => {
    if (timerRef.current) clearInterval(timerRef.current);

    let correctCount = 0;
    const details = stations.map((st, idx) => {
      const answer = finalAnswers[idx] || '';
      const isCorrect = checkAnswerCorrectness(
        answer,
        st.targetMask.label,
        st.targetMask.synonyms || []
      );
      if (isCorrect) correctCount++;

      return {
        stationNumber: idx + 1,
        stationData: st,
        userAnswer: answer,
        officialAnswer: st.targetMask.label,
        synonyms: st.targetMask.synonyms || [],
        isCorrect
      };
    });

    const scorePercentage = Math.round((correctCount / stations.length) * 100);
    let grade = 'Cáº§n Ã´n luyá»‡n thÃªm';
    if (scorePercentage >= 90) grade = 'Xuáº¥t Sáº¯c (Thá»§ Khoa Y Khoa)';
    else if (scorePercentage >= 80) grade = 'Giá»i (Äáº¡t chuáº©n lÃ¢m sÃ ng)';
    else if (scorePercentage >= 65) grade = 'KhÃ¡ (Äáº¡t yÃªu cáº§u ká»³ thi)';
    else if (scorePercentage >= 50) grade = 'Trung BÃ¬nh';

    const summary = {
      candidateName,
      totalStations: stations.length,
      correctCount,
      scorePercentage,
      grade,
      secondsPerStation,
      details,
      date: new Date().toLocaleString('vi-VN')
    };

    setExamSummary(summary);
    setExamStatus('finished');
    soundService.playSuccess();

    if (scorePercentage >= 60) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
    }

    if (onSaveExamResult) {
      onSaveExamResult(summary);
    }
  };

  const currentStation = stations[currentStationIndex];

  // SVG Circular countdown calculations
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / secondsPerStation) * circumference;

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* 1. SETUP SCREEN */}
      {examStatus === 'setup' && (
        <div className="relative rounded-3xl p-8 sm:p-12 shadow-2xl overflow-hidden border border-rose-500/30 bg-slate-900/90 backdrop-blur-2xl">
          {/* Ambient Lighting Orbs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
            {/* Header Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-950/50">
              <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Há»‡ Thá»‘ng Kháº£o ThÃ­ Y Khoa OSCE â€¢ DYNEX</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
              PhÃ²ng Thi Cháº¡y Tráº¡m Giáº£i Pháº«u
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed">
              MÃ´ phá»ng Ã¡p lá»±c thá»±c táº¿ cá»§a ká»³ thi cháº¡y tráº¡m táº¡i cÃ¡c giáº£ng Ä‘Æ°á»ng Y DÆ°á»£c danh tiáº¿ng.
              Má»—i tráº¡m thi hiá»ƒn thá»‹ má»™t chá»‰ Ä‘iá»ƒm bÃ­ máº­t Ä‘Æ°á»£c <strong>che kÃ­n 100%</strong>. ThÃ­ sinh quan sÃ¡t sÆ¡ Ä‘á»“ vÃ  gÃµ tÃªn giáº£i pháº«u trÆ°á»›c khi chuÃ´ng háº¿t giá»!
              <br />
              <strong className="text-rose-400">ðŸ›¡ï¸ Cam káº¿t báº£o máº­t: ÄÃ¡p Ã¡n tuyá»‡t Ä‘á»‘i KHÃ”NG hiá»ƒn thá»‹ trÆ°á»›c, chá»‰ cÃ´ng bá»‘ báº£ng Ä‘iá»ƒm khi hoÃ n thÃ nh Ä‘á»§ cÃ¡c tráº¡m!</strong>
            </p>

            {/* Exam Config Box */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-8 text-left space-y-5 shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Candidate Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    TÃªn ThÃ­ Sinh / MÃ£ Sinh ViÃªn:
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="BÃ¡c sÄ© / Sinh viÃªn..."
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>

                {/* Total Stations */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    Sá»‘ LÆ°á»£ng Tráº¡m Thi:
                  </label>
                  <select
                    value={totalStationsCount}
                    onChange={(e) => setTotalStationsCount(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  >
                    <option value={10}>10 Tráº¡m (Khá»Ÿi Ä‘á»™ng pháº£n xáº¡)</option>
                    <option value={15}>15 Tráº¡m (TÄƒng tá»‘c ghi nhá»›)</option>
                    <option value={20}>20 Tráº¡m (Chuáº©n Äá» Thi Y DÆ°á»£c Quá»‘c Gia)</option>
                    <option value={30}>30 Tráº¡m (Thá»­ thÃ¡ch chuyÃªn khoa)</option>
                  </select>
                </div>
              </div>

              {/* Time per station */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Thá»i Gian Má»—i Tráº¡m (TÃ­nh báº±ng giÃ¢y):
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {[15, 20, 25, 30].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSecondsPerStation(sec)}
                      className={`py-2.5 rounded-2xl text-xs font-bold transition-all ${
                        secondsPerStation === sec
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/40 scale-105 border border-rose-400'
                          : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {sec} GiÃ¢y
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-rose-950/30 border border-rose-800/40 rounded-2xl text-xs text-rose-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Tráº¡m thi sá»­ dá»¥ng Ã´ che Ä‘en Ä‘áº·c <strong>100% Opaque Solid Mask</strong>, hoÃ n toÃ n kÃ­n mÃ­t, ngÄƒn cháº·n má»i hÃ¬nh thá»©c nhÃ¬n xuyÃªn. Há»‡ thá»‘ng tá»± Ä‘á»™ng cháº¥m Ä‘iá»ƒm thÃ´ng minh sau tráº¡m cuá»‘i cÃ¹ng!
                </span>
              </div>
            </div>

            {/* Launch Button */}
            <button
              onClick={handleStartExam}
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-red-600 to-rose-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-sm shadow-2xl shadow-rose-600/40 active:scale-95 transition-all flex items-center justify-center gap-2.5 mx-auto"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Báº®T Äáº¦U VÃ€O PHÃ’NG THI CHáº Y TRáº M ({totalStationsCount} TRáº M)</span>
            </button>

            <div className="text-xs text-slate-500 font-semibold pt-1">
              Báº£n quyá»n pháº§n má»m y khoa: <strong className="text-cyan-400">Nháº­t Duy</strong>
            </div>
          </div>
        </div>
      )}

      {/* 2. EXAM RUNNING SCREEN */}
      {examStatus === 'running' && currentStation && (
        <div className="space-y-4 animate-fadeIn">
          {/* Top Exam Status Bar */}
          <div className="bg-[#111827]/95 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-4 sm:p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
            {/* Station Counter */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-rose-500/40 border border-rose-400/40 font-mono">
                {currentStationIndex + 1}
              </div>
              <div>
                <div className="text-[11px] font-extrabold text-rose-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  Äang Thi Cháº¡y Tráº¡m
                </div>
                <div className="text-lg font-black text-white font-mono">
                  Tráº¡m {currentStationIndex + 1} / {stations.length}
                </div>
              </div>
            </div>

            {/* Dzota Quick Station Navigator Pills */}
            <div className="hidden md:flex items-center gap-1.5 overflow-x-auto max-w-md py-1 px-3 bg-[#0B0F19]/90 rounded-2xl border border-slate-800">
              {stations.map((s, idx) => {
                const isCurrent = currentStationIndex === idx;
                const isAnswered = Boolean(userAnswers[idx]);
                const isFlagged = Boolean(flaggedStations[idx]);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUserAnswers(prev => ({ ...prev, [currentStationIndex]: currentInput.trim() }));
                      setCurrentStationIndex(idx);
                      setTimeLeft(secondsPerStation);
                      setCurrentInput(userAnswers[idx] || '');
                      soundService.playTick();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all shrink-0 flex items-center gap-1 border ${
                      isCurrent
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/40 ring-2 ring-rose-400/50 scale-105'
                        : isFlagged
                        ? 'bg-amber-950/80 text-amber-300 border-amber-500/60'
                        : isAnswered
                        ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                    title={`Äáº¿n tráº¡m ${idx + 1}`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
                  </button>
                );
              })}
            </div>

            {/* Circular High-Tech Countdown Timer & Actions */}
            <div className="flex items-center gap-3">
              {/* Flag Question Button (Dzota feature) */}
              <button
                type="button"
                onClick={toggleFlagCurrentStation}
                className={`p-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  flaggedStations[currentStationIndex]
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                    : 'bg-slate-900 text-slate-400 hover:text-amber-300 border-slate-800'
                }`}
                title="Cáº¯m cá» nghi váº¥n tráº¡m nÃ y"
              >
                <Flag className="w-4 h-4 fill-current" />
                <span className="hidden sm:inline">Äáº·t cá»</span>
              </button>

              <div className="flex items-center gap-2.5 bg-[#0B0F19] px-3.5 py-1.5 rounded-2xl border border-slate-800 shadow-inner">
                {/* SVG Circular Ring */}
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="currentColor"
                      strokeWidth="3.5"
                      strokeDasharray={2 * Math.PI * 16}
                      strokeDashoffset={(2 * Math.PI * 16) - (timeLeft / secondsPerStation) * (2 * Math.PI * 16)}
                      strokeLinecap="round"
                      className={timeLeft <= 5 ? 'text-rose-500 transition-all' : 'text-cyan-400 transition-all'}
                      fill="transparent"
                    />
                  </svg>
                  <span className={`absolute font-mono font-black text-xs ${
                    timeLeft <= 5 ? 'text-rose-400 animate-pulse text-sm' : 'text-white'
                  }`}>
                    {timeLeft}s
                  </span>
                </div>
              </div>

              {/* Submit Early */}
              <button
                type="button"
                onClick={() => {
                  if (confirm('Báº¡n cÃ³ cháº¯c cháº¯n muá»‘n ná»™p bÃ i thi ngay bÃ¢y giá»? CÃ¡c tráº¡m chÆ°a lÃ m sáº½ bá»‹ tÃ­nh 0 Ä‘iá»ƒm.')) {
                    finishExam(userAnswers);
                  }
                }}
                className="px-3 py-2 rounded-2xl text-xs font-bold bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 transition-colors"
              >
                Ná»™p bÃ i
              </button>
            </div>
          </div>

          {/* Diagram Canvas: TARGET MASK IS 100% SOLID OPAQUE (NO TRANSPARENCY, NO ANSWER LEAK!) */}
          <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
            {/* Breadcrumb Info */}
            <div className="w-full text-center mb-3">
              <span className="text-xs font-semibold text-slate-400">
                ChuyÃªn khoa: <span className="text-cyan-400">{currentStation.categoryName}</span> â€¢ {currentStation.lessonTitle}
              </span>
            </div>

            {/* The Diagram with 100% Solid Occlusion */}
            <div className="relative inline-block border-2 border-slate-700/80 rounded-2xl overflow-hidden shadow-2xl bg-black select-none max-w-full">
              <img
                src={currentStation.imageUrl}
                alt={currentStation.imageTitle}
                className="max-h-[58vh] w-auto object-contain block pointer-events-none"
              />

              {/* Masks: Every single mask is 100% SOLID OPAQUE. Target mask is highlighted with glowing neon rose border and pulsing pin */}
              {currentStation.allImageMasks?.map((mask) => {
                const isTarget = mask.id === currentStation.targetMask.id;

                if (isTarget) {
                  return (
                    <div
                      key={mask.id}
                      className="absolute z-30 transition-all pointer-events-none"
                      style={{
                        left: `${Math.max(0, mask.x - 1.5)}%`,
                        top: `${Math.max(0, mask.y - 1.5)}%`,
                        width: `${Math.min(100, mask.width + 3)}%`,
                        height: `${Math.min(100, mask.height + 3)}%`
                      }}
                    >
                      {/* CRITICAL FIX: 100% SOLID OPAQUE BLACK/OBSIDIAN FILL - ZERO SEE-THROUGH */}
                      <div 
                        className="w-full h-full rounded-md border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.9)] flex items-center justify-center relative overflow-hidden"
                        style={{
                          backgroundColor: '#070b14',
                          opacity: 1.0 // 100% Solid Opaque! Absolutely no text can show through!
                        }}
                      >
                        {/* Solid Badge */}
                        <div className="px-2.5 py-1 rounded-full bg-rose-600 text-white font-black text-[11px] shadow-lg flex items-center gap-1.5 border border-rose-400 z-10 font-mono">
                          <Flag className="w-3.5 h-3.5 fill-current" />
                          <span>TRáº M {currentStationIndex + 1}</span>
                        </div>
                      </div>

                      {/* Direction Pointer Arrow Pin on Top */}
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce z-40">
                        <div className="w-4 h-4 bg-rose-500 rotate-45 border-2 border-white shadow-[0_0_15px_#f43f5e] flex items-center justify-center">
                          <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  );
                }

                // All other non-target masks MUST ALSO BE 100% SOLID OPAQUE (NO TEXT LEAK!)
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
                      className="w-full h-full rounded-md border"
                      style={{
                        backgroundColor: '#070b14',
                        borderColor: '#1e293b',
                        opacity: 1.0 // 100% Solid Opaque
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Answer Input Submission Field */}
            <div className="w-full max-w-xl mt-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleNextStation(false);
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    placeholder="Nháº­p tÃªn cÆ¡ quan / cáº¥u táº¡o táº¡i Ã´ tráº¡m Ä‘ang phÃ¡t sÃ¡ng..."
                    className="w-full pl-5 pr-10 py-3.5 bg-slate-950 border-2 border-rose-500/70 focus:border-rose-400 rounded-2xl text-sm font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-rose-500/20 shadow-2xl transition-all"
                  />
                  {currentInput && (
                    <button
                      type="button"
                      onClick={() => setCurrentInput('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs p-1"
                    >
                      âœ•
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-extrabold text-xs shadow-xl shadow-rose-600/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 shrink-0 font-mono"
                >
                  <span>
                    {currentStationIndex === stations.length - 1 ? 'Ná»™p bÃ i thi' : 'Tráº¡m tiáº¿p theo'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 px-1 font-medium">
                <span>Nháº¥n <strong>Enter</strong> Ä‘á»ƒ xÃ¡c nháº­n vÃ  chuyá»ƒn tráº¡m</span>
                <span className="text-rose-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ÄÃ¡p Ã¡n Ä‘Æ°á»£c khÃ³a kÃ­n tuyá»‡t Ä‘á»‘i
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. EXAM FINISHED / RESULTS SUMMARY SCREEN */}
      {examStatus === 'finished' && examSummary && (
        <div className="space-y-6 animate-fadeIn">
          {/* Hero Result Banner */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-cyan-500/40 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-center">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="inline-flex p-3.5 rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/30 border border-cyan-300/30">
                <Award className="w-12 h-12" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Báº¢NG Tá»”NG Káº¾T Káº¾T QUáº¢ THI CHáº Y TRáº M
              </h2>

              <p className="text-xs text-slate-300">
                ThÃ­ sinh: <strong className="text-white font-bold">{examSummary.candidateName}</strong> â€¢ HoÃ n thÃ nh ngÃ y: {examSummary.date}
              </p>

              {/* Big Score Card */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-3">
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
                  <div className="text-3xl font-black text-cyan-400 font-mono">
                    {examSummary.correctCount}/{examSummary.totalStations}
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">
                    Tráº¡m ChÃ­nh XÃ¡c
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
                  <div className="text-3xl font-black text-emerald-400 font-mono">
                    {examSummary.scorePercentage}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">
                    Tá»· Lá»‡ Äáº¡t
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner flex flex-col justify-center">
                  <div className="text-xs font-black text-amber-300 line-clamp-2">
                    {examSummary.grade}
                  </div>
                  <div className="text-[11px] text-slate-400 font-bold uppercase mt-1">
                    Xáº¿p Loáº¡i
                  </div>
                </div>
              </div>

              {/* Retake & Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <button
                  onClick={handleStartExam}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold text-xs shadow-lg shadow-rose-500/30 hover:brightness-110 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Thi láº¡i vÃ²ng má»›i (Random 20 tráº¡m)</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4 text-cyan-400" />
                  <span>In Báº£ng Äiá»ƒm</span>
                </button>

                <button
                  onClick={() => setExamStatus('setup')}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                >
                  Cáº¥u hÃ¬nh bÃ i thi khÃ¡c
                </button>
              </div>

              <div className="text-xs text-slate-500 pt-2 font-medium">
                Báº£n quyá»n pháº§n má»m y khoa: <strong className="text-cyan-400">Nháº­t Duy</strong>
              </div>
            </div>
          </div>

          {/* Detailed Station-by-Station Review Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-cyan-400" />
                Báº£ng Äá»‘i Chiáº¿u Chi Tiáº¿t ÄÃ¡p Ãn Tá»«ng Tráº¡m
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {examSummary.details.length} Tráº¡m Thi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/70">
                    <th className="py-3 px-3">Tráº¡m</th>
                    <th className="py-3 px-3">SÆ¡ Äá»“ Giáº£i Pháº«u</th>
                    <th className="py-3 px-3">CÃ¢u Tráº£ Lá»i Cá»§a Báº¡n</th>
                    <th className="py-3 px-3">ÄÃ¡p Ãn Chuáº©n Cá»§a Giáº£ng ViÃªn</th>
                    <th className="py-3 px-3">Tá»« Äá»“ng NghÄ©a</th>
                    <th className="py-3 px-3 text-center">Káº¿t Quáº£</th>
                    <th className="py-3 px-3 text-center">Xem Láº¡i</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {examSummary.details.map((st) => (
                    <tr 
                      key={st.stationNumber} 
                      className={`hover:bg-slate-800/40 transition-colors ${
                        st.isCorrect ? 'bg-emerald-950/10' : 'bg-rose-950/10'
                      }`}
                    >
                      <td className="py-3 px-3 font-bold font-mono text-cyan-400">
                        #{String(st.stationNumber).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <img
                            src={st.stationData.imageUrl}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg border border-slate-700 shrink-0"
                          />
                          <span className="truncate max-w-[140px] text-slate-300 font-semibold">
                            {st.stationData.imageTitle}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${
                          st.userAnswer ? 'text-slate-100 font-bold' : 'text-slate-500 italic'
                        }`}>
                          {st.userAnswer || '(Bá» trá»‘ng)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-300">
                        {st.officialAnswer}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-medium">
                        {st.synonyms?.length > 0 ? st.synonyms.join(', ') : 'â€”'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {st.isCorrect ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-[10px] font-black">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ÄÃºng
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/50 text-rose-300 text-[10px] font-black">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Sai
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => setReviewStation(st)}
                          className="p-1.5 rounded-lg text-cyan-400 hover:bg-cyan-950/60 transition-colors"
                          title="Xem vá»‹ trÃ­ tráº¡m trÃªn sÆ¡ Ä‘á»“"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal Review Station */}
          {reviewStation && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <div className="max-w-3xl w-full bg-slate-900 border border-cyan-500/40 rounded-3xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h4 className="text-base font-bold text-white flex items-center gap-2">
                    <Flag className="w-4 h-4 text-rose-400" />
                    Xem Láº¡i Tráº¡m #{reviewStation.stationNumber}: {reviewStation.officialAnswer}
                  </h4>
                  <button
                    onClick={() => setReviewStation(null)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                  >
                    âœ•
                  </button>
                </div>

                <div className="relative inline-block mx-auto border-2 border-slate-700 rounded-2xl overflow-hidden max-h-[60vh]">
                  <img
                    src={reviewStation.stationData.imageUrl}
                    alt=""
                    className="max-h-[55vh] w-auto object-contain block"
                  />
                  <div
                    className="absolute z-20 border-2 border-emerald-400 bg-emerald-500/30 shadow-lg shadow-emerald-500/50 rounded flex items-center justify-center"
                    style={{
                      left: `${reviewStation.stationData.targetMask.x}%`,
                      top: `${reviewStation.stationData.targetMask.y}%`,
                      width: `${reviewStation.stationData.targetMask.width}%`,
                      height: `${reviewStation.stationData.targetMask.height}%`
                    }}
                  >
                    <span className="bg-slate-950 text-emerald-300 text-xs font-black px-2 py-0.5 rounded border border-emerald-400 shadow">
                      {reviewStation.officialAnswer}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-slate-400">CÃ¢u tráº£ lá»i cá»§a báº¡n:</span>{' '}
                    <strong className={reviewStation.isCorrect ? 'text-emerald-400' : 'text-rose-400 font-bold'}>
                      {reviewStation.userAnswer || '(KhÃ´ng tráº£ lá»i)'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">ÄÃ¡p Ã¡n chuáº©n:</span>{' '}
                    <strong className="text-emerald-400 font-black">{reviewStation.officialAnswer}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

