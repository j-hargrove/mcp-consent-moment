# Review log

Things caught and fixed against docs/design/ during the rebuild, newest last. New entries go in the final table: what was wrong → principle → fix.

**Nov 5, 2026: Jon approved Phase 3, the hero shot and the final review.** Phase 3.5 (Figma system) starts.

| Screen | Caught | Rule | Fix |
|---|---|---|---|
| All | Buttons and scenario cards rendered in a system font | Typography: Plex Sans for all UI | Buttons inherit the font family |
| Sidebar | CREEP chip overflowed its column | Sidebar tag colors, legible chips | Tighter padding on the compact chip |
| All | Five Carbon icons rendered tiny | Icons: IBM Carbon | Kept each icon's own viewBox |
| Write card | Remember checkbox had no effect: `gate()` read it before the prompt opened | Thesis 4; "Remember options always unchecked" | Read it after the prompt resolves; default unchecked |
| Write card | Hardcoding the real ID would have faked the draft becoming real | Thesis 3; "real ID" on approve | `issues.create` runs after approval and the ID comes from its result |
| Write card | Next gate replaced the card before dashed → solid finished | Motion: draft becomes real, 400ms | 900ms agent hold after the ticket is filed |
| Write card | Card jumped when its controls hid | Principle 1 | Controls hide but keep their space |
| Scope creep | Keep Current Grant stopped the agent in most scenarios | Four paths: fallback writes 3 granted fields | Falls back in every scenario |
| Scope creep | "Approve Selected · 1 of 2" would have granted both fields | Behavior rule 5: buttons never claim more than they do | Call and grant narrow to the checked fields |
| Refund | Don't Refund stopped the agent in three scenarios | Four paths: agent notes refund not issued | Same fallback in every scenario |
| Refund | Review checkbox would have done nothing | Behavior rule 4 | Confirm requires it, with an inline nudge and no disabled button |
| Sidebar | Text glyphs and no record-type icon on activity rows | Layout: status icon + record-type icon + tier tag + tool; Icons: IBM Carbon | Rows use Carbon status and record icons with the tier chip |
| Tool error | Decision sat in the sidebar, below the choice's weight | Principle 1; 2px film-red frame | Full alert card in the main column with a brown timeline |
| Completion | Old end screens had no record of decisions | Receipt: causal trace as record | Agent records each decision and the receipt draws it |
| Stopped | Stopped view still used old glyphs and copy casing | Icons: IBM Carbon; Title Case buttons | Stopped runs use the receipt too |
| Sidebar | Fallback rows said "fallback" twice | Principle 5, no redundant marks | One label on the row |
| Refund | DESTRUCTIVE chip on the red panel repeated what the panel already says | Principle 4: risk changes structure, not just labels | Chip removed from the card and kept as visually hidden text; the panel and "can't be undone" carry the tier |
| Refund | Eye icon in the review checkbox made it read as a button, not a checkbox | Principle 4; standard controls | Standard box: 2px film-red border off, forest with white check on |
| Sidebar | Waiting rows were film red on every tier, spending the alert color on routine gates | Principle 5, one job per color; red is proportion-controlled | Waiting rows take the tier color; scope-creep label stays oxblood for AA |
| Scope creep | Remember read "Remember selected fields for issue-tracker" with nothing checked; checked fields listed in click order; consequence said the agent asks again | Remember options name exactly what they remember | "Remember for issue-tracker" until a field is checked, then the fields in card order; consequence per screen-decisions.md |
| Completion | Leftover rows that aren't alerts used ink text | Leftover rows are slate; film red only for what needs a person | Slate label on leftover rows; alert rows unchanged |
| Completion | Leftover rows said "left for you" under the LEFT FOR YOU label | Principle 5, no redundant marks | Rows name the item only |
| Revoke | Next use re-asked on the old pre-rebuild card, with "Allow" and "remember for this server" | Remember options name what they remember; Title Case buttons; no old visual design | New revoked-write card on the write frame; old card deleted |
| Revoke | The re-ask offered all 5 fields in one click, so revoking a 3-field grant could lead to a broader one | Thesis 4: scope never silently expands; principle 3, narrow by default | Agent re-asks for the 3 narrow fields only; assignee and labels are left for the human |
| Revoke | Denying the re-ask asked a second time, said "Kept the current grant" with no grant held, then wrote to the ticket anyway | Thesis 4: consent is a budget; a denied call must not run | Deny ends the update; nothing is written; "Ticket update" is left for the human |
| Refund | When the note was denied after Don't Refund, a row that needs no action showed as an alert | Red only for alerts that require a person | Note row is a slate leftover |
| Tool error | Skip still showed the scope-creep card, with status "resolved" and a "refund-issued" label for a refund that didn't happen | Thesis 3: the card shows what will be written; four paths table | Skip writes a note inside the grant with status open, no creep card, and ends on "2 of 3 done." |
| Tool error | Sidebar row needing a person showed the waiting pause icon | Sidebar: needs you = film-red warning | Separate needs-you state with warning-alt; pause stays for gates |
| Tool error | First failure flashed film red during an automatic retry | Alert rule: passive notices use slate; film red needs a person | First failure shows as retrying in teal; film red waits for the second failure |
| Sidebar | Retry badge cut the tool name to "payments.re…" | Sidebar rows: status + record type + tier + tool | Badge removed; the timeline carries the retry history |
| Directive | Pause was in the theme doc's core set but missing from the Phase 2 list | Icons: IBM Carbon core set | Added to rebuild-directive.md |
| Figma · Button | Label and arrow touched: space-between ignores the gap on a hugging frame | Buttons: label left, Carbon icon right, 12px gap | Packed left with the 12px gap |
| Figma · Button | Focus ring didn't render on outline buttons: Figma draws no spread shadow on a frame with no fill | Double outline is keyboard focus only, on every variant | Focus variants take the fill of the surface they sit on (surface or film-red panel); the ring is two bound shadows |
| Figma · Trace node | Declined strike leaned "/" and sat off center | Trace: declined = outline node with strike, matching code (rotate 45° = "\") | Strike re-centered at -45° |
| Figma · Write screen | Decision sentence was hidden on the write card | Principle 1: decision first, largest text in the body | Restored "Create a new high-priority ticket for PAY-503." |
| Figma · Landing | Legend's destructive sample needs the on-panel chip, which the refund card no longer carries | Landing tier legend: mini frames + chips; refund card has no visible chip | Hidden "legend only" chip on the destructive frame's panel row, shown only in the legend |
| Figma · All text | Plex Sans and Plex Mono layers render proportional figures; the docs call for tabular | Typography: tabular figures on | Not settable from the Plugin API (openTypeFeatures is read-only on text nodes and absent from text styles). Manual: on each page select all, then Type settings → Details → Numbers → Tabular. Set it on main components first so instances inherit, then on the screens' own text |
| Figma · Button | On-red variants sat on the bare canvas; the ghost was near invisible | Buttons on the destructive panel read on film red | Locked film-red backdrop frame (Tiers/destructive/panel) behind the two on-red rows |
| Figma · Variables | Parity check. Figma → tokens: all 104 variables matched on name, alias target, value and code syntax; Tiers 26 = read 3 · write 4 · scope creep 3 · destructive 9 · alert 3 · receipt 4, same as tokens.json; nothing to delete. Tokens → Figma: 66 tokens had no variable (space, size, radius, opacity, tracking, font family / weight / line height, easing) | Every value traces to tokens.json; Figma variables mirror the token contract | Added the 66 as variables (Space, Size, Radius, Opacity, Tracking, Typography, Motion easing). Final diff 170 ↔ 170, zero. tokens.json unchanged; tokens.css regenerated with no diff. Reference-only (no scope), because Figma can't bind them as written: tracking and space.inline (em), line heights (unitless), opacity (Figma reads a bound 0.4 as 0.4%), easing (no curve type, stored as its CSS string). Font family variables hold the first family only, without the CSS fallback |
| Figma · Layout values | Padding, gap, corner radius and fixed sizes were raw numbers | Every value traces to tokens.json | Bound only exact matches: 1,778 bindings (Components 1,173 · Screens 605): padding and gap → Space, corner radius → Radius, fixed width/height → Size. The checkbox consequence indent (26) binds to Size/26, the token the code uses for that margin. Instance sublayers that aren't overridden inherit from their main components, so no new overrides were created. Tracking, line height, opacity and easing stay reference-only |
| Figma · Layout values | No exact token, left raw (no rounding, no new tokens) | Report, don't invent | Screens: frames 1440 × 900. Top bar and thesis strip 1440; thesis cell 288. Activity row 268 (fallback 254). Draft preview and trace step default width 578; hop connector 320; task card 1088; scenario card 539. Trace line widths 2 and 4 and declined strike height 2 (these equal border-width.trace and trace-heavy, but those aren't sizes); half-fill rect width 4. Construction leftovers: decision text box 606 × 31, hidden note text 183, hidden empty state label 0, spacer height 1. On-red backdrop 652 × 106. Not in scope: trace line min-height 16 (space-16 in code), dash patterns, icon vector geometry |

