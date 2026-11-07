/**
 * Phase 5 behavior and motion checks: 47 checks. Focus, Enter/Escape, deliberate beat,
 * double-commit guard, agent light, typing, scan line, trace draw, receipt stagger, icons,
 * stop, revoke, all five scenarios. Lines starting "PASS" pass; "FAIL" fails.
 */
export const name = 'Phase 5 suite';
export const expected = 47;

export async function suite({ browser, url, reduced, shotsDir }) {
  const results = [];
  const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}${extra ? ' — ' + extra : ''}`);
  const shot = (page, n) => (shotsDir ? page.screenshot({ path: `${shotsDir}/${reduced ? 'r-' : ''}${n}.png` }) : null);
  async function fresh(browser) {
    const ctx = await browser.newContext({ reducedMotion: reduced ? 'reduce' : 'no-preference', viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    page.errors = [];
    page.on('pageerror', e => page.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') page.errors.push(m.text()); });
    await page.goto(url);
    return page;
  }
  const run = async (page, label) => {
    await page.locator('.landing-scenario', { hasText: label }).getByRole('button', { name: 'Run' }).click();
  };
  const focused = page => page.evaluate(() => document.activeElement?.textContent?.trim());
  const card = (page, text) => page.locator('.cm-frame', { hasText: text }).first().waitFor({ timeout: 15000 });
  const lightState = page => page.locator('.cm-agent').getAttribute('data-state');
  const statusText = page => page.locator('.cm-agent__text').textContent();
  const headline = page => page.locator('.cm-panel__decision').textContent();



  // ── Happy path, mouse ──
  let page = await fresh(browser);
  await run(page, 'Happy path');
  await page.waitForTimeout(300);
  ok('happy: light breathes/speaks while working', ['working', 'speaking'].includes(await lightState(page)), await lightState(page));
  await card(page, 'Create This Ticket');
  await page.waitForTimeout(1200);
  ok('write: focus on primary', (await focused(page)) === 'Create This Ticket', await focused(page));
  ok('write: light still while waiting', (await lightState(page)) === 'waiting');
  ok('write: status paused', (await statusText(page)).startsWith('paused → '), await statusText(page));
  const ringAnim = await page.locator('.cm-agent__ring').evaluate(e => getComputedStyle(e).animationName);
  ok('waiting: ring not animating', ringAnim === 'none', ringAnim);
  const ringOp = await page.locator('.cm-agent__ring').evaluate(e => getComputedStyle(e).opacity);
  ok('waiting: ring at opacity.ring', ringOp === '0.25', ringOp);
  const pulse = await page.locator('.activity-state-label--waiting').evaluate(e => getComputedStyle(e).animationName);
  ok('waiting row pulse', reduced ? pulse === 'none' : pulse === 'waiting-pulse', pulse);
  const scan = await page.locator('.cm-frame[data-tier="write"]').evaluate(e => getComputedStyle(e, '::after').animationName);
  ok('write: scan line', reduced ? scan === 'none' : scan === 'cm-scan', scan);
  await shot(page, 'write');
  await page.getByRole('button', { name: 'Create This Ticket' }).click();
  await page.waitForTimeout(500);
  ok('draft becomes real', /ISS-\d+/.test(await page.locator('.cm-draft__id').textContent()), await page.locator('.cm-draft__id').textContent());
  await card(page, "Don't Refund");
  ok('refund: no enter animation', (await page.locator('.cm-frame[data-tier="destructive"]').getAttribute('data-enter')) === null);
  ok('refund: focus on Don\'t Refund', (await focused(page)) === "Don't Refund", await focused(page));
  // Early click inside the deliberate beat, even with the box checked
  await page.getByText("I've checked the amount and the customer.").click();
  await page.getByRole('button', { name: /Confirm \$149.00 Refund/ }).click();
  ok('refund: early click nudges', await page.getByText('Check the amount first.').isVisible());
  ok('refund: button never disabled', !(await page.getByRole('button', { name: /Confirm/ }).isDisabled()));
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Confirm \$149.00 Refund/ }).dblclick();
  await card(page, 'Keep Current Grant');
  await page.waitForTimeout(100);
  const refundRows = await page.locator('.activity-row', { hasText: 'payments.refund' }).count();
  ok('double-click Confirm: one refund', refundRows === 1, String(refundRows));
  const sel = await page.evaluate(() => String(getSelection()).length);
  ok('double-click Confirm: nothing selected', sel === 0, String(sel));
  ok('creep: focus on Keep Current Grant', (await focused(page)) === 'Keep Current Grant', await focused(page));
  const maxAnim = await page.locator('.cm-frame__header .cm-icon[data-name="maximize"] path').first().evaluate(e => getComputedStyle(e).animationName);
  ok('creep: maximize pushes out', reduced ? maxAnim === 'none' : maxAnim === 'cm-icon-push-out-a', maxAnim);
  const lineAnim = await page.locator('.cm-trace__line[data-line="ends"]').first().evaluate(e => [getComputedStyle(e).animationName, getComputedStyle(e).animationDelay]);
  ok('creep: dashed segment draws after forest', reduced ? lineAnim[0] === 'none' : lineAnim[0] === 'cm-reveal-down', lineAnim.join(' '));
  if (!reduced) {
    await page.waitForTimeout(150);
    await shot(page, 'creep-drawing');
  }
  const approve = page.getByRole('button', { name: /Approve Selected/ });
  await page.getByText('Approve assignee').click();
  ok('Approve Selected · 1 of 2 live', (await approve.textContent()).includes('1 of 2'), await approve.textContent());
  await page.getByText('Approve labels').click();
  ok('Approve Selected · 2 of 2 live', (await approve.textContent()).includes('2 of 2'));
  await approve.click();
  await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
  ok('happy: completion', (await headline(page)) === 'Task complete.' && (await page.locator('.cm-frame[data-tier="receipt"] .cm-panel__detail').textContent()).includes('Bug triaged, ticket filed, refund issued.'));
  ok('receipt: focus on Run Another Scenario', (await focused(page)) === 'Run Another Scenario', await focused(page));
  const rowAnim = await page.locator('.cm-trace[data-motion="record"] .cm-trace__step').nth(1).evaluate(e => [getComputedStyle(e).animationName, getComputedStyle(e).animationDelay]);
  ok('receipt rows stagger', reduced ? rowAnim[0] === 'none' : rowAnim[0] === 'cm-fade-in' && rowAnim[1] === '0.04s', rowAnim.join(' '));
  ok('completed: light stopped', (await lightState(page)) === 'stopped');
  await page.waitForTimeout(800);
  await shot(page, 'receipt');
  ok('happy: no errors', page.errors.length === 0, page.errors.join(' | '));
  await page.context().close();

  // ── Partial, keyboard only ──
  page = await fresh(browser);
  await run(page, 'Partial completion');
  await card(page, 'Create This Ticket');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await card(page, "Don't Refund");
  await page.keyboard.press('Escape');
  await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
  ok('partial (keyboard Enter/Escape)', (await headline(page)) === '2 of 3 done.', await headline(page));
  ok('partial: no errors', page.errors.length === 0, page.errors.join(' | '));
  await page.context().close();

  // ── Scope creep, keyboard only, including Tab to Confirm ──
  page = await fresh(browser);
  await run(page, 'Scope creep');
  await card(page, 'Create This Ticket');
  await page.waitForTimeout(300);
  await page.keyboard.press('Enter');
  await card(page, "Don't Refund");
  // Enter on the review checkbox takes the primary, never Confirm: tab to checkbox only checks it with Space
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Space');
  await page.waitForTimeout(700);
  await page.keyboard.press('Tab'); // Don't Refund
  await page.keyboard.press('Tab'); // Confirm
  ok('keyboard: Confirm reachable by explicit focus', (await focused(page)).startsWith('Confirm'), await focused(page));
  await page.keyboard.press('Enter');
  await card(page, 'Keep Current Grant');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
  const sc = await page.locator('.cm-frame[data-tier="receipt"] .cm-panel__detail').textContent();
  ok('scope creep (keyboard)', (await headline(page)) === 'Task complete.' && sc.includes('Assignee and labels left for you.'), sc);
  await page.context().close();

  // ── Tool error ──
  page = await fresh(browser);
  await run(page, 'Tool error');
  await card(page, 'Create This Ticket');
  await page.getByRole('button', { name: 'Create This Ticket' }).click();
  await card(page, "Don't Refund");
  await page.getByText("I've checked the amount and the customer.").click();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Confirm/ }).click();
  await card(page, 'Skip for Now');
  ok('alert: hard cut', (await page.locator('.cm-frame[data-tier="alert"]').getAttribute('data-enter')) === null);
  ok('alert: focus on Skip for Now', (await focused(page)) === 'Skip for Now', await focused(page));
  await page.getByRole('button', { name: 'Try Refund Again' }).dblclick();
  await card(page, 'Keep Current Grant');
  await page.getByRole('button', { name: 'Keep Current Grant' }).click();
  await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
  ok('tool error retry', (await headline(page)) === 'Task complete.', await headline(page));
  ok('tool error: no errors', page.errors.length === 0, page.errors.join(' | '));
  await page.context().close();

  page = await fresh(browser);
  await run(page, 'Tool error');
  await card(page, 'Create This Ticket');
  await page.keyboard.press('Enter');
  await card(page, "Don't Refund");
  await page.getByText("I've checked the amount and the customer.").click();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Confirm/ }).click();
  await card(page, 'Skip for Now');
  await page.keyboard.press('Escape');
  await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
  ok('tool error skip (Escape)', (await headline(page)) === '2 of 3 done.', await headline(page));
  await page.context().close();

  // ── Multi-hop ──
  page = await fresh(browser);
  await run(page, 'Multi-hop');
  await card(page, 'Change CRM Only');
  await page.waitForTimeout(200);
  ok('multi-hop: focus on Change CRM Only', (await focused(page)) === 'Change CRM Only', await focused(page));
  const hop = await page.locator('.cm-hop__rule').evaluate(e => [getComputedStyle(e).animationName, getComputedStyle(e).animationDelay]);
  const ends = await page.locator('.cm-trace__line[data-line="ends"]').first().evaluate(e => getComputedStyle(e).animationDelay);
  ok('multi-hop: hop draws after forest, before dashed', reduced ? hop[0] === 'none' : hop[0] === 'cm-reveal-across' && parseFloat(hop[1]) < parseFloat(ends), `${hop.join(' ')} ends ${ends}`);
  if (!reduced) { await page.waitForTimeout(1600); await shot(page, 'multihop'); }
  await page.getByRole('button', { name: /Approve Selected/ }).click();
  ok('multi-hop: nudge with none checked', await page.getByText('Check at least one field first.').isVisible());
  await page.keyboard.press('Escape');
  await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
  ok('multi-hop Change CRM Only', (await page.locator('.cm-frame[data-tier="receipt"] .cm-panel__detail').textContent()).includes('2 payments fields left for you.'));
  await page.context().close();

  // ── Stop Agent mid-run ──
  page = await fresh(browser);
  await page.getByRole('button', { name: 'Stop Agent' }).click();
  ok('stop idle: No agent running.', await page.getByText('No agent running.').isVisible());
  await run(page, 'Happy path');
  await card(page, 'Create This Ticket');
  await page.getByRole('button', { name: 'Stop Agent' }).click();
  ok('stop: confirms in place', (await statusText(page)) === 'Agent stopped. Nothing else will run.', await statusText(page));
  ok('stop: light slate static', (await lightState(page)) === 'stopped' && (await page.locator('.cm-agent__core').evaluate(e => getComputedStyle(e).animationName)) === 'none');
  await page.waitForTimeout(3000);
  ok('stop: nothing else runs', (await page.locator('.activity-row').count()) === 3 && !(await page.getByText("Don't Refund").count()));
  await page.keyboard.press('Escape');
  ok('stop: no errors', page.errors.length === 0, page.errors.join(' | '));
  await page.context().close();

  // ── Revoke then re-ask ──
  page = await fresh(browser);
  await page.locator('[data-grant-item]', { hasText: 'issues.update' }).getByRole('button', { name: 'revoke' }).click();
  ok('revoke immediate', (await page.locator('[data-grant-item]', { hasText: 'issues.update' }).count()) === 0);
  await run(page, 'Happy path');
  await card(page, 'Create This Ticket');
  await page.keyboard.press('Enter');
  await card(page, "Don't Refund");
  await page.getByText("I've checked the amount and the customer.").click();
  await page.waitForTimeout(700);
  await page.getByRole('button', { name: /Confirm/ }).click();
  await card(page, 'Update This Ticket');
  ok('revoked: re-asks narrow (Update This Ticket)', (await focused(page)) === 'Update This Ticket', await focused(page));
  await page.keyboard.press('Enter');
  await page.locator('.cm-panel__decision').waitFor({ timeout: 15000 });
  ok('revoked: completion', (await headline(page)) === 'Task complete.');
  await page.context().close();

  // ── Status typing ──
  page = await fresh(browser);
  await run(page, 'Happy path');
  await page.waitForTimeout(120);
  const partial = await statusText(page);
  ok('status types on', reduced ? partial === 'reading docs and the customer record' : partial.length < 'reading docs and the customer record'.length, partial);
  await page.context().close();

  return results;
}
