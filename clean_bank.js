const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. In handleCreateNew
html = html.replace(
  /title: type === 'bank' \? 'Ngân Hàng Câu Hỏi Mới' : 'Bài Kiểm Tra Mới',/g,
  "title: 'Bài Kiểm Tra Mới',"
);

// 2. In handleCreateNew quizType removal
html = html.replace(
  /quizType: type/g,
  "quizType: 'standard'"
);

// 3. Editor UI Title
html = html.replace(
  /\{quizConfig\.quizType === 'bank' \? <Icons\.Folder className="text-emerald-600 mr-3" \/> : <Icons\.Edit3 className="text-indigo-600 mr-3" \/>\}/g,
  '<Icons.Edit3 className="text-indigo-600 mr-3" />'
);
html = html.replace(
  /\{quizConfig\.quizType === 'bank' \? 'Soạn Thảo Ngân Hàng Câu Hỏi' : 'Soạn Thảo Đề Thi'\}/g,
  "'Soạn Thảo Đề Thi'"
);

// 4. Editor UI Step 1
html = html.replace(
  /\{quizConfig\.quizType === 'bank' \? 'Dán dữ liệu các câu hỏi của ngân hàng từ Word' : 'Dán nội dung đề thi từ Word'\}/g,
  "'Dán nội dung đề thi từ Word'"
);

// 5. Editor UI Step 2
html = html.replace(
  /\{isParsing \? 'Đang xử lý\.\.\.' : \(quizConfig\.quizType === 'bank' \? 'Bước 2: Phân tích kho câu hỏi' : 'Bước 2: Phân tích đề thi'\)\}/g,
  "{isParsing ? 'Đang xử lý...' : 'Bước 2: Phân tích đề thi'}"
);

// 6. Editor UI Name label
html = html.replace(
  /Tên \{quizConfig\.quizType === 'bank' \? 'Ngân hàng' : 'Bài Thi'\}/g,
  "Tên Bài Thi"
);

// 7. Remove the whole Bank Settings block
html = html.replace(
  /\{quizConfig\.quizType === 'bank' \? \([\s\S]*?\) : null\}/g,
  ""
);

// 8. Entry page icon
html = html.replace(
  /\$\{quizConfig\.quizType === 'bank' \? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-ios-blue'\}/g,
  "bg-blue-50 text-ios-blue"
);
html = html.replace(
  /\{quizConfig\.quizType === 'bank' \? <Icons\.Folder size=\{40\}\/> : <Icons\.FileText size=\{40\} \/>\}/g,
  '<Icons.FileText size={40} />'
);

// 9. Entry page question count
html = html.replace(
  /\{quizConfig\.quizType === 'bank' && \(quizConfig\.randomPickCount \|\| 0\) > 0[\s\S]*?: parsedQuestions\.length\}/g,
  '{parsedQuestions.length}'
);

// 10. Selected Item Action tags
html = html.replace(
  /<span className=\{\`text-\[11px\] font-bold uppercase tracking-wide px-2 py-0\.5 rounded-md flex items-center gap-1 \$\{selectedItemAction\.config\.quizType === 'bank' \? 'text-emerald-700 bg-emerald-50' : 'text-indigo-700 bg-indigo-50'\}\`\}>[\s\S]*?<\/span>/g,
  `<span className="text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md flex items-center gap-1 text-indigo-700 bg-indigo-50"><Icons.FileText size={10}/>Đề thi</span>`
);

html = html.replace(
  /\{selectedItemAction\.questions\?\.length \|\| 0\} \{selectedItemAction\.config\.quizType === 'bank' \? 'nhóm câu hỏi' : 'câu hỏi'\}/g,
  "{selectedItemAction.questions?.length || 0} câu hỏi"
);

// 11. Remove action buttons for Bank
html = html.replace(
  /\{selectedItemAction\.config\.quizType === 'bank' && \([\s\S]*?<\/button>\s*\)\}/g,
  ""
);

html = html.replace(
  /Xóa \{selectedItemAction\.config\.quizType === 'bank' \? 'ngân hàng' : 'đề thi'\}/g,
  "Xóa đề thi"
);

// 12. Remove generate bank config modal if any
html = html.replace(
  /\{generateBankConfig && \([\s\S]*?<\/div>\s*\)\}/g,
  ""
);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Done thoroughly cleaning bank logic!");