## Token rename and consolidation (Nov 5, 2026)

Per Nathan Curtis, *Naming Tokens in Design Systems* and *Space in Design Systems*. Color unchanged. Old values snapped to the nearest step, ties up. Code and Figma use concept tokens only: padding = inset (or inset-squish), vertical gap = stack, horizontal gap = inline; one-sided padding takes its axis concept.

- Scale: space xxs 2 · xs 4 · s 8 · sm 12 · m 16 · l 24 · xl 32. Font size xs 10 · s 12 · m 14 · l 18 · decision 22 · hero 36 · thesis → xs. Radius s 4 · m 8 · circle. Size: icon 16, checkbox 18, card-width 640, column-max 1200, plus node 12, label-column 100, sidebar-width 300 (approved: no hug equivalent).
- inset-squish redefined (Jon): vertical one scale step below horizontal. s = 8/12, m = 12/16.
- Concept tokens added beyond the requested set, each because a use needed it: inset-xxs, inset-xs, inset-sm, inset-xl; inset-squish-xxs (2/4), inset-squish-xs (4/8); stack-xxs, stack-sm, stack-xl; inline-sm, inline-m, inline-l. inset-s and inset-l are kept as requested though unused.
- Dropped: space.inline (em), unused. 1px uses (visually hidden box, pressed-button nudge) → border-width.hairline. Checkbox consequence indent → calc(checkbox + inline-s), 26 unchanged. Old-design CSS (card-header, creep-alert, amount-gate, schema fields, remember toggle, old buttons, btn--run) deleted as unused rather than re-tokened.
- Figma: old Space/Size/Radius/Font size variables replaced by the new set and deleted; every binding moved by the same rules. Parity diff 162 ↔ 162, zero.

