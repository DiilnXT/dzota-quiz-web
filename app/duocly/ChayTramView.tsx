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
  Stethoscope
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
  questionType: 'nhom' | 'chidiinh' | 'chongchidiinh' | 'thoidiem';
  questionTitle: string;
  correctAnswer: string;
  options: string[];
}

interface StationResult {
  stationIndex: number;
  drug: DrugItem;
  userAnswer?: string;
  isCorrect: boolean;
  score: number; // 0 to 10
  timeSpentSeconds: number;
}

export default function ChayTramView({
  drugs,
  broadGroups,
  onClose,
  onOpenDetailModal,
  onLaunchFlashcardsWithIds
}: ChayTramViewProps) {
  // Setup Configuration States
  const [stationCount, setStationCount] = useState<number>(10);
  const [stationTimeSeconds, setStationTimeSeconds] = useState<number>(60);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [examMode, setExamMode] = useState<'mcq' | 'self_eval'>('mcq');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Exam Progress States
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [currentStationIndex, setCurrentStationIndex] = useState<number>(0);
  const [timeLeft, setTimeLeft] = useState<number>(stationTimeSeconds);
  const [isStationFinished, setIsStationFinished] = useState<boolean>(false);
  const [examFinished, setExamFinished] = useState<boolean>(false);
  const [results, setResults] = useState<StationResult[]>([]);

  // Active Station Answer State
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [selfScore, setSelfScore] = useState<number | null>(null);
  const [showAnswerSheet, setShowAnswerSheet] = useState<boolean>(false);

  // Active Station Question Data
  const [stations, setStations] = useState<StationQuestion[]>([]);

  // Sound toggle
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  // Generate Stations based on setup
  const generateExamStations = () => {
    let pool = [...drugs];
    if (selectedGroup !== 'ALL') {
      pool = pool.filter(d => d.broadGroup === selectedGroup);
    }
    if (pool.length === 0) pool = [...drugs];

    // Shuffle pool
    const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
    const selectedDrugs = shuffledPool.slice(0, Math.min(stationCount, shuffledPool.length));

    // Question types to rotate through
    const questionTypes: ('nhom' | 'chidiinh' | 'chongchidiinh' | 'thoidiem')[] = [
      'nhom',
      'chidiinh',
      'chongchidiinh',
      'thoidiem'
    ];

    const generatedStations: StationQuestion[] = selectedDrugs.map((drug, index) => {
      const qType = questionTypes[index % questionTypes.length];
      let questionTitle = '';
      let correctAnswer = '';
      let distractorField: keyof DrugItem = 'chiDinh';

      if (qType === 'nhom') {
        questionTitle = `Thuốc "${drug.tenThuoc}" thuộc nhóm / phân nhóm dược lý nào?`;
        correctAnswer = drug.nhomPhanNhomPho;
        distractorField = 'nhomPhanNhomPho';
      } else if (qType === 'chidiinh') {
        questionTitle = `Chỉ định điều trị chuẩn của thuốc "${drug.tenThuoc}" là gì?`;
        correctAnswer = drug.chiDinh;
        distractorField = 'chiDinh';
      } else if (qType === 'chongChiDinh') {
        questionTitle = `Chống chỉ định quan trọng hoặc cảnh báo nguy hiểm của "${drug.tenThuoc}"?`;
        correctAnswer = drug.chongChiDinh;
        distractorField = 'chongChiDinh';
      } else {
        questionTitle = `Thời điểm dùng vàng (nhịp sinh học) tốt nhất cho "${drug.tenThuoc}"?`;
        correctAnswer = drug.thoiDiemDung;
        distractorField = 'thoiDiemDung';
      }

      // Pick 3 random distractors from different drugs
      const otherDrugs = drugs.filter(d => d.id !== drug.id && d[distractorField] && d[distractorField] !== correctAnswer);
      const shuffledOthers = [...otherDrugs].sort(() => Math.random() - 0.5).slice(0, 3);
      const options = [correctAnswer, ...shuffledOthers.map(d => String(d[distractorField]))].sort(
        () => Math.random() - 0.5
      );

      return {
        drug,
        questionType: qType,
        questionTitle,
        correctAnswer,
        options
      };
    });

    setStations(generatedStations);
    setCurrentStationIndex(0);
    setTimeLeft(stationTimeSeconds);
    setSelectedAnswer(null);
    setSelfScore(null);
    setShowAnswerSheet(false);
    setResults([]);
    setExamFinished(false);
    setHasStarted(true);
  };

  // Station Timer Effect
  useEffect(() => {
    if (!hasStarted || examFinished || isStationFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        // Play tick sound on last 5 seconds
        if (prev <= 6 && prev > 1) {
          sounds.playTick(prev <= 3);
        }

        // When time is up (Chuông chuyển trạm kêu BENG BENG!)
        if (prev <= 1) {
          clearInterval(timer);
          sounds.playStationBell();
          handleStationTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, examFinished, isStationFinished, currentStationIndex]);

  // Handle station time up
  const handleStationTimeUp = useCallback(() => {
    const curStation = stations[currentStationIndex];
    if (!curStation) return;

    let isCorrect = false;
    let score = 0;

    if (examMode === 'mcq') {
      isCorrect = selectedAnswer === curStation.correctAnswer;
      score = isCorrect ? 10 : 0;
    } else {
      score = selfScore !== null ? selfScore : 0;
      isCorrect = score >= 7;
    }

    const result: StationResult = {
      stationIndex: currentStationIndex,
      drug: curStation.drug,
      userAnswer: selectedAnswer || 'Không kịp trả lời',
      isCorrect,
      score,
      timeSpentSeconds: stationTimeSeconds - timeLeft
    };

    setResults(prev => [...prev, result]);
    setIsStationFinished(true);
  }, [stations, currentStationIndex, examMode, selectedAnswer, selfScore, stationTimeSeconds, timeLeft]);

  // Submit Active Station manually before time expires
  const handleSubmitStation = () => {
    handleStationTimeUp();
  };

  // Move to next station
  const handleNextStation = () => {
    if (currentStationIndex < stations.length - 1) {
      setCurrentStationIndex(prev => prev + 1);
      setTimeLeft(stationTimeSeconds);
      setSelectedAnswer(null);
      setSelfScore(null);
      setShowAnswerSheet(false);
      setIsStationFinished(false);
    } else {
      setExamFinished(true);
    }
  };

  // Current Station Data
  const activeStation = stations[currentStationIndex];

  // Total Score Calculation
  const averageScore = useMemo(() => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return Math.round((sum / results.length) * 10) / 10;
  }, [results]);

  const correctCount = results.filter(r => r.isCorrect).length;
  const incorrectResults = results.filter(r => !r.isCorrect);

  // Time formatting mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 text-slate-900 dark:text-slate-100 select-none"
      style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-2 border-slate-300 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-amber-600 to-orange-600 text-white font-extrabold text-xs sm:text-sm shadow">
            <Timer className="w-4 h-4 text-amber-200 animate-pulse" />
            <span>THI CHẠY TRẠM DƯỢC LÝ (OSCE)</span>
          </div>

          {hasStarted && !examFinished && (
            <div className="flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
              <span>Trạm:</span>
              <span className="font-mono text-sm px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-cyan-300 border border-blue-200">
                {currentStationIndex + 1} / {stations.length}
              </span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
            title={soundEnabled ? 'Tắt tiếng chuông' : 'Bật tiếng chuông'}
          >
            {soundEnabled ? <Bell className="w-4 h-4 text-amber-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 hover:bg-rose-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            title="Thoát phòng chạy trạm (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. MAIN CONTENT: SETUP SCREEN OR ACTIVE STATION OR RESULTS
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center my-auto py-2">
        {!hasStarted ? (
          /* ── SETUP SCREEN ── */
          <div className="bg-white dark:bg-[#0B1120] p-6 sm:p-8 rounded-3xl border-2 border-amber-400 dark:border-amber-600 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-300 text-xs font-bold border border-amber-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Mô phỏng kỳ thi chạy trạm chuông reo chuẩn Y Khoa</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 dark:text-white">
                CẤU HÌNH PHÒNG THI CHẠY TRẠM
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                Ở mỗi trạm, bạn sẽ đối mặt với một mẫu thuốc lâm sàng và câu hỏi trọng tâm. Khi đồng hồ đếm ngược hết giờ, <strong>chuông reo sẽ vang lên</strong> và chuyển sang trạm tiếp theo!
              </p>
            </div>

            {/* Config Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* Option 1: Number of stations */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-y-2">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block">
                  1. Số lượng trạm thi:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setStationCount(cnt)}
                      className={`py-2 rounded-xl font-bold transition border ${
                        stationCount === cnt
                          ? 'bg-blue-700 text-white border-blue-800 shadow'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                      }`}
                    >
                      {cnt} trạm
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 2: Time per station */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-y-2">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block">
                  2. Thời gian mỗi trạm:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 45, 60, 90].map(sec => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setStationTimeSeconds(sec)}
                      className={`py-2 rounded-xl font-bold transition border ${
                        stationTimeSeconds === sec
                          ? 'bg-amber-600 text-white border-amber-700 shadow'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                      }`}
                    >
                      {sec}s {sec === 60 ? '(Chuẩn)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Option 3: Drug Group Scope */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-y-2">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block">
                  3. Phạm vi nhóm thuốc trạm:
                </label>
                <select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold outline-none"
                >
                  <option value="ALL">🎲 Ngẫu Nhiên Toàn Bộ ({drugs.length} thuốc)</option>
                  {broadGroups.map(([gName, count]) => (
                    <option key={gName} value={gName}>
                      {gName} ({count} thuốc)
                    </option>
                  ))}
                </select>
              </div>

              {/* Option 4: Exam Mode */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-y-2">
                <label className="font-extrabold text-slate-800 dark:text-slate-200 block">
                  4. Hình thức làm bài:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExamMode('mcq')}
                    className={`p-2.5 rounded-xl font-bold text-xs transition border text-left ${
                      examMode === 'mcq'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    <div>🔘 Trắc nghiệm nhanh</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Chọn 1 trong 4 phương án</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setExamMode('self_eval')}
                    className={`p-2.5 rounded-xl font-bold text-xs transition border text-left ${
                      examMode === 'self_eval'
                        ? 'bg-emerald-700 text-white border-emerald-800 shadow'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300'
                    }`}
                  >
                    <div>✍️ Tự luận đối chiếu</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Tự nhẩm & đối chiếu thang điểm</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2 text-center">
              <button
                onClick={generateExamStations}
                className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-extrabold text-base shadow-xl flex items-center gap-2 mx-auto active:scale-95 transition"
              >
                <Play className="w-5 h-5 text-amber-200 fill-current" />
                <span>BẮT ĐẦU VÀO PHÒNG CHẠY TRẠM (GỒM {stationCount} TRẠM)</span>
              </button>
            </div>
          </div>
        ) : examFinished ? (
          /* ── OSCE FINAL SCORECARD ── */
          <div className="bg-white dark:bg-[#0B1120] p-6 sm:p-8 rounded-3xl border-2 border-emerald-400 dark:border-emerald-600 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300">
                <Award className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-blue-950 dark:text-white">
                BẢNG ĐIỂM TỔNG KẾT THI CHẠY TRẠM
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Kỳ thi chạy trạm Dược lý Lâm sàng ({results.length} trạm • {stationTimeSeconds}s/trạm)
              </p>
            </div>

            {/* Score Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-center">
                <div className="text-2xl sm:text-3xl font-black text-blue-700 dark:text-cyan-300 font-mono">
                  {averageScore} / 10
                </div>
                <div className="text-[11px] font-bold text-blue-900 dark:text-cyan-200 mt-0.5">Điểm Trung Bình</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-center">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">
                  {correctCount}
                </div>
                <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mt-0.5">Trạm Đạt Chuẩn</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-center">
                <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
                  {results.length - correctCount}
                </div>
                <div className="text-[11px] font-bold text-rose-900 dark:text-rose-300 mt-0.5">Trạm Chưa Đạt</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-center">
                <div className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  {averageScore >= 9.0 ? 'Xuất Sắc' : averageScore >= 8.0 ? 'Giỏi' : averageScore >= 6.5 ? 'Khá' : 'Cần Ôn'}
                </div>
                <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 mt-0.5">Xếp Loại OSCE</div>
              </div>
            </div>

            {/* Station-by-station table breakdown */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2.5 text-center w-12">Trạm</th>
                    <th className="p-2.5">Tên Thuốc</th>
                    <th className="p-2.5">Nội Dung Kiểm Tra</th>
                    <th className="p-2.5 text-center w-20">Kết Quả</th>
                    <th className="p-2.5 text-center w-20">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-2.5 text-center font-bold">#{r.stationIndex + 1}</td>
                      <td className="p-2.5 font-bold text-blue-900 dark:text-cyan-300">{r.drug.tenThuoc}</td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">{r.drug.nhomPhanNhomPho}</td>
                      <td className="p-2.5 text-center">
                        {r.isCorrect ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            ĐẠT ({r.score}đ)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold text-[10px]">
                            CHƯA ĐẠT
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => onOpenDetailModal(r.drug)}
                          className="text-blue-600 hover:underline font-bold"
                        >
                          Xem 👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {incorrectResults.length > 0 && onLaunchFlashcardsWithIds && (
                <button
                  onClick={() => onLaunchFlashcardsWithIds(incorrectResults.map(r => r.drug.id))}
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-1.5 active:scale-95 transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Ôn {incorrectResults.length} Thuốc Chưa Đạt Qua Flashcard</span>
                </button>
              )}
              <button
                onClick={generateExamStations}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-1.5 active:scale-95 transition"
              >
                <RotateCw className="w-4 h-4" />
                <span>Chạy Lại Kỳ Thi Mới</span>
              </button>
              <button
                onClick={() => setHasStarted(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs sm:text-sm shadow active:scale-95 transition"
              >
                Đổi Cấu Hình
              </button>
            </div>
          </div>
        ) : (
          /* ── ACTIVE STATION EXAM RUN ── */
          <div className="bg-white dark:bg-[#0B1120] rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl flex flex-col justify-between overflow-hidden">
            
            {/* Station Status & Countdown Timer Bar */}
            <div className="p-3.5 sm:p-4 bg-slate-100 dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                  TRẠM THI {currentStationIndex + 1} / {stations.length}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-cyan-300">
                  {activeStation.drug.broadGroup}
                </span>
              </div>

              {/* Countdown Clock Display */}
              <div className="flex items-center gap-2">
                <div
                  className={`px-3 py-1 rounded-xl font-mono text-base sm:text-lg font-black flex items-center gap-1.5 border transition-all ${
                    timeLeft <= 5
                      ? 'bg-rose-600 text-white border-rose-700 animate-bounce'
                      : timeLeft <= 15
                      ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                      : 'bg-white dark:bg-slate-800 text-blue-900 dark:text-cyan-300 border-slate-300 dark:border-slate-700'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              </div>
            </div>

            {/* Station Content Body */}
            <div className="p-5 sm:p-7 space-y-4">
              {/* Clinical Prompt Header */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                <div className="text-[11px] font-bold text-blue-900 dark:text-cyan-300 uppercase flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>CA LÂM SÀNG / MẪU THUỐC TIẾP NHẬN TẠI TRẠM:</span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-blue-950 dark:text-white mt-1">
                  {activeStation.drug.tenThuoc}
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Dạng bào chế: <strong>{activeStation.drug.dangBaoChe}</strong> • Hàm lượng: <strong>{activeStation.drug.hoatChatHamLuong}</strong>
                </div>
              </div>

              {/* Station Core Question */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 flex items-start gap-1.5">
                  <span className="text-amber-500">❓</span>
                  <span>{activeStation.questionTitle}</span>
                </h3>
              </div>

              {/* Option Mode 1: MCQ Selection */}
              {examMode === 'mcq' ? (
                <div className="space-y-2 pt-1">
                  {activeStation.options.map((opt, oIdx) => {
                    const isSelected = selectedAnswer === opt;
                    const letter = String.fromCharCode(65 + oIdx);

                    return (
                      <button
                        key={oIdx}
                        disabled={isStationFinished}
                        onClick={() => setSelectedAnswer(opt)}
                        className={`w-full p-3 rounded-2xl text-left text-xs sm:text-sm font-semibold transition border flex items-start gap-2.5 active:scale-98 ${
                          isSelected
                            ? 'bg-blue-700 text-white border-blue-800 shadow-md ring-2 ring-blue-400'
                            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-800'
                        } ${isStationFinished && opt === activeStation.correctAnswer ? 'bg-emerald-600 text-white border-emerald-700' : ''}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold font-mono text-xs flex-shrink-0 ${
                          isSelected ? 'bg-blue-900 text-cyan-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                        }`}>
                          {letter}
                        </span>
                        <span className="leading-snug">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                /* Option Mode 2: Self-Evaluation / Clinical Sheet */
                <div className="space-y-3 pt-1">
                  <p className="text-xs text-slate-500">
                    Hãy tự nhẩm hoặc ghi nhớ câu trả lời trước khi hết thời gian, sau đó đối chiếu đáp án chuẩn bên dưới:
                  </p>
                  
                  {!showAnswerSheet ? (
                    <button
                      onClick={() => setShowAnswerSheet(true)}
                      className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Hiện Đáp Án Trạm Để Tự Chấm Điểm</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-xs sm:text-sm space-y-2">
                      <div className="font-extrabold text-emerald-900 dark:text-emerald-300">
                        ĐÁP ÁN CHUẨN CỦA TRẠM:
                      </div>
                      <div className="font-semibold text-emerald-950 dark:text-emerald-100">
                        {activeStation.correctAnswer}
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <span className="font-bold text-slate-700 dark:text-slate-300 text-xs">Tự đánh giá:</span>
                        {[10, 8, 5, 0].map(sc => (
                          <button
                            key={sc}
                            onClick={() => setSelfScore(sc)}
                            className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                              selfScore === sc
                                ? 'bg-emerald-700 text-white border-emerald-800'
                                : 'bg-white dark:bg-slate-800 text-slate-700 border-slate-300'
                            }`}
                          >
                            {sc === 10 ? 'Đúng (10đ)' : sc === 8 ? 'Khá (8đ)' : sc === 5 ? 'Một phần (5đ)' : 'Sai (0đ)'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Detailed Station Answer Sheet when finished */}
              {isStationFinished && (
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 text-xs text-amber-950 dark:text-amber-100 flex items-center justify-between">
                  <div>
                    <strong>HẾT GIỜ TRẠM NÀY!</strong> Đáp án đúng: <strong>{activeStation.correctAnswer}</strong>
                  </div>
                  <button
                    onClick={() => onOpenDetailModal(activeStation.drug)}
                    className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-bold text-xs"
                  >
                    Xem 12 trường ↗
                  </button>
                </div>
              )}
            </div>

            {/* Station Bottom Navigation & Action Bar */}
            <div className="p-3.5 bg-slate-100 dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="text-xs text-slate-500 font-semibold">
                Chuông chuyển trạm sẽ tự reo khi hết giờ
              </div>

              <div className="flex items-center gap-2">
                {!isStationFinished ? (
                  <button
                    onClick={handleSubmitStation}
                    disabled={examMode === 'mcq' && !selectedAnswer}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow flex items-center gap-1.5 active:scale-95 transition disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    <span>Nộp Trạm Này (Xong Sớm)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleNextStation}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-lg flex items-center gap-2 active:scale-95 transition"
                  >
                    <span>
                      {currentStationIndex < stations.length - 1 ? 'Chuyển Sang Trạm Tiếp Theo' : 'Xem Bảng Điểm Tổng Kết'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. FOOTER BRANDING & INSTRUCTION
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto text-center text-xs text-slate-400 pt-1 pb-1">
        <span>Bản quyền mô phỏng chạy trạm: <strong>Nhật Duy • Y Khoa K26</strong></span>
      </div>
    </div>
  );
}
