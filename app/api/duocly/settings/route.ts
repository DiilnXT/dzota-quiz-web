import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let hasSystemKey = false;
    let activeModel = 'gemini-2.0-flash';
    let availableModels = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.5-pro'];

    try {
      if ((prisma as any).systemSetting) {
        const keysSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_API_KEYS' } });
        const modelSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_ACTIVE_MODEL' } });
        const availSetting = await (prisma as any).systemSetting.findUnique({ where: { key: 'GEMINI_AVAILABLE_MODELS' } });

        if (keysSetting?.value && keysSetting.value.trim().length > 5) {
          hasSystemKey = true;
        }
        if (modelSetting?.value) {
          activeModel = modelSetting.value;
        }
        if (availSetting?.value) {
          const parsed = JSON.parse(availSetting.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            availableModels = parsed;
          }
        }
      }
    } catch (e) {
      console.warn('SystemSetting query skipped:', e);
    }

    if (!hasSystemKey && (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY)) {
      hasSystemKey = true;
    }

    return NextResponse.json({
      success: true,
      hasSystemKey,
      activeModel,
      availableModels,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
