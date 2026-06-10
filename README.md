# Line Task Manager

Kanban board ที่เชื่อมกับ LINE Group — Bot อ่านข้อความในกลุ่ม ดึงเฉพาะ "งาน" มาเป็น Task แล้วทีมลากการ์ดผ่าน `Todo → In Process → Test → Done` พร้อมแจ้งความคืบหน้ากลับเข้ากลุ่มอัตโนมัติ

**ฟีเจอร์หลัก**

- 📥 ดักงานจาก LINE ด้วย keyword `/task` (หลายบรรทัด = หลายงาน) + กันซ้ำตอน LINE retry
- 🤖 (optional) AI คัดกรองข้อความธรรมชาติ — ลูกค้าพิมพ์ปกติไม่ต้องใส่ keyword ระบบแยกเองว่าเป็นงานไหม (ใช้ Claude ผ่าน `ANTHROPIC_API_KEY`)
- 🔥 priority (`!ด่วน` `!high` `!low`) และกำหนดส่ง (`@2026-07-01`) บนการ์ด พร้อมเตือนงานเลยกำหนด
- 🗂️ Kanban 4 คอลัมน์ ลากข้ามคอลัมน์ + **จัดลำดับในคอลัมน์** (ลำดับถูกเก็บจริง refresh ไม่สลับ)
- 📣 push แจ้งกลับเข้ากลุ่ม LINE เมื่อสถานะเปลี่ยน/มีคนรับงาน (เลือกได้ว่าแจ้งสถานะไหน — กัน spam)
- ⚡ realtime ทุกหน้าจอผ่าน WebSocket + แถบเตือนเมื่อหลุดการเชื่อมต่อ
- 🔐 รหัสผ่านบอร์ด (`BOARD_PASSWORD`) คุมทั้ง REST และ WebSocket + จำกัด CORS ได้
- 🐳 Docker ครบชุด (db + backend + frontend/nginx) — public URL เดียวจบทั้งบอร์ดและ webhook
- ✅ unit tests + e2e tests + GitHub Actions CI

---

## โครงสร้างโปรเจกต์

| โฟลเดอร์ | คืออะไร |
|---|---|
| `backend/` | NestJS — webhook, REST API, WebSocket, AI extraction, ต่อ PostgreSQL |
| `frontend/` | React + Vite + dnd-kit — Kanban board (+ nginx.conf สำหรับ production) |
| `migrations/` | SQL สร้างตาราง (line_messages, users, tasks) |
| `docker-compose.yml` | db สำหรับ dev / ทั้งชุดด้วย profile `full` |
| `.github/workflows/` | CI: build + test ทั้ง backend และ frontend |

---

## วิธีรันโหมด Dev

ต้องมี Node.js 20+ และ Docker

```bash
# 1. PostgreSQL
docker compose up -d

# 2. Backend
cd backend
npm install
cp .env.example .env        # แล้วใส่ค่า LINE channel
npm run migrate
npm run start:dev           # http://localhost:3000

# 3. Frontend (เทอร์มินัลใหม่)
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

## รัน Production ด้วย Docker (ทั้งชุด)

```bash
cp backend/.env.example backend/.env   # ใส่ค่าให้ครบ (ดูตาราง env ด้านล่าง)
docker compose --profile full up -d --build
```

- บอร์ด + webhook อยู่หลัง nginx ที่ **http://localhost:8080** — ชี้โดเมน/tunnel มาที่นี่ที่เดียว
- backend รอ db พร้อม → รัน migration อัตโนมัติ → มี healthcheck ที่ `/health`

### Environment variables (`backend/.env`)

| ตัวแปร | จำเป็น | คืออะไร |
|---|---|---|
| `LINE_CHANNEL_SECRET` | ✅ | จาก LINE Developers Console (ตรวจ webhook signature) |
| `LINE_CHANNEL_ACCESS_TOKEN` | ✅ | จาก LINE Developers Console (ส่งข้อความ) |
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `TASK_KEYWORD` | — | keyword ดักงาน (default `/task`) |
| `BOARD_PASSWORD` | แนะนำ | รหัสเข้าบอร์ด — ไม่ตั้ง = เปิดโล่ง (dev เท่านั้น) |
| `CORS_ORIGIN` | แนะนำ | โดเมนบอร์ด เช่น `https://board.example.com` — ไม่ตั้ง = `*` |
| `NOTIFY_STATUSES` | — | สถานะที่แจ้งเข้ากลุ่ม (default ทั้งหมด) เช่น `done` อย่างเดียวเพื่อประหยัด quota |
| `NOTIFY_ASSIGN` | — | แจ้งตอนรับงาน (default `true`) |
| `ANTHROPIC_API_KEY` | — | ใส่แล้วเปิด AI คัดกรองข้อความที่ไม่มี keyword |
| `AI_EXTRACT_MODEL` | — | โมเดล AI (default `claude-opus-4-8`, ประหยัดใช้ `claude-haiku-4-5`) |

---

## ต่อ LINE OA จริง (ทีละขั้น)

### ฝั่ง LINE Developers Console (https://developers.line.biz)

