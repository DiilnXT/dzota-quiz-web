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
  FileCheck
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
  onAddCategory: (projectId: string, name: string) => void
  onDeleteCategory: (catId: string) => void
  onAddSubFolder: (catId: string, name: string) => void
  onDeleteSubFolder: (catId: string, subId: string) => void
  onAddLesson: (subFolderId: string, title: string) => void
  onDeleteLesson: (catId: string, subId: string, lessonId: string) => void
}

export default function AdminTreeNav({
  projects,
  selectedProjectId,
  selectedLessonId,
  onSelectProject,
  onSelectLesson,
  onAddProject,
  onDeleteProject,
  onAddCategory,
  onDeleteCategory,
  onAddSubFolder,
  onDeleteSubFolder,
  onAddLesson,
  onDeleteLesson
}: AdminTreeNavProps) {
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({ cat_tieu_hoa: true })
  const [openSubFolders, setOpenSubFolders] = useState<Record<string, boolean>>({ sub_gan_mat: true })
  const [searchTerm, setSearchTerm] = useState('')

  // Modals
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')

  const [activePromptModal, setActivePromptModal] = useState<{
    type: 'category' | 'subFolder' | 'lesson'
    parentId: string
    title: string
  } | null>(null)
  const [promptInputText, setPromptInputText] = useState('')

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0]

  const toggleCategory = (catId: string) => {
    setOpenCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
    soundService.playTick()
  }

  const toggleSubFolder = (subId: string) => {
    setOpenSubFolders(prev => ({ ...prev, [subId]: !prev[subId] }))
    soundService.playTick()
  }

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return
    onAddProject({
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Ngân hàng dữ liệu giải phẫu Dzota'
    })
    setNewProjectName('')
    setNewProjectDesc('')
    setShowNewProjectModal(false)
  }

  const handleOpenPrompt = (type: 'category' | 'subFolder' | 'lesson', parentId: string, title: string) => {
    setActivePromptModal({ type, parentId, title })
    setPromptInputText('')
  }

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
  }

  return (
    <aside className="w-full lg:w-80 bg-[#111827] border border-slate-800/80 rounded-3xl flex flex-col h-full overflow-hidden shadow-2xl shrink-0">
      {/* Project / Question Bank Selector Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0B0F19]/80 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            Ngân Hàng Dữ Liệu
          </label>
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo mới
          </button>
        </div>

        {/* Bank Dropdown */}
        <select
          value={selectedProjectId}
          onChange={(e) => onSelectProject(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-slate-700/80 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 shadow-xs"
        >
          {projects.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Quick Search in Bank */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài học, chương..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#1F2937]/70 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* Tree View Structure: Dzota Categories & Lessons */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            Thư Mục & Đề Mục ({currentProject?.categories?.length || 0})
          </span>
          <button
            onClick={() => handleOpenPrompt('category', currentProject?.id, 'Thêm Thư Mục Lớn (Hệ Cơ Quan)')}
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-400 hover:text-indigo-300 px-2 py-0.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Thêm thư mục lớn"
          >
            <Plus className="w-3 h-3" />
            <span>Thư mục</span>
          </button>
        </div>

        {/* Categories */}
        {currentProject?.categories?.map((cat: any) => {
          const isOpen = !!openCategories[cat.id]
          return (
            <div key={cat.id} className="rounded-2xl bg-[#1F2937]/40 border border-slate-800/80 overflow-hidden">
              {/* Category Header */}
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
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {cat.name}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpenPrompt('subFolder', cat.id, `Thêm Thư Mục Con vào "${cat.name}"`)
                    }}
                    title="Thêm phân hệ/chương"
                    className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (confirm(`Xóa thư mục "${cat.name}"?`)) {
                        onDeleteCategory(cat.id)
                      }
                    }}
                    title="Xóa thư mục"
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* SubFolders */}
              {isOpen && (
                <div className="pl-3 pr-2 pb-2 space-y-1.5 border-t border-slate-800/60 bg-[#0B0F19]/40">
                  {cat.subFolders?.length === 0 && (
                    <p className="text-[11px] text-slate-500 italic py-1.5 pl-4">
                      Chưa có chương nào.
                    </p>
                  )}

                  {cat.subFolders?.map((sub: any) => {
                    const isSubOpen = !!openSubFolders[sub.id]
                    return (
                      <div key={sub.id} className="rounded-xl border border-slate-800/60 bg-[#111827]/60 overflow-hidden">
                        <div
                          onClick={() => toggleSubFolder(sub.id)}
                          className="flex items-center justify-between px-2.5 py-2 cursor-pointer hover:bg-slate-800/50 transition-colors group"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {isSubOpen ? (
                              <ChevronDown className="w-3 h-3 text-indigo-400 shrink-0" />
                            ) : (
                              <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                            )}
                            <span className="text-[11px] font-bold text-slate-300 truncate">
                              {sub.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenPrompt('lesson', sub.id, `Thêm Bài Học vào "${sub.name}"`)
                              }}
                              title="Thêm bài học"
                              className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-700 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (confirm(`Xóa "${sub.name}"?`)) {
                                  onDeleteSubFolder(cat.id, sub.id)
                                }
                              }}
                              className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-700 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Lessons List */}
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
                                  className={`flex items-center justify-between p-2.5 rounded-xl text-xs cursor-pointer transition-all duration-150 group ${
                                    isSelected
                                      ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30'
                                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                    <div className="truncate">
                                      <div className="truncate text-xs font-semibold">{les.title}</div>
                                      <div className={`text-[10px] font-normal flex items-center gap-1.5 mt-0.5 ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                                        <span>{totalImages} sơ đồ</span>
                                        <span>•</span>
                                        <span className="font-mono font-bold">{totalMasks} trạm che</span>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (confirm(`Xóa bài học "${les.title}"?`)) {
                                        onDeleteLesson(cat.id, sub.id, les.id)
                                      }
                                    }}
                                    className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
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
        <span>Bản quyền: <strong className="text-indigo-400">Nhật Duy</strong></span>
        <span className="font-mono text-xs text-slate-500 font-bold">DYNEX ENGINE</span>
      </div>

      {/* Modal: New Project */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#111827] border border-indigo-500/40 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-base font-black text-white mb-3">Tạo Ngân Hàng Dữ Liệu Mới</h3>
            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên ngân hàng / kỳ thi *</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ví dụ: Đề Thi Chạy Trạm Tiêu Hóa 2026"
                  className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-slate-700 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Mô tả tóm tắt</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Ghi chú đối tượng sinh viên, học phần..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-slate-700 rounded-2xl text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Tạo Ngân Hàng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Category / SubFolder / Lesson */}
      {activePromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-[#111827] border border-indigo-500/40 rounded-3xl p-5 shadow-2xl">
            <h3 className="text-sm font-black text-white mb-2">{activePromptModal.title}</h3>
            <form onSubmit={handlePromptSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                required
                value={promptInputText}
                onChange={(e) => setPromptInputText(e.target.value)}
                placeholder="Nhập tên tiêu đề..."
                className="w-full px-3.5 py-2.5 bg-[#1F2937] border border-slate-700 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActivePromptModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-black rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Thêm Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  )
}
