'use client'

import React, { useState } from 'react'
import { 
  FolderPlus, 
  Plus, 
  Trash2, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen, 
  Layers, 
  BookOpen, 
  Image as ImageIcon,
  Search,
  Database,
  Sparkles,
  FileCheck,
  Edit3,
  Settings,
  Eye,
  Share2,
  GraduationCap,
  ShieldCheck,
  Check,
  X
} from 'lucide-react'
import { soundService } from '../services/soundService'

interface AdminTreeNavProps {
  projects: any[]
  selectedProjectId: string
  selectedLessonId: string
  onSelectProject: (id: string) => void
  onSelectLesson: (id: string) => void
  onAddProject: (data: { name: string; description: string }) => void
  onDeleteProject: (id: string) => void
  onRenameProject?: (projId: string, name: string) => void
  onAddCategory: (projectId: string, name: string) => void
  onDeleteCategory: (catId: string) => void
  onRenameCategory?: (catId: string, name: string) => void
  onAddSubFolder: (catId: string, name: string) => void
  onDeleteSubFolder: (catId: string, subId: string) => void
  onRenameSubFolder?: (catId: string, subId: string, name: string) => void
  onAddLesson: (subFolderId: string, title: string) => void
  onDeleteLesson: (catId: string, subId: string, lessonId: string) => void
  onRenameLesson?: (catId: string, subId: string, lessonId: string, title: string) => void
  onOpenShare?: (lesson: any) => void
  onPreviewLesson?: (lessonId: string) => void
}

