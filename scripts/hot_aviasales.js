// Читает aviasales.ru/hottickets/ovb в настоящем браузере и печатает карточки билетов в JSON.
// Запуск: NODE_PATH=$(npm root -g) node scripts/hot_aviasales.js > /tmp/hot.json
const { chromium } = require('playwright');

const MONTHS = { 'ЯНВ': 1, 'ФЕВ': 2, 'МАР': 3, 'АПР': 4, 'МАЙ': 5, 'ИЮН': 6, 'ИЮЛ': 7, 'АВГ': 8, 'СЕН': 9, 'ОКТ': 10, 'НОЯ': 11, 'ДЕК': 12 };

function parse(text, today) {
  const lines = text.split('\n').map(s => s.replace(/⁠/g, '').trim()).filter(Boolean);
  const starts = [];
  lines.forEach((l, i) => { if (l === 'Больше билетов') starts.push(i); });
  const cards = [];
  starts.forEach((s, k) => {
    const seg = lines.slice(s + 1, (starts[k + 1] || lines.length + 1) - 1);
    const prices = seg.filter(l => /^\d[\d\s]*\s₽$/.test(l)).map(l => +l.replace(/\D/g, ''));
    const mi = seg.findIndex(l => MONTHS[l]);
    const dest = seg.find(l => /^[A-Z]{3} /.test(l) && !l.startsWith('OVB'));
    if (!prices.length || mi < 0 || !dest) return;
    const pi = seg.findIndex(l => /^\d[\d\s]*\s₽$/.test(l));
    const month = MONTHS[seg[mi]], day = +seg[mi + 1];
    let year = today.getFullYear();
    if (month < today.getMonth() + 1) year++;
    cards.push({
      city: lines[s - 1],
      price: prices[0],
      old_price: prices[1] || null,
      airline: seg[pi + (prices[1] ? 2 : 1)] || null,
      date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      iata: dest.slice(0, 3),
      airport: dest.slice(4),
      transfers: seg.some(l => /Прямой/.test(l)) ? 0 : null,
    });
  });
  return cards;
}

(async () => {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const browser = await chromium.launch({ proxy: proxy ? { server: proxy } : undefined });
  const ctx = await browser.newContext({ locale: 'ru-RU', viewport: { width: 1280, height: 1600 }, ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36' });
  const page = await ctx.newPage();
  await page.goto('https://www.aviasales.ru/hottickets/ovb', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(10000);
  for (let i = 0; i < 6; i++) { await page.mouse.wheel(0, 2500); await page.waitForTimeout(1200); }
  const text = await page.evaluate(() => document.body.innerText);
  await browser.close();
  process.stdout.write(JSON.stringify(parse(text, new Date()), null, 1));
})();
