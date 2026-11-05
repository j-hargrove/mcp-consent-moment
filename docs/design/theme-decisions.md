# MCP Consent Moment — Theme decisions

## Principles (locked Nov 1)
1. Decision first — the choice is the largest thing on screen.
2. Disclose before, not after — side effects visible at the moment of choice.
3. Narrow by default — primary action approves the smallest scope.
4. Risk changes structure, not just color — grayscale-safe.
5. Every color has one job — no decorative color in working UI; bold color only in the brand frame.

## Palette: Space Odyssey
Reference: 2001: A Space Odyssey color palette (10-swatch strip). Source values sampled directly from the reference image.
Rule: use source values exactly. Deviate only to fix a contrast failure. All ten colors are used, each with one job.
Coordination idea: a cool, sterile slate field; deep film red appears only as the shock at the human decision. Two dark anchors (oxblood, navy), warm lights in the middle.
Color roles: teal = the machine is speaking · film red = destructive + alerts (needs a human now) · forest = decision made · brown = time/history · rust = brand.

### Tier temperature (locked): cool → hot as stakes rise
| Tier | Tag | Card frame |
|---|---|---|
| READ | navy 1px outline, navy text | gray hairline |
| WRITE | slate fill, surface text (7.2:1) | 1.5px slate |
| SCOPE CREEP | 2px terracotta outline, oxblood text on surface (16.4:1) | 2px terracotta |
| DESTRUCTIVE | film-red fill, surface text (11.8:1) | film-red header panel |
Reason: write / scope creep / destructive were all warm reds and blurred together. Write moved to slate; scope-creep chip moved to outline (salmon-fill chip at 4.7:1 read muddy).

### Source swatches (left → right)
| # | Swatch | Hex | Role |
|---|---|---|---|
| 1 | Oxblood | #370405 | High node, scope-creep chip text, ink on white-on-red buttons, DESTRUCTIVE chip on the landing legend's red sample |
| 2 | Film red | #74080A | Destructive tier + alerts needing human action: refund panel, alert frame, high trace, scope-expanded mark, Stop Agent |
| 3 | Rust | #7B230D | Brand frame: Tektur title, hero accents, case-study markers; active thesis 4 text. Not in working UI |
| 4 | Brown | #824828 | Time and history: timestamps, timelines; thesis 3 |
| 5 | Terracotta | #AF5B41 | Scope creep only: card frame, chip outline, dashed "grant ends here" trace line, new-field node outline |
| 6 | Salmon | #B97155 | Half-fill inside new-field nodes on the trace (shape only, never under text) |
| 7 | Teal | #016860 | Agent voice: agent light, agent name/status, mono status lines, running state |
| 8 | Slate | #3D546B | WRITE tier (tag fill, card frame, draft-preview dashed border); secondary text; passive notices |
| 9 | Forest | #0D4235 | Approved state only (light backgrounds only) |
| 10 | Navy | #08132C | Ink: text, primary buttons, READ outline, receipt header |

Alert rule: film red only for alerts that require a person to act. Passive system notices (connection lost, retrying) use slate text + icon.

### Derived neutrals (not in source; derived from slate)
| Role | Hex |
|---|---|
| Field (page; also secondary text on red/oxblood) | #E3E8EF |
| Surface (cards) | #F4F6F9 |
| Border | #C9D1DC |
| White (draft preview; text on film red / navy) | #FFFFFF |

### Texture (locked): none
All surfaces flat.

### Contrast check (WCAG)
- White on film red 11.8 · field on film red 9.6 · field on oxblood 14.4
- Slate on surface 7.2 · surface on slate 7.2 · slate on field 6.4 · navy on field 15.0 · white on navy 18.4
- Oxblood on surface 16.4 (scope-creep chip)
- Film red text on surface 10.9 · border on navy 12.0
- Teal text on surface 6.2 · teal on field 5.4 · teal on white 6.7
- Rust on surface 9.3 · rust on field 8.2 · brown on surface 6.7 · brown on field 5.9
- UI (3:1): terracotta on surface 4.4 · salmon on surface 3.5 · forest on surface 10.5 · white on forest 11.4
- Avoid: text on salmon and text on terracotta — use outlines instead.
- Watch: teal vs forest only 1.7:1 — teal for agent text/icons (strokes), forest for filled shapes. Never same form.
- Watch: rust vs film red are close — rust stays in the brand frame, never next to an alert.
- Forest only on light backgrounds (forest on navy fails).

## Typography (locked)
- IBM Plex Sans — decision sentence (600) and all UI. Tabular figures on.
- IBM Plex Mono — the agent's voice: scope traces, record diffs, timestamps, thesis strip.
- Tektur — brand frame / hero title only (700, wide tracking, rust). Never in working UI.
- Rule: machine speaks mono, human decides in sans.
- Buttons in Title Case (see screen-decisions.md).

## Icons: IBM Carbon (locked)
- Ink or slate by default. Exceptions: agent (teal); alert marks and Stop Agent (film red); approved-state marks (forest); time icon (brown).
- Core set: bot, email, link, purchase, receipt, maximize, view, security, recently-viewed, stop-sign, arrow-right, close, checkmark, warning-alt, pause, renew, download.
- Button icons name the action; animated only to illustrate the action (see behavior-and-motion.md).

## Signature pattern: Causal trace (locked)
- Nodes on one vertical trace showing causation / grant boundary.
- Granted / approved: forest filled nodes, solid forest line.
- Grant ends: line turns dashed terracotta.
- New field requested: terracotta-outlined node, salmon half-fill (higher consequence) or navy open node (low consequence).
- Destructive / high: film-red heavy line, solid oxblood node.
- Declined: navy outline node with strike.
- Crossing servers: the step before the hop keeps its forest line down to a dashed terracotta hop rule + oxblood mono label, inset inline-s from the trace line. Every node carries its server label.
- Reuse: completion receipt and audit trail ("WHAT YOU DECIDED").

## Components (draft, 12)
1. Agent header (rust Tektur title, teal agent light + status, Stop Agent) + thesis strip
2. Button — primary / secondary / ghost / override; on-surface and on-red. Label left + Carbon icon right. Title Case. Hover shifts the background over 120ms: primary navy → slate; secondary, ghost, override → field; border and text unchanged. The double outline is :focus-visible only.
3. Tier chip — READ / WRITE / SCOPE CREEP / DESTRUCTIVE / ALERT
4. Trace node — granted / new (half) / new (open) / high / declined
5. Approval checkbox — off / on (forest) / review-first (2px film-red border, no fill; checked matches on)
6. Agent status line (mono, teal) + agent light (working / speaking / waiting / stopped)
7. Scope row — folded into causal trace steps; each new-field step carries its own checkbox
8. Causal trace card
9. Consent card frame — read / write / scope creep / alert / destructive / receipt
10. Alert — film-red frame, warning-alt chip, action required
11. Consent receipt (navy header, field-color security icon, causal trace record, left-for-you checklist)
12. Consent screen layout (composite)

## Rules
- Source palette values are canonical (see tokens.json). Deviate only for a contrast failure, and document it here.
- No colors outside tokens.json. No improvised tints — any new color becomes a token first.
- One job per color.
- No text on salmon or terracotta fills — use outlines.
- No left-border severity bands.
- Gradients/ramps only in the brand frame (thesis strip) and hero. Working UI stays flat.
- No textures.
- Red is proportion-controlled: destructive tier and alerts requiring action only.
