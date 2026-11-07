// Regenerates every scripted case-study shot (hero, multi-hop code and comparison, refund before/after, phone) into docs/case-study, or OUT=<dir>: cd demo && node scripts/case-study/all.mjs
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { DEMO, OUT } from './lib.mjs';

const here = join(DEMO, 'scripts', 'case-study');
const run = (cmd, args, env = {}) => execFileSync(cmd, args, { cwd: DEMO, stdio: 'inherit', env: { ...process.env, ...env } });

run('node', [join(here, 'capture-before.mjs')]);
run('node', [join(here, 'capture-main.mjs')]);
run('node', [join(here, 'compose-refund-before-after.mjs')]);
// Shot 4 pairs the hand-exported Figma side with the code side just captured
run('python3', [join(here, 'compose-shot4.py')], { OUT, CODE_SHOT: join(OUT, 'multihop-code-2x.png') });
