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
                            <p className="text-blue-100 text-[14px] font-medium mt-2">Quản lý kho đề thi & trắc nghiệm của bạn</p>
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
'@

# We need to extract the renderHome body block from index.html and replace it.
# It starts at: const renderHome = () => (
# It ends right before: const renderReviewSection = () => (

$regex = '(?s)const renderHome = \(\) => \(.*?(?=\s*const renderReviewSection = \(\) => \()'
$html = $html -replace $regex, $newHome
Set-Content -LiteralPath 'public/index.html' -Value $html
