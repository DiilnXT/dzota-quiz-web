'use client'

import React, { useState, useEffect } from 'react'
import {
  Sparkles,
  BookOpen,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Clock,
  ExternalLink,
  X,
  FileText,
  AlertTriangle
} from 'lucide-react'

interface MistakeNotebookTabProps {
  currentUser: any
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

export default function MistakeNotebookTab({ currentUser, showToast }: MistakeNotebookTabProps) {
  const [loading, setLoading] = useState(true)
  const [analyses, setAnalyses] = useState<any[]>([])
  const [selectedAnalysis, setSelectedAnalysis] = useState<any | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchAnalyses = async () => {
    setLoading(true)
    try {
      // 1. Lấy từ backend nếu đã đăng nhập
      let serverList: any[] = []
      try {
        const res = await fetch('/api/student/mistakes')
        if (res.ok) {
          const data = await res.json()
          serverList = data.analyses || []
        }
      } catch (e) {}

      // 2. Lấy từ localStorage
      let localList: any[] = []
      try {
        const raw = localStorage.getItem('dzota_saved_mistake_analyses')
        if (raw) localList = JSON.parse(raw)
      } catch (e) {}

      // Hợp nhất dữ liệu, loại bỏ trùng lặp theo id hoặc quizId
      const map = new Map<string, any>()
      serverList.forEach(item => map.set(item.id || item.quizId, item))
      localList.forEach(item => {
        const key = item.id || item.quizId
        if (!map.has(key)) map.set(key, item)
      })

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      setAnalyses(merged)
    } catch (e) {
      showToast('Lỗi khi tải sổ tay lỗi sai', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyses()
  }, [])

  const handleDelete = async (item: any) => {
    if (!confirm(`Bạn có chắc muốn xóa bài phân tích lỗi sai của bài "${item.quizTitle}"?`)) return

    try {
      // Xóa local
      const raw = localStorage.getItem('dzota_saved_mistake_analyses')
      if (raw) {
        const localList = JSON.parse(raw)
        const updated = localList.filter((x: any) => x.id !== item.id && x.quizId !== item.quizId)
        localStorage.setItem('dzota_saved_mistake_analyses', JSON.stringify(updated))
      }

      // Xóa server nếu có id
      if (item.id && currentUser) {
        await fetch('/api/student/mistakes', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id })
        }).catch(() => {})
      }

      setAnalyses(prev => prev.filter(x => x.id !== item.id && x.quizId !== item.quizId))
      if (selectedAnalysis?.id === item.id) setSelectedAnalysis(null)
      showToast('Đã xóa bài phân tích thành công!', 'success')
    } catch (e) {
      showToast('Lỗi xóa bài phân tích', 'error')
    }
  }

  const handleCopy = (text: string, id: string) => {
    if (!navigator.clipboard) return
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    showToast('Đã sao chép nội dung phân tích vào bộ nhớ đệm!', 'success')
    setTimeout(() => setCopiedId(null), 3000)
  }

  // Component render nội dung phân tích Markdown chuẩn sạch
  const renderFormattedAnalysis = (text: string) => {
    if (!text) return null
    const lines = text.split('\n')

    return (
      <div className="space-y-3 text-slate-800 dark:text-slate-200 text-sm leading-relaxed text-left">
        {lines.map((line, idx) => {
          const trimmed = line.trim()
          if (!trimmed) return <div key={idx} className="h-1.5" />

          // Headers
          if (trimmed.startsWith('### ')) {
            return (
              <h4 key={idx} className="text-base font-extrabold text-indigo-600 dark:text-indigo-400 mt-4 mb-1">
                {trimmed.replace('### ', '')}
              </h4>
            )
          }
          if (trimmed.startsWith('## ')) {
            return (
              <h3 key={idx} className="text-lg font-black text-slate-900 dark:text-slate-100 mt-5 mb-2 pb-1 border-b border-indigo-100 dark:border-indigo-950">
                {trimmed.replace('## ', '')}
              </h3>
            )
          }
          if (trimmed.startsWith('# ')) {
            return (
              <h2 key={idx} className="text-xl font-black text-slate-900 dark:text-slate-100 mt-6 mb-3 pb-1 border-b-2 border-indigo-500">
                {trimmed.replace('# ', '')}
              </h2>
            )
          }

          // Bullet points
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const rawContent = trimmed.slice(2)
            return (
              <div key={idx} className="flex items-start gap-2.5 ml-2 my-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span className="flex-1 font-medium">{rawContent}</span>
              </div>
            )
          }

          return (
            <p key={idx} className="my-1 leading-relaxed">
              {trimmed}
            </p>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-48 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* ─── BANNER SỔ TAY LỖI SAI ─── */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-orange-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <Sparkles size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Bộ Nhớ Khắc Phục Lỗi Sai
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                Sổ Tay Lỗi Sai & Bài Giảng Giảng Viên AI
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 mt-1 max-w-xl leading-relaxed">
                Nơi lưu trữ các bài phân tích chuyên sâu cô đọng do Giảng viên AI đúc kết từ những câu hỏi bạn từng làm sai. Đọc lại trước mỗi kỳ thi để tự tin đạt 100% điểm số!
              </p>
            </div>
          </div>

          <button
            onClick={fetchAnalyses}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <RotateCcw size={14} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      {/* ─── DANH SÁCH BÀI PHÂN TÍCH ─── */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
            <BookOpen size={18} className="text-amber-500" />
            Các Bài Phân Tích Đã Lưu Trữ ({analyses.length})
          </h3>
        </div>

        {analyses.length === 0 ? (
          <div className="text-center py-14 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Sparkles size={40} className="mx-auto text-amber-400 mb-2 opacity-80" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Chưa có bài phân tích lỗi sai nào được lưu</p>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Khi làm bài kiểm tra và gặp câu sai, hãy bấm vào nút <strong>"Ôn lại câu sai"</strong> &rarr; <strong>"Phân tích lỗi sai bằng AI"</strong> &rarr; <strong>"Lưu vào Sổ tay lỗi sai"</strong> để lưu lại bài giảng tại đây!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analyses.map(item => {
              const dateStr = item.createdAt
                ? new Date(item.createdAt).toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })
                : 'Vừa lưu'

              return (
                <div
                  key={item.id || item.quizId}
                  className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between hover:border-amber-400/80 transition-all shadow-2xs group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-md">
                          {item.subject || 'Chung'}
                        </span>
                        <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm sm:text-base mt-1.5 line-clamp-1">
                          {item.quizTitle}
                        </h4>
                      </div>
                      <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-black text-xs px-2.5 py-1 rounded-xl shrink-0">
                        {item.mistakeCount || 0} câu sai
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5 mb-3">
                      <Clock size={12} />
                      <span>Lưu ngày: {dateStr}</span>
                    </div>

                    {/* Preview đoạn phân tích */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4 font-normal">
                      {item.analysisText || 'Nội dung phân tích của Giảng viên AI...'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedAnalysis(item)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <FileText size={13} />
                        <span>Xem chi tiết</span>
                      </button>

                      <button
                        onClick={() => handleCopy(item.analysisText, item.id || item.quizId)}
                        className="p-1.5 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer"
                        title="Sao chép nội dung"
                      >
                        {copiedId === (item.id || item.quizId) ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>

                      {item.quizId && (
                        <a
                          href={`/?id=${item.quizId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl transition"
                          title="Làm lại bài thi này"
                        >
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(item)}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition cursor-pointer"
                      title="Xóa bài phân tích"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── MODAL XEM CHI TIẾT BÀI PHÂN TÍCH ─── */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/70 dark:bg-slate-800/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                  <Sparkles size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base truncate">
                    {selectedAnalysis.quizTitle}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Môn: {selectedAnalysis.subject || 'Chung'}</span>
                    <span>•</span>
                    <span className="text-rose-500 font-bold">{selectedAnalysis.mistakeCount} câu sai</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAnalysis(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-[#1E293B]">
              {renderFormattedAnalysis(selectedAnalysis.analysisText)}
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(selectedAnalysis.analysisText, 'modal')}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Copy size={14} />
                  <span>Sao chép bài phân tích</span>
                </button>

                {selectedAnalysis.quizId && (
                  <a
                    href={`/?id=${selectedAnalysis.quizId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <ExternalLink size={14} />
                    <span>Làm lại bài thi này</span>
                  </a>
                )}
              </div>

              <button
                onClick={() => setSelectedAnalysis(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
