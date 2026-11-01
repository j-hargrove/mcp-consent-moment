# MCP Consent Moment — Behavior and motion

Feel: deliberate, quiet, a little eerie (2001). Machine motion is cool teal and calm. Human weight is red and still.
Inversion of HAL: HAL's light was red and belonged to the machine. Here the machine's light is teal; red belongs to the human decision. (Original design — no lens, no red eye, no HAL likeness.)

## Behavioral rules
1. The agent waits at every gate. Nothing runs while a consent card is open; status shows "paused". No timeouts, no countdowns.
2. Narrow is the default. Focus lands on the narrow (primary) action. Enter = primary. Escape = the safe choice (Deny / Keep current grant / Don't refund).
3. No shortcut to broader scope. "Approve selected", "Confirm refund", "Try again" require a click — no keyboard shortcut expands scope or confirms a destructive action.
4. Deliberate beat on destructive. Confirm becomes active ~600ms after the card appears and requires the review checkbox. Early click shows inline "Check the amount first" (no disabled buttons).
5. Labels state exact scope. "Approve selected · N of 2" updates live. Buttons never claim more than they do.
6. Grants appear after the decision, never before. Authorized list and activity update only after the human acts. Revoke is immediate; next use re-asks.
7. Stop always works. One click, no modal. Confirms in place: "Agent stopped. Nothing else will run."
8. No double commits. Destructive buttons ignore repeat clicks for 1s.

## Motion tokens
| Token | Value | Use |
|---|---|---|
| motion.duration.fast | 120ms | hover, checkbox, chip, icon press |
| motion.duration.base | 200ms | card enter (opacity), thesis strip change |
| motion.duration.slow | 400ms | trace draw, dashed → solid, scan line (~450ms) |
| motion.duration.deliberate | 600ms | destructive beat before confirm is live |
| motion.duration.breathe | 3200ms | agent light, working |
| motion.duration.speak | 900ms | agent light, speaking |
| motion.type.charDelay | 22ms | status line types on |
| motion.easing.standard | cubic-bezier(0.2, 0, 0, 1) | everything |
Reduced motion: all transitions become instant crossfades; no drawing, no typing, no icon motion, agent light static.

## Agent presence (the light)
A small teal light in the top bar, left of the status line. Original form: solid core + thin ring, no lens styling, no blur/glow.
- Working: breathes slowly (3.2s) — core scales 0.7→1, ring expands and fades.
- Speaking: quickens (0.9s) while the status line types itself in IBM Plex Mono, character by character.
- Waiting for you: goes completely still (core solid, ring at low opacity). The agent holds its breath while the human decides.
- Stopped: slate gray, static. No farewell motion.
The only looping animation in the product.

## Signature moments
- Card resolves like a display: 200ms opacity in + a 1px teal scan line sweeps top → bottom (~450ms).
- Causal trace draws itself: forest (granted) line draws first, nodes pop in sequence (~100ms stagger), dashed terracotta "grant ends here" segment draws last; new-field nodes arrive last.
- Draft becomes real: on approve, dashed slate border → solid (400ms), "ISS-new" → real ID.
- Destructive / alert panels do NOT animate in: hard cut, then the deliberate beat. Stillness = weight. Alerts never shake or flash.
- Thesis strip: active theses crossfade to their color on each step (200ms), so the ramp travels through the flow.
- Receipt replays: causal trace rows stagger in quickly (~40ms each).

## Animated icons — only to illustrate an action
Rule: an icon moves only if the motion explains what the action does. Plays once (hover, press, or triggering event), ≤450ms, never loops.
| Icon | Action | Motion |
|---|---|---|
| arrow-right | commit / continue | nudges forward 4px |
| view | review | blinks once (scaleY) |
| close | cancel / deny | tightens (scale 0.8) |
| renew | retry | one full turn |
| checkmark | approve selected | stroke draws itself |
| download | export receipt | arrow drops into tray |
| maximize | scope expanded (event) | arrows push outward once — plays on detection, no hover needed |
| stop-sign | stop agent | never moves |
Status icons in the sidebar and record-type icons do not animate.
