'use client'

import React, { useState, useMemo } from 'react'
import { 
  BookOpen, 
  Brain, 
  Flame, 
  Lock, 
  Unlock, 
  Search, 
  Filter, 
  CheckCircle2, 
  Key, 
  Users, 
  Sparkles, 
  GraduationCap, 
  ArrowRight,
  ChevronRight,
  ChevronDown,
  FolderOpen,
  Folder,
  Eye,
  AlertCircle,
  PlusCircle,
  Share2,
  Layers,
  FileText,
  Edit3,
  Trash2,
  FolderTree,
  LayoutGrid,
  RefreshCw
} from 'lucide-react'
import { Project, Lesson, storageService } from '../services/storageService'
import { authService, DynexUser } from '../services/authService'
import { soundService } from '../services/soundService'

interface StudentPortalProps {
  projects: Project[]
  currentUser: DynexUser | null
  onSelectLessonForFlashcard: (lessonId: string, projectId: string) => void
  onSelectLessonForExam: (lessonId: string) => void
  onOpenLogin: () => void
  onOpenClassroomManager?: () => void
  onOpenCreateModal?: () => void
  onOpenShare?: (lesson: Lesson) => void
  onOpenDeckSelector?: () => void
  onOpenCreateExamModal?: () => void
  onOpenExamManagement?: () => void
  onOpenExplorer?: () => void
  onEditLesson?: (lessonId: string, projectId: string) => void
  onDeleteLesson?: (lessonId: string, projectId: string) => void
}

