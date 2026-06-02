import { renderSchemaFields, RiskTier } from '@mcp-consent/core';

/**
 * Styled consent card for the demo.
 * Implements the microcopy principles from CLAUDE.md verbatim:
 * - "what gets written" / "what gets sent" (never "allow access to X")
 * - Destructive cards never have a "remember" option
 * - Amounts are prominent on destructive cards
 * - Creep cards show the schema diff
 */
const ACTION_LABELS = {
  'docs.search':     'search internal documentation',
  'customers.read':  'read a customer record',
  'issues.create':   'file a new support ticket',
  'issues.update':   'update an existing ticket',
  'payments.refund': 'issue a refund',
};

function getContextHeader(toolName, isCreep) {
  if (isCreep) return "The agent wants to expand what it can write to this server. Here's exactly what it will do.";
  const action = ACTION_LABELS[toolName] ?? `run ${toolName}`;
  return `The agent wants to ${action}. Here's exactly what it will do.`;
}

export function StyledConsentCard({ request, onResolve, remember, onRememberChange }) {
  if (!request) return null;

  const fields = renderSchemaFields(request.tool.inputSchema, request.args);
  const isDestructive = request.tier === RiskTier.DESTRUCTIVE;
  const isCreep = request.isCreep;

  // For the creep diff: split fields into previously-granted vs new
  const allFieldNames = Object.keys(request.tool.inputSchema?.properties ?? {});
  const existingFieldNames = allFieldNames.filter(f => !request.newFields?.includes(f));
  const newFieldNames = request.newFields ?? [];

  const tierKey = isCreep ? 'creep' : request.tier;

  return (
    <div className="consent-card-wrap">
      <div className="card-context-header">
        {getContextHeader(request.tool.name, isCreep)}
      </div>
    <div className={`consent-card consent-card--${tierKey}`}>

      {/* ── Header ── */}
      <div className="card-header">
        <span className={`tier-badge tier-badge--${tierKey}`}>
          {isCreep ? 'scope creep' : request.tier}
        </span>
        <div className="tool-ident">
          <div className="tool-name">{request.tool.name}</div>
          <div className="server-name">via {request.serverId}</div>
        </div>
      </div>

      {/* ── Scope creep alert ── */}
      {isCreep && (
        <div className="creep-alert">
          <div className="creep-alert__headline">
            {request.serverId} is requesting capabilities it didn't have before.
          </div>
          {request.tool.fallbackHint && (
            <div className="creep-fallback-hint">
              {request.tool.fallbackHint}
            </div>
          )}
          <div className="creep-diff">
            <div className="creep-diff__col creep-diff__col--was">
              <div className="creep-diff__label">previously granted</div>
              {existingFieldNames.map(f => (
                <div key={f} className="creep-diff__field">{f}</div>
              ))}
            </div>
            <div className="creep-diff__arrow">→</div>
            <div className="creep-diff__col creep-diff__col--new">
              <div className="creep-diff__label">now requesting</div>
              {existingFieldNames.map(f => (
                <div key={f} className="creep-diff__field creep-diff__field--kept">{f}</div>
              ))}
              {newFieldNames.map(f => (
                <div key={f} className="creep-diff__field creep-diff__field--added">+ {f}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Destructive amount gate ── */}
      {isDestructive && request.args?.amount_usd != null && (
        <div className="amount-gate">
          <div className="amount-gate__label">amount</div>
          <div className="amount-gate__value">
            ${Number(request.args.amount_usd).toFixed(2)}
          </div>
          {request.args?.customer_id && (
            <div className="amount-gate__to">to customer {request.args.customer_id}</div>
          )}
          <div className="amount-gate__warn">This action cannot be undone.</div>
        </div>
      )}

      {/* ── Schema fields (thesis 3: schema is the consent payload) ── */}
      <div className="schema-section">
        <div className="schema-section__label">
          {isDestructive ? 'what gets sent' : 'what gets written'}
        </div>
        <div className="field-list">
          {fields.map(f => (
            <div
              key={f.name}
              className={[
                'field-row',
                newFieldNames.includes(f.name) ? 'field-row--new' : '',
              ].join(' ')}
            >
              <span className="field-row__name">{f.name}</span>
              <span className="field-row__value">
                {f.value !== null
                  ? <FieldValue value={f.value} />
                  : <span className="field-row__empty">not set</span>
                }
              </span>
              {newFieldNames.includes(f.name) && (
                <span className="field-row__new-badge">new</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Remember toggle — write tier only, never destructive (absence is the message) ── */}
      {!isDestructive && !isCreep && (
        <label className="remember-toggle">
          <input
            type="checkbox"
            checked={remember}
            onChange={e => onRememberChange?.(e.target.checked)}
          />
          <span>remember for this server</span>
        </label>
      )}

      {/* ── Actions ── */}
      <div className="card-actions">
        <button className="btn btn--deny" onClick={() => onResolve(false)}>
          {isCreep ? 'Deny expansion' : 'Deny'}
        </button>
        <button
          className={`btn btn--allow btn--allow-${tierKey}`}
          onClick={() => onResolve(true)}
        >
          {isDestructive
            ? `Confirm $${Number(request.args?.amount_usd ?? 0).toFixed(2)} refund`
            : isCreep
            ? 'Allow expanded scope'
            : 'Allow'}
        </button>
      </div>
    </div>
    </div>
  );
}

function FieldValue({ value }) {
  if (Array.isArray(value)) {
    return <span>{value.join(', ')}</span>;
  }
  if (typeof value === 'string') {
    const truncated = value.length > 72 ? value.slice(0, 72) + '…' : value;
    return <span>{truncated}</span>;
  }
  if (typeof value === 'number') {
    return <span>{value}</span>;
  }
  return <span>{JSON.stringify(value)}</span>;
}
