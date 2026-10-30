import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, mimeType = 'image/jpeg', clientApiKey, clientModel } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Hình ảnh không được để trống' }, { status: 400 });
    }

    // 1. Lấy API key từ cài đặt Dzota (Prisma systemSetting, env, hoặc client key)
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
          error: 'Chưa có Gemini API Key nào trong Cài đặt Dzota. Vui lòng cấu hình API Key trong mục Cài đặt AI Dzota hoặc liên hệ quản trị.',
          needApiKey: true
        },
        { status: 400 }
      );
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Bạn là một Dược sĩ lâm sàng & Bác sĩ chuyên khoa Dược Y Khoa Việt Nam.
Nhiệm vụ của bạn: Phân tích hình ảnh bao bì thuốc, vỉ thuốc, chai lọ thuốc hoặc đơn thuốc được gửi lên.
Hãy nhận diện và trích xuất thông tin thuốc theo ĐÚNG 12 TRƯỜNG DỮ LIỆU CHUẨN DƯỢC LÝ sau đây:

1. tenThuoc: Tên thuốc (Ghi rõ Tên biệt dược kèm hoạt chất nếu có, ví dụ: "Panadol Extra (Paracetamol, Cafein)" hoặc "Augmentin (Amoxicillin / Clavulanat)")
2. nhomPhanNhomPho: Nhóm, phân nhóm, phổ dược lý (ví dụ: "Kháng sinh - Nhóm Beta-lactam / Phân nhóm Penicillin - Phổ trung bình" hoặc "Kháng viêm không steroid (NSAID) / Dẫn xuất acid propionic")
3. hoatChatHamLuong: Tên hoạt chất chính kèm nồng độ hàm lượng (ví dụ: "Paracetamol 500mg, Cafein 65mg")
4. dangBaoChe: Dạng bào chế (ví dụ: "Viên nén", "Viên nang", "Dung dịch tiêm", "Hỗn dịch uống", "Thuốc nhỏ mắt"...)
5. hoatChat: Chỉ ghi tên hoạt chất chính (ví dụ: "Paracetamol, Cafein")
6. taDuoc: Các tá dược hoặc hệ tá dược ghi nhận (nếu ảnh không thấy ghi rõ thì ghi các tá dược thông dụng của dạng bào chế này, ví dụ: "Lactose, tinh bột bắp, magnesi stearat, povidon")
7. chiDinh: Chỉ định điều trị chuẩn y khoa (ngắn gọn, chính xác các bệnh lý cần dùng)
8. chongChiDinh: Chống chỉ định tuyệt đối & tương đối (ví dụ: "Quá mẫn, suy gan nặng, phụ nữ mang thai 3 tháng cuối...")
9. tacDungPhu: Tác dụng không mong muốn (phân biệt ngắn hạn, dài hạn nếu có)
10. lieuDungCachDung: Liều lượng và đường dùng thông thường cho người lớn và trẻ em
11. thoiDiemDung: Thời điểm dùng vàng (ví dụ: "Uống sau khi ăn no", "Uống lúc đói trước ăn 1 giờ", "Uống buổi sáng", "Uống trước khi đi ngủ"...)
12. ghiChu: Lưu ý dược lâm sàng quan trọng & tương tác thuốc cần tránh
13. searchKeywords: Danh sách 4-6 từ khóa tìm kiếm (tên hoạt chất, tên biệt dược, nhóm thuốc) viết thường không dấu và có dấu để tra cứu đối chiếu trong cơ sở dữ liệu.

BẮT BUỘC trả về duy nhất một chuỗi JSON hợp lệ theo cấu trúc sau (không kèm markdown \`\`\`json):
{
  "tenThuoc": "...",
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
  "searchKeywords": ["...", "..."],
  "confidenceScore": 95,
  "detectedText": "tóm tắt chữ đọc được trên ảnh"
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
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: cleanBase64,
                    },
                  },
                ],
              },
            ],
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
          data: parsed,
          modelUsed: targetModel,
        });
      } catch (err: any) {
        lastError = err;
      }
    }

    return NextResponse.json(
      { error: lastError?.message || 'Không thể quét ảnh thuốc bằng Gemini AI lúc này. Vui lòng kiểm tra lại API Key.' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý hình ảnh thuốc' }, { status: 500 });
  }
}
