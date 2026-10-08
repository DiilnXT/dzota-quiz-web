'use client'

import React, { useState, useEffect } from 'react'
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
  ChevronRight
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

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('ALL')

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
  const categories = ['ALL', ...Array.from(new Set(studyData.assignedQuizzes.map(q => q.category).filter(Boolean)))]

  // Lọc danh sách đề thi theo tìm kiếm & môn học
  const filteredQuizzes = studyData.assignedQuizzes.filter(q => {
    const matchSearch = (q.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (q.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategory = selectedCategory === 'ALL' || q.category === selectedCategory
    return matchSearch && matchCategory
  })

  const completedCount = studyData.assignedQuizzes.filter(q => q.hasTaken).length

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
        </div>
        <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6 text-left">
      {/* ─── BANNER CHÀO MỪNG ─── */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-6 sm:p-7 text-white shadow-lg shadow-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
              <GraduationCap size={28} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-extrabold tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                  Cổng Rèn Luyện Học Sinh
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">
                Góc Học Tập & Luyện Đề Của Bạn
              </h2>
              <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl leading-relaxed">
                Theo dõi các bài thi được phân công từ lớp học, luyện tập rèn luyện kiến thức và xem lại lịch sử làm bài để bứt phá điểm số.
              </p>
            </div>
          </div>

          <button
            onClick={fetchStudyData}
            className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-2 transition active:scale-95 cursor-pointer flex-shrink-0"
          >
            <RotateCcw size={14} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>
      </div>

      {/* ─── STATS CARDS ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <School size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Lớp học tham gia</p>
            <p className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {studyData.enrolledClasses.length} lớp
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <BookOpen size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bài thi được giao</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
              {studyData.assignedQuizzes.length} bài
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã hoàn thành</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {completedCount} / {studyData.assignedQuizzes.length}
            </p>
          </div>
        </div>
      </div>

      {/* ─── SECTION 1: LỚP HỌC ĐANG THAM GIA ─── */}
      {studyData.enrolledClasses.length > 0 && (
        <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-xs">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
            <School size={18} className="text-blue-600 dark:text-blue-400" />
            Lớp Học & Giáo Viên Phụ Trách ({studyData.enrolledClasses.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {studyData.enrolledClasses.map(cls => (
              <div
                key={cls.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                      {cls.name}
                    </h4>
                    <span className="text-[11px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-2 py-0.5 rounded-lg">
                      Đang tham gia
                    </span>
                  </div>
                  {cls.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {cls.description}
                    </p>
                  )}
                </div>

                <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="text-slate-600 dark:text-slate-300 font-medium">
                    👨‍🏫 Giáo viên: <strong className="text-slate-800 dark:text-slate-100">{cls.teacher?.name || cls.teacher?.username || 'Thầy/Cô'}</strong>
                  </div>
                  {cls.allowedSubjects && cls.allowedSubjects.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-slate-400">Môn:</span>
                      {cls.allowedSubjects.map((s: string) => (
                        <span key={s} className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── SECTION 2: BẢNG DANH SÁCH BÀI THI & ĐỀ ĐƯỢC CẤP PHÉP ─── */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
              <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
              Danh Sách Đề Thi Cấp Phép & Phân Công ({filteredQuizzes.length})
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Bấm vào "Làm bài" để chuyển ngay đến giao diện làm bài thi trực tuyến
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Tìm tên đề thi..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-indigo-600 text-slate-800 dark:text-slate-100"
              />
            </div>

            {categories.length > 2 && (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-600 cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'Tất cả môn học' : `Môn: ${c}`}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Quizzes Table */}
        {filteredQuizzes.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <BookOpen size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Chưa tìm thấy bài thi phù hợp</p>
            <p className="text-xs text-slate-400 mt-0.5">Khi giáo viên thêm bạn vào lớp hoặc chia sẻ đề thi, các bài test sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3 px-3">Tên Bài Thi</th>
                  <th className="py-3 px-3">Môn Học</th>
                  <th className="py-3 px-3 hidden md:table-cell">Lớp / Phân Quyền</th>
                  <th className="py-3 px-3">Điểm Từng Làm</th>
                  <th className="py-3 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredQuizzes.map(quiz => (
                  <tr key={quiz.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Tên bài thi */}
                    <td className="py-3 px-3">
                      <div className="font-extrabold text-slate-800 dark:text-slate-100 text-xs sm:text-sm line-clamp-1">
                        {quiz.title}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>⏱️ {quiz.timeLimit} phút</span>
                        <span>•</span>
                        <span>📝 {quiz.questionsCount} câu hỏi</span>
                        <span>•</span>
                        <span>Tác giả: {quiz.author}</span>
                      </div>
                    </td>

                    {/* Môn học */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg text-[11px]">
                        {quiz.category}
                      </span>
                    </td>

                    {/* Phân quyền */}
                    <td className="py-3 px-3 hidden md:table-cell whitespace-nowrap">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">
                        {quiz.assignedClass}
                      </span>
                    </td>

                    {/* Điểm từng làm */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {quiz.hasTaken ? (
                        <div>
                          <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl text-xs">
                            <Award size={13} />
                            {quiz.highestScore} / 10
                          </span>
                          <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                            Đã làm {quiz.attempts} lượt
                          </div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg text-[11px]">
                          Chưa làm
                        </span>
                      )}
                    </td>

                    {/* Nút Làm bài */}
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <a
                        href={quiz.link}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition active:scale-95 shadow-xs"
                      >
                        <Play size={12} fill="currentColor" />
                        <span>{quiz.hasTaken ? 'Làm lại' : 'Làm bài'}</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── SECTION 3: LỊCH SỬ LÀM BÀI ─── */}
      <div className="bg-white dark:bg-[#1E293B] rounded-3xl p-5 sm:p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
          <Clock size={18} className="text-purple-600 dark:text-purple-400" />
          <span>Lịch Sử Làm Bài Gần Đây ({studyData.history.length})</span>
          <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Lưu trữ 3 ngày</span>
        </h3>

        {studyData.history.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <Clock size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="font-bold text-slate-600 dark:text-slate-300 text-sm">Chưa có lượt nộp bài nào</p>
            <p className="text-xs text-slate-400 mt-0.5">Bấm vào bất kỳ bài thi nào ở bảng trên để bắt đầu làm bài!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-extrabold text-[11px]">
                  <th className="py-3 px-3">Bài Thi</th>
                  <th className="py-3 px-3">Thời Gian Nộp</th>
                  <th className="py-3 px-3">Kết Quả Điểm Số</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Thời Gian Làm</th>
                  <th className="py-3 px-3 text-right">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {studyData.history.slice(0, 15).map((h, i) => {
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
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {h.quizTitle}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`inline-block font-black px-2.5 py-0.5 rounded-lg text-xs ${
                          h.score >= 8
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                            : h.score >= 5
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}>
                          {h.score} / 10 ({h.correctCount}/{h.totalCount} câu)
                        </span>
                      </td>
                      <td className="py-3 px-3 hidden sm:table-cell text-slate-500 whitespace-nowrap">
                        {timeSpentMins > 0 ? `${timeSpentMins}m ${timeSpentSecs}s` : `${timeSpentSecs}s`}
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <a
                          href={`/?id=${h.quizId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                        >
                          <RotateCcw size={12} />
                          <span>Làm lại bài</span>
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
    </div>
  )
}
