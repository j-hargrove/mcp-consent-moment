/**
 * Nov 2 self-check suite: 57 checks across the shared-spine scenarios (copy, colors, tiers,
 * remember, revoke, stop, receipts). Rebuilt Nov 6 from the session record; see review-log.md.
 * Lines starting "ok" pass; "FAIL", "PAGEERROR" and "CONSOLE" fail; anything else is a note.
 */
export const name = 'Nov 2 suite';
export const expected = 57;

export async function suite({ browser, url, reduced: REDUCED, shotsDir }) {
  const results = [];
  const ok = (n, c, x='') => { results.push(`${c ? 'ok  ' : 'FAIL'} ${n} ${x}`); };
  async function open() {
    const p = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: REDUCED ? 'reduce' : 'no-preference' });
    p.on('pageerror', e => results.push('PAGEERROR ' + e.message));
    p.on('console', m => { if (m.type()==='error') results.push('CONSOLE ' + m.text() + ' @ ' + m.location().url); });
    await p.goto(url); await p.waitForSelector('.landing');
    return p;
  }
  const run = (p, label) => p.locator('.landing-scenario', { hasText: label }).getByRole('button').click();
  const btn = (p, name) => p.getByRole('button', { name, exact: false });
  const shot = (p, n) => (shotsDir ? p.screenshot({ path: `${shotsDir}/${REDUCED ? 'r-' : ''}${n}.png`, fullPage: false }) : null);
  const text = (p) => p.locator('.main-stage').innerText();
  const side = (p) => p.locator('.activity-strip').innerText();
  const waitBtn = async (p, name) => btn(p, name).first().waitFor({ timeout: 12000 });
  const toRefund = async (p, label) => { await run(p, label); await waitBtn(p,'Create This Ticket'); await btn(p,'Create This Ticket').click(); await waitBtn(p,"Don't Refund"); await p.waitForTimeout(700); /* Phase 5: Confirm is live after motion.duration.deliberate */ };
  // Nov 5: multi-hop seeds crm.contacts.update next to issues.update (screen-decisions.md: "Two are seeded")
  const SEEDED = 2;
  const REVOKE_UPDATE = p => p.locator('[data-grant-item]', { hasText: 'issues.update' }).locator('[data-revoke]');
  const cs = (l, prop) => l.evaluate((e, prop) => getComputedStyle(e)[prop], prop);
  const receipt = async p => { await p.waitForSelector('[data-tier=receipt]', {timeout:15000}); return text(p); };

  // A. Happy with all checks
  { const p = await open();
    // hover on Run
    await run(p,'Happy path');
    await waitBtn(p,'Create This Ticket');
    // sidebar waiting row
    const row = p.locator('.activity-row--waiting');
    ok('write waiting row', await row.count()===1);
    ok('write waiting color slate', (await cs(row.locator('.activity-status').first(),'color'))==='rgb(61, 84, 107)', await cs(row.locator('.activity-status').first(),'color'));
    ok('write waiting anim', (await cs(row.locator('.activity-status').first(),'animationName'))===(REDUCED ? 'none' : 'waiting-pulse'));
    ok('row parts', await p.locator('.activity-row').first().evaluate(r=>[...r.children].map(c=>c.tagName+'.'+c.getAttribute('class')).join('|')).then(s=>/svg.*svg.*cm-chip.*activity-info/.test(s)));
    const prim = btn(p,'Create This Ticket');
    const bg0 = await cs(prim,'backgroundColor'); await prim.hover(); await p.waitForTimeout(200);
    const bg1 = await cs(prim,'backgroundColor');
    ok('primary hover navy→slate', bg0==='rgb(8, 19, 44)' && bg1==='rgb(61, 84, 107)', bg0+' '+bg1);
    ok('hover no outline', (await cs(prim,'outlineStyle'))==='none');
    const sec = btn(p,'Deny'); await sec.hover(); await p.waitForTimeout(200);
    ok('secondary hover field', (await cs(sec,'backgroundColor'))==='rgb(227, 232, 239)', await cs(sec,'backgroundColor'));
    ok('secondary border unchanged', (await cs(sec,'borderTopColor'))==='rgb(8, 19, 44)');
    await p.mouse.move(0,0); await p.keyboard.press('Tab'); await p.keyboard.press('Tab');
    const foc = await p.evaluate(()=>{const e=document.activeElement;return e.className+' '+getComputedStyle(e).outlineStyle});
    results.push('note focus: '+foc);
    await shot(p,'write');
    await prim.click();
    await waitBtn(p,"Don't Refund");
    await shot(p,'refund');
    ok('no visible chip', await p.locator('.cm-frame .cm-chip').count()===0);
    ok('sr text', await p.locator('.cm-visually-hidden',{hasText:'Destructive'}).count()===1);
    const dest = await text(p);
    ok('refund copy', ['$149.00',"to customer cust-7291 · can't be undone",'WHAT GETS SENT',"I've checked the amount and the customer.",'Not remembered. Every refund asks again.',"Don't Refund",'Confirm $149.00 Refund'].every(s=>dest.includes(s)));
    ok('no remember', !/remember for|Don't ask again/i.test(dest));
    const box = p.locator('.cm-check__box');
    ok('review box border', (await cs(box,'borderTopWidth'))==='2px' && (await cs(box,'borderTopColor'))==='rgb(116, 8, 10)', await cs(box,'borderTopColor'));
    ok('review box empty', await box.locator('svg').count()===0);
    ok('dest waiting film red', (await cs(p.locator('.activity-row--waiting .activity-status'),'color'))==='rgb(116, 8, 10)');
    const conf = btn(p,'Confirm $149.00 Refund');
    await conf.click(); ok('nudge', (await text(p)).includes('Check the amount first.')); ok('not disabled', await conf.isEnabled());
    ok('still open', await p.locator('.cm-frame[data-tier=destructive]').count()===1);
    await p.locator('.cm-check__label').click();
    await p.waitForTimeout(200);
    ok('checked forest', (await cs(box,'backgroundColor'))==='rgb(13, 66, 53)');
    await p.waitForTimeout(700); // Phase 5: Confirm is live after motion.duration.deliberate
    await conf.click();
    await waitBtn(p,'Keep Current Grant');
    await shot(p,'creep');
    const c = await text(p);
    ok('creep remember unchecked label', c.includes('Remember for issue-tracker'), '');
    const rem = p.getByRole('checkbox',{name:/^Remember/});
    ok('remember unchecked', !(await rem.isChecked()));
    ok('creep frame', (await cs(p.locator('.cm-frame'),'borderTopWidth'))==='2px');
    ok('creep waiting', (await cs(p.locator('.activity-row--waiting .activity-status'),'color'))==='rgb(175, 91, 65)' && (await cs(p.locator('.activity-state-label--waiting'),'color'))==='rgb(55, 4, 5)');
    await btn(p,'Approve Selected').click(); ok('creep nudge',(await text(p)).includes('Check at least one field first.'));
    await p.getByRole('checkbox',{name:'Approve labels'}).check();
    await p.getByRole('checkbox',{name:'Approve assignee'}).check();
    ok('names checked in order',(await text(p)).includes('Remember assignee and labels for issue-tracker'));
    await btn(p,'Approve Selected · 2 of 2').click();
    const r = await receipt(p); await p.waitForTimeout(300); await shot(p,'receipt-happy');
    ok('complete', r.includes('Task complete.') && r.includes('Bug triaged, ticket filed, refund issued.'));
    ok('navy', (await cs(p.locator('.cm-frame__panel'),'backgroundColor'))==='rgb(8, 19, 44)');
    ok('reset path: top bar', (await p.locator('.cm-topbar__stopped').innerText())==='Agent stopped');
    results.push('receipt-happy: '+r.replace(/\n+/g,' / '));
    await btn(p,'Run Another Scenario').click();
    await p.waitForSelector('.landing');
    ok('reset grants', (await p.locator('[data-grant-item]').count())===SEEDED && (await p.locator('[data-grant-time]').allInnerTexts()).every(t=>t==='granted earlier'));
  }
  // remember write + reset
  { const p = await open(); await run(p,'Happy path'); await waitBtn(p,'Create This Ticket');
    await p.getByRole('checkbox',{name:/Don't ask again/}).check();
    await btn(p,'Create This Ticket').click(); await waitBtn(p,"Don't Refund");
    ok('remember shows grant', await p.locator('[data-grant-item]').count()===SEEDED+1);
    await btn(p,"Don't Refund").click(); const r = await receipt(p);
    ok('partial', r.includes('2 of 3 done.') && r.includes('Refund requires manual action'));
    ok('receipt leftover alert', (await cs(p.locator('.cm-check__box').first(),'borderTopColor'))==='rgb(116, 8, 10)');
    await p.waitForTimeout(300); await shot(p,'receipt-partial');
    results.push('receipt-partial: '+r.replace(/\n+/g,' / '));
    await btn(p,'Run Another Scenario').click(); await p.waitForSelector('.landing');
    ok('reset clears remembered', await p.locator('[data-grant-item]').count()===SEEDED);
  }
  // scope creep keep
  { const p = await open(); await toRefund(p,'Scope creep');
    await p.locator('.cm-check__label').click(); await btn(p,'Confirm $149.00 Refund').click();
    await waitBtn(p,'Keep Current Grant'); await btn(p,'Keep Current Grant').click();
    const r = await receipt(p); await p.waitForTimeout(300); await shot(p,'receipt-creep');
    ok('task complete w/ leftover', r.includes('Task complete.') && r.includes('Assignee and labels left for you.'));
    const lab = p.locator('.cm-check__label'); 
    ok('leftover slate', (await cs(lab,'color'))==='rgb(61, 84, 107)', await cs(lab,'color'));
    ok('leftover plain box', (await cs(p.locator('.cm-check__box'),'borderTopColor'))==='rgb(61, 84, 107)');
    results.push('receipt-creep: '+r.replace(/\n+/g,' / '));
    results.push('side-creep: '+(await side(p)).replace(/\n+/g,' '));
  }
  // partial approve 1 of 2
  { const p = await open(); await toRefund(p,'Scope creep');
    await p.locator('.cm-check__label').click(); await btn(p,'Confirm $149.00 Refund').click();
    await waitBtn(p,'Keep Current Grant');
    await p.getByRole('checkbox',{name:'Approve assignee'}).check();
    await btn(p,'Approve Selected · 1 of 2').click();
    const r = await receipt(p); ok('one approved', r.includes('Task complete.') && r.includes('Labels left for you.'), ); }
  // tool error skip
  { const p = await open(); await toRefund(p,'Tool error');
    await p.locator('.cm-check__label').click(); await btn(p,'Confirm $149.00 Refund').click();
    await p.waitForTimeout(300);
    ok('first failure passive', await p.locator('.activity-row--error').count()===0);
    await waitBtn(p,'Skip for Now'); await p.waitForTimeout(100); await shot(p,'toolerror');
    const c = await text(p);
    ok('tool error copy',['The $149.00 refund failed twice.','No money moved',"WHAT HAPPENED",'Skip for Now: the refund stays with you to finish.','Try Refund Again'].every(s=>c.includes(s)));
    ok('alert frame',(await cs(p.locator('.cm-frame'),'borderTopWidth'))==='2px' && (await cs(p.locator('.cm-frame'),'borderTopColor'))==='rgb(116, 8, 10)');
    ok('needs you', await p.locator('.activity-row--needs-you').count()===1 && (await cs(p.locator('.activity-row--needs-you .activity-status'),'color'))==='rgb(116, 8, 10)');
    ok('timestamps brown',(await cs(p.locator('.cm-timeline__time').first(),'color'))==='rgb(130, 72, 40)');
    await btn(p,'Skip for Now').click();
    const r = await receipt(p); await p.waitForTimeout(300); await shot(p,'receipt-skip');
    ok('skip no creep', !(await side(p)).includes('CREEP'));
    ok('skip 2 of 3', r.includes('2 of 3 done.') && r.includes('Refund pending.'));
    results.push('receipt-skip: '+r.replace(/\n+/g,' / '));
    results.push('side-skip: '+(await side(p)).replace(/\n+/g,' '));
  }
  // tool error retry
  { const p = await open(); await toRefund(p,'Tool error');
    await p.locator('.cm-check__label').click(); await btn(p,'Confirm $149.00 Refund').click();
    await waitBtn(p,'Try Refund Again'); await btn(p,'Try Refund Again').click();
    await waitBtn(p,'Keep Current Grant'); await btn(p,'Keep Current Grant').click();
    const r = await receipt(p); ok('retry completes', r.includes('Task complete.')); }
  // revoke
  { const p = await open(); await REVOKE_UPDATE(p).click();
    ok('revoke removes', await p.locator('[data-grant-item]').count()===SEEDED-1 && await p.locator('[data-grant-item]',{hasText:'issues.update'}).count()===0);
    await toRefund(p,'Happy path'); await p.locator('.cm-check__label').click(); await btn(p,'Confirm $149.00 Refund').click();
    await waitBtn(p,'Update This Ticket'); await p.waitForTimeout(100); await shot(p,'reask');
    const c = await text(p);
    ok('re-ask narrow', !c.includes('assignee') && c.includes('resolution_note') && (await p.locator('.cm-frame[data-tier=write]').count())===1);
    ok('no old card', await p.locator('.consent-card').count()===0);
    await btn(p,'Deny').click();
    const r = await receipt(p); ok('deny re-ask', r.includes('Task complete.') && r.includes('Ticket update left for you.'), r.replace(/\n+/g,' / '));
    ok('no fallback write', !(await side(p)).toLowerCase().includes('fallback') && await p.locator('.activity-row--fallback').count()===0);
  }
  { const p = await open(); await REVOKE_UPDATE(p).click();
    await toRefund(p,'Happy path'); await btn(p,"Don't Refund").click();
    await waitBtn(p,'Update This Ticket'); await btn(p,'Deny').click(); const r = await receipt(p);
    ok('refund-denied + deny note', r.includes('2 of 3 done.') && r.includes('LEFT FOR YOU \n') || r.includes('Ticket note'), r.replace(/\n+/g,' / ')); }
  { const p = await open(); await REVOKE_UPDATE(p).click();
    await toRefund(p,'Happy path'); await p.locator('.cm-check__label').click(); await btn(p,'Confirm $149.00 Refund').click();
    await waitBtn(p,'Update This Ticket');
    await p.getByRole('checkbox',{name:/ticket updates/}).check(); await btn(p,'Update This Ticket').click();
    const r = await receipt(p); ok('re-approve', r.includes('Assignee and labels left for you.'));
    ok('re-grant listed', await p.locator('[data-grant-item]',{hasText:'issues.update'}).count()===1 && await p.locator('[data-grant-item]').count()===SEEDED); }
  // stop
  { const p = await open(); await p.locator('.cm-stop').click(); ok('no agent notice', (await p.locator('.cm-topbar__notice').innerText())==='No agent running.');
    await toRefund(p,'Happy path'); await p.locator('.cm-stop').click();
    const r = await receipt(p); await p.waitForTimeout(300); await shot(p,'receipt-stopped');
    ok('stopped receipt navy', r.includes('Agent stopped.') && (await cs(p.locator('.cm-frame__panel'),'backgroundColor'))==='rgb(8, 19, 44)');
    await p.waitForTimeout(1500); ok('nothing after stop', (await p.locator('[data-tier=receipt]').count())===1);
    results.push('receipt-stopped: '+r.replace(/\n+/g,' / ')); }
  // deny first write
  { const p = await open(); await run(p,'Happy path'); await waitBtn(p,'Create This Ticket'); await btn(p,'Deny').click(); const r = await receipt(p);
    ok('deny write receipt', r.includes('Agent stopped.') && r.includes('issues.create')); }
  return results;
}
