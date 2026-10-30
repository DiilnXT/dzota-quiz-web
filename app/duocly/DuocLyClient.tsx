'use client';

import React, { useState, useMemo, useEffect, useDeferredValue, useRef } from 'react';
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
  Info,
  Camera,
  Plus,
  Trash2,
  Settings,
  Upload,
  RefreshCw,
  Save,
  CheckCircle,
  FilePlus,
  HelpCircle,
  Globe,
  Timer
} from 'lucide-react';
import FlashcardView from './FlashcardView';
import ChayTramView from './ChayTramView';
import rawData from './duocly_data.json';
import { DrugItem, ReferenceMap } from './types';

const INITIAL_DRUGS_DATA: DrugItem[] = (rawData as any).drugs;
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

interface EnhancedDrugItem extends DrugItem {
  _searchIndex: string;
  isCustom?: boolean;
}

export default function DuocLyClient() {
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [selectedBroadGroup, setSelectedBroadGroup] = useState<string>('ALL');
  const [selectedSubGroup, setSelectedSubGroup] = useState<string>('ALL');
  const [selectedDangBaoChe, setSelectedDangBaoChe] = useState<string>('ALL');
  const [selectedThoiDiem, setSelectedThoiDiem] = useState<string>('ALL');
  const [selectedNguon, setSelectedNguon] = useState<string>('ALL');
  const [filterWarning, setFilterWarning] = useState<string>('ALL');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyCustom, setOnlyCustom] = useState(false);
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'group'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination for buttery smooth 60fps rendering
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // View States
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  const [studyMode, setStudyMode] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Record<number, boolean>>({});

  // Active Drug Detail Modal
  const [activeDrug, setActiveDrug] = useState<EnhancedDrugItem | null>(null);
  const [copied, setCopied] = useState(false);

  // Favorites (Bookmarks)
  const [favorites, setFavorites] = useState<number[]>([]);

  // Comparison drawer
  const [compareList, setCompareList] = useState<EnhancedDrugItem[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Custom Drugs Added Manually or via Camera AI
  const [customDrugs, setCustomDrugs] = useState<DrugItem[]>([]);

  // Manual Drug Form Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState<Partial<DrugItem>>({
    broadGroup: 'Kháng Sinh',
    nhomPhanNhomPho: '',
    tenThuoc: '',
    hoatChatHamLuong: '',
    dangBaoChe: 'Viên nén',
    hoatChat: '',
    taDuoc: '',
    chiDinh: '',
    chongChiDinh: '',
    tacDungPhu: '',
    lieuDungCachDung: 'Đường uống',
    thoiDiemDung: 'Uống sau bữa ăn',
    ghiChu: '',
    nguon: 'Nhật Duy (Tự cập nhật 2026)'
  });

  // Camera & AI Scan State
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraImage, setCameraImage] = useState<string | null>(null);
  const [cameraMime, setCameraMime] = useState<string>('image/jpeg');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [matchedDrug, setMatchedDrug] = useState<EnhancedDrugItem | null>(null);

  // Google Fallback Search State (Tra cứu ngoài data 401 khi không tìm thấy)
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [googleSearchResult, setGoogleSearchResult] = useState<DrugItem | null>(null);
  const [googleSearchError, setGoogleSearchError] = useState<string | null>(null);
  const [lastGoogleSearchQuery, setLastGoogleSearchQuery] = useState('');

  // Flashcard & OSCE Station Run States
  const [showFlashcardModal, setShowFlashcardModal] = useState(false);
  const [showChayTramModal, setShowChayTramModal] = useState(false);
  const [flashcardCustomIds, setFlashcardCustomIds] = useState<number[] | null>(null);

  // AI Model Configuration
  const [showAiConfigModal, setShowAiConfigModal] = useState(false);
  const [activeModel, setActiveModel] = useState<string>('gemini-2.0-flash');
  const [clientApiKey, setClientApiKey] = useState<string>('');
  const [availableModels, setAvailableModels] = useState<string[]>([
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-2.5-pro'
  ]);
  const [hasSystemKey, setHasSystemKey] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Load custom drugs, favorites & AI config from localStorage
  useEffect(() => {
    try {
      const savedFavs = localStorage.getItem('dzota_duocly_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedCustom = localStorage.getItem('dzota_duocly_custom_drugs');
      if (savedCustom) setCustomDrugs(JSON.parse(savedCustom));

      const savedAi = localStorage.getItem('dzota_duocly_ai_config');
      if (savedAi) {
        const parsed = JSON.parse(savedAi);
        if (parsed.activeModel) setActiveModel(parsed.activeModel);
        if (parsed.clientApiKey) setClientApiKey(parsed.clientApiKey);
      }
    } catch (e) {
      console.error('Error loading localStorage:', e);
    }

    // Fetch Dzota AI Settings
    fetch('/api/duocly/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.activeModel) setActiveModel(data.activeModel);
          if (data.availableModels) setAvailableModels(data.availableModels);
          setHasSystemKey(data.hasSystemKey);
        }
      })
      .catch(err => console.warn('Could not fetch settings:', err));
  }, []);

  // Save custom drugs
  const saveCustomDrugsToStorage = (newList: DrugItem[]) => {
    setCustomDrugs(newList);
    try {
      localStorage.setItem('dzota_duocly_custom_drugs', JSON.stringify(newList));
    } catch (e) {
      console.error(e);
    }
  };

  const saveAiConfig = (model: string, key: string) => {
    setActiveModel(model);
    setClientApiKey(key);
    try {
      localStorage.setItem('dzota_duocly_ai_config', JSON.stringify({ activeModel: model, clientApiKey: key }));
    } catch (e) {}
    setShowAiConfigModal(false);
  };

  // Combine built-in 401 drugs + custom drugs, and pre-compute search indexes ONCE
  const allEnhancedDrugs = useMemo(() => {
    const combined: EnhancedDrugItem[] = [
      ...INITIAL_DRUGS_DATA.map(d => ({
        ...d,
        isCustom: false,
        _searchIndex: removeVietnameseTones(
          `${d.tenThuoc} ${d.nhomPhanNhomPho} ${d.hoatChatHamLuong} ${d.hoatChat} ${d.taDuoc} ${d.chiDinh} ${d.chongChiDinh} ${d.dangBaoChe} ${d.ghiChu} ${d.thoiDiemDung}`
        )
      })),
      ...customDrugs.map(d => ({
        ...d,
        isCustom: true,
        _searchIndex: removeVietnameseTones(
          `${d.tenThuoc} ${d.nhomPhanNhomPho} ${d.hoatChatHamLuong} ${d.hoatChat} ${d.taDuoc} ${d.chiDinh} ${d.chongChiDinh} ${d.dangBaoChe} ${d.ghiChu} ${d.thoiDiemDung}`
        )
      }))
    ];
    return combined;
  }, [customDrugs]);

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
    allEnhancedDrugs.forEach(d => {
      map.set(d.broadGroup, (map.get(d.broadGroup) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allEnhancedDrugs]);

  // Sub-groups
  const subGroups = useMemo(() => {
    const set = new Set<string>();
    allEnhancedDrugs.forEach(d => {
      if (selectedBroadGroup === 'ALL' || d.broadGroup === selectedBroadGroup) {
        if (d.nhomPhanNhomPho) set.add(d.nhomPhanNhomPho);
      }
    });
    return Array.from(set).sort();
  }, [allEnhancedDrugs, selectedBroadGroup]);

  // Filtered & Sorted Drug List (Super-fast pre-indexed filtering)
  const filteredDrugs = useMemo(() => {
    const qClean = removeVietnameseTones(deferredSearchQuery.trim());

    return allEnhancedDrugs.filter(d => {
      if (onlyFavorites && !favorites.includes(d.id)) return false;
      if (onlyCustom && !d.isCustom) return false;
      if (selectedBroadGroup !== 'ALL' && d.broadGroup !== selectedBroadGroup) return false;
      if (selectedSubGroup !== 'ALL' && d.nhomPhanNhomPho !== selectedSubGroup) return false;

      if (selectedDangBaoChe !== 'ALL') {
        const dbcClean = removeVietnameseTones(d.dangBaoChe);
        const selClean = removeVietnameseTones(selectedDangBaoChe);
        if (!dbcClean.includes(selClean)) return false;
      }

      if (selectedThoiDiem !== 'ALL') {
        const tdClean = removeVietnameseTones(d.thoiDiemDung);
        if (selectedThoiDiem === 'sang' && !tdClean.includes('sang') && !tdClean.includes('6 - 8') && !tdClean.includes('7-8')) return false;
        if (selectedThoiDiem === 'doi' && !tdClean.includes('doi') && !tdClean.includes('truoc')) return false;
        if (selectedThoiDiem === 'no' && !tdClean.includes('no') && !tdClean.includes('sau')) return false;
        if (selectedThoiDiem === 'ngu' && !tdClean.includes('ngu') && !tdClean.includes('toi')) return false;
      }

      if (selectedNguon !== 'ALL') {
        if (!d.nguon.includes(selectedNguon)) return false;
      }

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

      // Fast single lookup
      if (qClean && !d._searchIndex.includes(qClean)) {
        return false;
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
    allEnhancedDrugs,
    deferredSearchQuery,
    selectedBroadGroup,
    selectedSubGroup,
    selectedDangBaoChe,
    selectedThoiDiem,
    selectedNguon,
    filterWarning,
    onlyFavorites,
    onlyCustom,
    favorites,
    sortBy,
    sortOrder
  ]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [deferredSearchQuery, selectedBroadGroup, selectedSubGroup, selectedDangBaoChe, selectedThoiDiem, filterWarning, onlyFavorites, onlyCustom]);

  // Paginated Drugs
  const paginatedDrugs = useMemo(() => {
    if (pageSize === 0) return filteredDrugs; // 0 means show all
    const start = (currentPage - 1) * pageSize;
    return filteredDrugs.slice(start, start + pageSize);
  }, [filteredDrugs, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredDrugs.length / (pageSize || 1)) || 1;

  // Add Manual Drug Handler
  const handleSaveManualDrug = () => {
    if (!addForm.tenThuoc?.trim()) {
      alert('Vui lòng nhập tên thuốc (hoạt chất / biệt dược)');
      return;
    }

    const nextId = allEnhancedDrugs.length > 0 ? Math.max(...allEnhancedDrugs.map(d => d.id)) + 1 : 402;
    const newDrug: DrugItem = {
      id: nextId,
      nhomPhanNhomPho: addForm.nhomPhanNhomPho?.trim() || `${addForm.broadGroup} (Tự thêm)`,
      broadGroup: addForm.broadGroup || 'Khác',
      tenThuoc: addForm.tenThuoc.trim(),
      hoatChatHamLuong: addForm.hoatChatHamLuong?.trim() || addForm.hoatChat?.trim() || addForm.tenThuoc.trim(),
      dangBaoChe: addForm.dangBaoChe?.trim() || 'Viên nén',
      thanhPhanRaw: `Hoạt chất: ${addForm.hoatChat || addForm.tenThuoc} ; Tá dược: ${addForm.taDuoc || 'Chưa ghi nhận tá dược cụ thể'}`,
      hoatChat: addForm.hoatChat?.trim() || addForm.tenThuoc.trim(),
      taDuoc: addForm.taDuoc?.trim() || 'Chưa ghi nhận tá dược cụ thể',
      chiDinh: addForm.chiDinh?.trim() || 'Theo chỉ định của bác sĩ',
      chongChiDinh: addForm.chongChiDinh?.trim() || 'Quá mẫn với thành phần của thuốc',
      tacDungPhu: addForm.tacDungPhu?.trim() || 'Rối loạn tiêu hóa nhẹ, phản ứng dị ứng',
      lieuDungCachDung: addForm.lieuDungCachDung?.trim() || 'Đường uống theo chỉ định',
      thoiDiemDung: addForm.thoiDiemDung?.trim() || 'Sau khi ăn',
      nguon: addForm.nguon?.trim() || 'Tự bổ sung 2026',
      ghiChu: addForm.ghiChu?.trim() || 'Lưu ý kiểm tra tương tác thuốc khi phối hợp'
    };

    saveCustomDrugsToStorage([...customDrugs, newDrug]);
    setShowAddModal(false);
    alert(`Đã thêm thành công thuốc #${newDrug.id} "${newDrug.tenThuoc}" vào danh mục!`);

    // Reset add form
    setAddForm({
      broadGroup: 'Kháng Sinh',
      nhomPhanNhomPho: '',
      tenThuoc: '',
      hoatChatHamLuong: '',
      dangBaoChe: 'Viên nén',
      hoatChat: '',
      taDuoc: '',
      chiDinh: '',
      chongChiDinh: '',
      tacDungPhu: '',
      lieuDungCachDung: 'Đường uống',
      thoiDiemDung: 'Uống sau bữa ăn',
      ghiChu: '',
      nguon: 'Nhật Duy (Tự cập nhật 2026)'
    });
  };

  // Delete Custom Drug
  const handleDeleteCustomDrug = (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa thuốc tự thêm này khỏi danh mục?')) {
      const filtered = customDrugs.filter(d => d.id !== id);
      saveCustomDrugsToStorage(filtered);
      if (activeDrug?.id === id) setActiveDrug(null);
    }
  };

  // Handle Photo Selection for Camera AI
  const handleImageSelected = (file: File) => {
    if (!file) return;
    setCameraMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (e) => {
      const b64 = e.target?.result as string;
      setCameraImage(b64);
      setAiResult(null);
      setAiError(null);
      setMatchedDrug(null);
    };
    reader.readAsDataURL(file);
  };

  // Run AI Scan
  const handleRunAiScan = async () => {
    if (!cameraImage) return;
    setIsAnalyzing(true);
    setAiError(null);
    setAiResult(null);
    setMatchedDrug(null);

    try {
      const res = await fetch('/api/duocly/ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: cameraImage,
          mimeType: cameraMime,
          clientApiKey: clientApiKey || undefined,
          clientModel: activeModel || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Lỗi phân tích ảnh thuốc bằng AI');
      }

      const analyzed = resData.data;
      setAiResult(analyzed);

      // Match against existing 401+ drugs
      const detectedName = removeVietnameseTones(analyzed.tenThuoc || '');
      const detectedHoatChat = removeVietnameseTones(analyzed.hoatChat || '');
      const keywords = (analyzed.searchKeywords || []).map((k: string) => removeVietnameseTones(k));

      let bestMatch: EnhancedDrugItem | null = null;
      let highestScore = 0;

      for (const d of allEnhancedDrugs) {
        let score = 0;
        const dName = removeVietnameseTones(d.tenThuoc);
        const dHc = removeVietnameseTones(d.hoatChat);

        if (detectedName && (dName.includes(detectedName) || detectedName.includes(dName))) score += 50;
        if (detectedHoatChat && (dHc.includes(detectedHoatChat) || detectedHoatChat.includes(dHc))) score += 40;

        for (const kw of keywords) {
          if (kw && d._searchIndex.includes(kw)) score += 10;
        }

        if (score > highestScore && score >= 30) {
          highestScore = score;
          bestMatch = d;
        }
      }

      if (bestMatch) {
        setMatchedDrug(bestMatch);
      }
    } catch (err: any) {
      setAiError(err.message || 'Lỗi khi kết nối dịch vụ Gemini AI');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Scanned Drug into Custom Drugs
  const handleSaveScannedDrug = () => {
    if (!aiResult) return;
    const nextId = allEnhancedDrugs.length > 0 ? Math.max(...allEnhancedDrugs.map(d => d.id)) + 1 : 402;
    const newDrug: DrugItem = {
      id: nextId,
      nhomPhanNhomPho: aiResult.nhomPhanNhomPho || `${aiResult.broadGroup || 'Khác'} - Thuốc Quét Từ Camera AI`,
      broadGroup: aiResult.broadGroup || 'Khác',
      tenThuoc: aiResult.tenThuoc || 'Thuốc Nhận Diện AI',
      hoatChatHamLuong: aiResult.hoatChatHamLuong || aiResult.hoatChat || '',
      dangBaoChe: aiResult.dangBaoChe || 'Chế phẩm dược',
      thanhPhanRaw: `Hoạt chất: ${aiResult.hoatChat || aiResult.tenThuoc} ; Tá dược: ${aiResult.taDuoc || 'Chưa ghi nhận tá dược'}`,
      hoatChat: aiResult.hoatChat || aiResult.tenThuoc,
      taDuoc: aiResult.taDuoc || 'Chưa ghi nhận tá dược cụ thể',
      chiDinh: aiResult.chiDinh || 'Theo chỉ định của bác sĩ',
      chongChiDinh: aiResult.chongChiDinh || 'Quá mẫn với thành phần',
      tacDungPhu: aiResult.tacDungPhu || 'Xem hướng dẫn sử dụng',
      lieuDungCachDung: aiResult.lieuDungCachDung || 'Đường dùng thông thường',
      thoiDiemDung: aiResult.thoiDiemDung || 'Theo hướng dẫn sử dụng',
      nguon: '📷 Camera AI Scan (Thuốc ngoài Data 401 gốc)',
      ghiChu: aiResult.ghiChu || 'Thuốc quét từ hình ảnh bao bì',
      isExternal: !matchedDrug,
      isCustom: true
    };

    saveCustomDrugsToStorage([...customDrugs, newDrug]);
    setShowCameraModal(false);
    alert(`Đã lưu thuốc #${newDrug.id} "${newDrug.tenThuoc}" vào danh mục thành công!`);
    setActiveDrug({
      ...newDrug,
      isCustom: true,
      _searchIndex: removeVietnameseTones(`${newDrug.tenThuoc} ${newDrug.hoatChat} ${newDrug.nhomPhanNhomPho}`)
    });
  };

  // Google Fallback Search Handler (Tra cứu tự động ngoài data 401)
  const handleGoogleSearch = async (queryToSearch?: string) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) {
      alert('Vui lòng nhập tên thuốc hoặc hoạt chất cần tra cứu');
      return;
    }
    setIsSearchingGoogle(true);
    setGoogleSearchError(null);
    setGoogleSearchResult(null);
    setLastGoogleSearchQuery(q);

    try {
      const res = await fetch('/api/duocly/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: q,
          clientApiKey: clientApiKey || undefined,
          clientModel: activeModel || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Lỗi tra cứu Google AI');
      }

      const d = resData.data;
      const nextId = allEnhancedDrugs.length > 0 ? Math.max(...allEnhancedDrugs.map(item => item.id)) + 1 : 402;
      const formattedDrug: DrugItem = {
        id: nextId,
        nhomPhanNhomPho: d.nhomPhanNhomPho || `${d.broadGroup || 'Khác'} (Tra Cứu Google)`,
        broadGroup: d.broadGroup || 'Khác',
        tenThuoc: d.tenThuoc || q,
        hoatChatHamLuong: d.hoatChatHamLuong || d.hoatChat || q,
        dangBaoChe: d.dangBaoChe || 'Chế phẩm dược',
        thanhPhanRaw: `Hoạt chất: ${d.hoatChat || q} ; Tá dược: ${d.taDuoc || 'Chưa ghi nhận tá dược'}`,
        hoatChat: d.hoatChat || q,
        taDuoc: d.taDuoc || 'Chưa ghi nhận tá dược cụ thể',
        chiDinh: d.chiDinh || 'Theo chỉ định của bác sĩ',
        chongChiDinh: d.chongChiDinh || 'Quá mẫn với thành phần của thuốc',
        tacDungPhu: d.tacDungPhu || 'Xem hướng dẫn sử dụng',
        lieuDungCachDung: d.lieuDungCachDung || 'Đường dùng theo chỉ định',
        thoiDiemDung: d.thoiDiemDung || 'Theo hướng dẫn sử dụng',
        nguon: d.nguon || '🌐 Tra cứu Google & Dược Thư Quốc Gia (Thuốc ngoài Data 401 gốc)',
        ghiChu: d.ghiChu || 'Thuốc ngoài danh mục 401 gốc, tra cứu tự động qua AI Google',
        isExternal: true,
        isCustom: true
      };

      setGoogleSearchResult(formattedDrug);
    } catch (err: any) {
      setGoogleSearchError(err.message || 'Lỗi kết nối tra cứu Google AI');
    } finally {
      setIsSearchingGoogle(false);
    }
  };

  // Save Google Search Result to custom drugs
  const handleSaveGoogleSearchResult = () => {
    if (!googleSearchResult) return;
    saveCustomDrugsToStorage([...customDrugs, googleSearchResult]);
    alert(`Đã lưu thuốc #${googleSearchResult.id} "${googleSearchResult.tenThuoc}" vào danh mục thành công!`);
    setActiveDrug({
      ...googleSearchResult,
      isCustom: true,
      _searchIndex: removeVietnameseTones(`${googleSearchResult.tenThuoc} ${googleSearchResult.hoatChat} ${googleSearchResult.nhomPhanNhomPho}`)
    });
  };

  // Navigate next/previous drug in modal
  const handleNextDrug = () => {
    if (!activeDrug) return;
    const currentIndex = filteredDrugs.findIndex(d => d.id === activeDrug.id);
    if (currentIndex >= 0 && currentIndex < filteredDrugs.length - 1) {
      setActiveDrug(filteredDrugs[currentIndex + 1]);
    } else if (currentIndex === filteredDrugs.length - 1) {
      setActiveDrug(filteredDrugs[0]);
    }
  };

  const handlePrevDrug = () => {
    if (!activeDrug) return;
    const currentIndex = filteredDrugs.findIndex(d => d.id === activeDrug.id);
    if (currentIndex > 0) {
      setActiveDrug(filteredDrugs[currentIndex - 1]);
    } else if (currentIndex === 0) {
      setActiveDrug(filteredDrugs[filteredDrugs.length - 1]);
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

  const addToCompare = (drug: EnhancedDrugItem, e?: React.MouseEvent) => {
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
    setOnlyCustom(false);
  };

  const getReferenceText = (nguonRaw: string) => {
    const parts = nguonRaw.split(';').map(p => p.trim());
    return parts.map(p => {
      const title = REFERENCES[p] || (p.includes('Nhật Duy') || p.includes('AI') ? p : `Nguồn ${p}`);
      return { id: p, title };
    });
  };

  return (
    <div
      className="min-h-screen bg-[#F8FAFC] dark:bg-[#090D16] text-[#0F172A] dark:text-[#F1F5F9] transition-colors duration-200"
      style={{ fontFamily: "'Times New Roman', Times, 'Liberation Serif', serif" }}
    >
      {/* Hidden file inputs for Camera & Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleImageSelected(e.target.files[0])}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => e.target.files?.[0] && handleImageSelected(e.target.files[0])}
      />

      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & BRANDING BAR (BẢN QUYỀN: NHẬT DUY)
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2.5">
          
          {/* Logo & Platform Info */}
          <div className="flex items-center gap-2 sm:gap-3.5">
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
                  {allEnhancedDrugs.length} Thuốc
                </span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-normal flex items-center gap-1.5">
                <span>Tra Cứu Dược Lý Lâm Sàng</span>
                <span>•</span>
                <span className="font-semibold text-blue-700 dark:text-cyan-300">
                  Bản quyền: Nhật Duy
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Camera AI Scan Button (FEATURED) */}
            <button
              onClick={() => {
                setShowCameraModal(true);
                setAiResult(null);
                setAiError(null);
                setCameraImage(null);
              }}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1.5 active:scale-95 transition"
              title="Chụp ảnh bao bì thuốc và phân tích bằng Gemini AI của Dzota"
            >
              <Camera className="w-4 h-4 text-cyan-200" />
              <span className="hidden sm:inline">Quét Ảnh Thuốc AI</span>
            </button>

            {/* Add Manual Drug Button (FEATURED) */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-1 active:scale-95 transition"
              title="Thêm thuốc mới thủ công vào cơ sở dữ liệu"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">Thêm Thuốc Mới</span>
            </button>

            {/* AI Config / Model Settings */}
            <button
              onClick={() => setShowAiConfigModal(true)}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1"
              title="Cấu hình Model AI & API Keys Dzota"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="hidden lg:inline">{activeModel.replace('gemini-', '')}</span>
            </button>

            {/* Study Mode Toggle */}
            <button
              onClick={() => setStudyMode(!studyMode)}
              className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1 transition border ${
                studyMode
                  ? 'bg-amber-600 text-white border-amber-700 shadow-md animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
              title="Chế độ Tự Kiểm Tra (Ẩn chỉ định để ôn bài)"
            >
              {studyMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span className="hidden xl:inline">{studyMode ? 'Ôn Thi (Ẩn)' : 'Ôn Thi'}</span>
            </button>

            {/* Compare Button */}
            {compareList.length > 0 && (
              <button
                onClick={() => setShowCompareModal(true)}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white border border-indigo-700 shadow flex items-center gap-1 active:scale-95 transition"
              >
                <Layers className="w-4 h-4" />
                <span>So Sánh ({compareList.length}/2)</span>
              </button>
            )}

            {/* Favorites Filter */}
            <button
              onClick={() => setOnlyFavorites(!onlyFavorites)}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition border ${
                onlyFavorites
                  ? 'bg-rose-600 text-white border-rose-700 shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
              }`}
              title="Lọc thuốc đã đánh dấu sao"
            >
              <Star className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">({favorites.length})</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition flex items-center gap-1"
              title="In sổ tay"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────────
          2. HERO BANNER
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-950 py-4 sm:py-6 px-3 sm:px-6 shadow-inner print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-[11px] sm:text-xs font-semibold mb-1">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sổ Tay Tra Cứu Dược Lý Lâm Sàng & Phân Tích Camera AI</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white mb-0.5">
              TRA CỨU 401+ THUỐC, HOẠT CHẤT & BIỆT DƯỢC
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Tách biệt rõ ràng <strong>Hoạt chất & Tá dược</strong> • Tra cứu mượt mà 60fps • Tích hợp nút <strong>&quot;Xem chi tiết&quot; ngay dưới tên thuốc</strong> • Hỗ trợ <strong>thêm thuốc thủ công</strong> và <strong>quét ảnh bao bì thuốc qua Camera AI Dzota</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-white/10 backdrop-blur-sm p-2.5 rounded-2xl border border-white/15">
            <div className="text-center px-2.5 border-r border-white/20">
              <div className="text-xl sm:text-2xl font-extrabold text-cyan-300 font-mono">{allEnhancedDrugs.length}</div>
              <div className="text-[10px] text-slate-300">Tổng Số Thuốc</div>
            </div>
            <div className="text-center px-2.5 border-r border-white/20">
              <div className="text-xl sm:text-2xl font-extrabold text-amber-300 font-mono">{customDrugs.length}</div>
              <div className="text-[10px] text-slate-300">Thuốc Đã Thêm</div>
            </div>
            <div className="text-center px-2.5">
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-300 font-mono">{filteredDrugs.length}</div>
              <div className="text-[10px] text-slate-300">Đang Hiển Thị</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. CONTROLS, SEARCH BAR & QUICK FILTERS
      ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-3.5 pb-2 print:hidden">
        {/* Main Search Input */}
        <div className="relative mb-2.5">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (googleSearchResult) setGoogleSearchResult(null);
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && filteredDrugs.length === 0 && searchQuery.trim()) {
                handleGoogleSearch(searchQuery);
              }
            }}
            placeholder="Tìm kiếm siêu tốc: Tên thuốc, hoạt chất, biệt dược, tá dược, nhóm dược lý, chỉ định, dạng bào chế... (vd: dexamethason, amoxicillin, ngua thai)"
            className="w-full pl-11 pr-36 sm:pr-48 py-3 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 focus:border-blue-600 dark:focus:border-cyan-500 focus:ring-4 focus:ring-blue-100 dark:focus:ring-cyan-950/50 text-sm sm:text-base outline-none shadow-sm transition placeholder:text-slate-400 font-medium"
          />

          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1.5">
            {/* Clear Button (✕) with distinct clickable styling and clean separation */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setGoogleSearchResult(null);
                  setGoogleSearchError(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-200 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-700 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 text-slate-700 dark:text-slate-200 flex items-center justify-center transition active:scale-90 shadow-sm"
                title="Xóa nhanh từ khóa tìm kiếm (✕)"
                aria-label="Xóa tìm kiếm"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}

            {/* Quick Google Search Button directly in the search bar */}
            {searchQuery && (
              <button
                onClick={() => handleGoogleSearch(searchQuery)}
                disabled={isSearchingGoogle}
                className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-blue-100 hover:bg-blue-200 dark:bg-blue-950/80 dark:hover:bg-blue-900 text-blue-800 dark:text-cyan-200 border border-blue-200 dark:border-blue-800 text-[11px] font-bold transition active:scale-95 disabled:opacity-50"
                title="Tra cứu Google & Dược Thư cho từ khóa này"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Google AI</span>
              </button>
            )}

            {/* Drug count badge */}
            <span className="text-[11px] font-mono px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-semibold whitespace-nowrap">
              {filteredDrugs.length} thuốc
            </span>
          </div>
        </div>

        {/* Broad Group Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          <button
            onClick={() => {
              setSelectedBroadGroup('ALL');
              setSelectedSubGroup('ALL');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition border ${
              selectedBroadGroup === 'ALL'
                ? 'bg-blue-700 text-white border-blue-800 shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            Tất Cả ({allEnhancedDrugs.length})
          </button>
          {customDrugs.length > 0 && (
            <button
              onClick={() => setOnlyCustom(!onlyCustom)}
              className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition border flex items-center gap-1.5 ${
                onlyCustom
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                  : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              <span>⭐ Thuốc Tự Thêm ({customDrugs.length})</span>
            </button>
          )}
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
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'
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

        {/* Advanced Filters & Pagination Bar */}
        <div className="mt-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Sub-Group Dropdown */}
            <div className="relative min-w-[160px] max-w-[240px]">
              <select
                value={selectedSubGroup}
                onChange={e => setSelectedSubGroup(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium outline-none truncate"
              >
                <option value="ALL">🔍 Mọi Phân Nhóm ({subGroups.length})</option>
                {subGroups.map(sg => (
                  <option key={sg} value={sg} title={sg}>
                    {sg.length > 35 ? sg.slice(0, 35) + '...' : sg}
                  </option>
                ))}
              </select>
            </div>

            {/* Dạng Bào Chế */}
            <div className="relative min-w-[130px]">
              <select
                value={selectedDangBaoChe}
                onChange={e => setSelectedDangBaoChe(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium outline-none"
              >
                <option value="ALL">📦 Dạng Bào Chế</option>
                <option value="viên nén">Viên nén</option>
                <option value="viên nang">Viên nang</option>
                <option value="tiêm">Dung dịch / Bột tiêm</option>
                <option value="hỗn dịch">Hỗn dịch / Gói uống</option>
                <option value="nhỏ mắt">Thuốc nhỏ mắt</option>
                <option value="bôi">Kem bôi / Mỡ</option>
                <option value="khí dung">Khí dung / Xịt</option>
                <option value="dán">Miếng dán qua da</option>
              </select>
            </div>

            {/* Thời Điểm Dùng */}
            <div className="relative min-w-[130px]">
              <select
                value={selectedThoiDiem}
                onChange={e => setSelectedThoiDiem(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-7 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium outline-none"
              >
                <option value="ALL">⏰ Thời Điểm</option>
                <option value="sang">Buổi sáng (6 - 8h)</option>
                <option value="doi">Lúc đói / Trước ăn</option>
                <option value="no">Lúc no / Sau ăn</option>
                <option value="ngu">Trước khi đi ngủ</option>
              </select>
            </div>

            {/* Cảnh Báo Lâm Sàng */}
            <div className="relative min-w-[150px]">
              <select
                value={filterWarning}
                onChange={e => setFilterWarning(e.target.value)}
                className="w-full text-xs sm:text-sm py-1.5 pl-2.5 pr-7 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 font-semibold outline-none"
              >
                <option value="ALL">⚠️ Cảnh Báo Đặc Biệt</option>
                <option value="mang-thai">🚫 CCĐ: Mang Thai</option>
                <option value="tre-em">🚫 CCĐ: Trẻ Em / Sơ Sinh</option>
                <option value="suy-gan-than">⚠️ Thận Trọng: Gan / Thận</option>
                <option value="dai-han">⏳ Có Tác Dụng Dài Hạn</option>
                <option value="tuong-tac-manh">⚡ Tương Tác Thuốc Nguy Hiểm</option>
              </select>
            </div>

            {/* Reset Button */}
            {(selectedBroadGroup !== 'ALL' || selectedSubGroup !== 'ALL' || selectedDangBaoChe !== 'ALL' || selectedThoiDiem !== 'ALL' || selectedNguon !== 'ALL' || filterWarning !== 'ALL' || searchQuery || onlyFavorites || onlyCustom) && (
              <button
                onClick={resetAllFilters}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition flex items-center gap-1"
                title="Đặt lại bộ lọc"
              >
                <X className="w-3.5 h-3.5" />
                <span>Đặt Lại</span>
              </button>
            )}
          </div>

          {/* View mode & Page Size */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <span>Hiển thị:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold"
              >
                <option value={25}>25 thuốc</option>
                <option value={50}>50 thuốc</option>
                <option value={100}>100 thuốc</option>
                <option value={0}>Tất cả ({filteredDrugs.length})</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Bảng
              </button>
              <button
                onClick={() => setViewMode('card')}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                  viewMode === 'card' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-cyan-300 shadow-sm' : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Thẻ Học
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. MAIN CONTENT AREA (PAGINATED & SMOOTH 60FPS)
      ───────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
        {filteredDrugs.length === 0 ? (
          <div className="space-y-4 my-6">
            <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-300 dark:border-slate-800 text-center shadow-sm">
              <FlaskConical className="w-12 h-12 text-slate-400 mx-auto mb-3 stroke-[1.5]" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-1">
                {searchQuery.trim()
                  ? `Không tìm thấy "${searchQuery}" trong 401 thuốc nội bộ`
                  : 'Không tìm thấy thuốc nào phù hợp với bộ lọc'}
              </h3>
              <p className="text-sm text-slate-500 max-w-lg mx-auto mb-5 leading-relaxed">
                {searchQuery.trim()
                  ? 'Thuốc này chưa có trong file DƯỢC LÝ OF DUY (401 thuốc gốc). Bạn có thể bấm nút bên dưới để AI tự động tra cứu từ Google & Dược Thư Quốc Gia Việt Nam, hoặc thêm thuốc thủ công!'
                  : 'Vui lòng thử đổi từ khóa, kiểm tra lại bộ lọc hoặc bấm thêm thuốc mới nếu chưa có trong danh mục.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {searchQuery.trim() && (
                  <button
                    onClick={() => handleGoogleSearch(searchQuery)}
                    disabled={isSearchingGoogle}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-extrabold text-sm shadow-md flex items-center gap-2 active:scale-95 transition disabled:opacity-50"
                  >
                    {isSearchingGoogle ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-cyan-200" />
                        <span>Đang Tra Cứu Google & Dược Thư...</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 text-cyan-200" />
                        <span>Tra Cứu Google & Dược Thư Cho &quot;{searchQuery}&quot;</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={resetAllFilters}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition"
                >
                  Xem Toàn Bộ Thuốc
                </button>

                <button
                  onClick={() => {
                    setAddForm(prev => ({
                      ...prev,
                      tenThuoc: searchQuery.trim(),
                      hoatChat: searchQuery.trim()
                    }));
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm Thủ Công</span>
                </button>
              </div>
            </div>

            {/* Google Search Progress */}
            {isSearchingGoogle && (
              <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border-2 border-blue-200 dark:border-blue-800 text-center space-y-2 max-w-xl mx-auto shadow-sm">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                <div className="font-bold text-blue-950 dark:text-cyan-200 text-base">
                  Đang tra cứu Google & Dược Thư Quốc Gia cho &quot;{lastGoogleSearchQuery}&quot;...
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Gemini AI đang trích xuất chuẩn 12 trường thông tin: Nhóm, Hoạt chất, Tá dược, Chỉ định, Chống chỉ định, Liều dùng, Thời điểm dùng...
                </p>
              </div>
            )}

            {/* Google Search Error */}
            {googleSearchError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs sm:text-sm max-w-xl mx-auto space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Không thể tra cứu: {googleSearchError}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGoogleSearch(lastGoogleSearchQuery)}
                    className="px-3 py-1 rounded-lg bg-rose-600 text-white font-bold text-xs"
                  >
                    Thử lại
                  </button>
                  <button
                    onClick={() => setShowAiConfigModal(true)}
                    className="px-3 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold text-xs"
                  >
                    Kiểm tra API Key
                  </button>
                </div>
              </div>
            )}

            {/* Google Search Result Display with MANDATORY PROMINENT NOTE */}
            {googleSearchResult && (
              <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 shadow-lg text-left max-w-4xl mx-auto space-y-4">
                {/* PROMINENT NOTE BANNER */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-300 dark:border-amber-700">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-extrabold text-sm sm:text-base text-amber-900 dark:text-amber-200 tracking-wide">
                        ⚠️ THUỐC NGOÀI DATA 401 GỐC • TỰ ĐỘNG TRA CỨU TỪ GOOGLE & DƯỢC THƯ LÂM SÀNG
                      </div>
                      <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                        Thuốc này không nằm trong file <strong>DƯỢC LÝ OF DUY (401 thuốc gốc)</strong>. Dữ liệu được AI tự động tổng hợp từ Google & Dược Thư Quốc Gia Việt Nam.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={handleSaveGoogleSearchResult}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-1.5 active:scale-95 transition"
                    >
                      <Save className="w-4 h-4" />
                      <span>Lưu Vào Data 401 (+)</span>
                    </button>
                    <button
                      onClick={() => setActiveDrug({
                        ...googleSearchResult,
                        isCustom: true,
                        _searchIndex: removeVietnameseTones(`${googleSearchResult.tenThuoc} ${googleSearchResult.hoatChat}`)
                      })}
                      className="px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm shadow flex items-center gap-1.5 active:scale-95 transition"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Xem Chi Tiết Đầy Đủ</span>
                    </button>
                  </div>
                </div>

                {/* Formatted Standard Card (12 fields, Hoạt chất & Tá dược riêng biệt) */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-cyan-300 border border-blue-300 dark:border-blue-800 mb-1">
                        {googleSearchResult.broadGroup}
                      </span>
                      <h3 className="text-lg sm:text-xl font-bold text-blue-950 dark:text-white">
                        {googleSearchResult.tenThuoc}
                      </h3>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Dạng bào chế: <strong className="text-slate-800 dark:text-slate-200">{googleSearchResult.dangBaoChe}</strong> • Hàm lượng: <strong className="text-slate-800 dark:text-slate-200">{googleSearchResult.hoatChatHamLuong}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Nhóm phân nhóm phổ */}
                  <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                    <div className="text-[11px] font-bold text-blue-900 dark:text-cyan-300 uppercase">
                      🏷️ Nhóm, phân nhóm, phổ:
                    </div>
                    <div className="text-sm font-semibold text-blue-950 dark:text-cyan-100 mt-0.5">
                      {googleSearchResult.nhomPhanNhomPho}
                    </div>
                  </div>

                  {/* Thành phần: Hoạt chất & Tá dược riêng biệt */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800">
                      <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase">
                        🧪 Hoạt chất:
                      </div>
                      <div className="text-sm font-bold text-indigo-950 dark:text-indigo-100 mt-0.5">
                        {googleSearchResult.hoatChat}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                      <div className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase">
                        💊 Tá dược:
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-purple-950 dark:text-purple-100 mt-0.5">
                        {googleSearchResult.taDuoc}
                      </div>
                    </div>
                  </div>

                  {/* Chỉ định & Chống chỉ định */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase">
                        🎯 Chỉ định chính:
                      </div>
                      <div className="text-xs sm:text-sm font-medium text-emerald-950 dark:text-emerald-100 mt-0.5">
                        {googleSearchResult.chiDinh}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                      <div className="text-[11px] font-bold text-rose-900 dark:text-rose-300 uppercase">
                        ⛔ Chống chỉ định & Cảnh báo:
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-rose-950 dark:text-rose-100 mt-0.5">
                        {googleSearchResult.chongChiDinh}
                      </div>
                    </div>
                  </div>

                  {/* Thời điểm dùng & Liều dùng */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-cyan-50/80 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                      <div className="text-[11px] font-bold text-cyan-900 dark:text-cyan-300 uppercase">
                        ⏰ Thời điểm dùng vàng:
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-cyan-950 dark:text-cyan-100 mt-0.5">
                        {googleSearchResult.thoiDiemDung}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                        📋 Liều dùng & Cách dùng:
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                        {googleSearchResult.lieuDungCachDung}
                      </div>
                    </div>
                  </div>

                  {/* Tác dụng phụ & Ghi chú tương tác */}
                  <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                    <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase">
                      ⚠️ Tác dụng phụ:
                    </div>
                    <div className="text-xs text-amber-950 dark:text-amber-200 mt-0.5">
                      {googleSearchResult.tacDungPhu}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800/60">
                    <div className="text-[11px] font-bold text-violet-900 dark:text-violet-300 uppercase">
                      💡 Lưu ý lâm sàng & Tương tác thuốc:
                    </div>
                    <div className="text-xs text-violet-950 dark:text-violet-200 mt-0.5">
                      {googleSearchResult.ghiChu}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW: WITH BUTTON "XEM CHI TIẾT" RIGHT UNDER THE DRUG NAME */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-md overflow-hidden">
            <div className="overflow-x-auto max-h-[75vh] scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                {/* Sticky Header */}
                <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-[#111827] text-slate-900 dark:text-slate-100 border-b-2 border-slate-300 dark:border-slate-700 font-bold uppercase tracking-wider text-[11px] sm:text-xs shadow-sm">
                  <tr>
                    <th className="py-3 px-2 sm:px-3 text-center w-12 border-r border-slate-200 dark:border-slate-800">STT</th>
                    <th className="py-3 px-3 sm:px-4 min-w-[200px] border-r border-slate-200 dark:border-slate-800">
                      Tên Thuốc & Thao Tác
                    </th>
                    <th className="py-3 px-3 min-w-[190px] border-r border-slate-200 dark:border-slate-800">
                      Nhóm, Phân Nhóm, Phổ
                    </th>
                    <th className="py-3 px-3 min-w-[160px] border-r border-slate-200 dark:border-slate-800">
                      Hoạt Chất & Hàm Lượng
                    </th>
                    <th className="py-3 px-3 min-w-[210px] border-r border-slate-200 dark:border-slate-800">
                      Thành Phần (Hoạt chất ; Tá dược)
                    </th>
                    <th className="py-3 px-3 min-w-[180px] border-r border-slate-200 dark:border-slate-800">
                      Chỉ Định
                    </th>
                    <th className="py-3 px-3 min-w-[180px] border-r border-slate-200 dark:border-slate-800">
                      Chống Chỉ Định
                    </th>
                    <th className="py-3 px-3 min-w-[150px]">
                      Thời Điểm & Liều Dùng
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedDrugs.map((drug, index) => {
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
                        {/* Column 1: STT */}
                        <td className="py-3 px-2 text-center border-r border-slate-200 dark:border-slate-800 font-mono text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">#{drug.id}</span>
                          {drug.isCustom && (
                            <div className="text-[9px] font-bold text-emerald-600 bg-emerald-100 rounded px-1 mt-1">Tự thêm</div>
                          )}
                        </td>

                        {/* Column 2: Tên thuốc VÀ NÚT XEM CHI TIẾT NGAY DƯỚI TÊN! */}
                        <td className="py-3 px-3 sm:px-4 border-r border-slate-200 dark:border-slate-800">
                          <div className="font-bold text-sm sm:text-base text-blue-900 dark:text-cyan-300 leading-tight">
                            {drug.tenThuoc}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Dạng: <strong className="text-slate-700 dark:text-slate-300">{drug.dangBaoChe}</strong>
                          </div>

                          {/* ACTION BUTTON DIRECTLY UNDER DRUG NAME AS REQUESTED! */}
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDrug(drug);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
                              title="Xem toàn bộ 12 trường thông tin thuốc"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Xem chi tiết</span>
                            </button>
                            <button
                              onClick={(e) => toggleFavorite(drug.id, e)}
                              className={`p-1 rounded-lg border text-xs transition ${
                                isFav ? 'bg-amber-100 border-amber-300 text-amber-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                              title={isFav ? "Bỏ lưu thuốc này" : "Lưu vào danh sách cần học"}
                            >
                              <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400 text-amber-500' : ''}`} />
                            </button>
                            <button
                              onClick={(e) => addToCompare(drug, e)}
                              className={`p-1 rounded-lg border text-xs transition ${
                                isCompared ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                              }`}
                              title={isCompared ? "Bỏ khỏi so sánh" : "Thêm vào so sánh"}
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            {drug.isCustom && (
                              <button
                                onClick={(e) => handleDeleteCustomDrug(drug.id, e)}
                                className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition"
                                title="Xóa thuốc tự thêm"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Column 3: Nhóm, phân nhóm, phổ */}
                        <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100/90 dark:bg-blue-950 text-blue-900 dark:text-cyan-200 border border-blue-300 dark:border-blue-800 mb-1">
                            {drug.broadGroup}
                          </span>
                          <div className="text-xs text-slate-700 dark:text-slate-300 leading-snug font-medium">
                            {drug.nhomPhanNhomPho}
                          </div>
                        </td>

                        {/* Column 4: Hoạt chất & Hàm lượng */}
                        <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800">
                          <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                            {drug.hoatChatHamLuong}
                          </div>
                        </td>

                        {/* Column 5: Thành phần: Hoạt chất riêng, Tá dược riêng */}
                        <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800">
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
                        <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800 text-xs">
                          {studyMode && !isRevealed ? (
                            <button
                              onClick={(e) => toggleReveal(drug.id, e)}
                              className="px-2 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-[11px] flex items-center gap-1 hover:bg-amber-200"
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
                        <td className="py-3 px-3 border-r border-slate-200 dark:border-slate-800 text-xs">
                          {studyMode && !isRevealed ? (
                            <button
                              onClick={(e) => toggleReveal(drug.id, e)}
                              className="px-2 py-1 rounded bg-rose-100 text-rose-900 border border-rose-300 font-semibold text-[11px] flex items-center gap-1 hover:bg-rose-200"
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
                        <td className="py-3 px-3 text-xs">
                          <div className="font-semibold text-blue-900 dark:text-cyan-300 flex items-center gap-1 mb-0.5">
                            <Clock className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                            <span>{drug.thoiDiemDung}</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-400 line-clamp-2">
                            {drug.lieuDungCachDung}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 bg-slate-50 dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500 font-medium">
                  Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong> (Hiển thị {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredDrugs.length)} / {filteredDrugs.length} thuốc)
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40"
                  >
                    « Đầu
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40 flex items-center gap-0.5"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Trước
                  </button>

                  <span className="px-3 py-1 font-mono text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-cyan-300 rounded border border-blue-200">
                    {currentPage}
                  </span>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2.5 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40 flex items-center gap-0.5"
                  >
                    Sau <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-bold disabled:opacity-40"
                  >
                    Cuối »
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* CARD VIEW (MOBILE & COMPACT STUDY DECK) */
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {paginatedDrugs.map(drug => {
                const isFav = favorites.includes(drug.id);
                const isRevealed = revealedIds[drug.id];
                const isCompared = compareList.some(d => d.id === drug.id);

                return (
                  <div
                    key={drug.id}
                    onClick={() => setActiveDrug(drug)}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border-2 transition hover:shadow-lg cursor-pointer flex flex-col justify-between ${
                      isCompared
                        ? 'border-indigo-500 ring-2 ring-indigo-400/50'
                        : 'border-slate-200 dark:border-slate-800 hover:border-blue-400'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-cyan-300">
                            #{drug.id}
                          </span>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 truncate max-w-[150px]">
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
                        <div>
                          <div className="font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1 mb-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chỉ định:</span>
                          </div>
                          {studyMode && !isRevealed ? (
                            <button
                              onClick={(e) => toggleReveal(drug.id, e)}
                              className="w-full py-1 rounded bg-amber-50 text-amber-800 border border-amber-300 text-center font-semibold text-[11px]"
                            >
                              👁️ Bấm kiểm tra chỉ định
                            </button>
                          ) : (
                            <div className="text-slate-800 dark:text-slate-200 leading-snug line-clamp-2">
                              {drug.chiDinh}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="font-bold text-rose-800 dark:text-rose-400 flex items-center gap-1 mb-0.5">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                            <span>Chống chỉ định:</span>
                          </div>
                          {studyMode && !isRevealed ? (
                            <button
                              onClick={(e) => toggleReveal(drug.id, e)}
                              className="w-full py-1 rounded bg-rose-50 text-rose-800 border border-rose-300 text-center font-semibold text-[11px]"
                            >
                              👁️ Bấm kiểm tra CCĐ
                            </button>
                          ) : (
                            <div className="p-1.5 rounded-lg bg-rose-50/70 text-rose-950 dark:text-rose-200 border border-rose-200 font-medium leading-snug line-clamp-2">
                              ⛔ {drug.chongChiDinh}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Bottom */}
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
                        className="px-3 py-1 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-sm active:scale-95 transition"
                      >
                        Chi Tiết →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Card View Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500 font-medium">
                  Trang {currentPage} / {totalPages}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
                  >
                    Trước
                  </button>
                  <span className="px-3 py-1 font-mono text-xs font-bold text-blue-700 dark:text-cyan-300">
                    {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-800 text-xs font-bold disabled:opacity-40"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tra cứu bổ sung bằng Google AI nếu người dùng muốn tìm thêm thuốc ngoài data 401 */}
        {searchQuery.trim().length > 0 && filteredDrugs.length > 0 && (
          <div className="mt-4 p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Globe className="w-4 h-4 text-blue-600 dark:text-cyan-400 flex-shrink-0" />
              <span>Chưa thấy biệt dược bạn cần trong kết quả trên? Muốn tìm thêm từ Google & Dược Thư cho <strong>&quot;{searchQuery}&quot;</strong>?</span>
            </div>
            <button
              onClick={() => handleGoogleSearch(searchQuery)}
              disabled={isSearchingGoogle}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow flex items-center gap-1.5 active:scale-95 transition disabled:opacity-50"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{isSearchingGoogle ? 'Đang Tra Cứu...' : 'Tra Cứu Thêm Với Google AI'}</span>
            </button>
          </div>
        )}
      </main>

      {/* ─────────────────────────────────────────────────────────────
          5. MODAL CHI TIẾT THUỐC TOÀN DIỆN (12 TRƯỜNG THÔNG TIN)
      ───────────────────────────────────────────────────────────── */}
      {activeDrug && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl bg-white dark:bg-[#0B1120] rounded-3xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white border-b border-blue-950 flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                    Thuốc #{activeDrug.id} {activeDrug.isCustom && '(Tự Thêm)'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-white/10 text-white border border-white/20">
                    {activeDrug.broadGroup}
                  </span>
                  <span className="text-xs text-slate-300">
                    Nguồn: <strong>{activeDrug.nguon}</strong>
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
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-slate-900 dark:text-slate-100">
              
              {/* Note if drug is external to 401 */}
              {activeDrug.isExternal && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-extrabold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                      ⚠️ THUỐC NGOÀI DATA 401 GỐC • TỰ ĐỘNG TRA CỨU TỪ GOOGLE & DƯỢC THƯ LÂM SÀNG
                    </div>
                    <div className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                      Thuốc này không nằm trong danh mục 401 thuốc nội bộ (Dược lý của Duy). Dữ liệu được trích xuất tự động qua AI & Dược Thư Quốc Gia Việt Nam.
                    </div>
                  </div>
                </div>
              )}
              
              {/* SECTION 1: CÔNG THỨC THÀNH PHẦN (TÁCH BẠCH HOẠT CHẤT & TÁ DƯỢC) */}
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
                      <span>HOẠT CHẤT & HÀM LƯỢNG:</span>
                    </div>
                    <div className="text-base font-bold text-indigo-950 dark:text-indigo-100 mb-1">
                      {activeDrug.hoatChat}
                    </div>
                    <div className="text-xs text-indigo-800 dark:text-indigo-300 bg-white/60 dark:bg-indigo-900/40 p-1.5 rounded-lg border border-indigo-200">
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
                      * Chú ý bệnh nhân có tiền sử dị ứng tá dược (lactose, cồn, dầu đậu phộng, sulfat...).
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

              {/* SECTION 2: CHỈ ĐỊNH & CHỐNG CHỈ ĐỊNH */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border-2 border-emerald-300 dark:border-emerald-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>2. CHỈ ĐỊNH ĐIỀU TRỊ CHÍNH</span>
                  </div>
                  <div className="text-sm font-semibold text-emerald-950 dark:text-emerald-100 leading-relaxed whitespace-pre-line">
                    {activeDrug.chiDinh}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-rose-900 dark:text-rose-300 flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <span>3. CHỐNG CHỈ ĐỊNH & CẢNH BÁO</span>
                  </div>
                  <div className="text-sm font-bold text-rose-950 dark:text-rose-100 leading-relaxed whitespace-pre-line">
                    ⛔ {activeDrug.chongChiDinh}
                  </div>
                </div>
              </div>

              {/* SECTION 3: TÁC DỤNG PHỤ */}
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800">
                <div className="text-xs uppercase font-extrabold tracking-wider text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>4. TÁC DỤNG PHỤ (SỬ DỤNG NGẮN HẠN & DÀI HẠN)</span>
                </div>
                <div className="text-sm font-medium text-amber-950 dark:text-amber-100 leading-relaxed">
                  {activeDrug.tacDungPhu}
                </div>
              </div>

              {/* SECTION 4: THỜI ĐIỂM DÙNG VÀNG & LIỀU DÙNG */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-cyan-50/90 dark:bg-cyan-950/40 border-2 border-cyan-300 dark:border-cyan-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-cyan-900 dark:text-cyan-300 flex items-center gap-1.5 mb-2">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <span>5. THỜI ĐIỂM DÙNG VÀNG (NHỊP SINH HỌC)</span>
                  </div>
                  <div className="text-base font-bold text-cyan-950 dark:text-cyan-100 leading-relaxed">
                    ⏰ {activeDrug.thoiDiemDung}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/90 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-800">
                  <div className="text-xs uppercase font-extrabold tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span>6. LIỀU DÙNG & CÁCH DÙNG</span>
                  </div>
                  <div className="text-sm font-semibold text-blue-950 dark:text-blue-100 leading-relaxed">
                    📋 {activeDrug.lieuDungCachDung}
                  </div>
                </div>
              </div>

              {/* SECTION 5: LƯU Ý LÂM SÀNG & TƯƠNG TÁC */}
              <div className="p-4 rounded-2xl bg-violet-50/90 dark:bg-violet-950/40 border-2 border-violet-300 dark:border-violet-800">
                <div className="text-xs uppercase font-extrabold tracking-wider text-violet-900 dark:text-violet-300 flex items-center gap-1.5 mb-2">
                  <Info className="w-4 h-4 text-violet-600" />
                  <span>7. GHI CHÚ TƯƠNG TÁC THUỐC & LƯU Ý LÂM SÀNG</span>
                </div>
                <div className="text-sm font-semibold text-violet-950 dark:text-violet-100 leading-relaxed">
                  💡 {activeDrug.ghiChu}
                </div>
              </div>

              {/* SECTION 6: NGUỒN TÀI LIỆU */}
              <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300">📚 Nguồn tài liệu: </span>
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

            {/* Modal Bottom Bar */}
            <div className="p-3 sm:p-4 bg-slate-100 dark:bg-[#111827] border-t-2 border-slate-300 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={handlePrevDrug}
                className="px-3 sm:px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-200 text-xs sm:text-sm font-bold flex items-center gap-1 shadow-sm transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Thuốc Trước (←)</span>
              </button>

              <div className="text-center text-xs text-slate-600 font-semibold">
                Bản quyền: <strong className="text-blue-700 dark:text-cyan-400">Nhật Duy (Y Khoa K26)</strong>
              </div>

              <button
                onClick={handleNextDrug}
                className="px-3 sm:px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs sm:text-sm font-bold flex items-center gap-1 shadow-sm transition"
              >
                <span className="hidden sm:inline">Thuốc Tiếp (→)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. MODAL THÊM THUỐC MỚI THỦ CÔNG (TỰ THÊM VÀ LƯU TẠI ĐÓ)
      ───────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-3xl bg-white dark:bg-[#0B1120] rounded-3xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-200" />
                <h3 className="text-lg font-bold">THÊM THUỐC MỚI VÀO CƠ SỞ DỮ LIỆU</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-rose-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 text-xs sm:text-sm">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 font-medium">
                💡 Thuốc thêm mới sẽ được lưu vĩnh viễn trong trình duyệt của bạn và hiển thị đầy đủ trong bảng tra cứu, bộ lọc, thẻ học!
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tên thuốc (Hoạt chất / Biệt dược) <span className="text-rose-500">*</span>:
                  </label>
                  <input
                    type="text"
                    value={addForm.tenThuoc || ''}
                    onChange={e => setAddForm({ ...addForm, tenThuoc: e.target.value })}
                    placeholder="vd: Cefixim 200mg / Haginat"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nhóm chính:
                  </label>
                  <select
                    value={addForm.broadGroup || 'Kháng Sinh'}
                    onChange={e => setAddForm({ ...addForm, broadGroup: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {broadGroups.map(([g]) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nhóm, phân nhóm, phổ chi tiết:
                </label>
                <input
                  type="text"
                  value={addForm.nhomPhanNhomPho || ''}
                  onChange={e => setAddForm({ ...addForm, nhomPhanNhomPho: e.target.value })}
                  placeholder="vd: Kháng sinh - Nhóm Beta-lactam / Cephalosporin Thế hệ 3"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-indigo-900 dark:text-indigo-300 block mb-1">
                    🧪 Hoạt chất & Nồng độ:
                  </label>
                  <input
                    type="text"
                    value={addForm.hoatChat || ''}
                    onChange={e => setAddForm({ ...addForm, hoatChat: e.target.value })}
                    placeholder="vd: Cefixim trihydrat"
                    className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-purple-900 dark:text-purple-300 block mb-1">
                    💊 Tá dược & Dung môi:
                  </label>
                  <input
                    type="text"
                    value={addForm.taDuoc || ''}
                    onChange={e => setAddForm({ ...addForm, taDuoc: e.target.value })}
                    placeholder="vd: Lactose, tinh bột ngô, magnesi stearat"
                    className="w-full p-2.5 rounded-xl border border-purple-200 bg-purple-50/50 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Dạng bào chế:
                  </label>
                  <input
                    type="text"
                    value={addForm.dangBaoChe || ''}
                    onChange={e => setAddForm({ ...addForm, dangBaoChe: e.target.value })}
                    placeholder="vd: Viên nén bao phim, bột pha hỗn dịch"
                    className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-cyan-900 dark:text-cyan-300 block mb-1">
                    ⏰ Thời điểm dùng vàng:
                  </label>
                  <input
                    type="text"
                    value={addForm.thoiDiemDung || ''}
                    onChange={e => setAddForm({ ...addForm, thoiDiemDung: e.target.value })}
                    placeholder="vd: Uống sau bữa ăn hoặc cố định giờ"
                    className="w-full p-2.5 rounded-xl border border-cyan-200 bg-cyan-50/50 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-emerald-900 dark:text-emerald-400 block mb-1">
                  🎯 Chỉ định:
                </label>
                <textarea
                  rows={2}
                  value={addForm.chiDinh || ''}
                  onChange={e => setAddForm({ ...addForm, chiDinh: e.target.value })}
                  placeholder="Nhiễm khuẩn hô hấp, tiết niệu, tai mũi họng..."
                  className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/30 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-rose-900 dark:text-rose-400 block mb-1">
                  ⛔ Chống chỉ định:
                </label>
                <textarea
                  rows={2}
                  value={addForm.chongChiDinh || ''}
                  onChange={e => setAddForm({ ...addForm, chongChiDinh: e.target.value })}
                  placeholder="Dị ứng Cephalosporin, mẫn cảm..."
                  className="w-full p-2.5 rounded-xl border border-rose-200 bg-rose-50/30 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-amber-900 dark:text-amber-400 block mb-1">
                  ⚠️ Tác dụng phụ (ngắn hạn, dài hạn):
                </label>
                <input
                  type="text"
                  value={addForm.tacDungPhu || ''}
                  onChange={e => setAddForm({ ...addForm, tacDungPhu: e.target.value })}
                  placeholder="Rối loạn tiêu hóa, tiêu chảy, dị ứng ngoài da..."
                  className="w-full p-2.5 rounded-xl border border-amber-200 bg-amber-50/30 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-violet-900 dark:text-violet-400 block mb-1">
                  💡 Ghi chú tương tác & Lưu ý lâm sàng:
                </label>
                <textarea
                  rows={2}
                  value={addForm.ghiChu || ''}
                  onChange={e => setAddForm({ ...addForm, ghiChu: e.target.value })}
                  placeholder="Chỉnh liều suy thận, tương tác thuốc chống đông..."
                  className="w-full p-2.5 rounded-xl border border-violet-200 bg-violet-50/30 outline-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-100 dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-xs sm:text-sm font-bold"
              >
                Hủy Bỏ
              </button>

              <button
                onClick={handleSaveManualDrug}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-md active:scale-95 transition"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Thuốc Vào Danh Mục</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. MODAL CAMERA AI SCAN (CHỤP ẢNH & QUÉT THUỐC THÔNG MINH)
      ───────────────────────────────────────────────────────────── */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#0B1120] rounded-3xl shadow-2xl border-2 border-cyan-500/40 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-cyan-800 to-blue-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-cyan-300" />
                <h3 className="text-base sm:text-lg font-bold">QUÉT ẢNH THUỐC BẰNG CAMERA AI DZOTA</h3>
              </div>
              <button
                onClick={() => setShowCameraModal(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-rose-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
              
              {/* Photo Source Selector */}
              {!cameraImage ? (
                <div className="p-6 rounded-2xl border-2 border-dashed border-cyan-400 bg-cyan-50/40 dark:bg-cyan-950/20 text-center space-y-4">
                  <div className="w-14 h-14 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 mx-auto flex items-center justify-center">
                    <Camera className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      Chụp ảnh bao bì thuốc hoặc tải ảnh lên
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Hỗ trợ chụp hộp thuốc, vỉ thuốc, viên thuốc, chai lọ hoặc đơn thuốc để AI tự động nhận diện và đối chiếu trong 401 thuốc!
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                    <button
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Chụp Ảnh Bằng Camera</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Chọn Ảnh Từ Máy</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Image Preview & Re-take */}
                  <div className="relative rounded-2xl overflow-hidden border-2 border-slate-300 dark:border-slate-700 max-h-60 bg-black flex items-center justify-center">
                    <img src={cameraImage} alt="Ảnh thuốc" className="max-h-60 w-auto object-contain" />
                    <button
                      onClick={() => {
                        setCameraImage(null);
                        setAiResult(null);
                        setMatchedDrug(null);
                      }}
                      className="absolute top-2 right-2 px-2.5 py-1 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-semibold flex items-center gap-1 shadow"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Chụp lại
                    </button>
                  </div>

                  {/* AI Status / Trigger */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 font-semibold">Model AI Dzota: </span>
                      <strong className="text-blue-700 dark:text-cyan-400">{activeModel}</strong>
                    </div>
                    <button
                      onClick={() => setShowAiConfigModal(true)}
                      className="text-cyan-600 hover:underline font-semibold"
                    >
                      Đổi Model ⚙️
                    </button>
                  </div>

                  {!aiResult && !isAnalyzing && (
                    <button
                      onClick={handleRunAiScan}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition"
                    >
                      <Sparkles className="w-4 h-4 text-cyan-200" />
                      <span>BẮT ĐẦU PHÂN TÍCH THUỐC BẰNG AI</span>
                    </button>
                  )}

                  {isAnalyzing && (
                    <div className="p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 text-center space-y-2">
                      <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
                      <div className="font-bold text-blue-900 dark:text-cyan-300">
                        Đang phân tích hình ảnh & đối chiếu cơ sở dữ liệu 401 thuốc...
                      </div>
                      <p className="text-xs text-slate-500">
                        Gemini AI đang đọc tên hoạt chất, tá dược, hàm lượng và chỉ định lâm sàng...
                      </p>
                    </div>
                  )}

                  {aiError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs space-y-1.5">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-rose-600" />
                        <span>Không thể phân tích: {aiError}</span>
                      </div>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setShowAiConfigModal(true)}
                          className="px-2.5 py-1 rounded bg-rose-600 text-white font-bold"
                        >
                          Cấu hình lại API Key
                        </button>
                        <button
                          onClick={handleRunAiScan}
                          className="px-2.5 py-1 rounded bg-slate-200 text-slate-800 font-bold"
                        >
                          Thử lại
                        </button>
                      </div>
                    </div>
                  )}

                  {/* AI Results & Match Info */}
                  {aiResult && (
                    <div className="space-y-3.5 pt-2">
                      {/* Match banner if existing in 401 */}
                      {matchedDrug ? (
                        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 space-y-2.5">
                          <div className="flex items-center gap-1.5 font-extrabold text-emerald-800 text-sm">
                            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                            <span>ĐÃ TÌM THẤY TRONG DATA 401 THUỐC!</span>
                          </div>
                          <div className="text-base font-bold text-slate-900">
                            Thuốc #{matchedDrug.id}: {matchedDrug.tenThuoc}
                          </div>
                          <div className="p-2.5 rounded-xl bg-white/80 border border-emerald-200 space-y-1 text-xs">
                            <div className="text-[11px] font-bold text-emerald-900 uppercase">
                              🏷️ Nhóm, phân nhóm, phổ đầy đủ:
                            </div>
                            <div className="font-bold text-slate-800">
                              {matchedDrug.nhomPhanNhomPho}
                            </div>
                            <div className="text-slate-600">
                              Nhóm chính: <strong className="text-emerald-900">{matchedDrug.broadGroup}</strong> • Hoạt chất: <strong>{matchedDrug.hoatChat}</strong> • Dạng: <strong>{matchedDrug.dangBaoChe}</strong>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setShowCameraModal(false);
                              setActiveDrug(matchedDrug);
                            }}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow transition flex items-center gap-1.5 active:scale-95"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Xem Toàn Bộ 12 Trường Chi Tiết</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-400 text-amber-950 dark:text-amber-100 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 font-extrabold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                              <span>⚠️ THUỐC NGOÀI DATA 401 GỐC • QUÉT TỪ CAMERA & AI TỰ ĐỘNG PHÂN TÍCH</span>
                            </div>
                            <button
                              onClick={handleSaveScannedDrug}
                              className="px-3.5 py-1.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow flex items-center gap-1 whitespace-nowrap active:scale-95 transition"
                            >
                              <Save className="w-3.5 h-3.5" />
                              <span>Lưu Vào Data (+)</span>
                            </button>
                          </div>
                          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                            Thuốc này không nằm trong file <strong>DƯỢC LÝ OF DUY (401 thuốc gốc)</strong>. Dữ liệu dưới đây được AI nhận diện từ ảnh bao bì và chuẩn hóa theo 12 trường dược lý:
                          </p>
                        </div>
                      )}

                      {/* Extracted Details Box */}
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 space-y-3 text-xs">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                          <div>
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                              {aiResult.tenThuoc || 'Tên thuốc nhận diện'}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Dạng bào chế: <strong>{aiResult.dangBaoChe || 'Chế phẩm dược'}</strong> • Hàm lượng: <strong>{aiResult.hoatChatHamLuong || aiResult.hoatChat}</strong>
                            </div>
                          </div>
                          {aiResult.confidenceScore && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                              Độ tin cậy: {aiResult.confidenceScore}%
                            </span>
                          )}
                        </div>

                        {/* FULL NHÓM, PHÂN NHÓM, PHỔ AS USER REQUESTED */}
                        <div className="p-3 rounded-xl bg-blue-50/90 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 space-y-1">
                          <div className="text-[11px] font-bold text-blue-900 dark:text-cyan-300 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>
                            <span>NHÓM, PHÂN NHÓM, PHỔ DƯỢC LÝ ĐẦY ĐỦ:</span>
                          </div>
                          <div className="text-sm font-bold text-blue-950 dark:text-cyan-100 leading-snug">
                            {aiResult.nhomPhanNhomPho || `${aiResult.broadGroup || 'Chưa phân nhóm'} - Phân nhóm chi tiết`}
                          </div>
                          {aiResult.broadGroup && (
                            <div className="flex items-center gap-2 pt-1 text-[11px]">
                              <span className="text-slate-600 dark:text-slate-400 font-medium">Nhóm lớn chính:</span>
                              <span className="px-2 py-0.5 rounded-md font-bold bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-cyan-200">
                                {aiResult.broadGroup}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Thành phần: Hoạt chất & Tá dược riêng biệt */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div className="p-2.5 rounded-xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                            <div className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase">
                              🧪 Hoạt chất:
                            </div>
                            <div className="text-xs sm:text-sm font-bold text-indigo-950 dark:text-indigo-100 mt-0.5">
                              {aiResult.hoatChat || aiResult.hoatChatHamLuong}
                            </div>
                          </div>
                          <div className="p-2.5 rounded-xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                            <div className="text-[11px] font-bold text-purple-900 dark:text-purple-300 uppercase">
                              💊 Tá dược:
                            </div>
                            <div className="text-xs sm:text-sm font-semibold text-purple-950 dark:text-purple-100 mt-0.5">
                              {aiResult.taDuoc || 'Chưa ghi nhận tá dược cụ thể'}
                            </div>
                          </div>
                        </div>

                        {/* Chỉ định & Chống chỉ định */}
                        <div className="space-y-1.5">
                          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                            <div className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 uppercase">
                              🎯 Chỉ định chính:
                            </div>
                            <div className="text-xs font-medium text-emerald-950 dark:text-emerald-100 mt-0.5">
                              {aiResult.chiDinh}
                            </div>
                          </div>

                          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800">
                            <div className="text-[11px] font-bold text-rose-900 dark:text-rose-300 uppercase">
                              ⛔ Chống chỉ định & Cảnh báo:
                            </div>
                            <div className="text-xs font-bold text-rose-950 dark:text-rose-100 mt-0.5">
                              {aiResult.chongChiDinh}
                            </div>
                          </div>
                        </div>

                        {/* Thời điểm dùng, Liều dùng, Ghi chú */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800">
                            <strong className="text-cyan-800 dark:text-cyan-300">⏰ Thời điểm dùng:</strong>
                            <div className="mt-0.5 font-bold text-cyan-950 dark:text-cyan-100">{aiResult.thoiDiemDung}</div>
                          </div>
                          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <strong className="text-slate-700 dark:text-slate-300">📋 Liều dùng:</strong>
                            <div className="mt-0.5 text-slate-900 dark:text-slate-100">{aiResult.lieuDungCachDung}</div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-xs">
                          <strong className="text-violet-800 dark:text-violet-300">💡 Ghi chú tương tác lâm sàng:</strong>
                          <div className="mt-0.5 text-violet-950 dark:text-violet-100">{aiResult.ghiChu}</div>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-100 dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 font-semibold">
              Bản quyền công nghệ: <strong>Nhật Duy • Dzota.Edu AI</strong>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          8. MODAL CẤU HÌNH AI MODEL DZOTA
      ───────────────────────────────────────────────────────────── */}
      {showAiConfigModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white dark:bg-[#0B1120] rounded-3xl shadow-2xl border border-slate-300 p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">CẤU HÌNH AI MODEL DZOTA</h3>
              </div>
              <button onClick={() => setShowAiConfigModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Chọn Model AI (Mặc định hệ thống Dzota):
                </label>
                <select
                  value={activeModel}
                  onChange={e => setActiveModel(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold outline-none"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m} {m === 'gemini-2.0-flash' ? '(Khuyên dùng)' : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Tùy chọn: Nhập Gemini API Key cá nhân:
                </label>
                <input
                  type="password"
                  value={clientApiKey}
                  onChange={e => setClientApiKey(e.target.value)}
                  placeholder="Để trống nếu muốn dùng API Key của Dzota"
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none text-xs font-mono"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {hasSystemKey ? '✅ Đã tìm thấy API Key mặc định trong Dzota. Bạn có thể sử dụng trực tiếp.' : '⚠️ Chưa có key mặc định. Bạn có thể dán Gemini API Key từ Google AI Studio vào đây.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowAiConfigModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 text-xs font-bold"
              >
                Đóng
              </button>
              <button
                onClick={() => saveAiConfig(activeModel, clientApiKey)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          9. COMPARISON MODAL
      ───────────────────────────────────────────────────────────── */}
      {showCompareModal && compareList.length > 0 && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-5xl bg-white dark:bg-[#0B1120] rounded-3xl shadow-2xl border-2 border-slate-300 dark:border-slate-700 max-h-[92vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 bg-indigo-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-300" />
                <h3 className="text-lg font-bold">SO SÁNH DƯỢC LÝ ĐỐI CHIẾU</h3>
              </div>
              <button onClick={() => setShowCompareModal(false)} className="p-1 rounded-lg bg-white/10 hover:bg-rose-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {compareList.map(item => (
                  <div key={item.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-800 space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div>
                        <span className="text-xs font-mono font-bold text-cyan-600">#{item.id}</span>
                        <h4 className="text-base sm:text-lg font-bold text-blue-900 dark:text-white leading-tight">
                          {item.tenThuoc}
                        </h4>
                        <div className="text-xs text-slate-500">{item.nhomPhanNhomPho}</div>
                      </div>
                      <button onClick={() => addToCompare(item)} className="text-xs text-rose-600 font-semibold hover:underline">
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

            <div className="p-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 text-center">
              <button
                onClick={() => setCompareList([])}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 hover:bg-rose-100"
              >
                Xóa Danh Sách So Sánh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          10. FOOTER & COPYRIGHT
      ───────────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t-2 border-slate-300 dark:border-slate-800 bg-white dark:bg-[#0B1120] py-8 px-4 text-center text-xs sm:text-sm text-slate-600 dark:text-slate-400 print:text-black">
        <div className="max-w-4xl mx-auto space-y-2">
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base">
            HỆ THỐNG TRA CỨU DƯỢC LÝ LÂM SÀNG DZOTA • 401+ THUỐC ĐẦY ĐỦ
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
