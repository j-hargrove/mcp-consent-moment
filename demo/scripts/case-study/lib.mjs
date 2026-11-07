// Shared helpers for the case-study scripts: start a demo dev server, open a 2x page, read tokens. Not run directly.
import { mkdtempSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

export const DEMO = fileURLToPath(new URL('../../', import.meta.url));
export const ROOT = join(DEMO, '..');
/** Final shots land in docs/case-study unless OUT points somewhere else (e.g. a temp folder to compare). */
export const OUT = process.env.OUT ?? join(ROOT, 'docs', 'case-study');
/** Intermediate shots (before/after halves) live in a temp folder, never the repo or ~/Desktop. */
export const BUILD = process.env.BUILD ?? join(tmpdir(), 'consent-moment-case-study');

const require = createRequire(join(DEMO, 'package.json'));
export const { chromium } = require('playwright');

export const tokens = JSON.parse(readFileSync(join(ROOT, 'docs', 'design', 'tokens.json'), 'utf8'));
export const px = token => token.$value.value;

/**
 * Starts a Vite dev server for the demo at `demoDir` on its own dependency cache, so two versions
 * (main and a worktree) can't clobber each other's optimized deps. Returns { url, close }.
 */
export async function startDemo(demoDir = DEMO) {
  const server = await createServer({
    root: demoDir,
    configFile: join(demoDir, 'vite.config.js'),
    cacheDir: mkdtempSync(join(tmpdir(), 'vite-cache-')),
    server: { port: 0, strictPort: false },
    logLevel: 'error',
  });
  await server.listen();
  const url = server.resolvedUrls.local[0];
  return { url, close: () => server.close() };
}

/** A fresh page at the given viewport and device scale. Phone sizes get touch. Page errors throw at the end. */
export async function openPage(browser, url, { width, height, scale = 2 }) {
  const phone = width < px(tokens.size['breakpoint-s']);
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, isMobile: phone, hasTouch: phone });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

export async function closePage(page, label) {
  await page.context().close();
  if (page.errors.length) throw new Error(`${label}: page errors: ${page.errors.join(' | ')}`);
}

/** Let motion settle, park the mouse, drop any focus ring, so the card shows its resting state. */
export async function settle(page, ms = 1200) {
  await page.mouse.move(0, 0);
  await page.waitForTimeout(ms);
  await page.evaluate(() => document.activeElement?.blur());
}

/** Current main: Happy path, approve the ticket, stop at the refund gate. */
export async function toRefundGate(page) {
  await page.locator('.landing-scenario', { hasText: 'Happy path' }).getByRole('button', { name: 'Run' }).click();
  await page.getByRole('button', { name: 'Create This Ticket' }).click({ timeout: 15000 });
  await page.getByRole('button', { name: "Don't Refund" }).waitFor({ timeout: 15000 });
}
