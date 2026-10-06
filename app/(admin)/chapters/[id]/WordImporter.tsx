'use client'

import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { Plus, Check, X, RefreshCw, FileText, Settings, Image as ImageIcon, Trash2 } from 'lucide-react'
import { createQuestionGroup, addQuestionVariant } from '@/app/actions/question'
import { useRouter } from 'next/navigation'

export default function WordImporter({ chapterId, onDone }: { chapterId: string, onDone: () => void }) {
  const [isParsing, setIsParsing] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const editorRef = useRef<any>(null)
  
  const getDirectImageUrl = (url: string) => {
    if (typeof url !== 'string') return url;
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (url.includes('drive.google.com') && match) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url;
  };

  const parseDomToLines = (rootNode: any) => {
    let lines: any[] = [];
    let currentLine: any = { text: "", segments: [], images: [] };
    
    const flushLine = () => {
        if (currentLine.text.trim().length > 0 || currentLine.images.length > 0) {
            lines.push(currentLine);
        }
        currentLine = { text: "", segments: [], images: [] };
    };

    const isBlock = (node: any) => {
        const tags = ['DIV', 'P', 'LI', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TR'];
        return tags.includes(node.nodeName);
    };

    const walk = (node: any) => {
        if (node.nodeName === 'IMG') {
            if (node.src) currentLine.images.push(getDirectImageUrl(node.src));
        } else if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.replace(/\u00A0/g, ' ');
            if (text.length === 0) return;
            
            let isBold = false;
            let parent = node.parentElement;
            while(parent && parent !== rootNode) {
                const style = parent.getAttribute('style') || '';
                if (parent.tagName === 'B' || parent.tagName === 'STRONG' || style.includes('font-weight: bold') || style.includes('font-weight: 700') || style.includes('color: red') || style.includes('color: rgb(255, 0, 0)')) {
                    isBold = true; 
                    break;
                }
                parent = parent.parentElement;
            }

            currentLine.text += text;
            currentLine.segments.push({ text: text, bold: isBold });
        } else if (node.nodeName === 'BR') {
            flushLine();
        } else {
            const isBlk = isBlock(node);
            if (isBlk) flushLine();
            for (let i = 0; i < node.childNodes.length; i++) walk(node.childNodes[i]);
            if (isBlk) flushLine();
        }
    };

    walk(rootNode);
    flushLine();
    return lines;
  };

  const parseQuiz = async () => {
    if (!editorRef.current) return;
    setIsParsing(true)
    
    try {
      await editorRef.current.uploadImages()
    } catch (e) {
      console.warn("Lỗi nhỏ khi ép tải ảnh:", e)
    }
    
    const editorBody = editorRef.current.getBody()
    
    try {
      const lines = parseDomToLines(editorBody)
      const questions: any[] = [];
      let currentQ: any = null;
      const fullText = lines.map(l => l.text).join('\n');
      const keySplitRegex = /(?:^|\n)(?:Đáp án|Bảng đáp án|Answer Key)[:\s]*([\s\S]*)$/i;
      const keyMatch = fullText.match(keySplitRegex);
      let answerMap: Record<string, string> = {};
      
      if (keyMatch) {
          const keyLines = keyMatch[1].split(/\n/);
          keyLines.forEach(line => {
              const matches = line.matchAll(/(?:Câu\s*)?(\d+)[\s.:-]+([A-G])/gi);
              for (const match of matches) {
                  answerMap[match[1]] = match[2].toUpperCase();
              }
          });
      }

      lines.forEach((lineObj) => {
        const lineText = lineObj.text.trim();
        if (!lineText && lineObj.images.length === 0) return;

        const qStartMatch = lineText.match(/^(?:Câu|Bài)\s*(\d+)[\s.:]+(.*)/i);
        const optMatch = lineText.match(/^([A-G])[\s.)]+(.*)/i);

        if (qStartMatch && !optMatch) {
          if (currentQ) questions.push(currentQ);
          const qNum = qStartMatch[1];
          currentQ = {
            id: parseInt(qNum) || Date.now() + Math.random(),
            number: qNum,
            text: qStartMatch[2].trim(),
            options: { A: "", B: "", C: "", D: "", E: "", F: "", G: "" },
            correct: answerMap[qNum] || null,
            images: [...lineObj.images]
          };
        } else if (optMatch && currentQ) {
          const label = optMatch[1].toUpperCase();
          let content = optMatch[2].trim();
          currentQ.options[label] = content;
          
          if (lineObj.images.length > 0) currentQ.images.push(...lineObj.images);
          
          if (!currentQ.correct) {
              let foundBoldInContent = false;
              for (let seg of lineObj.segments) {
                  if (seg.bold) {
                      const cleanSeg = seg.text.replace(/^[A-G][\s.)]*/i, '').trim();
                      if (cleanSeg.length > 0 || (seg.text.length > 3 && seg.text.includes(content))) {
                          foundBoldInContent = true; 
                          break;
                      }
                      if (content.includes(seg.text.trim()) && seg.text.trim().length > 0) {
                          foundBoldInContent = true;
                          break;
                      }
                  }
              }
              if (foundBoldInContent) {
                  currentQ.correct = label;
              }
          }
        } else if (currentQ) {
          const lastKey = ['G', 'F', 'E', 'D', 'C', 'B', 'A'].find(k => currentQ.options[k] !== "");
          if (lastKey) {
             if (lineText) currentQ.options[lastKey] += " " + lineText;
             for(let seg of lineObj.segments) {
                 if (seg.bold && seg.text.trim().length > 0) currentQ.correct = lastKey; 
             }
          } else {
             if (lineText) currentQ.text += "\n" + lineText;
          }
          if (lineObj.images.length > 0) currentQ.images.push(...lineObj.images);
        }
      });
      
      if (currentQ) questions.push(currentQ);
      setParsedQuestions(questions);
      
      if (questions.length === 0) {
        alert("Không tìm thấy câu hỏi nào. Bạn nhớ dùng định dạng 'Câu 1: ...' nhé.")
      } else {
        alert(`Đã nhận diện ${questions.length} câu!`)
      }
    } catch (e: any) {
      alert("Lỗi phân tích: " + e.message)
    }
    setIsParsing(false)
  }

  const handleSaveToDatabase = async () => {
    if (parsedQuestions.length === 0) return
    setIsSaving(true)
    try {
      // Vì lưu database chậm nên ta có thể dùng Promise.all với chunk nhỏ
      for (const q of parsedQuestions) {
        // Tạo group với tên là "Câu X"
        const groupName = `Câu ${q.number || Math.floor(Math.random()*1000)}`
        const groupId = await createQuestionGroup(chapterId, groupName, true) // skip revalidate
        
        let contentHtml = q.text
        if (q.images && q.images.length > 0) {
          contentHtml += `<br/>` + q.images.map((src:string) => `<img src="${src}" />`).join('<br/>')
        }
        
        await addQuestionVariant(groupId as string, {
          content: contentHtml,
          options: JSON.stringify(q.options),
          correctOption: q.correct || 'A',
          explanation: ''
        }, chapterId, true) // skip revalidate
      }
      
      // Refresh page
      alert("Lưu thành công vào ngân hàng!")
      onDone()
      
    } catch (e: any) {
      alert("Lỗi khi lưu: " + e.message)
    }
    setIsSaving(false)
  }

  const handleUpdateQuestion = (idx: number, field: string, value: string) => {
    const updated = [...parsedQuestions]
    if (field.includes('option_')) {
        const optKey = field.split('_')[1]
        updated[idx].options[optKey] = value
    } else if (field === 'correct') {
        updated[idx].correct = value
    } else if (field === 'text') {
        updated[idx].text = value
    }
    setParsedQuestions(updated)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-800">Nhập Từ Word</h2>
          <button onClick={onDone} className="text-slate-400 hover:text-slate-600"><X size={24}/></button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Dán đề thi của bạn vào đây (hỗ trợ cả hình ảnh & công thức). Hệ thống sẽ tự động tách câu, tách đáp án (tô đậm/đỏ là đáp án đúng).</p>
        
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
          <Editor
            onInit={(evt, editor) => editorRef.current = editor}
            apiKey="no-api-key"
            init={{
              height: 400,
              menubar: false,
              plugins: 'lists link image table code help wordcount paste',
              toolbar: 'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | bullist numlist | removeformat | help',
              content_style: 'body { font-family:Inter,sans-serif; font-size:15px; padding:20px; line-height:1.6 } img { max-width: 100%; height: auto; border-radius: 8px; margin-top: 10px; }',
              paste_data_images: true,
              automatic_uploads: true,
              images_upload_handler: (blobInfo: any, progress: any) => new Promise((resolve) => {
                 resolve('data:' + blobInfo.blob().type + ';base64,' + blobInfo.base64());
              })
            }}
          />
        </div>

        <button onClick={parseQuiz} disabled={isParsing} className="w-full bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2">
          {isParsing ? <RefreshCw className="animate-spin" /> : <FileText />}
          Phân Tích & Nhận Diện Đề
        </button>
      </div>

      {parsedQuestions.length > 0 && (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mt-6 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <h3 className="text-xl font-bold text-slate-800">Kiểm tra lại ({parsedQuestions.length} câu)</h3>
            <button onClick={handleSaveToDatabase} disabled={isSaving} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/30">
              {isSaving ? 'Đang Lưu...' : 'Lưu Vào Ngân Hàng'}
            </button>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {parsedQuestions.map((q, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 hover:bg-white transition-all">
                  <div className="mb-4 pr-8 relative">
                      <button onClick={() => setParsedQuestions(parsedQuestions.filter((_, i) => i !== idx))} className="absolute top-0 right-0 text-slate-400 hover:text-rose-500"><Trash2 size={18}/></button>
                      <label className="block text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Câu {idx + 1}</label>
                      <textarea 
                          className="w-full p-3 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white" 
                          rows={2}
                          value={q.text}
                          onChange={(e) => handleUpdateQuestion(idx, 'text', e.target.value)}
                      />
                      
                      {q.images && q.images.length > 0 && (
                          <div className="flex flex-wrap gap-3 mt-3">
                              {q.images.map((imgSrc:string, imgIdx:number) => (
                                  <img key={imgIdx} src={getDirectImageUrl(imgSrc)} alt="Img" className="max-h-32 object-contain bg-white p-1 rounded-lg border border-slate-200 shadow-sm"/>
                              ))}
                          </div>
                      )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(opt => (
                          <div key={opt} className={`flex items-center gap-3 p-2 rounded-lg border bg-white ${q.correct === opt ? 'border-emerald-400 ring-1 ring-emerald-400' : 'border-slate-200'}`}>
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${q.correct === opt ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{opt}</div>
                              <input 
                                  type="text" 
                                  className="flex-1 bg-transparent text-sm outline-none text-slate-700 font-medium"
                                  value={q.options[opt] || ""}
                                  placeholder={`Đáp án ${opt}`}
                                  onChange={(e) => handleUpdateQuestion(idx, `option_${opt}`, e.target.value)}
                              />
                              <input 
                                  type="radio" 
                                  name={`correct_${q.id || idx}`} 
                                  checked={q.correct === opt} 
                                  onChange={() => handleUpdateQuestion(idx, 'correct', opt)}
                                  className="cursor-pointer w-4 h-4 text-emerald-600"
                              />
                          </div>
                      ))}
                  </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
