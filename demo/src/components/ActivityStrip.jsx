import { Icon, ICON_TONES, TierChip } from '@mcp-consent/react';

const STATE_ICON = {
  running:         'renew',
  passed:          'checkmark',
  denied:          'close',
  skipped:         'close',
  stopped:         'stop-sign',
  retrying:        'renew',
  fallback:        'arrow-right',
  error:           'warning-alt',
  'retry-waiting': 'warning-alt',
};

const STATE_TONE = { running: 'agent', retrying: 'agent' };
const SLATE_STATES = ['denied', 'skipped', 'stopped', 'fallback'];

const RECORD_ICON = {
  'docs.search':     'view',
  'customers.read':  'view',
  'issues.create':   'receipt',
  'issues.update':   'receipt',
  'payments.refund': 'purchase',
};

const CHIP_TIER = { creep: 'scope-creep' };

const STATE_LABEL = {
  pending:         '',
  running:         'running',
  passed:          'passed',
  denied:          'denied',
  skipped:         'skipped',
  stopped:         'stopped',
  retrying:        'retrying…',
  fallback:        '',
  error:           'error',
  'retry-waiting': 'waiting',
};

export function ActivityStrip({ events, gateOpen }) {
  if (!events.length) {
    return (
      <div className="activity-empty">No activity yet.</div>
    );
  }

  return (
    <div className="activity-strip">
      {events.map(event => (
        <ActivityRow key={event.id} event={event} gateOpen={gateOpen} />
      ))}
    </div>
  );
}

function ActivityRow({ event, gateOpen }) {
  const { toolName, tier, isFallback, retryCount } = event;
  // The agent runs nothing while a card is open: the row is waiting on the human
  const state = gateOpen && event.state === 'running' ? 'retry-waiting' : event.state;

  return (
    <div
      className={[
        'activity-row',
        `activity-row--${state}`,
        `activity-row--${tier}`,
        isFallback ? 'activity-row--fallback' : '',
      ].filter(Boolean).join(' ')}
    >
      <Icon
        name={STATE_ICON[state] ?? 'renew'}
        tone={SLATE_STATES.includes(state) ? undefined : STATE_TONE[state] ?? ICON_TONES[STATE_ICON[state]]}
      />
      <Icon name={RECORD_ICON[toolName] ?? 'receipt'} />
      <TierChip tier={CHIP_TIER[tier] ?? tier} compact />

      <div className="activity-info">
        <span className="activity-tool">{toolName}</span>
        {isFallback && <span className="activity-fallback-badge">fallback</span>}
        {retryCount != null && retryCount > 0 && (
          <span className="activity-retry-badge">retry {retryCount}</span>
        )}
      </div>

      <div className="activity-meta">
        {STATE_LABEL[state] && (
          <span className={`activity-state-label activity-state-label--${state}`}>
            {STATE_LABEL[state]}
          </span>
        )}
      </div>
    </div>
  );
}
