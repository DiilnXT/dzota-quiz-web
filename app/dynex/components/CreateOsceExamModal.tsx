'use client'

import React, { useState, useMemo } from 'react'
import {
  X,
  Flame,
  Clock,
  Sparkles,
  Shuffle,
  Layers,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Image as ImageIcon,
  Check,
  Copy,
  QrCode,
  Smartphone,
  Play,
  ShieldCheck,
  Folder,
  FolderOpen,
  Eye,
  Sliders,
  Award
} from 'lucide-react'
import { Project, Lesson, Category, SubFolder, storageService, DynexExamPaper, DynexExamStation } from '../services/storageService'
import { soundService } from '../services/soundService'

interface CreateOsceExamModalProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onExamCreated?: (exam: DynexExamPaper) => void
  onLaunchExam?: (exam: DynexExamPaper) => void
}

export default function CreateOsceExamModal({
  isOpen,
  onClose,
  projects,
  onExamCreated,
  onLaunchExam
}: CreateOsceExamModalProps) {
  if (!isOpen) return null

  // Step 1: Form details
  const [examTitle, setExamTitle] = useState('Đề Thi Chạy Trạm Giải Phẫu OSCE')
  const [subjectName, setSubjectName] = useState('Giải Phẫu Học 1')
  const [totalStations, setTotalStations] = useState(20)
  const [secondsPerStation, setSecondsPerStation] = useState(20)
  const [examNotes, setExamNotes] = useState('Đề thi gồm các trạm giải phẫu chỉ điểm 100% che đặc, thời gian mỗi trạm 20 giây.')
  const [accessPassword, setAccessPassword] = useState('')

  // Step 2: Generation Strategy
  const [strategy, setStrategy] = useState<'random_pool' | 'balanced_distribution'>('balanced_distribution')
  const [avoidConsecutiveSameImage, setAvoidConsecutiveSameImage] = useState(true)

  // Step 3: Selection Tree
  // Flatten all lessons with meta
  const allLessonsData = useMemo(() => {
    const list: Array<{
      lesson: Lesson
      category: Category
      subFolder: SubFolder
      project: Project
      imagesCount: number
      masksCount: number
    }> = []

    projects.forEach(p => {
      p.categories?.forEach(cat => {
        cat.subFolders?.forEach(sub => {
          sub.lessons?.forEach(les => {
            const masksCount = les.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0
            list.push({
              lesson: les,
              category: cat,
              subFolder: sub,
              project: p,
              imagesCount: les.images?.length || 0,
              masksCount
            })
          })
        })
      })
    })

    return list
  }, [projects])

  // Selected lesson IDs
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>(() => {
    return allLessonsData.slice(0, 4).map(item => item.lesson.id)
  })

  // Collapsed categories & subfolders in tree
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    cat_tieu_hoa: true,
    cat_tuan_hoan: true
  })
  const [expandedSubFolders, setExpandedSubFolders] = useState<Record<string, boolean>>({
    sub_gan_mat: true,
    sub_da_day: true
  })

  // Generated preview stations
  const [previewStations, setPreviewStations] = useState<DynexExamStation[] | null>(null)
  const [createdExamResult, setCreatedExamResult] = useState<DynexExamPaper | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQrCode, setShowQrCode] = useState(false)

  // Stats of currently selected lessons
  const selectedStats = useMemo(() => {
    let images = 0
    let masks = 0
    allLessonsData.forEach(item => {
      if (selectedLessonIds.includes(item.lesson.id)) {
        images += item.imagesCount
        masks += item.masksCount
      }
    })
    return {
      lessonsCount: selectedLessonIds.length,
      imagesCount: images,
      masksCount: masks
    }
  }, [allLessonsData, selectedLessonIds])

  // Tree toggles
  const toggleCategory = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  const toggleSubFolder = (subId: string) => {
    setExpandedSubFolders(prev => ({ ...prev, [subId]: !prev[subId] }))
  }

  // Select / Deselect a single lesson
  const toggleLessonSelection = (lessonId: string) => {
    setSelectedLessonIds(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    )
    setPreviewStations(null)
  }

  // Select / Deselect all lessons in a subfolder (Chương)
  const toggleSubFolderAll = (subFolder: SubFolder) => {
    const subLessonIds = (subFolder.lessons || []).map(l => l.id)
    const allSelected = subLessonIds.every(id => selectedLessonIds.includes(id))

    if (allSelected) {
      setSelectedLessonIds(prev => prev.filter(id => !subLessonIds.includes(id)))
    } else {
      setSelectedLessonIds(prev => Array.from(new Set([...prev, ...subLessonIds])))
    }
    setPreviewStations(null)
  }

  // Select All lessons in the whole project
  const handleSelectAll = () => {
    const allIds = allLessonsData.map(item => item.lesson.id)
    setSelectedLessonIds(allIds)
    setPreviewStations(null)
  }

  const handleDeselectAll = () => {
    setSelectedLessonIds([])
    setPreviewStations(null)
  }

  // Preview Station Generation
  const handleGeneratePreview = () => {
    if (selectedLessonIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bài học giải phẫu để lấy ngân hàng câu hỏi!')
      return
    }

    if (selectedStats.masksCount === 0) {
      alert('Các bài học bạn chọn chưa có chi tiết ô che nào! Vui lòng chọn bài học khác hoặc vẽ ô che trước.')
      return
    }

    const stations = storageService.generateOsceExamStations({
      projects,
      selectedLessonIds,
      totalStations,
      strategy,
      avoidConsecutiveSameImage
    })

    if (stations.length === 0) {
      alert('Không thể sinh trạm thi từ dữ liệu đã chọn.')
      return
    }

    setPreviewStations(stations)
    soundService.playTick()
  }

  // Save Exam
  const handleSaveAndPublish = () => {
    if (selectedLessonIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bài học!')
      return
    }

    const stations = previewStations || storageService.generateOsceExamStations({
      projects,
      selectedLessonIds,
      totalStations,
      strategy,
      avoidConsecutiveSameImage
    })

    if (stations.length === 0) {
      alert('Không có dữ liệu trạm thi khả dụng!')
      return
    }

    const examId = `exam_osce_${Date.now()}`
    const newExam: DynexExamPaper = {
      id: examId,
      title: examTitle.trim() || 'Đề Thi Chạy Trạm Giải Phẫu OSCE',
      subject: subjectName.trim() || 'Giải Phẫu Y Khoa',
      timePerStation: secondsPerStation,
      totalStations: stations.length,
      notes: examNotes.trim(),
      generationStrategy: strategy,
      avoidConsecutiveSameImage,
      selectedLessonIds,
      stations,
      createdAt: new Date().toISOString(),
      author: 'Nhật Duy (Dzota Y Khoa)',
      accessPassword: accessPassword.trim() || undefined
    }

    storageService.saveExam(newExam)
    setCreatedExamResult(newExam)
    soundService.playSuccess()

    if (onExamCreated) {
      onExamCreated(newExam)
    }
  }

  const shareExamUrl = typeof window !== 'undefined' && createdExamResult
    ? `${window.location.origin}/dynex?mode=exam&examId=${createdExamResult.id}`
    : createdExamResult
    ? `https://dzota.vercel.app/dynex?mode=exam&examId=${createdExamResult.id}`
    : ''

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && shareExamUrl) {
      navigator.clipboard.writeText(shareExamUrl)
      setCopiedLink(true)
      soundService.playStationChime()
      setTimeout(() => setCopiedLink(false), 3000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-[#111827] border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-lg shadow-rose-600/30">
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                <Flame className="w-5 h-5 text-rose-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Tạo Đề Thi Chạy Trạm Y Khoa AI (OSCE)
              </h3>
              <p className="text-xs text-slate-400">
                Sinh đề thông minh, chống trùng hình liên tiếp, phân bổ đều ngân hàng câu hỏi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* SUCCESS SCREEN IF EXAM CREATED */}
          {createdExamResult ? (
            <div className="space-y-6 animate-fadeIn text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                <Check className="w-9 h-9 text-white stroke-[3]" />
              </div>

              <div className="space-y-1">
                <span className="text-xs uppercase font-black text-emerald-400 tracking-wider">
                  Tạo Đề Thi Thành Công!
                </span>
                <h3 className="text-2xl font-black text-white">{createdExamResult.title}</h3>
                <p className="text-xs text-slate-300">
                  Môn học: <strong className="text-cyan-400">{createdExamResult.subject}</strong> • {createdExamResult.totalStations} Trạm • {createdExamResult.timePerStation} Giây/Trạm
                </p>
              </div>

              {/* Direct Link Box */}
              <div className="bg-[#070b14] border border-slate-700/80 rounded-2xl p-4 max-w-xl mx-auto text-left space-y-3">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  🔗 Link Học Sinh Vào Làm Bài Trực Tiếp (Tự động vào phòng thi OSCE):
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-cyan-300 truncate">
                    {shareExamUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-lg"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Đã chép!' : 'Sao chép link'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setShowQrCode(!showQrCode)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{showQrCode ? 'Ẩn mã QR' : 'Hiện mã QR cho điện thoại'}</span>
                  </button>
                  <span className="text-[11px] text-slate-500 font-semibold">
                    Đảm bảo chỉ vào thẳng giao diện chạy trạm
                  </span>
                </div>

                {showQrCode && (
                  <div className="p-4 bg-white rounded-2xl flex flex-col items-center justify-center gap-2 mt-2 animate-fadeIn">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareExamUrl)}`}
                      alt="QR Code"
                      className="w-40 h-40"
                    />
                    <span className="text-[11px] text-slate-800 font-bold">
                      Quét bằng Camera điện thoại / Zalo để vào thi ngay
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    if (onLaunchExam && createdExamResult) {
                      onLaunchExam(createdExamResult)
                      onClose()
                    }
                  }}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-xl shadow-rose-600/30 flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Vào Phòng Thi Ngay</span>
                </button>

                <button
                  onClick={() => {
                    setCreatedExamResult(null)
                    setPreviewStations(null)
                  }}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Tạo Đề Thi Khác
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. BASIC EXAM INFORMATION */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  <span>1. Thông Tin & Quy Cách Đề Thi</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Tên Bài Thi / Kỳ Thi: *
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={e => setExamTitle(e.target.value)}
                      placeholder="vd: Thi Chạy Trạm Giải Phẫu Thực Hành Đợt 1..."
                      className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Môn Học / Phân Môn: *
                    </label>
                    <input
                      type="text"
                      value={subjectName}
                      onChange={e => setSubjectName(e.target.value)}
                      placeholder="vd: Giải Phẫu 1, Giải Phẫu Định Khu, Ngoại Khoa..."
                      className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Stations */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Số Lượng Trạm Thi:
                    </label>
                    <select
                      value={totalStations}
                      onChange={e => {
                        setTotalStations(Number(e.target.value))
                        setPreviewStations(null)
                      }}
                      className="w-full px-3 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                    >
                      <option value={10}>10 Trạm (Ngắn gọn)</option>
                      <option value={15}>15 Trạm</option>
                      <option value={20}>20 Trạm (Chuẩn Y Dược OSCE)</option>
                      <option value={25}>25 Trạm</option>
                      <option value={30}>30 Trạm (Chuyên khoa sâu)</option>
                      <option value={40}>40 Trạm (Tổng hợp)</option>
                    </select>
                  </div>

                  {/* Seconds per Station */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Thời Gian Mỗi Trạm:
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[15, 20, 25, 30].map(sec => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() => setSecondsPerStation(sec)}
                          className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            secondsPerStation === sec
                              ? 'bg-rose-600 text-white shadow-md border border-rose-400'
                              : 'bg-[#070b14] text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          {sec}s
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Password code (optional) */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Mật Khẩu / Mã PIN (Tùy chọn):
                    </label>
                    <input
                      type="text"
                      value={accessPassword}
                      onChange={e => setAccessPassword(e.target.value)}
                      placeholder="Để trống nếu tự do thi..."
                      className="w-full px-3 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs font-mono font-bold text-amber-300 uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Ghi Chú Chủ Đề / Hướng Dẫn Thí Sinh:
                  </label>
                  <textarea
                    rows={2}
                    value={examNotes}
                    onChange={e => setExamNotes(e.target.value)}
                    placeholder="vd: Mỗi trạm kéo dài 20 giây, gõ tên cấu trúc giải phẫu chuẩn y khoa..."
                    className="w-full px-3.5 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
                  />
                </div>
              </div>

              {/* 2. QUESTION BANK & LESSON SELECTION HIERARCHY */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>2. Ngân Hàng Câu Hỏi & Phạm Vi Kiến Thức</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tick chọn các Chương hoặc Bài học muốn đưa vào đề thi:
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    >
                      Chọn Tất Cả
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
                    >
                      Bỏ Chọn
                    </button>
                  </div>
                </div>

                {/* Selection Real-time Summary Badge */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#070b14] border border-slate-800 text-xs">
                  <span className="text-slate-400">Đã chọn:</span>
                  <span className="font-black text-indigo-300">{selectedStats.lessonsCount} Bài học</span>
                  <span>•</span>
                  <span className="font-black text-cyan-300">{selectedStats.imagesCount} Sơ đồ giải phẫu</span>
                  <span>•</span>
                  <span className="font-black text-amber-300">{selectedStats.masksCount} Chi tiết ô che khả dụng</span>
                </div>

                {/* Tree Structure */}
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                  {projects.map(project => (
                    <div key={project.id} className="space-y-2">
                      {project.categories?.map(category => {
                        const isCatOpen = expandedCategories[category.id] !== false

                        return (
                          <div key={category.id} className="rounded-xl border border-slate-800 bg-[#070b14]/60 overflow-hidden">
                            {/* Category Header */}
                            <div
                              onClick={() => toggleCategory(category.id)}
                              className="px-3 py-2 bg-slate-900/80 flex items-center justify-between cursor-pointer hover:bg-slate-850"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                                {isCatOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                <Folder className="w-4 h-4 text-indigo-400" />
                                <span>{category.name}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {category.subFolders?.length || 0} chương
                              </span>
                            </div>

                            {/* SubFolders (Chương) */}
                            {isCatOpen && (
                              <div className="p-2 space-y-2">
                                {category.subFolders?.map(subFolder => {
                                  const isSubOpen = expandedSubFolders[subFolder.id] !== false
                                  const subLessonIds = (subFolder.lessons || []).map(l => l.id)
                                  const allSelectedInSub = subLessonIds.length > 0 && subLessonIds.every(id => selectedLessonIds.includes(id))
                                  const someSelectedInSub = subLessonIds.some(id => selectedLessonIds.includes(id))

                                  return (
                                    <div key={subFolder.id} className="ml-2 rounded-xl border border-slate-800/80 bg-[#0B0F19]">
                                      {/* Subfolder Row */}
                                      <div className="px-3 py-1.5 flex items-center justify-between bg-slate-900/40">
                                        <div className="flex items-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() => toggleSubFolder(subFolder.id)}
                                            className="text-slate-400 hover:text-white"
                                          >
                                            {isSubOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                          </button>

                                          <div
                                            onClick={() => toggleSubFolderAll(subFolder)}
                                            className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-300 hover:text-white"
                                          >
                                            {allSelectedInSub ? (
                                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                                            ) : someSelectedInSub ? (
                                              <div className="w-4 h-4 rounded bg-indigo-600/40 border border-indigo-400 flex items-center justify-center">
                                                <div className="w-2 h-0.5 bg-white" />
                                              </div>
                                            ) : (
                                              <Square className="w-4 h-4 text-slate-600" />
                                            )}
                                            <span>{subFolder.name}</span>
                                          </div>
                                        </div>

                                        <span className="text-[10px] text-slate-500 font-mono">
                                          {subFolder.lessons?.length || 0} bài học
                                        </span>
                                      </div>

                                      {/* Lessons in Subfolder */}
                                      {isSubOpen && (
                                        <div className="p-2 pl-6 space-y-1.5">
                                          {subFolder.lessons?.map(lesson => {
                                            const isSelected = selectedLessonIds.includes(lesson.id)
                                            const imagesCount = lesson.images?.length || 0
                                            const masksCount = lesson.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0

                                            return (
                                              <div
                                                key={lesson.id}
                                                onClick={() => toggleLessonSelection(lesson.id)}
                                                className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                                                  isSelected
                                                    ? 'bg-indigo-950/40 border border-indigo-500/40 text-white'
                                                    : 'hover:bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2 text-xs font-semibold">
                                                  {isSelected ? (
                                                    <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                                                  ) : (
                                                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                                                  )}
                                                  <span className="truncate max-w-xs sm:max-w-md">{lesson.title}</span>
                                                </div>

                                                {/* Image and Mask Counts */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                  <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-cyan-300 border border-cyan-900/40 flex items-center gap-1">
                                                    <ImageIcon className="w-3 h-3" />
                                                    <span>{imagesCount} hình</span>
                                                  </span>
                                                  <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono text-amber-300 border border-amber-900/40">
                                                    {masksCount} chi tiết
                                                  </span>
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. GENERATION STRATEGY & ALGORITHM OPTIONS */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  <span>3. Thuật Toán Sinh Đề Thi Y Khoa Thông Minh</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Balanced Distribution */}
                  <div
                    onClick={() => {
                      setStrategy('balanced_distribution')
                      setPreviewStations(null)
                    }}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      strategy === 'balanced_distribution'
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-950/40'
                        : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">⚖️</span>
                      <span className="text-xs font-black text-white">Phân Bổ Đều Các Chương & Bài</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Chia đều số trạm vào từng bài/chương đã chọn để đề thi bao quát toàn diện mọi vùng giải phẫu, không bị dồn cục vào 1 bài.
                    </p>
                  </div>

                  {/* Random Pool */}
                  <div
                    onClick={() => {
                      setStrategy('random_pool')
                      setPreviewStations(null)
                    }}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                      strategy === 'random_pool'
                        ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-950/40'
                        : 'bg-[#070b14] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-base">🎲</span>
                      <span className="text-xs font-black text-white">Ngẫu Nhiên Tự Do (Random Pool)</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      Bốc thăm ngẫu nhiên toàn bộ chi tiết giải phẫu từ kho các bài học đã chọn mà không khống chế tỷ lệ từng bài.
                    </p>
                  </div>
                </div>

                {/* Anti-consecutive image shuffle toggle */}
                <div
                  onClick={() => {
                    setAvoidConsecutiveSameImage(!avoidConsecutiveSameImage)
                    setPreviewStations(null)
                  }}
                  className="p-3 rounded-xl bg-[#070b14] border border-slate-800 flex items-start gap-3 cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <div className="pt-0.5">
                    {avoidConsecutiveSameImage ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      🛡️ Chống trùng lặp sơ đồ liên tiếp (Tỉ lệ 2 trạm kề nhau chung 1 hình cực thấp)
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      Hệ thống tự động đảo trạm và xếp xen kẽ các hình ảnh khác nhau, giúp thí sinh không bị gặp 2 trạm liên tiếp cùng quan sát 1 sơ đồ.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. PREVIEW OF STATIONS (IF GENERATED) */}
              {previewStations && (
                <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5">
                      <Eye className="w-4 h-4" />
                      <span>Xem Trước {previewStations.length} Trạm Thi Đã Sinh</span>
                    </h4>
                    <button
                      type="button"
                      onClick={handleGeneratePreview}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>Trộn đề lại (Re-roll)</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-56 overflow-y-auto pr-1">
                    {previewStations.map((station, sIdx) => (
                      <div
                        key={station.stationId || sIdx}
                        className="p-2 rounded-xl bg-[#070b14] border border-slate-800 space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-rose-400 font-bold font-mono">
                          <span>TRẠM {station.stationIndex}</span>
                          <span className="text-slate-500 truncate max-w-[60px]">{station.imageTitle}</span>
                        </div>
                        <p className="text-xs font-bold text-white truncate" title={station.officialAnswer}>
                          {station.officialAnswer}
                        </p>
                        <span className="text-[9px] text-slate-500 truncate block">
                          {station.lessonTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>

        {/* Footer Actions */}
        {!createdExamResult && (
          <div className="px-6 py-4 border-t border-slate-800 bg-[#0B0F19] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400">
              Tổng số trạm thi dự kiến:{' '}
              <strong className="text-rose-400 font-mono text-sm">{totalStations} Trạm</strong>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shuffle className="w-4 h-4 text-cyan-400" />
                <span>Sinh & Xem Trước</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndPublish}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
              >
                <Flame className="w-4 h-4 fill-current" />
                <span>Lưu & Xuất Bản Đề Thi</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
