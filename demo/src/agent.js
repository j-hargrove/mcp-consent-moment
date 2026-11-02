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
    label:       'Happy path',
    description: 'All consents granted. Task completes end-to-end.',
  },
  [MODE.PARTIAL]: {
    label:       'Partial completion',
    description: 'Deny the refund. Agent falls back — leaves a note, surfaces what\'s incomplete.',
  },
  [MODE.SCOPE_CREEP_DENIED]: {
    label:       'Scope creep',
    description: 'Deny the scope expansion. Agent falls back to the narrow grant it already holds.',
  },
  [MODE.TOOL_ERROR]: {
    label:       'Tool error',
    description: 'Refund fails mid-flight after you approve. Agent retries, then asks what to do.',
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
  issuesFallbackRefundDenied: {
    issue_id:        'ISS-1847',
    status:          'open',
    resolution_note: 'Refund denied by user — manual follow-up required.',
  },
  issuesFallbackRefundPending: {
    issue_id:        'ISS-1847',
    status:          'open',
    resolution_note: 'Refund failed twice and was skipped — manual processing required.',
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

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Start state for every scenario: issues.update was granted in a prior session with a
 * narrow schema. Beat 5 presents the expanded schema, so scope creep fires.
 * Runs at landing, not at run start, so revoking it there sticks for the next run.
 */
export function seedGrants(budget, grantedSchemas) {
  budget.clear();
  Object.keys(grantedSchemas).forEach(k => delete grantedSchemas[k]);
  budget.grant('issue-tracker', 'issues.update', { grantedAt: Date.now() - ONE_DAY_MS });
  grantedSchemas['issues.update'] = NARROW_UPDATE_SCHEMA;
}

const delay = ms => new Promise(r => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// Shared beat helpers
// ---------------------------------------------------------------------------

async function runReads(ctx) {
  const { callTool, emit, onStatusChange } = ctx;
  onStatusChange('reading docs and the customer record');

  emit({ id: 'b1', state: 'running', toolName: 'docs.search', serverId: 'company-data', tier: 'read', label: 'Searching documentation' });
  await callTool('company-data', getTool('company-data', 'docs.search'), ARGS.docsSearch);
  emit({ id: 'b1', state: 'passed' });
  await delay(500);

  emit({ id: 'b2', state: 'running', toolName: 'customers.read', serverId: 'company-data', tier: 'read', label: 'Reading customer record' });
  await callTool('company-data', getTool('company-data', 'customers.read'), ARGS.customersRead);
  emit({ id: 'b2', state: 'passed' });
  await delay(500);
}

async function runIssuesCreate(ctx) {
  const { callTool, emit, onStatusChange } = ctx;
  onStatusChange('wants to file a support ticket');
  emit({ id: 'b3', state: 'running', toolName: 'issues.create', serverId: 'issue-tracker', tier: 'write', label: 'Filing support ticket' });
  const tool = getTool('issue-tracker', 'issues.create');
  const ok = await callTool('issue-tracker', tool, ARGS.issuesCreate);
  if (!ok) {
    emit({ id: 'b3', state: 'denied', decision: { kind: 'declined', value: 'Not created' } });
    return false;
  }
  const { issue_id } = await tool.call(ARGS.issuesCreate);
  emit({ id: 'b3', state: 'passed', resultId: issue_id, decision: { kind: 'granted', value: issue_id } });
  onStatusChange('ticket filed');
  await delay(900); // Hold so the human sees the draft become a real ticket
  return true;
}

const NEW_FIELDS = ['assignee', 'labels'];
const REFUND_SENT = { kind: 'high', value: '$149.00 to cust-7291' };

function pickFields(source, keep) {
  return Object.fromEntries(Object.entries(source).filter(([field]) => keep.includes(field)));
}

/**
 * Beat 5. Returns the new fields left undone, which is empty only if all were approved.
 * Approval covers just the fields the human checked, so the call and the recorded
 * grant both narrow to those. Keep Current Grant writes the granted fields only.
 */
async function runIssuesUpdateExpanded(ctx, extraArgs = {}) {
  const { budget, callTool, emit, onStatusChange, grantedSchemas, getApprovedFields } = ctx;
  const narrowTool = getTool('issue-tracker', 'issues.update');
  const tool = { ...narrowTool, inputSchema: EXPANDED_UPDATE_SCHEMA };
  const args = { ...ARGS.issuesUpdateExpanded, ...extraArgs };
  const newFields = NEW_FIELDS;
  const grantedFields = Object.keys(NARROW_UPDATE_SCHEMA.properties);
  const narrowArgs = pickFields(args, grantedFields);

  // Revoked: the agent re-asks for the narrow scope only, so a revoke can't lead to a broader grant
  if (!budget.isGranted('issue-tracker', 'issues.update')) {
    onStatusChange('wants to update the ticket');
    emit({ id: 'b5', state: 'running', toolName: 'issues.update', serverId: 'issue-tracker', tier: 'write', label: 'Updating ticket with resolution' });
    if (await callTool('issue-tracker', narrowTool, narrowArgs)) {
      await narrowTool.call(narrowArgs);
      emit({ id: 'b5', state: 'passed', decision: { kind: 'granted', value: 'Approved after revoke' } });
      return newFields;
    }
    emit({ id: 'b5', state: 'denied', decision: { kind: 'declined', value: 'Not updated' } });
    return ['ticket update'];
  }

  onStatusChange('wants to write 2 new fields on the ticket');
  emit({ id: 'b5', state: 'running', toolName: 'issues.update', serverId: 'issue-tracker', tier: 'creep', label: 'Updating ticket with resolution' });

  if (await callTool('issue-tracker', tool, args)) {
    // No field list means the card wasn't a scope-creep card, so the whole call was approved
    const approved = getApprovedFields() ?? newFields;
    // gate() records the whole schema when the human chose to remember: keep only what they approved
    if (grantedSchemas['issues.update'] === tool.inputSchema) {
      grantedSchemas['issues.update'] = {
        ...NARROW_UPDATE_SCHEMA,
        properties: {
          ...NARROW_UPDATE_SCHEMA.properties,
          ...pickFields(EXPANDED_UPDATE_SCHEMA.properties, approved),
        },
      };
    }
    await tool.call(pickFields(args, [...grantedFields, ...approved]));
    emit({ id: 'b5', state: 'passed', decision: { kind: 'granted', value: `${approved.join(', ')} approved` } });
    return newFields.filter(field => !approved.includes(field));
  }

  emit({ id: 'b5', state: 'denied', decision: { kind: 'declined', value: 'Kept the current grant' } });
  onStatusChange('keeping the current grant');
  await delay(700);
  emit({ id: 'b5-fb', state: 'running', isFallback: true, toolName: 'issues.update', serverId: 'issue-tracker', tier: 'write', label: 'Updating ticket within existing scope' });
  await callTool('issue-tracker', narrowTool, narrowArgs);
  await narrowTool.call(narrowArgs);
  emit({ id: 'b5-fb', state: 'fallback' });
  return newFields;
}

/** "Assignee and labels", for the outcome line and the LEFT FOR YOU row. */
function leftoverName(fields) {
  const names = fields.join(' and ');
  return `${names[0].toUpperCase()}${names.slice(1)}`;
}

/** Closes a run whose refund went through: honest about any field left undone. */
function finishAfterUpdate({ onStatusChange, onComplete }, left, insight) {
  if (left.length === 0) {
    onStatusChange('Task complete. Bug triaged, ticket filed, refund issued.');
    onComplete({ type: 'done', message: 'Task complete. Bug triaged, ticket filed, refund issued.', insight });
    return;
  }
  const message = `Task complete. ${leftoverName(left)} left for you.`;
  onStatusChange(message);
  onComplete({
    type: 'partial',
    message,
    insight: 'The agent stayed inside the grant you chose and left the rest with you.',
    tasks: [
      { label: 'Bug triaged and ticket filed', done: true },
      { label: 'Refund issued', done: true },
      { label: leftoverName(left), done: false, leftover: true },
    ],
  });
}

/** The refund didn't happen: the agent notes it on the ticket and leaves the refund to the human. */
async function finishWithoutRefund({ callTool, emit, onStatusChange, onComplete }, note, message) {
  onStatusChange('refund not issued, leaving a note on the ticket');
  await delay(700);

  // The narrow issues.update grant is already held, so this flows silently (thesis 4)
  const narrowTool = getTool('issue-tracker', 'issues.update');
  emit({ id: 'b4-fb', state: 'running', isFallback: true, toolName: 'issues.update', serverId: 'issue-tracker', tier: 'write', label: 'Leaving a resolution note' });
  const noted = await callTool('issue-tracker', narrowTool, note);
  if (noted) await narrowTool.call(note);
  emit({ id: 'b4-fb', state: noted ? 'fallback' : 'denied' });
  await delay(400);

  onStatusChange(message);
  onComplete({
    type: 'partial',
    message,
    insight: 'The agent adapted to your decision and completed what it could.',
    tasks: [
      { label: 'Bug triaged and ticket filed', done: true },
      { label: noted ? 'Ticket updated with a note' : 'Ticket note', done: noted, leftover: !noted },
      { label: 'Refund requires manual action', done: false, manual: true },
    ],
  });
}

/** Don't Refund, in any scenario. */
function finishRefundDenied(ctx) {
  ctx.emit({ id: 'b4', state: 'denied', decision: { kind: 'declined', value: 'Not refunded' } });
  return finishWithoutRefund(ctx, ARGS.issuesFallbackRefundDenied, '2 of 3 done. Refund requires manual action.');
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

  onStatusChange('wants to refund $149.00');
  const refundTool = getTool('payments', 'payments.refund');
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', label: 'Processing refund' });
  const ok4 = await callTool('payments', refundTool, ARGS.paymentsRefund);
  if (!ok4) { await finishRefundDenied(ctx); return; }
  await refundTool.call(ARGS.paymentsRefund);
  emit({ id: 'b4', state: 'passed', decision: REFUND_SENT });
  await delay(600);

  const left = await runIssuesUpdateExpanded(ctx);
  await delay(400);
  finishAfterUpdate(ctx, left, 'Reads flowed silently. Every write and destructive action gated exactly once, with the full schema shown.');
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

  onStatusChange('wants to refund $149.00');
  const refundTool = getTool('payments', 'payments.refund');
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', label: 'Processing refund' });
  const ok4 = await callTool('payments', refundTool, ARGS.paymentsRefund);

  if (ok4) {
    // User approved — run the rest as happy path
    await refundTool.call(ARGS.paymentsRefund);
    emit({ id: 'b4', state: 'passed', decision: REFUND_SENT });
    await delay(600);
    const left = await runIssuesUpdateExpanded(ctx);
    await delay(400);
    finishAfterUpdate(ctx, left, 'Reads flowed silently. Every write and destructive action gated exactly once, with the full schema shown.');
    return;
  }

  await finishRefundDenied(ctx);
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

  onStatusChange('wants to refund $149.00');
  const refundTool = getTool('payments', 'payments.refund');
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', label: 'Processing refund' });
  const ok4 = await callTool('payments', refundTool, ARGS.paymentsRefund);
  if (!ok4) { await finishRefundDenied(ctx); return; }
  await refundTool.call(ARGS.paymentsRefund);
  emit({ id: 'b4', state: 'passed', decision: REFUND_SENT });
  await delay(600);

  const left = await runIssuesUpdateExpanded(ctx);
  await delay(400);
  finishAfterUpdate(ctx, left, 'Reads flowed silently. Every write and destructive action gated exactly once, with the full schema shown.');
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
  onStatusChange('wants to refund $149.00');
  const errorTool = withTransientError(getTool('payments', 'payments.refund'), 2);
  emit({ id: 'b4', state: 'running', toolName: 'payments.refund', serverId: 'payments', tier: 'destructive', label: 'Processing refund' });
  const ok4 = await callTool('payments', errorTool, ARGS.paymentsRefund);
  if (!ok4) { await finishRefundDenied(ctx); return; }

  const failures = [];
  const logFailure = label => failures.push({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    label,
  });

  // Consent granted — now execute (will fail twice before succeeding)
  let refundOutcome = 'pending'; // 'passed' | 'skipped'

  try {
    await errorTool.call(ARGS.paymentsRefund); // call 1 — throws
    emit({ id: 'b4', state: 'passed', decision: REFUND_SENT, label: 'Refund processed' });
    refundOutcome = 'passed';
  } catch {
    logFailure('First attempt failed: gateway timeout');
    // Passive until it needs a person: alert color waits for the second failure
    emit({ id: 'b4', state: 'retrying', label: 'Retrying refund…', retryCount: 1 });
    onStatusChange('refund failed, retrying automatically');
    await delay(1300);

    try {
      await errorTool.call(ARGS.paymentsRefund); // call 2 — throws
      emit({ id: 'b4', state: 'passed', decision: REFUND_SENT, label: 'Refund processed (retry)', retryCount: 1 });
      refundOutcome = 'passed';
    } catch {
      // Both auto-attempts failed — surface to user
      emit({ id: 'b4', state: 'needs-you', label: 'Refund failed after retry', retryCount: 1 });
      logFailure('Automatic retry failed: gateway timeout');
      onStatusChange('refund failed twice, try again or skip?');

      const choice = await waitForDecision({
        title: 'The $149.00 refund failed twice.',
        detail: "No money moved. The customer hasn't been refunded.",
        timeline: failures,
      });

      if (choice === 'retry') {
        emit({ id: 'b4', state: 'retrying', label: 'Retrying refund…', retryCount: 2 });
        await delay(900);
        await errorTool.call(ARGS.paymentsRefund); // call 3 — succeeds
        emit({ id: 'b4', state: 'passed', decision: REFUND_SENT, label: 'Refund processed (retry 2)', retryCount: 2 });
        refundOutcome = 'passed';
      } else {
        emit({ id: 'b4', state: 'skipped', label: 'Refund skipped', decision: { kind: 'declined', value: 'Skipped after two failures' } });
        refundOutcome = 'skipped';
      }
    }
  }

  await delay(600);

  if (refundOutcome === 'passed') {
    const left = await runIssuesUpdateExpanded(ctx);
    await delay(400);
    finishAfterUpdate(ctx, left, 'The agent surfaced the failure, recovered automatically on retry, and completed the task.');
    return;
  }

  // No refund, so no "resolved" ticket and no refund-issued label: the note stays inside the grant
  await finishWithoutRefund(ctx, ARGS.issuesFallbackRefundPending, '2 of 3 done. Refund pending.');
}
