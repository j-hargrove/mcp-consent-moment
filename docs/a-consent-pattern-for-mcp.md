# A Consent Pattern for MCP

## The problem isn't the dialog

Every MCP host today asks for blanket trust at connection time. Users click through it like a cookie banner, because in that moment there's nothing concrete to decide about. Once granted, the trust is permanent and invisible. The protocol has moved on — tools carry input/output schemas, the 2025-11-25 spec added incremental scope consent and elicitation — but the experience hasn't caught up.

The tempting move is to design a better permission dialog. That's a trap. The real problem is this: **an agent fires tool calls at machine speed and in sequence; a human makes trust decisions at human speed.** Prompt on every call and the agent becomes useless. Prompt once at connection and the human is uninformed. The design problem isn't what the card looks like — it's *what system lets a human stay meaningfully in control of an agent moving faster than they can approve.*

Everything below is downstream of getting that reconciliation right.

## Five theses

**1. Defer the grant to first meaningful use, not connection.**
Connection establishes the relationship. Consent attaches the first time a capability is actually exercised, where there is real context to show. Connect-time prompts are decisions made before the user knows what they are deciding.

**2. Tier by risk, not by tool.**
Per-tool prompting is informed but exhausting. Resolve the tempo problem with risk tiers: read-only flows silently, writes prompt once, destructive and financial actions hard-gate every time. The same agent, three tempos, matched to consequence.

**3. The schema is the consent payload.**
A tool's input/output schema lets the host tell the user what it will do *before* it runs — which fields, what gets written where, what data leaves the machine. The consent card is a rendering of that schema plus a risk tag and a plain-language summary, not a generic "allow access?"

**4. Consent is a budget, not a switch.**
Granted scope is visible, attributable, and revocable. Scope creep — a server asking for more than it had before — re-prompts rather than silently expanding. The user can see, after the fact, exactly what their consent was spent on.

**5. Match the human to the right tempo.**
Low-risk actions get post-hoc visibility: the user can review what happened. High-risk actions get pre-hoc gates: nothing happens until the user says so. The system, not the user, decides which tempo a given action gets — because the user cannot classify risk at agent speed and should not have to.

## What this looks like in practice

The live demo runs four scenarios against three mock MCP servers. In the happy path, reads flow without interruption, the write action prompts once with the full schema shown, and the destructive refund gates hard every time — different tempos for different stakes, in sequence. In the partial completion scenario, the user denies the refund: the agent doesn't stop; it notes the ticket and surfaces a clear partial state, because denied doesn't mean stopped. In the scope creep scenario, the server requests expanded fields mid-task; the user denies the expansion; the agent falls back silently to the narrow grant it already holds and completes what it can. In the tool error scenario, the refund call fails after consent is granted, the agent retries automatically, then surfaces the failure inline and hands the decision back to the user — retry or skip — without interrupting the rest of the task. The argument in each case is the same: a system that stays useful under constraint, not one that trades control for friction.

## What this asks of hosts

The spec is explicit that hosts own the safety boundary. What is missing is shared UX vocabulary for *how* to own it. This pattern is deliberately host-agnostic — three risk tiers, a schema-driven card, a budget view — so it composes with whatever a given host's product is rather than competing with it. Treat it as a starting point for a conversation about consent UX, not a finished standard.

A reference implementation accompanies this piece — an interactive demo running four scenarios against three mock MCP servers, and a small adoptable pattern set: a framework-agnostic consent lifecycle state machine and React bindings any host can drop in. The demo was built autonomously by Claude Code from a tight spec in a single session. That's not a footnote — it's the argument made real. An agentic AI built the consent pattern for agentic AI, and the spec was the thing that kept it honest.

Live demo: https://mcp-consent-moment.vercel.app
