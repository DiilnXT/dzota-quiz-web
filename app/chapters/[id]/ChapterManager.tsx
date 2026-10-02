'use client'

import { useState, useRef } from 'react'
import { Plus, Trash2, Edit3, Image as ImageIcon } from 'lucide-react'
import { Editor } from '@tinymce/tinymce-react'
import { createQuestionGroup, deleteQuestionGroup, addQuestionVariant, deleteQuestionVariant } from '@/app/actions/question'

export default function ChapterManager({ chapter }: { chapter: any }) {
  const [newGroupName, setNewGroupName] = useState('')
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  
  // States for new variant
  const [content, setContent] = useState('')
  const [options, setOptions] = useState({ A: '', B: '', C: '', D: '' })
  const [correctOption, setCorrectOption] = useState('A')
  
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName) return
    await createQuestionGroup(chapter.id, newGroupName)
    setNewGroupName('')
  }
  
  const handleAddVariant = async () => {
    if (!activeGroupId || !content) return
    await addQuestionVariant(
      activeGroupId, 
      {
        content,
        options: JSON.stringify(options),
        correctOption,
        explanation: ''
      }, 
      chapter.id
    )
    setContent('')
    setOptions({ A: '', B: '', C: '', D: '' })
  }

  return (
    <div className="space-y-8">
      {/* Thêm Nhóm Câu Hỏi */}
      <div className="bg-white p-6 rounded-3xl shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Thêm Nhóm Câu Hỏi</h2>
        <p className="text-sm text-slate-500 mb-4">Một nhóm câu hỏi (VD: "Câu 1 - Đạo hàm") có thể chứa nhiều biến thể. Khi tạo đề thi, hệ thống sẽ random 1 biến thể trong nhóm.</p>
        <form onSubmit={handleCreateGroup} className="flex gap-4">
          <input 
            type="text" 
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
            placeholder="Tên nhóm câu hỏi (VD: Nhóm 1 - Tìm m để hàm số đồng biến)" 
            required
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent transition-all"
          />
          <button type="submit" className="bg-[#007AFF] text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-600 transition-colors">
            <Plus size={20} /> Thêm Nhóm
          </button>
        </form>
      </div>

      {/* Danh sách các nhóm */}
      <div className="space-y-6">
        {chapter.questions.map((group: any) => (
          <div key={group.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">{group.name}</h3>
              <div className="flex gap-3">
                <button 
                  onClick={() => setActiveGroupId(activeGroupId === group.id ? null : group.id)}
                  className="bg-blue-50 text-[#007AFF] px-4 py-2 rounded-lg font-semibold text-sm hover:bg-blue-100 transition-colors"
                >
                  {activeGroupId === group.id ? 'Đóng' : '+ Thêm Biến Thể'}
                </button>
                <button 
                  onClick={() => deleteQuestionGroup(group.id, chapter.id)}
                  className="w-10 h-10 rounded-lg text-slate-400 hover:text-[#FF3B30] hover:bg-red-50 flex items-center justify-center transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            {activeGroupId === group.id && (
              <div className="mb-8 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="font-bold text-slate-700 mb-4">Thêm biến thể mới</h4>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-600 mb-2">Nội dung câu hỏi</label>
                  <Editor
                    apiKey="no-api-key"
                    value={content}
                    onEditorChange={(newContent) => setContent(newContent)}
                    init={{
                      height: 250,
                      menubar: false,
                      plugins: ['lists', 'link', 'image'],
                      toolbar: 'undo redo | bold italic | alignleft aligncenter alignright | bullist numlist | image',
                      content_style: 'body { font-family:Inter,sans-serif; font-size:14px }'
                    }}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <div key={opt} className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name={`correct-${group.id}`}
                        checked={correctOption === opt}
                        onChange={() => setCorrectOption(opt)}
                        className="w-5 h-5 text-[#007AFF] focus:ring-[#007AFF]"
                      />
                      <span className="font-bold text-slate-600">{opt}.</span>
                      <input 
                        type="text"
                        value={(options as any)[opt]}
                        onChange={e => setOptions({...options, [opt]: e.target.value})}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                        placeholder={`Đáp án ${opt}`}
                      />
                    </div>
                  ))}
                </div>
                <button onClick={handleAddVariant} className="bg-[#007AFF] text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600">
                  Lưu Biến Thể
                </button>
              </div>
            )}

            <div className="space-y-4">
              {group.questions.map((q: any, idx: number) => {
                const opts = JSON.parse(q.options)
                return (
                  <div key={q.id} className="p-4 bg-white border border-slate-200 rounded-2xl flex justify-between gap-4">
                    <div className="flex-1">
                      <div className="font-bold text-[#007AFF] mb-2">Biến thể {idx + 1}:</div>
                      <div className="prose prose-sm max-w-none mb-3" dangerouslySetInnerHTML={{ __html: q.content }} />
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {['A', 'B', 'C', 'D'].map(k => (
                          <div key={k} className={`p-2 rounded-md border ${q.correctOption === k ? 'bg-green-50 border-green-200 font-medium text-green-800' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
                            <span className="font-bold mr-2">{k}.</span>
                            {opts[k]}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => deleteQuestionVariant(q.id, chapter.id)} className="text-slate-400 hover:text-red-500 self-start">
                      <Trash2 size={18} />
                    </button>
                  </div>
                )
              })}
              {group.questions.length === 0 && (
                <div className="text-sm text-slate-400 text-center py-4">Chưa có biến thể nào. Hãy thêm ít nhất 1 biến thể.</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
