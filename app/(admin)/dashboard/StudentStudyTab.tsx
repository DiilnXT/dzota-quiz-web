'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  GraduationCap,
  BookOpen,
  School,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
  Search,
  RotateCcw,
  Award,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Share2,
  Copy,
  QrCode,
  Flame,
  Activity,
  Layers,
  FileText,
  Download,
  Eye,
  Check,
  X,
  Lock,
  Unlock,
  ShieldCheck,
  Filter,
  Grid,
  List,
  MessageCircle
} from 'lucide-react'

interface StudentStudyTabProps {
  currentUser: any
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void
}

export default function StudentStudyTab({ currentUser, showToast }: StudentStudyTabProps) {
  const [loading, setLoading] = useState(true)
  const [studyData, setStudyData] = useState<{
    enrolledClasses: any[]
    assignedQuizzes: any[]
    history: any[]
  }>({
    enrolledClasses: [],
    assignedQuizzes: [],
    history: []
  })

  // State tab nội bộ của sinh viên: 'assigned' (bài thi) | 'osce' (chạy trạm) | 'docs' (tài liệu) | 'history' (lịch sử)
  const [activeSubTab, setActiveSubTab] = useState<'assigned' | 'osce' | 'docs' | 'history'>('assigned')
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

  // Share modal state
  const [shareModalItem, setShareModalItem] = useState<{
    title: string
    url: string
    id: string
    category?: string
  } | null>(null)
  const [hasCopiedLink, setHasCopiedLink] = useState(false)

  // Danh mục đề thi chạy trạm y khoa DYNEX OSCE (Thầy Nhật Duy biên soạn)
  const osceStationExams = [
    {
      id: 'osce_tieu_hoa_gan_mat',
      title: 'Chạy Trạm OSCE: Giải Phẫu Hệ Tiêu Hóa, Gan Mật & Tụy',
      category: 'Giải Phẫu Y Khoa',
      stationsCount: 20,
      timePerStation: '25 giây / trạm',
      author: 'Lê Nhật Duy (DuylniEdu)',
      badge: 'Độc Quyền OSCE',
      description: '20 trạm tiêu bản thực tế mô phỏng kỳ thi chạy trạm giải phẫu Đại học Y Dược: Mạc treo đại tràng, cuống gan, tam giác Calot, ống Wirsung.',
      examUrl: '/dynex?mode=exam&examId=exam_tieu_hoa_k26',
      flashcardUrl: '/dynex?tab=flashcard&lessonId=les_tieu_hoa',
      isVip: false
    },
    {
      id: 'osce_tuan_hoan_tim_mach',
      title: 'Chạy Trạm OSCE: Giải Phẫu Tim Mạch & Trung Thất',
      category: 'Giải Phẫu Y Khoa',
      stationsCount: 20,
      timePerStation: '20 giây / trạm',
      author: 'Lê Nhật Duy (DuylniEdu)',
      badge: 'Trọng Tâm Thi',
      description: 'Chuẩn 20 tiêu bản cấu trúc tim, rãnh vành, các nhánh động mạch vành, chuỗi hạch giao cảm cạnh sống và các mốc trung thất.',
      examUrl: '/dynex?mode=exam&examId=exam_tim_mach_osce',
      flashcardUrl: '/dynex?tab=flashcard&lessonId=les_tim_mach',
      isVip: false
    },
    {
      id: 'osce_than_kinh_so_nao',
      title: 'Chạy Trạm OSCE: Hệ Thần Kinh Trung Ương & 12 Đôi Dây TK Sọ',
      category: 'Giải Phẫu Thần Kinh',
      stationsCount: 25,
      timePerStation: '20 giây / trạm',
      author: 'Lê Nhật Duy (DuylniEdu)',
      badge: 'VIP Y Khoa',
      description: 'Bộ 25 trạm đỉnh cao: Thân não, tiểu não, các rãnh vỏ não, các lỗ nền sọ và nguyên ủy thực / hư của 12 đôi dây thần kinh sọ.',
      examUrl: '/dynex?mode=exam&examId=exam_than_kinh_k26',
      flashcardUrl: '/dynex?tab=flashcard&lessonId=les_than_kinh',
      isVip: true
    },
    {
      id: 'osce_co_xuong_khop_chi',
      title: 'Chạy Trạm OSCE: Định Hướng Xương & Cơ Chi Trên - Chi Dưới',
      category: 'Giải Phẫu Định Hướng',
      stationsCount: 20,
      timePerStation: '20 giây / trạm',
      author: 'Lê Nhật Duy (DuylniEdu)',
      badge: 'Cơ Bản Phải Đạt',
      description: 'Luyện tập định hướng xương mác, xương đùi, xương quay, các cơ vùng cẳng tay và tam giác Scarpa với âm thanh chuông báo chuẩn thi.',
      examUrl: '/dynex?mode=exam&examId=exam_co_xuong_khop',
      flashcardUrl: '/dynex?tab=flashcard&lessonId=les_co_xuong',
      isVip: false
    },
    {
      id: 'osce_duoc_ly_khang_sinh',
      title: 'Trắc Nghiệm Tình Huống: Dược Lý Kháng Sinh & Tim Mạch Lâm Sàng',
      category: 'Dược Lý Lâm Sàng',
      stationsCount: 30,
      timePerStation: '30 giây / câu',
      author: 'Lê Nhật Duy (DuylniEdu)',
      badge: 'Lâm Sàng',
      description: 'Cơ chế tác dụng, chỉ định, độc tính và tương tác thuốc: Nhóm Beta-lactam, Aminoglycosid, Macrolid, thuốc chẹn Beta & ức chế men chuyển.',
      examUrl: '/dynex?mode=exam&examId=exam_duoc_ly_ls',
      flashcardUrl: '/dynex?tab=flashcard&lessonId=les_duoc_ly',
      isVip: true
    }
  ]

  // Danh mục tài liệu y khoa & giáo trình tóm tắt (Bán / Cung cấp tài liệu trên web)
  const studyMaterialsList = [
    {
      id: 'doc_so_tay_osce_500',
      title: 'Sổ Tay 500 Tiêu Bản Giải Phẫu Chạy Trạm Đạt Điểm 10',
      type: 'Tài Liệu PDF Màu VIP',
      author: 'Lê Nhật Duy Y Khoa K26',
      pages: '148 trang',
      fileSize: '45.2 MB',
      badge: 'Bản Quyền Độc Quyền',
      description: 'Đầy đủ hình ảnh tiêu bản thật chụp tại phòng thực tập giải phẫu, có chú thích mũi tên chi tiết và mẹo nhớ nhanh không bị nhầm lẫn.',
      isHot: true,
      price: 'Tặng kèm lớp học / Liên hệ Zalo'
    },
    {
      id: 'doc_mindmap_duoc_ly',
      title: 'Sơ Đồ Tư Duy (Mindmap) Dược Lý Kháng Sinh Thế Hệ Mới',
      type: 'Sơ Đồ Mindmap HD',
      author: 'Lê Nhật Duy Y Khoa K26',
      pages: '36 sơ đồ',
      fileSize: '18.6 MB',
      badge: 'Khuyên Dùng',
      description: 'Hệ thống hóa toàn bộ phổ kháng khuẩn, cơ chế tác động và liều dùng lâm sàng của các thế hệ Cephalosporin, Carbapenem, Fluoroquinolon.',
      isHot: true,
      price: 'Miễn phí cho sinh viên'
    },
    {
      id: 'doc_ngan_hang_1000_cau',
      title: 'Ngân Hàng 1000 Câu Trắc Nghiệm Ma Trận Bộ Môn Y Dược (Có Đáp Án & Giải Thích)',
      type: 'Kho Đề Word / PDF',
      author: 'Lê Nhật Duy Y Khoa K26',
      pages: '220 trang',
      fileSize: '12.4 MB',
      badge: 'Bộ Đề Trọng Tâm',
      description: 'Bộ câu hỏi ma trận phân loại 4 mức độ: Nhận biết, Thông hiểu, Vận dụng và Vận dụng cao bám sát đề thi kết thúc học phần.',
      isHot: false,
      price: 'Tặng kèm lớp học'
    }
  ]

  const fetchStudyData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/student/study')
      if (res.ok) {
        const data = await res.json()
        setStudyData({
          enrolledClasses: data.enrolledClasses || [],
          assignedQuizzes: data.assignedQuizzes || [],
          history: data.history || []
        })
      } else {
        showToast('Không thể tải dữ liệu góc học tập', 'error')
      }
    } catch (e) {
      showToast('Lỗi kết nối máy chủ', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudyData()
  }, [])

  // Danh sách các môn học có trong đề thi
  const categories = useMemo(() => {
    const set = new Set(studyData.assignedQuizzes.map(q => q.category).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [studyData.assignedQuizzes])

  // Lọc danh sách đề thi theo tìm kiếm & môn học
  const filteredQuizzes = useMemo(() => {
    return studyData.assignedQuizzes.filter(q => {
      const matchSearch = (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.author || '').toLowerCase().includes(searchTerm.toLowerCase())
      const matchCategory = selectedCategory === 'ALL' || q.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [studyData.assignedQuizzes, searchTerm, selectedCategory])

  const completedCount = studyData.assignedQuizzes.filter(q => q.hasTaken).length
  const averageScore = useMemo(() => {
    const scores = studyData.assignedQuizzes.filter(q => q.highestScore !== null).map(q => q.highestScore)
    if (scores.length === 0) return 0
    const sum = scores.reduce((a, b) => a + b, 0)
    return (sum / scores.length).toFixed(1)
  }, [studyData.assignedQuizzes])

  const handleOpenShare = (quiz: any) => {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/?id=${quiz.id}` : `https://dzota.vercel.app/?id=${quiz.id}`
    setShareModalItem({
      title: quiz.title,
      url,
      id: quiz.id,
      category: quiz.category
    })
    setHasCopiedLink(false)
  }

  const handleCopyShareLink = () => {
    if (!shareModalItem) return
    navigator.clipboard.writeText(shareModalItem.url)
    setHasCopiedLink(true)
    showToast('Đã sao chép link bài thi vào clipboard!', 'success')
    setTimeout(() => setHasCopiedLink(false), 2500)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
        <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* ─── 1. ELITE STUDENT HERO HUB (GIAO DIỆN HỌC VIÊN CAO CẤP) ─── */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-purple-800 rounded-[28px] sm:rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-600/20 relative overflow-hidden">
        {/* Ambient geometric curves */}
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute right-1/4 -bottom-16 w-60 h-60 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md p-1.5 flex items-center justify-center flex-shrink-0 border border-white/25 shadow-inner">
              <img
                src={currentUser?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser?.username || 'student')}`}
                alt="Avatar"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1.5">
                  <GraduationCap size={13} />
                  Cổng Học Viên • Y Khoa K26
                </span>
                <span className="text-[11px] font-black bg-amber-400/90 text-amber-950 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                  <Flame size={12} fill="currentColor" /> Streak: 5 Ngày
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Xin chào, {currentUser?.name || currentUser?.username || 'Bạn học viên'}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
                Hệ thống rèn luyện khảo thí, kho đề thi chạy trạm y khoa DYNEX OSCE và tài liệu ôn thi độc quyền từ thầy Nhật Duy.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchStudyData}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 border border-white/20 cursor-pointer shadow-xs"
            >
              <RotateCcw size={14} />
              <span>Đồng bộ</span>
            </button>
            <a
              href="/dynex"
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-2 transition active:scale-95 shadow-md shadow-emerald-700/30 no-underline cursor-pointer"
            >
              <Activity size={15} />
              <span>Mở DYNEX OSCE</span>
            </a>
          </div>
        </div>

        {/* Mini progress tracker */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] text-blue-200 font-medium block">Lớp học tham gia</span>
            <span className="text-xl sm:text-2xl font-black mt-0.5 block">{studyData.enrolledClasses.length} lớp</span>
          </div>
          <div>
            <span className="text-[11px] text-blue-200 font-medium block">Đề thi được giao</span>
            <span className="text-xl sm:text-2xl font-black mt-0.5 block">{studyData.assignedQuizzes.length} đề thi</span>
          </div>
          <div>
            <span className="text-[11px] text-blue-200 font-medium block">Tiến độ hoàn thành</span>
            <span className="text-xl sm:text-2xl font-black mt-0.5 block text-cyan-300">
              {studyData.assignedQuizzes.length > 0
                ? `${Math.round((completedCount / studyData.assignedQuizzes.length) * 100)}%`
                : '100%'}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-blue-200 font-medium block">Điểm trung bình</span>
            <span className="text-xl sm:text-2xl font-black mt-0.5 block text-amber-300">
              {averageScore > 0 ? `${averageScore}/10` : 'Chưa có điểm'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 2. SUB-NAVIGATION TABS (CHỌN GÓC HỌC TẬP) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#1E293B] p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveSubTab('assigned')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'assigned'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen size={16} />
            <span>Bài Thi Được Giao ({studyData.assignedQuizzes.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('osce')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'osce'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity size={16} className="text-emerald-400" />
            <span>Kho Đề Thi Chạy Trạm DYNEX OSCE ({osceStationExams.length})</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-emerald-400 text-emerald-950 font-black rounded-md">Y Khoa</span>
          </button>

          <button
            onClick={() => setActiveSubTab('docs')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'docs'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <FileText size={16} />
            <span>Tài Liệu Ôn Thi & Giáo Trình ({studyMaterialsList.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Clock size={16} />
            <span>Lịch Sử Bài Làm ({studyData.history.length})</span>
          </button>
        </div>

        {activeSubTab === 'assigned' && (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewLayout('grid')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewLayout === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng thẻ lưới"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                viewLayout === 'table'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Xem dạng danh sách"
            >
              <List size={16} />
            </button>
          </div>
        )}
      </div>

      {/* ─── 3. TAB CONTENT 1: BÀI THI ĐƯỢC GIAO (ASSIGNED QUIZZES) ─── */}
      {activeSubTab === 'assigned' && (
        <div className="space-y-4">
          {/* Controls: Search & Category filter */}
          <div className="bg-white dark:bg-[#1E293B] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm bài thi theo tên, môn học, giáo viên..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 text-slate-800 dark:text-slate-100 transition"
              />
            </div>

            {categories.length > 2 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs font-bold text-slate-400 shrink-0">Môn:</span>
                <div className="flex items-center gap-1.5">
                  {categories.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        selectedCategory === c
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {c === 'ALL' ? 'Tất cả' : c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {filteredQuizzes.length === 0 ? (
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-700">
              <BookOpen size={44} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
              <h3 className="font-extrabold text-slate-700 dark:text-slate-200 text-base">Chưa tìm thấy bài thi phù hợp</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Khi giáo viên giao bài tập hoặc thêm bạn vào lớp học, đề thi sẽ tự động hiển thị tại đây.
              </p>
            </div>
          ) : viewLayout === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-500/40 transition-all flex flex-col justify-between group relative"
                >
                  <div>
                    {/* Header: Category & Share */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-extrabold text-[11px] rounded-lg border border-indigo-100 dark:border-indigo-900/40">
                        {quiz.category}
                      </span>
                      <button
                        onClick={() => handleOpenShare(quiz)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition cursor-pointer"
                        title="Chia sẻ link bài thi cho bạn bè"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>

                    <h3 className="font-black text-slate-800 dark:text-slate-100 text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                      {quiz.title}
                    </h3>

                    {/* Metadata */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-indigo-500" />
                        {quiz.timeLimit} phút
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileText size={13} className="text-emerald-500" />
                        {quiz.questionsCount} câu hỏi
                      </span>
                      <span>•</span>
                      <span>GV: {quiz.author}</span>
                    </div>

                    {/* Status badge */}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                        Lớp: <strong className="text-slate-700 dark:text-slate-200">{quiz.assignedClass}</strong>
                      </span>
                      {quiz.hasTaken ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg">
                          <Award size={12} /> {quiz.highestScore}/10 điểm
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg">
                          Chưa làm
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <a
                      href={quiz.link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition active:scale-95 no-underline cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>{quiz.hasTaken ? 'Làm lại bài thi' : 'Bắt đầu làm bài'}</span>
                    </a>
                    <button
                      onClick={() => handleOpenShare(quiz)}
                      className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                      title="Chia sẻ mã đề"
                    >
                      <Share2 size={13} />
                      <span className="hidden sm:inline">Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[11px]">
                    <th className="py-3 px-3">Tên Bài Thi</th>
                    <th className="py-3 px-3">Môn Học</th>
                    <th className="py-3 px-3 hidden md:table-cell">Lớp Phân Quyền</th>
                    <th className="py-3 px-3">Kết Quả Điểm Số</th>
                    <th className="py-3 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQuizzes.map(quiz => (
                    <tr key={quiz.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-800 dark:text-slate-100 text-sm line-clamp-1">
                          {quiz.title}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>⏱️ {quiz.timeLimit}p</span>
                          <span>•</span>
                          <span>📝 {quiz.questionsCount} câu</span>
                          <span>•</span>
                          <span>GV: {quiz.author}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-[11px]">
                          {quiz.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 hidden md:table-cell whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {quiz.assignedClass}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {quiz.hasTaken ? (
                          <div>
                            <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-lg text-xs">
                              <Award size={12} /> {quiz.highestScore}/10
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5">{quiz.attempts} lượt nộp</div>
                          </div>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg text-[11px]">
                            Chưa làm
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenShare(quiz)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Chia sẻ link"
                          >
                            <Share2 size={15} />
                          </button>
                          <a
                            href={quiz.link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition active:scale-95 shadow-xs"
                          >
                            <Play size={12} fill="currentColor" />
                            <span>{quiz.hasTaken ? 'Làm lại' : 'Làm bài'}</span>
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── 4. TAB CONTENT 2: KHO ĐỀ THI CHẠY TRẠM DYNEX OSCE (CHUẨN Y KHOA) ─── */}
      {activeSubTab === 'osce' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-emerald-900/70 via-teal-900/60 to-slate-900 p-6 rounded-3xl border border-emerald-500/30 text-white relative overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Hệ Thống Khảo Thí Chạy Trạm Chuẩn Quốc Tế
                </span>
                <h2 className="text-xl sm:text-2xl font-black mt-1.5">
                  Kho Đề Thi Chạy Trạm Giải Phẫu & OSCE Y Khoa
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-xl leading-relaxed">
                  Trải nghiệm áp lực phòng thi thật với đồng hồ đếm ngược 20s - 25s/trạm, chuông báo chuyển trạm và nhận diện hình ảnh giải phẫu chi tiết.
                </p>
              </div>

              <a
                href="/dynex"
                target="_blank"
                className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 transition active:scale-95 shadow-lg shadow-emerald-500/20 no-underline shrink-0"
              >
                <Activity size={17} />
                <span>Mở Toàn Bộ Hệ Thống DYNEX</span>
                <ChevronRight size={16} />
              </a>
            </div>
          </div>

          {/* Grid of OSCE Exam Stations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {osceStationExams.map(exam => (
              <div
                key={exam.id}
                className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-900/50">
                      {exam.category}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60">
                      {exam.badge}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {exam.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {exam.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Số trạm thi:</span>
                      <strong className="text-slate-800 dark:text-slate-100 font-extrabold text-sm">{exam.stationsCount} trạm</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Thời gian mỗi trạm:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{exam.timePerStation}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 font-medium">
                    Tác giả: <strong className="text-slate-700 dark:text-slate-300">{exam.author}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={exam.flashcardUrl}
                      target="_blank"
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition flex items-center gap-1.5 no-underline"
                      title="Ôn tập thẻ ghi nhớ trước khi thi"
                    >
                      <Layers size={13} />
                      <span>Ôn Flashcard</span>
                    </a>

                    <a
                      href={exam.examUrl}
                      target="_blank"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition active:scale-95 shadow-md shadow-emerald-600/30 flex items-center gap-1.5 no-underline"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Vào Thi Chạy Trạm</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 5. TAB CONTENT 3: TÀI LIỆU Y KHOA & GIÁO TRÌNH TÓM TẮT ─── */}
      {activeSubTab === 'docs' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-purple-900/70 via-indigo-900/60 to-slate-900 p-6 rounded-3xl border border-purple-500/30 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Tài Liệu Y Dược Độc Quyền
              </span>
              <h2 className="text-xl sm:text-2xl font-black mt-1.5">
                Kho Giáo Trình & Tài Liệu Thi Chạy Trạm
              </h2>
              <p className="text-xs sm:text-sm text-purple-100/80 mt-1 max-w-xl leading-relaxed">
                Tài liệu học tập, sách tóm tắt giải phẫu và bộ đề thi phân loại do giảng viên Lê Nhật Duy trực tiếp biên soạn cho các lớp học.
              </p>
            </div>

            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs font-bold text-center shrink-0">
              <span className="block text-purple-200 text-[10px]">Hỗ trợ sinh viên</span>
              <span className="text-white font-black text-sm">Zalo Thầy Nhật Duy</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {studyMaterialsList.map(doc => (
              <div
                key={doc.id}
                className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500/40 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-extrabold text-[10px]">
                      {doc.type}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                      {doc.badge}
                    </span>
                  </div>

                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-base group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    {doc.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    {doc.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>📄 {doc.pages}</span>
                    <span>💾 {doc.fileSize}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {doc.price}
                  </div>
                  <button
                    onClick={() => {
                      showToast(`Đã ghi nhận yêu cầu tài liệu "${doc.title}". Vui lòng liên hệ Zalo giáo viên để kích hoạt tài liệu VIP!`, 'info')
                    }}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/20"
                  >
                    <Download size={14} />
                    <span>Tải Tài Liệu / Mở Khóa VIP</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 6. TAB CONTENT 4: LỊCH SỬ LÀM BÀI ─── */}
      {activeSubTab === 'history' && (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <Clock size={18} className="text-purple-600 dark:text-purple-400" />
              <span>Nhật Ký & Kết Quả Nộp Bài ({studyData.history.length})</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              Lưu trữ 3 ngày gần nhất
            </span>
          </div>

          {studyData.history.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Clock size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Chưa có lịch sử làm bài</p>
              <p className="text-xs text-slate-400 mt-0.5">Chọn một bài thi bất kỳ ở mục Bài Thi Được Giao để bắt đầu rèn luyện!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[11px]">
                    <th className="py-3 px-3">Tên Bài Thi</th>
                    <th className="py-3 px-3">Thời Gian Nộp</th>
                    <th className="py-3 px-3">Điểm Số Đạt Được</th>
                    <th className="py-3 px-3 hidden sm:table-cell">Thời Gian Hoàn Thành</th>
                    <th className="py-3 px-3 text-right">Làm Lại</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {studyData.history.map((h, i) => {
                    const dateStr = new Date(h.createdAt).toLocaleString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })
                    const timeSpentMins = Math.floor((h.timeSpent || 0) / 60)
                    const timeSpentSecs = (h.timeSpent || 0) % 60

                    return (
                      <tr key={h.id || i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                            {h.quizTitle}
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {dateStr}
                        </td>
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-black px-2.5 py-1 rounded-xl text-xs ${
                              h.score >= 8
                                ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                                : h.score >= 5
                                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {h.score} / 10 ({h.correctCount}/{h.totalCount} câu)
                          </span>
                        </td>
                        <td className="py-3.5 px-3 hidden sm:table-cell text-slate-500 whitespace-nowrap">
                          {timeSpentMins > 0 ? `${timeSpentMins}m ${timeSpentSecs}s` : `${timeSpentSecs}s`}
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <a
                            href={`/?id=${h.quizId}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold text-xs transition"
                          >
                            <RotateCcw size={12} />
                            <span>Luyện lại</span>
                          </a>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── 7. SMART SHARE MODAL (CHIA SẺ BÀI THI & QR CODE) ─── */}
      {shareModalItem && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShareModalItem(null)}
        >
          <div
            className="bg-white dark:bg-[#1E293B] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 space-y-5 animate-scale-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Share2 size={20} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 text-base leading-tight">
                    Chia Sẻ Đề Thi
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Gửi link cho bạn cùng lớp để cùng thi</p>
                </div>
              </div>
              <button
                onClick={() => setShareModalItem(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tên bài thi</p>
              <p className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{shareModalItem.title}</p>
            </div>

            {/* QR Code */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-700 flex flex-col items-center justify-center">
              <div className="p-2 bg-white rounded-xl shadow-xs border border-slate-200">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareModalItem.url)}`}
                  alt="QR Code"
                  className="w-36 h-36 object-contain"
                />
              </div>
              <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2">
                Quét mã QR bằng điện thoại để mở bài thi tức thì
              </p>
            </div>

            {/* Link input */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Link trực tiếp
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareModalItem.url}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-700 dark:text-slate-200 outline-none select-all"
                />
                <button
                  onClick={handleCopyShareLink}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    hasCopiedLink
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20'
                  }`}
                >
                  {hasCopiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{hasCopiedLink ? 'Đã chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>

            {/* Share to social */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <a
                href={`https://zalo.me/share?url=${encodeURIComponent(shareModalItem.url)}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center justify-center gap-1.5 no-underline border border-blue-200"
              >
                <MessageCircle size={14} />
                <span>Chia sẻ qua Zalo</span>
              </a>
              <button
                onClick={() => setShareModalItem(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
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
