// Produces hero-refund-2x.png, multihop-code-2x.png and mobile-refund-430-2x.png in docs/case-study, plus the "after" half of the refund before/after: cd demo && node scripts/case-study/capture-main.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD, OUT, chromium, closePage, openPage, px, settle, startDemo, toRefundGate, tokens } from './lib.mjs';

const DESKTOP = { width: 1440, height: 1000 };
const PHONE = { width: 430, height: 932 };
// Hero: 2:1 at 2x (2520 × 1260) on the page field, the card zoomed to leave space.xl above and below
const HERO = { width: 1260, height: 630 };

mkdirSync(OUT, { recursive: true });
mkdirSync(BUILD, { recursive: true });
const demo = await startDemo();
const browser = await chromium.launch();
const done = [];

try {
  // After half of the before/after: the refund card wrap at desktop, 2x
  {
    const page = await openPage(browser, demo.url, DESKTOP);
    await toRefundGate(page);
    await settle(page);
    await page.locator('.consent-card-wrap').screenshot({ path: join(BUILD, 'after-refund-2x.png') });
    await closePage(page, 'after');
    done.push(join(BUILD, 'after-refund-2x.png'));
  }

  // Hero: measure the card, then re-render it at 2 × zoom so it stays crisp, and center it on the field
  {
    const measure = await openPage(browser, demo.url, { ...DESKTOP, scale: 1 });
    await toRefundGate(measure);
    await settle(measure);
    const card = await measure.locator('.cm-frame').boundingBox();
    await closePage(measure, 'hero measure');
    const margin = px(tokens.space.xl);
    const zoom = (HERO.height - 2 * margin) / card.height;

    const page = await openPage(browser, demo.url, { ...DESKTOP, scale: 2 * zoom });
    await toRefundGate(page);
    await settle(page);
    const cardPath = join(BUILD, 'hero-card.png');
    await page.locator('.cm-frame').screenshot({ path: cardPath });
    await closePage(page, 'hero');

    // A file:// page, so it can load the file:// card image
    const sheetPath = join(BUILD, 'hero.html');
    writeFileSync(sheetPath, `<!doctype html><body style="margin:0;background:${tokens.color.neutral.field.$value}">
      <div id="hero" style="width:${HERO.width}px;height:${HERO.height}px;display:flex;align-items:center;justify-content:center">
        <img src="hero-card.png" style="width:${card.width * zoom}px;display:block">
      </div></body>`);
    const sheet = await openPage(browser, `file://${sheetPath}`, { ...HERO, scale: 2 });
    await sheet.locator('#hero').screenshot({ path: join(OUT, 'hero-refund-2x.png') });
    await closePage(sheet, 'hero sheet');
    done.push(`${join(OUT, 'hero-refund-2x.png')} (card zoom ${zoom.toFixed(2)})`);
  }

  // Multi-hop code side for shot 4: the card wrap with the trace drawn, desktop, 2x
  {
    const page = await openPage(browser, demo.url, DESKTOP);
    await page.locator('.landing-scenario', { hasText: 'Multi-hop' }).getByRole('button', { name: 'Run' }).click();
    await page.getByRole('button', { name: 'Change CRM Only' }).waitFor({ timeout: 15000 });
    await settle(page, 2000);
    await page.locator('.consent-card-wrap').screenshot({ path: join(OUT, 'multihop-code-2x.png') });
    await closePage(page, 'multi-hop');
    done.push(join(OUT, 'multihop-code-2x.png'));
  }

  // Phone: 430 × 932, 2x. The two-row top bar and the whole refund card, bottom border included, in one frame
  {
    const page = await openPage(browser, demo.url, PHONE);
    await toRefundGate(page);
    await settle(page, 1500);
    const fit = await page.evaluate(() => {
      const card = document.querySelector('.cm-frame').getBoundingClientRect();
      const bar = document.querySelector('.cm-topbar').getBoundingClientRect();
      return { scrollY, barTop: bar.top, cardBottom: card.bottom, height: innerHeight };
    });
    if (fit.scrollY !== 0 || fit.barTop < 0 || fit.cardBottom > fit.height) {
      throw new Error(`phone: top bar and card don't fit one frame ${JSON.stringify(fit)}`);
    }
    await page.screenshot({ path: join(OUT, 'mobile-refund-430-2x.png') });
    await closePage(page, 'phone');
    done.push(join(OUT, 'mobile-refund-430-2x.png'));
  }
} finally {
  await browser.close();
  await demo.close();
}
console.log(done.map(String).join('\n'));
