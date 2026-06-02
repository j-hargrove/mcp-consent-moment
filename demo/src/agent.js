/**
 * Scripted agent with four selectable resilience modes.
 *
 * Every mode runs the same underlying 5-beat task (docs → customer → issue →
 * refund → update), but diverges when it hits resistance. The agent never
 * silently stops — denied or failed states always have a visible fallback or
 * explicit escalation.
 *
 * Modes:
 *   HAPPY              — all consents granted, full completion
 *   PARTIAL            — refund denied; agent notes the ticket and surfaces partial state
 *   SCOPE_CREEP_DENIED — scope expansion denied; agent falls back to narrow grant
 *   TOOL_ERROR         — refund fails mid-flight; agent retries, then asks user
 */

import { servers } from './servers.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export const MODE = {
  HAPPY:              'happy',
  PARTIAL:            'partial',
  SCOPE_CREEP_DENIED: 'scope-creep-denied',
  TOOL_ERROR:         'tool-error',
};

export const MODE_META = {
  [MODE.HAPPY]: {
    label:       'Happy Path',
    description: 'All consents granted. Task completes end-to-end.',
    watch:       'Watch reads flow silently in the activity strip, then the gate appear for each write and destructive action.',
  },
  [MODE.PARTIAL]: {
    label:       'Partial Completion',
    description: 'Deny the refund. Agent falls back — leaves a note, surfaces what\'s incomplete.',
    watch:       'Watch the agent pivot after your denial — it completes what it can without stopping.',
  },
  [MODE.SCOPE_CREEP_DENIED]: {
    label:       'Scope Creep Denied',
    description: 'Deny the scope expansion. Agent falls back to the narrow grant it already holds.',
    watch:       'Watch the agent fall back to its existing grant — no re-prompt, no silent expansion.',
  },
  [MODE.TOOL_ERROR]: {
    label:       'Tool Error',
    description: 'Refund fails mid-flight after you approve. Agent retries, then asks what to do.',
    watch:       'Watch the activity strip — the agent retries automatically, then hands control back to you inline.',
  },
};

/**
 * Run the demo in the given mode.
 *
 * @param {object}   p
 * @param {string}   p.mode
 * @param {function} p.callTool       - useConsentGate's callTool
 * @param {object}   p.budget         - useConsentGate's budget
 * @param {object}   p.grantedSchemas - mutable ref from useConsentGate
 * @param {function} p.emit           - (event | partialEvent) => void — activity stream
 * @param {function} p.onStatusChange - (message: string) => void
 * @param {function} p.onComplete     - ({ type, message, tasks? }) => void
 * @param {function} p.waitForDecision - async ({ message, options }) => value
 */
