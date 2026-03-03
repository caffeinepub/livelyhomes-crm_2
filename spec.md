# LivelyHomes CRM

## Current State

Full CRM with leads, dispositions, dashboard, export/import CSV. Backend uses Motoko with `mo:core/Map`, `mo:core/Array`, `mo:core/Text`. The `getDashboardStats` function has two bugs:
1. Calls `.filter()` directly on a Motoko array (arrays don't have that method — must use `Array.filter<T>(arr, predicate)`)
2. Calls `l.status.contains(#text(...))` on a Text value (must be `Text.contains(l.status, #text(...))`)

These compile errors prevent the canister from deploying, causing all backend calls (including `addLead`) to fail with an error.

## Requested Changes (Diff)

### Add
- Nothing new

### Modify
- Fix `getDashboardStats` in backend: use `Array.filter<Lead>(allLeads, func(l) { ... })` instead of `allLeads.filter(...)`, and `Text.contains(l.status, #text("..."))` instead of `l.status.contains(#text("..."))`

### Remove
- Nothing

## Implementation Plan

1. Regenerate backend Motoko with corrected `getDashboardStats` — all other functions remain identical.
2. Keep frontend unchanged (no API changes).
3. Deploy.
