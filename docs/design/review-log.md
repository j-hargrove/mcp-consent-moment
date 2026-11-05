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
