# Rebuild directive — MCP Consent Moment redesign

Decision (Nov 1, 2026): code first. Claude Code rebuilds the demo from docs/design/. Figma comes last, generated from code via Figma MCP, only when it's needed for collaboration.

## Read first
1. CLAUDE.md
2. docs/design/tokens.json, theme-decisions.md, screen-decisions.md, behavior-and-motion.md
3. The existing code: packages/consent-core, packages/consent-react, demo/

## Constraints
- Do not change consent-core's state machine logic unless a phase below requires it. Say so before you do.
- Every color, border width, font and duration comes from tokens.json. No raw values in components.
- Work one phase at a time. At the end of each phase: run the demo, take screenshots, stop, and wait for approval. No wholesale UI changes without review.
- Commit to main and push after each approved phase. The live demo updates as phases land.

## Phase 1 — Tokens
- Generate CSS custom properties from tokens.json (a small script is fine; no new heavy dependencies).
- Load IBM Plex Sans, IBM Plex Mono and Tektur.
- Replace existing hardcoded styles with the token variables. Layout unchanged.
- Show: the landing screen and one consent card, before and after.

## Phase 2 — Components
Build or restyle in consent-react, per theme-decisions.md "Components":
button, tier chip, trace node (incl. server label), hop connector, approval checkbox, agent light + status line, causal trace, consent card frame (read / write / scope creep / alert / destructive / receipt), alert, consent receipt.
- Show: a single page that renders every component in every state.

## Phase 3 — Screens
One screen at a time, in this order, per screen-decisions.md:
top bar + thesis strip → landing → write card → scope-creep card → destructive refund → tool error → completion receipt.
- Show each screen before moving to the next.

## Hero shot (right after Phase 3)
- Large-type crop of the destructive refund card at hero size: "$149.00" hero value, film-red header panel, Don't Refund / Confirm buttons.
- Export a 2x PNG for the portfolio. Show it for approval before Phase 4.

## Phase 4 — Multi-hop path
- Add the fifth scenario (crm email → payments billing_contact → card_on_file.notify_to). Add the crm/payments mock servers or fields if they don't exist.
- Landing: show five scenarios; propose the layout, don't decide it.

## Phase 5 — Behavior and motion
Per behavior-and-motion.md: focus and keyboard rules, deliberate beat, double-commit guard, agent light states, card scan line, trace draw, reduced motion.

## Phase 6 — Release (replaces the old version completely)
- Remove any leftover old styles, components and assets. Nothing from the old visual design ships.
- Rewrite README.md from scratch with the new story: the five theses, the tier system, the causal trace, the token contract (docs/design/), and how it was built (designed system + token contract + human review gates, not a single autonomous session).
- Update docs/a-consent-pattern-for-mcp.md to match the new design and the multi-hop path.
- Show the new README for approval, then commit and push.

## Done when
All five scenarios run end to end, every value traces to tokens.json, and reduced motion works.
