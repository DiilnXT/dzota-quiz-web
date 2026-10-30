'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  Pill,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Printer,
  Eye,
  EyeOff,
  Copy,
  Check,
  Share2,
  SlidersHorizontal,
  BookmarkCheck,
  Stethoscope,
  Activity,
  Layers,
  FlaskConical,
  ShieldAlert,
  ArrowUpDown,
  Home,
  GraduationCap,
  Download,
  Info
} from 'lucide-react';
import rawData from './duocly_data.json';
import { DrugItem, ReferenceMap } from './types';

const DRUGS_DATA: DrugItem[] = (rawData as any).drugs;
const REFERENCES: ReferenceMap = (rawData as any).references;

function removeVietnameseTones(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

export default function DuocLyClient() {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBroadGroup, setSelectedBroadGroup] = useState<string>('ALL');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('ALL');
  const [selectedDangBaoChe, setSelectedDangBaoChe] = useState<string>('ALL');
  const [selectedThoiDiem, setSelectedThoiDiem] = useState<string>('ALL');
  const [selectedNguon, setSelectedNguon] = useState<string>('ALL');
  const [filterWarning, setFilterWarning] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'group'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // View States
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [studyMode, setStudyMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  // Active Drug Detail Modal
  const [activeDrug, setActiveDrug] = useState<DrugItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Favorites (Bookmarks)
  const [favorites, setFavorites] = useState<number[]>([]);

  // Comparison drawer
  const [compareList, setCompareList] = useState<DrugItem[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Filter Drawer on Mobile
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dzota_duocly_favorites');
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const toggleFavorite = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('dzota_duocly_favorites', JSON.stringify(next));
      } catch (err) {}
      return next;
    });
  };

  const toggleReveal = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRevealedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Broad groups list with counts
  const broadGroups = useMemo(() => {
    const map = new Map<string, number>();
    DRUGS_DATA.forEach(d => {
      map.set(d.broadGroup, (map.get(d.broadGroup) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, []);

  // Available Sub-groups based on selected broad group
  const subGroups = useMemo(() => {
    const set = new Set<string>();
    DRUGS_DATA.forEach(d => {
      if (selectedBroadGroup === 'ALL' || d.broadGroup === selectedBroadGroup) {
        if (d.nhomPhanNhomPho) set.add(d.nhomPhanNhomPho);
      }
    });
    return Array.from(set).sort();
  }, [selectedBroadGroup]);

  // Unique Dạng bào chế
  const dangBaoCheList = useMemo(() => {
    const set = new Set<string>();
    DRUGS_DATA.forEach(d => {
      if (d.dangBaoChe) {
        d.dangBaoChe.split(/[,;\/]/).forEach(item => {
          const trimmed = item.trim();
          if (trimmed.length > 2 && trimmed.length < 35) set.add(trimmed);
        });
      }
    });
    return Array.from(set).sort();
  }, []);

  // Filtered & Sorted Drug List
  const filteredDrugs = useMemo(() => {
    const qClean = removeVietnameseTones(searchQuery.trim());
    return DRUGS_DATA.filter(d => {
      // Favorites filter
      if (onlyFavorites && !favorites.includes(d.id)) return false;

      // Broad group filter
      if (selectedBroadGroup !== 'ALL' && d.broadGroup !== selectedBroadGroup) return false;

      // Subgroup filter
      if (selectedSubGroup !== 'ALL' && d.nhomPhanNhomPho !== selectedSubGroup) return false;

      // Dạng bào chế filter
      if (selectedDangBaoChe !== 'ALL') {
        const dbcClean = removeVietnameseTones(d.dangBaoChe);
        const selClean = removeVietnameseTones(selectedDangBaoChe);
        if (!dbcClean.includes(selClean)) return false;
      }

      // Thời điểm dùng filter
      if (selectedThoiDiem !== 'ALL') {
        const tdClean = removeVietnameseTones(d.thoiDiemDung);
        if (selectedThoiDiem === 'sang' && !tdClean.includes('sang') && !tdClean.includes('6 - 8') && !tdClean.includes('7-8')) return false;
        if (selectedThoiDiem === 'doi' && !tdClean.includes('doi') && !tdClean.includes('truoc')) return false;
        if (selectedThoiDiem === 'no' && !tdClean.includes('no') && !tdClean.includes('sau')) return false;
        if (selectedThoiDiem === 'ngu' && !tdClean.includes('ngu') && !tdClean.includes('toi')) return false;
      }

      // Nguồn filter
      if (selectedNguon !== 'ALL') {
        if (!d.nguon.includes(selectedNguon)) return false;
      }

      // Warning / Special properties filter
      if (filterWarning !== 'ALL') {
        const ccd = removeVietnameseTones(d.chongChiDinh);
        const tdp = removeVietnameseTones(d.tacDungPhu);
        const gc = removeVietnameseTones(d.ghiChu);

        if (filterWarning === 'mang-thai') {
          if (!ccd.includes('mang thai') && !ccd.includes('co thai') && !ccd.includes('say thai')) return false;
        } else if (filterWarning === 'tre-em') {
          if (!ccd.includes('tre em') && !ccd.includes('so sinh') && !ccd.includes('duoi 8') && !ccd.includes('duoi 12')) return false;
        } else if (filterWarning === 'suy-gan-than') {
          if (!ccd.includes('gan') && !ccd.includes('than') && !gc.includes('chinh lieu')) return false;
        } else if (filterWarning === 'dai-han') {
          if (!tdp.includes('dai han') && !tdp.includes('dai ngay') && !tdp.includes('keo dai')) return false;
        } else if (filterWarning === 'tuong-tac-manh') {
          if (!gc.includes('tranh') && !gc.includes('chong chi dinh') && !gc.includes('doc tinh')) return false;
        }
      }

      // Unified Text Search
      if (qClean) {
        const textTarget = removeVietnameseTones(
          `${d.tenThuoc} ${d.nhomPhanNhomPho} ${d.hoatChatHamLuong} ${d.hoatChat} ${d.taDuoc} ${d.chiDinh} ${d.chongChiDinh} ${d.dangBaoChe} ${d.ghiChu}`
        );
        if (!textTarget.includes(qClean)) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'id') {
        comparison = a.id - b.id;
      } else if (sortBy === 'name') {
        comparison = a.tenThuoc.localeCompare(b.tenThuoc, 'vi');
      } else if (sortBy === 'group') {
        comparison = a.broadGroup.localeCompare(b.broadGroup, 'vi') || a.nhomPhanNhomPho.localeCompare(b.nhomPhanNhomPho, 'vi');
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [
    searchQuery,
    selectedBroadGroup,
    selectedSubGroup,
    selectedDangBaoChe,
    selectedThoiDiem,
    selectedNguon,
    filterWarning,
    onlyFavorites,
    favorites,
    sortBy,
    sortOrder
  ]);

  // Navigate next/previous drug in modal
  const handleNextDrug = () => {
    if (!activeDrug) return;
    const currentIndex = filteredDrugs.findIndex(d => d.id === activeDrug.id);
    if (currentIndex >= 0 && currentIndex < filteredDrugs.length - 1) {
      setActiveDrug(filteredDrugs[currentIndex + 1]);
    } else if (currentIndex === filteredDrugs.length - 1) {
      setActiveDrug(filteredDrugs[0]); // wrap around
    }
  };

  const handlePrevDrug = () => {
    if (!activeDrug) return;
    const currentIndex = filteredDrugs.findIndex(d => d.id === activeDrug.id);
    if (currentIndex > 0) {
      setActiveDrug(filteredDrugs[currentIndex - 1]);
    } else if (currentIndex === 0) {
      setActiveDrug(filteredDrugs[filteredDrugs.length - 1]); // wrap around
    }
  };

  // Keyboard navigation for modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!activeDrug) return;
      if (e.key === 'ArrowRight') handleNextDrug();
      if (e.key === 'ArrowLeft') handlePrevDrug();
      if (e.key === 'Escape') setActiveDrug(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDrug, filteredDrugs]);

  const copyDrugText = (drug: DrugItem) => {
    const text = `=== BẢNG TRA CỨU DƯỢC LÝ - BẢN QUYỀN NHẬT DUY ===
Tên thuốc: ${drug.tenThuoc}
Nhóm / Phân nhóm: ${drug.nhomPhanNhomPho}
Hoạt chất & Hàm lượng: ${drug.hoatChatHamLuong}
Dạng bào chế: ${drug.dangBaoChe}
---
[THÀNH PHẦN CHI TIẾT]
- Hoạt chất: ${drug.hoatChat}
- Tá dược: ${drug.taDuoc}
---
Chỉ định: ${drug.chiDinh}
Chống chỉ định: ${drug.chongChiDinh}
Tác dụng phụ: ${drug.tacDungPhu}
Liều dùng - Cách dùng: ${drug.lieuDungCachDung}
Thời điểm dùng: ${drug.thoiDiemDung}
Nguồn tài liệu: Nguồn ${drug.nguon}
Ghi chú lâm sàng & tương tác: ${drug.ghiChu}
https://dzota.vercel.app/duocly`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addToCompare = (drug: DrugItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (compareList.some(d => d.id === drug.id)) {
      setCompareList(prev => prev.filter(d => d.id !== drug.id));
    } else {
      if (compareList.length >= 2) {
        setCompareList([compareList[1], drug]);
      } else {
        setCompareList(prev => [...prev, drug]);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedBroadGroup('ALL');
    setSelectedSubGroup('ALL');
    setSelectedDangBaoChe('ALL');
    setSelectedThoiDiem('ALL');
    setSelectedNguon('ALL');
    setFilterWarning('ALL');
    setOnlyFavorites(false);
  };

  // Helper function to render formatted source name
  const getReferenceText = (nguonRaw: string) => {
    const parts = nguonRaw.split(';').map(p => p.trim());
    return parts.map(p => {
      const title = REFERENCES[p] || `Nguồn ${p}`;
      return { id: p, title };
    });
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200"
      style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
    >
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & BRANDING BAR (BẢN QUYỀN: NHẬT DUY)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link
              href="/"
              className="p-1.5 sm:p-2 rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 text-white shadow-md hover:opacity-90 transition active:scale-95 flex items-center justify-center"
              title="Về Trang Chủ Dzota.Edu"
            >
              <Stethoscope className="w-5 h-5 sm:w-6 sm:h-6" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-lg sm:text-2xl font-bold tracking-tight text-blue-950 dark:text-white">
                  DZOTA <span className="text-blue-600 dark:text-cyan-400">DƯỢC LÝ</span>
                </span>
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-cyan-300 border border-blue-200 dark:border-blue-800">
                  401 Thuốc
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1.5">
                <span>Tra Cứu Hoạt Chất & Biệt Dược</span>
                <span>•</span>
                <span className="font-semibold text-blue-700 dark:text-cyan-300">
                  Bản quyền: Nhật Duy
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions Desktop */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Study Mode Toggle */}
            <button
              onClick={() => setStudyMode(!studyMode)}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition border ${
                studyMode
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
              title="Chế độ Tự Kiểm Tra (Ẩn chỉ định & ghi chú để học thuộc)"
            >
              {studyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden md:inline">{studyMode ? 'Đang Ôn Thi (Giấu Lời Giải)' : 'Chế Độ Ôn Thi'}</span>
            </button>

            {/* Compare Drawer Toggle */}
            {compareList.length > 0 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-indigo-600 text-white border border-indigo-700 shadow flex items-center gap-1.5 active:scale-95 transition"
              >
                <Layers className="w-4 h-4" />
                <span>So Sánh ({compareList.length}/2)</span>
              </button>
            )}

            {/* Favorites Filter */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition border ${
                onlyFavorites
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
              title="Lọc thuốc đã đánh dấu sao"
            >
              <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">Đã Lưu ({favorites.length})</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1"
              title="In bảng tra cứu hoặc xuất PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden lg:inline">In Sổ Tay</span>
            </button>

            {/* Back to Dzota Home */}
            <Link
              href="/"
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-cyan-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition flex items-center gap-1"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Dzota</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO BANNER & STATS
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-950 py-5 sm:py-7 px-3 sm:px-6 shadow-inner print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-[11px] sm:text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sổ Tay Tra Cứu Y Khoa & Dược Lý Lâm Sàng 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white mb-1">
              BẢNG TRA CỨU 401 THUỐC, HOẠT CHẤT & BIỆT DƯỢC
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Dữ liệu đầy đủ 12 trường thông tin: <strong>Nhóm - Phổ - Tên thuốc - Hàm lượng - Dạng bào chế - Hoạt chất & Tá dược riêng biệt - Chỉ định - Chống chỉ định - Tác dụng phụ ngắn/dài hạn - Liều & Thời điểm dùng vàng - Tương tác lâm sàng</strong>.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 self-start md:self-auto bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/15">
            <div className="text-center px-2 sm:px-3 border-r border-white/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-cyan-300 font-mono">401</div>
              <div className="text-[10px] sm:text-[11px] text-slate-300">Tổng Số Thuốc</div>
            </div>
            <div className="text-center px-2 sm:px-3 border-r border-white/20">
              <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 font-mono">19</div>
              <div className="text-[10px] sm:text-[11px] text-slate-300">Nhóm Chính</div>
            </div>
            <div className="text-center px-2 sm:px-3">
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">{filteredDrugs.length}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-300">Đang Lọc</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CONTROLS, SEARCH BAR & QUICK FILTERS
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 pb-2 print:hidden">
        {/* Main Search Input */}
        <div className="relative mb-3">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm nhanh: Tên thuốc, hoạt chất, biệt dược, nhóm dược lý, chỉ định, dạng bào chế... (vd: dexamethason, amoxicillin, ngua thai, tieu duong)"
            className="w-full pl-11 pr-24 py-3 sm:py-3.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-cyan-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-cyan-950/50 text-sm sm:text-base outline-none shadow-sm transition placeholder:text-slate-400 font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-10 pr-2 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Xóa tìm kiếm"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              {filteredDrugs.length} thuốc
            </span>
          </div>
        </div>

        {/* Broad Group Filter Pills (Horizontal Scrolling) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <button
            onClick={() => {
              setSelectedBroadGroup('ALL');
              setSelectedSubGroup('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition border ${
              selectedBroadGroup === 'ALL'
                ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Tất Cả ({DRUGS_DATA.length})
          </button>
          {broadGroups.map(([groupName, count]) => (
            <button
              key={groupName}
              onClick={() => {
                setSelectedBroadGroup(groupName);
                setSelectedSubGroup('ALL');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition border flex items-center gap-1.5 ${
                selectedBroadGroup === groupName
                  ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span>{groupName}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedBroadGroup === groupName ? 'bg-blue-900 text-cyan-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {/* Advanced Filters & View Switcher Bar */}
        <div className="mt-2.5 p-3 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
          
          {/* Secondary Dropdown Filters */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Sub-Group Dropdown */}
            <div className="relative min-w-[170px] max-w-[260px]">
              <select
                value={selectedSubGroup}
                onChange={e => setSelectedSubGroup(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none truncate"
              >
                <option value="ALL">🔍 Mọi Phân Nhóm ({subGroups.length})</option>
                {subGroups.map(sg => (
                  <option key={sg} value={sg} title={sg}>
                    {sg.length > 40 ? sg.slice(0, 40) + '...' : sg}
                  </option>
                ))}
              </select>
            </div>

            {/* Dạng Bào Chế Dropdown */}
            <div className="relative min-w-[140px]">
              <select
                value={selectedDangBaoChe}
                onChange={e => setSelectedDangBaoChe(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">📦 Dạng Bào Chế (Tất cả)</option>
                <option value="viên nén">Viên nén</option>
                <option value="viên nang">Viên nang</option>
                <option value="tiêm">Dung dịch / Bột tiêm</option>
                <option value="hỗn dịch">Hỗn dịch / Gói uống</option>
                <option value="nhỏ mắt">Thuốc nhỏ mắt</option>
                <option value="bôi">Kem bôi / Mỡ</option>
                <option value="khí dung">Khí dung / Xịt hít</option>
                <option value="dán">Miếng dán qua da</option>
              </select>
            </div>

            {/* Thời Điểm Dùng Dropdown */}
            <div className="relative min-w-[140px]">
              <select
                value={selectedThoiDiem}
                onChange={e => setSelectedThoiDiem(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">⏰ Thời Điểm Dùng (Tất cả)</option>
                <option value="sang">Buổi sáng (6 - 8h)</option>
                <option value="doi">Lúc đói / Trước ăn</option>
                <option value="no">Lúc no / Trong / Sau ăn</option>
                <option value="ngu">Trước khi đi ngủ</option>
              </select>
            </div>

            {/* Cảnh Báo Lâm Sàng Filter */}
            <div className="relative min-w-[150px]">
              <select
                value={filterWarning}
                onChange={e => setFilterWarning(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-8 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold focus:ring-2 focus:ring-amber-500 outline-none"
              >
                <option value="ALL">⚠️ Cảnh Báo & Tính Chất</option>
                <option value="mang-thai">🚫 CCĐ: Phụ Nữ Mang Thai</option>
                <option value="tre-em">🚫 CCĐ: Trẻ Em / Sơ Sinh</option>
                <option value="suy-gan-than">⚠️ Thận Trọng: Suy Gan / Thận</option>
                <option value="dai-han">⏳ Có Tác Dụng Phụ Dài Hạn</option>
                <option value="tuong-tac-manh">⚡ Lưu Ý Tương Tác Nghiêm Trọng</option>
              </select>
            </div>

            {/* Nguồn Tài Liệu Filter */}
            <div className="relative min-w-[120px]">
              <select
                value={selectedNguon}
                onChange={e => setSelectedNguon(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ALL">📚 Mọi Nguồn</option>
                <option value="1">Nguồn 1: Bài Giảng Dược Lý 2026</option>
                <option value="2">Nguồn 2: Dược Lý 2.pdf</option>
                <option value="3">Nguồn 3: Dược Lý 1.pdf</option>
                <option value="4">Nguồn 4: Y 2025</option>
                <option value="5">Nguồn 5: Y 2026</option>
                <option value="6">Nguồn 6: Y 2025</option>
                <option value="7">Nguồn 7: Dược Thư Quốc Gia</option>
              </select>
            </div>

            {/* Reset Filters button if any filter active */}
            {(selectedBroadGroup !== 'ALL' || selectedSubGroup !== 'ALL' || selectedDangBaoChe !== 'ALL' || selectedThoiDiem !== 'ALL' || selectedNguon !== 'ALL' || filterWarning !== 'ALL' || searchQuery || onlyFavorites) && (
              <button
                onClick={resetAllFilters}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition flex items-center gap-1"
                title="Xóa tất cả các bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Đặt Lại</span>
              </button>
            )}
          </div>

          {/* View mode & Sort controls */}
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700 text-xs">
              <span className="text-slate-500 pl-1 font-semibold">Xếp:</span>
              <button
                onClick={() => setSortBy('id')}
                className={`px-2 py-1 rounded-lg font-semibold transition ${
                  sortBy === 'id' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                STT
              </button>
              <button
                onClick={() => setSortBy('name')}
                className={`px-2 py-1 rounded-lg font-semibold transition ${
                  sortBy === 'name' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Tên A-Z
              </button>
              <button
                onClick={() => setSortBy('group')}
                className={`px-2 py-1 rounded-lg font-semibold transition ${
                  sortBy === 'group' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-700 dark:text-cyan-300' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Nhóm
              </button>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
                title={`Đảo chiều sắp xếp (${sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'})`}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Xem dạng Bảng Đầy Đủ"
              >
                <span>Bảng</span>
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                  viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Xem dạng Thẻ Học Tập"
              >
                <span>Thẻ Học</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CONTENT AREA: TABLE VIEW OR CARD VIEW
      ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-3">
        {filteredDrugs.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-3xl border border-slate-300 dark:border-slate-800 text-center my-6 shadow-sm">
            <FlaskConical className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
              Không tìm thấy thuốc nào phù hợp
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              Vui lòng thử đổi từ khóa tra cứu, xóa bớt điều kiện lọc hoặc bấm &quot;Đặt lại bộ lọc&quot; để xem toàn bộ 401 thuốc.
            </p>
            <button
              onClick={resetAllFilters}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow transition"
            >
              Xem Toàn Bộ 401 Thuốc
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW (HIGH CONTRAST & PROFESSIONAL MEDICAL SPREADSHEET) */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-md overflow-hidden">
            <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                {/* Sticky Header */}
                <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-[#111827] text-slate-900 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-700 font-bold uppercase tracking-wider text-[11px] sm:text-xs shadow-sm">
                  <tr>
                    <th className="py-3 px-2 sm:px-3 text-center w-12 border-r border-slate-200 dark:border-slate-800">STT</th>
                    <th className="py-3 px-3 sm:px-4 min-w-[170px] border-r border-slate-200 dark:border-slate-800">
                      Tên Thuốc (Hoạt Chất / Biệt Dược)
                    </th>
                    <th className="py-3 px-3 min-w-[190px] border-r border-slate-200 dark:border-slate-800">
                      Nhóm, Phân Nhóm, Phổ
                    </th>
                    <th className="py-3 px-3 min-w-[160px] border-r border-slate-200 dark:border-slate-800">
                      Hoạt Chất & Hàm Lượng
                    </th>
                    <th className="py-3 px-3 min-w-[200px] border-r border-slate-200 dark:border-slate-800">
                      Thành Phần (Hoạt chất ; Tá dược)
                    </th>
                    <th className="py-3 px-3 min-w-[180px] border-r border-slate-200 dark:border-slate-800">
                      Chỉ Định
                    </th>
                    <th className="py-3 px-3 min-w-[180px] border-r border-slate-200 dark:border-slate-800">
                      Chống Chỉ Định
                    </th>
                    <th className="py-3 px-3 min-w-[150px] border-r border-slate-200 dark:border-slate-800">
                      Thời Điểm & Liều Dùng
                    </th>
                    <th className="py-3 px-3 text-center w-24">Chi Tiết</th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredDrugs.map((drug, index) => {
                    const isFav = favorites.includes(drug.id);
                    const isRevealed = revealedIds[drug.id];
                    const isCompared = compareList.some(d => d.id === drug.id);

                    return (
                      <tr
                        key={drug.id}
                        onClick={() => setActiveDrug(drug)}
                        className={`hover:bg-blue-50/80 dark:hover:bg-slate-800/80 cursor-pointer transition-colors ${
                          index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/70 dark:bg-[#0c1220]'
                        } ${isCompared ? 'ring-2 ring-indigo-500 ring-inset bg-indigo-50/30' : ''}`}
                      >
                        {/* Column 1: STT & Star */}
                        <td className="py-2.5 px-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-xs">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">#{drug.id}</span>
                            <button
                              onClick={(e) => toggleFavorite(drug.id, e)}
                              className="text-slate-300 hover:text-amber-500 transition p-0.5"
                              title={isFav ? "Bỏ lưu thuốc này" : "Lưu vào danh sách cần học"}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                            </button>
                          </div>
                        </td>

                        {/* Column 2: Tên thuốc */}
                        <td className="py-2.5 px-3 sm:px-4 border-r border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-sm sm:text-base text-blue-900 dark:text-cyan-300 leading-tight">
                            {drug.tenThuoc}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                            <span>Dạng: {drug.dangBaoChe}</span>
                          </div>
                        </td>

                        {/* Column 3: Nhóm, phân nhóm, phổ */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100/90 dark:bg-blue-950 text-blue-900 dark:text-cyan-200 border border-blue-300 dark:border-blue-800 mb-1">
                            {drug.broadGroup}
                          </span>
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-snug font-medium">
                            {drug.nhomPhanNhomPho}
                          </div>
                        </td>

                        {/* Column 4: Hoạt chất & Hàm lượng */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {drug.hoatChatHamLuong}
                          </div>
                        </td>

                        {/* Column 5: Thành phần: Hoạt chất riêng, Tá dược riêng */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                          <div className="space-y-1">
                            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/70 text-xs">
                              <span className="font-bold text-indigo-900 dark:text-indigo-300">🧪 Hoạt chất: </span>
                              <span className="text-slate-800 dark:text-slate-200">{drug.hoatChat}</span>
                            </div>
                            {drug.taDuoc && drug.taDuoc !== 'Chưa ghi nhận tá dược biệt dược cụ thể / Dạng hoạt chất thuần' ? (
                              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/70 text-xs">
                                <span className="font-bold text-purple-900 dark:text-purple-300">💊 Tá dược: </span>
                                <span className="text-slate-700 dark:text-slate-300 line-clamp-2" title={drug.taDuoc}>{drug.taDuoc}</span>
                              </div>
                            ) : (
                              <div className="text-[11px] text-slate-400 italic px-1">
                                (Tá dược chuẩn theo Dược điển)
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Column 6: Chỉ định */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-xs">
                          {studyMode && !isRevealed ? (
                            <button
                              onClick={(e) => toggleReveal(drug.id, e)}
                              className="px-2 py-1 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 font-semibold text-[11px] flex items-center gap-1 hover:bg-amber-200"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Mở Chỉ Định</span>
                            </button>
                          ) : (
                            <div className="text-slate-800 dark:text-slate-200 leading-snug line-clamp-3">
                              {drug.chiDinh}
                            </div>
                          )}
                        </td>

                        {/* Column 7: Chống chỉ định */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-xs">
                          {studyMode && !isRevealed ? (
                            <button
                              onClick={(e) => toggleReveal(drug.id, e)}
                              className="px-2 py-1 rounded bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border border-rose-300 font-semibold text-[11px] flex items-center gap-1 hover:bg-rose-200"
                            >
                              <ShieldAlert className="w-3 h-3" />
                              <span>Mở CCĐ</span>
                            </button>
                          ) : (
                            <div className="p-1 rounded bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-200 border border-rose-200 dark:border-rose-900/60 leading-snug font-medium line-clamp-3">
                              ⛔ {drug.chongChiDinh}
                            </div>
                          )}
                        </td>

                        {/* Column 8: Thời điểm & Liều dùng */}
                        <td className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 text-xs">
                          <div className="font-semibold text-blue-900 dark:text-cyan-300 flex items-center gap-1 mb-0.5">
                            <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            <span>{drug.thoiDiemDung}</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 line-clamp-2">
                            {drug.lieuDungCachDung}
                          </div>
                        </td>

                        {/* Column 9: Xem chi tiết */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDrug(drug);
                              }}
                              className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm active:scale-95 transition"
                            >
                              Chi tiết
                            </button>
                            <button
                              onClick={(e) => addToCompare(drug, e)}
                              className={`p-1 rounded-lg border text-xs transition ${
                                isCompared
                                  ? 'bg-indigo-600 text-white border-indigo-700'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:text-slate-900 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                              }`}
                              title={isCompared ? "Bỏ khỏi so sánh" : "Thêm vào so sánh"}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="p-3 bg-slate-100 dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div>
                Đang hiển thị <strong>{filteredDrugs.length}</strong> / <strong>{DRUGS_DATA.length}</strong> thuốc lâm sàng
              </div>
              <div className="font-medium text-slate-700 dark:text-slate-300">
                Bản quyền dữ liệu & tổng hợp: <strong>Nhật Duy (Y Khoa K26)</strong>
              </div>
            </div>
          </div>
        ) : (
          /* CARD VIEW (MOBILE FIRST & STUDY CARD DECK) */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredDrugs.map(drug => {
              const isFav = favorites.includes(drug.id);
              const isRevealed = revealedIds[drug.id];
              const isCompared = compareList.some(d => d.id === drug.id);

              return (
                <div
                  key={drug.id}
                  onClick={() => setActiveDrug(drug)}
                  className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 transition hover:shadow-lg cursor-pointer flex flex-col justify-between ${
                    isCompared
                      ? 'border-indigo-500 ring-2 ring-indigo-400/50 dark:border-indigo-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600'
                  }`}
                >
                  {/* Card Top: STT, Group badge, Star */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-cyan-300">
                          #{drug.id}
                        </span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 truncate max-w-[170px]">
                          {drug.broadGroup}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => addToCompare(drug, e)}
                          className={`p-1 rounded border text-xs ${
                            isCompared ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                          title="So sánh"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => toggleFavorite(drug.id, e)}
                          className="p-1 text-slate-300 hover:text-amber-500 transition"
                          title="Lưu thuốc"
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Drug Name */}
                    <h3 className="text-base sm:text-lg font-bold text-blue-950 dark:text-white leading-tight mb-1">
                      {drug.tenThuoc}
                    </h3>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                      {drug.nhomPhanNhomPho}
                    </div>

                    {/* Active Ingredient & Excipients Separated */}
                    <div className="space-y-1.5 mb-3">
                      <div className="p-2 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs">
                        <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1 mb-0.5">
                          <FlaskConical className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Hoạt chất:</span>
                        </div>
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {drug.hoatChat}
                          {drug.hoatChatHamLuong && !drug.hoatChat.includes(drug.hoatChatHamLuong) && (
                            <span className="text-slate-600 dark:text-slate-400 font-normal"> ({drug.hoatChatHamLuong})</span>
                          )}
                        </div>
                      </div>

                      {drug.taDuoc && drug.taDuoc !== 'Chưa ghi nhận tá dược biệt dược cụ thể / Dạng hoạt chất thuần' && (
                        <div className="p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-800 text-xs">
                          <div className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1 mb-0.5">
                            <Pill className="w-3.5 h-3.5 text-purple-600" />
                            <span>Tá dược:</span>
                          </div>
                          <div className="text-slate-700 dark:text-slate-300 line-clamp-2">
                            {drug.taDuoc}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Indications & Contraindications */}
                    <div className="space-y-2 mb-3 text-xs">
                      {/* Chỉ định */}
                      <div>
                        <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mb-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Chỉ định:</span>
                        </div>
                        {studyMode && !isRevealed ? (
                          <button
                            onClick={(e) => toggleReveal(drug.id, e)}
                            className="w-full py-1 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 text-center font-semibold text-[11px]"
                          >
                            👁️ Bấm để kiểm tra chỉ định
                          </button>
                        ) : (
                          <div className="text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                            {drug.chiDinh}
                          </div>
                        )}
                      </div>

                      {/* Chống chỉ định */}
                      <div>
                        <div className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1 mb-0.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                          <span>Chống chỉ định:</span>
                        </div>
                        {studyMode && !isRevealed ? (
                          <button
                            onClick={(e) => toggleReveal(drug.id, e)}
                            className="w-full py-1 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 text-center font-semibold text-[11px]"
                          >
                            👁️ Bấm để kiểm tra CCĐ
                          </button>
                        ) : (
                          <div className="p-1.5 rounded-lg bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-950 dark:text-rose-200 font-medium leading-snug line-clamp-2">
                            ⛔ {drug.chongChiDinh}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Timing & Action */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1 text-blue-900 dark:text-cyan-300 font-semibold truncate">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0 text-cyan-600" />
                      <span className="truncate">{drug.thoiDiemDung}</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDrug(drug);
                      }}
                      className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-sm whitespace-nowrap active:scale-95 transition"
                    >
                      Chi Tiết →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. COMPREHENSIVE DRUG DETAIL MODAL (MODAL CHI TIẾT TOÀN DIỆN)
      ───────────────────────────────────────────────────────────── */}
      {activeDrug && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl bg-white dark:bg-[#0B1120] rounded-3xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Top Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-950 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    Thuốc #{activeDrug.id} / 401
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                    {activeDrug.broadGroup}
                  </span>
                  <span className="text-xs text-slate-300">
                    Nguồn tài liệu: <strong>{activeDrug.nguon}</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white leading-tight">
                  {activeDrug.tenThuoc}
                </h2>
                <div className="text-xs sm:text-sm text-cyan-200 font-medium mt-0.5">
                  {activeDrug.nhomPhanNhomPho}
                </div>
              </div>

              {/* Header Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => toggleFavorite(activeDrug.id)}
                  className={`p-2 rounded-xl transition border ${
                    favorites.includes(activeDrug.id)
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-white/10 text-slate-200 hover:text-white border-white/20'
                  }`}
                  title={favorites.includes(activeDrug.id) ? "Bỏ lưu thuốc" : "Lưu thuốc"}
                >
                  <Star className={`w-4 h-4 ${favorites.includes(activeDrug.id) ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={() => copyDrugText(activeDrug)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 border border-white/20 transition"
                  title="Sao chép toàn bộ thông tin thuốc"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setActiveDrug(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-200 hover:text-white border border-white/20 transition"
                  title="Đóng (Phím Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Content with 12 structured fields */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-slate-900 dark:text-slate-100">
              
              {/* SECTION A: CÔNG THỨC THÀNH PHẦN (TÁCH BẠCH HOẠT CHẤT & TÁ DƯỢC) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 shadow-sm">
                <div className="text-xs uppercase font-extrabold tracking-wider text-blue-900 dark:text-cyan-400 flex items-center gap-1.5 mb-3">
                  <FlaskConical className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                  <span>1. THÀNH PHẦN & DẠNG BÀO CHẾ (CÔNG THỨC ĐIỀU CHẾ)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Hoạt chất */}
                  <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border-2 border-indigo-200 dark:border-indigo-800">
                    <div className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>HOẠT CHẤT & NỒNG ĐỘ HÀM LƯỢNG:</span>
                    </div>
                    <div className="text-base font-bold text-indigo-950 dark:text-indigo-100 mb-1">
                      {activeDrug.hoatChat}
                    </div>
                    <div className="text-xs text-indigo-800 dark:text-indigo-300 bg-white/60 dark:bg-indigo-900/40 p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/50">
                      <strong>Hàm lượng ghi nhận:</strong> {activeDrug.hoatChatHamLuong || 'Theo hàm lượng hoạt chất'}
                    </div>
                  </div>

                  {/* Tá dược */}
                  <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 border-2 border-purple-200 dark:border-purple-800">
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                      <span>TÁ DƯỢC & HỆ DUNG MÔI:</span>
                    </div>
                    <div className="text-sm font-semibold text-purple-950 dark:text-purple-100 leading-relaxed">
                      {activeDrug.taDuoc || 'Chưa ghi nhận tá dược biệt dược cụ thể / Dạng hoạt chất thuần'}
                    </div>
                    <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-2 italic">
                      * Chú ý bệnh nhân có tiền sử dị ứng tá dược (lactose, dầu đậu phộng, sulfat, cồn...).
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 font-semibold">Dạng bào chế: </span>
                    <strong className="text-slate-900 dark:text-slate-100">{activeDrug.dangBaoChe}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 font-semibold">Đường dùng & Cách dùng: </span>
                    <strong className="text-slate-900 dark:text-slate-100">{activeDrug.lieuDungCachDung}</strong>
                  </div>
                </div>
              </div>

              {/* SECTION B: CHỈ ĐỊNH & CHỐNG CHỈ ĐỊNH */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Chỉ định */}
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. CHỈ ĐỊNH ĐIỀU TRỊ CHÍNH</span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-100 leading-relaxed whitespace-pre-line">
                    {activeDrug.chiDinh}
                  </div>
                </div>

                {/* Chống chỉ định */}
                <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>3. CHỐNG CHỈ ĐỊNH & CẢNH BÁO NGUY HIỂM</span>
                  </div>
                  <div className="text-sm font-bold text-rose-950 dark:text-rose-100 leading-relaxed whitespace-pre-line">
                    ⛔ {activeDrug.chongChiDinh}
                  </div>
                </div>
              </div>

              {/* SECTION C: TÁC DỤNG PHỤ (NGẮN HẠN, DÀI HẠN) */}
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800">
                <div className="text-xs uppercase font-extrabold tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>4. TÁC DỤNG PHỤ & ĐỘC TÍNH (SỬ DỤNG NGẮN HẠN & DÀI HẠN)</span>
                </div>
                <div className="text-sm font-medium text-amber-950 dark:text-amber-100 leading-relaxed">
                  {activeDrug.tacDungPhu}
                </div>
              </div>

              {/* SECTION D: THỜI ĐIỂM DÙNG VÀNG & LIỀU LƯỢNG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Thời điểm dùng */}
                <div className="p-4 rounded-2xl bg-cyan-50/90 dark:bg-cyan-950/40 border-2 border-cyan-300 dark:border-cyan-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <span>5. THỜI ĐIỂM DÙNG VÀNG (NHỊP SINH HỌC)</span>
                  </div>
                  <div className="text-base font-bold text-cyan-950 dark:text-cyan-100 leading-relaxed">
                    ⏰ {activeDrug.thoiDiemDung}
                  </div>
                </div>

                {/* Liều dùng */}
                <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>6. LIỀU DÙNG & CHẾ ĐỘ ĐIỀU TRỊ</span>
                  </div>
                  <div className="text-sm font-semibold text-blue-950 dark:text-blue-100 leading-relaxed">
                    📋 {activeDrug.lieuDungCachDung}
                  </div>
                </div>
              </div>

              {/* SECTION E: GHI CHÚ TƯƠNG TÁC THUỐC & LƯU Ý LÂM SÀNG */}
              <div className="p-4 rounded-2xl bg-violet-50/90 dark:bg-violet-950/40 border-2 border-violet-300 dark:border-violet-800">
                <div className="text-xs uppercase font-extrabold tracking-wider text-violet-900 dark:text-violet-300 flex items-center gap-1.5 mb-2">
                  <Info className="w-4 h-4 text-violet-600" />
                  <span>7. GHI CHÚ TƯƠNG TÁC THUỐC & LƯU Ý DƯỢC LÂM SÀNG</span>
                </div>
                <div className="text-sm font-semibold text-violet-950 dark:text-violet-100 leading-relaxed">
                  💡 {activeDrug.ghiChu}
                </div>
              </div>

              {/* SECTION F: NGUỒN TÀI LIỆU THAM KHẢO CHÍNH THỨC */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">📚 Nguồn tài liệu tham khảo: </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {getReferenceText(activeDrug.nguon).map(ref => (
                    <span
                      key={ref.id}
                      className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200"
                    >
                      [Nguồn {ref.id}] {ref.title}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Bottom Action Bar */}
            <div className="p-3 sm:p-4 bg-slate-100 dark:bg-[#111827] border-t-2 border-slate-300 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={handlePrevDrug}
                className="px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-xs sm:text-sm font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Thuốc Trước (←)</span>
              </button>

              <div className="text-center">
                <span className="text-xs text-slate-600 dark:text-slate-400 font-semibold">
                  Bản quyền tài liệu: <strong className="text-blue-700 dark:text-cyan-400">Nhật Duy (Y Khoa K26)</strong>
                </span>
              </div>

              <button
                onClick={handleNextDrug}
                className="px-3 sm:px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1 transition shadow-sm active:scale-95"
              >
                <span className="hidden sm:inline">Thuốc Tiếp (→)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. COMPARISON MODAL (SO SÁNH 2 THUỐC CẠNH NHAU)
      ───────────────────────────────────────────────────────────── */}
      {showCompareModal && compareList.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-5xl bg-white dark:bg-[#0B1120] rounded-3xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-300" />
                <h3 className="text-lg font-bold">SO SÁNH LÂM SÀNG DƯỢC LÝ</h3>
              </div>
              <button
                onClick={() => setShowCompareModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Compare Content */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {compareList.map(item => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400">#{item.id}</span>
                        <h4 className="text-base sm:text-lg font-bold text-blue-900 dark:text-white leading-tight">
                          {item.tenThuoc}
                        </h4>
                        <div className="text-xs text-slate-500">{item.nhomPhanNhomPho}</div>
                      </div>
                      <button
                        onClick={() => addToCompare(item)}
                        className="text-xs text-rose-600 font-semibold hover:underline"
                      >
                        Bỏ
                      </button>
                    </div>

                    <div>
                      <strong className="text-indigo-900 dark:text-indigo-300 block mb-0.5">🧪 Hoạt chất:</strong>
                      <span>{item.hoatChat}</span>
                    </div>

                    <div>
                      <strong className="text-purple-900 dark:text-purple-300 block mb-0.5">💊 Tá dược:</strong>
                      <span>{item.taDuoc}</span>
                    </div>

                    <div>
                      <strong className="text-emerald-900 dark:text-emerald-400 block mb-0.5">🎯 Chỉ định:</strong>
                      <span>{item.chiDinh}</span>
                    </div>

                    <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-950 dark:text-rose-200">
                      <strong className="block mb-0.5">⛔ Chống chỉ định:</strong>
                      <span>{item.chongChiDinh}</span>
                    </div>

                    <div>
                      <strong className="text-amber-900 dark:text-amber-400 block mb-0.5">⚠️ Tác dụng phụ:</strong>
                      <span>{item.tacDungPhu}</span>
                    </div>

                    <div>
                      <strong className="text-cyan-900 dark:text-cyan-400 block mb-0.5">⏰ Thời điểm dùng:</strong>
                      <span>{item.thoiDiemDung}</span>
                    </div>

                    <div>
                      <strong className="text-violet-900 dark:text-violet-400 block mb-0.5">💡 Lưu ý & Tương tác:</strong>
                      <span>{item.ghiChu}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 text-center">
              <button
                onClick={() => setCompareList([])}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 hover:bg-rose-100 transition"
              >
                Xóa Danh Sách So Sánh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. FOOTER & COPYRIGHT
      ───────────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0B1120] py-8 px-4 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 print:text-black">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            HỆ THỐNG TRA CỨU DƯỢC LÝ LÂM SÀNG DZOTA • 401 THUỐC ĐẦY ĐỦ
          </p>
          <p className="font-medium">
            Bản quyền thuộc về: <strong className="text-blue-700 dark:text-cyan-400">Nhật Duy (Sinh viên Y Khoa K26)</strong>
          </p>
          <p className="text-xs text-slate-500">
            Nguồn tài liệu: Bài giảng Dược lý 2026 • Dược lý 1 & 2 • Đề cương Dược lý Y 2025 - Y 2026 • Dược thư Quốc gia Việt Nam (QĐ số 3445/QĐ-BYT).
          </p>
          <div className="pt-3 flex items-center justify-center gap-4 text-xs font-semibold text-blue-700 dark:text-cyan-400 print:hidden">
            <Link href="/" className="hover:underline">Trang Chủ Dzota</Link>
            <span>•</span>
            <Link href="/dynex" className="hover:underline">Đấu Trường DYNEX OSCE</Link>
            <span>•</span>
            <Link href="/notebook" className="hover:underline">NoteBook ND AI</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
