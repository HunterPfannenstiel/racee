import { describe, it, expect } from "vitest";
import { formatStats } from "@/app/results/formatStats";
import type {
  ResultsEntryDTO,
  ResultsStatsDTO,
} from "@/server/queries/results/IResultsQuery";

const entry = (userId: string, name: string): ResultsEntryDTO => ({
  userId,
  name,
  gridPoints: 0,
  propPoints: 0,
  total: 0,
  medal: null,
  rank: 1,
  color: "#000000",
  teamName: "Test Team",
});

const ENTRIES: ResultsEntryDTO[] = [
  entry("u-1", "Max V."),
  entry("u-2", "Lando N."),
  entry("u-3", "Charles L."),
];

describe("formatStats", () => {
  it("formats the normal case: rounded average, %-formatted prop bet, single highest/lowest names", () => {
    const stats: ResultsStatsDTO = {
      averageScore: 25.333333,
      highestScore: { value: 43, userIds: ["u-1"] },
      lowestScore: { value: 9, userIds: ["u-3"] },
      bestPropBet: { prop: "fastestLap", hitRate: 0.86 },
    };

    expect(formatStats(stats, ENTRIES)).toEqual({
      bestPropBet: { value: "86%", sublabel: "Fastest Lap" },
      averageScore: { value: "25.3" },
      highestScore: { value: "43", sublabel: "Max V." },
      lowestScore: { value: "9", sublabel: "Charles L." },
    });
  });

  it("joins tied userIds into a single comma-separated sublabel", () => {
    const stats: ResultsStatsDTO = {
      averageScore: 30,
      highestScore: { value: 30, userIds: ["u-1", "u-2"] },
      lowestScore: { value: 30, userIds: ["u-3"] },
      bestPropBet: null,
    };

    const result = formatStats(stats, ENTRIES);
    expect(result.highestScore).toEqual({ value: "30", sublabel: "Max V., Lando N." });
  });

  it("renders a no-data placeholder when bestPropBet is null", () => {
    const stats: ResultsStatsDTO = {
      averageScore: 10,
      highestScore: { value: 10, userIds: ["u-1"] },
      lowestScore: { value: 10, userIds: ["u-1"] },
      bestPropBet: null,
    };

    expect(formatStats(stats, ENTRIES).bestPropBet).toEqual({ value: "—" });
  });

  it("handles the zero-entries case without crashing, producing an empty sublabel", () => {
    const stats: ResultsStatsDTO = {
      averageScore: 0,
      highestScore: { value: 0, userIds: [] },
      lowestScore: { value: 0, userIds: [] },
      bestPropBet: null,
    };

    expect(formatStats(stats, [])).toEqual({
      bestPropBet: { value: "—" },
      averageScore: { value: "0.0" },
      highestScore: { value: "0", sublabel: undefined },
      lowestScore: { value: "0", sublabel: undefined },
    });
  });

  it("drops a tied userId that has no matching entry rather than crashing", () => {
    const stats: ResultsStatsDTO = {
      averageScore: 20,
      highestScore: { value: 20, userIds: ["u-1", "ghost-id"] },
      lowestScore: { value: 20, userIds: ["u-1"] },
      bestPropBet: null,
    };

    expect(formatStats(stats, ENTRIES).highestScore).toEqual({
      value: "20",
      sublabel: "Max V.",
    });
  });
});
