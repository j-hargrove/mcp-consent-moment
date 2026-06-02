/**
 * @mcp-consent/react
 *
 * React bindings for @mcp-consent/core.
 * Provides useConsentGate hook + ConsentCard component.
 *
 * The hook owns the queue and budget; the card renders ConsentRequests.
 * Hosts wire in their own styling — these are unstyled by default.
 */

import { useState, useCallback, useRef } from 'react';
import {
  createBudget,
  gate,
  RiskTier,
  ConsentState,
  renderSchemaFields,
} from '@mcp-consent/core';

// ---------------------------------------------------------------------------
// useConsentGate
// ---------------------------------------------------------------------------

/**
 * Central hook. Mount once at the host shell level.
 *
 * @param {object} [options]
 * @param {function} [options.classifyTool]   - override risk classifier
 * @param {boolean}  [options.rememberGrants] - default true
 *
 * @returns {{
 *   callTool: (serverId, tool, args) => Promise<boolean>,
 *   pendingRequest: ConsentRequest | null,
 *   resolve: (allowed: boolean) => void,
 *   budget: Budget,
 *   grants: Grant[],
 *   revokeGrant: (serverId, toolName) => void,
 *   grantedSchemas: object,
 *   setRememberNextGrant: (val: boolean) => void,
 * }}
 */
export function useConsentGate(options = {}) {
  const budget = useRef(createBudget()).current;
  const grantedSchemas = useRef({}).current;
  const [pendingRequest, setPendingRequest] = useState(null);
  const [grants, setGrants] = useState([]);
  const resolveRef = useRef(null);
  // Controls whether the next grant is persisted; set by host before resolve()
  const rememberNextRef = useRef(options.rememberGrants ?? true);

  const refreshGrants = useCallback(() => {
    setGrants(budget.list().filter(g => g.state === ConsentState.GRANTED));
  }, [budget]);

  const prompt = useCallback((request) => {
    return new Promise((res) => {
      resolveRef.current = res;
      setPendingRequest(request);
    });
  }, []);

  const resolve = useCallback((allowed) => {
    setPendingRequest(null);
    resolveRef.current?.(allowed);
    resolveRef.current = null;
    refreshGrants();
  }, [refreshGrants]);

  const callTool = useCallback(async (serverId, tool, args) => {
    const { proceed } = await gate({
      serverId,
      tool,
      args,
      budget,
      prompt,
      options: {
        // Read via getter so the value set by setRememberNextGrant() before
        // resolve() fires is visible when gate() resumes after the Promise.
        get rememberGrants() { return rememberNextRef.current; },
        classifyTool: options.classifyTool,
        grantedSchemas,
      },
    });
    rememberNextRef.current = options.rememberGrants ?? true;
    refreshGrants();
    return proceed;
  }, [budget, prompt, options, grantedSchemas, refreshGrants]);

  const revokeGrant = useCallback((serverId, toolName) => {
    budget.revoke(serverId, toolName);
    refreshGrants();
  }, [budget, refreshGrants]);

  const resetBudget = useCallback(() => {
    budget.clear();
    refreshGrants();
  }, [budget, refreshGrants]);

  const setRememberNextGrant = useCallback((val) => {
    rememberNextRef.current = val;
  }, []);

  return {
    callTool,
    pendingRequest,
    resolve,
    budget,
    grants,
    revokeGrant,
    resetBudget,
    grantedSchemas,
    setRememberNextGrant,
  };
}

// ---------------------------------------------------------------------------
// ConsentCard — unstyled, composable
// ---------------------------------------------------------------------------

/**
 * Renders a consent request. Unstyled — bring your own CSS or Tailwind.
 * For styled reference implementation see the demo's StyledConsentCard.
 *
 * Props:
 *   request    ConsentRequest from useConsentGate
 *   onResolve  (allowed: boolean) => void
 *   remember   boolean state (for write tier)
 *   onRememberChange  (val: boolean) => void
 *
 * The component exposes data-* attributes for styling hooks:
 *   data-tier="read|write|destructive"
 *   data-creep="true|false"
 */
