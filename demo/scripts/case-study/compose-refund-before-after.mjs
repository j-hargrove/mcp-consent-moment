// Produces docs/case-study/refund-before-after-2x.png from the two captured halves, labeled in IBM Plex Mono on the field (run both capture scripts first): cd demo && node scripts/case-study/compose-refund-before-after.mjs
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BUILD, OUT, chromium, closePage, openPage, px, tokens } from './lib.mjs';

// Same layout as multihop-figma-vs-code.png: page field, space.xl margins and gap, top-aligned at 1x CSS on a 2x sheet
const halves = ['before-refund-2x.png', 'after-refund-2x.png'];
for (const half of halves) {
  if (!existsSync(join(BUILD, half))) throw new Error(`Missing ${join(BUILD, half)}: run capture-before.mjs and capture-main.mjs first`);
}

const { color, space, font } = tokens;
const sheetPath = join(BUILD, 'before-after.html');
writeFileSync(sheetPath, `<!doctype html><html><head>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@${font.weight.decision.$value}&display=block" rel="stylesheet">
<style>
  * { margin: 0; box-sizing: border-box; }
  body { background: ${color.neutral.field.$value}; }
  .sheet { display: inline-flex; align-items: flex-start; gap: ${px(space.xl)}px; padding: ${px(space.xl)}px; background: ${color.neutral.field.$value}; }
  .col { display: flex; flex-direction: column; gap: ${px(space.s)}px; }
  .label {
    font-family: '${font.family.mono.$value[0]}', monospace; font-size: ${px(font.size.m)}px;
    font-weight: ${font.weight.decision.$value}; line-height: ${font['line-height'].body.$value}; color: ${color.palette.slate.$value};
  }
  img { display: block; }
</style></head><body><div class="sheet">
  <div class="col"><div class="label">Before</div><img id="before" src="${halves[0]}"></div>
  <div class="col"><div class="label">After</div><img id="after" src="${halves[1]}"></div>
</div></body></html>`);

const browser = await chromium.launch();
try {
  const page = await openPage(browser, `file://${sheetPath}`, { width: 1600, height: 900, scale: 2 });
  // Show each 2x capture at its 1x CSS size, so it lands pixel for pixel on the 2x sheet
  await page.evaluate(() => document.querySelectorAll('img').forEach(img => { img.style.width = `${img.naturalWidth / 2}px`; }));
  const mono = await page.evaluate(family => document.fonts.check(`600 14px '${family}'`), font.family.mono.$value[0]);
  if (!mono) throw new Error('IBM Plex Mono did not load');
  await page.locator('.sheet').screenshot({ path: join(OUT, 'refund-before-after-2x.png') });
  await closePage(page, 'compose');
} finally {
  await browser.close();
}
console.log(join(OUT, 'refund-before-after-2x.png'));
