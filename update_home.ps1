$html = Get-Content -LiteralPath 'public/index.html' -Raw
$newHome = @'
        const renderHome = () => (
            <div className="min-h-screen bg-slate-50 font-sans pb-24">
                <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-sky-500 text-white pt-10 pb-20 px-4 sm:px-6 relative overflow-hidden shadow-lg">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="max-w-5xl mx-auto relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md"><Icons.FileText size={24} className="text-white"/></div>
                                <h1 className="text-3xl font-extrabold tracking-tight">Dzota Workspace</h1>
                            </div>
                            <p className="text-blue-100 text-[14px] font-medium mt-2 mb-4">Quản lý kho đề thi & trắc nghiệm của bạn</p>
                            <button onClick={async () => { await fetch('/api/auth/logout', {method: 'POST'}); window.location.href = '/login'; }} className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-colors">
                                <Icons.LogOut size={16} /> Đăng xuất
                            </button>
                        </div>
                        <div className="relative">
                            <button onClick={() => setShowCreateMenu(!showCreateMenu)} className="w-12 h-12 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-95 transition-all">
                                <Icons.Plus size={24} />
                            </button>
                            {showCreateMenu && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setShowCreateMenu(false)}></div>
                                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-pop-in z-40 origin-top-right">
                                        <button onClick={() => { setShowCreateMenu(false); handleCreateNew('standard'); }} className="w-full text-left p-4 hover:bg-gray-50 flex gap-3 border-b border-gray-50 transition-colors">
                                            <div className="bg-blue-50 p-2 rounded-xl text-blue-600 h-fit"><Icons.FileText size={20}/></div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-[14px] mb-0.5">Tạo Đề Thi Thường</div>
                                                <div className="text-[12px] text-gray-500 leading-snug">Đề thi cố định, trắc nghiệm tiêu chuẩn.</div>
                                            </div>
                                        </button>
                                        <button onClick={() => { setShowCreateMenu(false); handleCreateNew('bank'); }} className="w-full text-left p-4 hover:bg-gray-50 flex gap-3 transition-colors">
                                            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600 h-fit"><Icons.Folder size={20}/></div>
                                            <div>
                                                <div className="font-bold text-gray-900 text-[14px] mb-0.5">Tạo Ngân Hàng Đề</div>
                                                <div className="text-[12px] text-gray-500 leading-snug">Kho câu hỏi để rút ngẫu nhiên sinh đề.</div>
                                            </div>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <main className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-20">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-2 flex flex-col md:flex-row gap-2 mb-8">
                        <div className="flex-1 flex items-center bg-gray-50 rounded-xl px-4 py-3 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-colors">
                            <Icons.Search className="text-gray-400" size={20}/>
                            <input type="text" placeholder="Tìm kiếm tên bài thi, ngân hàng..." className="flex-1 bg-transparent border-none outline-none ml-3 text-[15px] text-gray-800 font-medium placeholder-gray-400" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="w-full md:w-56 flex-shrink-0">
                            <CustomSelect options={categories} value={selectedCategory} onChange={setSelectedCategory} icon={<Icons.Folder size={18} className="text-gray-500"/>}/>
                        </div>
                    </div>
                    
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
            </div>
        );
'@

$regex = '(?s)const renderHome = \(\) => \(.*?</main>\s*</div>\s*\);'
$html = $html -replace $regex, $newHome

# Wait, we need to add Icons.LogOut since it doesn't exist yet!
$iconsRegex = '(?s)const Icons = \{.*?(?=Check:)'
$iconsReplacement = "const Icons = {`n        LogOut: ({size=20, className}) => <svg className={className} width={size} height={size} viewBox=`"0 0 24 24`" fill=`"none`" stroke=`"currentColor`" strokeWidth=`"2`" strokeLinecap=`"round`" strokeLinejoin=`"round`"><path d=`"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4`"></path><polyline points=`"16 17 21 12 16 7`"></polyline><line x1=`"21`" y1=`"12`" x2=`"9`" y2=`"12`"></line></svg>,`n        "
$html = $html -replace $iconsRegex, $iconsReplacement

Set-Content -LiteralPath 'public/index.html' -Value $html
