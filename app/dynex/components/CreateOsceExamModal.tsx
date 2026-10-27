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
  Award,
  Lock,
  ListOrdered
} from 'lucide-react'
import {
  Project,
  Lesson,
  Category,
  SubFolder,
  storageService,
  DynexExamPaper,
  DynexExamStation
} from '../services/storageService'
import { soundService } from '../services/soundService'

interface CreateOsceExamModalProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  onExamCreated?: (exam: DynexExamPaper) => void
  onLaunchExam?: (exam: DynexExamPaper) => void
  onGoToExamManagement?: () => void
}

export default function CreateOsceExamModal({
  isOpen,
  onClose,
  projects,
  onExamCreated,
  onLaunchExam,
  onGoToExamManagement
}: CreateOsceExamModalProps) {
  if (!isOpen) return null

  // Form details
  const [examTitle, setExamTitle] = useState('Đề Thi Chạy Trạm Giải Phẫu OSCE')
  const [subjectName, setSubjectName] = useState('Giải Phẫu Học 1')
  const [totalStations, setTotalStations] = useState(20)
  const [secondsPerStation, setSecondsPerStation] = useState(20)
  const [examNotes, setExamNotes] = useState('Đề thi gồm các trạm giải phẫu che kín 100%, tự động chuyển trạm.')
  const [accessPassword, setAccessPassword] = useState('')

  // Generation Strategy
  const [strategy, setStrategy] = useState<'random_pool' | 'balanced_distribution'>('balanced_distribution')
  const [avoidConsecutiveSameImage, setAvoidConsecutiveSameImage] = useState(true)

  // Flatten all lessons with metadata
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

  // Selected lesson IDs (default pick first available with masks)
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>(() => {
    const withMasks = allLessonsData.filter(item => item.masksCount > 0)
    if (withMasks.length > 0) return withMasks.map(i => i.lesson.id)
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
    return { lessonsCount: selectedLessonIds.length, imagesCount: images, masksCount: masks }
  }, [allLessonsData, selectedLessonIds])

  // Toggle single lesson
  const toggleLesson = (lessonId: string) => {
    setSelectedLessonIds(prev =>
      prev.includes(lessonId) ? prev.filter(id => id !== lessonId) : [...prev, lessonId]
    )
    setPreviewStations(null)
  }

  // Toggle Category All
  const toggleCategoryAll = (category: Category) => {
    const catLessonIds: string[] = []
    category.subFolders?.forEach(sub => {
      sub.lessons?.forEach(les => catLessonIds.push(les.id))
    })

    const allSelected = catLessonIds.every(id => selectedLessonIds.includes(id))

    if (allSelected) {
      setSelectedLessonIds(prev => prev.filter(id => !catLessonIds.includes(id)))
    } else {
      setSelectedLessonIds(prev => Array.from(new Set([...prev, ...catLessonIds])))
    }
    setPreviewStations(null)
  }

  // Toggle SubFolder All
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

  // Select All
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

    const stations =
      previewStations ||
      storageService.generateOsceExamStations({
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

  const shareExamUrl =
    typeof window !== 'undefined' && createdExamResult
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl bg-[#111827] border border-rose-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Header (Compact) */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 p-0.5 shadow-md shadow-rose-600/30 flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Flame className="w-4 h-4 text-rose-400" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                Tạo Đề Thi Chạy Trạm Y Khoa AI (OSCE)
              </h3>
              <p className="text-[11px] text-slate-400">
                Thuật toán phân bổ đều, chống trùng lặp sơ đồ liên tiếp, xuất link trực tiếp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1">
          {createdExamResult ? (
            /* SUCCESS SCREEN */
            <div className="space-y-4 animate-fadeIn text-center py-4 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/30">
                <Check className="w-8 h-8 text-white stroke-[3]" />
              </div>

              <div className="space-y-1">
                <span className="text-[11px] uppercase font-black text-emerald-400 tracking-wider">
                  Tạo Đề Thi Thành Công!
                </span>
                <h3 className="text-xl font-black text-white">{createdExamResult.title}</h3>
                <p className="text-xs text-slate-300">
                  Môn: <strong className="text-cyan-400">{createdExamResult.subject}</strong> • {createdExamResult.totalStations} Trạm • {createdExamResult.timePerStation}s/Trạm
                </p>
              </div>

              {/* Direct Link Box */}
              <div className="bg-[#070b14] border border-slate-700/80 rounded-2xl p-3.5 text-left space-y-2.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  🔗 Link Học Sinh Vào Thi Trực Tiếp (Vào thẳng sảnh chờ OSCE):
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/60 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate">
                    {shareExamUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 shadow-md"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Đã chép!' : 'Chép link'}</span>
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
                  <span className="text-[10px] text-slate-500 font-semibold">
                    Thí sinh không thể sửa hoặc đổi đề
                  </span>
                </div>

                {showQrCode && (
                  <div className="p-3 bg-white rounded-2xl flex flex-col items-center justify-center gap-1.5 mt-2 animate-fadeIn">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareExamUrl)}`}
                      alt="QR Code"
                      className="w-36 h-36"
                    />
                    <span className="text-[10px] text-slate-800 font-bold">
                      Quét Camera / Zalo để vào thi trên điện thoại
                    </span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                <button
                  onClick={() => {
                    if (onLaunchExam && createdExamResult) {
                      onLaunchExam(createdExamResult)
                      onClose()
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Vào Phòng Thi Ngay</span>
                </button>

                {onGoToExamManagement && (
                  <button
                    onClick={() => {
                      onGoToExamManagement()
                      onClose()
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-md"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Xem Danh Sách Quản Lý Đề</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setCreatedExamResult(null)
                    setPreviewStations(null)
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer transition-colors"
                >
                  Tạo Đề Khác
                </button>
              </div>
            </div>
          ) : (
            /* 2-COLUMN HIGH-DENSITY FORM */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
              
              {/* LEFT COLUMN (5 COLS): EXAM SETTINGS */}
              <div className="lg:col-span-5 space-y-3 bg-[#0B0F19] border border-slate-800 rounded-2xl p-3.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Thiết Lập Thông Số Đề</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">Bản quyền: Nhật Duy</span>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Tên Đề Thi Chạy Trạm: *
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="vd: Thi Chạy Trạm Giải Phẫu Module Tiêu Hóa..."
                      className="w-full px-3 py-2 bg-[#111827] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Môn Học Y Khoa:
                      </label>
                      <input
                        type="text"
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        placeholder="Giải Phẫu Học 1..."
                        className="w-full px-3 py-2 bg-[#111827] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Mật Khẩu PIN (Tùy chọn):
                      </label>
                      <input
                        type="password"
                        value={accessPassword}
                        onChange={(e) => setAccessPassword(e.target.value)}
                        placeholder="Bỏ trống nếu công khai..."
                        className="w-full px-3 py-2 bg-[#111827] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Số Lượng Trạm:
                      </label>
                      <select
                        value={totalStations}
                        onChange={(e) => {
                          setTotalStations(Number(e.target.value))
                          setPreviewStations(null)
                        }}
                        className="w-full px-3 py-2 bg-[#111827] border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value={8}>8 Trạm (Nhanh)</option>
                        <option value={10}>10 Trạm (Khởi động)</option>
                        <option value={15}>15 Trạm (Tăng tốc)</option>
                        <option value={20}>20 Trạm (Chuẩn Y Dược)</option>
                        <option value={30}>30 Trạm (Chuyên sâu)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Giây / Trạm Thi:
                      </label>
                      <select
                        value={secondsPerStation}
                        onChange={(e) => setSecondsPerStation(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#111827] border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-rose-500"
                      >
                        <option value={15}>15 Giây / trạm</option>
                        <option value={20}>20 Giây / trạm (Chuẩn)</option>
                        <option value={25}>25 Giây / trạm</option>
                        <option value={30}>30 Giây / trạm</option>
                        <option value={40}>40 Giây / trạm</option>
                      </select>
                    </div>
                  </div>

                  {/* Generation Strategy */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Thuật Toán Sinh Trạm:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStrategy('balanced_distribution')
                          setPreviewStations(null)
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          strategy === 'balanced_distribution'
                            ? 'bg-rose-950/60 border-rose-500/80 text-white'
                            : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-[11px] font-black flex items-center gap-1 text-emerald-400">
                          <span>⚖️ Phân Bổ Đều</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          Chia đều câu hỏi cho các bài đã chọn
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStrategy('random_pool')
                          setPreviewStations(null)
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                          strategy === 'random_pool'
                            ? 'bg-rose-950/60 border-rose-500/80 text-white'
                            : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="text-[11px] font-black flex items-center gap-1 text-amber-400">
                          <span>🎲 Random Tự Do</span>
                        </div>
                        <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                          Lấy ngẫu nhiên không thiên vị
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Anti-consecutive setting */}
                  <label className="flex items-center gap-2 p-2 rounded-xl bg-[#111827] border border-slate-800 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={avoidConsecutiveSameImage}
                      onChange={(e) => {
                        setAvoidConsecutiveSameImage(e.target.checked)
                        setPreviewStations(null)
                      }}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-[11px] font-bold text-slate-200">
                      🛡️ Chống 2 trạm liên tiếp chung 1 hình
                    </span>
                  </label>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Ghi Chú Hướng Dẫn:
                    </label>
                    <textarea
                      rows={2}
                      value={examNotes}
                      onChange={(e) => setExamNotes(e.target.value)}
                      placeholder="Ghi chú quy chế phòng thi..."
                      className="w-full px-3 py-1.5 bg-[#111827] border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (7 COLS): ANATOMY QUESTION BANK TREE */}
              <div className="lg:col-span-7 flex flex-col bg-[#0B0F19] border border-slate-800 rounded-2xl p-3.5 min-h-[350px]">
                {/* Header & Quick Selects */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
                  <div>
                    <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Chọn Ngân Hàng Bài Học ({selectedLessonIds.length} bài)</span>
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Có {selectedStats.imagesCount} hình • {selectedStats.masksCount} chi tiết ô che
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="px-2 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Chọn Hết
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[10px] font-bold cursor-pointer transition-colors"
                    >
                      Bỏ Hết
                    </button>
                  </div>
                </div>

                {/* Lesson Tree List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[380px] scrollbar-thin">
                  {projects.map((proj) => (
                    <div key={proj.id} className="space-y-1.5">
                      {proj.categories?.map((cat) => {
                        const isCatOpen = expandedCategories[cat.id] ?? true
                        const catLessonIds: string[] = []
                        cat.subFolders?.forEach(s => s.lessons?.forEach(l => catLessonIds.push(l.id)))
                        const allCatSelected = catLessonIds.length > 0 && catLessonIds.every(id => selectedLessonIds.includes(id))

                        return (
                          <div key={cat.id} className="bg-[#111827] border border-slate-800/90 rounded-xl overflow-hidden">
                            {/* Category Row */}
                            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/60 border-b border-slate-800/50">
                              <div
                                onClick={() =>
                                  setExpandedCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }))
                                }
                                className="flex items-center gap-2 cursor-pointer select-none flex-1 truncate"
                              >
                                {isCatOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span className="text-xs font-black text-slate-200 truncate">{cat.name}</span>
                              </div>

                              <button
                                type="button"
                                onClick={() => toggleCategoryAll(cat)}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 cursor-pointer"
                              >
                                {allCatSelected ? 'Bỏ chọn' : 'Chọn cả chương'}
                              </button>
                            </div>

                            {/* Subfolders & Lessons */}
                            {isCatOpen && (
                              <div className="p-2 space-y-2">
                                {cat.subFolders?.map((sub) => {
                                  const isSubOpen = expandedSubFolders[sub.id] ?? true
                                  return (
                                    <div key={sub.id} className="space-y-1 pl-2 border-l border-slate-800">
                                      <div
                                        onClick={() =>
                                          setExpandedSubFolders(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))
                                        }
                                        className="flex items-center justify-between py-1 px-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer"
                                      >
                                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 truncate">
                                          {isSubOpen ? (
                                            <FolderOpen className="w-3 h-3 text-cyan-400" />
                                          ) : (
                                            <Folder className="w-3 h-3 text-cyan-400" />
                                          )}
                                          <span className="truncate">{sub.name}</span>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            toggleSubFolderAll(sub)
                                          }}
                                          className="text-[9px] text-slate-400 hover:text-white"
                                        >
                                          Chọn mục này
                                        </button>
                                      </div>

                                      {isSubOpen && (
                                        <div className="space-y-1 pl-3">
                                          {sub.lessons?.map((les) => {
                                            const isSelected = selectedLessonIds.includes(les.id)
                                            const imgCount = les.images?.length || 0
                                            const maskCount =
                                              les.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0

                                            return (
                                              <div
                                                key={les.id}
                                                onClick={() => toggleLesson(les.id)}
                                                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                                  isSelected
                                                    ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                                                    : 'bg-[#070b14] border-slate-800/80 text-slate-400 hover:text-slate-200'
                                                }`}
                                              >
                                                <div className="flex items-center gap-2 truncate flex-1">
                                                  {isSelected ? (
                                                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                                  ) : (
                                                    <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                                  )}
                                                  <span className="text-[11px] font-semibold truncate">
                                                    {les.title}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                                  <span className="px-1.5 py-0.5 rounded bg-black/60 text-[10px] font-mono text-cyan-300 border border-slate-800">
                                                    {imgCount} hình
                                                  </span>
                                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                                                    maskCount > 0
                                                      ? 'bg-rose-950/60 text-rose-300 border-rose-800/40'
                                                      : 'bg-slate-900 text-slate-500 border-slate-800'
                                                  }`}>
                                                    {maskCount} ô che
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

                {/* Preview Box if Generated */}
                {previewStations && (
                  <div className="mt-2 p-2.5 bg-[#070b14] border border-cyan-500/40 rounded-xl space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-cyan-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Đã sinh {previewStations.length} trạm thi thử nghiệm
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {previewStations.length} trạm đã sẵn sàng
                      </span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
                      {previewStations.map((st, i) => (
                        <div
                          key={i}
                          className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-200 shrink-0"
                          title={`${st.lessonTitle} • ${st.targetMask.label}`}
                        >
                          Trạm {i + 1}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Compact Bottom Sticky Footer Bar (Hidden when exam created) */}
        {!createdExamResult && (
          <div className="px-4 py-3 border-t border-slate-800 bg-[#0B0F19] flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                Đã chọn: <strong className="text-white">{selectedStats.lessonsCount}</strong> bài • <strong className="text-cyan-400">{selectedStats.imagesCount}</strong> sơ đồ • <strong className="text-rose-400">{selectedStats.masksCount}</strong> chi tiết
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sinh Thử Trạm</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndPublish}
                disabled={selectedLessonIds.length === 0 || selectedStats.masksCount === 0}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Lưu & Xuất Bản Đề Thi ({totalStations} Trạm)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
