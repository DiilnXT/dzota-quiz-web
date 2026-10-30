'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Timer,
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCw,
  Award,
  ChevronRight,
  ChevronLeft,
  Volume2,
  VolumeX,
  Play,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Layers,
  X,
  Eye,
  Check,
  Stethoscope,
  Filter,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Pill,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DrugItem } from './types';
import { sounds } from './soundEffects';

interface ChayTramViewProps {
  drugs: (DrugItem & { isCustom?: boolean })[];
  broadGroups: [string, number][];
  onClose: () => void;
  onOpenDetailModal: (drug: DrugItem) => void;
  onLaunchFlashcardsWithIds?: (ids: number[]) => void;
}

interface StationQuestion {
  drug: DrugItem;
  questionType: 'nhom' | 'chidiinh' | 'chongchidiinh' | 'thoidiem' | 'hoatchat';
  questionTitle: string;
  correctAnswer: string;
  correctLetter: string; // 'A' | 'B' | 'C' | 'D'
  options: { letter: string; text: string }[];
}

interface StationResult {
  stationIndex: number;
  drug: DrugItem;
  questionType: 'nhom' | 'chidiinh' | 'chongchidiinh' | 'thoidiem' | 'hoatchat';
  questionTitle: string;
  correctAnswer: string;
  correctLetter: string;
  options: { letter: string; text: string }[];
  userAnswer: string | null; // null if timed out
  userLetter: string | null;
  isCorrect: boolean;
  score: number; // 10 if correct, 0 if incorrect
  timeSpentSeconds: number;
}

