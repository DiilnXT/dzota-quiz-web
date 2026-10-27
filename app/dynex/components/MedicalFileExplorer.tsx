'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import {
  Folder,
  FolderPlus,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  HardDrive,
  Laptop,
  ChevronRight,
  ArrowLeft,
  ArrowUp,
  RefreshCw,
  Search,
  Plus,
  Edit3,
  Trash2,
  Share2,
  ExternalLink,
  Layers,
  Sparkles,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Check,
  X,
  Brain,
  Award,
  Lock,
  Unlock,
  AlertTriangle,
  Flame,
  Info
} from 'lucide-react'
import { Project, Category, SubFolder, Lesson, ImageItem, storageService } from '../services/storageService'
import { soundService } from '../services/soundService'

interface MedicalFileExplorerProps {
  projects: Project[]
  selectedProjectId?: string
  selectedLessonId?: string
  onProjectsUpdated: (updated: Project[]) => void
  onOpenStudio: (lessonId: string, projectId: string, imageId?: string) => void
  onSelectLessonForFlashcard?: (lessonId: string, projectId: string) => void
  onSelectLessonForExam?: (lessonId: string) => void
  onOpenShare?: (lesson: Lesson) => void
  isSuperAdmin?: boolean
}

type ExplorerLevel = 'this_pc' | 'project' | 'category' | 'subfolder'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  type: 'empty' | 'item'
  itemType?: 'project' | 'category' | 'subfolder' | 'lesson'
  itemData?: any
}

