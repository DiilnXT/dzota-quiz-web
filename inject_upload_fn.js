const fs = require('fs');
let html = fs.readFileSync('public/index.html', 'utf8');

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
                              addToast("Đã nạp nội dung từ file Word!", "success");
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

if (!html.includes('handleFileUpload = (e) =>')) {
    html = html.replace('const startQuiz = () => {', uploadFunction + '\n          const startQuiz = () => {');
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log("Injected handleFileUpload");
} else {
    console.log("Already has handleFileUpload");
}
