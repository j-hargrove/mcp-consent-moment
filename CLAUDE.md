# CLAUDE.md — MCP Consent Moment

Build agent read this first. Every decision keys off the five theses below.
If a request conflicts with them, say so instead of quietly going along.

---

## The reframe (one sentence — protect it)

The problem is not "design a permission dialog." It is reconciling agent tempo
with human judgment: an agent fires tool calls at machine speed; a human makes
trust decisions at human speed. The artifact is the system that resolves that
tension.

---

## Five theses — the build spec

Every component, state transition, and piece of copy must embody one of these.
If you can't map a decision to a thesis, it's probably not in scope.

1. **Defer the grant to first meaningful use, not connection.**
   Connect-time prompts are decisions made before the user knows what they're deciding.

2. **Tier by risk, not by tool.**
   READ → silent. WRITE → prompt once, remember. DESTRUCTIVE → hard-gate every time.

3. **The schema is the consent payload.**
   The card renders what the tool will do — fields, values, what leaves the machine — before it runs.
   Not "allow access to issue-tracker." What fields. What values. Where they go.

4. **Consent is a budget, not a switch.**
   Granted scope is visible, attributable, revocable.
   Scope creep (server requests more than previously granted) re-prompts — never silently expands.

5. **The system matches the human to the right tempo.**
   Low-risk: post-hoc visibility. High-risk: pre-hoc gate.
   The user doesn't classify risk. The system does.

---

## Repo structure

```
mcp-consent-moment/
├── packages/
│   ├── consent-core/       # framework-agnostic state machine (no deps)
│   │   └── src/index.js    # gate(), createBudget(), classifyTool(), detectScopeCreep()
│   └── consent-react/      # React bindings
│       └── src/index.jsx   # useConsentGate(), ConsentCard, BudgetPanel
├── demo/                   # interactive demo (Vite + React)
│   └── src/
│       ├── App.jsx          # host shell
│       ├── servers.js       # three mock MCP servers with real-shaped schemas
│       ├── agent.js         # scripted deterministic tool-call timeline
│       └── components/      # styled consent card, activity strip, budget panel
├── docs/
│   └── a-consent-pattern-for-mcp.md   # position piece
└── CLAUDE.md
```

---

## What is and isn't real

**Real (the whole point):**
- `consent-core` state machine — actual logic, no mocks
- `consent-react` bindings — actual hook and components
- Consent card interaction — real UI decisions

**Simulated (by design):**
- MCP servers — in-app objects with real-shaped schemas, no JSON-RPC over wire
- Agent — scripted deterministic timeline, not a live LLM loop
- Token exchange — mocked; no OAuth provider

Simulated ≠ fake. The schemas are real MCP shapes. The state machine runs against them.

---

## Mock server contract

Each mock server exports:
```js
{
  id: string,              // e.g. 'issue-tracker'
  displayName: string,
  tier: RiskTier,          // advisory; gate() classifies independently
  tools: [
    {
      name: string,
      description: string,
      inputSchema: JSONSchema,   // required — thesis 3 depends on it
      outputSchema: JSONSchema,
      // simulate a call — returns realistic shaped data
      call: async (args) => object,
    }
  ]
}
```

---

## Demo script (90 seconds, 5 beats)

Every beat maps to a thesis. Don't add beats that don't map.

| Beat | Tool | Tier | Treatment | Thesis |
|------|------|------|-----------|--------|
| 1 | docs.search | READ | Silent — pulse in activity strip | 1, 2, 5 |
| 2 | customers.read | READ | Silent | 1, 2, 5 |
| 3 | issues.create | WRITE | Schema card, remember checkbox | 1, 2, 3 |
| 4 | payments.refund | DESTRUCTIVE | Hard gate, amount prominent, no remember | 2, 3, 5 |
| 5 | issues.update | WRITE+CREEP | Scope-creep card, diff shown | 4 |

Completion state: "Task complete. Bug triaged, ticket filed, refund issued."

---

## Out of scope — hold the line

- Full OAuth/OIDC implementation
- Real server connections
- Team/enterprise policy administration (that's Conduit — a separate artifact)
- MCP Apps UI trust
- Live LLM agent loop

If a request pushes into these, say: "That's out of scope — see CLAUDE.md."

---

## Verification loop

Before marking any task done:
1. Does the change map to a thesis? Which one?
2. Does the demo still run the full 5-beat script without error?
3. Does `gate()` in consent-core correctly handle: READ pass, WRITE first-use, WRITE remembered, WRITE creep, DESTRUCTIVE every time?
4. Does the completion state say "Task complete. Bug triaged, ticket filed, refund issued."?

---

## Microcopy principles

- Status bar narrates the thesis number during the demo ("thesis 2–3: write action → schema-driven consent card")
- Cards describe what happens in plain language, not permission jargon
- No "allow access to X" — always "what gets written" / "what gets sent"
- Destructive cards never have a "remember" option — the absence is the message
- Completion state closes on the task, not the demo ("Task complete." not "Demo complete.")
