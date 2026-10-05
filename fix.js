const fs = require('fs');
let t = fs.readFileSync('app/(admin)/layout.tsx', 'utf8');

const regex = /<Link href="#" className="flex items-center justify-between px-3 py-2\.5 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-sm shadow-sm border border-indigo-100\/50">[\s\S]*?<\/Link>/;

const replacement = `<Link href="/tests" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group font-semibold text-sm">
                <div className="flex items-center gap-3">
                  <FileText size={18} className="group-hover:text-indigo-600 transition-colors" />
                  <span>Quản lý Bài test</span>
                </div>
              </Link>
              <Link href="#" title="Tính năng đang phát triển" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-all group font-semibold text-sm cursor-not-allowed">
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
                  <span>Quản lý Giáo viên</span>
                </div>
              </Link>`;

t = t.replace(regex, replacement);
fs.writeFileSync('app/(admin)/layout.tsx', t);
