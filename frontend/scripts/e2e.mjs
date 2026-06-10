import puppeteer from 'puppeteer-core';
import crypto from 'crypto';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const APP = 'http://localhost:5173';
const results = [];
const ok = (name, pass, detail = '') => {
  results.push(`${pass ? 'PASS' : 'FAIL'} | ${name}${detail ? ' — ' + detail : ''}`);
};

function sendWebhook(msgId, text) {
  const body = JSON.stringify({
    events: [{
      type: 'message',
      message: { type: 'text', id: msgId, text },
      source: { type: 'group', groupId: 'G_test_group', userId: 'U_test_user' },
      replyToken: 'rt_ui', timestamp: Date.now(), mode: 'active',
      webhookEventId: 'we_' + msgId, deliveryContext: { isRedelivery: false },
    }],
  });
  const sig = crypto.createHmac('sha256', 'test_secret').update(body).digest('base64');
  return fetch('http://localhost:3000/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-line-signature': sig },
    body,
  });
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });
try {
  const pageA = await browser.newPage();
  const errorsA = [];
  pageA.on('pageerror', (e) => errorsA.push(e.message));
  await pageA.setViewport({ width: 1400, height: 900 });
  await pageA.goto(APP, { waitUntil: 'networkidle0' });

  // 1. ใส่ชื่อ → บอร์ดโผล่
  await pageA.waitForSelector('.app__me-input');
  await pageA.type('.app__me-input', 'ผู้ทดสอบ');
  await pageA.waitForSelector('.col', { timeout: 5000 });
  const labels = await pageA.$$eval('.col__label', (els) => els.map((e) => e.textContent));
  ok('บอร์ด 4 คอลัมน์', JSON.stringify(labels) === JSON.stringify(['Todo', 'In Process', 'Test', 'Done']), labels.join(' / '));

  // 2. เปิดแท็บที่สอง
  const pageB = await browser.newPage();
  await pageB.setViewport({ width: 1400, height: 900 });
  await pageB.goto(APP, { waitUntil: 'networkidle0' });
  await pageB.waitForSelector('.col', { timeout: 5000 });

  // 3. ยิง webhook → การ์ดต้องเด้งทั้ง 2 แท็บโดยไม่ refresh
  const TITLE = 'งานทดสอบ UI realtime ' + Date.now();
  await sendWebhook('msg_ui_' + Date.now(), '/task ' + TITLE);
  const appeared = async (page) =>
    page.waitForFunction(
      (t) => [...document.querySelectorAll('.card__title')].some((el) => el.textContent === t),
      { timeout: 6000, polling: 100 }, TITLE,
    ).then(() => true).catch(() => false);
  ok('การ์ดใหม่เด้งแท็บ A (realtime)', await appeared(pageA));
  ok('การ์ดใหม่เด้งแท็บ B (realtime)', await appeared(pageB));

  // 4. กดรับงานบนแท็บ A → ชื่อขึ้นบนแท็บ B
  const clicked = await pageA.evaluate((t) => {
    const card = [...document.querySelectorAll('.card')].find(
      (c) => c.querySelector('.card__title')?.textContent === t,
    );
    const btn = card?.querySelector('.card__take');
    if (!btn) return false;
    btn.click();
    return true;
  }, TITLE);
  ok('ปุ่มรับงานกดได้', clicked);
  const assigneeShown = await pageB.waitForFunction(
    (t) => {
      const card = [...document.querySelectorAll('.card')].find(
        (c) => c.querySelector('.card__title')?.textContent === t,
      );
      return card?.querySelector('.card__assignee')?.textContent.includes('ผู้ทดสอบ');
    },
    { timeout: 6000, polling: 100 }, TITLE,
  ).then(() => true).catch(() => false);
  ok('ชื่อผู้รับงาน sync ไปแท็บ B (realtime)', assigneeShown);

  // 5. ลากการ์ดจาก Todo → In Process (จำลอง pointer drag ของ dnd-kit)
  const cardHandle = await pageA.evaluateHandle((t) => {
    return [...document.querySelectorAll('.col--todo .card')].find(
      (c) => c.querySelector('.card__title')?.textContent === t,
    );
  }, TITLE);
  const cardBox = await cardHandle.asElement().boundingBox();
  const dropBox = await (await pageA.$('.col--in_process .col__drop')).boundingBox();
  await pageA.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + 12);
  await pageA.mouse.down();
  // ขยับเป็นช่วงๆ ให้เกิน activation distance 5px
  for (let i = 1; i <= 10; i++) {
    await pageA.mouse.move(
      cardBox.x + cardBox.width / 2 + ((dropBox.x + dropBox.width / 2 - cardBox.x - cardBox.width / 2) * i) / 10,
      cardBox.y + 12 + ((dropBox.y + 60 - cardBox.y - 12) * i) / 10,
      { steps: 2 },
    );
  }
  await pageA.mouse.up();
  const moved = await pageB.waitForFunction(
    (t) => [...document.querySelectorAll('.col--in_process .card__title')].some((el) => el.textContent === t),
    { timeout: 6000, polling: 100 }, TITLE,
  ).then(() => true).catch(() => false);
  ok('ลากการ์ด Todo → In Process (เห็นผลแท็บ B)', moved);

  // 6. เก็บ JS error + screenshot
  ok('ไม่มี JS error บนหน้า', errorsA.length === 0, errorsA.join('; '));
  await pageA.screenshot({ path: '/tmp/ltm_board.png' });
} finally {
  await browser.close();
}
console.log(results.join('\n'));
