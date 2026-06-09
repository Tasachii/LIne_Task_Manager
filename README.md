# Line Task Manager

Kanban board ที่เชื่อมกับ LINE Group — Bot อ่านข้อความในกลุ่ม ดึงเฉพาะ "งาน" มาเป็น Task แล้วทีมลากการ์ดผ่าน `Todo → In Process → Test → Done` พร้อม update แบบ realtime

> นี่คือ **Phase 1 (MVP)**: ดักงานด้วย keyword `/task`, Kanban 4 คอลัมน์, drag & drop, รับงาน, realtime
> ส่วน AI auto-detect / แจ้งเตือนกลับ LINE / รายงาน คือ Phase 2–4 (ดู `00-system-design.md`)

---

## โครงสร้างโปรเจกต์

| โฟลเดอร์ | คืออะไร |
|---|---|
| `backend/` | NestJS — webhook, REST API, WebSocket, ต่อ PostgreSQL |
| `frontend/` | React + Vite + dnd-kit — Kanban board |
| `migrations/` | SQL สร้างตาราง (line_messages, users, tasks) |
| `docker-compose.yml` | PostgreSQL สำหรับ dev |

---

## สิ่งที่ต้องมีก่อน (Prerequisites)

- Node.js 20+
- Docker (สำหรับ PostgreSQL) — หรือจะใช้ PostgreSQL ที่มีอยู่แล้วก็ได้
- LINE Developers account + Messaging API channel (ตอนต่อ LINE จริง)
- ngrok หรือ tunnel อื่น ๆ (เพราะ LINE webhook ต้องเป็น HTTPS public URL)

---

## วิธีรัน (Setup)

### 1. เปิด PostgreSQL

```bash
docker compose up -d
```

หรือถ้าใช้ Postgres ของตัวเอง ให้แก้ `DATABASE_URL` ใน `backend/.env` ให้ตรง

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env        # แล้วแก้ค่า LINE channel + DATABASE_URL
npm run migrate             # สร้างตารางทั้งหมด
npm run start:dev           # รันที่ http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                 # เปิด http://localhost:5173
```

เปิดเบราว์เซอร์ที่ `http://localhost:5173` จะเห็นบอร์ด 4 คอลัมน์

---

## ทดสอบบอร์ดเร็ว ๆ (ยังไม่ต้องต่อ LINE)

ใส่ task ปลอมเข้า DB ตรง ๆ เพื่อดูบอร์ดทำงาน:

```bash
docker exec -it ltm_postgres psql -U line -d line_task_manager -c \
"INSERT INTO tasks (id, title, description, status, group_id) \
 VALUES ('t1','แก้ปุ่ม login หน้าแรก','กดแล้วไม่มี response','todo','G_demo');"
```

รีเฟรชบอร์ด → จะเห็นการ์ดในคอลัมน์ Todo ลองลากข้ามคอลัมน์ และกด "รับงาน" ได้เลย
(เปิด 2 แท็บ จะเห็นว่า update เด้งพร้อมกันจาก WebSocket)

---

## ต่อ LINE จริง

1. ไปที่ **LINE Developers Console** → channel → Messaging API
2. เปิด **Allow bot to join group chats** (ค่าเริ่มต้นปิดอยู่)
3. เอา **Channel secret** กับ **Channel access token** ใส่ใน `backend/.env`
4. เปิด tunnel: `ngrok http 3000` → ได้ URL เช่น `https://xxxx.ngrok.io`
5. ตั้ง **Webhook URL** = `https://xxxx.ngrok.io/webhook` แล้วเปิด **Use webhook**
6. เชิญ bot เข้ากลุ่ม แล้วพิมพ์:

```
/task แก้ปุ่ม login หน้าแรก
เปลี่ยนสีปุ่มเป็นสีเขียว
```

→ ขึ้นเป็น 2 การ์ดในคอลัมน์ Todo และ bot ตอบ "รับเข้า Todo แล้ว 2 งาน ✅"

> ข้อความที่ **ไม่ได้** ขึ้นต้นด้วย `/task` จะถูกข้าม (คุยเล่นไม่กลายเป็น task)

---

## API Endpoints

| Method | Path | ใช้ทำอะไร |
|---|---|---|
| POST | `/webhook` | รับ event จาก LINE (ตรวจ X-Line-Signature ก่อนเสมอ) |
| GET | `/tasks` | ดึง task ทั้งหมด (มี assignee_name มาด้วย) |
| PATCH | `/tasks/:id/status` | เปลี่ยนสถานะ (ตอนลากการ์ด) body: `{ "status": "in_process" }` |
| POST | `/tasks/:id/assign` | รับงาน body: `{ "userId": "...", "displayName": "..." }` |

WebSocket: ปล่อย event `task:created` และ `task:updated` ให้ทุก client

---

## ที่ตัดสินใจไว้ใน MVP นี้

| เรื่อง | MVP เลือก |
|---|---|
| คัด task | keyword `/task` (เปลี่ยนคำได้ที่ `.env` → `TASK_KEYWORD`) |
| 1 ข้อความหลายงาน | ขึ้นบรรทัดใหม่ = 1 งาน |
| กัน task ซ้ำ | เช็ค `message_id` ก่อน insert (กัน LINE retry webhook) |
| 1 task รับได้กี่คน | คนเดียว (`assignee_id` เดี่ยว) |
| ใครลากการ์ดก็ได้ | MVP ยังไม่ล็อกสิทธิ์ |
| auth บนบอร์ด | ยังไม่มี — ใช้ช่อง "ฉันคือ" ตั้งชื่อเอา (เก็บใน localStorage) |

---

## ยังไม่ได้ทำในเฟสนี้ (ไป Phase ถัดไป)

- AI ดึง task จากข้อความธรรมชาติ (ไม่ต้องพิมพ์ `/task`)
- แจ้งเตือนกลับเข้า LINE เมื่อสถานะเปลี่ยน
- จัดลำดับการ์ดในคอลัมน์ (ตอนนี้ลากข้ามคอลัมน์ได้ แต่ยังไม่จัดลำดับในคอลัมน์)
- priority / due date, รายงานสถิติ
