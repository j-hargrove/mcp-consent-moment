/**
 * @mcp-consent/react
 *
 * React bindings for @mcp-consent/core.
 * useConsentGate owns the queue and budget. The design-system components
 * (components.jsx) render consent requests; styles.css reads only token variables.
 */

import { useState, useCallback, useRef } from 'react';
import { createBudget, gate, ConsentState } from '@mcp-consent/core';

export * from './components.jsx';
export * from './motion.js';

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
    refreshGrants,
    revokeGrant,
    resetBudget,
    grantedSchemas,
    setRememberNextGrant,
  };
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
 *   sessionStart timestamp; grants older than this read "granted earlier"
 */
export function BudgetPanel({ grants, onRevoke, sessionStart = 0 }) {
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
            {g.grantedAt < sessionStart
              ? 'granted earlier'
              : new Date(g.grantedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
          <button
            data-revoke
            onClick={() => onRevoke(g.serverId, g.toolName)}
          >
            Revoke
          </button>
        </div>
      ))}
    </div>
  );
}
