const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

// 1. Inject API save logic in handleSaveQuiz
const oldSaveLogic = `const quizId = quizIdTracker || ('quiz_' + Date.now());
           const quizData = {
               id: quizId,
               title: quizConfig.title,
               config: quizConfig,
               questions: parsedQuestions,
               createdAt: new Date().toISOString()
           };
           
           const currentSaved = JSON.parse(localStorage.getItem('myQuizzes') || '[]');
           const updatedSaved = currentSaved.filter(q => q.id !== quizId);
           updatedSaved.unshift(quizData);
           
           localStorage.setItem('myQuizzes', JSON.stringify(updatedSaved));
           setSavedQuizzes(updatedSaved);
           addToast("Đã lưu bài thi thành công!", 'success');
           setQuizIdTracker(quizId);`;

const newSaveLogic = `const quizId = quizIdTracker || ('quiz_' + Date.now());
           const quizData = {
               id: quizId,
               title: quizConfig.title,
               config: quizConfig,
               questions: parsedQuestions,
               createdAt: new Date().toISOString()
           };
           
           try {
               const res = await fetch('/api/quick-quiz', {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify(quizData)
               });
               
               const data = await res.json();
               if (!res.ok) {
                   addToast(data.error || "Save failed", 'error');
                   return;
               }
               
               const currentSaved = JSON.parse(localStorage.getItem('myQuizzes') || '[]');
               const updatedSaved = currentSaved.filter(q => q.id !== quizId);
               updatedSaved.unshift(quizData);
               localStorage.setItem('myQuizzes', JSON.stringify(updatedSaved));
               setSavedQuizzes(updatedSaved);
               addToast("Đã lưu lên hệ thống thành công!", 'success');
               setQuizIdTracker(quizId);
           } catch(e) {
               addToast("Lỗi mạng", 'error');
           }`;

if (html.includes("const quizId = quizIdTracker")) {
    html = html.replace(oldSaveLogic, newSaveLogic);
    // Note: handleSaveQuiz needs to be async!
    html = html.replace('const handleSaveQuiz = () => {', 'const handleSaveQuiz = async () => {');
} else {
    console.log("Could not find handleSaveQuiz logic");
}

// 2. Inject Logout Button in the Home header
const oldHeader = `<h1 className="text-xl font-bold text-black tracking-tight">Thư viện Đề Thi</h1>
                          <button onClick={handleCreateNew} className="text-ios-blue text-[28px] leading-none active:opacity-50 transition-opacity">+</button>`;
const newHeader = `<h1 className="text-xl font-bold text-black tracking-tight">Thư viện Đề Thi</h1>
                          <div className="flex items-center gap-4">
                              <button onClick={async () => { await fetch('/api/auth/logout', {method: 'POST'}); window.location.href = '/login'; }} className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 text-sm font-bold flex items-center transition-colors">
                                  Đăng xuất
                              </button>
                              <button onClick={handleCreateNew} className="w-10 h-10 bg-ios-blue text-white rounded-xl flex items-center justify-center text-[24px] leading-none active:scale-95 transition-all shadow-sm">+</button>
                          </div>`;
html = html.replace(oldHeader, newHeader);

// 3. Update delete logic to call API (optional, but good for completeness, wait, delete wasn't implemented via API yet? Let's leave it local if it was local)
// Oh, the Admin dashboard deletes via API. The creator UI deletes locally.

fs.writeFileSync('public/index.html', html, 'utf8');
console.log("Injected API integrations into original HTML");