### Values that moved (old → new)
| Component | Moves |
|---|---|
| Button | padding 9/16 → 12/16 (inset-squish-m; 8/16 fit no concept, tie to the larger); radius 5 → 4; label 13 → 14 |
| Tier chip | padding 3/8 → 4/8 (squish-xs); compact 2/3 → 2/4 (squish-xxs); compact scope creep 2/1 → 2/2 (inset-xxs); type 11 → 12, compact 10; radius 4 |
| Section label | gap 6 → 8 |
| Causal trace | rail top 3 → 4; value 11 → 12 |
| Hop connector | label 11 → 12 |
| Approval checkbox | box radius 3 → 4; label 13 → 14; consequence 12 |
| Agent status | status line 11 → 12; core inset 3 → 4 (core 6 → 4 inside the 12 node) |
| Consent card frame | header padding 14/16 → 16; body gap 14 → 16; panel detail and outcome 13 → 14; receipt time 11 → 12; receipt label gap 6 → 8 |
| Alert | body 13 → 14; passive gap 6 → 8 |
| Draft preview | padding 12/14 → 12/16 (squish-m); field gap 6 → 8; radius 5 → 4; fields 11 → 12 |
| Field rows, Timeline | gap 6 → 8; type 11 → 12 |
| Top bar | height 52 → hugs (still 52: Stop button 8/12 + bar 8/24); Stop button padding 6/12 → 8/12, radius 5 → 4, label 13 → 14; "Agent stopped" 13 → 14 |
| Thesis strip | height 18 → hugs (17 in code: 2px rule + text) |
| Task card, Scenario card | padding 14/16 → 16; scenario gap 6 → 8, Run margin 6 → 8; scenario label 15 → 14 |
| App shell | main padding 28/32 → 32; main gap 20 → 24; gate offset 12 → 8 (keeps the locked 32px card offset) |
| Landing | headline 28 → 22 (decision); legend gap 10 → 12, legend padding 10/12 → 12; scenarios gap 10 → 12 |
| Activity row | padding 5/6 → 4/8 (squish-xs); gap 6 → 8; list gap 3 → 4; chip column 38 → hugs; state label 9 → 10; fallback badge 8 → 10 |
| Grant item, list | padding 8/10 → 8/12 (squish-s); list gap 6 → 8; radius 5 → 4; scope and server 11 → 12 |
| Sidebar | sublabel margins −6/10 → −8/12 |
| Agent running | pulse 10 → 12 (node) |
| Gallery (dev page) | gaps 14 → 16, 20 → 24, 6 → 8; swatch and card grids → flex wrap (sizes 140, 400 dropped) |
| Radius, everywhere | 3, 4, 5 → 4 (s); 8 → 8 (m) |