export default function StudentPortal({
  projects,
  currentUser,
  onSelectLessonForFlashcard,
  onSelectLessonForExam,
  onOpenLogin,
  onOpenClassroomManager,
  onOpenCreateModal,
  onOpenShare,
  onOpenDeckSelector,
  onOpenCreateExamModal,
  onOpenExamManagement,
  onOpenExplorer,
  onEditLesson,
  onDeleteLesson
}: StudentPortalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'locked'>('all')
  const [portalViewMode, setPortalViewMode] = useState<'grid' | 'tree'>('grid')
  const [openCategoriesTree, setOpenCategoriesTree] = useState<Record<string, boolean>>({
    cat_tieu_hoa: true,
    cat_tuan_hoan: true,
    cat_than_kinh: true
  })
  const [openSubFoldersTree, setOpenSubFoldersTree] = useState<Record<string, boolean>>({
    sub_gan_mat: true,
    sub_tim_mach_lon: true,
    sub_nao_bo: true
  })

  const toggleCategoryTree = (catId: string) => {
    setOpenCategoriesTree(prev => ({
      ...prev,
      [catId]: prev[catId] === false ? true : !prev[catId]
    }))
    soundService.playTick()
  }

  const toggleSubFolderTree = (subId: string) => {
    setOpenSubFoldersTree(prev => ({
      ...prev,
      [subId]: prev[subId] === false ? true : !prev[subId]
    }))
    soundService.playTick()
  }

  // PIN Unlock Modal State
  const [unlockModalLesson, setUnlockModalLesson] = useState<any | null>(null)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinSuccess, setPinSuccess] = useState('')

  // Flatten all lessons with category & project context
  const allLessonsWithMeta = useMemo(() => {
    const list: Array<{
      lesson: Lesson
      project: Project
      categoryName: string
      categoryId: string
      subFolderName: string
      accessCheck: ReturnType<typeof authService.checkAccess>
      masksCount: number
      imagesCount: number
      firstImageUrl?: string
    }> = []

    projects.forEach(project => {
      project.categories?.forEach(category => {
        category.subFolders?.forEach(subFolder => {
          subFolder.lessons?.forEach(lesson => {
            const accessCheck = authService.checkAccess(lesson, currentUser)
            const masksCount = lesson.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0
            const firstImageUrl = lesson.images?.[0]?.url

            list.push({
              lesson,
              project,
              categoryName: category.name,
              categoryId: category.id,
              subFolderName: subFolder.name,
              accessCheck,
              masksCount,
              imagesCount: lesson.images?.length || 0,
              firstImageUrl
            })
          })
        })
      })
    })

    return list
  }, [projects, currentUser])

  // Get unique categories for filter pills
  const categoriesList = useMemo(() => {
    const map = new Map<string, string>()
    projects.forEach(p => {
      p.categories?.forEach(c => {
        if (!map.has(c.id)) {
          map.set(c.id, c.name)
        }
      })
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [projects])

  // Filtered lessons
  const filteredLessons = useMemo(() => {
    return allLessonsWithMeta.filter(item => {
      // Category filter
      if (selectedCategory !== 'all' && item.categoryId !== selectedCategory) {
        return false
      }

      // Access mode filter
      if (filterMode === 'unlocked' && !item.accessCheck.allowed) {
        return false
      }
      if (filterMode === 'locked' && item.accessCheck.allowed) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim()
        const matchTitle = item.lesson.title.toLowerCase().includes(query)
        const matchDesc = (item.lesson.description || '').toLowerCase().includes(query)
        const matchCat = item.categoryName.toLowerCase().includes(query)
        const matchSub = item.subFolderName.toLowerCase().includes(query)
        if (!matchTitle && !matchDesc && !matchCat && !matchSub) {
          return false
        }
      }

      return true
    })
  }, [allLessonsWithMeta, selectedCategory, filterMode, searchQuery])

  // Stats calculation
  const totalCount = allLessonsWithMeta.length
  const unlockedCount = allLessonsWithMeta.filter(item => item.accessCheck.allowed).length

  // Quick PIN submit
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!unlockModalLesson) return

    const success = authService.unlockWithPin(
      unlockModalLesson.id,
      pinInput,
      unlockModalLesson.accessPassword
    )

    if (success) {
      soundService.playSuccess()
      setPinSuccess('Mở khóa thành công! Bạn có thể học ngay.')
      setPinError('')
      setTimeout(() => {
        setUnlockModalLesson(null)
        setPinInput('')
        setPinSuccess('')
      }, 1000)
    } else {
      soundService.playWarning()
      setPinError('Mã PIN không chính xác! Hãy kiểm tra lại mã PIN lớp học của bạn.')
    }
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-16">
      
      {/* ─── 1. HERO LEARNING BANNER ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F172A] via-[#111827] to-[#070b14] border border-slate-800 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center gap-1.5 shadow-xs">
                <GraduationCap className="w-3.5 h-3.5" />
                CỔNG HỌC VIÊN Y KHOA DYNEX
              </span>
              {currentUser?.isLoggedIn ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Đang đăng nhập: {currentUser.email}
                </span>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 border border-amber-500/40 text-amber-400 hover:bg-amber-500/20 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Users className="w-3 h-3" />
                  Đăng nhập để nhận quyền lớp học
                </button>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              Ôn Luyện Giải Phẫu & Chạy Trạm Y Khoa AI
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Phương pháp học thuộc ngắt quãng Spaced Repetition (Anki SM-2) kết hợp che ảnh giải phẫu 100% không lộ chữ và mô phỏng 20 trạm chạy trạm OSCE 20 giây chuẩn thi y khoa.
            </p>

            {/* Quick Action Buttons on Hero */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {onOpenCreateModal && (
                <button
                  onClick={onOpenCreateModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-200" />
                  <span>+ Tạo Bài Học / Chương Mới</span>
                </button>
              )}

              {onOpenCreateExamModal && (
                <button
                  onClick={onOpenCreateExamModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-white" />
                  <span>+ Tạo Đề Thi Chạy Trạm (OSCE)</span>
                </button>
              )}

              {onOpenExamManagement && (
                <button
                  onClick={onOpenExamManagement}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Kho Đề Thi Đã Tạo</span>
                </button>
              )}

              {onOpenDeckSelector && (
                <button
                  onClick={onOpenDeckSelector}
                  className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/50 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  <Layers className="w-4 h-4 text-cyan-300" />
                  <span>📚 Ôn Đa Chương / Đa Bài (Tổng Hợp)</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 sm:gap-4 bg-[#070b14]/80 p-3 sm:p-4 rounded-2xl border border-slate-800 shadow-xl shrink-0 w-full sm:w-auto justify-around">
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Mô-đun Khả Dụng</span>
              <span className="text-2xl sm:text-3xl font-black text-indigo-400 font-mono">{totalCount}</span>
            </div>
            <div className="h-8 w-[1px] bg-slate-800" />
            <div className="text-center px-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Đã Mở Khóa</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">{unlockedCount}</span>
            </div>
            {onOpenClassroomManager && (currentUser?.role === 'ADMIN' || currentUser?.email === 'lenhatduy.vietnam@gmail.com') && (
              <>
                <div className="h-8 w-[1px] bg-slate-800" />
                <button
                  onClick={onOpenClassroomManager}
                  className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Quản lý Lớp & Phân quyền Gmail"
                >
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Quản Lý Lớp</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. SEARCH & FILTER CONTROLS ─── */}
      <div className="bg-[#111827] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm bài học giải phẫu, cơ quan (vd: Gan mật, Tụy, Dạ dày, Tim...)"
              className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700/80 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher: Grid vs Tree */}
            <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => {
                  setPortalViewMode('grid');
                  soundService.playTick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  portalViewMode === 'grid'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Xem dạng lưới thẻ bài học"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lưới Thẻ</span>
              </button>
              <button
                onClick={() => {
                  setPortalViewMode('tree');
                  soundService.playTick();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  portalViewMode === 'tree'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Xem dạng cây thư mục"
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>Cây Thư Mục</span>
              </button>
            </div>

            {/* Access Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#070b14] p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Tất cả ({totalCount})
              </button>
              <button
                onClick={() => setFilterMode('unlocked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'unlocked'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Đã mở khóa ({unlockedCount})
              </button>
              <button
                onClick={() => setFilterMode('locked')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filterMode === 'locked'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Khóa ({totalCount - unlockedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
            }`}
          >
            Tất cả hệ cơ quan
          </button>
          {categoriesList.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                  : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-slate-700/50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. LESSON MODULES GRID ─── */}
      {filteredLessons.length === 0 ? (
        <div className="p-12 text-center bg-[#111827] border border-slate-800 rounded-3xl space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto text-cyan-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">Chưa có bài học hoặc chương nào</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Mọi chương mẫu cũ đã được dọn sạch theo yêu cầu. Hãy vào <strong>Quản Lý Thư Mục (This PC)</strong> để tạo Môn, Chương, Chủ Đề và Bài Học mới theo chuẩn của bạn, hoặc bấm nút dưới đây để nạp lại cây thư mục mẫu!
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            {onOpenExplorer && (
              <button
                onClick={onOpenExplorer}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Mở Trình Quản Lý Thư Mục (This PC)</span>
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('Khôi phục cây thư mục giải phẫu mẫu (Hệ Tiêu Hóa, Tim Mạch, Thần Kinh)?')) {
                  storageService.resetDefaultCurriculum();
                  window.location.reload();
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Nạp Cây Thư Mục Mẫu</span>
            </button>
          </div>
        </div>
      ) : portalViewMode === 'tree' ? (
        /* ─── 3B. CÂY THƯ MỤC Y KHOA HIERARCHICAL TREE VIEW ─── */
        <div className="space-y-4">
          {projects.map(proj => {
            const projCategories = proj.categories || []
            if (projCategories.length === 0) return null

            return (
              <div key={proj.id} className="rounded-3xl bg-[#111827] border border-slate-800 overflow-hidden shadow-xl">
                {/* Project / Subject Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                      <FolderTree className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                        <span>{proj.name}</span>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-bold">
                          {projCategories.length} Chương
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400">{proj.description}</p>
                    </div>
                  </div>
                </div>

                {/* Categories (Chương) List */}
                <div className="p-3 sm:p-4 space-y-3">
                  {projCategories.map(cat => {
                    const isCatOpen = openCategoriesTree[cat.id] !== false
                    const totalLessons = cat.subFolders?.reduce((acc, sub) => acc + (sub.lessons?.length || 0), 0) || 0

                    return (
                      <div key={cat.id} className="rounded-2xl bg-[#070b14]/70 border border-slate-800/80 overflow-hidden">
                        {/* Category Header */}
                        <div
                          onClick={() => toggleCategoryTree(cat.id)}
                          className="p-3 sm:p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition-colors select-none"
                        >
                          <div className="flex items-center gap-2.5">
                            {isCatOpen ? (
                              <ChevronDown className="w-4 h-4 text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                            )}
                            <Folder className={`w-4 h-4 shrink-0 ${isCatOpen ? 'text-amber-400' : 'text-slate-400'}`} />
                            <span className="text-sm font-black text-white">{cat.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                              {cat.subFolders?.length || 0} chủ đề • {totalLessons} bài học
                            </span>
                          </div>
                        </div>

                        {/* SubFolders (Chủ đề) List */}
                        {isCatOpen && (
                          <div className="pl-4 sm:pl-6 pr-3 pb-3 space-y-2.5 border-t border-slate-800/60 bg-black/20">
                            {cat.subFolders?.length === 0 ? (
                              <p className="text-xs text-slate-500 italic py-2">Chưa có chủ đề nào trong chương này.</p>
                            ) : (
                              cat.subFolders.map(sub => {
                                const isSubOpen = openSubFoldersTree[sub.id] !== false
                                const lessonsList = sub.lessons || []

                                return (
                                  <div key={sub.id} className="rounded-xl border border-slate-800/70 bg-[#111827]/80 overflow-hidden">
                                    {/* SubFolder Row */}
                                    <div
                                      onClick={() => toggleSubFolderTree(sub.id)}
                                      className="p-2.5 sm:p-3 flex items-center justify-between cursor-pointer hover:bg-slate-800/60 transition-colors select-none"
                                    >
                                      <div className="flex items-center gap-2">
                                        {isSubOpen ? (
                                          <ChevronDown className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        ) : (
                                          <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                        )}
                                        <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        <span className="text-xs sm:text-sm font-bold text-cyan-200">{sub.name}</span>
                                        <span className="text-[10px] text-slate-400">({lessonsList.length} bài)</span>
                                      </div>
                                    </div>

                                    {/* Lessons List in SubFolder */}
                                    {isSubOpen && (
                                      <div className="p-2 sm:p-2.5 pt-0 space-y-2">
                                        {lessonsList.length === 0 ? (
                                          <p className="text-[11px] text-slate-500 italic pl-6 py-1">Chưa có bài học nào trong chủ đề này.</p>
                                        ) : (
                                          lessonsList.map(les => {
                                            const totalImgs = les.images?.length || 0
                                            const totalMsk = les.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0
                                            const accessCheck = authService.checkAccess(les, currentUser)
                                            const isAccessible = accessCheck.allowed

                                            return (
                                              <div
                                                key={les.id}
                                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-[#070b14] border border-slate-800/80 hover:border-indigo-500/40 transition-colors"
                                              >
                                                <div className="flex items-center gap-3 min-w-0">
                                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 shrink-0 flex items-center justify-center">
                                                    {les.images?.[0]?.url ? (
                                                      <img src={les.images[0].url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                      <BookOpen className="w-4 h-4 text-slate-500" />
                                                    )}
                                                  </div>
                                                  <div className="truncate">
                                                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{les.title}</h4>
                                                    <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                                      <span>{totalImgs} sơ đồ giải phẫu</span>
                                                      <span>•</span>
                                                      <span className="text-amber-400 font-bold">{totalMsk} trạm</span>
                                                      {!isAccessible && (
                                                        <span className="text-amber-400 font-bold flex items-center gap-0.5">
                                                          <Lock className="w-2.5 h-2.5" /> Khóa
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1.5 shrink-0">
                                                  {isAccessible ? (
                                                    <>
                                                      <button
                                                        onClick={() => onSelectLessonForFlashcard(les.id, proj.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                                      >
                                                        <Brain className="w-3.5 h-3.5 text-cyan-200" />
                                                        <span>Học Não Bộ</span>
                                                      </button>

                                                      <button
                                                        onClick={() => onSelectLessonForExam(les.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                                                      >
                                                        <Flame className="w-3.5 h-3.5 text-rose-400" />
                                                        <span>Thi Chạy Trạm</span>
                                                      </button>

                                                      {onEditLesson && (
                                                        <button
                                                          onClick={() => onEditLesson(les.id, proj.id)}
                                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-900/60 text-slate-300 hover:text-cyan-300 border border-slate-700/60 transition-colors cursor-pointer"
                                                          title="Sửa bài học trong Studio"
                                                        >
                                                          <Edit3 className="w-3.5 h-3.5" />
                                                        </button>
                                                      )}

                                                      {onOpenShare && (
                                                        <button
                                                          onClick={() => onOpenShare(les)}
                                                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors cursor-pointer"
                                                          title="Chia sẻ link"
                                                        >
                                                          <Share2 className="w-3.5 h-3.5" />
                                                        </button>
                                                      )}
                                                    </>
                                                  ) : (
                                                    <button
                                                      onClick={() => {
                                                        setUnlockModalLesson(les)
                                                        setPinInput('')
                                                        setPinError('')
                                                        setPinSuccess('')
                                                      }}
                                                      className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                                                    >
                                                      <Key className="w-3.5 h-3.5" />
                                                      <span>Mở Khóa Bằng PIN</span>
                                                    </button>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map(({ lesson, project, categoryName, subFolderName, accessCheck, masksCount, imagesCount, firstImageUrl }) => {
            const isAccessible = accessCheck.allowed

            return (
              <div
                key={lesson.id}
                className={`group relative flex flex-col justify-between rounded-3xl bg-[#111827] border transition-all duration-200 overflow-hidden shadow-xl ${
                  isAccessible
                    ? 'border-slate-800 hover:border-indigo-500/60 hover:shadow-indigo-500/10'
                    : 'border-slate-800/80 opacity-90'
                }`}
              >
                {/* Top Media Preview & Badges */}
                <div>
                  <div className="relative aspect-video w-full bg-[#070b14] overflow-hidden border-b border-slate-800/80">
                    {firstImageUrl ? (
                      <img
                        src={firstImageUrl}
                        alt={lesson.title}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 pointer-events-none"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-700">
                        <BookOpen className="w-12 h-12" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/40" />

                    {/* Top Access Badge & Action Buttons */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/70 backdrop-blur-md text-slate-300 border border-white/10">
                        {categoryName.split('(')[0]}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {isAccessible ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-950/90 backdrop-blur-md text-emerald-300 border border-emerald-500/50 flex items-center gap-1 shadow-md">
                            <Unlock className="w-3 h-3 text-emerald-400" />
                            {accessCheck.reason === 'classroom'
                              ? accessCheck.classroomName || 'Được cấp quyền'
                              : accessCheck.reason === 'admin'
                              ? 'Admin'
                              : 'Miễn phí'}
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-950/90 backdrop-blur-md text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-md">
                            <Lock className="w-3 h-3 text-rose-400" />
                            Mã PIN / Giới hạn
                          </span>
                        )}

                        {/* Direct Edit & Delete Buttons on Top Image Bar */}
                        {(isAccessible || currentUser?.role === 'ADMIN' || currentUser?.email === 'lenhatduy.vietnam@gmail.com') && (
                          <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/10">
                            {onEditLesson && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditLesson(lesson.id, project.id);
                                }}
                                className="p-1 rounded-full hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-colors cursor-pointer"
                                title="Chỉnh sửa sơ đồ & ô che trong Studio"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}

                            {onDeleteLesson && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Bạn có chắc muốn xóa bài học "${lesson.title}" không? Hành động này không thể hoàn tác.`)) {
                                    onDeleteLesson(lesson.id, project.id);
                                  }
                                }}
                                className="p-1 rounded-full hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 transition-colors cursor-pointer"
                                title="Xóa bài học này"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Stats Badge on image */}
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-[11px] font-mono font-bold text-cyan-300 border border-cyan-800/50">
                        {imagesCount} Sơ đồ
                      </span>
                      <span className="px-2 py-0.5 rounded-lg bg-black/80 backdrop-blur-sm text-[11px] font-mono font-bold text-amber-300 border border-amber-800/50">
                        {masksCount} Vị trí Flashcard
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                      {subFolderName}
                    </div>
                    <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {lesson.description || 'Hệ thống câu hỏi giải phẫu chi tiết kèm thuật toán lặp lại ngắt quãng Anki SM-2 và thi chạy trạm OSCE.'}
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-5 pt-0 border-t border-slate-800/60 mt-3">
                  <div className="pt-3.5 flex flex-col gap-2">
                    {isAccessible ? (
                      <>
                        <button
                          onClick={() => onSelectLessonForFlashcard(lesson.id, project.id)}
                          className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                        >
                          <Brain className="w-4 h-4 text-cyan-200" />
                          <span>Học Não Bộ (Anki Flashcard)</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                        </button>

                        <button
                          onClick={() => onSelectLessonForExam(lesson.id)}
                          className="w-full py-2 px-4 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-300 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/40 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Flame className="w-3.5 h-3.5 text-rose-400" />
                          <span>Thi Chạy Trạm (OSCE 20 Giây)</span>
                        </button>

                        {/* Management Actions: Edit in Studio, Share Link/QR, Delete */}
                        <div className="flex items-center gap-1.5 pt-1">
                          {onEditLesson && (
                            <button
                              onClick={() => onEditLesson(lesson.id, project.id)}
                              className="flex-1 py-2 px-2.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 hover:text-white border border-cyan-500/50 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              title="Mở Studio để thêm sơ đồ, sửa ô che"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                              <span>Sửa Sơ Đồ & Ô Che</span>
                            </button>
                          )}

                          {onOpenShare && (
                            <button
                              onClick={() => onOpenShare(lesson)}
                              className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-indigo-950/60 text-slate-300 hover:text-indigo-300 border border-slate-800 hover:border-indigo-500/40 font-semibold text-xs flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              title="Tạo link chia sẻ hoặc mã QR cho học viên"
                            >
                              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                              <span className="hidden sm:inline">Chia Sẻ</span>
                            </button>
                          )}

                          {onDeleteLesson && (
                            <button
                              onClick={() => {
                                if (confirm(`Bạn có chắc chắn muốn xóa bài học "${lesson.title}" không?`)) {
                                  onDeleteLesson(lesson.id, project.id);
                                }
                              }}
                              className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 hover:text-rose-200 border border-rose-800/40 transition-colors cursor-pointer"
                              title="Xóa bài học này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <button
                          onClick={() => {
                            setUnlockModalLesson(lesson)
                            setPinInput('')
                            setPinError('')
                            setPinSuccess('')
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                        >
                          <Key className="w-4 h-4" />
                          <span>Nhập Mã PIN Lớp Học Để Mở Khóa</span>
                        </button>

                        <button
                          onClick={onOpenLogin}
                          className="w-full py-1.5 text-center text-[11px] font-bold text-slate-400 hover:text-indigo-400 cursor-pointer"
                        >
                          Hoặc Đăng nhập bằng Gmail được cấp quyền
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── 4. QUICK PIN UNLOCK MODAL ─── */}
      {unlockModalLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-[#111827] border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Key className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Mở Khóa Mô-đun Y Khoa</h3>
              </div>
              <button
                onClick={() => setUnlockModalLesson(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-[#070b14] rounded-2xl border border-slate-800 text-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Bài học đang chọn:</span>
              <p className="font-bold text-white mt-0.5">{unlockModalLesson.title}</p>
            </div>

            <p className="text-xs text-slate-300">
              Nhập mã PIN lớp học của bạn do Giảng viên hoặc Quản trị viên cấp để mở quyền học tập bài này:
            </p>

            <form onSubmit={handlePinSubmit} className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={pinInput}
                  onChange={e => {
                    setPinInput(e.target.value)
                    setPinError('')
                  }}
                  autoFocus
                  placeholder="Nhập mã PIN (vd: Y47MED)..."
                  className="w-full px-4 py-3 bg-[#070b14] border border-amber-500/40 rounded-xl text-sm font-mono font-black text-amber-300 uppercase tracking-widest focus:outline-none focus:border-amber-400"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockModalLesson(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={!pinInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer"
                >
                  Xác Nhận Mã PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
