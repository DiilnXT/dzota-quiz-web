import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, clientApiKey, clientModel } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Từ khóa tìm kiếm không được để trống' }, { status: 400 });
    }

    // 1. Lấy API key từ cài đặt Dzota
    let rawKeys = '';
    let activeModel = 'gemini-2.0-flash';

    try {
      if ((prisma as any).systemSetting) {
        const keysSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_API_KEYS' } });
        const modelSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_ACTIVE_MODEL' } });
        if (keysSetting?.value) rawKeys = keysSetting.value;
        if (modelSetting?.value) activeModel = modelSetting.value;
      }
    } catch (e) {
      console.warn('SystemSetting query skipped:', e);
    }

    if (clientApiKey && clientApiKey.trim().length > 5) {
      rawKeys = clientApiKey.trim();
    }
    if (!rawKeys) {
      rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    }
    if (clientModel && clientModel.trim()) {
      activeModel = clientModel.trim();
    }

    const keyList = rawKeys
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5);

    if (keyList.length === 0) {
      return NextResponse.json(
        {
          error: 'Chưa có Gemini API Key nào trong Cài đặt Dzota. Vui lòng cấu hình API Key trong mục Cài đặt AI Dzota.',
          needApiKey: true
        },
        { status: 400 }
      );
    }

    const prompt = `Bạn là Dược sĩ lâm sàng & Bác sĩ chuyên khoa Dược Y Khoa Việt Nam.
Người dùng đang tìm kiếm thuốc hoặc hoạt chất: "${query.trim()}".
Thuốc này hiện KHÔNG có trong tài liệu 401 thuốc nội bộ.
Nhiệm vụ của bạn: Hãy tra cứu và tổng hợp thông tin chuẩn Dược lý học lâm sàng từ Dược Thư Quốc Gia Việt Nam, Bộ Y Tế, FDA, Goodman & Gilman.
Trả về đúng 12 trường thông tin chuẩn xác theo mẫu sau:

1. tenThuoc: Tên thuốc (Ghi rõ Tên hoạt chất chính / Tên biệt dược thông dụng, ví dụ: "Azithromycin (Zithromax)" hoặc "Tenofovir disoproxil fumarat (Viread)")
2. broadGroup: Chọn 1 trong các nhóm chính sau: "Kháng Sinh", "Kháng Nấm", "Tim Mạch & Mạch Vành", "Tăng Huyết Áp", "Rối Loạn Lipid Máu", "Đái Tháo Đường", "Giảm Đau - Hạ Sốt - NSAID", "Giảm Đau Opioid", "Corticoid / Vỏ Thượng Thận", "Nội Tiết & Hormon", "Kháng Histamin & Dị Ứng", "Tiêu Hóa & Dạ Dày", "Thuốc Lợi Tiểu", "Chống Đông & Huyết Khối", "Thần Kinh Thực Vật", "Thần Kinh & Tâm Thần", "Gây Mê - Gây Tê - Giãn Cơ", "Vitamin & Khoáng Chất", "Thuốc Giải Độc", "Khác"
3. nhomPhanNhomPho: Ghi đầy đủ Nhóm, phân nhóm, phổ dược lý (ví dụ: "Kháng sinh - Nhóm Macrolid (Azalid) / Phổ kháng khuẩn rộng trên vi khuẩn nội bào")
4. hoatChatHamLuong: Hoạt chất và các dạng hàm lượng phổ biến (ví dụ: "Azithromycin 250mg, 500mg; bột pha hỗn dịch 200mg/5ml")
5. dangBaoChe: Các dạng bào chế lưu hành (ví dụ: "Viên nén bao phim, viên nang, bột pha hỗn dịch uống, bột pha tiêm truyền IV")
6. hoatChat: Chỉ ghi tên hoạt chất chính (ví dụ: "Azithromycin")
7. taDuoc: Các tá dược thường dùng trong chế phẩm (ví dụ: "Pregelatinized starch, croscarmellose natri, silica keo khan, magnesi stearat, hypromellose")
8. chiDinh: Chỉ định điều trị chuẩn y khoa (ngắn gọn, chính xác các bệnh lý cần dùng)
9. chongChiDinh: Chống chỉ định tuyệt đối & tương đối (ví dụ: "Quá mẫn với nhóm macrolid, suy gan nặng, tiền sử vàng da ứ mật...")
10. tacDungPhu: Tác dụng không mong muốn (phân biệt ngắn hạn, dài hạn nếu có)
11. lieuDungCachDung: Liều lượng và đường dùng thông thường
12. thoiDiemDung: Thời điểm dùng vàng (ví dụ: "Uống 1 lần/ngày, uống xa bữa ăn (trước ăn 1h hoặc sau ăn 2h)...")
13. ghiChu: Lưu ý dược lâm sàng quan trọng, nguy cơ kéo dài khoảng QT, tương tác thuốc chống chỉ định
14. nguon: Ghi rõ "🌐 Tra cứu Google & Dược Thư Quốc Gia Việt Nam (Thuốc ngoài data 401 gốc)"

BẮT BUỘC chỉ trả về duy nhất một chuỗi JSON hợp lệ theo định dạng sau (không kèm markdown \`\`\`json):
{
  "tenThuoc": "...",
  "broadGroup": "...",
  "nhomPhanNhomPho": "...",
  "hoatChatHamLuong": "...",
  "dangBaoChe": "...",
  "hoatChat": "...",
  "taDuoc": "...",
  "chiDinh": "...",
  "chongChiDinh": "...",
  "tacDungPhu": "...",
  "lieuDungCachDung": "...",
  "thoiDiemDung": "...",
  "ghiChu": "...",
  "nguon": "🌐 Tra cứu Google & Dược Thư Quốc Gia (Thuốc ngoài Data 401 gốc)",
  "isExternal": true
}`;

    let lastError: any = null;
    const shuffledKeys = [...keyList].sort(() => Math.random() - 0.5);

    for (const key of shuffledKeys) {
      try {
        const targetModel = activeModel.startsWith('gemini') ? activeModel : 'gemini-2.0-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${key}`;

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          lastError = new Error(`Gemini API error (${res.status}): ${errText}`);
          continue;
        }

        const data = await res.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const cleaned = rawContent.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return NextResponse.json({
          success: true,
          data: {
            ...parsed,
            isExternal: true,
            nguon: parsed.nguon || '🌐 Tra cứu Google & Dược Thư Quốc Gia (Thuốc ngoài Data 401 gốc)'
          },
          modelUsed: targetModel,
        });
      } catch (err: any) {
        lastError = err;
      }
    }

    return NextResponse.json(
      { error: lastError?.message || 'Không thể tra cứu Google AI lúc này. Vui lòng kiểm tra lại API Key.' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi tra cứu AI' }, { status: 500 });
  }
}
