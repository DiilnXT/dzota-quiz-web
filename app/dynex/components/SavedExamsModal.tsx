'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  FileText,
  Clock,
  Play,
  Share2,
  Trash2,
  Copy,
  Check,
  QrCode,
  Flame,
  Award,
  Layers,
  ExternalLink,
  Plus
} from 'lucide-react'
import { storageService, DynexExamPaper } from '../services/storageService'
import { soundService } from '../services/soundService'

interface SavedExamsModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectExam: (exam: DynexExamPaper) => void
  onOpenCreateExam: () => void
}

export default function SavedExamsModal({
  isOpen,
  onClose,
  onSelectExam,
  onOpenCreateExam
}: SavedExamsModalProps) {
  const [exams, setExams] = useState<DynexExamPaper[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrExam, setQrExam] = useState<DynexExamPaper | null>(null)

  useEffect(() => {
    if (isOpen) {
      setExams(storageService.getSavedExams())
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bạn có chắc chắn muốn xóa đề thi này không?')) {
      storageService.deleteExam(id)
      setExams(prev => prev.filter(item => item.id !== id))
      soundService.playTick()
    }
  }

  const handleCopyExamLink = (exam: DynexExamPaper, e: React.MouseEvent) => {
    e.stopPropagation()
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dzota.vercel.app'
    const link = `${baseUrl}/dynex?mode=exam&examId=${exam.id}`

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(link)
      setCopiedId(exam.id)
      soundService.playStationChime()
      setTimeout(() => setCopiedId(null), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#111827] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Kho Đề Thi Chạy Trạm Y Khoa Đã Tạo
              </h3>
              <p className="text-xs text-slate-400">
                Danh sách các đề thi OSCE đã lưu, link trực tiếp cho học sinh và mã QR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose()
                onOpenCreateExam()
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs flex items-center gap-1 shadow-md cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Tạo Đề Mới</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List of Exams */}
        <div className="p-5 sm:p-6 space-y-3 overflow-y-auto flex-1">
          {exams.length === 0 ? (
            <div className="p-12 text-center bg-[#070b14] border border-slate-800 rounded-3xl space-y-3">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <h4 className="text-base font-bold text-white">Chưa có đề thi chạy trạm nào được lưu</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bấm nút &quot;+ Tạo Đề Mới&quot; để tạo đề thi chạy trạm ngẫu nhiên, chống trùng hình liên tiếp và chia sẻ cho sinh viên.
              </p>
              <button
                onClick={() => {
                  onClose()
                  onOpenCreateExam()
                }}
                className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-bold text-xs shadow-lg inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Đề Thi Đầu Tiên</span>
              </button>
            </div>
          ) : (
            exams.map(exam => (
              <div
                key={exam.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-800/60">
                      {exam.subject}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900 text-cyan-300 border border-slate-800">
                      {exam.totalStations} Trạm • {exam.timePerStation}s/trạm
                    </span>
                    {exam.generationStrategy === 'balanced_distribution' ? (
                      <span className="text-[10px] text-emerald-400 font-semibold">⚖️ Phân bổ đều</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-semibold">🎲 Ngẫu nhiên</span>
                    )}
                  </div>

                  <h4 className="text-sm sm:text-base font-black text-white group-hover:text-indigo-300 transition-colors truncate">
                    {exam.title}
                  </h4>

                  {exam.notes && (
                    <p className="text-xs text-slate-400 line-clamp-1">{exam.notes}</p>
                  )}

                  <span className="text-[10px] text-slate-500 block">
                    Tạo ngày: {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                  <button
                    onClick={(e) => handleCopyExamLink(exam, e)}
                    className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Sao chép link làm bài thi"
                  >
                    {copiedId === exam.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
                    <span className="hidden sm:inline">{copiedId === exam.id ? 'Đã chép link!' : 'Copy Link'}</span>
                  </button>

                  <button
                    onClick={() => setQrExam(exam)}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/70 transition-colors cursor-pointer"
                    title="Mã QR cho điện thoại"
                  >
                    <QrCode className="w-4 h-4 text-indigo-400" />
                  </button>

                  <button
                    onClick={() => {
                      onSelectExam(exam)
                      onClose()
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Vào Thi</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(exam.id, e)}
                    className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                    title="Xóa đề thi này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* QR Code Popup inside Modal */}
        {qrExam && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-[#111827] border border-indigo-500/40 rounded-3xl p-6 text-center space-y-4 max-w-sm w-full shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-indigo-400">Mã QR Làm Bài Thi</span>
                <button onClick={() => setQrExam(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>

              <h4 className="text-sm font-bold text-white truncate">{qrExam.title}</h4>

              <div className="p-3 bg-white rounded-2xl mx-auto w-fit shadow-lg">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    `${typeof window !== 'undefined' ? window.location.origin : 'https://dzota.vercel.app'}/dynex?mode=exam&examId=${qrExam.id}`
                  )}`}
                  alt="QR Code"
                  className="w-44 h-44 block"
                />
              </div>

              <p className="text-xs text-slate-300">
                Quét bằng Camera điện thoại để vào thẳng phòng thi chạy trạm OSCE.
              </p>

              <button
                onClick={() => setQrExam(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 text-white text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
