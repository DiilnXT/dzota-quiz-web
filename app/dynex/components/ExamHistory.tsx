'use client'

import React from 'react'
import { Award, Clock, Calendar, CheckCircle2, XCircle, Trash2, ShieldCheck, Activity } from 'lucide-react'

interface ExamHistoryProps {
  history: any[]
  onClearHistory: () => void
}

export default function ExamHistory({ history, onClearHistory }: ExamHistoryProps) {
  if (!history || history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-12 bg-slate-900 border border-slate-800 rounded-3xl text-center space-y-3">
        <Award className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">Chưa có dữ liệu kỳ thi nào</h3>
        <p className="text-xs text-slate-400">
          Hãy vào tab <strong>Thi Chạy Trạm (20 Trạm)</strong> để trải nghiệm thử thách thi giải phẫu OSCE và ghi tên vào bảng vàng thành tích.
        </p>
      </div>
    )
  }

  const totalExams = history.length
  const avgScore = Math.round(
    history.reduce((sum, h) => sum + (h.scorePercentage || 0), 0) / totalExams
  )
  const highestScore = Math.max(...history.map(h => h.scorePercentage || 0))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-lg">
          <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-white font-mono">{totalExams}</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Lượt Thi Đã Hoàn Thành
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-lg">
          <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-400 font-mono">{avgScore}%</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Điểm Trung Bình Toàn Khoá
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-4 shadow-lg">
          <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-black text-amber-400 font-mono">{highestScore}%</div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Điểm Cao Nhất Đạt Được
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              Lịch Sử Các Kỳ Thi Chạy Trạm Đã Làm
            </h3>
            <p className="text-xs text-slate-400">
              Lưu trữ kết quả đối chiếu chi tiết từng vòng thi OSCE
            </p>
          </div>

          <button
            onClick={() => {
              if (confirm('Bạn có chắc muốn xóa toàn bộ lịch sử thi không?')) {
                onClearHistory()
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-bold hover:bg-rose-900/60 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa Lịch Sử</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0B0F19] text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 rounded-l-xl">Kỳ Thi & Thí Sinh</th>
                <th className="p-3">Số Trạm</th>
                <th className="p-3">Thời Gian / Trạm</th>
                <th className="p-3">Đúng / Tổng</th>
                <th className="p-3">Điểm Số</th>
                <th className="p-3 rounded-r-xl">Ngày Thi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {history.map((h, idx) => (
                <tr key={h.id || idx} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-semibold text-white">
                    <div>{h.candidateName || 'Thí sinh Y'}</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: {h.id}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-cyan-400">{h.totalStations} trạm</td>
                  <td className="p-3 font-mono">{h.secondsPerStation}s</td>
                  <td className="p-3 font-mono">
                    <span className="text-emerald-400 font-bold">{h.correctCount}</span> / {h.totalStations}
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                      h.scorePercentage >= 80 
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' 
                        : h.scorePercentage >= 50
                        ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/40'
                    }`}>
                      {h.scorePercentage}%
                    </span>
                  </td>
                  <td className="p-3 text-slate-400 font-mono text-[11px]">
                    {h.completedAt ? new Date(h.completedAt).toLocaleString('vi-VN') : 'Gần đây'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
