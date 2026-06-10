// unit test ของตัวคัดกรอง task — รันกับโค้ดที่ build แล้ว: npm run build && npm test
import test from 'node:test';
import assert from 'node:assert/strict';

process.env.TASK_KEYWORD = '/task';
delete process.env.ANTHROPIC_API_KEY; // ปิด AI — เทสต์เฉพาะ keyword path

const { TaskExtractionService } = await import('../dist/tasks/task-extraction.service.js');
const svc = new TaskExtractionService();

test('หลายบรรทัด = หลาย task', async () => {
  const out = await svc.extract('/task แก้ปุ่ม login\nเปลี่ยนสีปุ่ม');
  assert.equal(out.length, 2);
  assert.equal(out[0].title, 'แก้ปุ่ม login');
  assert.equal(out[1].title, 'เปลี่ยนสีปุ่ม');
});

test('ไม่มี keyword และไม่มี AI → ข้าม', async () => {
  assert.deepEqual(await svc.extract('สวัสดีครับ วันนี้กินข้าวยัง'), []);
});

test('keyword ตัวพิมพ์ใหญ่ก็จับได้', async () => {
  const out = await svc.extract('/TASK ทดสอบ');
  assert.equal(out.length, 1);
});

test('/task เปล่าๆ → ไม่สร้างงาน', async () => {
  assert.deepEqual(await svc.extract('/task'), []);
  assert.deepEqual(await svc.extract('/task   \n  '), []);
});

test('!ด่วน → priority high และ token ถูกตัดออกจากชื่องาน', async () => {
  const out = await svc.extract('/task แก้ระบบจ่ายเงิน !ด่วน');
  assert.equal(out[0].priority, 'high');
  assert.ok(!out[0].title.includes('!ด่วน'));
});

test('!low → priority low', async () => {
  const out = await svc.extract('/task ปรับสีปุ่ม !low');
  assert.equal(out[0].priority, 'low');
});

test('@YYYY-MM-DD → due date', async () => {
  const out = await svc.extract('/task ส่งรายงาน @2026-07-01');
  assert.equal(out[0].dueDate, '2026-07-01');
  assert.ok(!out[0].title.includes('@2026'));
});

test('ตัด title ที่ 60 grapheme + … (สระไทยไม่โดนผ่า)', async () => {
  const long = 'กี่'.repeat(70); // 70 grapheme ไทยมีสระ+วรรณยุกต์ (210 code points)
  const out = await svc.extract(`/task ${long}`);
  assert.ok(out[0].title.endsWith('…'));
  // 60 graphemes พอดี + ellipsis และต้องไม่จบด้วยสระลอยครึ่งตัว
  const seg = [...new Intl.Segmenter('th', { granularity: 'grapheme' }).segment(out[0].title)];
  assert.equal(seg.length, 61);
});

test('title สั้นไม่โดนตัด', async () => {
  const out = await svc.extract('/task งานสั้น');
  assert.equal(out[0].title, 'งานสั้น');
});
