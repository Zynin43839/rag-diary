# เชื่อม Supabase สำหรับ RAG-Diary

คู่มือสั้นสำหรับสร้างโปรเจกต์ใหม่และตรวจว่า API ใช้งานได้จริง

## สถานะปัจจุบัน

โปรเจกต์เดิม `okntmamtcgeqnzzjxbvo.supabase.co` ไม่มีอยู่ใน DNS แล้ว (ถูกลบหรือถูกระงับ)
ทุกคำขอที่ต้องใช้ auth และฐานข้อมูลจึงล้มเหลว ต้องสร้างโปรเจกต์ใหม่แล้วใส่ค่าใหม่

## ขั้นตอน

### 1. สร้างโปรเจกต์

1. เข้า supabase.com แล้ว New project
2. ตั้งชื่อ เช่น `rag-diary`, เลือก region ใกล้ไทย (Singapore)
3. ตั้งรหัสผ่านฐานข้อมูลให้แข็งแรง แล้วเก็บไว้ (ใช้ในขั้นที่ 3)

### 1.1 ตัวเลือกตอนสร้างโปรเจกต์ (Automate RLS)

ถ้าในหน้าสร้างโปรเจกต์มีตัวเลือกเหล่านี้ ให้ตั้งตามนี้

| ตัวเลือก | ตั้งเป็น | เหตุผล |
| --- | --- | --- |
| Automatically enable RLS for new tables | เปิดได้ (ไม่บังคับ) | เป็น event trigger ที่เปิด RLS ให้ตารางใหม่ทุกตาราง ไม่ได้แทนนโยบายของเรา |
| Automatically expose new tables | เปิด (ค่าเริ่มต้น) | ถ้าปิด ต้อง grant สิทธิ์ให้ anon/authenticated เองใน schema เพิ่ม |
| Enable Data API | เปิด | API ต้องเรียกผ่าน REST |

ตัวเลือก Automate RLS **ไม่เปลี่ยนค่าที่ต้องใส่ใน `.env`** เพราะมันทำงานฝั่งฐานข้อมูลเท่านั้น
สิ่งที่ต้องใส่ยังมีสามค่าเหมือนเดิม คือ `SUPABASE_URL`, `SUPABASE_ANON_KEY` และ `SUPABASE_DB_URL`

`schema.sql` ของโปรเจกต์เปิด RLS และสร้างนโยบาย 4 ข้อไว้แล้ว การเปิดตัวเลือกนี้ซ้ำจึงไม่มีผลข้างเคียง
(คำสั่ง `enable row level security` เรียกซ้ำได้ ไม่ error)

### 2. คัดลอกค่า API

Project Settings → API

- Project URL → `SUPABASE_URL`
- anon public key → `SUPABASE_ANON_KEY`

API ใช้ anon key เท่านั้น โดยตั้งใจ เพื่อให้ Row Level Security ทำงานทุกคำขอ
ไม่ต้องใส่ service_role key ในไฟล์ `.env`

### 3. คัดลอก connection string

Project Settings → Database → Connection string → URI

จะได้หน้าตาแบบนี้ (แทน `<password>` ด้วยรหัสจริง)

```
postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
```

ใช้เฉพาะสคริปต์ `apply:schema` ไม่ได้ถูกใช้ตอนรัน API

### 4. ใส่ค่าใน `server/.env`

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
OPENAI_API_KEY=<คีย์เดิม>
FRONTEND_ORIGIN=http://localhost:3000
```

### 5. สร้างตาราง ดัชนี ฟังก์ชัน และ RLS

```powershell
cd server
bun run apply:schema
```

ถ้าไม่ต้องการใช้สคริปต์ ให้เปิด `server/src/lib/schema.sql` แล้ววางใน SQL Editor ของ Supabase
แล้วกด Run (ไฟล์เดียวจบ)

สคริปต์จะสร้าง

- ตาราง `diary_entries` พร้อมคอลัมน์เวกเตอร์ 1536 มิติ
- ดัชนี btree บน `user_id` และ HNSW บน `embedding`
- ฟังก์ชัน `match_diary_entries` และ `search_diary_entries`
- นโยบาย RLS 4 ข้อ (select, insert, update, delete)

### 6. ตรวจการเชื่อมต่อ

```powershell
cd server
bun run check:supabase
```

ผลที่ต้องการ: PASS ทั้ง 4 ข้อ (host, ตาราง, ฟังก์ชัน 2 ตัว)

### 7. ทดสอบเส้นทางข้อมูลจริง

```powershell
# เทอร์มินัล 1
cd server; bun run dev

# เทอร์มินัล 2
cd frontend; bun dev
```

จากนั้นรันสคริปต์ QA ที่เตรียมไว้ (สมัคร, ล็อกอิน, สร้างบันทึก, ค้นหา, แชต, แยกข้อมูลสองผู้ใช้)

```powershell
python C:\Users\TEEREDCOM\AppData\Local\Temp\opencode\qa_api.py
```

## หมายเหตุ

- ถ้า `check:supabase` ยังขึ้น DNS error แปลว่า URL ผิดหรือโปรเจกต์ยังไม่พร้อม
- ถ้าตารางไม่พบ ให้รัน `apply:schema` ซ้ำ ไฟล์ SQL เขียนแบบ idempotent อยู่แล้ว
- ห้าม commit ไฟล์ `.env` ขึ้น git