| Screen | Caught | Rule | Fix |
|---|---|---|---|
| Completion (code + Figma) | Top bar dropped from 52 to 37 once Stop Agent left: the bar now hugs | Layout: nothing jumps between screens | "Agent stopped" gets the Stop button's box (inset-squish-s, hairline transparent border; in Figma a surface-colored hairline counted in layout). 52 on every screen |
| Partial completion | Fallback row cut the tool to "issues.up…" (13px short) after badge type 8 → 10 and gaps 6 → 8 | Sidebar rows show status + record + tier + tool | Fallback indent 16 → 8 (inline-s), info gap → inline-xxs, badge padding → inline-xxs. Fits, badge kept |
| Landing (Figma) | Legend card padding overrides had fallen back to 16 | Legend frames use the compact 12 padding | Bound to inset-sm |
| Figma | Slot content inside instances (field lists, timelines, decision and muted text) wasn't rebound: its layer IDs read as inherited | Every value binds to a token | Rebound slot content directly; no old variable left before deletion |
| Activity row | Chip column hugs, so tool names no longer share one left edge across READ / WRITE / CREEP rows | Approved trade-off (fixed sizes hug) | Left as is; flag for review |
| Figma, no token | Trace node half-fill height 8 and declined strike width 8 (geometry inside the 12 node); field row default width 400; activity state label box height 13 | Report, don't invent | Left raw |

## Token consolidation follow-ups (Nov 5, 2026)

| Screen | Caught | Rule | Fix |
|---|---|---|---|
| Activity sidebar | Tool names started at different x per chip once the chip column hugged | Sidebar rows: status + record + tier + tool, aligned | New size.chip-column = 42, the widest compact chip. Measured in the browser: WRITE 42, CREEP 40, READ and DEST 35.6 (WRITE's 4px squish padding outweighs CREEP's 2px padding + 2px border). In Figma WRITE and CREEP are both 40, so 42 holds every sidebar chip. Chips keep their own width (justify-self start). All rows now share a left edge (x 1264); the fallback row stays 8px indented by design |
| Tokens | space.inset.s and space.inset.l had no uses | Only tokens a use needs | Removed from tokens.json, tokens.css and Figma (no bindings on either page). Parity 161 ↔ 161, zero |
| Thesis strip | Height check after it went to hug | Thesis strip ~18px | Code 17, Figma 19: both within 2px of 18, so no size.thesis-strip-height |
| Hero shot | docs/case-study/hero-refund-2x.png showed the old spacing | Hero: refund card, $149.00, film-red panel, review checkbox, Don't Refund / Confirm | Re-shot from the live card at 2520 × 1260 (2:1, deviceScaleFactor 2) on the page field. The card is taller under the new tokens (406 vs 378), so its zoom is 1.39 instead of 1.5 to keep the same margin |

## Phase 4a — multi-hop, Figma first (Nov 5, 2026)

Built in Figma only; no code changes. Jon edits the card and picks the landing layout.

- Components: trace steps already carry a server label (mono, slate, above the field) and the Hop connector exists; nothing was missing. The Causal trace multi-hop example now uses real-shaped addresses.
- Screens: new frame "multi-hop" (1440), cloned from the scope-creep shell and rebuilt with instances: SCOPE CREEP + link icon + crm.contacts.update; decision sentence; YOUR CURRENT GRANT trace with crm · contact.email (dana.reyes@northwind.example → dana@reyesdesign.example); hop connector "crosses to payments · not granted"; + billing_contact and + card_on_file.notify_to as salmon half-fill nodes, unchecked; "Not remembered. Cross-server changes ask every time." with no remember checkbox; Change CRM Only · Approve Selected · 0 of 2; consequence line.
- Screens: new frame "landing — 5 scenarios" with two options side by side, undecided: A = 2×2 + Multi-hop full width; B = 3 + 2.

| Screen | Caught | Rule | Fix |
|---|---|---|---|
| Multi-hop trace | The crm step (Line=none) sat flush against the hop rule | Code only drops the step's bottom padding on the last step | That step's bottom padding bound to stack-m, in the screen and the component example |
| Landing (all three frames) | Tier legend showed only READ and WRITE: each legend card had taken the card frame's card-width (640) binding and was clipped | Legend: four equal columns | Legend cards unbound from card-width and set to fill |
| Scenario card | In the 3-across layout the description ran past the card | Text wraps inside its card | Label and description fill the card and wrap (main component) |
| Multi-hop sidebar | "crm.contacts.update" doesn't fit next to "waiting"; it cuts to "crm.contacts.upda" (code would ellipsize the same way) | Sidebar rows show the tool | Open for Phase 4: decide how long tool names fit the 300 sidebar |
| Landing option B | Row 2 cards fill wider than row 1; cards in a row hug to different heights | Layout undecided | Left for Jon's pick and auto-layout pass |
| Placeholders to confirm | Multi-hop task card, intro, status line, sidebar rows (crm.contacts.read, crm.contacts.update with email icon), the granted-earlier grant, and the Multi-hop scenario card copy | Not in screen-decisions.md | Written plainly in house style; Jon to edit |
| No token | Screen frames 1440 × 900; dash pattern 6/4 on the hop rule and dashed trace lines | Report, don't invent | Left raw |

