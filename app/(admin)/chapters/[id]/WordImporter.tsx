'use client'

import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tinymce/tinymce-react'
import { Plus, Check, X, RefreshCw, FileText, Settings, Image as ImageIcon, Trash2, Sparkles, BookOpen, Copy, ChevronDown } from 'lucide-react'
import { createQuestionGroup, addQuestionVariant } from '@/app/actions/question'
import { useRouter } from 'next/navigation'

export default function WordImporter({ chapterId, onDone }: { chapterId: string, onDone: () => void }) {
  const [isParsing, setIsParsing] = useState(false)
  const [parsedQuestions, setParsedQuestions] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [importFormatMode, setImportFormatMode] = useState('auto')
  const [showGuideModal, setShowGuideModal] = useState(false)
  const editorRef = useRef<any>(null)
  
  const getDirectImageUrl = (url: string) => {
    if (typeof url !== 'string') return url;
    const match = url.match(/id=([a-zA-Z0-9_-]+)/);
    if (url.includes('drive.google.com') && match) {
        return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    return url;
  };

  const isNonDefaultColor = (col: string) => {
    if (!col) return false;
    const c = col.trim().toLowerCase();
    return !['inherit', 'initial', 'unset', 'black', '#000', '#000000', 'rgb(0, 0, 0)', 'rgb(0,0,0)', 'rgb(30, 41, 59)', 'rgb(51, 65, 85)', 'rgb(15, 23, 42)', '#334155', '#1e293b', '#0f172a', '#374151', '#475569'].includes(c);
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
            let isUnderline = false;
            let detectedColor = '';
            let parent = node.parentElement;
            while(parent && parent !== rootNode) {
                const style = (parent.getAttribute('style') || '').toLowerCase();
                if (parent.tagName === 'B' || parent.tagName === 'STRONG' || 
                    style.includes('font-weight: bold') || style.includes('font-weight: 700') || 
                    style.includes('font-weight: 800') || style.includes('font-weight: 900')) {
                    isBold = true; 
                }
                if (parent.tagName === 'U' || style.includes('text-decoration: underline') || style.includes('text-decoration-line: underline')) {
                    isUnderline = true;
                }
                if (!detectedColor) {
                    const colorMatch = style.match(/(?:^|;\s*)color\s*:\s*([^;]+)/i);
                    if (colorMatch && isNonDefaultColor(colorMatch[1])) {
                        detectedColor = colorMatch[1].trim().toLowerCase();
                    } else if (parent.getAttribute('color') && isNonDefaultColor(parent.getAttribute('color'))) {
                        detectedColor = parent.getAttribute('color').trim().toLowerCase();
                    }
                }
                parent = parent.parentElement;
            }

            currentLine.text += text;
            currentLine.segments.push({ 
                text: text, 
                bold: isBold, 
                underline: isUnderline, 
                color: detectedColor 
            });
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

  const extractQuestionHeader = (lineText: string, optMatch: any, currentCounter: number) => {
    if (optMatch) return null;
    const trimmed = (lineText || '').trim();
    if (!trimmed) return null;
    if (/^[-*_]{3,}$/.test(trimmed)) return null;

    let m = trimmed.match(/^(?:#{1,6}\s*)?(?:\*\*)?(?:\[\s*)?(?:Câu|Bài)\s*(\d+)[\s.:\]*-]+(.*)$/i);
    if (m) {
        let qNum = m[1];
        let qText = (m[2] || '').trim().replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\]$/, '').trim();
        if (/^\[(.*)\]$/.test(qText) && !qText.includes('][') && !qText.includes('],[')) {
            qText = qText.replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();
        }
        return { number: qNum, text: qText };
    }

    m = trimmed.match(/^(?:#{1,6}\s*)?(?:\[\s*)?(\d+)[\s.:)\/*\]-]+(?!\s*[A-G][\s.):\/*])(.*)$/i);
    if (m) {
        let qNum = m[1];
        let qText = (m[2] || '').trim().replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\]$/, '').trim();
        if (/^\[(.*)\]$/.test(qText) && !qText.includes('][') && !qText.includes('],[')) {
            qText = qText.replace(/^\[\s*/, '').replace(/\s*\]$/, '').trim();
        }
        return { number: qNum, text: qText };
    }

    m = trimmed.match(/^\[\s*(.*?)\s*\]$/);
    if (m && m[1].length > 2) {
        const inner = m[1].trim();
        const numInBracket = inner.match(/(?:câu|bài)\s*(\d+)/i) || inner.match(/^(\d+)[\s.:]+/);
        const qNum = numInBracket ? numInBracket[1] : String((currentCounter || 0) + 1);
        let qText = inner;
        if (numInBracket) {
            qText = inner.replace(/(?:\[\s*)?(?:Câu|Bài)\s*\d+[\s.:\]*-]*/i, '').replace(/^\d+[\s.:\/*-]+/, '').trim();
        }
        return { number: qNum, text: qText || inner };
    }

    return null;
  };

  const extractOptionMatch = (lineText: string) => {
    if (!lineText) return null;
    return lineText.match(/^[-*•~]?\s*(?:\*\*)?(?:\[|\()?\s*([A-G])\s*(?:\]|\))?[\s.):\/*-]+(?:\*\*)?\s*(.*)$/i);
  };

  const checkOptionAttributes = (lineObj: any, label: string, optContent: string, formatMode: string) => {
    const lineText = (lineObj.text || '').trim();
    const segments = lineObj.segments || [];

    const isLineWrappedInBold = (lineText.startsWith('**') && lineText.endsWith('**') && lineText.length > 4) ||
                                (lineText.startsWith('__') && lineText.endsWith('__') && lineText.length > 4);
    const isLetterBoldInText = /^\s*[*_]{2}\s*[A-G]/i.test(lineText) ||
                               /^\s*[*_]{1,2}\s*[A-G]\s*[*_]{1,2}[\s.):\/*]+/i.test(lineText);
    const hasBoldLetterSeg = segments.some((seg: any) => seg.bold && /^[A-G][\s.):\/*]*/i.test(seg.text.trim()));
    const hasBoldContentSeg = segments.some((seg: any) => seg.bold && (
        seg.text.replace(/^[A-G][\s.):\/*]*/i, '').trim().length > 0 ||
        (optContent && optContent.includes(seg.text.trim()) && seg.text.trim().length > 0)
    ));
    const isContentBoldInText = /^\s*[-*•~]?\s*(?:\*\*)?[A-G][\s.):\/*]+(?:\*\*)?\s*[*_]{2}(.*?)[*_]{2}\s*$/i.test(lineText);

    const isBold = isLineWrappedInBold || isLetterBoldInText || hasBoldLetterSeg || hasBoldContentSeg || isContentBoldInText;

    let detectedColor = '';
    for (let seg of segments) {
        if (seg.color && isNonDefaultColor(seg.color)) {
            detectedColor = seg.color;
            break;
        }
    }
    const hasColor = Boolean(detectedColor);
    const isUnderline = segments.some((seg: any) => seg.underline) || /<u>/i.test(lineText);
    const hasAsterisk = /^\s*\*+\s*[A-G]/i.test(lineText) || lineText.startsWith('*');
    const hasExplicitTag = /\((?:đúng|đáp án đúng|chính xác|correct|true)\)|\[x\]/i.test(lineText);

    return {
        label,
        isBold,
        hasBoldLetter: isLetterBoldInText || hasBoldLetterSeg,
        isLineWrappedInBold,
        hasColor,
        color: detectedColor,
        isUnderline,
        hasAsterisk,
        hasExplicitTag
    };
  };

  const finalizeQuestion = (q: any, optAttrsMap: Record<string, any>, formatMode: string, answerMap: Record<string, string>) => {
    if (!q) return;
    const qNum = String(q.number);
    const optKeys = Object.keys(q.options).filter(k => q.options[k] && q.options[k].trim());
    if (optKeys.length === 0) return;

    if (formatMode === 'key_table') {
        if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum];
        return;
    }

    if (formatMode === 'bold') {
        const boldKey = optKeys.find(k => optAttrsMap[k]?.isBold);
        if (boldKey) q.correct = boldKey;
        else if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum];
        return;
    }

    if (formatMode === 'color') {
        const coloredKey = optKeys.find(k => optAttrsMap[k]?.hasColor);
        if (coloredKey) q.correct = coloredKey;
        else if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum];
        return;
    }

    if (formatMode === 'underline') {
        const uKey = optKeys.find(k => optAttrsMap[k]?.isUnderline);
        if (uKey) q.correct = uKey;
        else if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum];
        return;
    }

    if (formatMode === 'asterisk') {
        const astKey = optKeys.find(k => optAttrsMap[k]?.hasAsterisk);
        if (astKey) q.correct = astKey;
        else if (answerMap && answerMap[qNum]) q.correct = answerMap[qNum];
        return;
    }

    // Default 'auto'
    const tagKey = optKeys.find(k => optAttrsMap[k]?.hasExplicitTag);
    if (tagKey) { q.correct = tagKey; return; }

    const astKey = optKeys.find(k => optAttrsMap[k]?.hasAsterisk);
    if (astKey) { q.correct = astKey; return; }

    const coloredKeys = optKeys.filter(k => optAttrsMap[k]?.hasColor);
    if (coloredKeys.length === 1) {
        q.correct = coloredKeys[0];
        return;
    } else if (coloredKeys.length > 1 && coloredKeys.length < optKeys.length) {
        const colorCounts: Record<string, number> = {};
        optKeys.forEach(k => {
            const col = optAttrsMap[k]?.color || 'default';
            colorCounts[col] = (colorCounts[col] || 0) + 1;
        });
        const majorityCol = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a])[0];
        const minorityKey = optKeys.find(k => (optAttrsMap[k]?.color || 'default') !== majorityCol && optAttrsMap[k]?.hasColor);
        if (minorityKey) {
            q.correct = minorityKey;
            return;
        }
    }

    const uKeys = optKeys.filter(k => optAttrsMap[k]?.isUnderline);
    if (uKeys.length === 1) {
        q.correct = uKeys[0];
        return;
    }

    const boldKeys = optKeys.filter(k => optAttrsMap[k]?.isBold);
    if (boldKeys.length === 1) {
        q.correct = boldKeys[0];
        return;
    }

    if (answerMap && answerMap[qNum]) {
        q.correct = answerMap[qNum];
        return;
    }
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
      let currentQOptAttrs: Record<string, any> = {};
      let qCounter = 0;
      const fullText = lines.map(l => l.text).join('\n');
      let answerMap: Record<string, string> = {};
      
      try {
          const keyMatch = fullText.match(/(?:^|\n)(?:Đáp án|Bảng đáp án|Answer Key|Key|Đáp án đúng)[:\s]*([\s\S]*)$/i);
          if (keyMatch) {
              for (const match of keyMatch[1].matchAll(/(?:Câu\s*)?(\d+(?:\.\d+)?)[\s.:\/-]+([A-G])(?:\b|\.|\s|$)/gi)) {
                  answerMap[match[1]] = match[2].toUpperCase();
              }
          }
      } catch (e) {}

      const flushCurrentQ = () => {
          if (!currentQ) return;
          finalizeQuestion(currentQ, currentQOptAttrs, importFormatMode, answerMap);
          questions.push(currentQ);
          currentQ = null;
          currentQOptAttrs = {};
      };

      lines.forEach((lineObj) => {
        const lineText = lineObj.text.trim();
        if (!lineText && lineObj.images.length === 0) return;

        const optMatch = extractOptionMatch(lineText);
        const qHeader = extractQuestionHeader(lineText, optMatch, qCounter);

        if (qHeader && !optMatch) {
          flushCurrentQ();
          qCounter++;
          const qNum = qHeader.number || String(qCounter);
          currentQ = {
            id: parseInt(qNum) || Date.now() + Math.random(),
            number: qNum,
            text: qHeader.text,
            options: { A: "", B: "", C: "", D: "", E: "", F: "", G: "" },
            correct: null,
            images: [...lineObj.images]
          };
          currentQOptAttrs = {};
        } else if (optMatch && currentQ) {
          const label = optMatch[1].toUpperCase();
          let content = optMatch[2].trim();
          currentQ.options[label] = content;
          if (lineObj.images.length > 0) currentQ.images.push(...lineObj.images);
          currentQOptAttrs[label] = checkOptionAttributes(lineObj, label, content, importFormatMode);
        } else if (currentQ) {
          const optLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
          const optIndices: any[] = [];
          optLetters.forEach(ltr => {
            const reg = new RegExp(`(?:^|\\s)(?:[*_]{0,2})(${ltr})[\\s.):/\\*-]+(?:[*_]{0,2})`, 'gi');
            let m;
            while ((m = reg.exec(lineText)) !== null) {
              optIndices.push({ letter: ltr, index: m.index, matchLen: m[0].length });
            }
          });

          if (optIndices.length >= 2) {
            optIndices.sort((a, b) => a.index - b.index);
            for (let idx = 0; idx < optIndices.length; idx++) {
              const curr = optIndices[idx];
              const startPos = curr.index + curr.matchLen;
              const endPos = (idx + 1 < optIndices.length) ? optIndices[idx + 1].index : lineText.length;
              const chunk = lineText.substring(curr.index, endPos).trim();
              let content = lineText.substring(startPos, endPos).trim().replace(/^\*\*/, '').replace(/\*\*$/, '');
              content = content.replace(/\s*\((?:đúng|đáp án đúng|chính xác|correct|true)\)/i, '').replace(/\s*\[x\]/i, '').trim();
              currentQ.options[curr.letter] = content;
              const isChunkBold = /^\s*[*_]{2}/.test(chunk) || chunk.endsWith('**') || /\((?:đúng|đáp án đúng|chính xác|correct|true)\)/i.test(chunk);
              currentQOptAttrs[curr.letter] = {
                label: curr.letter,
                isBold: isChunkBold,
                hasBoldLetter: isChunkBold,
                hasColor: false,
                color: '',
                isUnderline: false,
                hasAsterisk: chunk.startsWith('*'),
                hasExplicitTag: /\((?:đúng|đáp án đúng|chính xác|correct|true)\)|\[x\]/i.test(chunk)
              };
            }
          } else {
            const lastKey = ['G', 'F', 'E', 'D', 'C', 'B', 'A'].find(k => currentQ.options[k] !== "");
            if (lastKey) {
               if (lineText) currentQ.options[lastKey] += " " + lineText;
               const lineAttrs = checkOptionAttributes(lineObj, lastKey, lineText, importFormatMode);
               if (lineAttrs.isBold) currentQOptAttrs[lastKey].isBold = true;
               if (lineAttrs.hasColor) { currentQOptAttrs[lastKey].hasColor = true; currentQOptAttrs[lastKey].color = lineAttrs.color; }
               if (lineAttrs.isUnderline) currentQOptAttrs[lastKey].isUnderline = true;
            } else if (lineText) {
               currentQ.text += "\n" + lineText;
            }
            if (lineObj.images.length > 0) currentQ.images.push(...lineObj.images);
          }
        }
      });
      
      flushCurrentQ();
      setParsedQuestions(questions);
      
      if (questions.length === 0) {
        alert("Không tìm thấy câu hỏi nào. Hãy kiểm tra lại định dạng đề hoặc bấm 'Xem Hướng Dẫn'!")
      } else {
        const withAns = questions.filter(q => q.correct).length;
        alert(`Đã nhận diện thành công ${questions.length} câu hỏi (${withAns} câu có đáp án)!`)
      }
    } catch(err: any) {
      alert("Lỗi khi phân tích: " + err.message);
    }
    setIsParsing(false);
  };

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

  const handlePasteSampleQuizToEditor = () => {
    const sampleHtml = `<p><strong>[Câu 1]</strong> Thủ đô của Việt Nam là gì?</p>
<p><strong>A.</strong> Hà Nội</p>
<p>B. TP. Hồ Chí Minh</p>
<p>C. Đà Nẵng</p>
<p>D. Cần Thơ</p>
<p>&nbsp;</p>
<p>Câu 2: [Phương trình nào sau đây có nghiệm x = 2?]</p>
<p>A. 2x - 3 = 0</p>
<p><span style="color: #e02424;"><strong>B. x + 3 = 5</strong></span></p>
<p>C. x - 5 = 0</p>
<p>D. 3x = 9</p>
<p>&nbsp;</p>
<p>3. [Trong các chất sau, chất nào là kim loại dẫn điện tốt nhất?]</p>
<p>A. Đồng</p>
<p>B. Vàng</p>
<p><u>C. Bạc</u></p>
<p>D. Nhôm</p>
<p>&nbsp;</p>
<p>Câu 4. [Khí nào chiếm thể tích lớn nhất trong không khí?]</p>
<p>*A. Nitơ (N2)</p>
<p>B. Oxi (O2)</p>
<p>C. Cacbonic (CO2)</p>
<p>D. Argon (Ar)</p>`;
    if (editorRef.current) {
      editorRef.current.setContent(sampleHtml);
    }
    setShowGuideModal(false);
  };

  const handleCopySampleQuiz = () => {
    const textSample = `[Câu 1] Thủ đô của Việt Nam là gì?
A. Hà Nội (đúng)
B. TP. Hồ Chí Minh
C. Đà Nẵng
D. Cần Thơ

Câu 2: [Phương trình nào sau đây có nghiệm x = 2?]
A. 2x - 3 = 0
**B. x + 3 = 5**
C. x - 5 = 0
D. 3x = 9

3. [Trong các chất sau, chất nào là kim loại dẫn điện tốt nhất?]
A. Đồng
B. Vàng
*C. Bạc
D. Nhôm

Câu 4. [Khí nào chiếm thể tích lớn nhất trong không khí?]
*A. Nitơ (N2)
B. Oxi (O2)
C. Cacbonic (CO2)
D. Argon (Ar)`;
    navigator.clipboard.writeText(textSample);
    alert("Đã sao chép nội dung đề thi mẫu vào bộ nhớ tạm!");
  };

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

        {/* THANH ĐIỀU HƯỚNG NHẬN DIỆN & PHÂN TÍCH (TỐI GIẢN & ĐẸP) */}
        <div className="mb-3 p-2.5 sm:p-3 rounded-2xl bg-slate-50/90 border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 sm:gap-3 transition-all hover:border-slate-300">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-white text-indigo-600 border border-slate-200/80 shadow-xs flex items-center justify-center shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-[11px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0 hidden xs:inline">Nhận diện:</span>
              <div className="relative flex-1 min-w-[170px] max-w-full sm:max-w-xs md:max-w-sm">
                <select
                  value={importFormatMode}
                  onChange={(e) => setImportFormatMode(e.target.value)}
                  className="w-full appearance-none bg-white hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2 pr-8 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-xs transition cursor-pointer truncate"
                >
                  <option value="auto">⚡ Tự động nhận diện (Khuyên dùng)</option>
                  <option value="bold">🔤 In đậm: A. hoặc cả phương án</option>
                  <option value="bold_letter">🔤 In đậm chữ cái đầu: A. B. C. D.</option>
                  <option value="color">🎨 Màu chữ: Đỏ / Xanh khác biệt</option>
                  <option value="underline">✍️ Gạch chân: Đáp án đúng</option>
                  <option value="asterisk">⭐ Dấu sao: *A, *B, *C, *D</option>
                  <option value="bracket">🔲 Ngoặc vuông: [Nội dung câu]</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
                  <ChevronDown size={14} />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGuideModal(true)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-200 text-slate-600 hover:text-indigo-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer shrink-0"
              title="Xem hướng dẫn chi tiết quy tắc nhập đề & xem đề mẫu"
            >
              <BookOpen size={15} />
              <span>Hướng dẫn</span>
            </button>

            <button
              onClick={parseQuiz}
              disabled={isParsing}
              className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isParsing ? <RefreshCw className="animate-spin" size={15} /> : <FileText size={15} />}
              <span>{isParsing ? 'Đang phân tích...' : 'Phân tích đề thi'}</span>
            </button>
          </div>
        </div>

        {/* Gợi ý 1 dòng tối giản */}
        <div className="mb-4 px-1 flex flex-wrap items-center justify-between text-[11px] sm:text-xs text-slate-400 gap-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
            <span className="truncate">Hỗ trợ nhận diện chữ in đậm, màu chữ đỏ/xanh, gạch chân & hình ảnh.</span>
          </div>
          <button
            type="button"
            onClick={() => setShowGuideModal(true)}
            className="text-indigo-600 hover:text-indigo-700 font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
          >
            Xem quy tắc & đề mẫu
          </button>
        </div>
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

      {/* MODAL HƯỚNG DẪN TẠO ĐỀ THI & QUY TẮC NHẬN DIỆN */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-slate-50 rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Hướng Dẫn Tạo Đề Thi & Quy Tắc Nhận Diện</h3>
                  <p className="text-xs text-slate-500">Chuẩn hóa đề thi trắc nghiệm từ Word, Docs hoặc văn bản sao chép</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed custom-scrollbar">
              {/* Mục 1: Định dạng câu hỏi */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center">1</span>
                  <h4 className="font-bold text-slate-800 text-base">Quy tắc nhận diện Câu Hỏi</h4>
                </div>
                <p className="text-xs text-slate-500 mb-3">Hệ thống AI & Regex nhận diện linh hoạt mọi định dạng câu hỏi phổ biến:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-emerald-700 font-bold block mb-1">✔ Dạng đóng khung ngoặc vuông:</span>
                    <span className="text-slate-700 block">1. [Nội dung câu 1]</span>
                    <span className="text-slate-700 block">[Nội dung câu hỏi]</span>
                    <span className="text-slate-700 block">Câu 1. [Nội dung câu 1]</span>
                    <span className="text-slate-700 block">Câu 1: [Nội dung câu 1]</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-indigo-700 font-bold block mb-1">✔ Dạng tiêu chuẩn đề thi:</span>
                    <span className="text-slate-700 block">Câu 1: Nội dung câu hỏi...</span>
                    <span className="text-slate-700 block">Câu 1. Nội dung câu hỏi...</span>
                    <span className="text-slate-700 block">1. Nội dung câu hỏi...</span>
                    <span className="text-slate-700 block">Bài 1: / Question 1: ...</span>
                  </div>
                </div>
              </div>

              {/* Mục 2: Nhận diện phương án & đáp án đúng */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">2</span>
                  <h4 className="font-bold text-slate-800 text-base">Quy tắc nhận diện Phương Án & Đáp Án Đúng</h4>
                </div>
                <p className="text-xs text-slate-500 mb-3">Hỗ trợ 4 phương án A, B, C, D (hoặc đến G). Đáp án đúng được nhận diện tự động qua:</p>
                
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">A</span>
                    <div>
                      <strong className="text-emerald-900">In đậm toàn bộ phương án hoặc in đậm chữ cái đầu:</strong>
                      <p className="text-slate-600 mt-0.5 font-mono">Ví dụ: <strong>A. Hà Nội</strong> hoặc <strong>**A.**</strong> Hà Nội hoặc <strong>A.</strong> Hà Nội</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-rose-50/50 border border-rose-100">
                    <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-800 font-bold flex items-center justify-center shrink-0">B</span>
                    <div>
                      <strong className="text-rose-900">Màu chữ khác biệt so với các phương án còn lại:</strong>
                      <p className="text-slate-600 mt-0.5">Tô màu chữ Đỏ, Xanh Dương, hoặc bất kỳ màu nổi bật nào trên Word/Google Docs.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-50/50 border border-amber-100">
                    <span className="w-5 h-5 rounded-md bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">C</span>
                    <div>
                      <strong className="text-amber-900">Gạch chân phương án đúng:</strong>
                      <p className="text-slate-600 mt-0.5 font-mono">Ví dụ: <u>A. Hà Nội</u> (dùng phím Ctrl + U trong Word)</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50/50 border border-blue-100">
                    <span className="w-5 h-5 rounded-md bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0">D</span>
                    <div>
                      <strong className="text-blue-900">Dấu sao (*) hoặc nhãn (đúng):</strong>
                      <p className="text-slate-600 mt-0.5 font-mono">Ví dụ: *A. Hà Nội hoặc A. Hà Nội (đúng)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mục 3: Đề thi mẫu */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-black text-xs flex items-center justify-center">3</span>
                    <h4 className="font-bold text-slate-800 text-base">Đề thi mẫu chuẩn hóa</h4>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopySampleQuiz}
                    className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 transition cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Sao chép mẫu</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                  <p className="text-amber-300 font-bold">[Câu 1] Thủ đô của Việt Nam là gì?</p>
                  <p className="text-emerald-400 font-bold">A. Hà Nội (đúng)</p>
                  <p>B. TP. Hồ Chí Minh</p>
                  <p>C. Đà Nẵng</p>
                  <p>D. Cần Thơ</p>
                  <br />
                  <p className="text-amber-300 font-bold">Câu 2: [Phương trình nào sau đây có nghiệm x = 2?]</p>
                  <p>A. 2x - 3 = 0</p>
                  <p className="text-emerald-400 font-bold">**B. x + 3 = 5**</p>
                  <p>C. x - 5 = 0</p>
                  <p>D. 3x = 9</p>
                  <br />
                  <p className="text-amber-300 font-bold">3. [Trong các chất sau, chất nào là kim loại dẫn điện tốt nhất?]</p>
                  <p>A. Đồng</p>
                  <p>B. Vàng</p>
                  <p className="text-emerald-400 font-bold">*C. Bạc</p>
                  <p>D. Nhôm</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Mẹo: Bạn có thể chọn chế độ nhận diện ở thanh công cụ trước khi bấm Phân Tích!
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePasteSampleQuizToEditor}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition cursor-pointer"
                >
                  <Sparkles size={16} />
                  <span>Dán đề mẫu vào ô soạn thảo ngay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowGuideModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs sm:text-sm font-medium transition cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
