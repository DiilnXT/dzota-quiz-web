"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Users, FileText, Trash2, Edit2, Plus, Download, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const router = useRouter();

  // Create User Form
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newMaxTests, setNewMaxTests] = useState('10');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resUsers, resQuizzes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/quizzes')
      ]);
      if (resUsers.status === 401) {
        router.push('/login');
        return;
      }
      setUsers(await resUsers.json());
      setQuizzes(await resQuizzes.json());
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleCreateUser = async (e: any) => {
    e.preventDefault();
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: newUsername, password: newPassword, maxTests: newMaxTests })
    });
    setNewUsername(''); setNewPassword(''); setNewMaxTests('10');
    fetchData();
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xoá tài khoản này?')) return;
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchData();
  };

  const handleUpdateLimit = async (id: string) => {
    const limit = prompt('Nhập giới hạn số bài test mới:');
    if (!limit || isNaN(Number(limit))) return;
    await fetch('/api/admin/users', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, maxTests: limit })
    });
    fetchData();
  };

  const exportExcel = () => {
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + "ID,Tên Bài Test,Người Tạo,Ngày Tạo\n"
      + quizzes.map(q => `"${q.id}","${q.title}","${q.author}","${new Date(q.createdAt).toLocaleString()}"`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "dzota_quizzes.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl"><ShieldCheck className="text-white w-5 h-5"/></div>
            <span className="font-extrabold text-xl text-slate-800 tracking-tight">Dzota Admin</span>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-xl font-bold transition-colors">
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8">
          <button onClick={() => setActiveTab('users')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
            <Users className="w-5 h-5"/> Quản lý Tài Khoản
          </button>
          <button onClick={() => setActiveTab('quizzes')} className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all ${activeTab === 'quizzes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'}`}>
            <FileText className="w-5 h-5"/> Quản lý Bài Test
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 sticky top-24">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-indigo-600"/> Thêm Tài Khoản</h3>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Tên đăng nhập</label>
                    <input type="text" value={newUsername} onChange={e=>setNewUsername(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Mật khẩu</label>
                    <input type="text" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Giới hạn số bài (Max)</label>
                    <input type="number" value={newMaxTests} onChange={e=>setNewMaxTests(e.target.value)} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
                  </div>
                  <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors">Tạo Tài Khoản</button>
                </form>
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                        <th className="p-4 font-bold">Người dùng</th>
                        <th className="p-4 font-bold">Mật khẩu</th>
                        <th className="p-4 font-bold text-center">Đã tạo</th>
                        <th className="p-4 font-bold text-center">Giới hạn</th>
                        <th className="p-4 font-bold text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{u.username}</div>
                            <div className="text-xs text-slate-400 font-semibold mt-0.5">{u.role}</div>
                          </td>
                          <td className="p-4 font-mono text-sm text-slate-600">{u.password}</td>
                          <td className="p-4 text-center font-bold text-indigo-600">{u._count?.quizzes || 0}</td>
                          <td className="p-4 text-center">
                            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg font-bold text-sm">{u.maxTests}</span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button onClick={() => handleUpdateLimit(u.id)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Sửa giới hạn"><Edit2 className="w-4 h-4"/></button>
                            {u.role !== 'ADMIN' && (
                              <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xoá tài khoản"><Trash2 className="w-4 h-4"/></button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Tất cả Bài Test ({quizzes.length})</h3>
              <button onClick={exportExcel} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center gap-2 transition-colors">
                <Download className="w-4 h-4"/> Xuất Excel
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                    <th className="p-4 font-bold">ID / URL</th>
                    <th className="p-4 font-bold">Tên Bài Test</th>
                    <th className="p-4 font-bold">Người tạo</th>
                    <th className="p-4 font-bold">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {quizzes.map(q => (
                    <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono text-xs text-slate-500">
                        <a href={`/?id=${q.id}`} target="_blank" className="text-indigo-500 hover:underline">{q.id}</a>
                      </td>
                      <td className="p-4 font-bold text-slate-800 max-w-md truncate">{q.title}</td>
                      <td className="p-4 font-semibold text-slate-600">{q.author}</td>
                      <td className="p-4 text-sm text-slate-500">{new Date(q.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
