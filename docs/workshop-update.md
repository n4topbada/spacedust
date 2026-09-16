# Workshop revision — 2026-09-12

The game interface, names, notifications, help and accessibility labels are now English. Custom player names remain unchanged.

## Navigation and purchasing

The universe screen contains only Tools and Research. Clicking any tool row purchases the selected quantity; prices are plain text within the row. Craft opens a full-width workshop with Constellations and Currencies & shop. The hash route preserves browser Back behavior, refreshes into the workshop, and keeps the simulation and autosave running.

## Constellations

There are 15 unique, connected, selectable star diagrams. Sets 1–5 contain three stars each, sets 6–10 four each, and sets 11–15 five each: 60 stars total. Select any node to inspect its own recipe. Crafting remains sequential.

- Sets 1–5: base dust and early tools only, with different tool combinations and quantities per star.
- Sets 6–10: intermediate tools, base dust and varying pairs of common currencies.
- Sets 11–15: advanced tools, larger quantities of all common currencies and mandatory Spacedust.
- Research upgrades are not consumed. Their existing ×2 effects remain installed.
- Optional Spacedust substitution pays only common-currency deficits. Mandatory Spacedust is reserved and charged even when substitution is off; other currencies cannot replace it.
- Existing star/set bonuses and one lucky box per completed set remain. Tools 12/13/14 unlock after 5/10/15 completed sets, at new star counts 15/35/60.

## Conversion packages

| Dust cost | Full common-currency payout | Separate 2% Spacedust bonus |
| --------: | --------------------------: | --------------------------: |
|     1,000 |                       1,000 |                         1–2 |
|     4,500 |                       5,000 |                         3–6 |
|    30,000 |                      35,000 |                       12–24 |
|   100,000 |                     120,000 |                       40–80 |

One of Stardust, Moondust, Galaxydust or Solardust is selected with 25% probability and receives the entire package amount. Spacedust is an independent additional reward. Guaranteed Spacedust still uses lifetime base dust converted: 50K, then ×4 thresholds, paid once each.

The single-currency payout is explicitly confirmed by the user. Separate Spacedust bonuses and excluding research from recipes are stated working assumptions while the other clarification choices remain unanswered.

Special-shop prices now start at 5,000 of the relevant currency and multiply by 2.2 each level. Effects and caps are unchanged. Galaxydust trades cost 1,000 and pay 600 of another common currency; growth exchange costs 5,000. Lucky boxes pay 2,000 + 1,000 × completed sets of each common currency on that reward branch. These prices reflect the larger package payouts. Base-tool performance, tool prices, level thresholds and celestial mass requirements are unchanged in this revision.

## Save compatibility

The storage key remains `spacedust.save.v1`; the internal schema is version 4. Version 3 completed-set counts, tools, research, wallet, permanent upgrades and lucky boxes are preserved. Partial-set progress is mapped to the new node count without completing an uncompleted set. Any difference in earned-star bonuses is retained in `legacyStarCredit`, so migration never reduces earned passive or click bonuses. Migration is idempotent. The old raw save is backed up once as `spacedust.save.before-workshop`.

Version 1/2 migration and the one-time legacy enhancement refund remain supported. New saves reject invalid star counts, out-of-range credit, impossible box totals and malformed currency arrays.

## Verification

Tests cover all 60 recipes, 15 distinct connected diagrams, actual material consumption, mandatory joker payment, all conversion packages and probability boundaries, all 76 old star-count states, retained bonuses, save round trips and unchanged core gameplay rules. Browser checks use a separate profile rather than the player's save.
