'use client'

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Upload, 
  Clipboard, 
  Maximize, 
  Minimize, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Settings, 
  Palette, 
  X, 
  Check, 
  Tag, 
  Sliders, 
  Edit3, 
  ChevronRight, 
  ChevronLeft,
  HelpCircle,
  Layers,
  CheckCircle2,
  Save,
  CheckCheck,
  Zap,
  Key,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  Share2
} from 'lucide-react';
import { 
  detectAnatomyLabelsWithGemini, 
  detectTextRegionsFromCanvas,
  isDefaultSampleImage,
  MASK_COLOR_PRESETS,
  DEFAULT_MASK_STYLE,
  getStoredDefaultMaskStyle,
  setStoredDefaultMaskStyle,
  getStoredApiKey,
  setStoredApiKey,
  getStoredModel,
  setStoredModel
} from '../services/geminiService';
import { soundService } from '../services/soundService';

export default function MaskEditor({
  lesson,
  currentImage,
  onUpdateImageMasks,
  onAddImage,
  onSelectImage,
  onDeleteImage,
  onOpenShare
}) {
  const [selectedMaskId, setSelectedMaskId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [drawMode, setDrawMode] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const [tempBox, setTempBox] = useState(null);

  // Dragging and resizing
  const [dragState, setDragState] = useState(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Dzota UI Modals & Drawers
  const [showStyleModal, setShowStyleModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [showFullList, setShowFullList] = useState(false); // Collapsed by default ("cÃ²n k thÃ¬ k hiá»ƒn thá»‹ full")
  const [showDropdownSelect, setShowDropdownSelect] = useState(false); // Dropdown popover toggle

  // API Key input inside modal
  const [inputApiKey, setInputApiKey] = useState('');
  const [aiModalNotice, setAiModalNotice] = useState('');

  // Explicit Save states
  const [lastSavedTime, setLastSavedTime] = useState('Vá»«a xong');
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Active styles
  const [activeColor, setActiveColor] = useState('#070b14');
  const [activeBorderColor, setActiveBorderColor] = useState('#6366f1');
  const [activeTextColor, setActiveTextColor] = useState('#ffffff');
  const [activeOpacity, setActiveOpacity] = useState(1.0);
  const [activeTexture, setActiveTexture] = useState('solid');
  const [activeDisplayMode, setActiveDisplayMode] = useState('number');

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  const masks = currentImage?.masks || [];

  // Load defaults
  useEffect(() => {
    const saved = getStoredDefaultMaskStyle();
    setActiveColor(saved.color || '#070b14');
    setActiveBorderColor(saved.borderColor || '#6366f1');
    setActiveTextColor(saved.textColor || '#ffffff');
    setActiveOpacity(saved.opacity ?? 1.0);
    setActiveTexture(saved.texture || 'solid');
    setActiveDisplayMode(saved.displayMode || 'number');
    setInputApiKey(getStoredApiKey());
  }, []);

  // Update styles when selecting a mask
  useEffect(() => {
    if (selectedMaskId) {
      const target = masks.find(m => m.id === selectedMaskId);
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

  // Keyboard Shortcuts: Ctrl+V paste and Ctrl+S save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSave();
      }
    };

    const handlePaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          const reader = new FileReader();
          reader.onload = (event) => {
            handleCreateNewImageFromDataUrl(event.target.result, 'áº¢nh chá»¥p Clipboard');
          };
          reader.readAsDataURL(blob);
          e.preventDefault();
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
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLastSavedTime(timeStr);
    setShowSaveToast(true);
    soundService.playSuccess();
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  const handleCreateNewImageFromDataUrl = (dataUrl, defaultTitle = 'SÆ¡ Ä‘á»“ giáº£i pháº«u') => {
    const newImage = {
      id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: `${defaultTitle} #${(lesson?.images?.length || 0) + 1}`,
      url: dataUrl,
      masks: [],
      createdAt: new Date().toISOString()
    };
    onAddImage(newImage);
    soundService.playStationChime();
    setScanMessage('ÄÃ£ táº£i áº£nh má»›i thÃ nh cÃ´ng! Báº¥m [QuÃ©t Gemini AI] hoáº·c [QuÃ©t Canvas Vision] Ä‘á»ƒ sinh Ã´ che tá»± Ä‘á»™ng.');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleCreateNewImageFromDataUrl(event.target.result, file.name.replace(/\.[^/.]+$/, ''));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        handleCreateNewImageFromDataUrl(event.target.result, file.name.replace(/\.[^/.]+$/, ''));
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. GEMINI AI SCANNING
  const handleAutoDetect = async (apiKeyOverride = '') => {
    if (!currentImage?.url) return;
    
    const keyToUse = apiKeyOverride || getStoredApiKey();
    const isSample = isDefaultSampleImage(currentImage.url);

    // If no key and not sample image, open Dzota AI Setup Modal
    if (!keyToUse && !isSample) {
      setAiModalNotice(`SÆ¡ Ä‘á»“ "${currentImage.title || 'Má»›i'}" cáº§n káº¿t ná»‘i Gemini AI Vision Ä‘á»ƒ Ä‘á»c chá»¯ tiáº¿ng Viá»‡t vÃ  táº¡o Ä‘Ã¡p Ã¡n. Vui lÃ²ng dÃ¡n API Key hoáº·c báº¥m QuÃ©t Canvas Vision!`);
      setShowAiModal(true);
      return;
    }

    setIsScanning(true);
    setScanMessage('Google Gemini AI Ä‘ang quÃ©t Ä‘a phÆ°Æ¡ng thá»©c vÃ  Ä‘á»c nhÃ£n giáº£i pháº«u...');
    soundService.playTick();

    try {
      const result = await detectAnatomyLabelsWithGemini(currentImage.url, keyToUse);
      if (result.success && result.masks?.length > 0) {
        onUpdateImageMasks(currentImage.id, result.masks);
        setSelectedMaskId(result.masks[0].id);
        soundService.playSuccess();
        setScanMessage(`ðŸŽ‰ Gemini AI Ä‘Ã£ nháº­n diá»‡n thÃ nh cÃ´ng ${result.masks.length} cáº¥u táº¡o giáº£i pháº«u!`);
        setShowAiModal(false);
      } else if (result.needsApiKey) {
        setShowAiModal(true);
        setAiModalNotice(result.message);
      } else {
        alert(result.error || 'Gemini khÃ´ng nháº­n diá»‡n Ä‘Æ°á»£c chá»¯ nÃ o trÃªn áº£nh.');
        setScanMessage('');
      }
    } catch (err) {
      alert(`Lá»—i Gemini AI: ${err.message}`);
      setScanMessage('');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(''), 4500);
    }
  };

  // 2. CLIENT-SIDE CANVAS VISION SCANNING (100% REAL LOCAL DETECTION ON ANY IMAGE)
  const handleCanvasVisionDetect = async () => {
    if (!currentImage?.url) return;
    setIsScanning(true);
    setScanMessage('Äang phÃ¢n tÃ­ch ma tráº­n Ä‘iá»ƒm áº£nh Canvas trÃªn sÆ¡ Ä‘á»“ cá»§a báº¡n...');
    soundService.playTick();

    try {
      const detected = await detectTextRegionsFromCanvas(currentImage.url);
      if (detected && detected.length > 0) {
        onUpdateImageMasks(currentImage.id, detected);
        setSelectedMaskId(detected[0].id);
        soundService.playSuccess();
        setScanMessage(`âš¡ Canvas Vision Ä‘Ã£ Ä‘á»‹nh vá»‹ chÃ­nh xÃ¡c ${detected.length} cá»¥m chá»¯ trÃªn sÆ¡ Ä‘á»“!`);
        setShowAiModal(false);
      } else {
        alert('Canvas Vision khÃ´ng tÃ¬m tháº¥y nhÃ£n chá»¯ rÃµ rÃ ng. Báº¡n hÃ£y dÃ¹ng cÃ´ng cá»¥ [Váº½ Ã” Che] Ä‘á»ƒ khoanh vÃ¹ng thá»§ cÃ´ng!');
        setScanMessage('');
      }
    } catch (err) {
      alert(`Lá»—i quÃ©t Canvas: ${err.message}`);
      setScanMessage('');
    } finally {
      setIsScanning(false);
      setTimeout(() => setScanMessage(''), 4500);
    }
  };

  const handleSaveApiKeyAndScan = () => {
    if (!inputApiKey.trim()) {
      alert('Vui lÃ²ng nháº­p API Key trÆ°á»›c khi lÆ°u!');
      return;
    }
    setStoredApiKey(inputApiKey.trim());
    handleAutoDetect(inputApiKey.trim());
  };

  // Expand all masks to guarantee zero peek
  const handleExpandAllMasks = (deltaPercent = 15) => {
    const factor = 1 + deltaPercent / 100;
    const updated = masks.map(m => {
      const newWidth = Math.min(99, Number((m.width * factor).toFixed(2)));
      const newHeight = Math.min(99, Number((m.height * factor).toFixed(2)));
      const diffW = newWidth - m.width;
      const diffH = newHeight - m.height;
      const newX = Math.max(0, Number((m.x - diffW / 2).toFixed(2)));
      const newY = Math.max(0, Number((m.y - diffH / 2).toFixed(2)));
      return { ...m, x: newX, y: newY, width: newWidth, height: newHeight };
    });
    onUpdateImageMasks(currentImage.id, updated);
    soundService.playTick();
    setScanMessage(`ÄÃ£ ná»›i rá»™ng +${deltaPercent}% kÃ­ch thÆ°á»›c Ã´ che Ä‘á»ƒ phá»§ kÃ­n 100% chá»¯!`);
    setTimeout(() => setScanMessage(''), 3000);
  };

  // Apply style updates
  const applyStyleUpdate = (updates, applyToAll = false) => {
    const updated = masks.map(m => {
      if (applyToAll || m.id === selectedMaskId) {
        return { ...m, ...updates };
      }
      return m;
    });
    onUpdateImageMasks(currentImage.id, updated);

    if (applyToAll) {
      const newDefault = {
        color: updates.color ?? activeColor,
        borderColor: updates.borderColor ?? activeBorderColor,
        textColor: updates.textColor ?? activeTextColor,
        opacity: updates.opacity ?? activeOpacity,
        texture: updates.texture ?? activeTexture,
        displayMode: updates.displayMode ?? activeDisplayMode
      };
      setStoredDefaultMaskStyle(newDefault);
      soundService.playSuccess();
      setScanMessage('ÄÃ£ Ä‘á»“ng bá»™ giao diá»‡n cho toÃ n bá»™ cÃ¡c Ã´ che!');
      setTimeout(() => setScanMessage(''), 3000);
    }
  };

  // Drawing a new box
  const handleMouseDown = (e) => {
    if (!drawMode || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsDrawing(true);
    setDrawStart({ x, y });
    setTempBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e) => {
    if (isDrawing && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const currentX = ((e.clientX - rect.left) / rect.width) * 100;
      const currentY = ((e.clientY - rect.top) / rect.height) * 100;

      const minX = Math.min(drawStart.x, currentX);
      const minY = Math.min(drawStart.y, currentY);
      const width = Math.abs(currentX - drawStart.x);
      const height = Math.abs(currentY - drawStart.y);

      setTempBox({
        x: Math.max(0, Math.min(100, minX)),
        y: Math.max(0, Math.min(100, minY)),
        width: Math.min(100 - minX, width),
        height: Math.min(100 - minY, height)
      });
      return;
    }

    if (dragState && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragState.startX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragState.startY) / rect.height) * 100;

      const mask = masks.find(m => m.id === dragState.maskId);
      if (!mask) return;

      if (dragState.type === 'move') {
        const newX = Math.max(0, Math.min(100 - mask.width, dragState.initialX + deltaXPercent));
        const newY = Math.max(0, Math.min(100 - mask.height, dragState.initialY + deltaYPercent));
        const updated = masks.map(m => m.id === mask.id ? { ...m, x: Number(newX.toFixed(2)), y: Number(newY.toFixed(2)) } : m);
        onUpdateImageMasks(currentImage.id, updated);
      } else if (dragState.type === 'resize') {
        let newX = dragState.initialX;
        let newY = dragState.initialY;
        let newW = dragState.initialWidth;
        let newH = dragState.initialHeight;

        if (dragState.handle.includes('e')) newW = Math.max(4, dragState.initialWidth + deltaXPercent);
        if (dragState.handle.includes('s')) newH = Math.max(3, dragState.initialHeight + deltaYPercent);
        if (dragState.handle.includes('w')) {
          const possibleW = dragState.initialWidth - deltaXPercent;
          if (possibleW > 4) {
            newX = dragState.initialX + deltaXPercent;
            newW = possibleW;
          }
        }
        if (dragState.handle.includes('n')) {
          const possibleH = dragState.initialHeight - deltaYPercent;
          if (possibleH > 3) {
            newY = dragState.initialY + deltaYPercent;
            newH = possibleH;
          }
        }

        const updated = masks.map(m => m.id === mask.id ? {
          ...m,
          x: Number(newX.toFixed(2)),
          y: Number(newY.toFixed(2)),
          width: Number(newW.toFixed(2)),
          height: Number(newH.toFixed(2))
        } : m);
        onUpdateImageMasks(currentImage.id, updated);
      }
    }
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      if (tempBox && tempBox.width > 3 && tempBox.height > 2) {
        const newMask = {
          id: `mask_manual_${Date.now()}`,
          label: `Chi tiáº¿t #${masks.length + 1}`,
          x: Number(tempBox.x.toFixed(2)),
          y: Number(tempBox.y.toFixed(2)),
          width: Number(tempBox.width.toFixed(2)),
          height: Number(tempBox.height.toFixed(2)),
          synonyms: [],
          hint: 'Quan sÃ¡t vá»‹ trÃ­ giáº£i pháº«u trÃªn sÆ¡ Ä‘á»“',
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
        soundService.playTick();
      }
      setTempBox(null);
      setDrawMode(false);
    }
    setDragState(null);
  };

  const handleDeleteMask = (id) => {
    const updated = masks.filter(m => m.id !== id);
    onUpdateImageMasks(currentImage.id, updated);
    if (selectedMaskId === id) setSelectedMaskId(null);
    soundService.playTick();
  };

  const selectedMask = masks.find(m => m.id === selectedMaskId);
  const selectedMaskIndex = masks.findIndex(m => m.id === selectedMaskId);

  // Auto-select first mask if available
  useEffect(() => {
    if (!selectedMaskId && masks.length > 0) {
      setSelectedMaskId(masks[0].id);
    }
  }, [masks, selectedMaskId]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0F19] overflow-hidden relative">
      {/* â”€â”€â”€ 1. TOP HEADER & MULTI-IMAGE CAROUSEL â”€â”€â”€ */}
      <div className="p-4 bg-[#111827] border-b border-slate-800/80 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800/80">
                BÃ i Há»c Hiá»‡n Táº¡i
              </span>
              <h2 className="text-base sm:text-lg font-black text-white truncate max-w-xl">
                {lesson?.title || 'ChÆ°a chá»n bÃ i há»c'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Táº¡o Ä‘á», táº£i áº£nh nhiá»u pháº§n, nháº­n diá»‡n AI OCR vÃ  cáº¥u hÃ¬nh Ã´ che chuáº©n y khoa.
            </p>
          </div>

          {/* Action buttons & Save */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
            {/* Last saved indicator */}
            <span className="hidden sm:inline text-[11px] text-slate-400 font-medium mr-1">
              {lastSavedTime ? `ÄÃ£ lÆ°u: ${lastSavedTime}` : ''}
            </span>

            {/* SAVE BUTTON */}
            <button
              onClick={handleManualSave}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              title="LÆ°u láº¡i toÃ n bá»™ bÃ i há»c (Ctrl + S)"
            >
              <Save className="w-4 h-4" />
              <span>LÆ¯U BÃ€I Há»ŒC</span>
            </button>

            {/* SHARE & ACCESS CONTROL BUTTON */}
            {onOpenShare && (
              <button
                onClick={() => onOpenShare(lesson)}
                className="bg-[#1E293B] hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                title="Chia sáº» link & PhÃ¢n quyá»n há»c sinh"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>PhÃ¢n Quyá»n</span>
              </button>
            )}

            {/* File Upload Hidden */}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              accept="image/*" 
              className="hidden" 
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#1F2937] hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Táº£i áº¢nh LÃªn</span>
            </button>
          </div>
        </div>

        {/* Multi-Image Tabs list inside the lesson */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {lesson?.images?.map((img, idx) => {
            const isCurrent = img.id === currentImage?.id;
            return (
              <div
                key={img.id}
                onClick={() => onSelectImage(img.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-all shrink-0 ${
                  isCurrent
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                    : 'bg-[#1F2937] text-slate-300 border-slate-700 hover:border-slate-500'
                }`}
              >
                <div className="w-5 h-5 rounded-md overflow-hidden bg-black/40 shrink-0">
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </div>
                <span className="truncate max-w-[120px]">
                  {img.title || `SÆ¡ Ä‘á»“ #${idx + 1}`}
                </span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isCurrent ? 'bg-indigo-900 text-indigo-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {img.masks?.length || 0} Ã´
                </span>

                {lesson?.images?.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a áº£nh "${img.title}" nÃ y khÃ´ng?`)) {
                        onDeleteImage(img.id);
                      }
                    }}
                    className="text-slate-400 hover:text-rose-400 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-dashed border-slate-600 hover:border-indigo-400 text-slate-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ThÃªm áº£nh má»›i...</span>
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ 2. TOOLBAR (GEMINI AI + CANVAS VISION + DRAW + STYLES) â”€â”€â”€ */}
      <div className="px-4 py-2.5 bg-[#0F172A] border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* GEMINI AI SCAN BUTTON */}
          <button
            onClick={() => handleAutoDetect()}
            disabled={isScanning || !currentImage}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>QuÃ©t Gemini AI</span>
          </button>

          {/* CANVAS VISION BUTTON (LOCAL BACKUP ON ANY IMAGE) */}
          <button
            onClick={handleCanvasVisionDetect}
            disabled={isScanning || !currentImage}
            className="bg-[#007AFF] hover:bg-blue-600 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50 active:scale-95 cursor-pointer"
            title="DÃ² tÃ¬m cÃ¡c vÃ¹ng chá»¯ trÃªn sÆ¡ Ä‘á»“ báº±ng Canvas Vision (KhÃ´ng cáº§n API Key)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>QuÃ©t Canvas Vision</span>
          </button>

          {/* DRAW MANUAL MASK BUTTON */}
          <button
            onClick={() => setDrawMode(!drawMode)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border cursor-pointer ${
              drawMode
                ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/30 font-extrabold'
                : 'bg-[#1E293B] text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{drawMode ? 'Äang Váº½: KÃ©o Chuá»™t' : '+ Váº½ Ã” Che Thá»§ CÃ´ng'}</span>
          </button>

          {/* EXPAND ALL MASKS */}
          <button
            onClick={() => handleExpandAllMasks(15)}
            className="bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Tá»± Ä‘á»™ng ná»›i rá»™ng thÃªm 15% viá»n bao Ä‘á»ƒ chá»¯ khÃ´ng bao giá» bá»‹ lá»™"
          >
            <Maximize className="w-3.5 h-3.5 text-cyan-400" />
            <span>Ná»›i Rá»™ng Che KÃ­n</span>
          </button>

          {/* STYLE SETTINGS BUTTON */}
          <button
            onClick={() => setShowStyleModal(true)}
            className="bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Palette className="w-3.5 h-3.5 text-purple-400" />
            <span>TÃ¹y Chá»‰nh Ã” Che</span>
          </button>
        </div>

        {/* Right Tools (Zoom, Inspector toggle) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setZoomLevel(prev => Math.max(0.6, Number((prev - 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-white border border-slate-700"
            title="Thu nhá»"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-slate-400 px-1 min-w-[45px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            onClick={() => setZoomLevel(prev => Math.min(2.5, Number((prev + 0.15).toFixed(2))))}
            className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-white border border-slate-700"
            title="PhÃ³ng to"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-1.5 rounded-lg bg-[#1E293B] text-slate-300 hover:text-white border border-slate-700"
            title="Vá»«a khung hÃ¬nh"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-slate-700 mx-1"></div>

          <button
            onClick={() => setShowInspector(!showInspector)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              showInspector
                ? 'bg-indigo-950 text-indigo-300 border-indigo-700'
                : 'bg-[#1E293B] text-slate-400 border-slate-700'
            }`}
          >
            Danh SÃ¡ch ({masks.length})
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ 3. STATUS BAR MESSAGE â”€â”€â”€ */}
      {scanMessage && (
        <div className="bg-indigo-950/90 border-b border-indigo-800/80 px-4 py-2 flex items-center justify-between text-xs text-indigo-200 animate-fadeIn">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
            <span className="font-semibold">{scanMessage}</span>
          </div>
          <button onClick={() => setScanMessage('')} className="text-indigo-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* â”€â”€â”€ 4. MAIN CANVAS WORKSPACE â”€â”€â”€ */}
      <div className="flex-1 flex overflow-hidden relative">
        <div
          ref={containerRef}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="flex-1 overflow-auto flex items-center justify-center p-4 sm:p-6 bg-[#070b14] relative select-none"
        >
          {currentImage ? (
            <div
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              className="relative inline-block transition-transform duration-150 shadow-2xl rounded-2xl overflow-hidden border border-slate-800"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <img
                ref={imageRef}
                src={currentImage.url}
                alt={currentImage.title}
                className="max-h-[75vh] w-auto object-contain block pointer-events-none rounded-xl"
              />

              {/* Temp drawing box preview */}
              {isDrawing && tempBox && (
                <div
                  style={{
                    left: `${tempBox.x}%`,
                    top: `${tempBox.y}%`,
                    width: `${tempBox.width}%`,
                    height: `${tempBox.height}%`
                  }}
                  className="absolute border-2 border-dashed border-amber-400 bg-amber-500/30 rounded pointer-events-none z-30"
                />
              )}

              {/* RENDER OCCLUSION MASKS */}
              {masks.map((mask, idx) => {
                const isSelected = mask.id === selectedMaskId;
                const maskOpacity = mask.opacity !== undefined ? mask.opacity : 1.0;

                return (
                  <div
                    key={mask.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMaskId(mask.id);
                      soundService.playTick();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedMaskId(mask.id);
                      setDragState({
                        type: 'move',
                        maskId: mask.id,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialX: mask.x,
                        initialY: mask.y
                      });
                    }}
                    style={{
                      left: `${mask.x}%`,
                      top: `${mask.y}%`,
                      width: `${mask.width}%`,
                      height: `${mask.height}%`,
                      backgroundColor: mask.color || '#070b14',
                      borderColor: isSelected ? '#38bdf8' : (mask.borderColor || '#6366f1'),
                      color: mask.textColor || '#ffffff',
                      opacity: maskOpacity,
                      borderRadius: '6px'
                    }}
                    className={`absolute border-2 flex items-center justify-center font-bold text-xs select-none transition-shadow cursor-move z-20 ${
                      isSelected 
                        ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-black shadow-2xl scale-[1.01]' 
                        : 'shadow-lg hover:border-sky-300'
                    }`}
                  >
                    {/* Badge / Display mode */}
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded pointer-events-none">
                      {mask.displayMode === 'question' ? (
                        <span className="text-amber-400 font-black">?</span>
                      ) : mask.displayMode === 'blank' ? null : (
                        <span className="font-extrabold text-[11px] tracking-tight">#{idx + 1}</span>
                      )}
                    </div>

                    {/* Resize handles when selected */}
                    {isSelected && (
                      <>
                        {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map((handle) => (
                          <div
                            key={handle}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              setDragState({
                                type: 'resize',
                                handle,
                                maskId: mask.id,
                                startX: e.clientX,
                                startY: e.clientY,
                                initialX: mask.x,
                                initialY: mask.y,
                                initialWidth: mask.width,
                                initialHeight: mask.height
                              });
                            }}
                            className={`absolute w-3 h-3 bg-sky-400 border border-black rounded-full z-40 ${
                              handle === 'nw' ? '-top-1.5 -left-1.5 cursor-nwse-resize' :
                              handle === 'ne' ? '-top-1.5 -right-1.5 cursor-nesw-resize' :
                              handle === 'sw' ? '-bottom-1.5 -left-1.5 cursor-nesw-resize' :
                              handle === 'se' ? '-bottom-1.5 -right-1.5 cursor-nwse-resize' :
                              handle === 'n' ? '-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                              handle === 's' ? '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize' :
                              handle === 'w' ? '-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize' :
                              '-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize'
                            }`}
                          />
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8 max-w-md">
              <Upload className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">ChÆ°a cÃ³ sÆ¡ Ä‘á»“ giáº£i pháº«u nÃ o</h3>
              <p className="text-xs text-slate-400 mb-4">
                KÃ©o tháº£ áº£nh vÃ o Ä‘Ã¢y, chá»¥p mÃ n hÃ¬nh rá»“i báº¥m <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">Ctrl + V</kbd>, hoáº·c báº¥m nÃºt bÃªn dÆ°á»›i.
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                Táº£i áº£nh sÆ¡ Ä‘á»“ lÃªn ngay
              </button>
            </div>
          )}
        </div>

        {/* â”€â”€â”€ 5. RIGHT INSPECTOR / MASK MANAGER DRAWER â”€â”€â”€ */}
        {showInspector && (
          <aside className="w-80 bg-[#111827] border-l border-slate-800 flex flex-col h-full shadow-2xl z-30 shrink-0">
            {/* Header */}
            <div className="p-3.5 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black text-white uppercase tracking-wider">
                  Cáº¥u Táº¡o ({masks.length})
                </span>
              </div>
              {masks.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Báº¡n cÃ³ cháº¯c muá»‘n xÃ³a Táº¤T Cáº¢ cÃ¡c Ã´ che trÃªn áº£nh nÃ y khÃ´ng?')) {
                      onUpdateImageMasks(currentImage.id, []);
                      setSelectedMaskId(null);
                    }
                  }}
                  className="text-[11px] font-bold text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  XÃ³a táº¥t cáº£
                </button>
              )}
            </div>

            {/* Dropdown Selector: Click Ä‘á»ƒ sá»• xuá»‘ng full danh sÃ¡ch chá»n nhanh */}
            {masks.length > 0 && (
              <div className="p-3 border-b border-slate-800 bg-[#0E1526] relative shrink-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Ã” Che Äang Chá»n:
                  </span>
                  <span className="text-indigo-400 font-mono text-[11px] font-bold">
                    {selectedMaskIndex >= 0 ? `${selectedMaskIndex + 1} / ${masks.length}` : ''}
                  </span>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdownSelect(!showDropdownSelect)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#070b14] border border-slate-700 hover:border-indigo-400 text-xs font-bold text-white transition-all shadow-inner cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm">
                        #{selectedMaskIndex >= 0 ? selectedMaskIndex + 1 : 1}
                      </span>
                      <span className="truncate">{selectedMask?.label || 'Chá»n Ã´ giáº£i pháº«u...'}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${showDropdownSelect ? 'rotate-180 text-cyan-400' : ''}`} />
                  </button>

                  {/* Dropdown Menu (Chá»‰ hiá»ƒn thá»‹ khi báº¥m trá» sá»• xuá»‘ng) */}
                  {showDropdownSelect && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#111827] border border-indigo-500/70 rounded-2xl shadow-2xl max-h-64 overflow-y-auto p-1.5 space-y-1 animate-fadeIn backdrop-blur-md">
                      <div className="px-2 py-1 text-[10px] font-black uppercase text-indigo-400 tracking-wider flex justify-between items-center border-b border-slate-800 pb-1 mb-1">
                        <span>Danh SÃ¡ch {masks.length} Cáº¥u Táº¡o</span>
                        <span className="text-slate-500 text-[9px] font-normal">Click Ä‘á»ƒ chá»n</span>
                      </div>
                      {masks.map((mask, idx) => {
                        const isSelected = mask.id === selectedMaskId;
                        return (
                          <button
                            key={mask.id}
                            type="button"
                            onClick={() => {
                              setSelectedMaskId(mask.id);
                              setShowDropdownSelect(false);
                              soundService.playTick();
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                                : 'text-slate-300 hover:bg-[#1F2937] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                isSelected ? 'bg-indigo-900 text-white' : 'bg-black/40 text-slate-400'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className="truncate">{mask.label || 'ChÆ°a Ä‘áº·t tÃªn'}</span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-300 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Quick Step Buttons: Ã” trÆ°á»›c / Ã” tiáº¿p theo */}
                <div className="flex items-center justify-between mt-2 pt-1 gap-2">
                  <button
                    type="button"
                    disabled={selectedMaskIndex <= 0}
                    onClick={() => {
                      if (selectedMaskIndex > 0) {
                        setSelectedMaskId(masks[selectedMaskIndex - 1].id);
                        soundService.playTick();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-[#1F2937] hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Ã” trÆ°á»›c</span>
                  </button>

                  <button
                    type="button"
                    disabled={selectedMaskIndex >= masks.length - 1}
                    onClick={() => {
                      if (selectedMaskIndex < masks.length - 1) {
                        setSelectedMaskId(masks[selectedMaskIndex + 1].id);
                        soundService.playTick();
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg bg-[#1F2937] hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold border border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  >
                    <span>Ã” tiáº¿p theo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Chi tiáº¿t Ã´ Ä‘ang chá»n (Chá»‰ hiá»ƒn thá»‹ Ã´ Ä‘Ã³ táº¡i Ä‘Ã¢y - khÃ´ng trÃ n mÃ n hÃ¬nh) */}
            <div className="flex-1 overflow-y-auto">
              {selectedMask ? (
                <div className="p-3.5 space-y-3 bg-[#162032]">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/40 font-black text-xs flex items-center justify-center">
                        #{selectedMaskIndex + 1}
                      </span>
                      <span className="text-xs font-black uppercase text-sky-400">
                        Chi Tiáº¿t Ã” Che
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteMask(selectedMask.id)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded cursor-pointer transition-colors"
                      title="XÃ³a Ã´ nÃ y"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      TÃªn cÆ¡ quan / ÄÃ¡p Ã¡n Ä‘Ãºng (Official Key):
                    </label>
                    <input
                      type="text"
                      value={selectedMask.label || ''}
                      onChange={(e) => {
                        const updated = masks.map(m => m.id === selectedMask.id ? { ...m, label: e.target.value } : m);
                        onUpdateImageMasks(currentImage.id, updated);
                      }}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-sky-400 shadow-inner"
                      placeholder="VD: Thá»ƒ chai, ThÃ¹y trÃ¡n..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      ÄÃ¡p Ã¡n Ä‘á»“ng nghÄ©a / TÃªn Latinh (cÃ¡ch nhau bá»Ÿi dáº¥u pháº©y):
                    </label>
                    <input
                      type="text"
                      value={(selectedMask.synonyms || []).join(', ')}
                      onChange={(e) => {
                        const syns = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                        const updated = masks.map(m => m.id === selectedMask.id ? { ...m, synonyms: syns } : m);
                        onUpdateImageMasks(currentImage.id, updated);
                      }}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-sky-400 shadow-inner"
                      placeholder="VD: Corpus callosum, Thá»ƒ trai..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Gá»£i Ã½ lÃ¢m sÃ ng / Vá»‹ trÃ­ liÃªn quan:
                    </label>
                    <input
                      type="text"
                      value={selectedMask.hint || ''}
                      onChange={(e) => {
                        const updated = masks.map(m => m.id === selectedMask.id ? { ...m, hint: e.target.value } : m);
                        onUpdateImageMasks(currentImage.id, updated);
                      }}
                      className="w-full px-3 py-2 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-sky-400 shadow-inner"
                      placeholder="Gá»£i Ã½ ngáº¯n khi Ã´n táº­p"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic">
                  Nháº¥p vÃ o má»™t Ã´ che trÃªn sÆ¡ Ä‘á»“ Ä‘á»ƒ xem vÃ  chá»‰nh sá»­a thÃ´ng tin táº¡i Ä‘Ã¢y
                </div>
              )}

              {/* Collapsible Accordion: Xem toÃ n bá»™ danh sÃ¡ch (Máº·c Ä‘á»‹nh KHÃ”NG hiá»ƒn thá»‹ full, chá»‰ má»Ÿ khi báº¥m sá»• xuá»‘ng) */}
              {masks.length > 0 && (
                <div className="p-3 border-t border-slate-800 bg-[#0E1526]">
                  <button
                    type="button"
                    onClick={() => setShowFullList(!showFullList)}
                    className="w-full py-2 px-3 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold border border-slate-700 flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{showFullList ? 'Thu gá»n danh sÃ¡ch Ä‘áº§y Ä‘á»§' : `Xem danh sÃ¡ch Ä‘áº§y Ä‘á»§ (${masks.length} Ã´)`}</span>
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showFullList ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Danh sÃ¡ch má»Ÿ rá»™ng cÃ³ cuá»™n gá»n gÃ ng */}
                  {showFullList && (
                    <div className="mt-2 space-y-1 max-h-56 overflow-y-auto pr-1 animate-fadeIn">
                      {masks.map((mask, idx) => {
                        const isSelected = mask.id === selectedMaskId;
                        return (
                          <div
                            key={mask.id}
                            onClick={() => {
                              setSelectedMaskId(mask.id);
                              soundService.playTick();
                            }}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                                : 'bg-[#0B0F19]/80 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-[#1F2937]'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                                isSelected ? 'bg-indigo-900 text-white' : 'bg-black/40 text-slate-400'
                              }`}>
                                #{idx + 1}
                              </span>
                              <span className="font-semibold truncate">
                                {mask.label || 'ChÆ°a Ä‘áº·t tÃªn'}
                              </span>
                            </div>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMask(mask.id);
                              }}
                              className="text-slate-400 hover:text-rose-400 p-1 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {/* â”€â”€â”€ 6. DZOTA AI SETUP MODAL (EXPLICIT ON NEW DIAGRAMS) â”€â”€â”€ */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#111827] border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-600/50 flex items-center justify-center text-cyan-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Káº¿t Ná»‘i Gemini AI QuÃ©t NhÃ£n</h3>
                  <p className="text-[11px] text-slate-400">Nháº­n diá»‡n cáº¥u táº¡o giáº£i pháº«u trÃªn áº£nh má»›i cá»§a báº¡n</p>
                </div>
              </div>
              <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200">
                {aiModalNotice || 'Äá»ƒ AI Ä‘á»c chá»¯ Tiáº¿ng Viá»‡t y khoa vÃ  tá»± Ä‘á»™ng sinh Ä‘Ã¡p Ã¡n trÃªn sÆ¡ Ä‘á»“ má»›i, báº¡n cáº§n káº¿t ná»‘i Gemini API.'}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={inputApiKey}
                    onChange={(e) => setInputApiKey(e.target.value)}
                    placeholder="DÃ¡n mÃ£ khÃ³a AIzaSy... cá»§a báº¡n vÃ o Ä‘Ã¢y"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#0B0F19] border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-cyan-400" />
                    LÆ°u báº£o máº­t táº¡i trÃ¬nh duyá»‡t cá»§a báº¡n
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold"
                  >
                    Láº¥y API Key Miá»…n PhÃ­ <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleSaveApiKeyAndScan}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-cyan-300" />
                  <span>LÆ°u & QuÃ©t Báº±ng Gemini AI</span>
                </button>

                <button
                  onClick={() => {
                    setShowAiModal(false);
                    handleCanvasVisionDetect();
                  }}
                  className="bg-[#007AFF] hover:bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-blue-500/20"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>QuÃ©t Canvas Vision (KhÃ´ng cáº§n Key)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ 7. DZOTA MASK STYLE & OPACITY MODAL â”€â”€â”€ */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-[#111827] border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-black text-white">TÃ¹y Chá»‰nh Giao Diá»‡n Ã” Che</h3>
              </div>
              <button onClick={() => setShowStyleModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Opacity slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300">
                    Äá»™ Äáº­m Äáº·c Cá»§a Ã” Che (Che KÃ­n Tuyá»‡t Äá»‘i):
                  </label>
                  <span className="text-xs font-black text-indigo-400">
                    {Math.round(activeOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.02"
                  value={activeOpacity}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setActiveOpacity(val);
                    applyStyleUpdate({ opacity: val });
                  }}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>50% (BÃ¡n trong suá»‘t)</span>
                  <span className="text-emerald-400 font-bold">100% Äáº­m Ä‘áº·c tuyá»‡t Ä‘á»‘i (KhuyÃªn dÃ¹ng)</span>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Bá»™ MÃ u Y Khoa Chuáº©n Dzota:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {MASK_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setActiveColor(preset.hex);
                        setActiveBorderColor(preset.border);
                        setActiveTextColor(preset.textColor);
                        applyStyleUpdate({
                          color: preset.hex,
                          borderColor: preset.border,
                          textColor: preset.textColor
                        });
                      }}
                      style={{ backgroundColor: preset.hex, borderColor: preset.border }}
                      className="p-2.5 rounded-xl border-2 text-[11px] font-bold text-center truncate cursor-pointer transition-transform hover:scale-105"
                    >
                      <span style={{ color: preset.textColor }}>{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Display mode */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  Kiá»ƒu Hiá»ƒn Thá»‹ TrÃªn Ã” Che:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'number', label: 'Sá»‘ Thá»© Tá»± (#1, #2)' },
                    { id: 'question', label: 'Dáº¥u Cháº¥m Há»i (?)' },
                    { id: 'blank', label: 'Ã” Che Trá»‘ng' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setActiveDisplayMode(mode.id);
                        applyStyleUpdate({ displayMode: mode.id });
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        activeDisplayMode === mode.id
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30'
                          : 'bg-[#1F2937] text-slate-300 border-slate-700 hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply to all button */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => {
                    applyStyleUpdate({
                      color: activeColor,
                      borderColor: activeBorderColor,
                      textColor: activeTextColor,
                      opacity: activeOpacity,
                      displayMode: activeDisplayMode
                    }, true);
                    setShowStyleModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Ãp Dá»¥ng Cho ToÃ n Bá»™ Ã” Che & Äáº·t Máº·c Äá»‹nh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ 8. SAVE TOAST NOTIFICATION â”€â”€â”€ */}
      {showSaveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCheck className="w-5 h-5 text-emerald-200" />
          <div>
            <div className="text-xs font-black uppercase tracking-wider">ÄÃ£ lÆ°u bÃ i há»c thÃ nh cÃ´ng!</div>
            <div className="text-[11px] text-emerald-100">ToÃ n bá»™ sÆ¡ Ä‘á»“ vÃ  cÃ¡c Ã´ che Ä‘Ã£ Ä‘Æ°á»£c lÆ°u vÃ o há»‡ thá»‘ng.</div>
          </div>
        </div>
      )}
    </div>
  );
}