## Phase 4b — multi-hop, Figma → code (Nov 5, 2026)

Built from the Figma "multi-hop" frame and "landing — 5 scenarios" Option A via Figma MCP design context. screen-decisions.md updated where Figma differed.

- Figma first: Jon's hand edits lived only on the screen. The forest line was a loose page-level Line (bound to trace/granted and border-width/trace) laid over the frame, and the hop's inline/s left padding was an instance override. Pushed into the components: the crm step now uses Trace step Line=granted (lands on the same pixels, 442 → 491, ending on the hop rule); Hop connector main binds paddingLeft to inline/s and hugs its label (rule fills); the Causal trace multi-hop example matches. Loose line deleted. Both component descriptions updated.
- Code: crm mock server (crm.contacts.read, crm.contacts.update) and payments.customers.update, so billing_contact and card_on_file.notify_to are real payments schema fields. The CRM's linked schema carries them with x-mcp-server: payments; gate() sees them as scope creep. MultiHopCard renders the card; isCrossServer() picks it over the scope-creep card. Hop connector CSS: inline-s left padding, stack-xs gap, width max-content.
- Paths checked in the browser (headless Chromium, 1440 × 900), all zero console errors: Happy path · Partial completion · Scope creep · Tool error (Skip for Now and Try Refund Again) · Multi-hop Change CRM Only · nudge then 1 of 2 · 2 of 2 · revoked CRM approve · revoked CRM deny. Landing: four cards 532 wide in 2×2, Multi-hop 1076 full width.
- gate() checked directly: READ silent, WRITE first use, WRITE remembered, WRITE creep, DESTRUCTIVE every time, cross-server asks every time, cross-server approval leaves the CRM grant narrow and records nothing for payments.
- Shot 4: docs/case-study/multihop-figma-vs-code.png, Figma card (left) and running card (right) at 1× on the page field. 1× because the Figma MCP screenshot caps at the node's natural size; both sides match so the comparison is fair.

| Screen | Caught | Rule | Fix |
|---|---|---|---|
| Multi-hop receipt | Change CRM Only gave two crm.contacts.update steps the same React key (declined + fallback decision) | Receipt records decisions; scope creep records only the declined one | Fallback row carries no decision, same as scope creep |
| Revoked CRM write | Card header showed the ticket receipt icon; the sidebar row shows email for the same tool | Card header: tier chip + record-type icon + tool | UpdateCard copy per tool, including icon (email for crm) |
| Revoked CRM write | UpdateCard copy was ticket-only ("Update ticket …", "Update This Ticket") | Cards describe what happens in plain language | Copy keyed by tool: "Change the email on contact ct-4821.", Change This Email, "Deny: the contact keeps its current email." |
| Multi-hop sidebar | "crm.contacts.update" ellipsizes to "crm.contacts.up…" next to waiting (open since 4a) | Sidebar rows show the tool | Full name in a title attribute; width decision still open for Jon |
| Multi-hop authorized list | Figma shows only crm.contacts.update; code shows issues.update too | Prior-session grants seed at landing so a revoke there holds | Both seeded (thesis 4: the whole budget is visible). Figma sidebar is the placeholder |
| Shot 4: card height | Code card 698 vs Figma 648. Three shared-component differences, same on every trace card: trace text line-height (code body 1.5, Figma normal); checkbox stack-xs top margin inside a trace step; action buttons size to their label (Figma splits 50/50) | Figma is the source for this card | Not changed: fixing them on one card would split it from the scope-creep card. Open for Jon: align the shared components one way or the other |
| Hop rule length | Figma screen had a hand-set 236 width (rule 228); now hugs the 238 label in both Figma and code | Every use matches | Hug in both; 10px longer than the hand edit |
| Placeholders confirmed | Multi-hop task, intro, status, read row, scenario card copy from 4a | Figma is the source for this card | Used as written in Figma; logged in screen-decisions.md |
| Completion copy, no Figma frame | Multi-hop receipt headlines and LEFT FOR YOU rows | Honest outcome; rows name the item only | "Task complete. N payments field(s) left for you." / "Task complete. Email changed on the CRM and payments." / "0 of 1 done. Email change left for you." Rows "payments · <field>" |

## Phase 4 follow-ups — Figma follows code (Nov 5, 2026)

Jon's call: Figma follows code on the shared trace components; card action buttons split 50/50 in both (code can't be matched by Figma's Fill with flex 1 1 auto, so code moved). Target: every Figma card within 2px of code.

Card heights, code vs Figma (code − Figma):

| Card | Before | After |
|---|---|---|
| Write — issues.create | +9.8 | −1.2 |
| Revoked write — issues.update | +56.8 | +0.8 |
| Scope creep — issues.update | +49.8 | −0.2 |
| Destructive refund | −7.2 | −1.2 |
| Tool error | +12.8 | +1.8 |
| Completion receipt — happy | +32 | 0 |
| Completion receipt — partial | +26 | 0 |
| Multi-hop | +49.6 | +1.6 |

