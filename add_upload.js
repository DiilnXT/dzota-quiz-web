const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Inject mammoth.js
const scriptTag = `<script src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"></script>`;
if (!html.includes('mammoth.browser.min.js')) {
    html = html.replace('<!-- Babel -->', scriptTag + '\n    <!-- Babel -->');
}

// 2. Add Icons.Upload
if (!html.includes('Upload:')) {
    html = html.replace(
        `XCircle: ({size=20, className}) =>`,
        `Upload: ({size=20, className}) => <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,\n        XCircle: ({size=20, className}) =>`
    );
}

// 3. Update the Editor UI for upload
const uploadFunction = `
          const handleFileUpload = (e) => {
              const file = e.target.files[0];
              if (!file) return;
              if (!file.name.endsWith('.docx')) {
                  addToast("Chỉ hỗ trợ file Word (.docx)", "error");
                  return;
              }
              const reader = new FileReader();
              reader.onload = (event) => {
                  const arrayBuffer = event.target.result;
                  window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
                      .then(function(result) {
                          const html = result.value;
                          if (window.tinymce && window.tinymce.get('quiz-editor-area')) {
                              window.tinymce.get('quiz-editor-area').setContent(html);
                              addToast("Đã tải nội dung từ file Word!", "success");
                          }
                      })
                      .catch(function(err) {
                          console.error(err);
                          addToast("Lỗi đọc file Word: " + err.message, "error");
                      });
              };
              reader.readAsArrayBuffer(file);
          };
`;
if (!html.includes('handleFileUpload')) {
    html = html.replace('// --- 4. RENDERERS ---', uploadFunction + '\n          // --- 4. RENDERERS ---');
}

// 4. Modify the Step 1 label and add upload button
const oldLabel = `<label className="block text-sm font-semibold text-slate-700 mb-3">Bước 1: Dán nội dung đề thi từ Word (Hỗ trợ ảnh minh họa & Công thức $Toán$)</label>`;
const newLabel = `<div className="flex justify-between items-center mb-3">
                         <label className="block text-sm font-semibold text-slate-700">Bước 1: Dán nội dung đề thi từ Word (hoặc Tải lên file .docx)</label>
                         <div>
                             <input type="file" id="word-upload" accept=".docx" className="hidden" onChange={handleFileUpload} />
                             <Button variant="secondary" onClick={() => document.getElementById('word-upload').click()} icon={<Icons.Upload size={16}/>}>
                                 Tải lên file Word (.docx)
                             </Button>
                         </div>
                      </div>`;

if (html.includes(oldLabel)) {
    html = html.replace(oldLabel, newLabel);
}

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Updated HTML with file upload capability");
