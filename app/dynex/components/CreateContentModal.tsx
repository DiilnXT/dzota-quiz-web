'use client'

import React, { useState } from 'react'
import { 
  Plus, 
  X, 
  BookOpen, 
  FolderPlus, 
  Layers, 
  Sparkles, 
  Image as ImageIcon, 
  Upload, 
  Link as LinkIcon, 
  Check, 
  Lock, 
  Key, 
  Globe, 
  ShieldCheck,
  GraduationCap
} from 'lucide-react'
import { Project, Lesson, storageService } from '../services/storageService'
import { soundService } from '../services/soundService'

interface CreateContentModalProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  selectedProjectId: string
  initialCreateType?: 'lesson' | 'subFolder' | 'category'
  initialCategoryId?: string
  initialSubFolderId?: string
  onAddProject: (data: { name: string; description: string }) => void
  onAddCategory: (projectId: string, name: string) => void
  onAddSubFolder: (categoryId: string, name: string) => void
  onAddLesson: (subFolderId: string, title: string, options?: { description?: string; imageUrl?: string; accessMode?: string; accessPassword?: string }) => void
  onSelectCreatedLesson?: (lessonId: string) => void
}

export default function CreateContentModal({
  isOpen,
  onClose,
  projects,
  selectedProjectId,
  initialCreateType,
  initialCategoryId,
  initialSubFolderId,
  onAddProject,
  onAddCategory,
  onAddSubFolder,
  onAddLesson,
  onSelectCreatedLesson
}: CreateContentModalProps) {
  if (!isOpen) return null

  // 3 Modes: 'lesson' (Tạo bài học mới), 'subFolder' (Tạo chương mới), 'category' (Tạo hệ cơ quan mới)
  const [createType, setCreateType] = useState<'lesson' | 'subFolder' | 'category'>(initialCreateType || 'lesson')

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0]
  const categories = currentProject?.categories || []

  // Lesson Form State
  const [selectedCatId, setSelectedCatId] = useState<string>(initialCategoryId || categories[0]?.id || '')
  const currentCategory = categories.find(c => c.id === selectedCatId) || categories[0]
  const subFolders = currentCategory?.subFolders || []

  const [selectedSubId, setSelectedSubId] = useState<string>(initialSubFolderId || subFolders[0]?.id || '')
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDesc, setLessonDesc] = useState('')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [accessMode, setAccessMode] = useState<'public' | 'password'>('public')
  const [accessPassword, setAccessPassword] = useState('')

  // Sync initial props when opened or changed
  React.useEffect(() => {
    if (isOpen) {
      if (initialCreateType) setCreateType(initialCreateType)
      if (initialCategoryId) setSelectedCatId(initialCategoryId)
      if (initialSubFolderId) setSelectedSubId(initialSubFolderId)
    }
  }, [isOpen, initialCreateType, initialCategoryId, initialSubFolderId])

  // SubFolder Form State
  const [newSubFolderName, setNewSubFolderName] = useState('')

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('')

  // Quick inline toggle for creating new chapter/organ on the fly
  const [isQuickNewSub, setIsQuickNewSub] = useState(false)
  const [quickSubName, setQuickSubName] = useState('')
  const [isQuickNewCat, setIsQuickNewCat] = useState(false)
  const [quickCatName, setQuickCatName] = useState('')

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh (JPEG, PNG, WebP)!')
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      const b64 = event.target?.result as string
      setImagePreview(b64)
      setImageUrlInput(b64)
      soundService.playTick()
    }
    reader.readAsDataURL(file)
  }

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (createType === 'category') {
      if (!newCategoryName.trim()) return
      onAddCategory(currentProject.id, newCategoryName.trim())
      soundService.playSuccess()
      onClose()
      return
    }

    if (createType === 'subFolder') {
      if (!newSubFolderName.trim()) return
      if (!selectedCatId) {
        alert('Vui lòng chọn hệ cơ quan!')
        return
      }
      onAddSubFolder(selectedCatId, newSubFolderName.trim())
      soundService.playSuccess()
      onClose()
      return
    }

    // Creating Lesson
    if (!lessonTitle.trim()) {
      alert('Vui lòng nhập tiêu đề bài học!')
      return
    }

    let targetSubId = selectedSubId

    // If user typed inline new category or chapter
    if (isQuickNewCat && quickCatName.trim()) {
      onAddCategory(currentProject.id, quickCatName.trim())
    }

    if (isQuickNewSub && quickSubName.trim()) {
      onAddSubFolder(selectedCatId, quickSubName.trim())
    }

    if (!targetSubId && subFolders.length > 0) {
      targetSubId = subFolders[0].id
    }

    if (!targetSubId) {
      alert('Vui lòng tạo hoặc chọn một Chương để chứa bài học này!')
      return
    }

    onAddLesson(targetSubId, lessonTitle.trim(), {
      description: lessonDesc.trim() || 'Mô-đun giải phẫu y khoa chuyên sâu.',
      imageUrl: imageUrlInput || undefined,
      accessMode,
      accessPassword: accessMode === 'password' ? accessPassword.trim() : ''
    })

    soundService.playSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
                <Plus className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Tạo Mới Nội Dung Y Khoa DYNEX
              </h3>
              <p className="text-xs text-slate-400">
                Thêm bài học giải phẫu, chương học hoặc hệ cơ quan mới vào ngân hàng dữ liệu
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

        {/* Type Selector Tabs */}
        <div className="flex items-center gap-1.5 p-3 bg-[#070b14] border-b border-slate-800 shrink-0">
          <button
            type="button"
            onClick={() => setCreateType('lesson')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              createType === 'lesson'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Tạo Bài Học Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateType('subFolder')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              createType === 'subFolder'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <FolderPlus className="w-4 h-4" />
            <span>2. Tạo Chương Mới</span>
          </button>

          <button
            type="button"
            onClick={() => setCreateType('category')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              createType === 'category'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Tạo Hệ Cơ Quan</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* ─── FORM 1: CREATE LESSON ─── */}
            {createType === 'lesson' && (
              <div className="space-y-4 animate-fadeIn">
                
                {/* Organ System Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Thuộc Hệ Cơ Quan:
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreateType('category')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                    >
                      + Thêm hệ cơ quan mới
                    </button>
                  </div>

                  <select
                    value={selectedCatId}
                    onChange={(e) => {
                      setSelectedCatId(e.target.value)
                      const cat = categories.find(c => c.id === e.target.value)
                      if (cat && cat.subFolders && cat.subFolders.length > 0) {
                        setSelectedSubId(cat.subFolders[0].id)
                      } else {
                        setSelectedSubId('')
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#111827]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Chapter Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Thuộc Chương / Phần:
                    </label>
                    <button
                      type="button"
                      onClick={() => setCreateType('subFolder')}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                    >
                      + Thêm chương mới
                    </button>
                  </div>

                  {subFolders.length === 0 ? (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center justify-between">
                      <span>Hệ cơ quan này chưa có chương nào.</span>
                      <button
                        type="button"
                        onClick={() => setCreateType('subFolder')}
                        className="px-2.5 py-1 rounded-lg bg-amber-600 text-slate-950 font-black text-[11px]"
                      >
                        Tạo chương ngay
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedSubId}
                      onChange={(e) => setSelectedSubId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      {subFolders.map(s => (
                        <option key={s.id} value={s.id} className="bg-[#111827]">
                          {s.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Lesson Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Tiêu Đề Bài Học Giải Phẫu *:
                  </label>
                  <input
                    type="text"
                    value={lessonTitle}
                    onChange={(e) => setLessonTitle(e.target.value)}
                    placeholder="vd: Bài 3: Giải Phẫu Tim, Các Buồng Tim & Van Tim"
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Lesson Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Mô Tả Lâm Sàng / Trọng Tâm Thi:
                  </label>
                  <input
                    type="text"
                    value={lessonDesc}
                    onChange={(e) => setLessonDesc(e.target.value)}
                    placeholder="vd: Cấu trúc đại thể các van tim, hệ thống động mạch vành và các mốc giải phẫu OSCE"
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Diagram Image Upload */}
                <div className="space-y-2 p-3.5 bg-[#070b14] border border-slate-800 rounded-2xl">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span>Sơ Đồ Giải Phẫu Ban Đầu (Tùy chọn):</span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    {/* Upload File Button */}
                    <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-300 hover:text-white cursor-pointer transition-colors bg-[#111827]">
                      <Upload className="w-4 h-4 text-indigo-400" />
                      <span>Tải ảnh từ máy tính</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {/* Or URL input */}
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        value={imageUrlInput.startsWith('data:') ? '' : imageUrlInput}
                        onChange={(e) => {
                          setImageUrlInput(e.target.value)
                          setImagePreview(e.target.value)
                        }}
                        placeholder="Hoặc dán link ảnh web..."
                        className="w-full pl-9 pr-3 py-2.5 bg-[#111827] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Image Preview Thumbnail */}
                  {imagePreview && (
                    <div className="relative mt-2 aspect-video max-h-36 rounded-xl overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null)
                          setImageUrlInput('')
                        }}
                        className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Access Mode */}
                <div className="p-3.5 bg-[#070b14] border border-slate-800 rounded-2xl space-y-2.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Quyền Truy Cập Học Tập:
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAccessMode('public')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        accessMode === 'public'
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                          : 'bg-[#111827] border-slate-800 text-slate-400'
                      }`}
                    >
                      🟢 Công Khai (Free)
                    </button>
                    <button
                      type="button"
                      onClick={() => setAccessMode('password')}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        accessMode === 'password'
                          ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                          : 'bg-[#111827] border-slate-800 text-slate-400'
                      }`}
                    >
                      🔒 Cần Mã PIN Lớp
                    </button>
                  </div>

                  {accessMode === 'password' && (
                    <input
                      type="text"
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value.toUpperCase())}
                      placeholder="Nhập mã PIN lớp học (vd: MEDPIN99)..."
                      className="w-full px-3 py-2 bg-[#111827] border border-amber-500/50 rounded-xl text-xs font-mono font-bold text-amber-300 uppercase focus:outline-none"
                    />
                  )}
                </div>

              </div>
            )}

            {/* ─── FORM 2: CREATE SUBFOLDER (CHƯƠNG MỚI) ─── */}
            {createType === 'subFolder' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Chọn Hệ Cơ Quan Chứa Chương Này:
                  </label>
                  <select
                    value={selectedCatId}
                    onChange={(e) => setSelectedCatId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#111827]">
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Tên Chương Mới *:
                  </label>
                  <input
                    type="text"
                    value={newSubFolderName}
                    onChange={(e) => setNewSubFolderName(e.target.value)}
                    placeholder="vd: Chương 2: Ruột Non, Mạc Treo & Hệ Thống Động Mạch Mạc Treo"
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* ─── FORM 3: CREATE CATEGORY (HỆ CƠ QUAN) ─── */}
            {createType === 'category' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                    Tên Hệ Cơ Quan Mới *:
                  </label>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="vd: Hệ Hô Hấp (Respiratory System) hoặc Hệ Cơ Xương Khớp"
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {createType === 'lesson'
                    ? 'Tạo Bài Học & Bắt Đầu'
                    : createType === 'subFolder'
                    ? 'Tạo Chương Mới'
                    : 'Tạo Hệ Cơ Quan Mới'}
                </span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  )
}