export default function MedicalFileExplorer({
  projects,
  selectedProjectId,
  selectedLessonId,
  onProjectsUpdated,
  onOpenStudio,
  onSelectLessonForFlashcard,
  onSelectLessonForExam,
  onOpenShare,
  isSuperAdmin = true
}: MedicalFileExplorerProps) {
  // Navigation state
  const [level, setLevel] = useState<ExplorerLevel>('this_pc')
  const [currentProjectId, setCurrentProjectId] = useState<string>('')
  const [currentCategoryId, setCurrentCategoryId] = useState<string>('')
  const [currentSubFolderId, setCurrentSubFolderId] = useState<string>('')
  
  // Selection & View mode
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false)

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'empty'
  })

  // Modal dialog states
  const [folderModal, setFolderModal] = useState<{ open: boolean; title: string; defaultVal: string; action: 'create' | 'rename'; targetId?: string }>({
    open: false,
    title: '',
    defaultVal: '',
    action: 'create'
  })
  const [folderInput, setFolderInput] = useState('')

  const [lessonModal, setLessonModal] = useState<{ open: boolean; action: 'create' | 'rename'; lessonId?: string }>({
    open: false,
    action: 'create'
  })
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonDesc, setLessonDesc] = useState('')
  const [lessonImageUrl, setLessonImageUrl] = useState('')

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string; type: string } | null>(null)
  const [clearAllConfirm, setClearAllConfirm] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)

  // Sync initial navigation
  useEffect(() => {
    if (selectedProjectId && projects.some(p => p.id === selectedProjectId)) {
      setCurrentProjectId(selectedProjectId)
      setLevel('project')
    } else if (projects.length > 0 && !currentProjectId) {
      setCurrentProjectId(projects[0].id)
      setLevel('project')
    }
  }, [selectedProjectId, projects])

  // Close context menu on outside click
  useEffect(() => {
    const handleGlobalClick = () => {
      if (contextMenu.visible) {
        setContextMenu(prev => ({ ...prev, visible: false }))
      }
      if (isNewMenuOpen) {
        setIsNewMenuOpen(false)
      }
    }
    window.addEventListener('click', handleGlobalClick)
    return () => window.removeEventListener('click', handleGlobalClick)
  }, [contextMenu.visible, isNewMenuOpen])

  // Current entity pointers
  const currentProject = useMemo(() => {
    return projects.find(p => p.id === currentProjectId) || null
  }, [projects, currentProjectId])

  const currentCategory = useMemo(() => {
    if (!currentProject) return null
    return (currentProject.categories || []).find(c => c.id === currentCategoryId) || null
  }, [currentProject, currentCategoryId])

  const currentSubFolder = useMemo(() => {
    if (!currentCategory) return null
    return (currentCategory.subFolders || []).find(s => s.id === currentSubFolderId) || null
  }, [currentCategory, currentSubFolderId])

  // Navigation handlers
  const handleGoToThisPC = () => {
    soundService.playClick()
    setLevel('this_pc')
    setCurrentCategoryId('')
    setCurrentSubFolderId('')
    setSelectedItemId(null)
  }

  const handleGoToProject = (projId: string) => {
    soundService.playClick()
    setCurrentProjectId(projId)
    setLevel('project')
    setCurrentCategoryId('')
    setCurrentSubFolderId('')
    setSelectedItemId(null)
  }

  const handleGoToCategory = (catId: string) => {
    soundService.playClick()
    setCurrentCategoryId(catId)
    setLevel('category')
    setCurrentSubFolderId('')
    setSelectedItemId(null)
  }

  const handleGoToSubFolder = (subId: string) => {
    soundService.playClick()
    setCurrentSubFolderId(subId)
    setLevel('subfolder')
    setSelectedItemId(null)
  }

  const handleGoUp = () => {
    soundService.playClick()
    if (level === 'subfolder') {
      setLevel('category')
      setCurrentSubFolderId('')
    } else if (level === 'category') {
      setLevel('project')
      setCurrentCategoryId('')
    } else if (level === 'project') {
      setLevel('this_pc')
    }
    setSelectedItemId(null)
  }

  // Right-click context menu handlers
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    soundService.playPop()
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'empty'
    })
  }

  const handleItemContextMenu = (e: React.MouseEvent, itemType: 'project' | 'category' | 'subfolder' | 'lesson', itemData: any) => {
    e.preventDefault()
    e.stopPropagation()
    soundService.playPop()
    setSelectedItemId(itemData.id)
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type: 'item',
      itemType,
      itemData
    })
  }

  // CRUD Actions
  // 1. Create Folder
  const handleOpenNewFolderModal = () => {
    let title = 'Tạo Môn Học Mới (Thư mục Cấp 1)'
    if (level === 'project') title = `Tạo Chương Mới Trong ${currentProject?.name || 'Môn'}`
    else if (level === 'category') title = `Tạo Chủ Đề Mới Trong ${currentCategory?.name || 'Chương'}`
    else if (level === 'subfolder') title = `Tạo Chủ Đề Con Trong ${currentSubFolder?.name || 'Chủ đề'}`

    setFolderModal({
      open: true,
      title,
      defaultVal: '',
      action: 'create'
    })
    setFolderInput('')
    setIsNewMenuOpen(false)
  }

  const handleOpenRenameModal = (targetItem?: any) => {
    const item = targetItem || getSelectedItem()
    if (!item) return

    setFolderModal({
      open: true,
      title: `Đổi Tên: ${item.name || item.title}`,
      defaultVal: item.name || item.title,
      action: 'rename',
      targetId: item.id
    })
    setFolderInput(item.name || item.title)
  }

  const handleSaveFolder = (e: React.FormEvent) => {
    e.preventDefault()
    const name = folderInput.trim()
    if (!name) return

    if (folderModal.action === 'create') {
      if (level === 'this_pc') {
        // Create new project
        const newProj: Project = {
          id: `proj_${Date.now()}`,
          name,
          description: 'Môn học Y khoa',
          author: 'Nhật Duy',
          createdAt: new Date().toISOString(),
          categories: []
        }
        const updated = [...projects, newProj]
        onProjectsUpdated(updated)
        setCurrentProjectId(newProj.id)
        setLevel('project')
      } else if (level === 'project' && currentProject) {
        // Create new category (Chương)
        const newCat: Category = {
          id: `cat_${Date.now()}`,
          name,
          icon: 'Folder',
          subFolders: []
        }
        const updated = projects.map(p => {
          if (p.id !== currentProjectId) return p
          return { ...p, categories: [...(p.categories || []), newCat] }
        })
        onProjectsUpdated(updated)
      } else if (level === 'category' && currentCategory) {
        // Create new subFolder (Chủ đề)
        const newSub: SubFolder = {
          id: `sub_${Date.now()}`,
          name,
          lessons: []
        }
        const updated = projects.map(p => {
          if (p.id !== currentProjectId) return p
          return {
            ...p,
            categories: (p.categories || []).map(c => {
              if (c.id !== currentCategoryId) return c
              return { ...c, subFolders: [...(c.subFolders || []), newSub] }
            })
          }
        })
        onProjectsUpdated(updated)
      } else if (level === 'subfolder' && currentSubFolder) {
        // Create nested subfolder
        const newSub: SubFolder = {
          id: `sub_${Date.now()}`,
          name,
          lessons: []
        }
        const updated = projects.map(p => {
          if (p.id !== currentProjectId) return p
          return {
            ...p,
            categories: (p.categories || []).map(c => {
              if (c.id !== currentCategoryId) return c
              return { ...c, subFolders: [...(c.subFolders || []), newSub] }
            })
          }
        })
        onProjectsUpdated(updated)
      }
      soundService.playSuccess()
    } else if (folderModal.action === 'rename' && folderModal.targetId) {
      // Handle Rename across levels
      const targetId = folderModal.targetId
      const updated = projects.map(p => {
        if (p.id === targetId) return { ...p, name }
        return {
          ...p,
          categories: (p.categories || []).map(c => {
            if (c.id === targetId) return { ...c, name }
            return {
              ...c,
              subFolders: (c.subFolders || []).map(s => {
                if (s.id === targetId) return { ...s, name }
                return {
                  ...s,
                  lessons: (s.lessons || []).map(l => (l.id === targetId ? { ...l, title: name } : l))
                }
              })
            }
          })
        }
      })
      onProjectsUpdated(updated)
      soundService.playSuccess()
    }

    setFolderModal({ open: false, title: '', defaultVal: '', action: 'create' })
  }

  // 2. Create Lesson
  const handleOpenNewLessonModal = () => {
    setLessonModal({ open: true, action: 'create' })
    setLessonTitle('')
    setLessonDesc('')
    setLessonImageUrl('')
    setIsNewMenuOpen(false)
  }

  const handleSaveLesson = (e: React.FormEvent) => {
    e.preventDefault()
    const title = lessonTitle.trim()
    if (!title) return

    // Find destination subFolder: either current subFolder, or create/find first subFolder in current category
    let targetSubId = currentSubFolderId
    let targetCatId = currentCategoryId

    const updated = projects.map(proj => {
      if (proj.id !== currentProjectId) return proj

      let cats = proj.categories || []
      if (cats.length === 0) {
        // Auto create category if none exists
        cats = [{ id: `cat_${Date.now()}`, name: 'Chương 1: Giải Phẫu Cơ Bản', subFolders: [] }]
      }
      if (!targetCatId) targetCatId = cats[0].id

      return {
        ...proj,
        categories: cats.map(cat => {
          if (cat.id !== targetCatId) return cat

          let subs = cat.subFolders || []
          if (subs.length === 0) {
            // Auto create subfolder
            subs = [{ id: `sub_${Date.now()}`, name: 'Chủ Đề 1: Tổng Quan', lessons: [] }]
          }
          if (!targetSubId) targetSubId = subs[0].id

          const newImageId = lessonImageUrl ? `img_${Date.now()}` : undefined
          const newLesson: Lesson = {
            id: `les_${Date.now()}`,
            title,
            description: lessonDesc || 'Bài học thực hành giải phẫu y khoa',
            createdAt: new Date().toISOString(),
            accessMode: 'public',
            allowedEmails: [],
            accessPassword: '',
            images: lessonImageUrl ? [
              {
                id: newImageId!,
                title,
                url: lessonImageUrl,
                masks: []
              }
            ] : []
          }

          return {
            ...cat,
            subFolders: subs.map(sub => {
              if (sub.id !== targetSubId) return sub
              return { ...sub, lessons: [...(sub.lessons || []), newLesson] }
            })
          }
        })
      }
    })

    onProjectsUpdated(updated)
    soundService.playSuccess()
    setLessonModal({ open: false, action: 'create' })
  }

  // 3. Delete Selected Item
  const handleDeleteItem = (id: string, type: string, name: string) => {
    setDeleteConfirm({ open: true, id, type, name })
  }

  const executeDelete = () => {
    if (!deleteConfirm) return
    const { id, type } = deleteConfirm

    if (type === 'project') {
      const updated = projects.filter(p => p.id !== id)
      onProjectsUpdated(updated)
      if (currentProjectId === id) {
        setLevel('this_pc')
        setCurrentProjectId('')
      }
    } else if (type === 'category') {
      const updated = projects.map(p => {
        if (p.id !== currentProjectId) return p
        return {
          ...p,
          categories: (p.categories || []).filter(c => c.id !== id)
        }
      })
      onProjectsUpdated(updated)
      if (currentCategoryId === id) {
        setLevel('project')
        setCurrentCategoryId('')
      }
    } else if (type === 'subfolder') {
      const updated = projects.map(p => {
        if (p.id !== currentProjectId) return p
        return {
          ...p,
          categories: (p.categories || []).map(c => ({
            ...c,
            subFolders: (c.subFolders || []).filter(s => s.id !== id)
          }))
        }
      })
      onProjectsUpdated(updated)
      if (currentSubFolderId === id) {
        setLevel('category')
        setCurrentSubFolderId('')
      }
    } else if (type === 'lesson') {
      const updated = projects.map(p => {
        if (p.id !== currentProjectId) return p
        return {
          ...p,
          categories: (p.categories || []).map(c => ({
            ...c,
            subFolders: (c.subFolders || []).map(s => ({
              ...s,
              lessons: (s.lessons || []).filter(l => l.id !== id)
            }))
          }))
        }
      })
      onProjectsUpdated(updated)
    }

    soundService.playComplete()
    setDeleteConfirm(null)
    setSelectedItemId(null)
  }

  // 4. Wipe / Clear All Data
  const handleClearAll = () => {
    const cleaned = storageService.clearAllData()
    onProjectsUpdated(cleaned)
    setLevel('this_pc')
    setCurrentProjectId('')
    setCurrentCategoryId('')
    setCurrentSubFolderId('')
    setSelectedItemId(null)
    setClearAllConfirm(false)
    soundService.playComplete()
  }

  // Helper to find selected item
  const getSelectedItem = () => {
    if (!selectedItemId) return null
    if (level === 'this_pc') {
      return projects.find(p => p.id === selectedItemId)
    }
    if (level === 'project') {
      return currentProject?.categories?.find(c => c.id === selectedItemId)
    }
    if (level === 'category') {
      return currentCategory?.subFolders?.find(s => s.id === selectedItemId)
    }
    if (level === 'subfolder') {
      return currentSubFolder?.lessons?.find(l => l.id === selectedItemId)
    }
    return null
  }

  // Render items based on current level
  const renderExplorerContent = () => {
    // LEVEL 0: This PC (Danh sách các Môn Học / Projects)
    if (level === 'this_pc') {
      const filtered = projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))

      if (filtered.length === 0) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
              <Laptop className="w-10 h-10 text-cyan-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Máy Tính Trống (Chưa có Môn Học Nào)</h4>
            <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
              Bạn đang ở thư mục gốc <strong>This PC</strong>. Nhấp chuột phải vào bất kỳ khoảng trống nào hoặc bấm nút <strong>&quot;+ Mới&quot;</strong> để tạo Môn Học Y Khoa đầu tiên!
            </p>
            <button
              onClick={handleOpenNewFolderModal}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Tạo Môn Học Mới</span>
            </button>
          </div>
        )
      }

      return (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 p-4" 
          : "flex flex-col gap-1 p-2"
        }>
          {filtered.map(proj => {
            const isSelected = selectedItemId === proj.id
            const chaptersCount = proj.categories?.length || 0

            return (
              <div
                key={proj.id}
                onClick={() => { setSelectedItemId(proj.id); soundService.playClick(); }}
                onDoubleClick={() => handleGoToProject(proj.id)}
                onContextMenu={(e) => handleItemContextMenu(e, 'project', proj)}
                className={`group relative rounded-2xl transition-all cursor-pointer select-none ${
                  viewMode === 'grid'
                    ? `p-3.5 flex flex-col items-center text-center border ${
                        isSelected 
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500' 
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`
                    : `p-2.5 px-3 flex items-center gap-3 border ${
                        isSelected 
                          ? 'bg-cyan-950/40 border-cyan-500' 
                          : 'bg-transparent border-transparent hover:bg-slate-800/50'
                      }`
                }`}
              >
                {/* Drive / Folder Icon */}
                <div className={`relative ${viewMode === 'grid' ? 'w-16 h-16 mb-2' : 'w-9 h-9'} rounded-2xl bg-gradient-to-br from-cyan-600/20 to-blue-700/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform`}>
                  <HardDrive className={viewMode === 'grid' ? "w-8 h-8 text-cyan-400" : "w-5 h-5 text-cyan-400"} />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-[9px] font-black text-slate-950">
                    {chaptersCount}
                  </span>
                </div>

                {/* Details */}
                <div className={viewMode === 'grid' ? "w-full" : "flex-1 min-w-0"}>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300">
                    {proj.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {chaptersCount} Chương học • Môn
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // LEVEL 1: In Project (Danh sách các Chương / Categories)
    if (level === 'project') {
      const categories = currentProject?.categories || []
      const filtered = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))

      if (filtered.length === 0) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
              <FolderOpen className="w-10 h-10 text-amber-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Môn Này Chưa Có Chương Nào (Thư mục trống)</h4>
            <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
              Môn <strong>{currentProject?.name}</strong> hiện chưa có chương nào. Nhấp chuột phải vào bất kỳ chỗ trống nào hoặc bấm nút <strong>&quot;+ Mới&quot;</strong> để tạo Chương mới!
            </p>
            <button
              onClick={handleOpenNewFolderModal}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Tạo Chương Mới</span>
            </button>
          </div>
        )
      }

      return (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 p-4" 
          : "flex flex-col gap-1 p-2"
        }>
          {filtered.map(cat => {
            const isSelected = selectedItemId === cat.id
            const subCount = cat.subFolders?.length || 0

            return (
              <div
                key={cat.id}
                onClick={() => { setSelectedItemId(cat.id); soundService.playClick(); }}
                onDoubleClick={() => handleGoToCategory(cat.id)}
                onContextMenu={(e) => handleItemContextMenu(e, 'category', cat)}
                className={`group relative rounded-2xl transition-all cursor-pointer select-none ${
                  viewMode === 'grid'
                    ? `p-3.5 flex flex-col items-center text-center border ${
                        isSelected 
                          ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500' 
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`
                    : `p-2.5 px-3 flex items-center gap-3 border ${
                        isSelected 
                          ? 'bg-amber-950/40 border-amber-500' 
                          : 'bg-transparent border-transparent hover:bg-slate-800/50'
                      }`
                }`}
              >
                <div className={`relative ${viewMode === 'grid' ? 'w-16 h-16 mb-2' : 'w-9 h-9'} rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform`}>
                  <Folder className={viewMode === 'grid' ? "w-8 h-8 text-amber-400 fill-amber-400/20" : "w-5 h-5 text-amber-400 fill-amber-400/20"} />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-[9px] font-black text-slate-950">
                    {subCount}
                  </span>
                </div>

                <div className={viewMode === 'grid' ? "w-full" : "flex-1 min-w-0"}>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                    {cat.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {subCount} Chủ đề • Chương
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // LEVEL 2: In Category (Danh sách các Chủ Đề / SubFolders)
    if (level === 'category') {
      const subFolders = currentCategory?.subFolders || []
      const filtered = subFolders.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))

      if (filtered.length === 0) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
              <Folder className="w-10 h-10 text-emerald-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Chương Này Chưa Có Chủ Đề Nào (Thư mục trống)</h4>
            <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
              Chương <strong>{currentCategory?.name}</strong> hiện chưa có chủ đề con. Nhấp chuột phải vào bất kỳ chỗ trống nào để tạo Chủ Đề hoặc Bài Học mới!
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={handleOpenNewFolderModal}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
              >
                <FolderPlus className="w-4 h-4" />
                <span>Tạo Chủ Đề Mới</span>
              </button>
              <button
                onClick={handleOpenNewLessonModal}
                className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo Bài Học Mới</span>
              </button>
            </div>
          </div>
        )
      }

      return (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 p-4" 
          : "flex flex-col gap-1 p-2"
        }>
          {filtered.map(sub => {
            const isSelected = selectedItemId === sub.id
            const lessonCount = sub.lessons?.length || 0

            return (
              <div
                key={sub.id}
                onClick={() => { setSelectedItemId(sub.id); soundService.playClick(); }}
                onDoubleClick={() => handleGoToSubFolder(sub.id)}
                onContextMenu={(e) => handleItemContextMenu(e, 'subfolder', sub)}
                className={`group relative rounded-2xl transition-all cursor-pointer select-none ${
                  viewMode === 'grid'
                    ? `p-3.5 flex flex-col items-center text-center border ${
                        isSelected 
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500' 
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`
                    : `p-2.5 px-3 flex items-center gap-3 border ${
                        isSelected 
                          ? 'bg-emerald-950/40 border-emerald-500' 
                          : 'bg-transparent border-transparent hover:bg-slate-800/50'
                      }`
                }`}
              >
                <div className={`relative ${viewMode === 'grid' ? 'w-16 h-16 mb-2' : 'w-9 h-9'} rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform`}>
                  <FolderOpen className={viewMode === 'grid' ? "w-8 h-8 text-emerald-400 fill-emerald-400/20" : "w-5 h-5 text-emerald-400 fill-emerald-400/20"} />
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500 text-[9px] font-black text-slate-950">
                    {lessonCount}
                  </span>
                </div>

                <div className={viewMode === 'grid' ? "w-full" : "flex-1 min-w-0"}>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-emerald-300">
                    {sub.name}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {lessonCount} Bài học thực hành
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // LEVEL 3: In SubFolder (Danh sách các Bài Học / Lessons & Sơ đồ)
    if (level === 'subfolder') {
      const lessons = currentSubFolder?.lessons || []
      const filtered = lessons.filter(l => l.title.toLowerCase().includes(searchQuery.toLowerCase()))

      if (filtered.length === 0) {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]">
            <div className="w-20 h-20 rounded-3xl bg-slate-800/80 border border-dashed border-slate-700 flex items-center justify-center text-slate-400 mb-4 shadow-xl">
              <FileText className="w-10 h-10 text-cyan-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Chủ Đề Này Chưa Có Bài Học Nào</h4>
            <p className="text-xs text-slate-400 max-w-md mb-5 leading-relaxed">
              Chủ đề <strong>{currentSubFolder?.name}</strong> hiện chưa có bài học giải phẫu nào. Nhấp chuột phải vào khoảng trống để tạo Bài Học Mới hoặc Thêm Ảnh Sơ Đồ!
            </p>
            <button
              onClick={handleOpenNewLessonModal}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Bài Học Mới</span>
            </button>
          </div>
        )
      }

      return (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 p-4" 
          : "flex flex-col gap-1 p-2"
        }>
          {filtered.map(les => {
            const isSelected = selectedItemId === les.id
            const imageCount = les.images?.length || 0
            const firstImage = les.images?.[0]
            const totalMasks = (les.images || []).reduce((acc, img) => acc + (img.masks?.length || 0), 0)

            return (
              <div
                key={les.id}
                onClick={() => { setSelectedItemId(les.id); soundService.playClick(); }}
                onDoubleClick={() => onOpenStudio(les.id, currentProjectId, firstImage?.id)}
                onContextMenu={(e) => handleItemContextMenu(e, 'lesson', les)}
                className={`group relative rounded-2xl transition-all cursor-pointer select-none ${
                  viewMode === 'grid'
                    ? `p-3 flex flex-col items-center text-center border ${
                        isSelected 
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500' 
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/60 hover:border-slate-700'
                      }`
                    : `p-2.5 px-3 flex items-center gap-3 border ${
                        isSelected 
                          ? 'bg-cyan-950/40 border-cyan-500' 
                          : 'bg-transparent border-transparent hover:bg-slate-800/50'
                      }`
                }`}
              >
                {/* File Thumbnail */}
                <div className={`relative ${viewMode === 'grid' ? 'w-full h-24 mb-2' : 'w-10 h-10'} rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center`}>
                  {firstImage?.url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img 
                      src={firstImage.url} 
                      alt={les.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                    />
                  ) : (
                    <FileText className="w-8 h-8 text-cyan-400" />
                  )}
                  <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md bg-slate-900/90 text-[9px] font-mono text-cyan-300 border border-slate-700">
                    {totalMasks} Ô che
                  </span>
                </div>

                {/* Details */}
                <div className={viewMode === 'grid' ? "w-full" : "flex-1 min-w-0"}>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300">
                    {les.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate">
                    {imageCount} Ảnh • {totalMasks} Chi tiết
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  // Count items for status bar
  const currentCount = useMemo(() => {
    if (level === 'this_pc') return projects.length
    if (level === 'project') return currentProject?.categories?.length || 0
    if (level === 'category') return currentCategory?.subFolders?.length || 0
    if (level === 'subfolder') return currentSubFolder?.lessons?.length || 0
    return 0
  }, [level, projects, currentProject, currentCategory, currentSubFolder])

  return (
    <div 
      className="flex-1 flex flex-col bg-[#070b14] border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl relative select-none"
      onClick={() => {
        if (contextMenu.visible) setContextMenu(prev => ({ ...prev, visible: false }))
      }}
    >
      {/* 1. TOP WINDOWS 11 EXPLORER HEADER & ADDRESS BAR */}
      <div className="bg-[#0c1222] border-b border-slate-800/80 p-2 sm:p-3 flex flex-wrap items-center gap-2 sm:gap-3">
        {/* Navigation Buttons: Back, Up, Refresh */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleGoUp}
            disabled={level === 'this_pc'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Lên một cấp thư mục (Alt+Up)"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              soundService.playClick()
              // re-trigger local render
              onProjectsUpdated([...projects])
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Làm mới (F5)"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Breadcrumb Path Address Bar */}
        <div className="flex-1 min-w-[200px] bg-[#070b14] border border-slate-800 rounded-xl px-2.5 py-1.5 flex items-center gap-1 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={handleGoToThisPC}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap ${
              level === 'this_pc' ? 'text-cyan-400 font-bold bg-cyan-950/30' : 'text-slate-300'
            }`}
          >
            <Laptop className="w-3.5 h-3.5 text-cyan-400" />
            <span>This PC</span>
          </button>

          {currentProject && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                onClick={() => handleGoToProject(currentProject.id)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap truncate max-w-[140px] ${
                  level === 'project' ? 'text-amber-400 font-bold bg-amber-950/30' : 'text-slate-300'
                }`}
                title={currentProject.name}
              >
                <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{currentProject.name}</span>
              </button>
            </>
          )}

          {currentCategory && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                onClick={() => handleGoToCategory(currentCategory.id)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap truncate max-w-[140px] ${
                  level === 'category' ? 'text-emerald-400 font-bold bg-emerald-950/30' : 'text-slate-300'
                }`}
                title={currentCategory.name}
              >
                <Folder className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">{currentCategory.name}</span>
              </button>
            </>
          )}

          {currentSubFolder && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
              <button
                onClick={() => handleGoToSubFolder(currentSubFolder.id)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap truncate max-w-[140px] ${
                  level === 'subfolder' ? 'text-cyan-400 font-bold bg-cyan-950/30' : 'text-slate-300'
                }`}
                title={currentSubFolder.name}
              >
                <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{currentSubFolder.name}</span>
              </button>
            </>
          )}
        </div>

        {/* Search input in current folder */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm trong thư mục..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#070b14] border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>
      </div>

      {/* 2. COMMAND ACTION BAR (TOOLBAR CHUẨN WINDOWS 11) */}
      <div className="bg-[#0a0f1d] border-b border-slate-800/80 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* [+ MỚI / NEW ▾] Dropdown */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsNewMenuOpen(!isNewMenuOpen)
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mới (New)</span>
              <span className="text-[10px] opacity-70">▾</span>
            </button>

            {isNewMenuOpen && (
              <div 
                className="absolute left-0 top-full mt-1.5 w-56 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 z-40 backdrop-blur-xl animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={handleOpenNewFolderModal}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-amber-400" />
                  <span>
                    {level === 'this_pc' ? 'Môn Học Mới' : level === 'project' ? 'Chương Mới' : 'Thư Mục / Chủ Đề Mới'}
                  </span>
                </button>
                <button
                  onClick={handleOpenNewLessonModal}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Bài Học Mới (Sơ đồ)</span>
                </button>
              </div>
            )}
          </div>

          {/* Edit / Rename Button (Active when item is selected) */}
          {selectedItemId && (
            <button
              onClick={() => handleOpenRenameModal()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Đổi Tên</span>
            </button>
          )}

          {/* Delete Button */}
          {selectedItemId && (
            <button
              onClick={() => {
                const item = getSelectedItem()
                if (item) {
                  let type = 'project'
                  if (level === 'project') type = 'category'
                  else if (level === 'category') type = 'subfolder'
                  else if (level === 'subfolder') type = 'lesson'
                  handleDeleteItem(item.id, type, item.name || item.title)
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold border border-red-800/50 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Xóa</span>
            </button>
          )}

          {/* Open Studio (When lesson is selected) */}
          {selectedItemId && level === 'subfolder' && (
            <button
              onClick={() => {
                const les = currentSubFolder?.lessons?.find(l => l.id === selectedItemId)
                if (les) {
                  onOpenStudio(les.id, currentProjectId, les.images?.[0]?.id)
                }
              }}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Sửa Ô Che Trong Studio</span>
            </button>
          )}
        </div>

        {/* View Mode & Clear All Buttons */}
        <div className="flex items-center gap-1.5">
          <div className="bg-[#070b14] border border-slate-800 rounded-xl p-0.5 flex items-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'grid' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Chế độ lưới icon lớn"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Chế độ danh sách chi tiết"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Clear / Wipe Button (Dọn sạch mọi chương rác theo yêu cầu) */}
          {isSuperAdmin && (
            <button
              onClick={() => setClearAllConfirm(true)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-red-950/40 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-900/50 text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
              title="Xóa trắng mọi chương và bài học có sẵn để tạo mới từ đầu"
            >
              <Trash2 className="w-3 h-3 text-red-400" />
              <span className="hidden sm:inline">Dọn Sạch Thư Mục</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. MAIN EXPLORER CANVAS (CANVAS HIỂN THỊ NỘI DUNG THƯ MỤC - HỖ TRỢ CHUỘT PHẢI) */}
      <div
        ref={canvasRef}
        onContextMenu={handleCanvasContextMenu}
        onClick={() => setSelectedItemId(null)}
        className="flex-1 min-h-[420px] max-h-[620px] overflow-y-auto bg-[#070b14]/50 relative"
      >
        {renderExplorerContent()}
      </div>

      {/* 4. BOTTOM STATUS BAR */}
      <div className="bg-[#0c1222] border-t border-slate-800/80 px-4 py-2 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>{currentCount} mục trong thư mục</span>
          {selectedItemId && (
            <span className="text-cyan-400 font-semibold">• Đã chọn 1 mục</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-slate-500 text-[10px]">
          <span>💡 Mẹo: Nhấp chuột phải vào chỗ trống để tạo mới</span>
        </div>
      </div>

      {/* 5. WINDOWS-STYLE RIGHT-CLICK CONTEXT MENU (CHUỘT PHẢI) */}
      {contextMenu.visible && (
        <div
          style={{ 
            top: Math.min(contextMenu.y, (typeof window !== 'undefined' ? window.innerHeight - 250 : contextMenu.y)), 
            left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth - 240 : contextMenu.x)) 
          }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-56 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl text-xs select-none animate-in fade-in zoom-in-95"
        >
          {contextMenu.type === 'empty' ? (
            /* CONTEXT MENU CHO VÙNG TRỐNG */
            <>
              <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1">
                Thao Tác Thư Mục
              </div>
              <button
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }))
                  handleOpenNewFolderModal()
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FolderPlus className="w-4 h-4 text-amber-400" />
                <span>
                  {level === 'this_pc' ? 'Môn Học Mới' : level === 'project' ? 'Chương Mới' : 'Thư Mục / Chủ Đề Mới'}
                </span>
              </button>
              <button
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }))
                  handleOpenNewLessonModal()
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>Bài Học Mới (Sơ đồ)</span>
              </button>
              <div className="h-px bg-slate-800 my-1" />
              <button
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }))
                  soundService.playClick()
                  onProjectsUpdated([...projects])
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-4 h-4 text-blue-400" />
                <span>Làm Mới (Refresh)</span>
              </button>
            </>
          ) : (
            /* CONTEXT MENU CHO ITEM ĐƯỢC CHỌN */
            <>
              <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-800/80 mb-1 truncate">
                {contextMenu.itemData?.name || contextMenu.itemData?.title}
              </div>
              <button
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }))
                  if (contextMenu.itemType === 'project') handleGoToProject(contextMenu.itemData.id)
                  else if (contextMenu.itemType === 'category') handleGoToCategory(contextMenu.itemData.id)
                  else if (contextMenu.itemType === 'subfolder') handleGoToSubFolder(contextMenu.itemData.id)
                  else if (contextMenu.itemType === 'lesson') {
                    onOpenStudio(contextMenu.itemData.id, currentProjectId, contextMenu.itemData.images?.[0]?.id)
                  }
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Mở (Open)</span>
              </button>

              <button
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }))
                  handleOpenRenameModal(contextMenu.itemData)
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <span>Đổi Tên (Rename)</span>
              </button>

              {/* Lesson Specific Actions */}
              {contextMenu.itemType === 'lesson' && (
                <>
                  <button
                    onClick={() => {
                      setContextMenu(prev => ({ ...prev, visible: false }))
                      onOpenStudio(contextMenu.itemData.id, currentProjectId, contextMenu.itemData.images?.[0]?.id)
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-cyan-300 hover:bg-cyan-950/50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Sửa Ô Che & Sơ Đồ</span>
                  </button>
                  {onSelectLessonForFlashcard && (
                    <button
                      onClick={() => {
                        setContextMenu(prev => ({ ...prev, visible: false }))
                        onSelectLessonForFlashcard(contextMenu.itemData.id, currentProjectId)
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-indigo-300 hover:bg-indigo-950/50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Brain className="w-4 h-4 text-indigo-400" />
                      <span>Học Não Bộ (Flashcard)</span>
                    </button>
                  )}
                  {onSelectLessonForExam && (
                    <button
                      onClick={() => {
                        setContextMenu(prev => ({ ...prev, visible: false }))
                        onSelectLessonForExam(contextMenu.itemData.id)
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-emerald-300 hover:bg-emerald-950/50 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Thi Chạy Trạm (OSCE)</span>
                    </button>
                  )}
                  {onOpenShare && (
                    <button
                      onClick={() => {
                        setContextMenu(prev => ({ ...prev, visible: false }))
                        onOpenShare(contextMenu.itemData)
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-slate-300 hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Share2 className="w-4 h-4 text-blue-400" />
                      <span>Chia Sẻ & Cấp Quyền</span>
                    </button>
                  )}
                </>
              )}

              <div className="h-px bg-slate-800 my-1" />

              <button
                onClick={() => {
                  setContextMenu(prev => ({ ...prev, visible: false }))
                  handleDeleteItem(
                    contextMenu.itemData.id, 
                    contextMenu.itemType || 'project', 
                    contextMenu.itemData.name || contextMenu.itemData.title
                  )
                }}
                className="w-full px-2.5 py-1.5 rounded-xl text-left font-semibold text-red-400 hover:bg-red-950/50 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Xóa (Delete)</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* 6. MODAL: TẠO HOẶC ĐỔI TÊN THƯ MỤC */}
      {folderModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-700/80 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FolderPlus className="w-5 h-5 text-amber-400" />
              <span>{folderModal.title}</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Nhập tên cho thư mục mới hoặc chỉnh sửa tên thư mục hiện tại:
            </p>

            <form onSubmit={handleSaveFolder} className="space-y-4">
              <div>
                <input
                  type="text"
                  autoFocus
                  value={folderInput}
                  onChange={(e) => setFolderInput(e.target.value)}
                  placeholder="Ví dụ: Chương 1 - Giải phẫu Chi Trên..."
                  className="w-full px-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setFolderModal({ open: false, title: '', defaultVal: '', action: 'create' })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={!folderInput.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{folderModal.action === 'create' ? 'Tạo Thư Mục' : 'Lưu Đổi Tên'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL: TẠO BÀI HỌC MỚI (LESSON) */}
      {lessonModal.open && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-slate-700/80 rounded-3xl p-6 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Tạo Bài Học & Sơ Đồ Giải Phẫu Mới</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Bài học sẽ được đặt trong thư mục đang mở. Bạn có thể dán link ảnh giải phẫu ngay bây giờ hoặc tải lên sau trong Studio.
            </p>

            <form onSubmit={handleSaveLesson} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Tên Bài Học: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Ví dụ: Bài 1: Giải phẫu Xương Chi Trên..."
                  className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mô Tả / Ghi Chú:
                </label>
                <textarea
                  rows={2}
                  value={lessonDesc}
                  onChange={(e) => setLessonDesc(e.target.value)}
                  placeholder="Mục tiêu bài học, các mốc giải phẫu quan trọng..."
                  className="w-full px-3.5 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  URL Ảnh Sơ Đồ Giải Phẫu (Tùy chọn):
                </label>
                <input
                  type="url"
                  value={lessonImageUrl}
                  onChange={(e) => setLessonImageUrl(e.target.value)}
                  placeholder="https://... ảnh giải phẫu (.jpg, .png)"
                  className="w-full px-3.5 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Có thể để trống và kéo thả ảnh trực tiếp trong Studio Ô Che.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setLessonModal({ open: false, action: 'create' })}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={!lessonTitle.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Tạo Bài Học</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL: XÁC NHẬN XÓA ITEM */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-white mb-1">Xác Nhận Xóa?</h4>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa <strong className="text-red-400">&quot;{deleteConfirm.name}&quot;</strong>? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 cursor-pointer transition-all"
              >
                Xóa Vĩnh Viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: DỌN SẠCH MỌI DỮ LIỆU CŨ */}
      {clearAllConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b101d] border border-amber-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center animate-in fade-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Xóa Hết Mọi Chương & Bài Học Có Sẵn?</h4>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Thao tác này sẽ dọn sạch toàn bộ các chương mẫu, trả về một màn hình máy tính hoàn toàn trắng sạch để bạn thoải mái tạo mới các Môn, Chương, Chủ đề và Bài học theo đúng chuẩn của bạn.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setClearAllConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Hủy Bỏ
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 cursor-pointer transition-all"
              >
                Xóa Sạch & Bắt Đầu Mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
