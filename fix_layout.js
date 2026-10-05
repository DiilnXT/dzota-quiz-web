const fs = require('fs');
let t = fs.readFileSync('app/(admin)/layout.tsx', 'utf8');

const regex = /<div>\s*<h3 className="px-3 text-\[11px\] font-bold text-slate-400 uppercase tracking-widest mb-3">[^<]*<\/h3>\s*<div className="space-y-1\.5">\s*<Link href="\/dashboard"[\s\S]*?<Link href="#"[\s\S]*?<\/Link>\s*<\/div>\s*<\/div>/;

const replacement = `          <div>
            <h3 className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Quản trị hệ thống</h3>
            <div className="space-y-1.5">
              <Link href="/dashboard" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group font-semibold text-sm">
                <div className="flex items-center gap-3">
                  <LayoutDashboard size={18} className="group-hover:text-indigo-600 transition-colors" />
                  <span>Tổng quan</span>
                </div>
              </Link>

              <Link href="/tests" className="flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all group font-semibold text-sm">
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
              </Link>
            </div>
          </div>`;

t = t.replace(regex, replacement);
fs.writeFileSync('app/(admin)/layout.tsx', t);