1. สร้าง Provider + **Messaging API channel** (ตัวนี้คือ LINE OA ของบอต)
2. แท็บ **Basic settings** → คัดลอก **Channel secret** ใส่ `backend/.env` → `LINE_CHANNEL_SECRET`
3. แท็บ **Messaging API** → กด **Issue** ที่ Channel access token (long-lived) ใส่ `LINE_CHANNEL_ACCESS_TOKEN`
4. เปิด tunnel ไปที่ nginx: `ngrok http 8080` (หรือ `ngrok http 3000` ถ้ารันแบบ dev ไม่ผ่าน nginx)
5. ตั้ง **Webhook URL** = `https://xxxx.ngrok.io/webhook` → กด **Verify** (ต้องขึ้น Success) → เปิด **Use webhook**
6. ที่ **LINE Official Account Manager** (https://manager.line.biz) → Settings → Response settings:
   **Chat** = OFF, **Auto-response** = OFF, **Webhooks** = ON, **Greeting message** = OFF
7. Settings → Account settings → เปิด **Allow bot to join group chats** (ไม่เปิด = เชิญบอตเข้ากลุ่มไม่ได้)

### ทดลองใช้

8. เชิญ bot เข้ากลุ่ม → บอตทักทายพร้อมสอนวิธีใช้อัตโนมัติ
9. พิมพ์ในกลุ่ม:

```
/task แก้ปุ่ม login หน้าแรก !ด่วน @2026-07-01
เปลี่ยนสีปุ่มเป็นสีเขียว
```

→ ได้ 2 การ์ดใน Todo (ใบแรกติด priority ด่วน + กำหนดส่ง) และ bot ตอบ "รับเข้า Todo แล้ว 2 งาน ✅"

> ถ้าตั้ง `ANTHROPIC_API_KEY` ไว้ ข้อความธรรมดาอย่าง "พี่ครับ หน้า login กดแล้วค้าง ช่วยดูหน่อย" ก็จะกลายเป็นการ์ดเองโดยไม่ต้องพิมพ์ `/task` — ส่วนข้อความคุยเล่นจะถูกข้าม

### การแจ้งเตือนกลับเข้ากลุ่ม

- ลากการ์ดข้ามคอลัมน์ → `งาน: … สถานะ → 🔧 In Process (กำลังทำ)`
- กดรับงาน → `🙋 สมชาย รับงาน "…" แล้ว`
- ปรับให้แจ้งเฉพาะบางสถานะได้ด้วย `NOTIFY_STATUSES` (push ใช้ quota ข้อความของ OA — แพ็กเกจฟรี ~300 ข้อความ/เดือน)

---

## API Endpoints

| Method | Path | Auth | ใช้ทำอะไร |
|---|---|---|---|
| POST | `/webhook` | LINE signature | รับ event จาก LINE |
| GET | `/health` | — | healthcheck (เช็ค DB ด้วย) |
| GET | `/tasks` | `x-board-key` | ดึง task ทั้งหมด (เรียงตาม position) |
| PATCH | `/tasks/:id/status` | `x-board-key` | เปลี่ยนสถานะ (ต่อท้ายคอลัมน์ใหม่) |
| PATCH | `/tasks/:id/move` | `x-board-key` | ย้ายการ์ดไป `{status, index}` — ใช้ตอนลาก |
| POST | `/tasks/:id/assign` | `x-board-key` | รับงาน `{userId, displayName}` |

WebSocket (ต้องส่ง `auth.key` ถ้าตั้งรหัส): `task:created`, `task:updated`, `tasks:refresh`

---

## เทสต์

```bash
# unit tests (ตัวคัดกรอง task: keyword, priority, due date, grapheme truncation)
cd backend && npm run build && npm test

# e2e (เปิด Chrome จริง ทดสอบบอร์ด+realtime+ลากการ์ด — ต้องมี backend:3000 และ vite:5173 รันอยู่
# และ backend ต้องรันด้วย LINE_CHANNEL_SECRET=test_secret)
cd frontend && npm run test:e2e
```

CI (GitHub Actions) build + test อัตโนมัติทุก push

---

## ที่ตัดสินใจไว้

| เรื่อง | เลือก |
|---|---|
| คัด task | keyword `/task` + AI optional (เปิดด้วย `ANTHROPIC_API_KEY`) |
| 1 ข้อความหลายงาน | ขึ้นบรรทัดใหม่ = 1 งาน |
| กัน task ซ้ำ | เช็ค `message_id` ก่อน insert |
| ลำดับการ์ด | เก็บ `position` ต่อคอลัมน์ ย้าย/แทรกได้ ลำดับคงอยู่หลัง refresh |
| auth | รหัสผ่านร่วม 1 ตัวทั้งบอร์ด (อนาคต: LINE Login) |
| AI พังหรือช้า | fail-open — ข้ามข้อความนั้น ไม่บล็อก webhook |

## แผนต่อ (Phase ถัดไป)

- LINE Login ให้ตัวตนบนบอร์ดตรงกับตัวตนใน LINE
- รายงานสถิติ / สรุปงานประจำสัปดาห์เข้ากลุ่ม
- แก้ไข/ลบการ์ดจากหน้าบอร์ด
