# A Consent Pattern for MCP

## The problem isn't the dialog

Most MCP hosts ask for trust once, when a server connects. People click through it because in that moment there is nothing concrete to decide. Once granted, the trust is permanent and invisible. The protocol has moved on: tools carry input and output schemas, and the 2025-11-25 spec added incremental scope consent and elicitation. The experience hasn't caught up.

A better permission dialog doesn't fix this. An agent fires tool calls at machine speed and in sequence; a person makes trust decisions at human speed. Prompt on every call and the agent is useless. Prompt once at connection and the person is uninformed. One grant at connect time also treats a read and an irreversible refund the same way. The design problem is the system that keeps a person in control of an agent moving faster than they can approve.

## Five theses

**1. Defer the grant to first meaningful use, not connection.**
Connection establishes the relationship. Consent attaches the first time a capability is used, when there is real context to show.

**2. Tier by risk, not by tool.**
Reads flow silently, writes ask once and can be remembered, destructive actions stop every time. The same agent runs at different tempos, matched to consequence.

**3. The tool schema is the consent payload.**
The schema tells the host what a call will do before it runs: which fields, which values, where they go. The card renders that, not "allow access?"

**4. Consent is a budget, not a switch.**
Granted scope is visible, attributable and revocable. A server asking for more than it holds asks again; it never expands silently.

**5. The system matches the human to the right tempo.**
Low-risk actions get visibility after the fact. High-risk actions get a gate before. The system classifies the risk, because a person can't at agent speed and shouldn't have to.

## Tiers and card frames

Each tier changes the card's structure, not just its color, so the tiers read in grayscale. The card gets heavier and warmer as the stakes rise.

| Tier | Treatment | Frame |
|---|---|---|
| Read | Runs silently; appears in the activity list after | Gray hairline |
| Write | Asks on first use with a draft of exactly what gets written | 1.5px slate |
| Scope creep | Asks again, showing only what's new | 2px terracotta |
| Destructive | Hard stop every time, amount as the largest thing on the card | Film-red header panel |
| Alert | A failure the agent can't resolve, handed back to the person | 2px film red |

The payload follows the action: a create shows a draft preview, an update or scope change shows a causal trace, a destructive call shows the value, a failure shows a timeline, and completion shows the trace as a record.

## Narrow by default

The primary action is always the narrowest choice that still does the task. For a destructive action, the narrowest choice is doing nothing: Don't Refund sits where Confirm would be. Approving a scope expansion covers only the fields checked, and the button says so: "Approve Selected · 1 of 2". Buttons never claim more than they do.

## What gets remembered

- Remember options start unchecked and name exactly what they remember: "Don't ask again for new tickets on issue-tracker", "Remember assignee and labels for issue-tracker".
- Destructive actions are never remembered. The card has no remember option; the absence is the message.
- Cross-server changes are never remembered.
- Grants appear only after the decision. Revoking one is immediate, and the next use asks again, for the narrow scope only. A revoke never leads to a broader grant.

## A consequence under every non-obvious choice

When a choice has an effect that isn't obvious from its label, the card says what happens underneath it:

- "Keep Current Grant: the ticket updates with the 3 granted fields."
- "Left unchecked, approval covers this update only and the grant stays as it was."
- "Not remembered. Every refund asks again."
- "Skip for Now: the refund stays with you to finish."

## The causal trace

A scope decision is a question about causation: what you already allowed, where that ends, and what this call adds. The causal trace draws it on one vertical line:

- Granted fields: forest nodes on a solid forest line.
- Where the grant ends: the line turns dashed terracotta.
- What's new: terracotta-outlined nodes, half-filled for higher consequence and open for low consequence, each with its own checkbox and a note on what it changes.
- Destructive steps: a heavy film-red line and a solid oxblood node.
- Declined steps: an outline node with a strike.

The completion receipt reuses the same trace as a record of what the person decided, followed by what's left for them to do.

## Cross-server changes (multi-hop)

Cross-server changes ask every time.

A change on one server can carry into another. In the demo, changing a contact's email on the CRM also changes two fields on payments: the billing contact and where card receipts and fraud alerts go. The CRM email was granted; payments never was.

- The trace keeps the CRM step's forest line down to a hop rule: a dashed terracotta line labeled "crosses to payments · not granted". Every node carries its server label, so the crossing is visible at the point it happens.
- Each payments field appears as a new node with its own checkbox.
- The primary action changes the granting server only: Change CRM Only. Payments keeps the old address, and the card says so.
- Approve Selected covers the CRM email plus only the checked payments fields. Unchecked fields are left for the person.
- Nothing cross-server is remembered. The CRM grant stays narrow, nothing is recorded for payments, and the next run asks again.

## Behavior

- **The agent waits at every gate.** Nothing runs while a card is open. The status reads "paused". There are no timeouts and no countdowns.
- **Escape is the safe choice.** Focus lands on the primary (narrowest) action; Enter takes it. Escape takes the safe choice: Deny, Keep Current Grant, Don't Refund, Skip for Now, Change CRM Only. No shortcut broadens scope or confirms a destructive action.
- **Destructive actions have a deliberate beat.** Confirm goes live after a short pause and needs a review checkbox. An early click explains what's missing; the button is never disabled. Repeat clicks are ignored for a second, so a double click can't commit twice.
- **Stop always works.** One click, no modal, confirmed in place: "Agent stopped. Nothing else will run."
- **Failures come back at human tempo.** The agent retries once on its own. If the retry fails, the person decides: Skip for Now or Try Refund Again.

## What this asks of hosts

The spec is explicit that hosts own the safety boundary. What's missing is shared UX vocabulary for how to own it. This pattern is host-agnostic: risk tiers, a schema-driven card, a causal trace, and a budget the person can see and revoke. It composes with a host's product rather than competing with it. Treat it as a starting point for a conversation about consent UX, not a finished standard.

A reference implementation accompanies this piece: a framework-agnostic consent state machine, React bindings with the design-system components, and a demo that runs five scenarios against mock MCP servers with real-shaped schemas. Every value comes from one token contract, and 104 browser checks cover the behavior with motion on and with reduced motion.

Live demo: https://mcp-consent-moment.vercel.app
