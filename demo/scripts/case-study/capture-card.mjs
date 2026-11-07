// Produces docs/case-study/card-refund-3x2.png: the refund card composed on the page field at 1200 × 800 for portfolio index cards: cd demo && node scripts/case-study/capture-card.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD, OUT, chromium, closePage, openPage, px, settle, startDemo, toRefundGate, tokens } from './lib.mjs';

const DESKTOP = { width: 1440, height: 1000 };
// 3:2 at 1x, the size the portfolio cards use. The card is sized to the field, not cropped from the 2:1 hero.
const CARD = { width: 1200, height: 800 };
// Generous margins: the thumbnail is shown small, so the card needs room on every side to read as an object
const MARGIN = 2 * px(tokens.space.xl);

mkdirSync(OUT, { recursive: true });
mkdirSync(BUILD, { recursive: true });
const demo = await startDemo();
const browser = await chromium.launch();

try {
  // Measure the card at 1x, then fit it inside the margins on whichever axis is tighter
  const measure = await openPage(browser, demo.url, { ...DESKTOP, scale: 1 });
  await toRefundGate(measure);
  await settle(measure);
  const card = await measure.locator('.cm-frame').boundingBox();
  await closePage(measure, 'card measure');
  const zoom = Math.min((CARD.width - 2 * MARGIN) / card.width, (CARD.height - 2 * MARGIN) / card.height);

  // Re-render at 2 × zoom so the downscaled card stays crisp
  const page = await openPage(browser, demo.url, { ...DESKTOP, scale: 2 * zoom });
  await toRefundGate(page);
  await settle(page);
  const cardPath = join(BUILD, 'card-refund.png');
  await page.locator('.cm-frame').screenshot({ path: cardPath });
  await closePage(page, 'card');

  // A file:// page, so it can load the file:// card image
  const sheetPath = join(BUILD, 'card.html');
  writeFileSync(sheetPath, `<!doctype html><body style="margin:0;background:${tokens.color.neutral.field.$value}">
    <div id="card" style="width:${CARD.width}px;height:${CARD.height}px;display:flex;align-items:center;justify-content:center">
      <img src="card-refund.png" style="width:${card.width * zoom}px;display:block">
    </div></body>`);
  const sheet = await openPage(browser, `file://${sheetPath}`, { ...CARD, scale: 1 });
  await sheet.locator('#card').screenshot({ path: join(OUT, 'card-refund-3x2.png') });
  await closePage(sheet, 'card sheet');
  console.log(`${join(OUT, 'card-refund-3x2.png')} (card zoom ${zoom.toFixed(2)})`);
} finally {
  await browser.close();
  await demo.close();
}
