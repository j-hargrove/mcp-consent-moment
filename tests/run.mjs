/**
 * Runs both self-check suites against the demo, with motion on and with reduced motion on.
 * Starts its own Vite dev server. Exits non-zero unless every suite hits its expected count
 * with no failures, page errors or console errors.
 *   cd demo && npm test
 * Set SHOTS=<dir> to save self-check screenshots there (keep them in a temp folder).
 */
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import * as nov2 from './nov2-suite.mjs';
import * as phase5 from './phase5-suite.mjs';

const demoDir = fileURLToPath(new URL('../demo/', import.meta.url));
// Playwright is a devDependency of the demo, the repo's only npm project
const { chromium } = createRequire(`${demoDir}package.json`)('playwright');
const PORT = 5199;
const url = `http://localhost:${PORT}/`;
const SUITES = [nov2, phase5];
const PASS = /^(ok|PASS)\b/;
const FAIL = /^(FAIL|PAGEERROR|CONSOLE)\b/;

function startServer() {
  const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], { cwd: demoDir, stdio: ['ignore', 'pipe', 'inherit'] });
  return new Promise((resolve, reject) => {
    server.stdout.on('data', chunk => { if (String(chunk).includes(`localhost:${PORT}`)) resolve(server); });
    server.on('exit', code => reject(new Error(`vite exited (${code})`)));
  });
}

const server = await startServer();
let allGood = true;
try {
  for (const reduced of [false, true]) {
    const mode = reduced ? 'reduced motion' : 'motion on';
    let passed = 0;
    let expected = 0;
    for (const s of SUITES) {
      const browser = await chromium.launch();
      let lines;
      try {
        lines = await s.suite({ browser, url, reduced, shotsDir: process.env.SHOTS });
      } catch (error) {
        lines = [`FAIL suite crashed — ${error.message.split('\n')[0]}`];
      } finally {
        await browser.close();
      }
      const p = lines.filter(l => PASS.test(l)).length;
      const failures = lines.filter(l => FAIL.test(l));
      passed += p;
      expected += s.expected;
      if (failures.length || p !== s.expected) allGood = false;
      console.log(`${mode} · ${s.name}: ${p} of ${s.expected}`);
      failures.forEach(f => console.log(`  ${f}`));
    }
    console.log(`${mode} · total: ${passed} of ${expected}\n`);
  }
} finally {
  server.kill();
}
process.exit(allGood ? 0 : 1);
