'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  FileText,
  Search,
  Filter,
  Plus,
  Play,
  Share2,
  Trash2,
  Copy,
  Check,
  QrCode,
  Flame,
  Award,
  Layers,
  Clock,
  Lock,
  Unlock,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  X,
  Edit3,
  Save
} from 'lucide-react'
import { storageService, DynexExamPaper, Project } from '../services/storageService'
import { soundService } from '../services/soundService'

interface ExamManagementTabProps {
  projects: Project[]
  onOpenCreateExam: () => void
  onLaunchExam: (exam: DynexExamPaper) => void
}

export default function ExamManagementTab({
  projects,
  onOpenCreateExam,
  onLaunchExam
}: ExamManagementTabProps) {
  const [exams, setExams] = useState<DynexExamPaper[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [qrModalExam, setQrModalExam] = useState<DynexExamPaper | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Edit Exam State
  const [editingExam, setEditingExam] = useState<DynexExamPaper | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editSubject, setEditSubject] = useState('')
  const [editTimePerStation, setEditTimePerStation] = useState(20)
  const [editPassword, setEditPassword] = useState('')
  const [editNotes, setEditNotes] = useState('')

  const handleOpenEdit = (exam: DynexExamPaper, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingExam(exam)
    setEditTitle(exam.title)
    setEditSubject(exam.subject)
    setEditTimePerStation(exam.timePerStation)
    setEditPassword(exam.accessPassword || '')
    setEditNotes(exam.notes || '')
  }

  const handleSaveEditExam = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingExam) return
    const updated: DynexExamPaper = {
      ...editingExam,
      title: editTitle.trim() || editingExam.title,
      subject: editSubject.trim() || editingExam.subject,
      timePerStation: Number(editTimePerStation) || 20,
      accessPassword: editPassword.trim() || undefined,
      notes: editNotes.trim()
    }
    storageService.saveExam(updated)
    reloadExams()
    setEditingExam(null)
    soundService.playSuccess()
  }

  const reloadExams = () => {
    setIsLoading(true)
    const list = storageService.getSavedExams()
    setExams(list)
    setTimeout(() => setIsLoading(false), 300)
  }

  useEffect(() => {
    reloadExams()
  }, [])

  // Subject list extracted from exams
  const subjectList = useMemo(() => {
    const set = new Set<string>()
    exams.forEach(e => {
      if (e.subject) set.add(e.subject)
    })
    return Array.from(set)
  }, [exams])

  // Filtered exams
  const filteredExams = useMemo(() => {
    return exams.filter(e => {
      const matchSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.subject && e.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchSubject = selectedSubject === 'all' || e.subject === selectedSubject

      return matchSearch && matchSubject
    })
  }, [exams, searchTerm, selectedSubject])

  // Delete Exam
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Bạn có chắc chắn muốn xóa đề thi chạy trạm này không?')) {
      storageService.deleteExam(id)
      setExams(prev => prev.filter(item => item.id !== id))
      soundService.playTick()
    }
  }

  // Copy Exam URL for student
  const handleCopyLink = (exam: DynexExamPaper, e: React.MouseEvent) => {
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

  // Total stations and time stats
  const totalStats = useMemo(() => {
    const totalExams = exams.length
    const totalStations = exams.reduce((sum, e) => sum + (e.totalStations || 0), 0)
    const avgTime = totalExams > 0 ? Math.round(exams.reduce((sum, e) => sum + (e.timePerStation || 20), 0) / totalExams) : 20
    return { totalExams, totalStations, avgTime }
  }, [exams])

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* ─── TOP HEADER HERO BANNER (TƯ DUY DZOTA TESTS) ─── */}
      <div className="bg-[#111827]/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-[11px] font-black uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-rose-400 fill-current animate-pulse" />
              <span>Kho Đề Thi Chạy Trạm Y Khoa • Chuẩn OSCE Dzota</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Quản Lý Đề Thi & Chia Sẻ Link Khảo Thí
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Tạo đề thi tự động, quản lý ngân hàng đề chạy trạm, xuất mã QR quét bằng điện thoại và chia sẻ link trực tiếp cho thí sinh làm bài tập trung.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={reloadExams}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
              title="Làm mới danh sách"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={onOpenCreateExam}
              className="px-4 py-3 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              <span>+ Tạo Đề Thi Mới (AI)</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          <div className="bg-[#0B0F19]/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Tổng Đề Thi</div>
              <div className="text-base sm:text-lg font-black text-white font-mono">{totalStats.totalExams}</div>
            </div>
          </div>

          <div className="bg-[#0B0F19]/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Tổng Số Trạm</div>
              <div className="text-base sm:text-lg font-black text-white font-mono">{totalStats.totalStations}</div>
            </div>
          </div>

          <div className="bg-[#0B0F19]/80 border border-slate-800 rounded-2xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Thời Gian TB</div>
              <div className="text-base sm:text-lg font-black text-white font-mono">{totalStats.avgTime}s / trạm</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER TOOLBAR ─── */}
      <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 backdrop-blur-md">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên đề thi, môn học..."
            className="w-full pl-10 pr-4 py-2 bg-[#0B0F19] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 bg-[#0B0F19] border border-slate-700/80 rounded-xl text-xs font-bold text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">Tất cả môn học ({exams.length})</option>
            {subjectList.map(subj => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ─── LIST OF EXAM PAPERS ─── */}
      {filteredExams.length === 0 ? (
        <div className="bg-[#111827]/60 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mx-auto flex items-center justify-center text-indigo-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Chưa có đề thi chạy trạm nào</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {searchTerm || selectedSubject !== 'all'
                ? 'Không tìm thấy đề thi phù hợp với bộ lọc tìm kiếm của bạn.'
                : 'Bấm nút Tạo Đề Thi Mới để AI tự động chọn ngẫu nhiên các chi tiết giải phẫu và tạo bộ đề chạy trạm OSCE chuyên nghiệp!'}
            </p>
          </div>
          <button
            onClick={onOpenCreateExam}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            + Bắt Đầu Tạo Đề Thi
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredExams.map((exam) => {
            const isCopied = copiedId === exam.id
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://dzota.vercel.app'
            const candidateUrl = `${baseUrl}/dynex?mode=exam&examId=${exam.id}`

            return (
              <div
                key={exam.id}
                className="bg-[#111827] border border-slate-800/90 hover:border-slate-700 rounded-3xl p-5 shadow-xl hover:shadow-2xl transition-all duration-200 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Accent Top Border */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-amber-500 opacity-80" />

                <div className="space-y-3">
                  {/* Badge Row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-300 border border-rose-500/30 truncate max-w-[170px]">
                      {exam.subject || 'Giải Phẫu Học'}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {exam.accessPassword ? (
                        <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] flex items-center gap-1 font-bold" title="Có mật khẩu phòng thi">
                          <Lock className="w-3 h-3" />
                          <span>PIN</span>
                        </span>
                      ) : (
                        <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] flex items-center gap-1 font-bold" title="Tự do làm bài">
                          <Unlock className="w-3 h-3" />
                        </span>
                      )}

                      {/* Edit Exam Button */}
                      <button
                        onClick={(e) => handleOpenEdit(exam, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-950/40 transition-colors cursor-pointer"
                        title="Chỉnh sửa thông số đề thi"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(exam.id, e)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="Xóa đề thi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-black text-white group-hover:text-rose-300 transition-colors line-clamp-2 leading-snug">
                    {exam.title}
                  </h3>

                  {/* Exam Specs */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300 pt-0.5">
                    <span className="px-2 py-0.5 rounded-lg bg-black/50 border border-slate-800 text-[11px] font-mono font-bold flex items-center gap-1">
                      <Flame className="w-3 h-3 text-rose-400" />
                      <span>{exam.totalStations} Trạm</span>
                    </span>

                    <span className="px-2 py-0.5 rounded-lg bg-black/50 border border-slate-800 text-[11px] font-mono font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-cyan-400" />
                      <span>{exam.timePerStation}s / trạm</span>
                    </span>

                    {exam.generationStrategy === 'balanced_distribution' ? (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                        ⚖️ Phân bổ đều
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-0.5">
                        🎲 Random
                      </span>
                    )}
                  </div>

                  {/* Notes if available */}
                  {exam.notes && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-[#070b14] p-2 rounded-xl border border-slate-800/80">
                      {exam.notes}
                    </p>
                  )}
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center gap-2">
                    {/* Copy Link Button */}
                    <button
                      onClick={(e) => handleCopyLink(exam, e)}
                      className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border-slate-700'
                      }`}
                      title="Sao chép link làm bài trực tiếp cho học sinh"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{isCopied ? 'Đã chép link!' : 'Chép Link'}</span>
                    </button>

                    {/* Edit Exam Button */}
                    <button
                      onClick={(e) => handleOpenEdit(exam, e)}
                      className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-cyan-300 border border-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Chỉnh sửa thông số đề thi"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sửa Đề</span>
                    </button>

                    {/* QR Code Modal Button */}
                    <button
                      onClick={() => setQrModalExam(exam)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-cyan-400 border border-slate-700 transition-colors cursor-pointer"
                      title="Hiện mã QR để quét bằng điện thoại"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>

                    {/* Launch / Start Exam Button */}
                    <button
                      onClick={() => onLaunchExam(exam)}
                      className="py-2 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title="Vào phòng thi ngay"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Vào Thi</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
                    <span>Tạo: {new Date(exam.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>Tác giả: {exam.author || 'Nhật Duy'}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── QR CODE POPUP MODAL FOR MOBILE SCANNING ─── */}
      {qrModalExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#111827] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Mã QR Thi Trên Điện Thoại</span>
              </h3>
              <button onClick={() => setQrModalExam(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-200 line-clamp-1">{qrModalExam.title}</div>
              <div className="text-[11px] text-slate-400">
                {qrModalExam.totalStations} Trạm • {qrModalExam.timePerStation}s / trạm
              </div>
            </div>

            {/* The QR Image */}
            <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center shadow-inner mx-auto w-48 h-48">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  `${typeof window !== 'undefined' ? window.location.origin : 'https://dzota.vercel.app'}/dynex?mode=exam&examId=${qrModalExam.id}`
                )}`}
                alt="QR Code"
                className="w-40 h-40"
              />
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Mở Camera điện thoại hoặc Zalo quét mã để tự động vào thẳng phòng thi chạy trạm!
            </p>

            <button
              onClick={() => setQrModalExam(null)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL CHỈNH SỬA ĐỀ THI ĐÃ TẠO ─── */}
      {editingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-[#111827] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Chỉnh Sửa Thông Số Đề Thi</span>
              </h3>
              <button onClick={() => setEditingExam(null)} className="text-slate-400 hover:text-white p-1">✕</button>
            </div>

            <form onSubmit={handleSaveEditExam} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Đề Thi Chạy Trạm: *</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Môn Học Y Khoa:</label>
                  <input
                    type="text"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Giây / Trạm:</label>
                  <select
                    value={editTimePerStation}
                    onChange={(e) => setEditTimePerStation(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={15}>15 Giây</option>
                    <option value={20}>20 Giây (Chuẩn)</option>
                    <option value={25}>25 Giây</option>
                    <option value={30}>30 Giây</option>
                    <option value={40}>40 Giây</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mật Khẩu PIN (Để trống nếu mở tự do):</label>
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Không cài mật khẩu..."
                  className="w-full px-3.5 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Ghi Chú Quy Chế Phòng Thi:</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Quy chế làm bài..."
                  className="w-full px-3.5 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div className="p-3 bg-[#070b14] rounded-xl border border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                <span>Số trạm: <strong className="text-white font-mono">{editingExam.stations?.length || editingExam.totalStations} Trạm</strong></span>
                <span className="text-[11px] text-emerald-400 font-semibold">Tác giả: {editingExam.author || 'Nhật Duy'}</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingExam(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu Thay Đổi Đề</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
