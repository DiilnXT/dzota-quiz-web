'use client'

import React, { useState } from 'react'
import { Sparkles, X, Maximize2, RotateCcw } from 'lucide-react'

interface DzotaAnimatedLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number
  showGlow?: boolean
  showRing?: boolean
  allowPreviewModal?: boolean
  className?: string
  alt?: string
}

const sizeMap = {
  xs: { box: 'w-7 h-7', px: 28 },
  sm: { box: 'w-8 h-8', px: 32 },
  md: { box: 'w-9 h-9', px: 36 },
  lg: { box: 'w-14 h-14', px: 56 },
  xl: { box: 'w-24 h-24', px: 96 },
}

export default function DzotaAnimatedLogo({
  size = 'md',
  showGlow = true,
  showRing = true,
  allowPreviewModal = false,
  className = '',
  alt = 'Dzota Logo',
}: DzotaAnimatedLogoProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)

  const sizeClass = typeof size === 'string' ? sizeMap[size]?.box || 'w-9 h-9' : ''
  const customStyle = typeof size === 'number' ? { width: `${size}px`, height: `${size}px` } : {}

  const handleOpenModal = (e: React.MouseEvent) => {
    if (allowPreviewModal) {
      e.stopPropagation()
      e.preventDefault()
      setIframeKey((prev) => prev + 1)
      setModalOpen(true)
    }
  }

  return (
    <>
      <div
        className={`dzota-logo-container relative shrink-0 group ${sizeClass} ${className} ${
          allowPreviewModal ? 'cursor-pointer' : ''
        }`}
        style={customStyle}
        onClick={allowPreviewModal ? handleOpenModal : undefined}
        title={allowPreviewModal ? 'Nhấp để xem logo động Dzota Magic Draw' : alt}
      >
        {/* Ambient Halo Glow */}
        {showGlow && (
          <div
            className="dzota-logo-ambient -inset-1.5 opacity-60 dark:opacity-85 group-hover:opacity-100 group-hover:scale-115 transition-all duration-300"
            aria-hidden="true"
          />
        )}

        {/* Animated Gradient Stroke Ring */}
        {showRing && (
          <svg
            className="dzota-logo-ring-svg"
            viewBox="0 0 100 100"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="dzotaLogoRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#155eff" />
                <stop offset="35%" stopColor="#41dfff" />
                <stop offset="70%" stopColor="#ffc34c" />
                <stop offset="100%" stopColor="#155eff" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="url(#dzotaLogoRingGrad)"
              strokeWidth="4"
              strokeDasharray="90 30"
              strokeLinecap="round"
              className="origin-center"
            />
          </svg>
        )}

        {/* Core Image Container */}
        <div className="relative w-full h-full rounded-xl bg-white dark:bg-slate-900/90 p-1 flex items-center justify-center shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden group-hover:border-cyan-400/60 dark:group-hover:border-cyan-400/50 transition-colors">
          <picture className="w-full h-full flex items-center justify-center">
            <source srcSet="/logo-dzota.webp" type="image/webp" />
            <img
              src="/logo-dzota.png"
              alt={alt}
              className="w-full h-full object-contain filter drop-shadow-xs group-hover:scale-105 transition-transform duration-200"
            />
          </picture>

          {/* Shimmer / Light sweep effect */}
          <div className="dzota-logo-shine-layer" />
        </div>

        {/* Interactive indicator pill badge (only if modal allowed) */}
        {allowPreviewModal && (
          <span
            className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-xs text-[8px] opacity-0 group-hover:opacity-100 transition-opacity"
            title="Xem hiệu ứng logo động"
          >
            <Sparkles size={8} className="animate-spin text-white" />
          </span>
        )}
      </div>

      {/* Full Cinematic Animation Modal Overlay */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl aspect-square md:aspect-[4/3] max-h-[85vh] bg-[#030914] rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-500/20 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="absolute top-0 inset-x-0 z-20 h-14 px-5 flex items-center justify-between bg-gradient-to-b from-[#030914]/90 to-transparent">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs font-black tracking-widest uppercase text-cyan-300">
                  Dzota Magic Draw Logo v2
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIframeKey((k) => k + 1)}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Phát lại hoạt ảnh"
                >
                  <RotateCcw size={14} />
                  <span className="hidden sm:inline">Phát lại</span>
                </button>
                <a
                  href="/logo-animation.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Mở toàn màn hình tab mới"
                >
                  <Maximize2 size={14} />
                </a>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl bg-slate-900/80 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 transition-colors cursor-pointer"
                  title="Đóng"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Animation Canvas Container */}
            <div className="flex-1 w-full h-full pt-10 pb-4">
              <iframe
                key={iframeKey}
                src="/logo-animation.html"
                title="Dzota Animated Logo Magic Draw"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
