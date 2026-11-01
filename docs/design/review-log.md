# Review log

Things caught and fixed against docs/design/ during the rebuild, newest last.

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
