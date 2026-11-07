# MCP Consent Moment — Screen decisions

## Copy casing (locked)
- Buttons: Title Case. Short articles, conjunctions and prepositions (a, an, the, and, for, of, to, on) stay lowercase unless first.
- Decision sentences, body copy, consequences, intro lines: sentence case.
- Tier chips and section labels: uppercase mono.
- Status line: lowercase mono (agent voice).

### Button inventory
| Screen | Primary | Secondary / other |
|---|---|---|
| Write | Create This Ticket | Deny |
| Revoked write | Update This Ticket | Deny |
| Scope creep | Keep Current Grant | Approve Selected · 0 of 2 |
| Multi-hop | Change CRM Only | Approve Selected · 0 of 2 |
| Revoked CRM write | Change This Email | Deny |
| Destructive refund | Don't Refund | Confirm $149.00 Refund |
| Tool error | Skip for Now | Try Refund Again |
| Completion | Run Another Scenario | Export Receipt |
| Landing scenario cards | — | Run |
| Top bar (all) | Stop Agent | — |
| Review variant (scope/refund) | — | Review Linked Changes · Review Payment Change |

## Layout (locked)
- Top bar: Tektur "CONSENT MOMENT" (rust) + teal agent light + status line in teal mono (plain language, no thesis numbers) + "Stop Agent" (film red, stop-sign icon) right-aligned on every screen. On completion it reads "Agent stopped" in slate.
- Thesis strip directly under the top bar.
- Agent task card, full width of the main column (bot icon on label). The main column caps at 1200px, left-aligned.
- Consent card 640px wide, horizontally centered, top-aligned 32px under the Agent Task card, with a one-line intro above it. Decision sentence 22px Plex Sans 600.
- Right sidebar: ACTIVITY (status icon + record-type icon + tier tag + tool) and WHAT YOU'VE AUTHORIZED (security icon, revoke). Brown only for timestamps.
No full-width decision banner.

