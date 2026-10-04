$html = Get-Content -LiteralPath 'public/index.html' -Raw

# 1. Replace the + button and remove the dropdown menu
$oldPlusMenu = '(?s)<button onClick=\{.*?setShowCreateMenu\(!showCreateMenu\).*?</button>\s*\{showCreateMenu && \(.*?\)\}'
$newPlusMenu = '<button onClick={() => handleCreateNew(''standard'')} className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all"><Icons.Plus size={24} /></button>'
$html = $html -replace $oldPlusMenu, $newPlusMenu

# 2. Update search placeholder
$html = $html -replace 'Tìm kiếm tên bài thi, ngân hàng\.\.\.', 'Tìm kiếm tên bài thi...'

# 3. Update empty state
$oldEmptyState = '(?s)Nhấn nút "\+" ở góc trên để tạo bài thi hoặc ngân hàng đề mới\.</p>\s*<button onClick=\{.*?setShowCreateMenu\(true\).*?\}'
$newEmptyState = 'Nhấn nút "+" ở góc trên để tạo bài thi mới.</p>
                                <button onClick={() => handleCreateNew(''standard'')} '
$html = $html -replace $oldEmptyState, $newEmptyState

# 4. Update Quiz Cards icon logic
$oldCardIconBg = '(?s)className=\{`p-3 rounded-xl \$\{quiz\.config\.quizType === ''bank'' \? ''bg-emerald-50 text-emerald-600'' : ''bg-blue-50 text-blue-600''\}`\}'
$newCardIconBg = 'className={`p-3 rounded-xl bg-blue-50 text-blue-600`}'
$html = $html -replace $oldCardIconBg, $newCardIconBg

$oldCardIcon = '(?s)\{quiz\.config\.quizType === ''bank'' \? <Icons\.Folder size=\{24\}/> : <Icons\.FileText size=\{24\}/>\}'
$newCardIcon = '<Icons.FileText size={24}/>'
$html = $html -replace $oldCardIcon, $newCardIcon

# 5. Update Quiz Cards count logic
$oldCountText = '(?s)\{quiz\.questions \? quiz\.questions\.length : 0\} \{quiz\.config\.quizType === ''bank'' \? ''nhóm'' : ''câu''\}'
$newCountText = '{quiz.questions ? quiz.questions.length : 0} câu'
$html = $html -replace $oldCountText, $newCountText

# 6. Update renderReviewSection Title
$oldReviewTitle = '(?s)Quản Lý \{quizConfig\.quizType === ''bank'' \? ''Ngân Hàng'' : ''Chi Tiết''\} \(\{parsedQuestions\.length\} nhóm câu\)'
$newReviewTitle = 'Chi Tiết Bài Thi ({parsedQuestions.length} câu)'
$html = $html -replace $oldReviewTitle, $newReviewTitle

$oldAddGroup = 'Thêm nhóm mới'
$newAddGroup = 'Thêm câu mới'
$html = $html -replace $oldAddGroup, $newAddGroup

Set-Content -LiteralPath 'public/index.html' -Value $html
