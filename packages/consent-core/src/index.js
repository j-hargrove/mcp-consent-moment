/**
 * @mcp-consent/core
 *
 * Framework-agnostic consent lifecycle state machine for MCP tool authorization.
 * No dependencies. Drop into any host.
 *
 * Implements the five theses from "A Consent Pattern for MCP":
 *   1. Defer grant to first meaningful use, not connection
 *   2. Tier by risk, not by tool
 *   3. Tool schema is the consent payload
 *   4. Consent is a budget — visible, attributable, revocable; scope creep re-prompts
 *   5. System matches human to right tempo (low-risk: post-hoc; high-risk: pre-hoc gate)
 */

// ---------------------------------------------------------------------------
// Risk tiers
// ---------------------------------------------------------------------------

export const RiskTier = {
  READ:        'read',        // read-only; flows silently (thesis 2, 5)
  WRITE:       'write',       // persistent write; prompt once, remember (thesis 2, 5)
  DESTRUCTIVE: 'destructive', // irreversible or financial; hard-gate every time (thesis 2, 5)
};

// ---------------------------------------------------------------------------
// Consent states (thesis 4 — budget lifecycle)
// ---------------------------------------------------------------------------

export const ConsentState = {
  PENDING:  'pending',   // tool call queued; waiting for classification
  PROMPTED: 'prompted',  // consent card shown to user
  GRANTED:  'granted',   // user allowed this scope
  DENIED:   'denied',    // user denied; call must not proceed
  REVOKED:  'revoked',   // previously granted scope revoked by user
  CREEP:    'creep',     // server requested broader scope than previously granted
};

// ---------------------------------------------------------------------------
// Risk classifier (thesis 2)
// Hosts supply their own classifyTool; this is the default heuristic.
// ---------------------------------------------------------------------------

const DESTRUCTIVE_PATTERNS = [
  /delete/i, /destroy/i, /remove/i, /drop/i, /purge/i,
  /refund/i, /charge/i, /payment/i, /transfer/i, /withdraw/i,
  /send.*email/i, /send.*message/i, /post.*public/i,
];

const WRITE_PATTERNS = [
  /create/i, /write/i, /update/i, /insert/i, /patch/i,
  /upload/i, /commit/i, /push/i, /set/i, /put/i,
];

/**
 * Default heuristic classifier. Hosts should override with domain knowledge.
 * @param {object} tool - MCP tool definition { name, description, inputSchema, outputSchema }
 * @returns {RiskTier}
 */
export function classifyTool(tool) {
  const text = `${tool.name} ${tool.description ?? ''}`;
  if (DESTRUCTIVE_PATTERNS.some(p => p.test(text))) return RiskTier.DESTRUCTIVE;
  if (WRITE_PATTERNS.some(p => p.test(text))) return RiskTier.WRITE;
  return RiskTier.READ;
}

// ---------------------------------------------------------------------------
// Grant budget (thesis 4)
// ---------------------------------------------------------------------------

/**
 * Creates a new in-memory grant budget.
 * Hosts can persist/restore via toJSON/fromJSON.
 */
