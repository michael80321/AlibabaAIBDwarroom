export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sendCustomAlert } from '@/lib/telegram';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';

export async function POST(_req: NextRequest) {
  const hasToken = !!process.env.TELEGRAM_BOT_TOKEN;
  const hasChatId = !!process.env.TELEGRAM_CHAT_ID;

  if (!hasToken || !hasChatId) {
    return NextResponse.json(
      {
        ok: false,
        error: '環境變數未設定',
        detail: {
          TELEGRAM_BOT_TOKEN: hasToken ? 'OK' : 'MISSING',
          TELEGRAM_CHAT_ID: hasChatId ? 'OK' : 'MISSING',
        },
      },
      { status: 400 }
    );
  }

  const now = format(new Date(), 'yyyy/MM/dd HH:mm:ss', { locale: zhTW });
  const message = `✅ <b>BD War Room 測試推送</b>

這是一則測試訊息。
如果你看到這則訊息，代表 Telegram Bot 設定正確 🎉

⏰ 時間：${now}
🌐 War Room：${process.env.WAR_ROOM_URL || 'localhost'}`;

  try {
    await sendCustomAlert(message);
    return NextResponse.json({ ok: true, message: '已發送，請檢查 Telegram' });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: '發送失敗', detail: String(error) },
      { status: 500 }
    );
  }
}
