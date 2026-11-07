// Produces the "before" half of the refund before/after (the 59dc3bf refund card, 2x) in a temp folder via a throwaway git worktree: cd demo && node scripts/case-study/capture-before.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { BUILD, DEMO, ROOT, chromium, closePage, openPage, settle, startDemo } from './lib.mjs';

const BEFORE = '59dc3bf'; // last commit before the design-system rebuild
const git = (...args) => execFileSync('git', ['-C', ROOT, ...args], { stdio: 'pipe' }).toString();

mkdirSync(BUILD, { recursive: true });
// Real path: macOS temp is a symlink (/var → /private/var) and Vite resolves files by real path
const tree = join(mkdtempSync(join(realpathSync(tmpdir()), 'consent-before-')), 'tree');
git('worktree', 'add', '--detach', tree, BEFORE);
// Same React and Vite as main; startDemo gives each server its own dep cache, so sharing node_modules is safe
symlinkSync(join(DEMO, 'node_modules'), join(tree, 'demo', 'node_modules'));

let demo;
const browser = await chromium.launch();
try {
  demo = await startDemo(join(tree, 'demo'));
  const page = await openPage(browser, demo.url, { width: 1440, height: 1000 });
  await page.locator('.main-stage button', { hasText: 'Happy Path' }).click();
  await page.locator('.main-stage button', { hasText: 'Allow' }).click({ timeout: 15000 });
  await page.locator('.main-stage button', { hasText: /Confirm \$149/ }).waitFor({ timeout: 15000 });
  await settle(page);
  await page.locator('.consent-card-wrap').screenshot({ path: join(BUILD, 'before-refund-2x.png') });
  await closePage(page, 'before');
} finally {
  await browser.close();
  await demo?.close();
  rmSync(join(tree, 'demo', 'node_modules'));
  git('worktree', 'remove', '--force', tree);
}
console.log(join(BUILD, 'before-refund-2x.png'));