export function createBudget() {
  const grants = new Map(); // scope key → Grant

  function scopeKey(serverId, toolName) {
    return `${serverId}::${toolName}`;
  }

  return {
    /**
     * Record a granted scope.
     * @param {string} serverId
     * @param {string} toolName
     * @param {object} [meta] - { grantedAt, inputHash } — for attributability
     */
    grant(serverId, toolName, meta = {}) {
      const key = scopeKey(serverId, toolName);
      grants.set(key, {
        serverId,
        toolName,
        state: ConsentState.GRANTED,
        grantedAt: meta.grantedAt ?? Date.now(),
        inputHash: meta.inputHash ?? null,
      });
    },

    /** Revoke a previously granted scope. */
    revoke(serverId, toolName) {
      const key = scopeKey(serverId, toolName);
      const g = grants.get(key);
      if (g) g.state = ConsentState.REVOKED;
    },

    /** Check whether a scope is currently active. */
    isGranted(serverId, toolName) {
      const g = grants.get(scopeKey(serverId, toolName));
      return g?.state === ConsentState.GRANTED;
    },

    /** Return all grants as an array (for the budget view). */
    list() {
      return Array.from(grants.values());
    },

    /** Clear all grants (e.g. to reset demo state). */
    clear() {
      grants.clear();
    },

    /** Serialize for persistence. */
    toJSON() {
      return JSON.stringify(Array.from(grants.entries()));
    },

    /** Restore from serialized state. */
    fromJSON(json) {
      const entries = JSON.parse(json);
      entries.forEach(([k, v]) => grants.set(k, v));
    },
  };
}

// ---------------------------------------------------------------------------
// Scope creep detection (thesis 4)
// ---------------------------------------------------------------------------

/**
 * Detects whether a tool call represents scope expansion vs. what was granted.
 * Compares the current inputSchema fields against the schema present at grant time.
 *
 * @param {object} currentTool   - tool definition as presented now
 * @param {object} grantedSchema - inputSchema captured at grant time
 * @returns {{ isCreep: boolean, newFields: string[] }}
 */
export function detectScopeCreep(currentTool, grantedSchema) {
  if (!grantedSchema || !currentTool.inputSchema) {
    return { isCreep: false, newFields: [] };
  }
  const grantedFields = new Set(Object.keys(grantedSchema.properties ?? {}));
  const currentFields = Object.keys(currentTool.inputSchema.properties ?? {});
  const newFields = currentFields.filter(f => !grantedFields.has(f));
  return { isCreep: newFields.length > 0, newFields };
}

// ---------------------------------------------------------------------------
// Consent request — the payload passed to the host UI (thesis 3)
// ---------------------------------------------------------------------------

/**
 * Build a ConsentRequest from a tool call. This is what the host hands to the
 * UI layer — the schema IS the consent payload.
 *
 * @param {object} params
 * @param {string} params.serverId
 * @param {object} params.tool         - MCP tool definition
 * @param {object} params.args         - actual arguments for this call
 * @param {RiskTier} [params.tier]     - override classifier
 * @param {object}  [params.grantedSchema] - schema at grant time, for creep detection
 * @returns {ConsentRequest}
 */
export function buildConsentRequest({ serverId, tool, args, tier, grantedSchema }) {
  const resolvedTier = tier ?? classifyTool(tool);
  const { isCreep, newFields } = detectScopeCreep(tool, grantedSchema);

  return {
    id:         `${serverId}:${tool.name}:${Date.now()}`,
    serverId,
    tool,
    args,
    tier:       resolvedTier,
    isCreep,
    newFields,
    // Human-readable summary of what leaves the machine (thesis 3)
    dataLeavesSummary: summarizeDataLeaves(tool, args),
    createdAt:  Date.now(),
  };
}

/**
 * Produces a plain-language summary of what data this call will send out.
 * Hosts should override this with domain knowledge; this is a safe default.
 */
function summarizeDataLeaves(tool, args) {
  const fields = Object.keys(args ?? {});
  if (!fields.length) return 'No data leaves your machine.';
  const listed = fields.slice(0, 4).join(', ');
  const more = fields.length > 4 ? ` and ${fields.length - 4} more` : '';
  return `The following values are sent to ${tool.name}: ${listed}${more}.`;
}

// ---------------------------------------------------------------------------
// Core consent gate — the decision engine (theses 1, 4, 5)
// ---------------------------------------------------------------------------

