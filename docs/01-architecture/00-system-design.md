# Line Task Manager — System Design

| หัวข้อ | รายละเอียด |
|---|---|
| Project | Line Task Manager |
| Version | 0.1 (Draft) |
| วันที่ | 2026-06-08 |
| สถานะ | Requirements Phase — ยังไม่เริ่มพัฒนา |

---

## §1. Overview

Kanban board ที่เชื่อมกับ LINE Group — Bot อ่านข้อความในกลุ่ม LINE ดึงเฉพาะ "งาน" ออกมาเป็น Task แล้วแสดงบน Kanban Board ให้ทีมจัดการสถานะแบบ realtime

---

## §2. Architecture Diagram

```
┌─────────────┐   ข้อความ    ┌──────────────┐
│  LINE Group │ ───────────> │ LINE Platform │
└─────────────┘              └──────┬───────┘
                                    │ Webhook (HTTPS POST)
                                    v
                          ┌──────────────────┐
                          │   Backend Server  │
                          │  - รับ webhook     │
                          │  - คัด/แปลง Task   │ ──> [AI / LLM API]
                          │  - REST + WebSocket│
                          └─────────┬─────────┘
                                    │
                       ┌────────────┼────────────┐
                       v                          v
                ┌─────────────┐           ┌──────────────┐
                │  Database   │           │  Frontend     │
                │ (Task, User)│           │ Kanban Board  │
                └─────────────┘           └──────────────┘
```

---

## §3. Bounded Contexts

| # | Context | Responsibility | Flow Doc |
|---|---|---|---|
| 1 | LINE Integration | Webhook receiving, X-Line-Signature verification, LINE API calls (Get Profile, Reply Message) | [line-intake-task-creation](../flows/202606080000-line-intake-task-creation-flow.html) |
| 2 | Task Extraction | Message classification (task vs chit-chat), multi-task splitting, task creation with source metadata | [line-intake-task-creation](../flows/202606080000-line-intake-task-creation-flow.html) |
| 3 | Board & Assignment | Kanban board display (4 columns), drag & drop status transitions, realtime WebSocket sync, member task assignment | [kanban-board-assignment](../flows/202606080001-kanban-board-assignment-flow.html) |

---

## §4. Tech Stack (Proposed — ยังไม่ฟิกซ์)

| ส่วน | ตัวเลือก | เหตุผล |
|---|---|---|
| Backend | Node.js + Express **หรือ** Python + FastAPI | LINE มี SDK official ทั้ง 2 ภาษา |
| LINE | LINE Messaging API + LINE Bot SDK | ตัวหลักของระบบ |
| AI (Phase 2) | Claude API หรือ OpenAI | ดึง Task จากข้อความธรรมชาติ |
| Frontend | React + dnd-kit | Kanban drag & drop — dnd-kit actively maintained |
| Realtime | WebSocket / Socket.io | บอร์ด update สด delay ≤1-2s (NFR) |
| Database | PostgreSQL **หรือ** MongoDB | เก็บ Task/User |
| Hosting | ใดก็ได้ที่มี HTTPS | LINE webhook บังคับ HTTPS + valid SSL |

---

## §5. Data Model

### tasks

| field | type | คำอธิบาย |
|---|---|---|
| id | string (uuid) | รหัส Task |
| title | string | หัวข้อสั้น ๆ |
| description | text | รายละเอียด + ข้อความต้นฉบับจาก LINE |
| status | enum | `todo` / `in_process` / `test` / `done` |
| source_message_id | string FK | messageId จาก LINE (→ line_messages) |
| group_id | string | LINE groupId ต้นทาง |
| created_by | string FK | line userId ของคนสั่งงาน (→ users) |
| assignee_id | string FK \| null | คนรับงาน (→ users) null = ยังไม่มีคนรับ |
| priority | enum \| null | low / medium / high (optional) |
| created_at | datetime | เวลาเข้าระบบ |
| updated_at | datetime | เวลาแก้ล่าสุด |

### users

| field | type | คำอธิบาย |
|---|---|---|
| id | string | รหัสภายใน |
| line_user_id | string | userId จาก LINE |
| display_name | string | ชื่อที่แสดงบนการ์ด |
| role | enum | `member` / `admin` |

### line_messages

| field | type | คำอธิบาย |
|---|---|---|
| message_id | string PK | messageId จาก LINE |
| group_id | string | groupId ต้นทาง |
| user_id | string | userId ผู้ส่ง |
| content | text | ข้อความดิบต้นฉบับ |
| timestamp | datetime | เวลาที่ส่ง |

---

## §6. Phase การพัฒนา

| Phase | สิ่งที่ทำ | ผลลัพธ์ |
|---|---|---|
| **1 — MVP** | Webhook + keyword `/task` → Kanban board 4 คอลัมน์ + drag & drop | ใช้งานได้จริงครบ flow |
| **2 — AI** | เปลี่ยนจาก keyword เป็น AI ดึง Task จากข้อความปกติ | ลูกค้าพิมพ์ธรรมดาได้ |
| **3 — Assign + Notify** | กดรับงาน, แจ้งเตือนใน LINE เมื่อ status เปลี่ยน, priority/due date | ตามงานง่ายขึ้น |
| **4 — Report** | สถิติงานค้าง, คนทำเสร็จเท่าไหร่, เวลาเฉลี่ยต่อ Task | เห็นภาพรวมทีม |

---

*Flow docs hub: [docs/flows/index.html](../flows/index.html)*