export async function runDemo(p) {
  setup(p.budget, p.grantedSchemas);
  const ctx = p;
  switch (p.mode) {
    case MODE.PARTIAL:            return runPartial(ctx);
    case MODE.SCOPE_CREEP_DENIED: return runScopeCreepDenied(ctx);
    case MODE.TOOL_ERROR:         return runToolError(ctx);
    default:                      return runHappy(ctx);
  }
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const NARROW_UPDATE_SCHEMA = {
  type: 'object',
  properties: {
    issue_id:        { type: 'string', description: 'ID of the issue to update' },
    status:          { type: 'string', enum: ['open', 'in-progress', 'resolved'], description: 'New issue status' },
    resolution_note: { type: 'string', description: 'Note describing how the issue was resolved' },
  },
  required: ['issue_id'],
};

const EXPANDED_UPDATE_SCHEMA = {
  type: 'object',
  properties: {
    issue_id:        { type: 'string', description: 'ID of the issue to update' },
    status:          { type: 'string', enum: ['open', 'in-progress', 'resolved'], description: 'New issue status' },
    resolution_note: { type: 'string', description: 'Note describing how the issue was resolved' },
    assignee:        { type: 'string', description: 'Team member to assign the issue to' },
    labels:          { type: 'array', items: { type: 'string' }, description: 'Labels to apply' },
  },
  required: ['issue_id'],
};

// ---------------------------------------------------------------------------
// Shared argument constants
// ---------------------------------------------------------------------------

const ARGS = {
  docsSearch: { query: 'payment processing error PAY-503', limit: 5 },
  customersRead: { customer_id: 'cust-7291' },
  issuesCreate: {
    title:       'Payment failure — PAY-503',
    description: 'Customer cust-7291 received error PAY-503 during checkout. Charge ch_3abc was not applied. Refund required.',
    priority:    'high',
    customer_id: 'cust-7291',
  },
  paymentsRefund: {
    customer_id: 'cust-7291',
    amount_usd:  149.00,
    reason:      'Payment processing error PAY-503 — charge ch_3abc not applied',
    charge_id:   'ch_3abc',
  },
  issuesUpdateExpanded: {
    issue_id:        'ISS-1847',
    status:          'resolved',
    resolution_note: 'Refund of $149.00 issued (REF-8K2MNP). Customer notified by email.',
    assignee:        'support-ops',
    labels:          ['refund-issued', 'payment-error', 'resolved'],
  },
  issuesUpdateNarrow: {
    issue_id:        'ISS-1847',
    status:          'resolved',
    resolution_note: 'Refund of $149.00 issued (REF-8K2MNP). Customer notified by email.',
  },
  issuesFallbackRefundDenied: {
    issue_id:        'ISS-1847',
    status:          'open',
    resolution_note: 'Refund denied by user — manual follow-up required.',
  },
  issuesFallbackCreepDenied: {
    issue_id:        'ISS-1847',
    status:          'resolved',
    resolution_note: 'Refund issued. Scope change denied — assignee and labels require manual update.',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTool(serverId, toolName) {
  const t = servers[serverId].tools.find(t => t.name === toolName);
  return { ...t };
}

/** Wraps tool.call so it throws on the first `failCount` invocations. */
function withTransientError(tool, failCount) {
  let calls = 0;
  return {
    ...tool,
    async call(args) {
      calls++;
      if (calls <= failCount) {
        throw new Error('Gateway timeout — upstream payment processor unavailable (PAY-503)');
      }
      return tool.call(args);
    },
  };
}

function setup(budget, grantedSchemas) {
  budget.clear();
  Object.keys(grantedSchemas).forEach(k => delete grantedSchemas[k]);
  // Pre-seed: issues.update was granted in a prior session with a narrow schema.
  // Beat 5 presents the expanded schema — scope creep fires.
  budget.grant('issue-tracker', 'issues.update');
  grantedSchemas['issues.update'] = NARROW_UPDATE_SCHEMA;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Shared beat helpers
// ---------------------------------------------------------------------------

async function runReads(ctx) {
  const { callTool, emit, onStatusChange } = ctx;
  onStatusChange('thesis 1, 2, 5: read action → flowing silently, no prompt');

  emit({ id: 'b1', state: 'running', toolName: 'docs.search', serverId: 'company-data', tier: 'read', thesis: '1, 2, 5', label: 'Searching documentation' });
  await callTool('company-data', getTool('company-data', 'docs.search'), ARGS.docsSearch);
  emit({ id: 'b1', state: 'passed' });
  await delay(500);

  emit({ id: 'b2', state: 'running', toolName: 'customers.read', serverId: 'company-data', tier: 'read', thesis: '1, 2, 5', label: 'Reading customer record' });
  await callTool('company-data', getTool('company-data', 'customers.read'), ARGS.customersRead);
  emit({ id: 'b2', state: 'passed' });
  await delay(500);
}

async function runIssuesCreate(ctx) {
  const { callTool, emit, onStatusChange } = ctx;
  onStatusChange('thesis 1, 2, 3: write action → schema-driven consent card');
  emit({ id: 'b3', state: 'running', toolName: 'issues.create', serverId: 'issue-tracker', tier: 'write', thesis: '1, 2, 3', label: 'Filing support ticket' });
  const ok = await callTool('issue-tracker', getTool('issue-tracker', 'issues.create'), ARGS.issuesCreate);
  emit({ id: 'b3', state: ok ? 'passed' : 'denied' });
  return ok;
}

async function runIssuesUpdateExpanded(ctx, extraArgs = {}) {
  const { callTool, emit, onStatusChange } = ctx;
  onStatusChange('thesis 4: scope creep detected → re-prompting with diff');
  const tool = { ...getTool('issue-tracker', 'issues.update'), inputSchema: EXPANDED_UPDATE_SCHEMA };
  const args = { ...ARGS.issuesUpdateExpanded, ...extraArgs };
  emit({ id: 'b5', state: 'running', toolName: 'issues.update', serverId: 'issue-tracker', tier: 'creep', thesis: '4', label: 'Updating ticket with resolution' });
  const ok = await callTool('issue-tracker', tool, args);
  if (ok) {
    await tool.call(args);
    emit({ id: 'b5', state: 'passed' });
  } else {
    emit({ id: 'b5', state: 'denied' });
  }
  return ok;
}

// ---------------------------------------------------------------------------
// Mode: HAPPY PATH
// ---------------------------------------------------------------------------

async function runHappy(ctx) {
  const { callTool, emit, onStatusChange, onComplete, onStopped } = ctx;

  await runReads(ctx);

  const ok3 = await runIssuesCreate(ctx);
  if (!ok3) { onStopped?.('issues.create'); return; }
  await delay(600);

  onStatusChange('thesis 2, 3, 5: destructive action → hard gate every time');
  const refundTool = getTool('payments', 'payments.refund');
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', thesis: '2, 3, 5', label: 'Processing refund' });
  const ok4 = await callTool('payments', refundTool, ARGS.paymentsRefund);
  if (!ok4) { emit({ id: 'b4', state: 'denied' }); onStopped?.('payments.refund'); return; }
  await refundTool.call(ARGS.paymentsRefund);
  emit({ id: 'b4', state: 'passed' });
  await delay(600);

  const ok5 = await runIssuesUpdateExpanded(ctx);
  if (!ok5) { onStopped?.('issues.update'); return; }
  await delay(400);

  onStatusChange('Task complete. Bug triaged, ticket filed, refund issued.');
  onComplete({ type: 'done', message: 'Task complete. Bug triaged, ticket filed, refund issued.', insight: 'Reads flowed silently. Every write and destructive action gated exactly once, with the full schema shown.' });
}

// ---------------------------------------------------------------------------
// Mode: PARTIAL COMPLETION
// ---------------------------------------------------------------------------

async function runPartial(ctx) {
  const { callTool, emit, onStatusChange, onComplete, onStopped } = ctx;

  await runReads(ctx);

  const ok3 = await runIssuesCreate(ctx);
  if (!ok3) { onStopped?.('issues.create'); return; }
  await delay(600);

  onStatusChange('thesis 2, 3, 5: destructive action → hard gate every time');
  const refundTool = getTool('payments', 'payments.refund');
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', thesis: '2, 3, 5', label: 'Processing refund' });
  const ok4 = await callTool('payments', refundTool, ARGS.paymentsRefund);

  if (ok4) {
    // User approved — run the rest as happy path
    await refundTool.call(ARGS.paymentsRefund);
    emit({ id: 'b4', state: 'passed' });
    await delay(600);
    const ok5 = await runIssuesUpdateExpanded(ctx);
    if (!ok5) { onStopped?.('issues.update'); return; }
    onStatusChange('Task complete. Bug triaged, ticket filed, refund issued.');
    onComplete({ type: 'done', message: 'Task complete. Bug triaged, ticket filed, refund issued.', insight: 'Reads flowed silently. Every write and destructive action gated exactly once, with the full schema shown.' });
    return;
  }

  // Refund denied — agent doesn't stop
  emit({ id: 'b4', state: 'denied' });
  onStatusChange('Refund denied — leaving a resolution note on the ticket instead.');
  await delay(700);

  // Fallback: issues.update with narrow schema (pre-granted, flows silently — thesis 4)
  const narrowTool = getTool('issue-tracker', 'issues.update');
  emit({ id: 'b4-fb', state: 'running', isFallback: true, toolName: 'issues.update', serverId: 'issue-tracker', tier: 'write', thesis: '4', label: 'Adding fallback note to ticket' });
  const okFb = await callTool('issue-tracker', narrowTool, ARGS.issuesFallbackRefundDenied);
  if (okFb) {
    await narrowTool.call(ARGS.issuesFallbackRefundDenied);
    emit({ id: 'b4-fb', state: 'fallback' });
  } else {
    emit({ id: 'b4-fb', state: 'denied' });
  }
  await delay(400);

  onStatusChange('2 of 3 tasks complete. Refund requires manual action.');
  onComplete({
    type: 'partial',
    message: '2 of 3 tasks complete. Refund requires manual action.',
    insight: 'The agent adapted to your decision and completed what it could.',
    tasks: [
      { label: 'Bug triaged and ticket filed', done: true },
      { label: 'Ticket updated with fallback note', done: true },
      { label: 'Refund requires manual action', done: false, manual: true },
    ],
  });
}

// ---------------------------------------------------------------------------
// Mode: SCOPE CREEP DENIED
// ---------------------------------------------------------------------------

async function runScopeCreepDenied(ctx) {
  const { callTool, emit, onStatusChange, onComplete, onStopped } = ctx;

  await runReads(ctx);

  const ok3 = await runIssuesCreate(ctx);
  if (!ok3) { onStopped?.('issues.create'); return; }
  await delay(600);

  onStatusChange('thesis 2, 3, 5: destructive action → hard gate every time');
  const refundTool = getTool('payments', 'payments.refund');
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', thesis: '2, 3, 5', label: 'Processing refund' });
  const ok4 = await callTool('payments', refundTool, ARGS.paymentsRefund);
  if (!ok4) { emit({ id: 'b4', state: 'denied' }); onStopped?.('payments.refund'); return; }
  await refundTool.call(ARGS.paymentsRefund);
  emit({ id: 'b4', state: 'passed' });
  await delay(600);

  // Beat 5: scope creep card — includes a fallback hint so the user knows
  // what happens before they decide (thesis 3: schema is the consent payload)
  onStatusChange('thesis 4: scope creep detected → re-prompting with diff');
  const expandedToolWithHint = {
    ...getTool('issue-tracker', 'issues.update'),
    inputSchema: EXPANDED_UPDATE_SCHEMA,
    fallbackHint: "If denied, I'll update the ticket using the scope I already have.",
  };
  emit({ id: 'b5', state: 'running', toolName: 'issues.update', serverId: 'issue-tracker', tier: 'creep', thesis: '4', label: 'Updating ticket with resolution' });
  const ok5 = await callTool('issue-tracker', expandedToolWithHint, ARGS.issuesUpdateExpanded);

  if (ok5) {
    await expandedToolWithHint.call(ARGS.issuesUpdateExpanded);
    emit({ id: 'b5', state: 'passed' });
    onStatusChange('Task complete. Bug triaged, ticket filed, refund issued.');
    onComplete({ type: 'done', message: 'Task complete. Bug triaged, ticket filed, refund issued.', insight: 'Reads flowed silently. Every write and destructive action gated exactly once, with the full schema shown.' });
    return;
  }

  // Expansion denied — fall back to the narrow grant that's already in the budget
  emit({ id: 'b5', state: 'denied' });
  onStatusChange('Scope expansion denied — falling back to existing narrow grant.');
  await delay(700);

  const narrowTool = getTool('issue-tracker', 'issues.update');
  emit({ id: 'b5-fb', state: 'running', isFallback: true, toolName: 'issues.update', serverId: 'issue-tracker', tier: 'write', thesis: '4', label: 'Updating ticket within existing scope' });
  const okFb = await callTool('issue-tracker', narrowTool, ARGS.issuesFallbackCreepDenied);
  if (okFb) {
    await narrowTool.call(ARGS.issuesFallbackCreepDenied);
    emit({ id: 'b5-fb', state: 'fallback' });
  } else {
    emit({ id: 'b5-fb', state: 'denied' });
  }
  await delay(400);

  onStatusChange('Task complete. Ticket updated — assignee and labels require manual update.');
  onComplete({ type: 'done', message: 'Task complete. Ticket updated — assignee and labels require manual update.', insight: 'The agent adapted to the denied scope and completed the task within the grant it already held.' });
}

// ---------------------------------------------------------------------------
// Mode: TOOL ERROR
// ---------------------------------------------------------------------------

async function runToolError(ctx) {
  const { callTool, emit, onStatusChange, onComplete, waitForDecision, onStopped } = ctx;

  await runReads(ctx);

  const ok3 = await runIssuesCreate(ctx);
  if (!ok3) { onStopped?.('issues.create'); return; }
  await delay(600);

  // Consent gate runs normally (user approves), then execution fails
  onStatusChange('thesis 2, 3, 5: destructive action → hard gate every time');
  const errorTool = withTransientError(getTool('payments', 'payments.refund'), 2);
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', thesis: '2, 3, 5', label: 'Processing refund' });
  const ok4 = await callTool('payments', errorTool, ARGS.paymentsRefund);
  if (!ok4) { emit({ id: 'b4', state: 'denied' }); onStopped?.('payments.refund'); return; }

  // Consent granted — now execute (will fail twice before succeeding)
  let refundOutcome = 'pending'; // 'passed' | 'skipped' | 'error'

  try {
    await errorTool.call(ARGS.paymentsRefund); // call 1 — throws
    emit({ id: 'b4', state: 'passed', label: 'Refund processed' });
    refundOutcome = 'passed';
  } catch {
    emit({ id: 'b4', state: 'error', label: 'Refund failed — retrying automatically…' });
    onStatusChange('Refund failed — retrying automatically…');
    await delay(1300);

    try {
      emit({ id: 'b4', state: 'retrying', label: 'Retrying refund…', retryCount: 1 });
      await errorTool.call(ARGS.paymentsRefund); // call 2 — throws
      emit({ id: 'b4', state: 'passed', label: 'Refund processed (retry)', retryCount: 1 });
      refundOutcome = 'passed';
    } catch {
      // Both auto-attempts failed — surface to user
      emit({ id: 'b4', state: 'retry-waiting', label: 'Refund failed after retry', retryCount: 1 });
      onStatusChange('Refund failed after retry — do you want me to try again or skip?');

      const choice = await waitForDecision({
        message: 'Refund failed after retry.',
        options: [
          { label: 'Try again', value: 'retry' },
          { label: 'Skip',      value: 'skip' },
        ],
      });

      if (choice === 'retry') {
        emit({ id: 'b4', state: 'retrying', label: 'Retrying refund…', retryCount: 2 });
        await delay(900);
        try {
          await errorTool.call(ARGS.paymentsRefund); // call 3 — succeeds
          emit({ id: 'b4', state: 'passed', label: 'Refund processed (retry 2)', retryCount: 2 });
          refundOutcome = 'passed';
        } catch {
          emit({ id: 'b4', state: 'error', label: 'Refund failed — manual action required' });
          refundOutcome = 'error';
        }
      } else {
        emit({ id: 'b4', state: 'skipped', label: 'Refund skipped' });
        refundOutcome = 'skipped';
      }
    }
  }

  await delay(600);

  // Beat 5 always runs — note is adjusted based on refund outcome
  const noteByOutcome = {
    passed:  'Refund of $149.00 issued (REF-8K2MNP). Customer notified by email.',
    skipped: 'Refund skipped by user — manual processing required.',
    error:   'Refund failed after retries — manual intervention required.',
  };
  const ok5 = await runIssuesUpdateExpanded(ctx, { resolution_note: noteByOutcome[refundOutcome] ?? noteByOutcome.passed });
  if (!ok5) { onStopped?.('issues.update'); return; }
  await delay(400);

  if (refundOutcome === 'passed') {
    onStatusChange('Task complete. Bug triaged, ticket filed, refund issued.');
    onComplete({ type: 'done', message: 'Task complete. Bug triaged, ticket filed, refund issued.', insight: 'The agent surfaced the failure, recovered automatically on retry, and completed the task.' });
  } else {
    const partialMsg = refundOutcome === 'skipped'
      ? 'Task complete. Refund skipped — manual processing required.'
      : 'Task complete. Refund failed — manual intervention required.';
    const partialInsight = refundOutcome === 'skipped'
      ? 'The agent surfaced the failure, respected your decision, and updated the ticket to reflect it.'
      : 'The agent escalated the failure cleanly. Nothing was silently abandoned.';
    onStatusChange(partialMsg);
    onComplete({
      type: 'partial',
      message: partialMsg,
      insight: partialInsight,
      tasks: [
        { label: 'Bug triaged and ticket filed', done: true },
        { label: refundOutcome === 'skipped' ? 'Refund skipped — manual action needed' : 'Refund failed — manual intervention required', done: false, manual: true },
        { label: 'Ticket updated with resolution note', done: true },
      ],
    });
  }
}
