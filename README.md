# MCP Consent Moment

> Agents move fast. Humans decide slowly. This is the system that reconciles them.

**[Live demo →](https://mcp-consent-moment.vercel.app)**

---

## What it is

The problem isn't "design a permission dialog." It's reconciling agent tempo with human judgment: an agent fires tool calls at machine speed; a human makes trust decisions at human speed. This is the artifact that resolves that tension — a consent lifecycle system for MCP tool calls that tiers by risk, exposes schema as the consent payload, and matches each action to the right level of human attention before it runs.

---

## Five theses

1. **Defer the grant to first meaningful use, not connection.** Connect-time prompts are decisions made before the user knows what they're deciding.

2. **Tier by risk, not by tool.** READ → silent. WRITE → prompt once, remember. DESTRUCTIVE → hard-gate every time.

3. **The schema is the consent payload.** The card renders what the tool will do — fields, values, what leaves the machine — before it runs. Not "allow access to issue-tracker." What fields. What values. Where they go.

4. **Consent is a budget, not a switch.** Granted scope is visible, attributable, revocable. Scope creep re-prompts — never silently expands.

5. **The system matches the human to the right tempo.** Low-risk: post-hoc visibility. High-risk: pre-hoc gate. The user doesn't classify risk. The system does.

---

## What's in the repo

**`packages/consent-core`** — Framework-agnostic state machine. No dependencies. Implements `gate()`, `createBudget()`, `classifyTool()`, and `detectScopeCreep()`. Drop into any host.

**`packages/consent-react`** — React bindings. `useConsentGate()` owns the queue and budget; `ConsentCard` and `BudgetPanel` are unstyled composables. Per-call remember preference; grantedSchemas exposed for seeding.

**`demo`** — Vite + React interactive demo. Three mock MCP servers with real-shaped schemas. Four scripted scenarios: happy path, partial completion (graceful denial fallback), scope creep denied (narrow-grant fallback), and tool error (auto-retry + inline user escalation). The demo runs the real `gate()` logic — nothing is mocked.

---

*Designed and specified by Jonathan Hargrove. Built autonomously by Claude Code from CLAUDE.md in a single session.*
