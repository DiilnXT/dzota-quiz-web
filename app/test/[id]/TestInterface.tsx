'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function TestInterface({ test }: { test: any }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(!test.password)
  const [isStarted, setIsStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(test.timeLimit * 60)
  
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showExplanation, setShowExplanation] = useState<Record<string, 'correct' | 'incorrect'>>({})
  
  useEffect(() => {
    let timer: any
    if (isStarted && !submitted && test.mode === 'exam' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isStarted, submitted, timeLeft, test.mode])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }
  
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === test.password) {
      setIsAuthenticated(true)
    } else {
      alert("Sai mật khẩu!")
    }
  }

  const handleSelectAnswer = (qId: string, optKey: string) => {
    if (submitted && test.mode === 'exam') return
    setAnswers(prev => ({ ...prev, [qId]: optKey }))
    
    if (test.mode === 'practice') {
      const q = test.questions.find((tq: any) => tq.question.id === qId).question
      if (q.correctOption === optKey) {
        setShowExplanation(prev => ({ ...prev, [qId]: 'correct' }))
      } else {
        setShowExplanation(prev => ({ ...prev, [qId]: 'incorrect' }))
      }
    }
  }

  const handleSubmit = () => {
    let correctCount = 0
    test.questions.forEach((tq: any) => {
      if (answers[tq.question.id] === tq.question.correctOption) {
        correctCount++
      }
    })
    setScore(parseFloat(((correctCount / test.questions.length) * 10).toFixed(1)))
    setSubmitted(true)
  }

  if (!test.isActive) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F2F7]">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold text-red-500 mb-3">Đã Khóa</h1>
          <p className="text-slate-500">Bài test này hiện đang bị tạm khóa.</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F2F7] p-4">
        <form onSubmit={handleAuth} className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm w-full">
          <h1 className="text-xl font-bold text-slate-800 mb-2">{test.title}</h1>
          <p className="text-slate-500 text-sm mb-6">Vui lòng nhập mật khẩu để truy cập</p>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            placeholder="Mật khẩu bài test"
            required
          />
          <button type="submit" className="w-full bg-[#007AFF] text-white py-3 rounded-xl font-bold">Xác nhận</button>
        </form>
      </div>
    )
  }

  if (!isStarted) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F2F2F7] p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">{test.title}</h1>
          <div className="flex gap-4 justify-center my-6">
            <div className="text-center">
              <div className="text-xl font-bold text-slate-800">{test.timeLimit}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Phút</div>
            </div>
            <div className="w-px bg-slate-200"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-slate-800">{test.questions.length}</div>
              <div className="text-xs font-bold text-slate-400 uppercase">Câu hỏi</div>
            </div>
          </div>
          <button onClick={() => setIsStarted(true)} className="w-full bg-[#007AFF] text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors">
            Bắt Đầu Bấm Giờ
          </button>
        </div>
      </div>
    )
  }

  if (submitted && test.mode === 'exam') {
    return (
      <div className="min-h-screen bg-[#F2F2F7] py-12 px-4 flex flex-col items-center">
        <div className="bg-white p-8 rounded-3xl shadow-sm text-center w-full max-w-2xl mb-8">
          <h2 className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-4">Hoàn Thành</h2>
          <div className="text-[80px] font-extrabold text-black leading-none mb-2 tracking-tight">
             {score}<span className="text-[32px] text-slate-300">/10</span>
          </div>
          <button onClick={() => window.location.reload()} className="mt-8 bg-slate-100 text-[#007AFF] px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
            Làm lại
          </button>
        </div>
        
        {/* Review list */}
        <div className="w-full max-w-2xl space-y-6">
          {test.questions.map((tq: any, i: number) => {
            const q = tq.question
            const userAnswer = answers[q.id]
            const isCorrect = userAnswer === q.correctOption
            const opts = JSON.parse(q.options)
            
            return (
              <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm border-l-4 overflow-hidden relative" style={{borderLeftColor: isCorrect ? '#34C759' : '#FF3B30'}}>
                <div className="flex gap-2 mb-4">
                  <span className={`font-bold flex-shrink-0 ${isCorrect ? 'text-[#34C759]' : 'text-[#FF3B30]'}`}>Câu {i + 1}:</span>
                  <div className="prose prose-sm max-w-none text-slate-800" dangerouslySetInnerHTML={{ __html: q.content }} />
                </div>
                
                <div className="space-y-2 mt-4">
                  {['A', 'B', 'C', 'D'].map(k => {
                    if (!opts[k]) return null
                    const isRightOpt = k === q.correctOption
                    const isSelected = k === userAnswer
                    
                    return (
                      <div key={k} className={`p-3 rounded-xl flex items-center
                        ${isRightOpt ? 'bg-green-50 border border-green-200' : ''}
                        ${isSelected && !isRightOpt ? 'bg-red-50 border border-red-200' : ''}
                        ${!isSelected && !isRightOpt ? 'bg-slate-50 border border-slate-100' : ''}
                      `}>
                        <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3
                          ${isRightOpt ? 'bg-[#34C759] text-white' : ''}
                          ${isSelected && !isRightOpt ? 'bg-[#FF3B30] text-white' : ''}
                          ${!isSelected && !isRightOpt ? 'bg-white text-slate-500 border border-slate-300' : ''}
                        `}>{k}</span>
                        <span className="text-sm flex-1">{opts[k]}</span>
                        {isRightOpt && <CheckCircle size={18} className="text-[#34C759]"/>}
                        {isSelected && !isRightOpt && <XCircle size={18} className="text-[#FF3B30]"/>}
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
  }

  // Active taking view
  return (
    <div className="flex flex-col h-screen bg-[#F2F2F7]">
      <div className="bg-white/90 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 flex justify-between items-center fixed top-0 w-full z-20">
        <div className="font-bold text-slate-800 truncate max-w-[50%]">{test.title}</div>
        {test.mode === 'exam' ? (
          <div className="flex items-center gap-3">
            <div className={`font-mono text-[17px] font-bold flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full ${timeLeft < 60 ? 'text-[#FF3B30] animate-pulse' : 'text-slate-800'}`}>
              <Clock size={16}/> {formatTime(timeLeft)}
            </div>
            <button onClick={handleSubmit} className="bg-[#007AFF] text-white px-4 py-1.5 rounded-full font-semibold text-sm hover:bg-blue-600 transition-colors">Nộp Bài</button>
          </div>
        ) : (
          <div className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">Chế độ luyện tập</div>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4 pt-20 max-w-3xl mx-auto w-full pb-20 space-y-6">
        {test.questions.map((tq: any, i: number) => {
          const q = tq.question
          const isSelected = answers[q.id]
          const status = showExplanation[q.id]
          const opts = JSON.parse(q.options)
          
          return (
            <div key={q.id} className="bg-white p-6 rounded-3xl shadow-sm">
              <div className="flex gap-3 mb-6">
                 <span className="flex-shrink-0 bg-[#007AFF] text-white font-bold w-8 h-8 flex items-center justify-center rounded-full text-sm">{i + 1}</span>
                 <div className="prose prose-sm max-w-none text-slate-800 pt-1" dangerouslySetInnerHTML={{ __html: q.content }} />
              </div>
              
              <div className="space-y-3">
                {['A', 'B', 'C', 'D'].map(k => {
                  if (!opts[k]) return null
                  
                  return (
                    <div key={k} onClick={() => handleSelectAnswer(q.id, k)} 
                      className={`
                        p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center
                        ${isSelected === k ? 'border-[#007AFF] bg-blue-50/50' : 'border-transparent bg-slate-50 hover:bg-slate-100'}
                        ${test.mode === 'practice' && status === 'correct' && (isSelected === k || q.correctOption === k) ? '!border-[#34C759] !bg-green-50' : ''}
                        ${test.mode === 'practice' && status === 'incorrect' && isSelected === k ? '!border-[#FF3B30] !bg-red-50' : ''}
                      `}>
                      <span className={`w-7 h-7 flex-shrink-0 rounded-full border-2 flex items-center justify-center mr-3 text-sm font-bold transition-colors
                         ${isSelected === k ? 'bg-[#007AFF] border-[#007AFF] text-white' : 'border-slate-300 text-slate-500 bg-white'}
                         ${test.mode === 'practice' && status === 'correct' && (isSelected === k || q.correctOption === k) ? '!bg-[#34C759] !border-[#34C759] !text-white' : ''}
                         ${test.mode === 'practice' && status === 'incorrect' && isSelected === k ? '!bg-[#FF3B30] !border-[#FF3B30] !text-white' : ''}
                      `}>{k}</span>
                      <span className="text-slate-800 text-sm flex-1">{opts[k]}</span>
                      {test.mode === 'practice' && status === 'correct' && (isSelected === k || q.correctOption === k) && <CheckCircle size={20} className="text-[#34C759] ml-2"/>}
                      {test.mode === 'practice' && status === 'incorrect' && isSelected === k && <XCircle size={20} className="text-[#FF3B30] ml-2"/>}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
        {test.mode === 'practice' && (
           <div className="text-center pt-4">
             <button onClick={handleSubmit} className="bg-[#007AFF] text-white px-8 py-3 rounded-xl font-bold text-lg hover:bg-blue-600 transition-colors">
               Kết Thúc & Xem Điểm
             </button>
           </div>
        )}
      </div>
    </div>
  )
}
