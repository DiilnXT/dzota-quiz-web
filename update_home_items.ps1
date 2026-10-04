$html = Get-Content -LiteralPath 'public/index.html' -Raw
$newItems = @'
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                        {filteredQuizzes.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center animate-fade-in bg-white rounded-3xl border border-gray-100 shadow-sm mt-4">
                                <div className="w-24 h-24 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-6"><Icons.Folder size={48} /></div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có bài test nào</h3>
                                <p className="text-gray-500 mb-6 max-w-sm text-[15px]">Nhấn nút "+" ở góc trên để tạo bài thi hoặc ngân hàng đề mới.</p>
                                <button onClick={() => setShowCreateMenu(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-200">Tạo mới ngay</button>
                            </div>
                        ) : (
                            filteredQuizzes.map(quiz => (
                                <div key={quiz.id} onClick={() => { if (!quiz.config.isActive) return; setSelectedQuizId(quiz.id); setAppMode('entry'); }} className={`bg-white border rounded-2xl p-5 group cursor-pointer transition-all duration-300 ${quiz.config.isActive === false ? 'opacity-60 grayscale border-gray-200' : 'border-gray-200 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-100/50 hover:-translate-y-1'}`}>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-xl ${quiz.config.quizType === 'bank' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                            {quiz.config.quizType === 'bank' ? <Icons.Folder size={24}/> : <Icons.FileText size={24}/>}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={(e) => { e.stopPropagation(); setEditQuizId(quiz.id); setQuizConfig(quiz.config); setParsedQuestions(quiz.questions || []); setAppMode('editor'); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Icons.Edit size={16}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); handleShare(quiz.id); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Icons.Share size={16}/></button>
                                            <button onClick={(e) => { e.stopPropagation(); setSelectedItemAction(quiz); }} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Icons.Trash size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <h3 className="font-bold text-gray-900 text-[17px] mb-2 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">{quiz.config.title}</h3>
                                        <div className="flex flex-wrap gap-3 mt-3">
                                            <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md flex items-center gap-1.5"><Icons.Clock size={12}/> {quiz.config.timeLimit} phút</span>
                                            <span className="text-[12px] font-semibold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md flex items-center gap-1.5"><Icons.FileText size={12}/> {quiz.questions ? quiz.questions.length : 0} {quiz.config.quizType === 'bank' ? 'nhóm' : 'câu'}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                                        <span className={`text-[12px] font-bold ${quiz.config.isActive !== false ? 'text-emerald-600 bg-emerald-50' : 'text-gray-500 bg-gray-100'} px-2.5 py-1 rounded-md`}>{quiz.config.isActive !== false ? 'Đang mở' : 'Đã đóng'}</span>
                                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" id={`toggle-${quiz.id}`} className="toggle-checkbox-ios hidden" checked={quiz.config.isActive !== false} onChange={(e) => handleToggleStatus(quiz.id, quiz.config.isActive !== false, e)} />
                                            <label htmlFor={`toggle-${quiz.id}`} className="toggle-label-ios"></label>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
'@

$regex = '(?s)<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">.*?</div>\s*</main>'
$html = $html -replace $regex, "$newItems`n                </main>"
Set-Content -LiteralPath 'public/index.html' -Value $html
