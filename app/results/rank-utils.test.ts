import { describe, it, expect } from "vitest";
import { groupEntriesByRank } from "./rank-utils";

type Entry = { userId: string; rank: number };

const entry = (userId: string, rank: number): Entry => ({ userId, rank });

describe("groupEntriesByRank", () => {
  it("maps each unique rank to a single-entry group in the no-ties case", () => {
    const entries = [entry("u-1", 1), entry("u-2", 2), entry("u-3", 3)];

    const byRank = groupEntriesByRank(entries);

    expect(byRank.get(1)).toEqual([entry("u-1", 1)]);
    expect(byRank.get(2)).toEqual([entry("u-2", 2)]);
    expect(byRank.get(3)).toEqual([entry("u-3", 3)]);
  });

  it("keeps every tied entry in the group instead of the last one overwriting the rest", () => {
    // A 2-way tie for 2nd: rank 3 is a legitimate gap (competition ranking),
    // and both rank-2 entries must survive -- this is the exact shape that
    // used to make one of them (and the 3rd podium slot) silently vanish.
    const entries = [entry("u-1", 1), entry("u-2", 2), entry("u-3", 2), entry("u-4", 4)];

    const byRank = groupEntriesByRank(entries);

    expect(byRank.get(1)).toEqual([entry("u-1", 1)]);
    expect(byRank.get(2)).toEqual([entry("u-2", 2), entry("u-3", 2)]);
    expect(byRank.get(3)).toBeUndefined();
    expect(byRank.get(4)).toEqual([entry("u-4", 4)]);
  });

  it("returns an empty map for an empty input", () => {
    expect(groupEntriesByRank([]).size).toBe(0);
  });
});
