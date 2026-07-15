import { describe, it, expect } from "vitest";
import { computeGridPoints, computeWeeklyTeamPoints, computePropPoints, computeScoreStats, computeBestPropBet } from "@/lib/scoring";

const makeOrder = (size: number) => Array.from({ length: size }, (_, i) => `driver-${i}`);

describe("computeGridPoints", () => {
  // You predicted every driver's finishing position correctly — full points for each scorable slot.
  it("every driver predicted correctly → 180pts (18 exact matches × 10pts)", () => {
    // 20 drivers on the grid, depth cap at 18 — only the top 18 picks count
    const actualOrder = makeOrder(20);
    const userOrder   = makeOrder(20);
    expect(computeGridPoints(userOrder, actualOrder, [10, 7, 3], 18)).toBe(180);
  });

  // You predicted HAM 2nd, they finished 3rd — one spot off, partial points.
  it("predicted HAM 2nd, finished 3rd → 7pts (one spot off)", () => {
    const actualOrder = ["VER", "LEC", "HAM"]; // HAM finished 3rd
    const userOrder   = ["VER", "HAM", "LEC"]; // user predicted HAM 2nd, LEC 3rd
    // HAM: predicted 2nd, finished 3rd → 1 spot off → 7pts
    // LEC: predicted 3rd, finished 2nd → 1 spot off → 7pts
    // VER: predicted 1st, finished 1st → exact        → 10pts
    expect(computeGridPoints(userOrder, actualOrder, [10, 7, 3], 3)).toBe(24); // 10 + 7 + 7
  });

  // You predicted VER 1st, they finished 3rd — two spots off, fewer points.
  it("predicted VER 1st, finished 3rd → 3pts (two spots off)", () => {
    const actualOrder = ["NOR", "LEC", "VER"]; // VER finished 3rd
    const userOrder   = ["VER", "LEC", "NOR"]; // user predicted VER 1st, NOR 3rd
    // VER: predicted 1st, finished 3rd → 2 spots off → 3pts
    // LEC: predicted 2nd, finished 2nd → exact        → 10pts
    // NOR: predicted 3rd, finished 1st → 2 spots off → 3pts
    expect(computeGridPoints(userOrder, actualOrder, [10, 7, 3], 3)).toBe(16); // 3 + 10 + 3
  });

  // If you predicted a driver finishing 19th with a depth cap of 18, the pick doesn't count — no matter where they finish.
  it("predicted VER 19th with depth cap 18 → 0pts (prediction beyond cap)", () => {
    const actualOrder = ["VER"];                         // VER finished 1st
    const userOrder   = [...makeOrder(18), "VER"];       // VER slotted 19th — one past the cap
    expect(computeGridPoints(userOrder, actualOrder, [10, 7, 3], 18)).toBe(0);
  });

  // A driver who finished on the grid but wasn't in your predictions at all scores nothing.
  it("VER not in user predictions → 0pts", () => {
    const actualOrder = ["VER"];
    const userOrder: string[] = [];
    expect(computeGridPoints(userOrder, actualOrder, [10, 7, 3], 18)).toBe(0);
  });

  // When the league has no depth cap, predictions at the very bottom of the grid still score if correct.
  it("no depth cap → all 20 picks score (200pts)", () => {
    const actualOrder = makeOrder(20);
    const userOrder   = makeOrder(20);
    expect(computeGridPoints(userOrder, actualOrder, [10, 7, 3], undefined)).toBe(200); // 20 exact matches × 10pts
  });
});

describe("computeWeeklyTeamPoints", () => {
  // All three teams scored differently — each gets their finishing position's points outright.
  it("no tie → Mercedes 22pts, Red Bull 17pts, Ferrari 14pts", () => {
    const entries = [
      { userId: "mercedes", total: 130 },
      { userId: "redbull",  total: 110 },
      { userId: "ferrari",  total: 90  },
    ];
    const result = computeWeeklyTeamPoints(entries, [22, 17, 14, 11, 9, 7]);
    expect(result.get("mercedes")).toBe(22);
    expect(result.get("redbull")).toBe(17);
    expect(result.get("ferrari")).toBe(14);
  });

  // Mercedes and Red Bull both scored 120 — they pool 1st and 2nd place points and split evenly.
  it("2-way tie at 1st → Mercedes and Red Bull each get 19.5pts ((22+17)/2)", () => {
    const entries = [
      { userId: "mercedes", total: 120 },
      { userId: "redbull",  total: 120 },
      { userId: "ferrari",  total: 90  },
    ];
    const result = computeWeeklyTeamPoints(entries, [22, 17, 14, 11, 9, 7]);
    expect(result.get("mercedes")).toBe(19.5); // (22+17)/2
    expect(result.get("redbull")).toBe(19.5);  // (22+17)/2
    expect(result.get("ferrari")).toBe(14);    // unaffected, draws from index 2
  });

  // Mercedes is clear 1st — Red Bull and Ferrari tie for 2nd, pooling 2nd and 3rd place points.
  it("tie in the middle → Mercedes 22pts, Red Bull and Ferrari each 15.5pts ((17+14)/2)", () => {
    const entries = [
      { userId: "mercedes", total: 130 },
      { userId: "redbull",  total: 100 },
      { userId: "ferrari",  total: 100 },
    ];
    const result = computeWeeklyTeamPoints(entries, [22, 17, 14, 11, 9, 7]);
    expect(result.get("mercedes")).toBe(22);   // unaffected by the tie below
    expect(result.get("redbull")).toBe(15.5);  // (17+14)/2
    expect(result.get("ferrari")).toBe(15.5);  // (17+14)/2
  });
});

