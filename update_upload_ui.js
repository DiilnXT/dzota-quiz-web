const fs = require('fs');

let html = fs.readFileSync('public/index.html', 'utf8');

const oldLabel = `<div className="flex justify-between items-center mb-3">
                         <label className="block text-sm font-semibold text-slate-700">Bước 1: Dán nội dung đề thi từ Word (hoặc Tải lên file .docx)</label>
                         <div>
                             <input type="file" id="word-upload" accept=".docx" className="hidden" onChange={handleFileUpload} />
                             <Button variant="secondary" onClick={() => document.getElementById('word-upload').click()} icon={<Icons.Upload size={16}/>}>
                                 Tải lên file Word (.docx)
                             </Button>
                         </div>
                      </div>`;

const newUI = `<div className="mb-6">
                         <label className="block text-[15px] font-bold text-slate-800 mb-3">Bước 1: Cung cấp nội dung đề thi</label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                             <div onClick={() => document.getElementById('word-upload').click()} className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400 rounded-2xl p-5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                 <input type="file" id="word-upload" accept=".docx" className="hidden" onChange={handleFileUpload} />
                                 <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm"><Icons.Upload size={22}/></div>
                                 <h4 className="font-bold text-indigo-900 text-sm mb-1">Tải lên file Word (.docx)</h4>
                                 <p className="text-[12px] text-indigo-600/70 text-center font-medium">Tự động trích xuất chữ và ảnh minh họa</p>
                             </div>
                             <div className="border border-slate-200 bg-slate-50/80 rounded-2xl p-5 flex flex-col items-center justify-center">
                                 <div className="w-12 h-12 bg-white text-slate-500 border border-slate-200 shadow-sm rounded-full flex items-center justify-center mb-3"><Icons.FileText size={22}/></div>
                                 <h4 className="font-bold text-slate-700 text-sm mb-1">Dán thủ công</h4>
                                 <p className="text-[12px] text-slate-500 text-center font-medium">Copy chữ từ Word/PDF dán vào khung bên dưới</p>
                             </div>
                         </div>
                      </div>`;

if (html.includes('id="word-upload"')) {
    html = html.replace(oldLabel, newUI);
    fs.writeFileSync('public/index.html', html, 'utf8');
    console.log("Updated UI");
} else {
    console.log("Could not find the old label to replace");
}
