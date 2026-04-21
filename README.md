# Alibaba Cloud BD War Room

BD 作戰系統 — 每個模組輸出行動指令

## 技術堆疊

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Prisma ORM
- **Database**: PostgreSQL
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Notify**: Telegram Bot API
- **Deploy**: Railway
- **Package**: pnpm

## 本地啟動

```bash
# 1. 安裝依賴
pnpm install

# 2. 複製環境變數
cp .env.example .env
# 填入所有必要的環境變數

# 3. 執行資料庫 migration
pnpm prisma migrate dev --name init

# 4. 填入 Seed 資料
pnpm prisma db seed

# 5. 啟動開發伺服器
pnpm dev

# 6. 開啟瀏覽器
open http://localhost:3000
```

## 環境變數說明

| 變數 | 說明 | 必填 |
|------|------|------|
| `DATABASE_URL` | PostgreSQL 連線字串 | ✅ |
| `ANTHROPIC_API_KEY` | Claude API Key | ✅ |
| `TELEGRAM_BOT_TOKEN` | Telegram Bot Token | ⬜ |
| `TELEGRAM_CHAT_ID` | Telegram Chat ID | ⬜ |
| `CRON_SECRET` | Cron 路由保護密鑰 | ✅ |
| `WAR_ROOM_URL` | 部署後的 URL | ✅ |
| `NEWS_API_KEY` | NewsAPI.org Key（選填） | ⬜ |

## Telegram Bot 設定

1. 找 [@BotFather](https://t.me/BotFather) 建立 Bot，取得 `TELEGRAM_BOT_TOKEN`
2. 找 [@userinfobot](https://t.me/userinfobot) 取得你的 `TELEGRAM_CHAT_ID`
3. 填入 `.env`

## Railway 部署

### 步驟

```bash
# 1. 登入 Railway
railway login

# 2. 初始化專案（或 link 現有專案）
railway init

# 3. 新增 PostgreSQL 資料庫
railway add --database postgresql

# 4. 設定環境變數（必填）
railway variables set ANTHROPIC_API_KEY=sk-ant-...
railway variables set CRON_SECRET=$(openssl rand -hex 32)

# 5. 部署（第一次）
railway up

# 6. 取得部署 URL 後設定（從 Railway Dashboard 複製）
railway variables set WAR_ROOM_URL=https://your-app.railway.app

# 7. 選填：Telegram 通知
railway variables set TELEGRAM_BOT_TOKEN=...
railway variables set TELEGRAM_CHAT_ID=...

# 8. 執行 Seed（第一次部署完成後）
railway run pnpm prisma db seed

# 9. 重新部署（讓 Seed 後的 DB 生效）
railway up
```

### 重要注意事項

- **WAR_ROOM_URL** 必須設定才能讓 Cron Job 正常運作（Railway 用這個變數打 API）
- **Seed 只需執行一次**，之後 Cron Job 會自動補充每日推薦名單
- Railway 免費方案的 Cron 功能需要升級到 Hobby 方案
- PostgreSQL 資料庫連線字串 (`DATABASE_URL`) 由 Railway 自動注入，不需手動設定

## 頁面功能

| 頁面 | 路徑 | 說明 |
|------|------|------|
| War Room 首頁 | `/` | 今日作戰指令、攻堅名單、情報快覽 |
| 潛在客戶 | `/prospects` | 客戶列表、篩選、新增 |
| Pipeline 看板 | `/pipeline` | Kanban 看板、卡關追蹤 |
| 市場情報 | `/intelligence` | 雲廠商狀態、新聞、合作夥伴 |
| 策略中心 | `/strategy` | AI 策略、本週重點、放棄清單 |
| 會議整理 | `/meetings` | AI 解析會議記錄 |
| 客戶詳情 | `/customers/[id]` | 完整客戶資訊、Pipeline、會議時間軸 |

## Cron 排程

| 名稱 | 時間 | 說明 |
|------|------|------|
| check-status | 每 10 分鐘 | 檢查各雲廠商服務狀態（AWS/Azure/GCP/Cloudflare/Tencent/Huawei 等）|
| fetch-news | 每天 06:00 (台北) | 從官方 RSS 抓取競品新聞並 AI 摘要 + BD 角度分析 |
| gen-strategy | 每天 06:30 (台北) | AI 生成今日 Top3 作戰指令並推送 Telegram |
| news-midday | 每天 12:00 (台北) | 中午輕量新聞掃描（無 AI 摘要，省 API 費用）|
| score-customers | 每天 08:00 (台北) | 重算所有客戶優先級評分 |
| weekly-strategy | 每週一 07:00 (台北) | 週策略生成 |
| release-prospects | 每天 07:00 (台北) | 從備用池釋出 25 筆新潛在客戶推薦 |
