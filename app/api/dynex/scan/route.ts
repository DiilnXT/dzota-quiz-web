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

    // 1. Lấy API key từ cài đặt Dzota (Prisma systemSetting hoặc env)
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

    // Client key override nếu có
    if (!rawKeys && clientApiKey) {
      rawKeys = clientApiKey;
    }
    if (!rawKeys) {
      rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '';
    }
    if (clientModel) {
      activeModel = clientModel;
    }

    const keyList = rawKeys
      .split(/[\n,;]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5);

    if (keyList.length === 0) {
      return NextResponse.json(
        { error: 'Chưa có Gemini API Key nào trong Cài đặt hệ thống Dzota. Vui lòng cấu hình API Key trong trang Quản trị.' },
        { status: 400 }
      );
    }

    // Tách base64 data thực tế
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `Bạn là một Chuyên gia Giải phẫu Y khoa và Trợ lý Thị giác AI xuất sắc.
Nhiệm vụ của bạn: Phân tích bức ảnh giải phẫu này và xác định TẤT CẢ các nhãn chú thích, mũi tên chỉ điểm, số hiệu (1, 2, 3...) hoặc vùng chữ chú thích giải phẫu trên ảnh.

Đối với MỖI nhãn chú thích/vị trí chi tiết giải phẫu bạn nhìn thấy, hãy trả về tọa độ hộp giới hạn (Bounding Box) che phủ chính xác vùng nhãn đó để làm ô che phục vụ ôn tập trắc nghiệm / flashcard.

Tọa độ trả về là TỶ LỆ PHẦN TRĂM từ 0 đến 100:
- x: khoảng cách từ mép trái ảnh (% từ 0 đến 100)
- y: khoảng cách từ mép trên ảnh (% từ 0 đến 100)
- width: chiều rộng của ô che (% từ 0 đến 100, nên từ 8% đến 25%)
- height: chiều cao của ô che (% từ 0 đến 100, nên từ 4% đến 12%)
- text: Tên cơ quan giải phẫu hoặc nhãn bằng Tiếng Việt chuẩn y khoa
- synonyms: Các tên gọi đồng nghĩa hoặc thuật ngữ Latinh (phân cách bằng dấu phẩy)
- clinicalNote: Gợi ý lâm sàng ngắn gọn hoặc chức năng sinh lý chính của cơ quan đó

BẮT BUỘC chỉ trả về duy nhất chuỗi JSON hợp lệ theo định dạng sau (không kèm markdown \`\`\`):
{
  "labels": [
    {
      "x": 15.5,
      "y": 24.0,
      "width": 14.0,
      "height": 5.5,
      "text": "Thùy gan phải",
      "synonyms": "Gan phải, Right lobe of liver, Lobus hepatis dexter",
      "clinicalNote": "Thùy lớn nhất của gan, chia thành các hạ phân thùy V, VI, VII, VIII"
    }
  ]
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
          labels: parsed.labels || parsed || [],
          modelUsed: targetModel,
        });
      } catch (err) {
        lastError = err;
      }
    }

    return NextResponse.json(
      { error: lastError?.message || 'Không thể quét ảnh bằng Gemini AI lúc này. Vui lòng kiểm tra lại API Key.' },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Lỗi xử lý hình ảnh' }, { status: 500 });
  }
}
