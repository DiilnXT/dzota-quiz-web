'use client'

import React, { useState, useMemo } from 'react'
import { 
  X, 
  Layers, 
  BookOpen, 
  CheckSquare, 
  Square, 
  Shuffle, 
  Sparkles, 
  Brain, 
  Flame, 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  Check,
  ListFilter
} from 'lucide-react'
import { Project, Lesson } from '../services/storageService'
import { soundService } from '../services/soundService'

interface DeckSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  projects: Project[]
  initialSelectedLessonIds: string[]
  onStartSession: (config: {
    selectedLessonIds: string[]
    shuffle: boolean
    limitCount: number | null
    studyMode: 'anki' | 'exam'
  }) => void
  defaultMode?: 'anki' | 'exam'
}

export default function DeckSelectorModal({
  isOpen,
  onClose,
  projects,
  initialSelectedLessonIds,
  onStartSession,
  defaultMode = 'anki'
}: DeckSelectorModalProps) {
  if (!isOpen) return null

  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>(
    initialSelectedLessonIds.length > 0 ? initialSelectedLessonIds : []
  )
  const [shuffle, setShuffle] = useState(true)
  const [limitCount, setLimitCount] = useState<number | null>(null) // null = all, or 10, 20, 30
  const [targetMode, setTargetMode] = useState<'anki' | 'exam'>(defaultMode)

  // Expanded folders state
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    projects.forEach(p => {
      p.categories?.forEach(c => {
        init[c.id] = true
      })
    })
    return init
  })

  // All lessons flat
  const allLessons = useMemo(() => {
    const list: Array<{
      lesson: Lesson
      categoryName: string
      categoryId: string
      subFolderName: string
      subFolderId: string
      masksCount: number
    }> = []

    projects.forEach(p => {
      p.categories?.forEach(c => {
        c.subFolders?.forEach(s => {
          s.lessons?.forEach(l => {
            const masksCount = l.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0
            list.push({
              lesson: l,
              categoryName: c.name,
              categoryId: c.id,
              subFolderName: s.name,
              subFolderId: s.id,
              masksCount
            })
          })
        })
      })
    })
    return list
  }, [projects])

  // Count total masks of selected lessons
  const totalSelectedMasks = useMemo(() => {
    return allLessons
      .filter(item => selectedLessonIds.includes(item.lesson.id))
      .reduce((sum, item) => sum + item.masksCount, 0)
  }, [allLessons, selectedLessonIds])

  // Toggle category all lessons
  const handleToggleCategory = (catId: string) => {
    const catLessons = allLessons.filter(l => l.categoryId === catId).map(l => l.lesson.id)
    const allCatSelected = catLessons.every(id => selectedLessonIds.includes(id))

    if (allCatSelected) {
      setSelectedLessonIds(prev => prev.filter(id => !catLessons.includes(id)))
    } else {
      setSelectedLessonIds(prev => Array.from(new Set([...prev, ...catLessons])))
    }
    soundService.playTick()
  }

  // Toggle subfolder all lessons
  const handleToggleSubFolder = (subId: string) => {
    const subLessons = allLessons.filter(l => l.subFolderId === subId).map(l => l.lesson.id)
    const allSubSelected = subLessons.every(id => selectedLessonIds.includes(id))

    if (allSubSelected) {
      setSelectedLessonIds(prev => prev.filter(id => !subLessons.includes(id)))
    } else {
      setSelectedLessonIds(prev => Array.from(new Set([...prev, ...subLessons])))
    }
    soundService.playTick()
  }

  // Toggle single lesson
  const handleToggleLesson = (id: string) => {
    setSelectedLessonIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    soundService.playTick()
  }

  // Select all / Deselect all
  const handleSelectAll = () => {
    if (selectedLessonIds.length === allLessons.length) {
      setSelectedLessonIds([])
    } else {
      setSelectedLessonIds(allLessons.map(l => l.lesson.id))
    }
    soundService.playTick()
  }

  const handleStart = () => {
    if (selectedLessonIds.length === 0) {
      alert('Vui lòng chọn ít nhất 1 bài học để ôn luyện!')
      return
    }

    onStartSession({
      selectedLessonIds,
      shuffle,
      limitCount,
      studyMode: targetMode
    })
    soundService.playSuccess()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#111827] border border-indigo-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0B0F19] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950 border border-indigo-600/50 flex items-center justify-center text-cyan-400">
              <ListFilter className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Chọn Đề Ôn Luyện Đa Chương & Đa Bài
              </h3>
              <p className="text-xs text-slate-400">
                Tổ hợp nhiều chương và bài học giải phẫu, hỗ trợ trộn câu hỏi ngẫu nhiên
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

        {/* Quick Options Bar */}
        <div className="p-3.5 bg-[#070b14] border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAll}
              className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
            >
              {selectedLessonIds.length === allLessons.length ? 'Bỏ chọn tất cả' : 'Chọn toàn bộ bài học'}
            </button>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-emerald-400 font-bold">
              Đã chọn: {selectedLessonIds.length}/{allLessons.length} bài ({totalSelectedMasks} vị trí)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Shuffle Toggle */}
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white select-none">
              <input
                type="checkbox"
                checked={shuffle}
                onChange={e => setShuffle(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-slate-700"
              />
              <span className="flex items-center gap-1 font-bold">
                <Shuffle className="w-3.5 h-3.5 text-cyan-400" />
                Trộn ngẫu nhiên
              </span>
            </label>
          </div>
        </div>

        {/* Tree List Selection */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {projects.map(proj => (
            <div key={proj.id} className="space-y-3">
              {proj.categories?.map(cat => {
                const catLessons = allLessons.filter(l => l.categoryId === cat.id)
                const isCatAllChecked = catLessons.length > 0 && catLessons.every(l => selectedLessonIds.includes(l.lesson.id))
                const isCatSomeChecked = catLessons.some(l => selectedLessonIds.includes(l.lesson.id))

                return (
                  <div key={cat.id} className="rounded-2xl bg-[#0B0F19] border border-slate-800/80 overflow-hidden">
                    {/* Category Header */}
                    <div className="p-3 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleToggleCategory(cat.id)}
                          className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                        >
                          {isCatAllChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400" />
                          ) : isCatSomeChecked ? (
                            <div className="w-4 h-4 rounded border border-indigo-400 flex items-center justify-center bg-indigo-950 text-[10px] font-bold text-indigo-400">
                              -
                            </div>
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                        <span className="text-xs font-black text-white">{cat.name}</span>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {catLessons.length} bài
                      </span>
                    </div>

                    {/* SubFolders & Lessons */}
                    <div className="p-2 space-y-2">
                      {cat.subFolders?.map(sub => {
                        const subLessons = allLessons.filter(l => l.subFolderId === sub.id)
                        const isSubAllChecked = subLessons.length > 0 && subLessons.every(l => selectedLessonIds.includes(l.lesson.id))

                        return (
                          <div key={sub.id} className="pl-3 border-l-2 border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between text-xs py-1">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSubFolder(sub.id)}
                                  className="text-slate-400 hover:text-white cursor-pointer"
                                >
                                  {isSubAllChecked ? (
                                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                                  ) : (
                                    <Square className="w-3.5 h-3.5 text-slate-600" />
                                  )}
                                </button>
                                <span className="font-bold text-slate-300 text-[11px]">{sub.name}</span>
                              </div>
                            </div>

                            {/* Lessons List */}
                            <div className="space-y-1 pl-4">
                              {sub.lessons?.map(les => {
                                const isChecked = selectedLessonIds.includes(les.id)
                                const masksCount = les.images?.reduce((sum, img) => sum + (img.masks?.length || 0), 0) || 0

                                return (
                                  <div
                                    key={les.id}
                                    onClick={() => handleToggleLesson(les.id)}
                                    className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                                      isChecked
                                        ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                                        : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {isChecked ? (
                                        <CheckSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                      ) : (
                                        <Square className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                                      )}
                                      <span className="font-semibold truncate max-w-sm">{les.title}</span>
                                    </div>

                                    <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                                      {masksCount} Vị trí
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F19] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Hình thức học:</span>
            <div className="flex bg-[#070b14] p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setTargetMode('anki')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  targetMode === 'anki'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🧠 Flashcard Não Bộ
              </button>
              <button
                type="button"
                onClick={() => setTargetMode('exam')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  targetMode === 'exam'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                🔥 Thi Chạy Trạm OSCE
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleStart}
              disabled={selectedLessonIds.length === 0}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-indigo-600/30 cursor-pointer active:scale-95 transition-all"
            >
              Bắt Đầu ({totalSelectedMasks} Vị Trí) →
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
