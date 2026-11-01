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
| Scope creep | Keep Current Grant | Approve Selected · 0 of 2 |
| Multi-hop | Change CRM Only | Approve Selected · 0 of 2 |
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
- Mapping: reads → 2 · write → 1, 2, 3 · scope creep → 4 · destructive → 2, 3, 5 · tool error → 5 · completion → 4 · landing none. The last gate's theses stay lit between gates.

## The four paths (locked)
Shared spine: Reads → Ticket (write) → Refund (destructive) → Ticket update → Complete.
| Path | Decision | Ticket update step | Outcome / left for you |
|---|---|---|---|
| Happy path | grant everything | scope creep: approve 2 of 2 | nothing left |
| Partial completion | Don't Refund | agent notes refund not issued | refund |
| Scope creep | Keep Current Grant | fallback writes 3 granted fields | assignee, labels |
| Tool error | refund fails twice → Skip for Now / Try Refund Again | — | refund pending |

## Fifth path: multi-hop (locked Nov 1)
CRM email change → payments billing_contact → card_on_file.notify_to.
- 2px terracotta frame. SCOPE CREEP chip + link icon + crm.contacts.update.
- "Changing this email also changes 2 things on payments, a server you haven't granted."
- YOUR CURRENT GRANT trace: forest node "crm · contact.email" with old → new value.
- Every trace node shows its server label (mono, slate) above the field.
- Hop connector: dashed terracotta line across the trace + "crosses to payments · not granted" (oxblood mono). Only where the trace changes server; same-server steps just continue the line.
- "+ billing_contact" (salmon half-fill, "Follows the CRM email automatically") and "+ card_on_file.notify_to" (salmon half-fill, "Card receipts and fraud alerts go to the new address"), each unchecked. Not film red — the change is reversible.
- "Not remembered. Cross-server changes ask every time."
- Actions: Change CRM Only (primary) · Approve Selected · 0 of 2. Consequence: "Change CRM Only: payments keeps the old address until someone updates it."

## Icon placement (all screens)
- Section labels: AGENT TASK = bot · ACTIVITY / WHAT HAPPENED / WHAT YOU DECIDED / YOUR CURRENT GRANT = recently-viewed · WHAT YOU'VE AUTHORIZED / CONSENT RECEIPT = security · WHAT GETS SENT = purchase.
- Card header: tier chip + record-type icon + tool name.
- Buttons: label left, Carbon icon right — arrow-right = commit, view = review, close = deny, renew = retry, checkmark = approve selected, download = export.
- Sidebar rows: status icon + record-type icon + tier tag + tool.

## Rules
- Primary sits on the left on every card; secondary follows it.
- Narrow-by-default = the primary action is the smallest scope that still does the task. For destructive actions, the smallest scope is doing nothing.
- Card frame escalates with tier: read = gray hairline · write = 1.5px slate · scope creep = 2px terracotta · alert = 2px film red · destructive = film-red header panel · receipt = navy header panel.
- Payload treatment: create → draft preview · update / scope change → causal trace · destructive → hero value · failure → timeline · completion → causal trace as record.
- Remember options always unchecked and name exactly what they remember. Destructive and cross-server changes are never remembered.
- Every non-obvious choice states its consequence underneath.
- Authorized list shows grants only after they happen. A grant from a prior session shows from landing, labeled "granted earlier"; revoking it there holds for the next run.

## Landing (locked)
- Status: "idle → choose a scenario to run the consent flow".
- Stop Agent stays active; clicking with nothing running shows "No agent running." inline.
- "Agents move fast. People decide slowly." + "The card gets heavier and warmer as the stakes go up."
- Tier legend (cool → hot) with mini card-frame samples + chips. Footer: "Revoke any permission at any time. The agent asks again next time."
- Content shares the Agent Task card's left edge and width, top-aligned.
- CHOOSE A SCENARIO: 2×2, secondary Run buttons — Happy path · Partial completion · Scope creep · Tool error.

## Write card — issues.create
- 1.5px slate frame. WRITE chip + receipt icon. "Create a new high-priority ticket for PAY-503."
- Draft preview: white, 1.5px dashed slate; on approve dashed → solid, real ID. The card stays up until the next gate, without actions, so the ID comes from the tool's result.
- Remember (unchecked): "Don't ask again for new tickets on issue-tracker". Actions: Create This Ticket · Deny.

## Scope-creep card — issues.update
- 2px terracotta frame. "issue-tracker wants to write 2 fields it didn't have before."
- YOUR CURRENT GRANT trace (forest) → dashed terracotta → "+ assignee" (salmon half-fill, "Moves ownership to another team"), "+ labels" (open navy, "Tags only"), each unchecked.
- Actions: Keep Current Grant · Approve Selected · 0 of 2. Clicking Approve Selected with nothing checked shows "Check at least one field first." inline.
- Remember (unchecked) names the checked fields: "Remember assignee and labels for issue-tracker". Left unchecked, approval covers this update only and the grant stays as it was.
- Consequence: "Keep Current Grant: the ticket updates with the 3 granted fields." Keep falls back in every scenario.
- Approval covers only the checked fields: the call and the recorded grant both narrow to them. Unchecked fields are named as left for you.

## Destructive refund card — payments.refund
- Film-red header panel. "$149.00" hero; "to customer cust-7291 · can't be undone".
- WHAT GETS SENT rows, in full. Review checkbox "I've checked the amount and the customer." · "Not remembered. Every refund asks again."
- Confirm requires the review checkbox. Clicking early shows "Check the amount first." inline; the button is never disabled.
- Don't Refund falls back in every scenario: the agent notes it on the ticket and ends on "2 of 3 done."
- Actions: Don't Refund · Confirm $149.00 Refund.

## Tool error card
- 2px film-red frame, ALERT chip. "The $149.00 refund failed twice." / "No money moved…" Timeline (brown).
- Actions: Skip for Now · Try Refund Again.

## Completion — consent receipt
- Navy header: CONSENT RECEIPT + timestamp; headline + outcome line.
- Headline is the honest outcome. "Task complete." when every task step happened, naming any leftover fields ("Assignee and labels left for you."). "N of 3 done." only when a task step didn't happen.
- Leftover rows that aren't alerts are slate. Film red stays for what needs a person to act
- WHAT YOU DECIDED trace as record. LEFT FOR YOU checklist. Actions: Run Another Scenario · Export Receipt.

## Sidebar tag colors
READ = navy outline · WRITE = slate fill · CREEP = terracotta outline, oxblood text · DEST = film red. Waiting at a gate = film-red pause, "waiting" · passed = forest check · declined = slate close · stopped = slate · running = teal · needs you = film-red warning · timestamps = brown.
