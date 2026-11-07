/**
 * Responsive suite (screen-decisions.md, Responsive): 390×844 (phone, touch) and 768×1024 (tablet).
 * On every screen: no horizontal overflow (scrollWidth <= viewport width), nothing clipped or
 * truncated, top bar elements don't overlap. All five scenarios end to end at both sizes, plus the
 * revoked write and Stop Agent. Gates scroll into view with focus on the primary; the status line
 * holds its size while it types; icon motion plays on press, never on hover, on touch.
 * Lines starting "PASS" pass; "FAIL" fails.
 */
export const name = 'Responsive suite';
export const expected = 99;

const VIEWPORTS = [
  { label: '390', width: 390, height: 844, touch: true },
  { label: '768', width: 768, height: 1024, touch: false },
];
const TOUCH = 44; // size.touch-target, read back from the page in the checks below

/** Problems on the current screen: overflow past the viewport, clipping inside a card, truncated text. */
function audit() {
  const problems = [];
  const vw = window.innerWidth;
  const root = document.documentElement;
  if (root.scrollWidth > vw) problems.push(`document scrollWidth ${root.scrollWidth} > ${vw}`);
  const hidden = el => el.closest('.cm-visually-hidden');
  const name = el => `${el.tagName.toLowerCase()}.${String(el.className.baseVal ?? el.className).split(' ')[0]}`;
  for (const el of document.querySelectorAll('.app *')) {
    if (hidden(el)) continue;
    const r = el.getBoundingClientRect();
    if (!r.width) continue;
    if (r.right > vw + 0.5 || r.left < -0.5) problems.push(`${name(el)} outside viewport (${Math.round(r.left)}–${Math.round(r.right)})`);
  }
  for (const frame of document.querySelectorAll('.cm-frame')) {
    const f = frame.getBoundingClientRect();
    for (const el of frame.querySelectorAll('*')) {
      if (hidden(el)) continue;
      const r = el.getBoundingClientRect();
      if (r.width && r.right > f.right + 0.5) problems.push(`${name(el)} clipped by card`);
    }
  }
  const TEXT = '.cm-thesis, .cm-agent__typed, .cm-agent__reserve, .cm-agent__name, .activity-tool, .cm-frame__tool, '
    + '.cm-frame__server, .cm-hop__label, .cm-btn, .cm-stop, .cm-trace__value, .cm-trace__field, .cm-fields__row dd, '
    + '.cm-panel__time, .cm-panel__hero, .cm-chip, [data-grant-scope]';
  for (const el of document.querySelectorAll(TEXT)) {
    if (hidden(el)) continue;
    // Wider than its box is always a problem; taller only when the box clips (tight line-heights overhang)
    const clipsY = getComputedStyle(el).overflowY !== 'visible';
    if (el.scrollWidth > el.clientWidth + 1 || (clipsY && el.scrollHeight > el.clientHeight + 1)) {
      problems.push(`${name(el)} truncated: "${el.textContent.trim().slice(0, 30)}"`);
    }
  }
  return problems;
}

/** Top bar: no two parts overlap. On a phone, row 1 is title + Stop, row 2 the agent and its status. */
function topbar(twoRows) {
  const rect = s => document.querySelector(s)?.getBoundingClientRect();
  const parts = {
    title: rect('.cm-topbar__title'),
    end: rect('.cm-topbar__end'),
    light: rect('.cm-agent__light'),
    name: rect('.cm-agent__name'),
    status: rect('.cm-agent__text'),
  };
  const problems = [];
  const keys = Object.keys(parts);
  keys.forEach((a, i) => keys.slice(i + 1).forEach(b => {
    const p = parts[a];
    const q = parts[b];
    const x = Math.min(p.right, q.right) - Math.max(p.left, q.left);
    const y = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
    if (x > 0.5 && y > 0.5) problems.push(`${a} overlaps ${b}`);
  }));
  if (twoRows) {
    const row1Bottom = Math.max(parts.title.bottom, parts.end.bottom);
    const sameRow = Math.min(parts.title.bottom, parts.end.bottom) > Math.max(parts.title.top, parts.end.top);
    if (!sameRow) problems.push('title and Stop not on one row');
    if (parts.light.top < row1Bottom - 0.5 || parts.status.top < row1Bottom - 0.5) problems.push('agent not on row 2');
    const stop = document.querySelector('.cm-stop');
    if (stop && !(stop.textContent.includes('Stop Agent') && stop.querySelector('svg'))) problems.push('Stop Agent lost its label or icon');
  }
  return problems;
}