Remaining sub-2px gaps are rounding: code lays out 16.8px lines (12px × 1.4) on fractional pixels, Figma rounds.

| Screen | Caught | Rule | Fix |
|---|---|---|---|
| Trace components (Figma) | Trace step Server / Field / Value / Note, Hop label and Approval checkbox Label / Consequence were auto (~1.3); code computes 150% (line-height/body) | Figma follows code | 150% on all 20 Trace step variants, Hop connector, Approval checkbox. Figma can't bind the unitless line-height/body variable as a percent (number variables bind as px), so 150% is set directly and matches the token |
| Trace checkbox (Figma) | Code puts stack-xs above a checkbox inside a trace step; Figma had none | Same | Control padding-top bound to Space/stack/xs in every Trace step variant |
| Card text outside the trace (Figma) | Shared trace changes left gaps from text still on auto: tier chip, section label, card header tool and server, destructive and receipt panel text, draft ID, timeline rows, muted slot text. Code computes 150% for all of it (only button labels are normal; decision 140%, hero 110% and draft fields 140% already matched) | Target within 2px | 150% on auto text in Consent card frame, Tier chip, Section label, Draft preview, Timeline row, and the cards' slot text. Button labels untouched |
| Revoked write (Figma) | +32: its two non-last Line=none steps had 0 bottom padding; code drops the padding only on the last step | Same as the 4a crm-step fix | Those steps' Body padding-bottom bound to stack-m (any non-last step at 0 on every screen) |
| Refund (Figma) | The reason value wrapped to 2 lines: Field rows were a fixed 400 (the raw default flagged in 3.5) | Field rows fill the card, as in code | Field row instances set to Fill on refund and write; no raw width left |
| Refund and receipts (Figma) | 2px taller: Figma counted the 1px edge in layout; code draws it as an inset outline that takes no space | Same | Consent card frame Tier=destructive and Tier=receipt: strokes not included in layout |
| Card actions (code) | Buttons were flex 1 1 auto (label width + equal share of the spare space, 274 / 322 on multi-hop); Figma can't express that | Jon: 50/50 in both | .cm-frame__actions .cm-btn flex 1 1 0. Every card now 298–300 each |
| Button (Figma) | On Fill buttons the icon sat right after the label; code pushes it to the right edge (space-between) | Label left, icon right | All 24 Button variants space-between. Hugging buttons (Run) unchanged |
| Activity sidebar (code + Figma) | Tool names truncated ("crm.contacts.up…") with the full name only on hover | Rows show the tool | Names wrap to a second line, breaking after a dot (code: <wbr> after each dot, overflow-wrap anywhere; Figma: Tool text fills and grows in height at 150%, zero-width spaces after the dots on every screen). Hover title removed. Code and Figma wrap the same rows at the same size: payments.refund next to "needs you" and crm.contacts.update next to "waiting", both 89 × 30 / 101 × 30 |
| Activity row fallback (Figma) | A Fill tool name in a wrapping row would always push the fallback badge to a second line | Code keeps the badge inline when it fits | Fallback variant's Tool text hugs. In code, the multi-hop fallback row (crm.contacts.update) drops its badge under the name; no Figma frame shows that state |
| Multi-hop sidebar (Figma) | Showed only crm.contacts.update | Matches code: both prior-session grants seed at landing | issues.update · issue-tracker · granted earlier added above it |
| Button (Figma), open | Primary is 42 high, secondary 44: the primary has no stroke, code gives every button a 1px border (transparent on primary) | Not in this pass | Row height is unaffected (the actions row hugs the taller button). Left for a pass on Button |
| Shot 4 | Code side retaken at 2x: docs/case-study/multihop-code-2x.png (1280 × 1396, deviceScaleFactor 2) | Jon exports the Figma side by hand | demo/scripts/compose-shot4.py combines multihop-figma-2x.png + multihop-code-2x.png into multihop-figma-vs-code.png (field background, space.xl margins from tokens.json). Waiting on the Figma export; the committed comparison is still the 1x one |

## Figma screen frames fit content (Nov 5, 2026)