const scoreEntry = (userId: string, gridPoints: number, propPoints: number) => ({
  userId, gridPoints, propPoints, medal: null, weeklyTeamPoints: 0,
});

describe("computeScoreStats", () => {
  // Three distinct totals — no ties, so highest/lowest each name one player.
  it("no ties → average, single highest, single lowest", () => {
    const entries = [scoreEntry("a", 20, 10), scoreEntry("b", 15, 5), scoreEntry("c", 5, 5)];
    const result = computeScoreStats(entries);
    expect(result.average).toBeCloseTo((30 + 20 + 10) / 3);
    expect(result.highest).toEqual({ value: 30, userIds: ["a"] });
    expect(result.lowest).toEqual({ value: 10, userIds: ["c"] });
  });

  // Two players tie for the top total — both userIds come back, not just one.
  it("tie at the top → highest lists every tied userId", () => {
    const entries = [scoreEntry("a", 20, 10), scoreEntry("b", 25, 5), scoreEntry("c", 5, 5)];
    const result = computeScoreStats(entries);
    expect(result.highest).toEqual({ value: 30, userIds: expect.arrayContaining(["a", "b"]) });
    expect(result.highest.userIds).toHaveLength(2);
  });

  // A single entry collapses average/highest/lowest to the same value — never suppressed.
  it("single entry → average, highest, and lowest all equal that entry's total", () => {
    const entries = [scoreEntry("a", 12, 8)];
    const result = computeScoreStats(entries);
    expect(result.average).toBe(20);
    expect(result.highest).toEqual({ value: 20, userIds: ["a"] });
    expect(result.lowest).toEqual({ value: 20, userIds: ["a"] });
  });

  // No entries at all — degenerate but must not throw or return NaN.
  it("no entries → zeroed stats, no userIds", () => {
    const result = computeScoreStats([]);
    expect(result.average).toBe(0);
    expect(result.highest).toEqual({ value: 0, userIds: [] });
    expect(result.lowest).toEqual({ value: 0, userIds: [] });
  });
});

describe("computeBestPropBet", () => {
  // fastestLap is picked by everyone and gets it right; driverOfDay is picked but nobody's correct.
  it("one prop with a strictly higher hit-rate wins", () => {
    const propKey = {
      driverOfDay: ["HAM"], lapsLed: null, fastestPitStop: null,
      fastestLap: ["VER"], overAchiever: null, underAchiever: null, wrecker: null,
    };
    const picks = [
      { driverOfDay: "LEC", fastestLap: "VER" },
      { driverOfDay: "NOR", fastestLap: "VER" },
    ];
    expect(computeBestPropBet(picks, propKey)).toEqual({ prop: "fastestLap", hitRate: 1 });
  });

  // driverOfDay and fastestLap both land at a 50% hit-rate — canonical PropName order
  // (driverOfDay before fastestLap) breaks the tie.
  it("tied hit-rates → earlier prop in PropName's declared order wins", () => {
    const propKey = {
      driverOfDay: ["HAM"], lapsLed: null, fastestPitStop: null,
      fastestLap: ["VER"], overAchiever: null, underAchiever: null, wrecker: null,
    };
    const picks = [
      { driverOfDay: "HAM", fastestLap: "LEC" },
      { driverOfDay: "LEC", fastestLap: "VER" },
    ];
    expect(computeBestPropBet(picks, propKey)).toEqual({ prop: "driverOfDay", hitRate: 0.5 });
  });

  // A prop with no answer key set is not gradable, even if everyone picked it.
  it("prop with no correct answer set is ineligible", () => {
    const propKey = {
      driverOfDay: null, lapsLed: null, fastestPitStop: null,
      fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null,
    };
    const picks = [{ driverOfDay: "HAM" }];
    expect(computeBestPropBet(picks, propKey)).toBeNull();
  });

  // A prop has a correct answer but nobody picked it — also ineligible.
  it("prop nobody picked is ineligible even with a correct answer set", () => {
    const propKey = {
      driverOfDay: ["HAM"], lapsLed: null, fastestPitStop: null,
      fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null,
    };
    expect(computeBestPropBet([{}], propKey)).toBeNull();
  });

  // Nothing gradable at all this race → null, not a thrown error.
  it("no eligible props at all → null", () => {
    const propKey = {
      driverOfDay: null, lapsLed: null, fastestPitStop: null,
      fastestLap: null, overAchiever: null, underAchiever: null, wrecker: null,
    };
    expect(computeBestPropBet([], propKey)).toBeNull();
  });
});
