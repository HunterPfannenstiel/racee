# Player Profile — What's Left

## 1. Real query implementation (highest priority)

The route currently returns hardcoded mock data from `MockUserProfileStatsQuery`. The real implementation needs to be built:

**File to create:** `server/queries/user-profile-stats/BlobUserProfileStatsQuery.ts`

It must implement `IUserProfileStatsQuery` and do the following fan-out:
1. Load `participants.json` to resolve the user's name
2. Load `leagues.json` to find all leagues in the system
3. For each league, load `leagues/{leagueId}/races.json` to find races that league participates in
4. For each league-race pair where the user has a prediction, load `leagues/{leagueId}/races/{raceId}/predictions.json`
5. De-duplicate picks by `(raceId, propType, answer)` — weight = number of leagues with that exact answer
6. For graded races (where `race.keySetAt !== null`), load `leagues/{leagueId}/races/{raceId}/scores.json` to get correct/incorrect outcomes via `race.propKey`
7. Compute `propWeightedAccuracy` per race, `propAccuracy` per prop type, and overall accuracy — all using the weighted engine (see below)

**Weighted accuracy engine:**
- Unit: unique `(raceId, propType, answer)` tuples
- `correctWeight` = sum of `weight` where `pick.isCorrect`
- `totalWeight` = sum of all `weight`
- `accuracy = correctWeight / totalWeight`
- A pick is correct if `answer ∈ propKey[propType]` (PropKey values are arrays)

Then swap the API route (`app/api/players/[userId]/route.ts`) from `MockUserProfileStatsQuery` to `BlobUserProfileStatsQuery`.

---

## 2. Accuracy trend chart

Deferred intentionally. The `trendLine` field is already in the DTO and populated by the mock.

**What to add:**
- Install `recharts` (`npm install recharts`)
- Create `AccuracyTrendChart.tsx` in this directory
- Use a `LineChart` with `propWeightedAccuracy` on the Y axis (0–1, displayed as %) and race `title` on the X axis
- Style to match the Pit Lane Industrial aesthetic: dark background, `primary` (red) line color, no grid lines or minimal muted grid, mono font for axis labels
- Wire it into `page.tsx` between `StatStrip` and `PropAccuracyBars`

---

## 4. Empty states

The page has a basic "Player not found" fallback but no designed empty state for a player with no graded races yet.

**Add:** An empty state component (matching the design system's empty state pattern from `components.md`) for the case where `pickFeed` is empty or all entries are ungraded — factual headline, short body, no CTA needed.

---

## 5. Grid prediction accuracy (optional, v2)

Grid picks (`racerIds` — the predicted race finishing order) are intentionally omitted from the current profile. They use positional scoring (distance-based), not a simple correct/incorrect match, so they don't fit cleanly into the weighted prop accuracy engine.

If added later:
- Add `gridAccuracy: number | null` to `RacePickEntryDTO`
- Compute it as: for each position in `keyOrder`, find its position in the user's prediction, measure distance, normalize to a 0–1 score
- Show it as a separate stat in `StatStrip` and as a secondary bar in `PropAccuracyBars`

---

## 6. League context section (future)

The current profile is fully app-wide. The "league shenanigans" phase will add a section below the pick feed showing how this player ranks in leagues you share with them.

**Design intent:** A collapsed section titled "IN YOUR LEAGUES" showing per-group rank and points total — useful for sizing up a rival in a specific group without leaving their profile.

Needs the viewer's userId (from auth session) to determine which leagues are shared.

---

## 7. Avatar support

Currently shows an initial-letter fallback. If the user system ever stores avatar URLs (via OAuth provider images in the Prisma `user` table), the `PlayerIdentityDTO.avatarUrl` field is already wired — just needs the query to populate it from `user.image`.
