import type { PvpPlayer, PropPickRow, GridPredictionRow } from "./types";

function resolveName(player: PvpPlayer): string {
  return player.isCurrentUser ? "You" : player.name;
}

export function buildRollupText(
  left: PvpPlayer,
  right: PvpPlayer,
  propRows: PropPickRow[],
  gridRows: GridPredictionRow[],
): string {
  const leftGridWins = gridRows.filter((row) => row.leftPoints > row.rightPoints).length;
  const rightGridWins = gridRows.filter((row) => row.rightPoints > row.leftPoints).length;
  const leftPropWins = propRows.filter((row) => row.leftPoints > row.rightPoints).length;
  const rightPropWins = propRows.filter((row) => row.rightPoints > row.leftPoints).length;

  const leftTotalWins = leftGridWins + leftPropWins;
  const rightTotalWins = rightGridWins + rightPropWins;

  const leftName = resolveName(left);
  const rightName = resolveName(right);

  if (leftTotalWins === rightTotalWins) {
    // Tie variant intentionally reports tied-row counts rather than win
    // counts (there's no winner to attribute wins to) -- per product
    // direction, distinct from the win-count metric used above.
    const gridTies = gridRows.filter((row) => row.leftPoints === row.rightPoints).length;
    const propTies = propRows.filter((row) => row.leftPoints === row.rightPoints).length;
    return `${leftName} tied ${rightName} on ${gridTies}/${gridRows.length} grid picks, ${propTies}/${propRows.length} prop picks`;
  }

  const leftIsWinner = leftTotalWins > rightTotalWins;
  const winnerName = leftIsWinner ? leftName : rightName;
  const loserName = leftIsWinner ? rightName : leftName;
  const gridWinsForWinner = leftIsWinner ? leftGridWins : rightGridWins;
  const propWinsForWinner = leftIsWinner ? leftPropWins : rightPropWins;

  return `${winnerName} beat ${loserName} on ${gridWinsForWinner}/${gridRows.length} grid picks, ${propWinsForWinner}/${propRows.length} props`;
}
