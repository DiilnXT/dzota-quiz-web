'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSubjectForTestCreation, createTest } from '@/app/actions/test'

export default function TestCreator({ subjects }: { subjects: any[] }) {
  const router = useRouter()
  const [selectedSubjectId, setSelectedSubjectId] = useState('')
  const [subjectDetails, setSubjectDetails] = useState<any>(null)
  
  const [title, setTitle] = useState('Bài Test Mới')
  const [timeLimit, setTimeLimit] = useState(15)
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('exam')
  
  const [chapterSettings, setChapterSettings] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  
  const handleSubjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    setSelectedSubjectId(id)
    if (!id) {
      setSubjectDetails(null)
      return
    }
    const details = await getSubjectForTestCreation(id)
    setSubjectDetails(details)
    const initSettings: Record<string, number> = {}
    details?.chapters.forEach((c: any) => initSettings[c.id] = 0)
    setChapterSettings(initSettings)
  }
  
  const handleSettingChange = (chapId: string, count: number) => {
    setChapterSettings(prev => ({ ...prev, [chapId]: count }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const testId = await createTest({
        title,
        subjectId: selectedSubjectId,
        timeLimit,
        mode,
        password,
        chapterSettings
      })
      router.push(`/test/${testId}`)
    } catch (e) {
      alert("Có lỗi xảy ra: " + e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6">Cấu Hình Chung</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Tên Bài Test</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Môn Học</label>
            <select value={selectedSubjectId} onChange={handleSubjectChange} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]">
              <option value="">-- Chọn Môn Học --</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Thời Gian (Phút)</label>
            <input type="number" min="1" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Mật Khẩu (Tùy Chọn)</label>
            <input type="text" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-600 mb-2">Chế Độ</label>
            <select value={mode} onChange={e => setMode(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF]">
              <option value="exam">Thi thử (Nộp bài mới biết điểm)</option>
              <option value="practice">Luyện tập (Biết điểm ngay)</option>
            </select>
          </div>
        </div>
      </div>

      {subjectDetails && (
        <div className="bg-white p-6 rounded-3xl shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6">Cấu Hình Rút Câu Hỏi</h2>
          <p className="text-sm text-slate-500 mb-6">Hệ thống sẽ lấy ngẫu nhiên số câu hỏi từ các chương bên dưới. Nếu có nhiều biến thể trong 1 câu, nó sẽ chọn ngẫu nhiên 1 biến thể.</p>
          
          <div className="space-y-4">
            {subjectDetails.chapters.map((chap: any) => {
              const maxQ = chap.questions.filter((g: any) => g.questions.length > 0).length
              return (
                <div key={chap.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-700">{chap.name}</h3>
                    <p className="text-xs text-slate-500 mt-1">Có tối đa {maxQ} nhóm câu hỏi hợp lệ (có chứa biến thể)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600">Số câu:</span>
                    <input 
                      type="number" 
                      min="0" 
                      max={maxQ} 
                      value={chapterSettings[chap.id] || 0}
                      onChange={e => handleSettingChange(chap.id, parseInt(e.target.value) || 0)}
                      className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-[#007AFF] text-center"
                    />
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="mt-8 flex justify-end">
            <button type="submit" disabled={loading} className="bg-[#007AFF] text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors disabled:opacity-50">
              {loading ? 'Đang Tạo...' : 'Tạo Bài Test'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
