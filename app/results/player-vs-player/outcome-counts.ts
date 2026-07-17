// Shared left-perspective win/loss/tie counting for a set of rows with
// leftPoints/rightPoints -- "won" = left scored more, "lost" = right scored
// more, "tied" = equal. Used by the drawer's per-section labels (PickDetailDrawer.tsx).
export type ScoredRow = {
  leftPoints: number;
  rightPoints: number;
};

export function countOutcomes(rows: ScoredRow[]): { won: number; lost: number; tied: number } {
  let won = 0;
  let lost = 0;
  let tied = 0;

  for (const row of rows) {
    if (row.leftPoints > row.rightPoints) won++;
    else if (row.rightPoints > row.leftPoints) lost++;
    else tied++;
  }

  return { won, lost, tied };
}