| Screen | Caught | Rule | Fix |
|---|---|---|---|
| Every screen frame (Figma) | Screens were a fixed 1440 × 900 and clipped anything below; the multi-hop card lost its bottom padding and edge in the 2x export | Frames show their whole content | All 9 screen frames hug vertically with min height 900; each Body hugs and grows, so it fills to 900 on short screens and expands on tall ones, and the sidebar stretches with it. landing — 5 scenarios already hugged (934), unchanged |
| Frames that grew | Scope creep — issues.update 900 → 955; multi-hop 900 → 941. The other seven stay at 900 (tallest main column 688) | — | No canvas overlaps (frames sit side by side at y 0) |
| Multi-hop export node (Figma) | The intro line and card already shared a parent ("Consent card", 28:1732, 640 wide, hugs) | One node to export for shot 4 | Renamed to "multi-hop / card". 640 × 696; code's card wrap is 698 (the +1.6 card gap logged above) |
| Shot 4 | The first export was the whole screen frame saved as multihop-figma-vs-code.png; it's kept as multihop-figma-2x.png and composed with the 2x code card (4352 × 1928) | Card next to card | Re-export "multi-hop / card" at 2x to multihop-figma-2x.png and rerun demo/scripts/compose-shot4.py |

## Figma construction leftovers (Nov 5, 2026)

From the Phase 3.5 binding report's "construction leftovers" (Layout values row above). References checked on both pages: an instance sublayer counts if it's shown on any screen or component.

| Layer | Found | Referenced? | Fix |
|---|---|---|---|
| Decision text box 606 × 31 | Consent card frame Tier=destructive (8:426) and Tier=receipt (8:449): hidden placeholder "Body content" in the Body slot, fixed width and height. Tier=read (8:338) was already Fill / Hug | No (hidden on every instance) | Set to Fill width / Hug height (stretch, auto height); now 608 wide, the slot's content width on these strokeless-layout tiers. Figma reports a hidden layer's sizing as Fixed because it's out of layout; the stored setting applies when shown |
| Hidden note text 183 | Note in all 20 Trace step variants, hidden by default | Yes: shown on the scope creep screen (new-half / ends "Moves ownership to another team", new-open / none "Tags only") and in the component examples (new-half / ends, new-half / none, new-open / none) | Kept: it's the note slot every trace step needs. Not actually fixed: shown instances hug; the 183 is the hidden layer's last size, reported as Fixed only because it's hidden |
| Hidden empty state label 0 | Activity row State=fallback, State label (8:647): hidden, a single space, width 0 | No | Deleted. Row unchanged (254 × 27) |
| Spacer height 1 | Push-right spacers (Fill width, height 1, no fill or stroke): Consent card frame header in read / write / scope-creep / alert, destructive panel row, Top bar active / stopped | Yes: in every screen's top bar and every card header | Kept. They push the server name and Stop Agent to the right; space-between can't replace them because the left groups (chip, icon, tool; title, status) would spread apart. The 1 is a construction height with no visual effect |
| On-red backdrop (Components page) | Not a text layer: a locked top-level frame "On-red backdrop (Tiers/destructive/panel)" (652 × 106, fill bound to the destructive panel color) sitting behind the Button set's Surface=red rows. Being a top-level frame, Figma drew its name on the canvas just above it, over the bottom of the Surface=surface ghost / override row | It's the red surface the on-red variants are judged against, not a note, so it stays | Replaced with a locked rectangle of the same name, position, size, bound fill and layer order (behind the set). Rectangles get no canvas name label, so nothing covers a button |

## Button component set (Figma, Nov 5, 2026)

