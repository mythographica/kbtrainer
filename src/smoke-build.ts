// Build-time switch for the smoke harness (reports/domain-wiring.md §3d):
// the committed state is FALSE — a normal build does not even LOAD the
// harness when KBT_SMOKE is set. `npm run build:smoke` flips this to true
// for one build (and restores it), producing a smoke-capable dist.
export const SMOKE_BUILT = false;
