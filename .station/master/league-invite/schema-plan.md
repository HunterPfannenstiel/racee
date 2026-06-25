# League Membership Schema Plan

## Overview

Introduce explicit league membership so that participation in a league is gated — players must be a member before they can join teams, make predictions, etc. This lays the groundwork for future invite/link-based onboarding but does not implement the invite mechanism itself.

## Schema Change

### League Domain

Add a `memberIds: string[]` array to the league model alongside the existing `commissionerId` and `coCommissionerIds[]`.

- Every participant in the league is in `memberIds[]`, including the commissioner and co-commissioners.
- `memberIds[]` is the single source of truth for "who is in this league."
- Commissioner/co-commissioner status remains a separate concept (role vs. membership).

## Migration

Backfill `memberIds[]` for every existing league by deduplicating the union of:

1. `commissionerId`
2. `coCommissionerIds[]`
3. All `memberIds[]` from every team in the league

## Behavioral Changes

- **Adding a commissioner or co-commissioner** also adds them to `memberIds[]`.
- **Removing a member** also removes them from any team in the league and strips co-commissioner role if applicable.
- **Joining a team** is gated by league membership — user must be in `memberIds[]` first.

## New Operations

- **Add member(s) to league** — appends user IDs to `memberIds[]`.
- **Remove member from league** — removes from `memberIds[]`, cascades to team removal and co-commissioner demotion.
- **List league members** — existing query updated to pull from the new `memberIds[]` array.

## Storage

All changes stay in blob storage, consistent with the existing architecture. No new blob files needed — `memberIds[]` lives on the league blob in `leagues.json`.
