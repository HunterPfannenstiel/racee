import { blob } from "@/lib/blob";
import { predictionsPath } from "@/lib/paths";
import { PredictionsFile, PropKey } from "@/lib/schemas";

const emptyPropKey: PropKey = {
  driverOfDay: null,
  lapsLed: null,
  fastestPitStop: null,
  fastestLap: null,
  overAchiever: null,
  underAchiever: null,
  wrecker: null,
};

export async function getForRace(leagueId: string, raceId: string): Promise<PredictionsFile | null> {
  return blob.read<PredictionsFile>(predictionsPath(leagueId, raceId));
}

export async function submitPrediction(
  leagueId: string,
  raceId: string,
  userId: string,
  racerIds: string[],
  propPicks: Record<string, string>,
): Promise<void> {
  const path = predictionsPath(leagueId, raceId);
  const current = (await blob.read<PredictionsFile>(path)) ?? {
    key: null,
    keySetAt: null,
    predictions: {},
    submittedAt: {},
    propKey: emptyPropKey,
    propPicks: {},
  };
  await blob.write(path, {
    ...current,
    predictions: { ...current.predictions, [userId]: racerIds },
    submittedAt: { ...current.submittedAt, [userId]: new Date().toISOString() },
    propPicks: { ...current.propPicks, [userId]: propPicks },
  });
}

export async function setKey(leagueId: string, raceId: string, key: string[], propKey: PropKey): Promise<void> {
  const path = predictionsPath(leagueId, raceId);
  const current = (await blob.read<PredictionsFile>(path)) ?? {
    key: null,
    keySetAt: null,
    predictions: {},
    submittedAt: {},
    propKey: emptyPropKey,
    propPicks: {},
  };
  await blob.write(path, { ...current, key, keySetAt: Date.now().toString(), propKey });
}