export default function ChayTramView({
  drugs,
  broadGroups,
  onClose,
  onOpenDetailModal,
  onLaunchFlashcardsWithIds
}: ChayTramViewProps) {
  // ── Setup Configuration States ──
  const [stationCount, setStationCount] = useState<number>(10);
  const [stationTimeSeconds, setStationTimeSeconds] = useState<number>(45);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // ── Exam Progress States ──
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(stationTimeSeconds);
  const [examFinished, setExamFinished] = useState<boolean>(false);
  const [results, setResults] = useState<StationResult[]>([]);

  // ── Current Station Interaction States ──
  // User selects an option: locked immediately ("k dc sửa lại"), no right/wrong reveal ("k bt đáp án đúng sai"), auto-next ("next trạm khi chọn xong")
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // ── Results Filter & Expansion States ──
  const [resultFilter, setResultFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [expandedStationIds, setExpandedStationIds] = useState<Record<number, boolean>>({});

  // ── Active Generated Stations ──
  const [stations, setStations] = useState<StationQuestion[]>([]);

  // Refs to avoid race conditions with intervals & timeouts
  const transitionTimeoutRef = useRef<any>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const activeStationStartTimeRef = useRef<number>(Date.now());

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  // Toggle detail accordion in results view
  const toggleExpand = (idx: number) => {
    setExpandedStationIds(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // ── Generate Stations with 4 Clear Distractors (A, B, C, D) ──
  const generateExamStations = () => {
    let pool = [...drugs];
    if (selectedGroup !== 'ALL') {
      pool = pool.filter(d => d.broadGroup === selectedGroup);
    }
    if (pool.length === 0) pool = [...drugs];

    // Shuffle pool
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selectedDrugs = shuffledPool.slice(0, Math.min(stationCount, shuffledPool.length));

    const questionTypes: ('nhom' | 'chidiinh' | 'chongchidiinh' | 'thoidiem' | 'hoatchat')[] = [
      'nhom',
      'chidiinh',
      'chongchidiinh',
      'thoidiem',
      'hoatchat'
    ];

    const generatedStations: StationQuestion[] = selectedDrugs.map((drug, index) => {
      let qType = questionTypes[index % questionTypes.length];
      let questionTitle = '';
      let correctAnswer = '';
      let distractorField: keyof DrugItem = 'chiDinh';

      // Fallback if field is empty or non-informative
      if (qType === 'chongchidiinh' && (!drug.chongChiDinh || drug.chongChiDinh.length < 5)) {
        qType = 'chidiinh';
      }
      if (qType === 'thoidiem' && (!drug.thoiDiemDung || drug.thoiDiemDung.length < 5)) {
        qType = 'nhom';
      }

      if (qType === 'nhom') {
        questionTitle = `Thuốc "${drug.tenThuoc}" thuộc nhóm / phân nhóm dược lý nào dưới đây?`;
        correctAnswer = drug.nhomPhanNhomPho;
        distractorField = 'nhomPhanNhomPho';
      } else if (qType === 'chidiinh') {
        questionTitle = `Chỉ định điều trị chính / phác đồ ưu tiên của "${drug.tenThuoc}" là gì?`;
        correctAnswer = drug.chiDinh;
        distractorField = 'chiDinh';
      } else if (qType === 'chongchidiinh') {
        questionTitle = `Chống chỉ định quan trọng hoặc cảnh báo nguy hiểm của "${drug.tenThuoc}"?`;
        correctAnswer = drug.chongChiDinh;
        distractorField = 'chongChiDinh';
      } else if (qType === 'thoidiem') {
        questionTitle = `Thời điểm dùng vàng (nhịp sinh học) tối ưu nhất cho "${drug.tenThuoc}"?`;
        correctAnswer = drug.thoiDiemDung;
        distractorField = 'thoiDiemDung';
      } else {
        questionTitle = `Hoạt chất chính & hàm lượng bào chế của biệt dược "${drug.tenThuoc}" là gì?`;
        correctAnswer = `${drug.hoatChatHamLuong || drug.hoatChat} (${drug.dangBaoChe})`;
        distractorField = 'hoatChatHamLuong';
      }

      // Collect 3 distinct distractors from other drugs
      const otherDrugs = drugs.filter(
        d => d.id !== drug.id && d[distractorField] && d[distractorField] !== correctAnswer && String(d[distractorField]).trim().length > 3
      );
      const shuffledOthers = [...otherDrugs].sort(() => Math.random() - 0.5);

      const uniqueDistractors: string[] = [];
      for (const od of shuffledOthers) {
        let val = '';
        if (qType === 'hoatchat') {
          val = `${od.hoatChatHamLuong || od.hoatChat} (${od.dangBaoChe})`;
        } else {
          val = String(od[distractorField]).trim();
        }
        if (val && val !== correctAnswer && !uniqueDistractors.includes(val)) {
          uniqueDistractors.push(val);
        }
        if (uniqueDistractors.length === 3) break;
      }

      // If still fewer than 3 distractors, fill with any available texts
      while (uniqueDistractors.length < 3) {
        const dummy = `Dược chất đối chứng phân nhóm ${uniqueDistractors.length + 1}`;
        uniqueDistractors.push(dummy);
      }

      // Shuffle options and assign A, B, C, D letters
      const rawOptions = [correctAnswer, ...uniqueDistractors.slice(0, 3)].sort(() => Math.random() - 0.5);
      const letters = ['A', 'B', 'C', 'D'];
      const optionsWithLetters = rawOptions.map((text, idx) => ({
        letter: letters[idx],
        text
      }));

      const correctOpt = optionsWithLetters.find(o => o.text === correctAnswer) || optionsWithLetters[0];

      return {
        drug,
        questionType: qType,
        questionTitle,
        correctAnswer,
        correctLetter: correctOpt.letter,
        options: optionsWithLetters
      };
    });

    setStations(generatedStations);
    setCurrentStationIndex(0);
    setTimeLeft(stationTimeSeconds);
    setSelectedOptionText(null);
    setIsLocked(false);
    isTransitioningRef.current = false;
    setResults([]);
    setExamFinished(false);
    setHasStarted(true);
    setShowExitConfirm(false);
    activeStationStartTimeRef.current = Date.now();
  };

  // ── Advance to Next Station (or Finish Exam) ──
  const advanceStation = useCallback(
    (userPick: string | null) => {
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      const curStation = stations[currentStationIndex];
      if (!curStation) return;

      const userOpt = userPick ? curStation.options.find(o => o.text === userPick) : null;
      const isCorrect = userPick !== null && userPick === curStation.correctAnswer;
      const timeSpent = Math.max(1, Math.min(stationTimeSeconds, Math.round((Date.now() - activeStationStartTimeRef.current) / 1000)));

      const resultItem: StationResult = {
        stationIndex: currentStationIndex,
        drug: curStation.drug,
        questionType: curStation.questionType,
        questionTitle: curStation.questionTitle,
        correctAnswer: curStation.correctAnswer,
        correctLetter: curStation.correctLetter,
        options: curStation.options,
        userAnswer: userPick,
        userLetter: userOpt ? userOpt.letter : null,
        isCorrect,
        score: isCorrect ? 10 : 0,
        timeSpentSeconds: timeSpent
      };

      setResults(prev => [...prev, resultItem]);

      // Move to next station or show scorecard
      if (currentStationIndex < stations.length - 1) {
        setCurrentStationIndex(prev => prev + 1);
        setTimeLeft(stationTimeSeconds);
        setSelectedOptionText(null);
        setIsLocked(false);
        isTransitioningRef.current = false;
        activeStationStartTimeRef.current = Date.now();
      } else {
        // Complete the exam!
        setExamFinished(true);
        isTransitioningRef.current = false;
        sounds.playCorrect();
      }
    },
    [stations, currentStationIndex, stationTimeSeconds]
  );

  // ── Handle User Option Click ──
  // Rules:
  // 1. "bấm vào k bt đáp án đúng sai" -> only selected styling, no red/green
  // 2. "k dc sửa lại" -> immediately lock options
  // 3. "next trạm khi chọn xong" -> auto advance in 320ms
  const handleSelectOption = (optText: string) => {
    if (isLocked || isTransitioningRef.current || examFinished) return;

    setIsLocked(true);
    setSelectedOptionText(optText);
    sounds.playTap();

    // Smooth 320ms micro-transition so student feels selection register, then immediately jump to next station
    if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    transitionTimeoutRef.current = setTimeout(() => {
      advanceStation(optText);
    }, 320);
  };

  // ── Station Timer Countdown ──
  // Rule: "hết thời gian mỗi trạm tự động next câu"
  useEffect(() => {
    if (!hasStarted || examFinished || isLocked) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        // Warning tick on last 5 seconds
        if (prev <= 6 && prev > 1) {
          sounds.playTick(prev <= 3);
        }

        // When timer hits 0: Ring station bell & auto advance with null answer
        if (prev <= 1) {
          clearInterval(interval);
          sounds.playStationBell();
          setIsLocked(true);
          // Advance immediately on time up
          advanceStation(null);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [hasStarted, examFinished, isLocked, currentStationIndex, advanceStation]);

  // Clean up any pending timeouts on unmount
  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) clearTimeout(transitionTimeoutRef.current);
    };
  }, []);

  // ── Metrics Calculations for Result Screen ──
  const finalScore = useMemo(() => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return Math.round((sum / results.length) * 10) / 10;
  }, [results]);

  const correctCount = useMemo(() => results.filter(r => r.isCorrect).length, [results]);
  const incorrectCount = useMemo(() => results.filter(r => !r.isCorrect && r.userAnswer !== null).length, [results]);
  const timedOutCount = useMemo(() => results.filter(r => r.userAnswer === null).length, [results]);
  const averageTimeSpent = useMemo(() => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.timeSpentSeconds, 0);
    return Math.round(sum / results.length);
  }, [results]);

  const wrongResults = useMemo(() => results.filter(r => !r.isCorrect), [results]);

  const displayedResults = useMemo(() => {
    if (resultFilter === 'wrong') return results.filter(r => !r.isCorrect);
    if (resultFilter === 'correct') return results.filter(r => r.isCorrect);
    return results;
  }, [results, resultFilter]);

  // Time formatter mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const activeStation = stations[currentStationIndex];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-md flex flex-col justify-between text-slate-900 dark:text-slate-100 select-none animate-in fade-in-50 duration-200"
      style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION & PROGRESS HEADER (Dzota Test Style)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0E1726]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Thin progress bar across top edge */}
        {hasStarted && !examFinished && stations.length > 0 && (
          <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
            <div
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 h-1 transition-all duration-300"
              style={{
                width: `${Math.round(((currentStationIndex) / stations.length) * 100)}%`
              }}
            />
          </div>
        )}

        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Brand & Station Progress Pill */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="flex items-center gap-2 bg-[#17324D] text-white px-3 py-1.5 rounded-xl shadow-xs shrink-0">
              <Stethoscope className="w-4 h-4 text-cyan-300" />
              <span className="font-extrabold text-xs sm:text-sm tracking-tight hidden sm:inline">
                Dzota OSCE
              </span>
            </div>

            {hasStarted && !examFinished ? (
              <div className="flex items-center gap-2 min-w-0">
                <span className="px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-cyan-300 font-extrabold text-xs sm:text-sm whitespace-nowrap">
                  TRẠM {currentStationIndex + 1} / {stations.length}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                  • {activeStation?.drug?.broadGroup}
                </span>
              </div>
            ) : (
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                Mô Phỏng Thi Chạy Trạm Dược Lý Chuông Reo
              </span>
            )}
          </div>

          {/* Center: Live Station Countdown Clock Pill (Focus Medical Pro Style) */}
          {hasStarted && !examFinished && (
            <div className="flex items-center">
              <div
                className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-2xl font-mono text-sm sm:text-base font-black flex items-center gap-2 border transition-all shadow-xs ${
                  timeLeft <= 5
                    ? 'bg-rose-600 text-white border-rose-700 animate-bounce shadow-rose-500/30 shadow-md ring-2 ring-rose-300'
                    : timeLeft <= 15
                    ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 border-amber-300 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-[#17324D] dark:text-cyan-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-white' : timeLeft <= 15 ? 'text-amber-600' : 'text-blue-600 dark:text-cyan-400'}`} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
          )}

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                soundEnabled
                  ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
              }`}
              title={soundEnabled ? 'Chuông reo: Đang BẬT' : 'Chuông reo: Đang TẮT'}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                if (hasStarted && !examFinished) {
                  setShowExitConfirm(true);
                } else {
                  onClose();
                }
              }}
              className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-500 transition cursor-pointer"
              title="Đóng / Thoát phòng chạy trạm"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN BODY: SETUP SCREEN / ACTIVE STATION / RESULTS
      ───────────────────────────────────────────────────────────── */}
      <main className="max-w-4xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 flex-1 flex flex-col justify-center">
        
        {/* ─── CASE A: SETUP SCREEN (Chuẩn Dzota Test Setup) ─── */}
        {!hasStarted && (
          <div className="bg-white dark:bg-[#0E1726] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-10 space-y-7 animate-in zoom-in-95 duration-200">
            {/* Header / Hero */}
            <div className="text-center space-y-2.5 max-w-2xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-800 dark:text-cyan-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>Mô Phỏng Phòng Thi Chạy Trạm Chuẩn Y Khoa OSCE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#17324D] dark:text-white tracking-tight">
                CẤU HÌNH BÀI THI CHẠY TRẠM
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Mỗi trạm thi là một mẫu thuốc lâm sàng ngẫu nhiên. Khi bạn chọn đáp án, hệ thống sẽ <strong>tự động chuyển ngay sang trạm tiếp theo và không thể sửa lại</strong>. Khi hết thời gian, <strong>chuông reo sẽ vang lên</strong> và tự động chuyển trạm.
              </p>
            </div>

            {/* Exam Rules Pill Banner */}
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-950 dark:text-amber-200 space-y-2 text-xs sm:text-sm">
              <div className="font-extrabold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Quy chế thi Chạy Trạm (OSCE) nghiêm ngặt:</span>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-amber-900/90 dark:text-amber-200/90 list-disc list-inside">
                <li>Bấm vào phương án sẽ khóa ngay, <strong>không thể sửa lại</strong>.</li>
                <li>Hệ thống <strong>không tiết lộ đúng/sai</strong> trong lúc làm bài.</li>
                <li>Tự động chuyển trạm ngay sau khi bạn bấm chọn (~300ms).</li>
                <li>Hết giờ trạm, <strong>chuông sẽ reo và tự động next câu</strong>.</li>
              </ul>
            </div>

            {/* Config Selectors Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              
              {/* Option 1: Number of stations */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="font-extrabold text-[#17324D] dark:text-slate-200 block text-xs uppercase tracking-wider">
                  1. Số lượng trạm thi:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[5, 10, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setStationCount(cnt)}
                      className={`py-2.5 px-2 rounded-xl font-bold transition border cursor-pointer ${
                        stationCount === cnt
                          ? 'bg-[#17324D] text-white border-[#17324D] shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cnt} trạm {cnt === 10 ? '⭐' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Time per station */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="font-extrabold text-[#17324D] dark:text-slate-200 block text-xs uppercase tracking-wider">
                  2. Thời gian mỗi trạm:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[30, 45, 60, 90].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setStationTimeSeconds(sec)}
                      className={`py-2.5 px-2 rounded-xl font-bold transition border cursor-pointer ${
                        stationTimeSeconds === sec
                          ? 'bg-[#087F8C] text-white border-[#087F8C] shadow-sm'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sec} giây {sec === 45 ? '(OSCE)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Drug Group Scope */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <label className="font-extrabold text-[#17324D] dark:text-slate-200 block text-xs uppercase tracking-wider">
                  3. Phạm vi nhóm thuốc:
                </label>
                <select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold outline-none cursor-pointer text-xs"
                >
                  <option value="ALL">🎲 Toàn bộ ngân hàng ({drugs.length} thuốc)</option>
                  {broadGroups.map(([gName, count]) => (
                    <option key={gName} value={gName}>
                      {gName} ({count} thuốc)
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  {selectedGroup === 'ALL' ? 'Chọn ngẫu nhiên câu hỏi từ tất cả các chuyên đề dược lý.' : `Giới hạn trong ${selectedGroup}.`}
                </p>
              </div>

            </div>

            {/* Launch CTA Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={generateExamStations}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-base shadow-xl flex items-center justify-center gap-2.5 mx-auto active:scale-95 transition cursor-pointer"
              >
                <Play className="w-5 h-5 fill-current text-amber-200" />
                <span>BẮT ĐẦU VÀO PHÒNG CHẠY TRẠM ({stationCount} TRẠM • {stationTimeSeconds}S/TRẠM)</span>
              </button>
            </div>
          </div>
        )}

        {/* ─── CASE B: ACTIVE STATION EXAM RUN (Giao Diện Chuẩn Test Dzota) ─── */}
        {hasStarted && !examFinished && activeStation && (
          <div className="bg-white dark:bg-[#0E1726] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-8 space-y-5 animate-in fade-in-50 duration-150 relative">
            
            {/* Station Clinical Header Badge */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-cyan-300 text-xs font-extrabold uppercase tracking-wide">
                <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-cyan-400 animate-ping" />
                <span>TRẠM SỐ {currentStationIndex + 1} / {stations.length}</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {activeStation.drug.broadGroup}
              </span>
            </div>

            {/* Drug Monograph Clinical Display Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-[#131F33] border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                <span>MẪU THUỐC TIẾP NHẬN TẠI TRẠM:</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] dark:text-white tracking-tight">
                {activeStation.drug.tenThuoc}
              </h2>

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                {activeStation.drug.dangBaoChe && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-700 dark:text-slate-200">
                    Dạng: {activeStation.drug.dangBaoChe}
                  </span>
                )}
                {activeStation.drug.hoatChatHamLuong && activeStation.questionType !== 'hoatchat' && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-indigo-700 dark:text-indigo-300">
                    Hàm lượng: {activeStation.drug.hoatChatHamLuong}
                  </span>
                )}
                {activeStation.drug.nhomPhanNhomPho && activeStation.questionType !== 'nhom' && (
                  <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    {activeStation.drug.nhomPhanNhomPho}
                  </span>
                )}
              </div>
            </div>

            {/* Station Question Prompt (High Contrast, Bold, Clear) */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-[#17324D] text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  ?
                </span>
                <div className="flex-1 text-[16px] sm:text-[18px] font-extrabold text-[#17324D] dark:text-slate-100 leading-snug">
                  {activeStation.questionTitle}
                </div>
              </div>
            </div>

            {/* Options List (A, B, C, D) - Focus Medical Pro Style */}
            {/* RULES:
                - "bấm vào k bt đáp án đúng sai": NO red/green colors shown!
                - "k dc sửa lại": Locked immediately upon click!
                - "next trạm khi chọn xong": Auto-advances in 320ms!
            */}
            <div className="space-y-2.5 sm:space-y-3 pt-1">
              {activeStation.options.map((opt) => {
                const isSelected = selectedOptionText === opt.text;

                return (
                  <div
                    key={opt.letter}
                    onClick={() => handleSelectOption(opt.text)}
                    className={`min-h-[58px] p-3.5 sm:p-4 rounded-2xl border-2 transition-all flex items-center gap-3.5 cursor-pointer active:scale-[0.99] ${
                      isSelected
                        ? 'bg-indigo-50/90 dark:bg-indigo-950/70 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-200 dark:ring-indigo-900 shadow-md'
                        : isLocked
                        ? 'opacity-60 bg-white dark:bg-[#131F33] border-slate-200 dark:border-slate-800 pointer-events-none'
                        : 'bg-white dark:bg-[#131F33] hover:bg-slate-50 dark:hover:bg-[#182740] border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {/* Option Letter Badge (A, B, C, D) */}
                    <span
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {opt.letter}
                    </span>

                    {/* Option Text */}
                    <span className="font-times text-[15px] sm:text-[16.5px] leading-relaxed flex-1 font-semibold text-[#17324D] dark:text-slate-100">
                      {opt.text}
                    </span>

                    {/* Selected Indicator Checkmark (Neutral Blue - No right/wrong reveal!) */}
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs animate-in zoom-in-75">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bottom Status Hint */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Chọn xong hệ thống sẽ tự động chuyển trạm (không thể sửa lại)</span>
              </div>
              <span className="font-mono text-[11px]">
                {timeLeft}s còn lại
              </span>
            </div>

          </div>
        )}

        {/* ─── CASE C: FINAL OSCE SCORECARD & QUESTION-BY-QUESTION REVIEW ─── */}
        {examFinished && (
          <div className="bg-white dark:bg-[#0E1726] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200">
            
            {/* Hero Result Banner */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Award className="w-8 h-8" />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17324D] dark:text-white tracking-tight">
                KẾT QUẢ KỲ THI CHẠY TRẠM DƯỢC LÝ (OSCE)
              </h1>
              
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Đã hoàn thành {results.length} trạm thi • Thời gian trung bình: {averageTimeSpent}s / trạm
              </p>
            </div>

            {/* Overall Score Badge */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-900/40 border border-blue-200 dark:border-blue-900/60 max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-around gap-4 text-center">
              <div>
                <div className="text-3xl sm:text-4xl font-black text-[#17324D] dark:text-cyan-300 font-mono">
                  {finalScore} <span className="text-lg text-slate-500 dark:text-slate-400 font-normal">/ 10</span>
                </div>
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mt-0.5">
                  Điểm Số Toàn Đợt
                </div>
              </div>

              <div className="h-10 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-extrabold ${
                    finalScore >= 8.5
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                      : finalScore >= 7.0
                      ? 'bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-cyan-300'
                      : finalScore >= 5.0
                      ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  {finalScore >= 8.5 ? '🏆 XUẤT SẮC • ĐẠT OSCE' : finalScore >= 7.0 ? '⭐ GIỎI • ĐẠT OSCE' : finalScore >= 5.0 ? '✓ KHÁ • ĐẠT YÊU CẦU' : '⚠️ CẦN ÔN TẬP THÊM'}
                </span>
                <div className="text-xs text-slate-500 mt-1">
                  {correctCount} / {results.length} trạm đạt chuẩn
                </div>
              </div>
            </div>

            {/* 4 Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-xs">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-center">
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {correctCount}
                </div>
                <div className="font-bold text-emerald-900 dark:text-emerald-300 mt-0.5">Trạm Làm Đúng</div>
              </div>

              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-center">
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
                  {incorrectCount}
                </div>
                <div className="font-bold text-rose-900 dark:text-rose-300 mt-0.5">Trạm Làm Sai</div>
              </div>

              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-center">
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {timedOutCount}
                </div>
                <div className="font-bold text-amber-900 dark:text-amber-300 mt-0.5">Trạm Hết Giờ (Bỏ lỡ)</div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 text-center">
                <div className="text-2xl font-black text-blue-700 dark:text-cyan-300 font-mono">
                  {averageTimeSpent}s
                </div>
                <div className="font-bold text-blue-900 dark:text-cyan-200 mt-0.5">T.Gian Trung Bình</div>
              </div>
            </div>

            {/* ── QUESTION-BY-QUESTION REVIEW LIST ── */}
            <div className="space-y-4 pt-2">
              
              {/* Filter Tabs & Title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-[#17324D] dark:text-white">
                    Đối Chiếu Chi Tiết Từng Câu Hỏi
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-mono font-bold text-slate-600 dark:text-slate-300">
                    {displayedResults.length} trạm
                  </span>
                </div>

                {/* Filter Pills */}
                <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setResultFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      resultFilter === 'all'
                        ? 'bg-white dark:bg-[#131F33] text-[#17324D] dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({results.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultFilter('wrong')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                      resultFilter === 'wrong'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                    }`}
                  >
                    <span>Câu sai & bỏ lỡ</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 text-[10px]">
                      {wrongResults.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResultFilter('correct')}
                    className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                      resultFilter === 'correct'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                    }`}
                  >
                    Câu đúng ({correctCount})
                  </button>
                </div>
              </div>

              {/* Station Review Cards */}
              <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
                {displayedResults.map((r) => {
                  const isExpanded = !!expandedStationIds[r.stationIndex];

                  return (
                    <div
                      key={r.stationIndex}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        r.isCorrect
                          ? 'bg-white dark:bg-[#0E1726] border-emerald-300 dark:border-emerald-900/60 shadow-xs'
                          : r.userAnswer === null
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900/60'
                          : 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                      }`}
                    >
                      {/* Top Station Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 ${
                              r.isCorrect
                                ? 'bg-emerald-600 text-white'
                                : r.userAnswer === null
                                ? 'bg-amber-500 text-white'
                                : 'bg-rose-600 text-white'
                            }`}
                          >
                            #{r.stationIndex + 1}
                          </span>
                          <div>
                            <h4 className="font-extrabold text-sm sm:text-base text-[#17324D] dark:text-white">
                              {r.drug.tenThuoc}
                            </h4>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {r.drug.broadGroup} • {r.drug.dangBaoChe}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="text-right">
                          {r.isCorrect ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-extrabold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>ĐÚNG (+10đ)</span>
                            </span>
                          ) : r.userAnswer === null ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-extrabold">
                              <Clock className="w-3.5 h-3.5" />
                              <span>HẾT GIỜ (0đ)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-extrabold">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>SAI (0đ)</span>
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Làm trong {r.timeSpentSeconds}s
                          </div>
                        </div>
                      </div>

                      {/* Station Question Prompt */}
                      <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 my-2 leading-relaxed">
                        ❓ {r.questionTitle}
                      </div>

                      {/* User's Choice vs Correct Answer Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 text-xs">
                        
                        {/* Candidate Answer */}
                        <div
                          className={`p-2.5 rounded-xl border flex items-start gap-2 ${
                            r.isCorrect
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                              : r.userAnswer === null
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                          }`}
                        >
                          <span className="font-extrabold shrink-0">
                            {r.isCorrect ? '✅ Bạn chọn:' : r.userAnswer === null ? '⏱️ Bạn chọn:' : '❌ Bạn chọn:'}
                          </span>
                          <span className="font-semibold flex-1">
                            {r.userAnswer ? `[${r.userLetter}] ${r.userAnswer}` : 'Không kịp chọn (hết giờ)'}
                          </span>
                        </div>

                        {/* Official Correct Answer */}
                        <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 flex items-start gap-2">
                          <span className="font-extrabold text-emerald-700 dark:text-emerald-400 shrink-0">
                            🎯 Đáp án chuẩn:
                          </span>
                          <span className="font-bold flex-1 text-emerald-900 dark:text-emerald-100">
                            [{r.correctLetter}] {r.correctAnswer}
                          </span>
                        </div>

                      </div>

                      {/* Expandable Full Clinical Monograph Details */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.stationIndex)}
                          className="text-blue-700 dark:text-cyan-300 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isExpanded ? 'Thu gọn dược lý' : 'Xem đối chiếu dược lý lâm sàng'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => onOpenDetailModal(r.drug)}
                          className="text-slate-600 dark:text-slate-400 hover:text-blue-600 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <span>Xem sổ tay đầy đủ</span>
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Expanded Pharmacology Breakdown */}
                      {isExpanded && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs leading-relaxed animate-in fade-in-50">
                          <div>
                            <strong className="text-indigo-900 dark:text-indigo-300">🧪 Hoạt chất – Hàm lượng:</strong>{' '}
                            <span>{r.drug.hoatChatHamLuong || r.drug.hoatChat}</span>
                          </div>
                          {r.drug.taDuoc && (
                            <div>
                              <strong className="text-purple-900 dark:text-purple-300">💊 Tá dược:</strong>{' '}
                              <span>{r.drug.taDuoc}</span>
                            </div>
                          )}
                          <div>
                            <strong className="text-emerald-900 dark:text-emerald-400">🎯 Chỉ định:</strong>{' '}
                            <span>{r.drug.chiDinh}</span>
                          </div>
                          <div>
                            <strong className="text-rose-900 dark:text-rose-400">⛔ Chống chỉ định:</strong>{' '}
                            <span>{r.drug.chongChiDinh}</span>
                          </div>
                          <div>
                            <strong className="text-amber-900 dark:text-amber-400">⚠️ Tác dụng phụ:</strong>{' '}
                            <span>{r.drug.tacDungPhu}</span>
                          </div>
                          <div>
                            <strong className="text-cyan-900 dark:text-cyan-400">⏰ Thời điểm dùng:</strong>{' '}
                            <span>{r.drug.thoiDiemDung}</span>
                          </div>
                          <div>
                            <strong className="text-slate-800 dark:text-slate-200">💡 Ghi chú & Tương tác:</strong>{' '}
                            <span>{r.drug.ghiChu}</span>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bottom Action Footer Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {/* Left Action: Launch Flashcards for Wrong Drugs */}
              <div>
                {wrongResults.length > 0 && onLaunchFlashcardsWithIds && (
                  <button
                    type="button"
                    onClick={() => onLaunchFlashcardsWithIds(wrongResults.map(r => r.drug.id))}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                  >
                    <BookOpen className="w-4 h-4 text-violet-200" />
                    <span>Ôn {wrongResults.length} Thuốc Làm Sai Bằng Flashcard</span>
                  </button>
                )}
              </div>

              {/* Right Action: Retake or Change Config */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={generateExamStations}
                  className="px-4 py-2.5 rounded-xl bg-[#17324D] hover:bg-[#0A1929] text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Thi Lại Lượt Mới</span>
                </button>

                <button
                  type="button"
                  onClick={() => setHasStarted(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm transition cursor-pointer"
                >
                  Đổi Cấu Hình
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ─────────────────────────────────────────────────────────────
          3. EXIT CONFIRMATION MODAL (If in middle of exam)
      ───────────────────────────────────────────────────────────── */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0E1726] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 max-w-sm w-full text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                Rời khỏi bài thi chạy trạm?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Bạn đang ở trạm {currentStationIndex + 1}/{stations.length}. Nếu thoát ngay lúc này, tiến trình thi sẽ không được lưu lại.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
              >
                Tiếp Tục Thi
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition"
              >
                Thoát Phòng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. FOOTER COPYRIGHT BRANDING
      ───────────────────────────────────────────────────────────── */}
      <footer className="py-2 text-center text-xs text-slate-400 dark:text-slate-500">
        <span>Bản quyền mô phỏng chạy trạm: <strong>Nhật Duy • Sinh viên Y Khoa K26</strong></span>
      </footer>
    </div>
  );
}