## Thesis strip (locked)
- One line, ~18px tall, under the top bar. Five equal cells, 10px IBM Plex Mono.
- Labels (Jon's original theses, short form): 1 · Defer the grant · 2 · Tier by risk · 3 · Schema is the payload · 4 · Consent is a budget · 5 · Match the tempo.
- Full theses: (1) Defer the grant to first meaningful use, not connection. (2) Tier by risk, not by tool. (3) The tool schema is the consent payload. (4) Consent is a budget, not a switch. (5) The system matches the human to the right tempo.
- Color ramp (cool → hot), 2px top rule on every cell: navy · slate · brown · terracotta · film red.
- Inactive: slate text, regular. Active: text in thesis color, weight 600, "● " prefix. No fills.
- Active thesis 4 text uses rust (terracotta text fails AA at 10px). Rule stays terracotta.
- Mapping: reads → 2 · write → 1, 2, 3 · scope creep (incl. multi-hop) → 4 · destructive → 2, 3, 5 · tool error → 5 · completion → 4 · landing none. The last gate's theses stay lit between gates.

## The four paths (locked)
Shared spine: Reads → Ticket (write) → Refund (destructive) → Ticket update → Complete.
| Path | Decision | Ticket update step | Outcome / left for you |
|---|---|---|---|
| Happy path | grant everything | scope creep: approve 2 of 2 | nothing left |
| Partial completion | Don't Refund | agent notes refund not issued | refund |
| Scope creep | Keep Current Grant | fallback writes 3 granted fields | assignee, labels |
| Tool error | refund fails twice → Skip for Now / Try Refund Again | Skip: agent notes it inside the grant, no scope-creep card. Try Refund Again: same as happy path | refund pending, ending on "2 of 3 done." |

## Fifth path: multi-hop (locked Nov 1; built from Figma Nov 5)
CRM email change → payments billing_contact → card_on_file.notify_to. Figma's "multi-hop" frame is the source for this card.
- Task: "Update a customer's email address in the CRM." Status: "wants to change a contact email". Intro: "The agent wants to change a customer's email address."
- Run: crm.contacts.read (READ, silent) → crm.contacts.update. The CRM email was granted earlier (seeded at landing next to issues.update); payments never was.
- 2px terracotta frame. SCOPE CREEP chip + link icon + crm.contacts.update, "via crm".
- "Changing this email also changes 2 things on payments, a server you haven't granted."
- YOUR CURRENT GRANT trace: forest node "crm · contact.email" with old → new value (dana.reyes@northwind.example → dana@reyesdesign.example).
- Every trace node shows its server label (mono, slate) above the field.
- The crm step keeps its solid forest line (trace/granted, border-width/trace) down to the hop rule.
- Hop connector: dashed terracotta rule + "crosses to payments · not granted" (oxblood mono), inset inline-s from the trace line; the rule spans the label. Only where the trace changes server; same-server steps just continue the line.
- "+ billing_contact" (salmon half-fill, "Follows the CRM email automatically") and "+ card_on_file.notify_to" (salmon half-fill, "Card receipts and fraud alerts go to the new address"), each with old → new and unchecked. Dashed terracotta between them. Not film red — the change is reversible.
- "Not remembered. Cross-server changes ask every time." No remember checkbox: the absence is the message.
- Actions: Change CRM Only (primary) · Approve Selected · N of 2. Consequence: "Change CRM Only: payments keeps the old address until someone updates it." Approve Selected with nothing checked shows "Check at least one field first." inline.
- Change CRM Only: only the CRM email changes, inside the existing grant (fallback row). Payments is left for the human: "Task complete. Billing contact and card notifications left for you." LEFT FOR YOU rows "payments · billing_contact", "payments · card_on_file.notify_to" (plain boxes).
- Approve Selected narrows to the checked fields: the CRM email plus those payments fields only. Unchecked fields are left for you, named in the headline ("Task complete. Billing contact left for you." / "Task complete. Card notifications left for you."); all checked reads "Task complete. Email changed on the CRM and payments."
- Never remembered: the CRM grant stays narrow and nothing is recorded for payments, so the next run asks again.
- Revoked CRM grant: the agent re-asks for the CRM email only (write card, email icon, "Change the email on contact ct-4821.", Change This Email · Deny). Payments is left for you; a revoke never leads to a cross-server ask. Deny ends on "0 of 1 done. Email change left for you."

## Icon placement (all screens)
- Section labels: AGENT TASK = bot · ACTIVITY / WHAT HAPPENED / WHAT YOU DECIDED / YOUR CURRENT GRANT = recently-viewed · WHAT YOU'VE AUTHORIZED / CONSENT RECEIPT = security · WHAT GETS SENT = purchase.
- Card header: tier chip + record-type icon + tool name.
- Buttons: label left, Carbon icon right — arrow-right = commit, view = review, close = deny, renew = retry, checkmark = approve selected, download = export.
- Sidebar rows: status icon + record-type icon + tier tag + tool.

## Rules
- Primary sits on the left on every card; secondary follows it. The two actions split the row 50/50; label left, icon at the right edge.
- Narrow-by-default = the primary action is the smallest scope that still does the task. For destructive actions, the smallest scope is doing nothing.
- Card frame escalates with tier: read = gray hairline · write = 1.5px slate · scope creep = 2px terracotta · alert = 2px film red · destructive = film-red header panel · receipt = navy header panel.
- Payload treatment: create → draft preview · update / scope change → causal trace · destructive → hero value · failure → timeline · completion → causal trace as record.
- Remember options always unchecked and name exactly what they remember. Destructive and cross-server changes are never remembered.
- Every non-obvious choice states its consequence underneath.
- Authorized list shows grants only after they happen. A grant from a prior session shows from landing, labeled "granted earlier"; revoking it there holds for the next run. Two are seeded: issues.update (issue-tracker) and crm.contacts.update (crm).

## Landing (locked)
- Status: "idle → choose a scenario to run the consent flow".
- Stop Agent stays active; clicking with nothing running shows "No agent running." inline.
- "Agents move fast. People decide slowly." + "The card gets heavier and warmer as the stakes go up."
- Tier legend (cool → hot) with mini card-frame samples + chips. Footer: "Revoke any permission at any time. The agent asks again next time."
- Content shares the Agent Task card's left edge and width, top-aligned.
- CHOOSE A SCENARIO (Option A, locked Nov 5): the four shared-spine scenarios 2×2 — Happy path · Partial completion · Scope creep · Tool error — then Multi-hop full width below. Secondary Run buttons. Gaps stack-sm / inline-sm.
- Multi-hop card: "Change a CRM email that payments also uses. The change crosses to a server you haven't granted."

## Write card — issues.create
- 1.5px slate frame. WRITE chip + receipt icon. "Create a new high-priority ticket for PAY-503."
- Draft preview: white, 1.5px dashed slate; on approve dashed → solid, real ID. The card stays up until the next gate, without actions, so the ID comes from the tool's result.
- Remember (unchecked): "Don't ask again for new tickets on issue-tracker". Actions: Create This Ticket · Deny.

## Revoked write — issues.update
- Revoke holds, so the next use asks again. The agent asks for the narrow scope only: a revoke never leads to a broader grant.
- 1.5px slate frame. WRITE chip + receipt icon. "Update ticket ISS-1847." WHAT GETS WRITTEN as a causal trace of open nodes: nothing is granted yet.
- Remember (unchecked): "Don't ask again for ticket updates on issue-tracker". Consequence: "Deny: nothing is written to the ticket."
- Approving leaves assignee and labels for the human. Deny leaves the ticket update for the human.

## Scope-creep card — issues.update
- 2px terracotta frame. "issue-tracker wants to write 2 fields it didn't have before."
- YOUR CURRENT GRANT trace (forest) → dashed terracotta → "+ assignee" (salmon half-fill, "Moves ownership to another team"), "+ labels" (open navy, "Tags only"), each unchecked.
- Actions: Keep Current Grant · Approve Selected · 0 of 2. Clicking Approve Selected with nothing checked shows "Check at least one field first." inline.
- Remember (unchecked) names the checked fields: "Remember assignee and labels for issue-tracker". With none checked it reads "Remember for issue-tracker". Left unchecked, approval covers this update only and the grant stays as it was.
- Consequence: "Keep Current Grant: the ticket updates with the 3 granted fields." Keep falls back in every scenario.
- Approval covers only the checked fields: the call and the recorded grant both narrow to them. Unchecked fields are named as left for you.

## Destructive refund card — payments.refund
- Film-red header panel, no visible chip: the panel and "can't be undone" carry the tier, with "Destructive" as visually hidden text. "$149.00" hero; "to customer cust-7291 · can't be undone".
- WHAT GETS SENT rows, in full.
- BEFORE YOU CONFIRM section label (uppercase mono like WHAT GETS SENT, slate checkmark icon), then the review checkbox "I've checked the amount and the customer." at decision weight in ink. The whole row is the click target and carries the focus ring (border-width.focus). 2px film-red box border while off. It is required, so it looks different from the optional remember and select checkboxes.
- "Not remembered. Every refund asks again." sits directly under the action buttons in slate: it's about the decision as a whole, not the review box.
- Confirm requires the review checkbox. Clicking early shows "Check the amount first." inline; the button is never disabled.
- Don't Refund falls back in every scenario: the agent notes it on the ticket and ends on "2 of 3 done."
- Actions: Don't Refund · Confirm $149.00 Refund.

## Tool error card
- 2px film-red frame, ALERT chip. "The $149.00 refund failed twice." / "No money moved…" Timeline (brown).
- Actions: Skip for Now · Try Refund Again. Consequence: "Skip for Now: the refund stays with you to finish."
- The card replaces the sidebar prompt. Timeline rows carry brown timestamps under WHAT HAPPENED.

## Completion — consent receipt
- Navy header: CONSENT RECEIPT + timestamp; headline + outcome line.
- Headline is the honest outcome. "Task complete." when every task step happened, naming any leftover fields ("Assignee and labels left for you."). "N of 3 done." only when a task step didn't happen.
- Leftover rows that aren't alerts are slate. Film red stays for what needs a person to act
- WHAT YOU DECIDED trace as record. LEFT FOR YOU checklist: film-red review box if a person must act, plain box for leftover fields. Rows name the item only; the section label already says it's left for you. Actions: Run Another Scenario · Export Receipt (JSON).
- A stopped run uses the same receipt: "Agent stopped." with what was decided before it stopped.

## Sidebar tag colors
Tool names wrap to a second line (breaking after a dot), never truncate. READ = navy outline · WRITE = slate fill · CREEP = terracotta outline, oxblood text · DEST = film red. Waiting at a gate takes the tier color (write slate, scope creep terracotta with oxblood label for contrast, destructive film red) with a pause icon, and the icon and label pulse while the gate is open · passed = forest check · declined = slate close · stopped = slate · running = teal · needs you = film-red warning · timestamps = brown.

## Case-study artifacts
All in docs/case-study/, committed and pushed.
| File | What it shows | Status |
|---|---|---|
| hero-refund-2x.png | Destructive refund card at hero size | Committed |
| multihop-figma-2x.png · multihop-code-2x.png · multihop-figma-vs-code.png | Multi-hop card, Figma next to code (shot 4) | Committed |
| figma-1-variables.png | Figma variable collections from tokens.json | Committed |
| figma-2-button-properties.png | Button component properties | Committed |
| figma-3-auto-layout.png | Auto layout on the consent card frame | Committed |

## Approved (Nov 6, 2026)
Final approval round. These were open after Phase 6.
- Multi-hop receipt headlines name the leftover fields: "Task complete. Billing contact and card notifications left for you." · "Task complete. Billing contact left for you." · "Task complete. Card notifications left for you." Kept: "Task complete. Email changed on the CRM and payments." and "0 of 1 done. Email change left for you." Rows stay "payments · <field>".
- Revoked-CRM card copy as built: "Change the email on contact ct-4821.", Change This Email · Deny.
- Multi-hop fallback row: the badge wraps under the tool name, so the name stays whole.
- Line-height and tracking tokens locked at their current values.
