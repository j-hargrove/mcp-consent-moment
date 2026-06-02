const STATE_ICON = {
  pending:         '·',
  running:         '↻',
  passed:          '✓',
  denied:          '✕',
  skipped:         '⊘',
  retrying:        '↺',
  fallback:        '⤵',
  error:           '⚠',
  'retry-waiting': '⏸',
};

const STATE_LABEL = {
  pending:         '',
  running:         'running',
  passed:          'passed',
  denied:          'denied',
  skipped:         'skipped',
  retrying:        'retrying…',
  fallback:        'fallback',
  error:           'error',
  'retry-waiting': 'waiting',
};

const TIER_LABEL = {
  read:        'READ',
  write:       'WRITE',
  destructive: 'DEST',
  creep:       'CREEP',
};

export function ActivityStrip({ events, pendingDecision, onDecision }) {
  if (!events.length && !pendingDecision) {
    return (
      <div className="activity-empty">No activity yet.</div>
    );
  }

  return (
    <div className="activity-strip">
      {events.map(event => (
        <ActivityRow key={event.id} event={event} />
      ))}

      {pendingDecision && (
        <DecisionPrompt decision={pendingDecision} onDecision={onDecision} />
      )}
    </div>
  );
}

function ActivityRow({ event }) {
  const { state, toolName, tier, thesis, label, isFallback, retryCount } = event;

  return (
    <div
      className={[
        'activity-row',
        `activity-row--${state}`,
        `activity-row--${tier}`,
        isFallback ? 'activity-row--fallback' : '',
      ].filter(Boolean).join(' ')}
    >
      <span className={`activity-icon activity-icon--${state}`}>
        {STATE_ICON[state] ?? '·'}
      </span>

      <span className={`activity-tier activity-tier--${tier}`}>
        {TIER_LABEL[tier] ?? tier?.toUpperCase()}
      </span>

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
        {thesis && <span className="activity-thesis">thesis {thesis}</span>}
      </div>
    </div>
  );
}

function DecisionPrompt({ decision, onDecision }) {
  return (
    <div className="decision-prompt">
      <div className="decision-prompt__message">{decision.message}</div>
      <div className="decision-prompt__actions">
        {decision.options.map(opt => (
          <button
            key={opt.value}
            className={`decision-btn decision-btn--${opt.value}`}
            onClick={() => onDecision(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