export default function AdminTreeNav({
  projects,
  selectedProjectId,
  selectedLessonId,
  onSelectProject,
  onSelectLesson,
  onAddProject,
  onDeleteProject,
  onRenameProject,
  onAddCategory,
  onDeleteCategory,
  onRenameCategory,
  onAddSubFolder,
  onDeleteSubFolder,
  onRenameSubFolder,
  onAddLesson,
  onDeleteLesson,
  onRenameLesson,
  onOpenShare,
  onPreviewLesson
}: AdminTreeNavProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ cat_tieu_hoa: true, cat_tuan_hoan: true })
  const [openSubFolders, setOpenSubFolders] = useState<Record<string, boolean>>({ sub_gan_mat: true, sub_tim_mach: true })
  const [searchTerm, setSearchTerm] = useState('')

  // Modals for Create
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  const [activePromptModal, setActivePromptModal] = useState<{
    type: 'category' | 'subFolder' | 'lesson'
    parentId: string
    title: string
    placeholder: string
  } | null>(null)
  const [promptInputText, setPromptInputText] = useState('')

  // Modal for Rename / Edit
  const [activeRenameModal, setActiveRenameModal] = useState<{
    type: 'project' | 'category' | 'subFolder' | 'lesson'
    id: string
    parentId?: string
    grandParentId?: string
    currentName: string
  } | null>(null)
  const [renameInputText, setRenameInputText] = useState('')

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0]

  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
    soundService.playTick()
  }

  const toggleSubFolder = (subId: string) => {
    setOpenSubFolders(prev => ({ ...prev, [subId]: !prev[subId] }))
    soundService.playTick()
  }

  // Create Project Submit
  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    onAddProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Môn học giải phẫu Y khoa chuyên sâu'
    })
    setNewProjectName('')
    setNewProjectDesc('')
    setShowNewProjectModal(false)
    soundService.playSuccess()
  }

  // Open Create Prompt
  const handleOpenPrompt = (
    type: 'category' | 'subFolder' | 'lesson',
    parentId: string,
    title: string,
    placeholder: string
  ) => {
    setActivePromptModal({ type, parentId, title, placeholder })
    setPromptInputText('')
  }

  // Create Prompt Submit
  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!promptInputText.trim() || !activePromptModal) return
    const { type, parentId } = activePromptModal

    if (type === 'category') {
      onAddCategory(parentId, promptInputText.trim())
    } else if (type === 'subFolder') {
      onAddSubFolder(parentId, promptInputText.trim())
      setOpenCategories(prev => ({ ...prev, [parentId]: true }))
    } else if (type === 'lesson') {
      onAddLesson(parentId, promptInputText.trim())
      setOpenSubFolders(prev => ({ ...prev, [parentId]: true }))
    }

    setActivePromptModal(null)
    setPromptInputText('')
    soundService.playSuccess()
  }

  // Open Rename Prompt
  const handleOpenRename = (
    type: 'project' | 'category' | 'subFolder' | 'lesson',
    id: string,
    currentName: string,
    parentId?: string,
    grandParentId?: string
  ) => {
    setActiveRenameModal({ type, id, currentName, parentId, grandParentId })
    setRenameInputText(currentName)
  }

  // Rename Submit
  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!renameInputText.trim() || !activeRenameModal) return
    const { type, id, parentId, grandParentId } = activeRenameModal
    const cleanName = renameInputText.trim()

    if (type === 'project' && onRenameProject) {
      onRenameProject(id, cleanName)
    } else if (type === 'category' && onRenameCategory) {
      onRenameCategory(id, cleanName)
    } else if (type === 'subFolder' && onRenameSubFolder && parentId) {
      onRenameSubFolder(parentId, id, cleanName)
    } else if (type === 'lesson' && onRenameLesson && parentId && grandParentId) {
      onRenameLesson(grandParentId, parentId, id, cleanName)
    }

    setActiveRenameModal(null)
    setRenameInputText('')
    soundService.playTick()
  }

  return (
    <aside className="w-full lg:w-84 bg-[#111827] border border-slate-800/80 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl shrink-0">
      
      {/* ─── 1. MÔN HỌC (SUBJECT / COURSE) ─── */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0B0F19]/90 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            1. Môn Học Y Khoa
          </label>
          <div className="flex items-center gap-2">
            {onRenameProject && currentProject && (
              <button
                onClick={() => handleOpenRename('project', currentProject.id, currentProject.name)}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-0.5 cursor-pointer"
                title="Đổi tên môn học này"
              >
                <Edit3 className="w-3 h-3" />
                <span>Sửa</span>
              </button>
            )}
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-[11px] font-extrabold text-indigo-300 hover:text-white border border-indigo-500/40 transition-colors cursor-pointer"
              title="Tạo thêm môn học mới"
            >
              <Plus className="w-3 h-3" />
              <span>+ Môn Học</span>
            </button>
          </div>
        </div>

        {/* Subject Selector Dropdown */}
        <select
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full px-3 py-2 bg-[#1F2937] border border-slate-700/80 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 shadow-sm"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm chương, chủ đề, bài..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#1F2937]/70 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* ─── 2. CHƯƠNG & CHỦ ĐỀ & BÀI HỌC TREE ─── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            2. Chương Trong Môn ({currentProject?.categories?.length || 0})
          </span>
          <button
            onClick={() => handleOpenPrompt('category', currentProject?.id, 'Thêm Chương Trong Môn', 'vd: Chương 1: Giải Phẫu Chi Trên, Chương 2: Lồng Ngực...')}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thêm chương mới"
          >
            <Plus className="w-3 h-3" />
            <span>+ Thêm Chương</span>
          </button>
        </div>

        {/* Categories (Chương trong môn) */}
        {currentProject?.categories?.map((cat: any) => {
          const isOpen = !!openCategories[cat.id]
          const isCatMatch = searchTerm ? cat.name.toLowerCase().includes(searchTerm.toLowerCase()) : true

          return (
            <div key={cat.id} className="rounded-2xl bg-[#1F2937]/40 border border-slate-800/80 overflow-hidden">
              
              {/* Category (Chương) Row */}
              <div
                onClick={() => toggleCategory(cat.id)}
                className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-slate-800/60 transition-colors group"
              >
                <div className="flex items-center gap-2 truncate">
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  )}
                  {isOpen ? (
                    <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
                  ) : (
                    <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="text-xs font-black text-slate-200 truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* + Thêm Chủ Đề */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPrompt('subFolder', cat.id, `Thêm Chủ Đề vào "${cat.name}"`, 'vd: Chủ đề: Hệ Gan Mật, Hệ Tiêu Hóa...')
                    }}
                    title="Thêm chủ đề con"
                    className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  {/* Sửa Tên Chương */}
                  {onRenameCategory && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenRename('category', cat.id, cat.name)
                      }}
                      title="Sửa tên chương này"
                      className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-700 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Xóa Chương */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Xóa chương "${cat.name}" và toàn bộ bài học bên trong?`)) {
                        onDeleteCategory(cat.id)
                      }
                    }}
                    title="Xóa chương"
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* ─── 3. CHỦ ĐỀ (SUBFOLDER / TOPIC) ─── */}
              {isOpen && (
                <div className="pl-3 pr-2 pb-2 space-y-1.5 border-t border-slate-800/60 bg-[#0B0F19]/50">
                  {cat.subFolders?.length === 0 && (
                    <div className="p-2 text-center">
                      <p className="text-[11px] text-slate-500 italic mb-1.5">
                        Chưa có chủ đề nào trong chương này.
                      </p>
                      <button
                        onClick={() => handleOpenPrompt('subFolder', cat.id, `Thêm Chủ Đề vào "${cat.name}"`, 'vd: Chủ đề: Hệ Gan Mật, Hệ Xương...')}
                        className="text-[11px] font-bold text-indigo-400 hover:underline"
                      >
                        + Tạo Chủ Đề Đầu Tiên
                      </button>
                    </div>
                  )}

                  {cat.subFolders?.map((sub: any) => {
                    const isSubOpen = !!openSubFolders[sub.id]

                    return (
                      <div key={sub.id} className="rounded-xl border border-slate-800/60 bg-[#111827]/70 overflow-hidden">
                        
                        {/* Subfolder (Chủ đề) Row */}
                        <div
                          onClick={() => toggleSubFolder(sub.id)}
                          className="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-slate-800/50 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isSubOpen ? (
                              <ChevronDown className="w-3 h-3 text-cyan-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                            )}
                            <span className="text-[11px] font-extrabold text-cyan-200 truncate">
                              {sub.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* + Thêm Bài Học */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenPrompt('lesson', sub.id, `Thêm Bài Học vào "${sub.name}"`, 'vd: Bài 1: Giải phẫu mặt trước gan...')
                              }}
                              title="Thêm bài học vào chủ đề này"
                              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>

                            {/* Sửa Tên Chủ Đề */}
                            {onRenameSubFolder && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleOpenRename('subFolder', sub.id, sub.name, cat.id)
                                }}
                                title="Sửa tên chủ đề"
                                className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-700 cursor-pointer"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Xóa Chủ Đề */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Xóa chủ đề "${sub.name}"?`)) {
                                  onDeleteSubFolder(cat.id, sub.id)
                                }
                              }}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* ─── 4. BÀI HỌC THỰC HÀNH (LESSON) ─── */}
                        {isSubOpen && (
                          <div className="pl-3 pr-1 pb-1 space-y-1">
                            {sub.lessons?.length === 0 && (
                              <p className="text-[10px] text-slate-500 italic py-1 pl-2">
                                Chưa có bài học nào.
                              </p>
                            )}

                            {sub.lessons?.map((les: any) => {
                              const isSelected = selectedLessonId === les.id
                              const totalImages = les.images?.length || 0
                              const totalMasks = les.images?.reduce((sum: number, img: any) => sum + (img.masks?.length || 0), 0) || 0

                              return (
                                <div
                                  key={les.id}
                                  onClick={() => {
                                    onSelectLesson(les.id)
                                    soundService.playTick()
                                  }}
                                  className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all duration-150 group ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                                    <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                    <div className="truncate">
                                      <div className="truncate text-xs font-semibold">{les.title}</div>
                                      <div className={`text-[10px] font-normal flex items-center gap-1.5 mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        <span className="font-mono">{totalImages} sơ đồ</span>
                                        <span>•</span>
                                        <span className="font-mono font-bold text-amber-300">{totalMasks} trạm</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Lesson Quick Actions */}
                                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    {/* Preview / Vào Xem Thử */}
                                    {onPreviewLesson && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onPreviewLesson(les.id)
                                        }}
                                        title="Vào xem / Học thử ngay"
                                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" />
                                      </button>
                                    )}

                                    {/* Setup Quyền & PIN */}
                                    {onOpenShare && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onOpenShare(les)
                                        }}
                                        title="Cài đặt mã PIN / Phân quyền lớp học"
                                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 cursor-pointer"
                                      >
                                        <Settings className="w-3 h-3" />
                                      </button>
                                    )}

                                    {/* Đổi Tên Bài */}
                                    {onRenameLesson && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleOpenRename('lesson', les.id, les.title, sub.id, cat.id)
                                        }}
                                        title="Đổi tên bài học"
                                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 cursor-pointer"
                                      >
                                        <Edit3 className="w-3 h-3" />
                                      </button>
                                    )}

                                    {/* Xóa Bài */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (confirm(`Xóa bài học "${les.title}"?`)) {
                                          onDeleteLesson(cat.id, sub.id, les.id)
                                        }
                                      }}
                                      title="Xóa bài học"
                                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700/60 cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
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

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0B0F19] text-[11px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Admin: <strong className="text-white">lenhatduy.vietnam@gmail.com</strong></span>
        </div>
        <span className="font-mono text-xs text-indigo-400 font-bold">DYNEX STUDIO</span>
      </div>

      {/* ─── MODAL TẠO MÔN HỌC MỚI ─── */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#111827] border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-indigo-400" />
                <span>Tạo Môn Học Mới</span>
              </h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Môn Học: *</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="vd: Giải Phẫu Học 1, Giải Phẫu Định Khu..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mô tả môn học:</label>
                <input
                  type="text"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Mô tả nội dung môn học..."
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newProjectName.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  Tạo Môn Học
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL TẠO CHƯƠNG / CHỦ ĐỀ / BÀI HỌC ─── */}
      {activePromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#111827] border border-indigo-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>{activePromptModal.title}</span>
              </h3>
              <button onClick={() => setActivePromptModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handlePromptSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên đề mục: *</label>
                <input
                  type="text"
                  value={promptInputText}
                  onChange={(e) => setPromptInputText(e.target.value)}
                  placeholder={activePromptModal.placeholder}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePromptModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!promptInputText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  Xác Nhận Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL ĐỔI TÊN / CHỈNH SỬA ─── */}
      {activeRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#111827] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>
                  Đổi Tên {activeRenameModal.type === 'project' ? 'Môn Học' : activeRenameModal.type === 'category' ? 'Chương' : activeRenameModal.type === 'subFolder' ? 'Chủ Đề' : 'Bài Học'}
                </span>
              </h3>
              <button onClick={() => setActiveRenameModal(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRenameSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên mới: *</label>
                <input
                  type="text"
                  value={renameInputText}
                  onChange={(e) => setRenameInputText(e.target.value)}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-cyan-500/50 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveRenameModal(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!renameInputText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  Lưu Tên Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </aside>
  )
}
