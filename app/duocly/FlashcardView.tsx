'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RotateCw,
  Check,
  X,
  Volume2,
  VolumeX,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Star,
  Sparkles,
  Award,
  Layers,
  FlaskConical,
  Clock,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { DrugItem } from './types';
import { sounds } from './soundEffects';

interface FlashcardViewProps {
  drugs: (DrugItem & { isCustom?: boolean })[];
  broadGroups: [string, number][];
  onClose: () => void;
  favorites: number[];
  onToggleFavorite: (id: number) => void;
  onOpenDetailModal: (drug: DrugItem) => void;
}

export default function FlashcardView({
  drugs,
  broadGroups,
  onClose,
  favorites,
  onToggleFavorite,
  onOpenDetailModal
}: FlashcardViewProps) {
  // Selected Group for Flashcards
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Filtered drug deck for flashcards
  const deck = useMemo(() => {
    let list = [...drugs];
    if (selectedGroup === 'FAVORITES') {
      list = list.filter(d => favorites.includes(d.id));
    } else if (selectedGroup !== 'ALL') {
      list = list.filter(d => d.broadGroup === selectedGroup);
    }
    return list;
  }, [drugs, selectedGroup, favorites]);

  // Session state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [rememberedIds, setRememberedIds] = useState<number[]>([]);
  const [forgottenIds, setForgottenIds] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  // Active Drug in card
  const currentDrug = deck[currentIndex];

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  // Flip card
  const handleFlip = useCallback(() => {
    sounds.playCardFlip();
    setIsFlipped(prev => !prev);
  }, []);

  // Shuffle deck
  const handleShuffle = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedIds([]);
    setForgottenIds([]);
    setIsFinished(false);
  };

  // Next / Previous navigation
  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < deck.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Mark Remembered (Đã nhớ)
  const handleMarkRemembered = useCallback(() => {
    if (!currentDrug) return;
    sounds.playCorrect();
    setRememberedIds(prev => (prev.includes(currentDrug.id) ? prev : [...prev, currentDrug.id]));
    setForgottenIds(prev => prev.filter(id => id !== currentDrug.id));
    handleNext();
  }, [currentDrug, currentIndex, deck.length]);

  // Mark Forgotten (Chưa nhớ)
  const handleMarkForgotten = useCallback(() => {
    if (!currentDrug) return;
    sounds.playIncorrect();
    setForgottenIds(prev => (prev.includes(currentDrug.id) ? prev : [...prev, currentDrug.id]));
    setRememberedIds(prev => prev.filter(id => id !== currentDrug.id));
    handleNext();
  }, [currentDrug, currentIndex, deck.length]);

  // Reset Session for current group
  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedIds([]);
    setForgottenIds([]);
    setIsFinished(false);
  };

  // Review only forgotten cards
  const handleReviewForgotten = () => {
    setSelectedGroup('FORGOTTEN_ONLY');
    setCurrentIndex(0);
    setIsFlipped(false);
    setIsFinished(false);
  };

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFinished) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        handleMarkForgotten();
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        handleMarkRemembered();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip, handleMarkForgotten, handleMarkRemembered, isFinished, onClose]);

  // Reset index when group changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setRememberedIds([]);
    setForgottenIds([]);
    setIsFinished(false);
  }, [selectedGroup]);

  // Progress calculations
  const progressPercent = deck.length > 0 ? Math.round(((currentIndex) / deck.length) * 100) : 0;
  const isFav = currentDrug ? favorites.includes(currentDrug.id) : false;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex flex-col justify-between p-2 sm:p-4 text-slate-900 dark:text-slate-100 select-none"
      style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. FLASHCARD HEADER BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-2 border-slate-300 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Mode Title & Group Selector */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-700 text-white font-bold text-xs sm:text-sm shadow">
            <Layers className="w-4 h-4 text-cyan-200" />
            <span>FLASHCARD DƯỢC LÝ</span>
          </div>

          {/* Group Dropdown Selector */}
          <div className="relative">
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="text-xs sm:text-sm py-1.5 pl-2.5 pr-8 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-blue-400 dark:border-blue-700 font-bold text-blue-950 dark:text-cyan-300 outline-none cursor-pointer"
            >
              <option value="ALL">📚 Toàn Bộ Nhóm ({drugs.length} thuốc)</option>
              {favorites.length > 0 && (
                <option value="FAVORITES">⭐ Thuốc Đã Lưu ({favorites.length} thuốc)</option>
              )}
              {broadGroups.map(([groupName, count]) => (
                <option key={groupName} value={groupName}>
                  {groupName} ({count} thuốc)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Sound, Shuffle & Close Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
            title={soundEnabled ? 'Tắt âm thanh chuông' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Shuffle */}
          <button
            onClick={handleShuffle}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition"
            title="Bắt đầu lại nhóm này"
          >
            <Shuffle className="w-4 h-4 text-indigo-600" />
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-200 hover:bg-rose-600 hover:text-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            title="Đóng chế độ Flashcard (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. PROGRESS & METRICS BAR
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto my-2 px-1">
        <div className="flex items-center justify-between text-xs font-semibold mb-1.5 text-slate-300">
          <div className="flex items-center gap-2">
            <span>
              Thẻ: <strong className="text-white text-sm">{deck.length > 0 ? currentIndex + 1 : 0}</strong> / {deck.length}
            </span>
            <span>•</span>
            <span className="text-emerald-400">Đã nhớ: <strong>{rememberedIds.length}</strong></span>
            <span>•</span>
            <span className="text-rose-400">Cần ôn: <strong>{forgottenIds.length}</strong></span>
          </div>
          <div className="font-mono text-cyan-300">{progressPercent}%</div>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MAIN CARD DISPLAY OR COMPLETION SCREEN
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center my-auto py-2">
        {deck.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-slate-300 dark:border-slate-800 text-center shadow-xl space-y-4">
            <FlaskConical className="w-12 h-12 text-slate-400 mx-auto" />
            <h3 className="text-xl font-bold">Chưa có thuốc nào trong nhóm đã chọn</h3>
            <p className="text-sm text-slate-500">
              Vui lòng chọn nhóm thuốc khác hoặc chọn &quot;Toàn Bộ Nhóm&quot; để bắt đầu học flashcard.
            </p>
            <button
              onClick={() => setSelectedGroup('ALL')}
              className="px-5 py-2.5 rounded-xl bg-blue-700 text-white font-bold text-sm shadow"
            >
              Xem Toàn Bộ {drugs.length} Thuốc
            </button>
          </div>
        ) : isFinished ? (
          /* COMPLETION SUMMARY SCREEN */
          <div className="bg-white dark:bg-[#0B1120] p-6 sm:p-8 rounded-3xl border-2 border-emerald-400 dark:border-emerald-600 shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center border-2 border-emerald-300">
              <Award className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-blue-950 dark:text-white">
                HOÀN THÀNH PHIÊN HỌC FLASHCARD!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Nhóm: <strong className="text-blue-700 dark:text-cyan-300">{selectedGroup === 'ALL' ? 'Toàn Bộ Thuốc' : selectedGroup}</strong> ({deck.length} thẻ)
              </p>
            </div>

            {/* Scorecard */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-center">
                <div className="text-2xl font-black text-emerald-600">{rememberedIds.length}</div>
                <div className="text-xs text-emerald-900 dark:text-emerald-300 font-bold">Đã Thuộc Bài</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 text-center">
                <div className="text-2xl font-black text-rose-600">{forgottenIds.length}</div>
                <div className="text-xs text-rose-900 dark:text-rose-300 font-bold">Cần Ôn Lại</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 text-center col-span-2 sm:col-span-1">
                <div className="text-2xl font-black text-blue-700 dark:text-cyan-300">
                  {deck.length > 0 ? Math.round((rememberedIds.length / deck.length) * 100) : 0}%
                </div>
                <div className="text-xs text-blue-900 dark:text-cyan-200 font-bold">Độ Nhớ Bài</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              {forgottenIds.length > 0 && (
                <button
                  onClick={handleReviewForgotten}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md flex items-center gap-2 active:scale-95 transition"
                >
                  <RotateCw className="w-4 h-4" />
                  <span>Ôn Lại {forgottenIds.length} Thẻ Chưa Nhớ</span>
                </button>
              )}
              <button
                onClick={handleRestart}
                className="px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md flex items-center gap-2 active:scale-95 transition"
              >
                <RotateCw className="w-4 h-4" />
                <span>Học Lại Nhóm Này Từ Đầu</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm shadow active:scale-95 transition"
              >
                Quay Lại Bảng Tra Cứu
              </button>
            </div>
          </div>
        ) : (
          /* ACTIVE FLASHCARD CONTAINER (FLIPPABLE) */
          <div
            onClick={handleFlip}
            className="w-full bg-white dark:bg-[#0B1120] rounded-3xl border-2 border-slate-300 dark:border-slate-700 shadow-2xl cursor-pointer min-h-[380px] sm:min-h-[440px] max-h-[72vh] flex flex-col justify-between overflow-hidden transition-all duration-300 hover:border-blue-400 dark:hover:border-cyan-500"
          >
            {/* Top Bar of the Card */}
            <div className="p-3 sm:p-4 bg-slate-100 dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-cyan-300 border border-blue-200">
                  #{currentDrug.id}
                </span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {currentDrug.broadGroup}
                </span>
                {isFlipped ? (
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300">
                    MẶT SAU (ĐÁP ÁN)
                  </span>
                ) : (
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-300">
                    MẶT TRƯỚC (CÂU HỎI)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => onToggleFavorite(currentDrug.id)}
                  className={`p-1.5 rounded-lg border text-xs transition ${
                    isFav ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-slate-200 text-slate-500'
                  }`}
                  title={isFav ? 'Bỏ lưu' : 'Lưu thẻ này'}
                >
                  <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                </button>
                <button
                  onClick={() => onOpenDetailModal(currentDrug)}
                  className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100"
                  title="Mở toàn màn hình"
                >
                  Chi tiết ↗
                </button>
              </div>
            </div>

            {/* CARD BODY CONTENT */}
            {!isFlipped ? (
              /* ── FRONT OF THE CARD ── */
              <div className="p-6 sm:p-10 flex-1 flex flex-col justify-center items-center text-center space-y-4">
                <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                  TÊN THUỐC & BIỆT DƯỢC
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold text-blue-950 dark:text-cyan-300 tracking-tight leading-tight max-w-2xl">
                  {currentDrug.tenThuoc}
                </h2>
                <div className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Dạng bào chế: <strong className="text-slate-900 dark:text-white">{currentDrug.dangBaoChe}</strong>
                </div>

                {/* Stimulating clinical memory prompts */}
                <div className="mt-4 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs sm:text-sm text-left max-w-lg w-full space-y-2">
                  <div className="font-extrabold text-blue-900 dark:text-cyan-200 text-center mb-1 flex items-center justify-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span>CÂU HỎI TỰ GỢI NHỚ TRƯỚC KHI LẬT:</span>
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    ❓ <strong>Hoạt chất & tá dược chính</strong> của thuốc này là gì?
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    ❓ <strong>Chỉ định điều trị</strong> và <strong>Chống chỉ định nguy hiểm</strong> nào cần nhớ?
                  </div>
                  <div className="text-slate-700 dark:text-slate-300">
                    ❓ <strong>Thời điểm dùng vàng (Nhịp sinh học)</strong> và <strong>Tác dụng phụ</strong>?
                  </div>
                </div>

                <div className="text-xs text-slate-400 italic pt-2">
                  (Nhấp chuột vào thẻ hoặc nhấn phím <strong>Space</strong> để lật xem đáp án)
                </div>
              </div>
            ) : (
              /* ── BACK OF THE CARD (DETAILED 12 CLINICAL FIELDS) ── */
              <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 text-xs sm:text-sm text-left">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-blue-950 dark:text-cyan-300">
                    {currentDrug.tenThuoc}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                    🏷️ {currentDrug.nhomPhanNhomPho}
                  </div>
                </div>

                {/* Hoạt chất & Tá dược riêng biệt */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                    <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase">
                      🧪 Hoạt chất & Hàm lượng:
                    </div>
                    <div className="font-bold text-indigo-950 dark:text-indigo-100 mt-0.5">
                      {currentDrug.hoatChat}
                    </div>
                    <div className="text-[11px] text-indigo-800 dark:text-indigo-300 mt-0.5">
                      {currentDrug.hoatChatHamLuong}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                    <div className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase">
                      💊 Tá dược & Hệ dung môi:
                    </div>
                    <div className="text-xs font-semibold text-purple-950 dark:text-purple-100 mt-0.5">
                      {currentDrug.taDuoc}
                    </div>
                  </div>
                </div>

                {/* Chỉ định & Chống chỉ định */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                    <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase">
                      🎯 Chỉ định điều trị:
                    </div>
                    <div className="text-xs font-semibold text-emerald-950 dark:text-emerald-100 mt-0.5 whitespace-pre-line">
                      {currentDrug.chiDinh}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
                    <div className="text-[11px] font-bold text-rose-900 dark:text-rose-300 uppercase">
                      ⛔ Chống chỉ định & Cảnh báo:
                    </div>
                    <div className="text-xs font-bold text-rose-950 dark:text-rose-100 mt-0.5 whitespace-pre-line">
                      {currentDrug.chongChiDinh}
                    </div>
                  </div>
                </div>

                {/* Thời điểm dùng vàng & Liều dùng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800">
                    <div className="text-[11px] font-bold text-cyan-900 dark:text-cyan-300 uppercase flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Thời điểm dùng vàng (Nhịp sinh học):</span>
                    </div>
                    <div className="text-sm font-extrabold text-cyan-950 dark:text-cyan-100 mt-0.5">
                      ⏰ {currentDrug.thoiDiemDung}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <div className="text-[11px] font-bold text-blue-900 dark:text-cyan-300 uppercase">
                      📋 Liều dùng & Cách dùng:
                    </div>
                    <div className="text-xs font-semibold text-blue-950 dark:text-cyan-100 mt-0.5">
                      {currentDrug.lieuDungCachDung}
                    </div>
                  </div>
                </div>

                {/* Tác dụng phụ & Ghi chú lâm sàng */}
                <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80">
                  <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase">
                    ⚠️ Tác dụng không mong muốn (ADR):
                  </div>
                  <div className="text-xs text-amber-950 dark:text-amber-100 mt-0.5">
                    {currentDrug.tacDungPhu}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-50/80 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800/80">
                  <div className="text-[11px] font-bold text-violet-900 dark:text-violet-300 uppercase">
                    💡 Lưu ý lâm sàng & Tương tác thuốc:
                  </div>
                  <div className="text-xs text-violet-950 dark:text-violet-100 mt-0.5">
                    {currentDrug.ghiChu}
                  </div>
                </div>
              </div>
            )}

            {/* CARD BOTTOM ACTION BAR */}
            <div
              className="p-3 bg-slate-100 dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
              onClick={e => e.stopPropagation()}
            >
              {/* Mark Forgotten Button (Left / Key 1) */}
              <button
                onClick={handleMarkForgotten}
                className="flex-1 max-w-[200px] py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow flex items-center justify-center gap-1.5 transition"
                title="Đánh dấu Chưa Nhớ (Phím 1 hoặc ←)"
              >
                <X className="w-4 h-4 stroke-[3]" />
                <span>Chưa Nhớ (←)</span>
              </button>

              {/* Flip Button (Space) */}
              <button
                onClick={handleFlip}
                className="py-2.5 px-4 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold text-xs sm:text-sm shadow flex items-center gap-1.5 transition active:scale-95"
                title="Lật thẻ xem đáp án (Space)"
              >
                <RotateCw className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span className="hidden sm:inline">{isFlipped ? 'Mặt Trước (Space)' : 'Lật Thẻ (Space)'}</span>
              </button>

              {/* Mark Remembered Button (Right / Key 2) */}
              <button
                onClick={handleMarkRemembered}
                className="flex-1 max-w-[200px] py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow flex items-center justify-center gap-1.5 transition"
                title="Đánh dấu Đã Nhớ (Phím 2 hoặc →)"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Đã Nhớ (→)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. FOOTER INSTRUCTION HELPER
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl w-full mx-auto text-center text-xs text-slate-400 pt-1 pb-1">
        <span>Bản quyền học tập: <strong>Nhật Duy (Sinh viên Y Khoa K26)</strong></span>
        <span className="mx-2">•</span>
        <span className="hidden sm:inline">Phím tắt: <strong>Space</strong> (Lật thẻ) | <strong>← hoặc 1</strong> (Chưa nhớ) | <strong>→ hoặc 2</strong> (Đã nhớ) | <strong>Esc</strong> (Thoát)</span>
      </div>
    </div>
  );
}
