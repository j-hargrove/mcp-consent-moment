# Rebuild directive — MCP Consent Moment redesign

Decision (Nov 1, 2026): code first for speed; Figma system generated from code after Phase 3 (see Phase 3.5), then multi-hop goes Figma → code.

## Read first
1. CLAUDE.md
2. docs/design/tokens.json, theme-decisions.md, screen-decisions.md, behavior-and-motion.md
3. The existing code: packages/consent-core, packages/consent-react, demo/

## Constraints
- Do not change consent-core's state machine logic unless a phase below requires it. Say so before you do.
- Every color, border width, font and duration comes from tokens.json. No raw values in components.
- Self-check each screen against docs/design/, fix violations, commit, and report one line per change. Stop only for a decision the docs don't answer, the hero shot, and the end of each phase. Log catches in docs/design/review-log.md.
- Never write to ~/Desktop. Self-check screenshots stay in temp.
- Commit to main and push after each approved phase. The live demo updates as phases land.

## Phase 1 — Tokens
- Generate CSS custom properties from tokens.json (a small script is fine; no new heavy dependencies).
- Load IBM Plex Sans, IBM Plex Mono and Tektur.
- Replace existing hardcoded styles with the token variables. Layout unchanged.
- Show: the landing screen and one consent card, before and after.

## Phase 2 — Components
Build or restyle in consent-react, per theme-decisions.md "Components":
button, tier chip, trace node (incl. server label), hop connector, approval checkbox, agent light + status line, causal trace, consent card frame (read / write / scope creep / alert / destructive / receipt), alert, consent receipt.
- Icons: install @carbon/icons-react. Use the core set from theme-decisions.md (bot, email, link, purchase, receipt, maximize, view, security, recently-viewed, stop-sign, arrow-right, close, checkmark, warning-alt, renew, download). Place them per screen-decisions.md "Icon placement": button icons right of the label, section-label icons, card header record-type icons, sidebar status + record-type icons. Icon colors per theme-decisions.md (ink/slate default; teal agent; film red alerts + Stop Agent; forest approved; brown time). Replace the existing glyphs (✓ ✕ ↻ ⬡ ⚠ →). Icon motion waits for Phase 5.
- Show: a single page that renders every component in every state, including every icon in its assigned color.

## Phase 3 — Screens
One screen at a time, in this order, per screen-decisions.md:
top bar + thesis strip → landing → write card → scope-creep card → destructive refund → tool error → completion receipt.
- Show each screen before moving to the next.

## Hero shot (right after Phase 3)
- Large-type crop of the destructive refund card at hero size: "$149.00" hero value, film-red header panel, Don't Refund / Confirm buttons.
- Export a 2x PNG for the portfolio. Show it for approval before Phase 4.

## Phase 3.5 — Figma system (after the hero shot, before Phase 4)
Decision (Nov 1): Figma moves up. PMs and hiring managers expect a Figma file; code stays the speed path.
- Use the Figma MCP code-to-canvas skills (/figma-generate-library, /figma-generate-design) to bring tokens.json in as Figma variables and the consent-react components in as components.
- Bring in the six screens as frames built from those components.
- Jon cleans up by hand: auto layout, variant naming, component properties. Claude Code doesn't need to perfect this part.
- Stop when the library and screens are in Figma; report what didn't come through cleanly.

## Phase 4 — Multi-hop path
Designed in Figma first (the locked card in screen-decisions.md), then built in code from the Figma frames via Figma MCP — one feature that shows the Figma → code direction.
- Add the fifth scenario (crm email → payments billing_contact → card_on_file.notify_to). Add the crm/payments mock servers or fields if they don't exist.
- Landing: show five scenarios; propose the layout, don't decide it.

## Phase 5 — Behavior and motion
Per behavior-and-motion.md: animated icons (play once, ≤450ms, never loop), focus and keyboard rules, deliberate beat, double-commit guard, agent light states, card scan line, trace draw, reduced motion.

## Phase 6 — Release (replaces the old version completely)
- Remove any leftover old styles, components and assets. Nothing from the old visual design ships.
- Rewrite README.md from scratch with the new story: the five theses, the tier system, the causal trace, the token contract (docs/design/), and how it was built (designed system + token contract + human review gates, not a single autonomous session).
- Update docs/a-consent-pattern-for-mcp.md to match the new design and the multi-hop path.
- Show the new README for approval, then commit and push.

## Done when
All five scenarios run end to end, every value traces to tokens.json, and reduced motion works.
