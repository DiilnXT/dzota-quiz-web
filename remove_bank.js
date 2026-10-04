const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Remove the dropdown menu entirely and replace with a direct handleCreateNew('standard')
html = html.replace(
  /<button onClick=\{\(\) => setShowCreateMenu\(!showCreateMenu\)\}[\s\S]*?<\/button>\s*\{showCreateMenu && \([\s\S]*?<\/>\s*\)\}/g,
  `<button onClick={() => handleCreateNew('standard')} className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all"><Icons.Plus size={24} /></button>`
);

// 2. Update search placeholder
html = html.replace('Tìm kiếm tên bài thi, ngân hàng...', 'Tìm kiếm tên bài thi...');

// 3. Update empty state
html = html.replace(
  /Nhấn nút "\+" ở góc trên để tạo bài thi hoặc ngân hàng đề mới\./g,
  'Nhấn nút "+" ở góc trên để tạo bài thi mới.'
);
html = html.replace(
  /<button onClick=\{\(\) => setShowCreateMenu\(true\)\}/g,
  `<button onClick={() => handleCreateNew('standard')}`
);

// 4. Update Quiz Cards icon logic
html = html.replace(
  /className=\{\`p-3 rounded-xl \$\{quiz\.config\.quizType === 'bank' \? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'\}\`\}/g,
  'className={`p-3 rounded-xl bg-blue-50 text-blue-600`}'
);
html = html.replace(
  /\{quiz\.config\.quizType === 'bank' \? <Icons\.Folder size=\{24\}\/> : <Icons\.FileText size=\{24\}\/>\}/g,
  '<Icons.FileText size={24}/>'
);

// 5. Update Quiz Cards count logic
html = html.replace(
  /\{quiz\.questions \? quiz\.questions\.length : 0\} \{quiz\.config\.quizType === 'bank' \? 'nhóm' : 'câu'\}/g,
  '{quiz.questions ? quiz.questions.length : 0} câu'
);

// 6. Update renderReviewSection Title
html = html.replace(
  /Quản Lý \{quizConfig\.quizType === 'bank' \? 'Ngân Hàng' : 'Chi Tiết'\} \(\{parsedQuestions\.length\} nhóm câu\)/g,
  'Chi Tiết Bài Thi ({parsedQuestions.length} câu)'
);

html = html.replace(
  /Thêm nhóm mới/g,
  'Thêm câu mới'
);

fs.writeFileSync('public/index.html', html, 'utf8');
console.log('Done replacing');