export async function suite({ browser, url, reduced, shotsDir }) {
  const results = [];
  const ok = (n, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${n}${extra ? ' — ' + extra : ''}`);

  for (const vp of VIEWPORTS) {
    const phone = vp.width < 640;
    const tag = s => `${vp.label}: ${s}`;

    async function fresh() {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.touch,
        hasTouch: vp.touch,
        reducedMotion: reduced ? 'reduce' : 'no-preference',
      });
      const page = await ctx.newPage();
      page.errors = [];
      page.on('pageerror', e => page.errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
      await page.goto(url);
      await page.waitForSelector('.landing');
      await page.evaluate(() => document.fonts.ready);
      return page;
    }
    const shot = (page, n) => (shotsDir ? page.screenshot({ path: `${shotsDir}/${reduced ? 'r-' : ''}${vp.label}-${n}.png`, fullPage: true }) : null);
    const run = (page, label) => page.locator('.landing-scenario', { hasText: label }).getByRole('button', { name: 'Run' }).click();
    const card = (page, text) => page.locator('.cm-frame', { hasText: text }).first().waitFor({ timeout: 15000 });
    const button = (page, text) => page.getByRole('button', { name: text }).first();

    /** One check per screen: overflow, clipping, truncation and the top bar. */
    async function screen(page, label) {
      await page.waitForTimeout(reduced ? 100 : 900);
      const problems = [...await page.evaluate(audit), ...await page.evaluate(topbar, phone)];
      ok(tag(`${label}: no overflow, truncation or top bar overlap`), problems.length === 0, problems.slice(0, 4).join('; '));
      await shot(page, label.replace(/\W+/g, '-'));
    }

    /** The gate is on screen and focus is on its primary. Reduced motion jumps, so it's checked at once. */
    async function gateInView(page, label, primary) {
      await page.waitForTimeout(reduced ? 50 : 1000);
      const state = await page.evaluate(() => {
        const wrap = document.querySelector('.consent-card-wrap');
        const r = wrap.getBoundingClientRect();
        return { top: r.top, h: innerHeight, focus: document.activeElement?.textContent?.trim() };
      });
      ok(tag(`${label}: gate in view, focus on ${primary}`), state.top >= -1 && state.top < state.h && state.focus === primary,
        `top ${Math.round(state.top)} focus ${state.focus}`);
    }

    /** Card actions: phone stacks them full width, primary on top; tablet keeps them side by side. */
    async function actions(page, label) {
      const info = await page.locator('.cm-frame__actions').first().evaluate(el => {
        const box = el.getBoundingClientRect();
        const pad = parseFloat(getComputedStyle(el).paddingLeft) + parseFloat(getComputedStyle(el).paddingRight);
        const [a, b] = [...el.querySelectorAll('.cm-btn')].map(btn => btn.getBoundingClientRect());
        const note = el.parentElement.querySelector('.cm-frame__footnote')?.getBoundingClientRect();
        return { inner: box.width - pad, a, b, noteBelow: note ? note.top >= Math.max(a.bottom, b.bottom) - 0.5 : true };
      });
      const stacked = Math.abs(info.a.left - info.b.left) < 1 && info.a.bottom <= info.b.top
        && Math.abs(info.a.width - info.inner) < 1 && Math.abs(info.b.width - info.inner) < 1;
      const sideBySide = Math.abs(info.a.top - info.b.top) < 1 && info.a.right <= info.b.left;
      ok(tag(`${label}: buttons ${phone ? 'stacked, primary on top' : 'side by side'}; consequence under them`),
        (phone ? stacked : sideBySide) && info.noteBelow);
    }

    /** Phone: every visible button and checkbox row is at least size.touch-target tall. */
    async function touchTargets(page, label) {
      if (!phone) return;
      const short = await page.evaluate(min => {
        const token = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--size-touch-target'));
        const target = Number.isNaN(token) ? min : token;
        return [...document.querySelectorAll('button, .cm-check__label')]
          .filter(el => el.offsetParent && getComputedStyle(el).visibility !== 'hidden' && !el.closest('.cm-visually-hidden'))
          .filter(el => el.getBoundingClientRect().height < target - 0.5)
          .map(el => `${el.textContent.trim().slice(0, 24)} ${Math.round(el.getBoundingClientRect().height)}`);
      }, TOUCH);
      ok(tag(`${label}: touch targets ≥ size.touch-target`), short.length === 0, short.join('; '));
    }

    const receipt = async (page, label, headline) => {
      await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
      const h = await page.locator('.cm-panel__decision').textContent();
      ok(tag(`${label}: ends on "${headline}"`), h === headline, h);
      await screen(page, `${label} receipt`);
    };
    const noErrors = (page, label) => ok(tag(`${label}: no errors`), page.errors.length === 0, page.errors.join(' | '));
    const scrollToEnd = page => page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

    // ── Landing and shell ──
    let page = await fresh();
    await screen(page, 'landing');
    const shell = await page.evaluate(() => {
      const main = document.querySelector('.main-panel').getBoundingClientRect();
      const side = document.querySelector('.side-panel').getBoundingClientRect();
      const cols = s => getComputedStyle(document.querySelector(s)).gridTemplateColumns.split(' ').length;
      return { mainFirst: main.bottom <= side.top + 0.5, sideFull: Math.abs(side.width - innerWidth) < 1, grid: cols('.landing__grid'), legend: cols('.landing__legend') };
    });
    ok(tag('one column: main first, sidebar under it at full width'), shell.mainFirst && shell.sideFull, JSON.stringify(shell));
    ok(tag(phone ? 'landing: scenarios one column, legend stacked' : 'landing: scenarios two columns, legend in a row'),
      phone ? shell.grid === 1 && shell.legend === 1 : shell.grid === 2 && shell.legend === 4, JSON.stringify(shell));
    const cells = await page.locator('.cm-thesis').evaluateAll(els => els.map(el => ({
      rule: getComputedStyle(el).borderTopWidth,
      lines: Math.round((el.clientHeight - parseFloat(getComputedStyle(el).paddingTop) - parseFloat(getComputedStyle(el).paddingBottom))
        / parseFloat(getComputedStyle(el).lineHeight)),
    })));
    ok(tag('thesis strip: five cells, 2px rules, labels in at most three lines'),
      cells.length === 5 && cells.every(c => c.rule === '2px' && c.lines <= 3), JSON.stringify(cells));
    await touchTargets(page, 'landing');
    // Icon motion on touch: hover never plays it, press does (and reduced motion never does)
    if (vp.touch) {
      const runBtn = page.locator('.landing-scenario').first().getByRole('button', { name: 'Run' });
      const icon = runBtn.locator('.cm-icon');
      const hoverNone = await page.evaluate(() => matchMedia('(hover: none)').matches);
      await runBtn.hover();
      const onHover = await icon.evaluate(e => getComputedStyle(e).animationName);
      const box = await runBtn.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      const onPress = await icon.evaluate(e => getComputedStyle(e).animationName);
      await page.mouse.move(0, 0);
      await page.mouse.up();
      ok(tag('touch: icon motion plays on press, never on hover'),
        hoverNone && onHover === 'none' && onPress === (reduced ? 'none' : 'cm-icon-nudge'), `${hoverNone} hover ${onHover} press ${onPress}`);
    }
    noErrors(page, 'landing');
    await page.context().close();

    // ── Happy path: write, refund (opened off screen), scope creep, receipt ──
    page = await fresh();
    await run(page, 'Happy path');
    // Status line holds its size while it types: sample the top bar until the first gate
    const heights = await page.evaluate(() => new Promise(resolve => {
      const samples = [];
      const timer = setInterval(() => {
        samples.push([document.querySelector('.cm-agent__reserve').textContent, document.querySelector('.cm-topbar').offsetHeight]);
      }, 15);
      setTimeout(() => { clearInterval(timer); resolve(samples); }, 1200);
    }));
    const bySentence = new Map();
    heights.forEach(([text, h]) => bySentence.set(text, [...(bySentence.get(text) ?? []), h]));
    const steady = [...bySentence.values()].every(hs => hs.every(h => h === hs[0]));
    ok(tag('status line: top bar never grows mid-sentence'), steady && heights.length > 10,
      [...bySentence].map(([t, hs]) => `${t.slice(0, 20)}:${[...new Set(hs)].join('/')}`).join(' '));
    await card(page, 'Create This Ticket');
    await gateInView(page, 'write', 'Create This Ticket');
    await screen(page, 'write');
    await actions(page, 'write');
    await touchTargets(page, 'write');
    const cardWidth = await page.locator('.cm-frame').first().evaluate(e => e.getBoundingClientRect().width);
    const mainWidth = await page.locator('.main-stage').evaluate(e => e.getBoundingClientRect().width);
    ok(tag('card full width, max 640'), Math.abs(cardWidth - Math.min(640, mainWidth)) < 1, `${cardWidth} of ${mainWidth}`);
    await button(page, 'Create This Ticket').click();
    // Look at the activity log while the agent works, so the refund gate opens off screen
    await page.waitForTimeout(100);
    await scrollToEnd(page);
    await card(page, "Don't Refund");
    await gateInView(page, 'refund (opened off screen)', "Don't Refund");
    await screen(page, 'refund');
    await actions(page, 'refund');
    await touchTargets(page, 'refund');
    await page.locator('.cm-check[data-kind="review"] .cm-check__label').click();
    await page.waitForTimeout(700);
    await button(page, /Confirm \$149.00 Refund/).click();
    await card(page, 'Keep Current Grant');
    await gateInView(page, 'scope creep', 'Keep Current Grant');
    await screen(page, 'scope creep');
    await actions(page, 'scope creep');
    await touchTargets(page, 'scope creep');
    const lit = await page.locator('.cm-thesis[data-n="4"]').evaluate(e => [getComputedStyle(e).fontWeight, getComputedStyle(e).color]);
    ok(tag('thesis 4 active styling unchanged'), lit[0] === '600' && lit[1] === 'rgb(123, 35, 13)', lit.join(' '));
    await page.getByText('Approve assignee').click();
    await page.getByText('Approve labels').click();
    await button(page, /Approve Selected/).click();
    await receipt(page, 'happy', 'Task complete.');
    await touchTargets(page, 'receipt');
    noErrors(page, 'happy');
    await page.context().close();

    // ── Partial completion ──
    page = await fresh();
    await run(page, 'Partial completion');
    await card(page, 'Create This Ticket');
    await button(page, 'Create This Ticket').click();
    await card(page, "Don't Refund");
    await button(page, "Don't Refund").click();
    await receipt(page, 'partial', '2 of 3 done.');
    noErrors(page, 'partial');
    await page.context().close();

    // ── Scope creep, kept ──
    page = await fresh();
    await run(page, 'Scope creep');
    await card(page, 'Create This Ticket');
    await button(page, 'Create This Ticket').click();
    await card(page, "Don't Refund");
    await page.locator('.cm-check[data-kind="review"] .cm-check__label').click();
    await page.waitForTimeout(700);
    await button(page, /Confirm/).click();
    await card(page, 'Keep Current Grant');
    await button(page, 'Keep Current Grant').click();
    await receipt(page, 'scope creep', 'Task complete.');
    noErrors(page, 'scope creep');
    await page.context().close();

    // ── Tool error ──
    page = await fresh();
    await run(page, 'Tool error');
    await card(page, 'Create This Ticket');
    await button(page, 'Create This Ticket').click();
    await card(page, "Don't Refund");
    await page.locator('.cm-check[data-kind="review"] .cm-check__label').click();
    await page.waitForTimeout(700);
    await button(page, /Confirm/).click();
    await scrollToEnd(page);
    await card(page, 'Skip for Now');
    await gateInView(page, 'tool error (opened off screen)', 'Skip for Now');
    await screen(page, 'tool error');
    await actions(page, 'tool error');
    await touchTargets(page, 'tool error');
    await button(page, 'Skip for Now').click();
    await receipt(page, 'tool error', '2 of 3 done.');
    noErrors(page, 'tool error');
    await page.context().close();

    // ── Multi-hop ──
    page = await fresh();
    await run(page, 'Multi-hop');
    await card(page, 'Change CRM Only');
    await gateInView(page, 'multi-hop', 'Change CRM Only');
    await page.waitForTimeout(reduced ? 0 : 1200); // let the hop connector draw
    await screen(page, 'multi-hop');
    await actions(page, 'multi-hop');
    await touchTargets(page, 'multi-hop');
    await page.getByText('Approve billing_contact').click();
    await button(page, /Approve Selected/).click();
    await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
    await screen(page, 'multi-hop receipt');
    ok(tag('multi-hop: ends on the receipt'), (await page.locator('.cm-panel__decision').textContent()).startsWith('Task complete.'));
    noErrors(page, 'multi-hop');
    await page.context().close();

    // ── Revoked write re-asks on the update card ──
    page = await fresh();
    await page.locator('[data-grant-item]', { hasText: 'issues.update' }).getByRole('button', { name: 'Revoke' }).click();
    await run(page, 'Happy path');
    await card(page, 'Create This Ticket');
    await button(page, 'Create This Ticket').click();
    await card(page, "Don't Refund");
    await page.locator('.cm-check[data-kind="review"] .cm-check__label').click();
    await page.waitForTimeout(700);
    await button(page, /Confirm/).click();
    await card(page, 'Update This Ticket');
    await gateInView(page, 'revoked write', 'Update This Ticket');
    await screen(page, 'revoked write');
    await touchTargets(page, 'revoked write');
    noErrors(page, 'revoked write');
    await page.context().close();

    // ── Stop Agent ──
    page = await fresh();
    await run(page, 'Happy path');
    await card(page, 'Create This Ticket');
    await page.getByRole('button', { name: 'Stop Agent' }).click();
    await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
    await screen(page, 'stopped');
    const stoppedH = await page.locator('.cm-topbar__stopped').evaluate(e => e.getBoundingClientRect().height);
    ok(tag('stopped: "Agent stopped" keeps the Stop box'), phone ? stoppedH >= TOUCH - 0.5 : stoppedH > 0, String(stoppedH));
    noErrors(page, 'stopped');
    await page.context().close();
  }

  // ── Desktop is unchanged: hover still plays icon motion and the bar stays one row ──
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(url);
    await page.waitForSelector('.landing');
    const runBtn = page.locator('.landing-scenario').first().getByRole('button', { name: 'Run' });
    await runBtn.hover();
    const anim = await runBtn.locator('.cm-icon').evaluate(e => getComputedStyle(e).animationName);
    ok('1440: hover plays icon motion', anim === (reduced ? 'none' : 'cm-icon-nudge'), anim);
    const desk = await page.evaluate(() => ({
      bar: getComputedStyle(document.querySelector('.cm-topbar')).display,
      side: document.querySelector('.side-panel').getBoundingClientRect().width,
      thesis: getComputedStyle(document.querySelector('.cm-thesis')).whiteSpace,
      status: getComputedStyle(document.querySelector('.cm-agent__typed')).whiteSpace,
    }));
    ok('1440: two columns, one-row top bar, one-line strip and status', desk.bar === 'flex' && desk.side === 300 && desk.thesis === 'pre' && desk.status === 'nowrap', JSON.stringify(desk));
    await ctx.close();
  }

  return results;
}