| Item | Caught | Rule | Fix |
|---|---|---|---|
| Label-to-icon gap | 23 of 24 variants were space-between with a hugging width, so Figma ignored the bound gap and the label touched the icon (0). primary / surface / hover was packed left at 12 but never pushed the icon right | Code: gap inline-sm with space-between (label left, icon right, never closer than the token) | All 24: pack left, gap bound to Space/inline/sm (12), label fills the spare width with auto height. A hugging button sizes to its label + 12 + icon; a filled one pushes the icon to the right edge and the label can't come closer than 12. Same result as code's space-between + gap, which Figma can't express directly (its auto spacing has no minimum) |
| Screen instances | 13 distinct uses checked (card actions and Run) | — | Every one shows gap ≥ 12 (filled: label left, icon at the right edge; Run: 12 exactly, 88 wide, matching code). Labels stay one line; no screen frame changed height |
| Set layout | 24 variants in a 6 × 4 jumble, primary, secondary, ghost and override mixed across rows; Surface=red split across two rows on the backdrop | Readable matrix | Grid layout: columns = State (default, hover, focus), rows = Variant (primary, secondary, ghost, override). Surface=surface block on top, an empty zero-height row, Surface=red block below. Row gap Space/stack/m, column gap Space/inline/m, padding Space/inset/m (all 16). The empty row makes the gap between blocks two row gaps, so the backdrop's 16 padding around the red block leaves 16 above it too. Set 382 × 504 |
| On-red backdrop | Sized for the old layout | Red block sits on the panel color | Rectangle refit to the red block: full set width, from 16 above the red rows to the set's bottom edge (382 × 252), still behind the set. Its position isn't a variable (rectangles can't bind x / y); it follows the set's token padding |
| Components page | Set grew 276 taller and overlapped Tier chip | No overlaps | Every component below moved down 276; no overlaps on the page |

## Phase 5: behavior and motion (Nov 6, 2026)

Self-check: all five scenarios run with motion on and with reduced motion, plus Stop Agent mid-run, revoke then re-ask, keyboard only (Tab / Space / Enter / Escape) through every card, and a double-click on Confirm. 104 checks (the Nov 2 suite's 57 plus 47 Phase 5 checks) passed in each mode, with no console errors. The token grep finds no raw ms, s or cubic-bezier outside the generated token CSS.

| Item | Caught | Rule | Fix |
|---|---|---|---|
| Agent tempo | The scripted agent waited raw 400–1300ms delays in agent.js | No durations outside tokens.json; a new value becomes a token first | New `pace.*` group (step, read, beat, fallback, hold, retry) at the same values. The agent reads them from the token CSS. Machine time, not motion, so reduced motion leaves it alone. Not a Figma variable |
| JS timers | The deliberate beat, double-commit guard and char delay need durations in JS | Every duration comes from motion.* tokens | `readDuration()` reads the generated custom properties, so JS and CSS share one source |
| Status line | "paused → " made the whole sentence type again at every gate | Waiting: completely still | The prefix appears whole; only the agent's own words type on. The light speaks only while working, so it's still at a gate and static when stopped |
| Status line | Typing char by char would make screen readers announce every letter | Accessibility | The full sentence sits in a visually hidden live region; the typed text is aria-hidden |
| Status line | Stop and completion are facts, not the agent speaking | Stop confirms in place | Stopped status appears whole: "Agent stopped. Nothing else will run." |
| Refund | Confirm worked the moment the box was checked | Rule 4: deliberate beat | Live after motion.duration.deliberate. An early click shows "Check the amount first." The button is never disabled |
| Refund | A guard armed by any click would swallow the click right after a nudge | Rule 8: ignore repeat commits | Only a click that commits arms the guard. Both refund buttons share it, and Try Refund Again and Skip for Now share one |
| Refund | The second click of a double-click on Confirm landed after the card closed and selected the next card's text | Rule 8: no double commits | For the guard window, the guard also blocks multi-click selection |
| Keyboard | Enter with focus on the review checkbox could have meant Confirm | Rule 3: no shortcut to a destructive action | Enter on anything but a button takes the primary (Don't Refund). Confirm needs explicit focus + Enter |
| Write card | After approval the card stays up, and its keys stayed live | Grants appear after the decision, once | Autofocus, Enter and Escape turn off once the draft is committed |
| Receipt | Focus fell to the page after the last decision | Keyboard only through every card | Focus lands on Run Another Scenario |
| Landing | The legend's mini frames would each run the scan line | Signature moments are for cards entering | Legend frames opt out (`enter={false}`) |
| Trace draw | Scaling a dashed segment squashes its dashes | Dashed terracotta draws last | Lines and the hop rule reveal with clip-path, so the dashes stay put. Delays are order × trace-stagger + phase × slow |
| Checkmark | The Carbon checkmark is a filled path, so there's no stroke to draw | Icon motion: stroke draws itself | Revealed left to right with clip-path, the same visual result. It also draws when a review or approval box is ticked |
| Waiting pulse | Confirmed | Uses opacity.pulse over breathe | No change. Static under reduced motion |
| Reduced motion | "Instant crossfades" left open whether fades stay | No drawing, typing, icon motion or scan | Movement, drawing, typing, the scan line, icon motion, the light and the pulse are off. Opacity crossfades keep their tokens. The beat and the guard stay because they're behavior |
| Check suite | Phase 5 reported 47 checks against the Nov 2 suite's 57. The 47 were a new Phase 5 script; the Nov 2 suite lived in a session scratchpad and didn't run at all | The verification loop reruns every earlier check | Rebuilt the Nov 2 suite from its session record and ran it beside the Phase 5 checks: 104 per run, 57 + 47, all passing with motion on and with reduced motion. All 57 are kept. Two were updated for later decisions, not dropped: the refund helper waits out the deliberate beat (Phase 5), and the grant counts and the revoke target follow the two seeded grants (Nov 5 multi-hop). Under reduced motion, the waiting-row check expects no pulse |
| Figma | pace.* tokens existed in code but not in Figma, breaking the zero-diff claim | Figma and code at parity | Added the pace variables to Figma; diff is zero. pace/step … pace/retry are in the Motion collection: FLOAT ms, no scopes, WEB syntax var(--pace-*). 167 code tokens = 167 Figma variables, no value differences |