export function ConsentCard({ request, onResolve, remember = true, onRememberChange }) {
  if (!request) return null;

  const fields = renderSchemaFields(request.tool.inputSchema, request.args);
  const isDestructive = request.tier === RiskTier.DESTRUCTIVE;
  const isCreep = request.isCreep;

  return (
    <div data-consent-card data-tier={request.tier} data-creep={String(isCreep)}>

      {/* Header */}
      <div data-card-header>
        <span data-risk-badge>{isCreep ? 'scope creep' : request.tier}</span>
        <div>
          <div data-tool-name>{request.tool.name}</div>
          <div data-server-name>via {request.serverId}</div>
        </div>
      </div>

      {/* Scope creep diff */}
      {isCreep && (
        <div data-creep-diff>
          <div data-creep-label>scope expanding</div>
          <div data-creep-row>
            <span data-was>{request.newFields.map(f => `−${f}`).join(', ')}</span>
            <span data-arrow>→</span>
            <span data-now>+{request.newFields.join(', ')}</span>
          </div>
          <p>{request.serverId} is requesting capabilities it didn't have before.</p>
        </div>
      )}

      {/* Destructive amount gate */}
      {isDestructive && request.args?.amount_usd && (
        <div data-dest-gate>
          <div data-gate-label>amount</div>
          <div data-gate-amount>${Number(request.args.amount_usd).toFixed(2)}</div>
          {request.args?.customer_id && (
            <div data-gate-to>to {request.args.customer_id}</div>
          )}
          <div data-gate-warn>This action cannot be undone.</div>
        </div>
      )}

      {/* Schema fields (thesis 3 — schema is the payload) */}
      <div data-schema-section>
        <div data-section-label>
          {isDestructive ? 'what gets sent' : 'what gets written'}
        </div>
        <div data-fields>
          {fields.map(f => (
            <div key={f.name} data-field data-new={String(request.newFields?.includes(f.name))}>
              <span data-field-name>{f.name}</span>
              <span data-field-value>
                {f.value !== null ? JSON.stringify(f.value) : <em>not set</em>}
              </span>
              {f.required && <span data-required>required</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Data leaves summary (thesis 3) */}
      <div data-data-leaves>
        <div data-section-label>data leaving your machine</div>
        <p>{request.dataLeavesSummary}</p>
      </div>

      {/* Remember toggle — write tier only, never destructive */}
      {!isDestructive && !isCreep && (
        <label data-remember>
          <input
            type="checkbox"
            checked={remember}
            onChange={e => onRememberChange?.(e.target.checked)}
          />
          remember for this server
        </label>
      )}

      {/* Actions */}
      <div data-actions>
        <button data-action="deny" onClick={() => onResolve(false)}>
          {isCreep ? 'Deny expansion' : 'Deny'}
        </button>
        <button data-action="allow" onClick={() => onResolve(true)}>
          {isDestructive
            ? `Confirm $${Number(request.args?.amount_usd ?? 0).toFixed(2)} refund`
            : isCreep
            ? 'Allow expanded scope'
            : 'Allow'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BudgetPanel — unstyled grants/revocation view (thesis 4)
// ---------------------------------------------------------------------------

/**
 * Renders the current grant budget with revocation controls.
 *
 * Props:
 *   grants       Grant[] from useConsentGate
 *   onRevoke     (serverId, toolName) => void
 */
export function BudgetPanel({ grants, onRevoke }) {
  if (!grants.length) {
    return <div data-budget-empty>No scopes granted yet.</div>;
  }

  return (
    <div data-budget-panel>
      {grants.map(g => (
        <div key={`${g.serverId}::${g.toolName}`} data-grant-item>
          <div data-grant-scope>{g.toolName}</div>
          <div data-grant-server>{g.serverId}</div>
          <div data-grant-time>
            {new Date(g.grantedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            data-revoke
            onClick={() => onRevoke(g.serverId, g.toolName)}
          >
            revoke
          </button>
        </div>
      ))}
    </div>
  );
}
