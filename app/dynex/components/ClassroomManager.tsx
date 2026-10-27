'use client'

import React, { useState, useMemo } from 'react'
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Key, 
  CheckSquare, 
  Square, 
  Mail, 
  BookOpen, 
  Check, 
  Copy, 
  Search, 
  Sparkles, 
  UserPlus, 
  GraduationCap, 
  AlertCircle,
  X,
  FileSpreadsheet
} from 'lucide-react'
import { storageService, Project, Lesson, DynexClassroom } from '../services/storageService'
import { soundService } from '../services/soundService'

interface ClassroomManagerProps {
  projects: Project[]
  onProjectsUpdated: (newProjects: Project[]) => void
}

export default function ClassroomManager({ projects, onProjectsUpdated }: ClassroomManagerProps) {
  const [classrooms, setClassrooms] = useState<DynexClassroom[]>(() => storageService.getClassrooms())
  const [activeTab, setActiveTab] = useState<'classes' | 'individual'>('classes')

  // Classroom Modal / Form State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClassId, setEditingClassId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formPin, setFormPin] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [pastedEmailsText, setPastedEmailsText] = useState('')
  const [selectedLessonIds, setSelectedLessonIds] = useState<string[]>([])
  const [formError, setFormError] = useState('')

  // Individual Grant Form State
  const [singleEmail, setSingleEmail] = useState('')
  const [singleSelectedLessons, setSingleSelectedLessons] = useState<string[]>([])
  const [singleSuccessMsg, setSingleSuccessMsg] = useState('')

  // Copied PIN feedback
  const [copiedPinId, setCopiedPinId] = useState<string | null>(null)

  // All lessons flat list
  const allLessons = useMemo(() => storageService.getAllLessons(projects), [projects])

  // Parse pasted emails in real time
  const parsedEmails = useMemo(() => {
    return storageService.parseEmailsInput(pastedEmailsText)
  }, [pastedEmailsText])

  // Open modal for new class
  const handleOpenCreateModal = () => {
    setEditingClassId(null)
    setFormName('')
    setFormPin(`PIN${Math.floor(1000 + Math.random() * 9000)}`)
    setFormDesc('')
    setPastedEmailsText('')
    setSelectedLessonIds([])
    setFormError('')
    setIsModalOpen(true)
  }

  // Open modal for editing existing class
  const handleOpenEditModal = (cls: DynexClassroom) => {
    setEditingClassId(cls.id)
    setFormName(cls.name)
    setFormPin(cls.pinCode)
    setFormDesc(cls.description || '')
    setPastedEmailsText(cls.studentEmails.join('\n'))
    setSelectedLessonIds([...cls.assignedLessonIds])
    setFormError('')
    setIsModalOpen(true)
  }

  // Save / Submit Class Form
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      setFormError('Vui lòng nhập tên lớp học.')
      return
    }

    const emails = storageService.parseEmailsInput(pastedEmailsText)

    if (editingClassId) {
      const updated = storageService.updateClassroom(editingClassId, {
        name: formName.trim(),
        pinCode: (formPin || `PIN${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase(),
        description: formDesc.trim(),
        studentEmails: emails,
        assignedLessonIds: selectedLessonIds
      })
      if (updated) {
        setClassrooms(storageService.getClassrooms())
        soundService.playSuccess()
      }
    } else {
      const created = storageService.createClassroom({
        name: formName.trim(),
        pinCode: formPin.trim(),
        description: formDesc.trim(),
        studentEmails: emails,
        assignedLessonIds: selectedLessonIds
      })
      setClassrooms(storageService.getClassrooms())
      soundService.playSuccess()
    }

    setIsModalOpen(false)
  }

  // Delete Classroom
  const handleDeleteClass = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa lớp "${name}"? Các học sinh trong lớp sẽ mất quyền truy cập bài học nếu không được cấp riêng.`)) {
      storageService.deleteClassroom(id)
      setClassrooms(storageService.getClassrooms())
      soundService.playTick()
    }
  }

  // Copy PIN to clipboard
  const handleCopyPin = (cls: DynexClassroom) => {
    navigator.clipboard.writeText(cls.pinCode)
    setCopiedPinId(cls.id)
    soundService.playTick()
    setTimeout(() => setCopiedPinId(null), 2000)
  }

  // Batch toggle all lessons in modal
  const handleToggleSelectAllLessons = () => {
    if (selectedLessonIds.length === allLessons.length) {
      setSelectedLessonIds([])
    } else {
      setSelectedLessonIds(allLessons.map(l => l.id))
    }
  }

  // Toggle single lesson in modal
  const handleToggleLesson = (id: string) => {
    setSelectedLessonIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  // Handle Individual Email Grant Form
  const handleSaveIndividualGrant = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanEmail = singleEmail.trim().toLowerCase()
    if (!cleanEmail || !cleanEmail.includes('@')) {
      alert('Vui lòng nhập địa chỉ Gmail hợp lệ.')
      return
    }

    // Update projects data
    const updatedProjects = projects.map(proj => {
      return {
        ...proj,
        categories: (proj.categories || []).map(cat => ({
          ...cat,
          subFolders: (cat.subFolders || []).map(sub => ({
            ...sub,
            lessons: (sub.lessons || []).map(les => {
              const shouldHaveAccess = singleSelectedLessons.includes(les.id)
              const existingEmails = les.allowedEmails || []
              let newEmails = [...existingEmails]

              if (shouldHaveAccess) {
                if (!newEmails.includes(cleanEmail)) {
                  newEmails.push(cleanEmail)
                }
                // Also set accessMode to vip_emails if it was public
                return {
                  ...les,
                  accessMode: les.accessMode === 'public' ? 'vip_emails' : les.accessMode,
                  allowedEmails: newEmails
                }
              } else {
                newEmails = newEmails.filter(e => e.toLowerCase() !== cleanEmail)
                return {
                  ...les,
                  allowedEmails: newEmails
                }
              }
            })
          }))
        }))
      }
    })

    onProjectsUpdated(updatedProjects)
    soundService.playSuccess()
    setSingleSuccessMsg(`Đã cập nhật phân quyền thành công cho học viên ${cleanEmail}!`)
    setTimeout(() => setSingleSuccessMsg(''), 4000)
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ─── 1. TOP HEADER ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#111827] border border-slate-800 p-6 rounded-3xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white">Quản Lý Lớp Học & Phân Quyền Y Khoa</h2>
          </div>
          <p className="text-xs text-slate-400 max-w-xl">
            Tạo lớp học, dán danh sách nhiều Gmail từ file Excel/Google Sheets, cấp quyền hàng loạt bài học hoặc cấp mã PIN nhanh cho sinh viên tự mở khóa.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo Lớp Học Mới</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TAB SELECTOR ─── */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Danh Sách Lớp Học ({classrooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('individual')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'individual'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Cấp Quyền Theo Gmail Cá Nhân</span>
        </button>
      </div>

      {/* ─── 3. TAB CONTENT: CLASSROOMS LIST ─── */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {classrooms.length === 0 ? (
            <div className="p-12 text-center bg-[#111827] border border-slate-800 rounded-3xl space-y-3">
              <Users className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-bold text-white">Chưa có lớp học nào</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Bấm vào nút &quot;Tạo Lớp Học Mới&quot; để tạo lớp, thêm danh sách Gmail sinh viên và gán quyền học tập các bài học.
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500 cursor-pointer"
              >
                Tạo lớp ngay
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {classrooms.map(cls => (
                <div
                  key={cls.id}
                  className="rounded-3xl bg-[#111827] border border-slate-800 p-5 space-y-4 shadow-xl flex flex-col justify-between hover:border-indigo-500/50 transition-all duration-200"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-black text-white leading-snug">{cls.name}</h3>
                        {cls.description && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{cls.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditModal(cls)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Chỉnh sửa lớp học"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClass(cls.id, cls.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                          title="Xóa lớp học"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* PIN Code Box */}
                    <div className="p-3 bg-[#070b14] rounded-2xl border border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-amber-400" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Mã PIN Vào Lớp</span>
                          <span className="text-sm font-mono font-black text-amber-300">{cls.pinCode}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleCopyPin(cls)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title="Sao chép mã PIN"
                      >
                        {copiedPinId === cls.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 text-[11px]">Đã chép</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-[11px]">Chép mã</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-[#070b14] rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Sinh Viên</span>
                        <span className="text-base font-black text-indigo-400 font-mono">
                          {cls.studentEmails.length} Gmail
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#070b14] rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Bài Học Gán</span>
                        <span className="text-base font-black text-emerald-400 font-mono">
                          {cls.assignedLessonIds.length} Bài
                        </span>
                      </div>
                    </div>

                    {/* Student Emails Preview (First 3) */}
                    {cls.studentEmails.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Danh sách học viên:
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                          {cls.studentEmails.slice(0, 4).map(email => (
                            <span
                              key={email}
                              className="px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 text-[10px] font-mono truncate max-w-[180px]"
                            >
                              {email}
                            </span>
                          ))}
                          {cls.studentEmails.length > 4 && (
                            <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 text-[10px] font-bold">
                              +{cls.studentEmails.length - 4} học viên khác
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-mono">
                      Tạo ngày: {new Date(cls.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(cls)}
                      className="text-indigo-400 hover:text-indigo-300 font-bold text-xs cursor-pointer"
                    >
                      Quản lý & Gán bài →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── 4. TAB CONTENT: INDIVIDUAL EMAIL GRANT ─── */}
      {activeTab === 'individual' && (
        <div className="max-w-3xl mx-auto bg-[#111827] border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Mail className="w-5 h-5 text-indigo-400" />
              <span>Cấp Quyền Học Tập Trực Tiếp Cho Từng Cá Nhân</span>
            </h3>
            <p className="text-xs text-slate-400">
              Nhập Gmail của học viên y khoa cần cấp quyền và tích chọn các bài học bạn muốn mở khóa cho tài khoản này.
            </p>
          </div>

          <form onSubmit={handleSaveIndividualGrant} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                Địa chỉ Gmail học viên:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={singleEmail}
                  onChange={e => setSingleEmail(e.target.value)}
                  placeholder="vidu: bacsi.nguyenvana@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Chọn các bài học cấp quyền:
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSingleSelectedLessons(allLessons.map(l => l.id))}
                    className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                  >
                    Chọn tất cả
                  </button>
                  <span className="text-slate-600">•</span>
                  <button
                    type="button"
                    onClick={() => setSingleSelectedLessons([])}
                    className="text-slate-400 hover:text-slate-300 font-bold cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 bg-[#070b14] p-3 rounded-2xl border border-slate-800">
                {allLessons.map(les => {
                  const isChecked = singleSelectedLessons.includes(les.id)
                  return (
                    <div
                      key={les.id}
                      onClick={() => {
                        setSingleSelectedLessons(prev =>
                          prev.includes(les.id) ? prev.filter(x => x !== les.id) : [...prev, les.id]
                        )
                      }}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                          : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600 shrink-0" />
                        )}
                        <div>
                          <p className="text-xs font-bold leading-tight">{les.title}</p>
                          <span className="text-[10px] text-slate-400">
                            {les.categoryName} • {les.masksCount} Vị trí Flashcard
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {singleSuccessMsg && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{singleSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!singleEmail.trim()}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Xác Nhận Cấp Quyền Cho Học Viên Này</span>
            </button>
          </form>
        </div>
      )}

      {/* ─── 5. CREATE / EDIT CLASSROOM MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl bg-[#111827] border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-black text-white">
                  {editingClassId ? 'Chỉnh Sửa Lớp Học' : 'Tạo Lớp Học Y Khoa Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-4">
              {/* Class Name & PIN */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Tên Lớp Học *:
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="vd: Y Đa Khoa K47 - Tổ 3 (Tiêu Hóa)"
                    className="w-full px-3.5 py-2.5 bg-[#070b14] border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Mã PIN Lớp:
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formPin}
                      onChange={e => setFormPin(e.target.value.toUpperCase())}
                      placeholder="Mã PIN"
                      className="w-full px-3.5 py-2.5 bg-[#070b14] border border-amber-500/50 rounded-xl text-xs sm:text-sm font-mono font-bold text-amber-300 uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Mô Tả / Ghi Chú:
                </label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Ghi chú dành cho sinh viên hoặc giảng viên phụ trách..."
                  className="w-full px-3.5 py-2 bg-[#070b14] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Smart Pasted Emails Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    <span>Dán Danh Sách Gmail Học Sinh (Excel / Sheets):</span>
                  </label>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    Đã nhận diện: {parsedEmails.length} Gmail hợp lệ
                  </span>
                </div>

                <textarea
                  value={pastedEmailsText}
                  onChange={e => setPastedEmailsText(e.target.value)}
                  rows={4}
                  placeholder="Dán hàng loạt Gmail của học sinh vào đây (cách nhau bởi dấu phẩy, khoảng trắng, hoặc dán trực tiếp cột từ Excel/Sheets)&#10;vd:&#10;sinhvien1@gmail.com&#10;sinhvien2@gmail.com, sinhvien3@gmail.com"
                  className="w-full p-3 bg-[#070b14] border border-slate-700 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* Batch Assign Lessons */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Gán Bài Học Cho Lớp Này ({selectedLessonIds.length}/{allLessons.length} bài):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleSelectAllLessons}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 cursor-pointer"
                  >
                    {selectedLessonIds.length === allLessons.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 bg-[#070b14] p-3 rounded-2xl border border-slate-800">
                  {allLessons.map(les => {
                    const isChecked = selectedLessonIds.includes(les.id)
                    return (
                      <div
                        key={les.id}
                        onClick={() => handleToggleLesson(les.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-indigo-950/40 border-indigo-500/50 text-white'
                            : 'bg-[#111827] border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-indigo-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                          <div>
                            <span className="text-xs font-bold block">{les.title}</span>
                            <span className="text-[10px] text-slate-400">
                              {les.categoryName} • {les.masksCount} Vị trí Flashcard
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
                >
                  {editingClassId ? 'Lưu Thay Đổi' : 'Tạo Lớp Học Ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
