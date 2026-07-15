/* ARCHIVED — one-off script, no longer run. Commented out so it stays excluded from typecheck/lint.

import { blob } from "../lib/blob/index.ts";
import { prisma } from "../server/db.ts";

type LeagueBlob = {
  id: string;
  commissionerId: string;
  coCommissionerIds?: string[];
  memberIds?: string[];
};

const [leagues, users] = await Promise.all([
  blob.read<LeagueBlob[]>("leagues.json").then(r => r ?? []),
  prisma.user.findMany({ select: { id: true } }),
]);

const allUserIds = users.map((u) => u.id);

const updated = leagues.map((league) => ({ ...league, memberIds: allUserIds }));

await blob.write("leagues.json", updated);
console.log(`set ${allUserIds.length} member(s) on ${leagues.length} league(s)`);

await prisma.$disconnect();

*/
