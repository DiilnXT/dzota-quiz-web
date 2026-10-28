'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  Maximize, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Palette, 
  X, 
  Check, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  Layers, 
  Save, 
  Zap, 
  Share2,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  detectAnatomyLabelsWithGemini, 
  detectTextRegionsFromCanvas,
  MASK_COLOR_PRESETS,
  DEFAULT_MASK_STYLE,
  getStoredDefaultMaskStyle,
  setStoredDefaultMaskStyle
} from '../services/geminiService';
import { soundService } from '../services/soundService';

interface MaskEditorProps {
  lesson: any;
  currentImage?: any;
  onUpdateImageMasks: (imageId: string, masks: any[]) => void;
  onAddImage: (newImage: any) => void;
  onSelectImage: (imageId: string) => void;
  onDeleteImage: (imageId: string) => void;
  onOpenShare?: (lesson: any) => void;
}

export default function MaskEditor({
  lesson,
  currentImage,
  onUpdateImageMasks,
  onAddImage,
  onSelectImage,
  onDeleteImage,
  onOpenShare
}: MaskEditorProps) {
  const [selectedMaskId, setSelectedMaskId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [drawMode, setDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [tempBox, setTempBox] = useState<any>(null);

  // Dragging and resizing
  const [dragState, setDragState] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Modals & Panels
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [showFullList, setShowFullList] = useState(false);

  // Save feedback
  const [lastSavedTime, setLastSavedTime] = useState('Vừa xong');
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Active styles
  const [activeColor, setActiveColor] = useState(DEFAULT_MASK_STYLE.color);
  const [activeBorderColor, setActiveBorderColor] = useState(DEFAULT_MASK_STYLE.borderColor);
  const [activeTextColor, setActiveTextColor] = useState(DEFAULT_MASK_STYLE.textColor);
  const [activeOpacity, setActiveOpacity] = useState(DEFAULT_MASK_STYLE.opacity);
  const [activeTexture, setActiveTexture] = useState(DEFAULT_MASK_STYLE.texture);
  const [activeDisplayMode, setActiveDisplayMode] = useState(DEFAULT_MASK_STYLE.displayMode);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const masks = currentImage?.masks || [];

  // Load default styles
  useEffect(() => {
    const saved = getStoredDefaultMaskStyle();
    setActiveColor(saved.color || '#070b14');
    setActiveBorderColor(saved.borderColor || '#6366f1');
    setActiveTextColor(saved.textColor || '#ffffff');
    setActiveOpacity(saved.opacity ?? 1.0);
    setActiveTexture(saved.texture || 'solid');
    setActiveDisplayMode(saved.displayMode || 'number');
  }, []);

  // Update styles when selecting a mask
  useEffect(() => {
    if (selectedMaskId) {
      const target = masks.find((m: any) => m.id === selectedMaskId);
      if (target) {
        if (target.color) setActiveColor(target.color);
        if (target.borderColor) setActiveBorderColor(target.borderColor);
        if (target.textColor) setActiveTextColor(target.textColor);
        if (target.opacity !== undefined) setActiveOpacity(target.opacity);
        if (target.texture) setActiveTexture(target.texture);
        if (target.displayMode) setActiveDisplayMode(target.displayMode);
      }
    }
  }, [selectedMaskId]);

  // Shortcuts: Ctrl+S to save, Ctrl+V to paste image from clipboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = (loadEvent) => {
            const dataUrl = loadEvent.target?.result as string;
            if (dataUrl) {
              handleCreateNewImageFromDataUrl(dataUrl, 'Sơ đồ dán từ Clipboard');
              soundService.playSuccess();
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
    };
  }, [lesson, masks, currentImage]);

  const handleManualSave = () => {
    if (currentImage) {
      onUpdateImageMasks(currentImage.id, masks);
    }
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(timeStr);
    setShowSaveToast(true);
    soundService.playSuccess();
    setTimeout(() => setShowSaveToast(false), 2500);
  };

  const handleCreateNewImageFromDataUrl = (dataUrl: string, defaultTitle = 'Sơ đồ giải phẫu') => {
    const newImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: `${defaultTitle} #${(lesson?.images?.length || 0) + 1}`,
      url: dataUrl,
      masks: [],
      createdAt: new Date().toISOString()
    };
    onAddImage(newImage);
    soundService.playStationChime();
    setScanMessage('Đã tải ảnh mới thành công! Bấm "Quét Gemini AI" để sinh ô che tự động.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        handleCreateNewImageFromDataUrl(event.target.result, file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // AI Auto Detect using Dzota Gemini Settings
  const handleAutoDetect = async () => {
    if (!currentImage?.url) return;
    setIsScanning(true);
    setScanMessage('Đang phân tích hình ảnh bằng Google Gemini AI...');

    try {
      const res = await detectAnatomyLabelsWithGemini(currentImage.url);
      if (res.success && res.masks && res.masks.length > 0) {
        onUpdateImageMasks(currentImage.id, res.masks);
        soundService.playSuccess();
        setScanMessage(`Đã phát hiện và tạo ${res.masks.length} ô che giải phẫu thành công!`);
        if (res.masks[0]) setSelectedMaskId(res.masks[0].id);
      } else {
        // Fallback to Canvas Vision if Gemini returned no masks
        handleCanvasVisionDetect();
      }
    } catch (err: any) {
      // Fallback to local canvas vision
      handleCanvasVisionDetect();
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(''), 4000);
    }
  };

  // Canvas Vision Edge Detection (Local Fallback)
  const handleCanvasVisionDetect = async () => {
    if (!currentImage?.url) return;
    setIsScanning(true);
    setScanMessage('Đang quét đường viền và nhãn giải phẫu bằng Canvas Vision...');

    try {
      const detected = await detectTextRegionsFromCanvas(currentImage.url);
      if (detected.length > 0) {
        onUpdateImageMasks(currentImage.id, detected);
        soundService.playSuccess();
        setScanMessage(`Canvas Vision đã tìm thấy ${detected.length} vùng chú thích.`);
        if (detected[0]) setSelectedMaskId(detected[0].id);
      } else {
        setScanMessage('Không phát hiện thấy nhãn chú thích rõ ràng. Bạn có thể kéo chuột để vẽ ô che thủ công.');
      }
    } catch (err) {
      setScanMessage('Lỗi quét ảnh. Vui lòng thử lại hoặc vẽ ô che thủ công.');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(''), 4000);
    }
  };

  // Manual Drawing
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (!drawMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setIsDrawing(true);
    setDrawStart({ x, y });
    setTempBox({ x, y, width: 0, height: 0 });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const currentX = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const currentY = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    const x = Math.min(drawStart.x, currentX);
    const y = Math.min(drawStart.y, currentY);
    const width = Math.abs(currentX - drawStart.x);
    const height = Math.abs(currentY - drawStart.y);

    setTempBox({ x, y, width, height });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (tempBox && tempBox.width > 1.5 && tempBox.height > 1.0) {
      const newMask = {
        id: `mask_${Date.now()}`,
        label: `Chi tiết #${masks.length + 1}`,
        x: Number(tempBox.x.toFixed(1)),
        y: Number(tempBox.y.toFixed(1)),
        width: Number(tempBox.width.toFixed(1)),
        height: Number(tempBox.height.toFixed(1)),
        synonyms: [],
        hint: '',
        color: activeColor,
        borderColor: activeBorderColor,
        textColor: activeTextColor,
        opacity: activeOpacity,
        texture: activeTexture,
        displayMode: activeDisplayMode,
        isCovered: true
      };
      const updated = [...masks, newMask];
      onUpdateImageMasks(currentImage.id, updated);
      setSelectedMaskId(newMask.id);
      soundService.playTap();
    }
    setTempBox(null);
  };

  // Expand all masks by padding percent
  const handleExpandAllMasks = (paddingPercent = 12) => {
    const updated = masks.map((m: any) => {
      const padW = (m.width * paddingPercent) / 100;
      const padH = (m.height * paddingPercent) / 100;
      const newX = Math.max(0, m.x - padW / 2);
      const newY = Math.max(0, m.y - padH / 2);
      const newW = Math.min(100 - newX, m.width + padW);
      const newH = Math.min(100 - newY, m.height + padH);
      return {
        ...m,
        x: Number(newX.toFixed(1)),
        y: Number(newY.toFixed(1)),
        width: Number(newW.toFixed(1)),
        height: Number(newH.toFixed(1))
      };
    });
    onUpdateImageMasks(currentImage.id, updated);
    soundService.playTap();
  };

  // Update selected mask properties
  const handleUpdateSelectedMask = (field: string, val: any) => {
    if (!selectedMaskId) return;
    const updated = masks.map((m: any) => {
      if (m.id !== selectedMaskId) return m;
      return { ...m, [field]: val };
    });
    onUpdateImageMasks(currentImage.id, updated);
  };

  const handleDeleteMask = (id: string) => {
    const updated = masks.filter((m: any) => m.id !== id);
    onUpdateImageMasks(currentImage.id, updated);
    if (selectedMaskId === id) {
      setSelectedMaskId(updated[0]?.id || null);
    }
    soundService.playTap();
  };

  const selectedMask = masks.find((m: any) => m.id === selectedMaskId) || null;
  const selectedIndex = masks.findIndex((m: any) => m.id === selectedMaskId);

  return (
    <div className="flex-1 flex flex-col bg-slate-900/60 dark:bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden backdrop-blur-sm relative">
      {/* ─── 1. TOP HEADER & LESSON INFO ─── */}
      <div className="p-3.5 sm:p-4 bg-slate-900/90 border-b border-slate-800/80 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Bài học hiện tại
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white truncate">
                {lesson?.title || 'Chưa chọn bài học'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              {lesson?.description || 'Hệ thống hỗ trợ quét AI, nhận diện nhãn giải phẫu và cấu hình ô che chuẩn y khoa.'}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Last saved note */}
            <span className="text-[11px] text-slate-400 hidden lg:inline">
              {showSaveToast ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <CheckCircle2 size={13} /> Đã lưu
                </span>
              ) : (
                `Lưu: ${lastSavedTime}`
              )}
            </span>

            {/* Lưu bài học */}
            <button
              onClick={handleManualSave}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
            >
              <Save size={14} />
              <span>Lưu bài học</span>
            </button>

            {/* Phân quyền chia sẻ */}
            {onOpenShare && (
              <button
                onClick={() => onOpenShare(lesson)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 size={14} className="text-indigo-400" />
                <span>Phân quyền</span>
              </button>
            )}

            {/* Tải ảnh lên */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload size={14} className="text-sky-400" />
              <span>Tải ảnh mới</span>
            </button>
          </div>
        </div>

        {/* Multi-Image tab strip */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {lesson?.images?.map((img: any, idx: number) => {
            const isCurrent = img.id === currentImage?.id;
            return (
              <div
                key={img.id}
                onClick={() => onSelectImage(img.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/25'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="w-5 h-5 rounded-md overflow-hidden bg-black/40 shrink-0">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="truncate max-w-[140px]">
                  {img.title || `Sơ đồ #${idx + 1}`}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isCurrent ? 'bg-indigo-950 text-indigo-300' : 'bg-slate-700 text-slate-400'
                }`}>
                  {img.masks?.length || 0} ô
                </span>

                {lesson?.images?.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Bạn có chắc muốn xóa sơ đồ "${img.title}" này không?`)) {
                        onDeleteImage(img.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer transition-all shrink-0"
          >
            <Plus size={13} />
            <span>Thêm góc nhìn...</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TOOLBAR (AI SCAN + DRAW + CUSTOMIZE) ─── */}
      <div className="px-3.5 py-2 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* QUÉT GEMINI AI (DÙNG SETTING CHÍNH DZOTA) */}
          <button
            onClick={handleAutoDetect}
            disabled={isScanning || !currentImage}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
            title="Quét và nhận diện tự động bằng Gemini AI của Dzota"
          >
            <Sparkles size={14} className="text-amber-300" />
            <span>Quét Gemini AI</span>
          </button>

          {/* QUÉT CANVAS VISION */}
          <button
            onClick={handleCanvasVisionDetect}
            disabled={isScanning || !currentImage}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            title="Nhận diện tự động đường viền nhãn cục bộ"
          >
            <Zap size={14} className="text-sky-400" />
            <span>Quét Canvas Vision</span>
          </button>

          {/* VẼ Ô CHE THỦ CÔNG */}
          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
              drawMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <Edit3 size={14} />
            <span>{drawMode ? 'Đang vẽ: Kéo thả chuột' : '+ Vẽ ô che thủ công'}</span>
          </button>

          {/* NỚI RỘNG CHE KÍN */}
          <button
            onClick={() => handleExpandAllMasks(12)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            title="Tự động mở rộng viền ô che thêm 12% để che kín hoàn toàn chữ"
          >
            <Maximize size={14} className="text-cyan-400" />
            <span>Nới rộng che kín</span>
          </button>

          {/* TÙY CHỈNH Ô CHE */}
          <button
            onClick={() => setShowStyleModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Palette size={14} className="text-purple-400" />
            <span>Màu sắc & Kiểu dáng</span>
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.6, Number((prev - 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Thu nhỏ"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-mono text-slate-400 min-w-[40px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, Number((prev + 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Phóng to"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700"
            title="Về 100%"
          >
            <RotateCcw size={14} />
          </button>

          <div className="w-px h-4 bg-slate-800 mx-1"></div>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showInspector
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            Danh sách ({masks.length})
          </button>
        </div>
      </div>

      {/* Scanning status banner */}
      {scanMessage && (
        <div className="px-4 py-2 bg-indigo-950/80 border-b border-indigo-800/80 text-xs text-indigo-300 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-amber-300 animate-spin" />
            <span>{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage('')} className="text-slate-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ─── 3. WORKSPACE: CANVAS + RIGHT INSPECTOR ─── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Main Canvas view */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#070b14] relative select-none"
        >
          {currentImage ? (
            <div 
              className="relative transition-transform duration-75 inline-block"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
            >
              <img
                ref={imageRef}
                src={currentImage.url}
                alt="Sơ đồ giải phẫu"
                className={`max-w-full max-h-[70vh] rounded-xl object-contain shadow-2xl ${
                  drawMode ? 'cursor-crosshair' : 'cursor-default'
                }`}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
              />

              {/* Temp drawing box preview */}
              {isDrawing && tempBox && (
                <div
                  className="absolute border-2 border-dashed border-amber-400 bg-amber-500/30 rounded-lg pointer-events-none"
                  style={{
                    left: `${tempBox.x}%`,
                    top: `${tempBox.y}%`,
                    width: `${tempBox.width}%`,
                    height: `${tempBox.height}%`
                  }}
                />
              )}

              {/* Existing masks overlay */}
              {masks.map((mask: any, idx: number) => {
                const isSelected = mask.id === selectedMaskId;
                return (
                  <div
                    key={mask.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMaskId(mask.id);
                      soundService.playTap();
                    }}
                    className={`absolute rounded-md transition-all flex items-center justify-center font-bold text-xs select-none cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black z-20 shadow-xl'
                        : 'z-10 hover:opacity-90'
                    }`}
                    style={{
                      left: `${mask.x}%`,
                      top: `${mask.y}%`,
                      width: `${mask.width}%`,
                      height: `${mask.height}%`,
                      backgroundColor: mask.color || activeColor,
                      border: `1.5px solid ${mask.borderColor || activeBorderColor}`,
                      color: mask.textColor || activeTextColor,
                      opacity: mask.opacity ?? activeOpacity
                    }}
                  >
                    <span>#{idx + 1}</span>

                    {/* Resize handle if selected */}
                    {isSelected && (
                      <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-sky-400 border border-black rounded-full pointer-events-none" />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div 
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = e.dataTransfer.files;
                if (files && files.length > 0 && files[0].type.startsWith('image/')) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    if (typeof ev.target?.result === 'string') {
                      handleCreateNewImageFromDataUrl(ev.target.result, files[0].name.replace(/\.[^/.]+$/, ''));
                    }
                  };
                  reader.readAsDataURL(files[0]);
                }
              }}
              className="flex-1 min-h-[420px] flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-800 rounded-3xl m-4 bg-[#070b14]/50 hover:border-cyan-500/50 transition-colors"
            >
              <div className="w-16 h-16 rounded-3xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3.5 shadow-xl">
                <Upload size={32} />
              </div>
              <h3 className="text-base font-bold text-white mb-1.5">
                Chưa có sơ đồ nào trong bài học này
              </h3>
              <p className="text-xs text-slate-400 max-w-md leading-relaxed mb-6">
                Nhấn <kbd className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700 font-bold">Ctrl + V</kbd> để dán ảnh trực tiếp từ Clipboard, kéo thả ảnh vào đây, hoặc tải file từ máy tính.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Upload size={14} />
                  <span>Tải ảnh từ máy tính</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (navigator.clipboard && navigator.clipboard.read) {
                        const items = await navigator.clipboard.read();
                        for (const item of items) {
                          const imageType = item.types.find(t => t.startsWith('image/'));
                          if (imageType) {
                            const blob = await item.getType(imageType);
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              if (typeof ev.target?.result === 'string') {
                                handleCreateNewImageFromDataUrl(ev.target.result, 'Sơ đồ dán từ Clipboard');
                              }
                            };
                            reader.readAsDataURL(blob);
                            return;
                          }
                        }
                      }
                      alert('Vui lòng chụp màn hình hoặc sao chép ảnh rồi bấm Ctrl + V trên bàn phím!');
                    } catch (err) {
                      alert('Hãy nhấn Ctrl + V để dán ảnh từ Clipboard!');
                    }
                  }}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Copy size={14} className="text-cyan-400" />
                  <span>Dán Ảnh (Ctrl + V)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Inspector & Mask Editor */}
        {showInspector && (
          <aside className="w-full lg:w-80 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers size={15} className="text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Cấu tạo ({masks.length})
                </h3>
              </div>
              {masks.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Bạn có chắc muốn xóa tất cả các ô che trên sơ đồ này?')) {
                      onUpdateImageMasks(currentImage.id, []);
                      setSelectedMaskId(null);
                    }
                  }}
                  className="text-[11px] text-rose-400 hover:text-rose-300 font-bold"
                >
                  Xóa tất cả
                </button>
              )}
            </div>

            {/* Quick navigator */}
            {masks.length > 0 && (
              <div className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => {
                    const prevIdx = selectedIndex > 0 ? selectedIndex - 1 : masks.length - 1;
                    if (masks[prevIdx]) setSelectedMaskId(masks[prevIdx].id);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Ô trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-slate-300">
                  Ô #{selectedIndex >= 0 ? selectedIndex + 1 : 1} / {masks.length}
                </span>
                <button
                  onClick={() => {
                    const nextIdx = selectedIndex < masks.length - 1 ? selectedIndex + 1 : 0;
                    if (masks[nextIdx]) setSelectedMaskId(masks[nextIdx].id);
                  }}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                  title="Ô tiếp theo"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {/* Selected mask detail form */}
            {selectedMask ? (
              <div className="space-y-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-400">
                    Chi tiết #{selectedIndex + 1}
                  </span>
                  <button
                    onClick={() => handleDeleteMask(selectedMask.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded"
                    title="Xóa ô này"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Tên cơ quan / Đáp án đúng:
                  </label>
                  <input
                    type="text"
                    value={selectedMask.label || ''}
                    onChange={(e) => handleUpdateSelectedMask('label', e.target.value)}
                    placeholder="VD: Thùy gan phải"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Đáp án đồng nghĩa / Latinh (cách nhau dấu phẩy):
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(selectedMask.synonyms) ? selectedMask.synonyms.join(', ') : (selectedMask.synonyms || '')}
                    onChange={(e) => {
                      const arr = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                      handleUpdateSelectedMask('synonyms', arr);
                    }}
                    placeholder="VD: Gan phải, Thùy phải gan"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1">
                    Gợi ý lâm sàng / Vị trí liên quan:
                  </label>
                  <textarea
                    rows={2}
                    value={selectedMask.hint || ''}
                    onChange={(e) => handleUpdateSelectedMask('hint', e.target.value)}
                    placeholder="VD: Nằm ở hạ sườn phải, liên quan môn vị và tá tràng..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
                Bấm vào một ô che trên sơ đồ để chỉnh sửa tên và đáp án
              </div>
            )}

            {/* List of all masks */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide block mb-1">
                Tất cả ô che ({masks.length})
              </span>
              <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
                {masks.map((m: any, idx: number) => {
                  const isSel = m.id === selectedMaskId;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setSelectedMaskId(m.id)}
                      className={`flex items-center justify-between p-2 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                        isSel
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-slate-950/40 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="truncate">
                        #{idx + 1} {m.label || 'Chưa đặt tên'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMask(m.id);
                        }}
                        className="text-slate-400 hover:text-rose-400 ml-2"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Style customization modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Palette size={16} className="text-purple-400" />
                <span>Màu Sắc & Kiểu Dáng Ô Che</span>
              </h3>
              <button onClick={() => setShowStyleModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5 uppercase">
                  Bảng màu y khoa
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {MASK_COLOR_PRESETS.map((p: any) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActiveColor(p.hex);
                        setActiveBorderColor(p.border);
                        setActiveTextColor(p.textColor);
                        setStoredDefaultMaskStyle({
                          color: p.hex,
                          borderColor: p.border,
                          textColor: p.textColor
                        });
                        if (selectedMaskId) {
                          handleUpdateSelectedMask('color', p.hex);
                          handleUpdateSelectedMask('borderColor', p.border);
                          handleUpdateSelectedMask('textColor', p.textColor);
                        }
                      }}
                      className="p-2 rounded-xl flex flex-col items-center gap-1 border transition-all text-[10px] font-bold"
                      style={{
                        backgroundColor: p.hex,
                        borderColor: p.border,
                        color: p.textColor
                      }}
                    >
                      <span>{p.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowStyleModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