/**
 * The central gate. Call this before executing any MCP tool call.
 *
 * @param {object}   params
 * @param {string}   params.serverId
 * @param {object}   params.tool         - MCP tool definition
 * @param {object}   params.args         - arguments for this call
 * @param {Budget}   params.budget       - grant budget from createBudget()
 * @param {function} params.prompt       - async (ConsentRequest) => boolean
 *                                         host supplies this; shows the UI card
 * @param {object}   [params.options]
 * @param {boolean}  [params.options.rememberGrants=true]
 * @param {function} [params.options.classifyTool]   - override classifier
 * @param {object}   [params.options.grantedSchemas] - map of toolName → schema at grant time
 *
 * @returns {Promise<{ proceed: boolean, state: ConsentState }>}
 */
export async function gate({ serverId, tool, args, budget, prompt, options = {} }) {
  const {
    rememberGrants = true,
    classifyTool: classify = classifyTool,
    grantedSchemas = {},
  } = options;

  const tier = classify(tool);

  // Thesis 5: reads flow silently — post-hoc visibility only
  if (tier === RiskTier.READ) {
    return { proceed: true, state: ConsentState.GRANTED };
  }

  // Thesis 2+4: destructive actions always gate, no memory
  if (tier === RiskTier.DESTRUCTIVE) {
    const request = buildConsentRequest({ serverId, tool, args, tier, grantedSchema: null });
    const allowed = await prompt(request);
    return {
      proceed: allowed,
      state: allowed ? ConsentState.GRANTED : ConsentState.DENIED,
    };
  }

  // Thesis 4: write — check for existing grant first
  if (tier === RiskTier.WRITE) {
    const grantedSchema = grantedSchemas[tool.name] ?? null;
    const { isCreep } = detectScopeCreep(tool, grantedSchema);

    // Scope creep: re-prompt even if previously granted
    if (isCreep && budget.isGranted(serverId, tool.name)) {
      const request = buildConsentRequest({ serverId, tool, args, tier, grantedSchema });
      const allowed = await prompt(request); // UI should render creep card
      if (allowed && rememberGrants) {
        budget.revoke(serverId, tool.name); // revoke old narrow scope
        budget.grant(serverId, tool.name, { inputHash: hashSchema(tool.inputSchema) });
        grantedSchemas[tool.name] = tool.inputSchema;
      }
      return {
        proceed: allowed,
        state: allowed ? ConsentState.GRANTED : ConsentState.DENIED,
      };
    }

    // Already granted and no creep: flow silently (thesis 4)
    if (budget.isGranted(serverId, tool.name)) {
      return { proceed: true, state: ConsentState.GRANTED };
    }

    // First use: prompt (thesis 1)
    const request = buildConsentRequest({ serverId, tool, args, tier, grantedSchema: null });
    const allowed = await prompt(request);
    if (allowed && rememberGrants) {
      budget.grant(serverId, tool.name, { inputHash: hashSchema(tool.inputSchema) });
      grantedSchemas[tool.name] = tool.inputSchema;
    }
    return {
      proceed: allowed,
      state: allowed ? ConsentState.GRANTED : ConsentState.DENIED,
    };
  }

  // Fallback: deny unknown tiers
  return { proceed: false, state: ConsentState.DENIED };
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/** Lightweight schema fingerprint for creep detection. Not cryptographic. */
function hashSchema(schema) {
  if (!schema) return '';
  return Object.keys(schema.properties ?? {}).sort().join(',');
}

/**
 * Render a tool's input schema as a flat list of field descriptors.
 * Useful for consent card UI (thesis 3).
 *
 * @param {object} inputSchema - JSON Schema object
 * @param {object} args        - actual call arguments
 * @returns {Array<{ name, value, required, type }>}
 */
export function renderSchemaFields(inputSchema, args = {}) {
  if (!inputSchema?.properties) return [];
  const required = new Set(inputSchema.required ?? []);
  return Object.entries(inputSchema.properties).map(([name, def]) => ({
    name,
    value:    args[name] ?? null,
    required: required.has(name),
    type:     def.type ?? 'any',
    description: def.description ?? null,
  }));
}
