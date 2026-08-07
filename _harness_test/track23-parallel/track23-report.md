# Track 23 — Parallel-dispatch planner (G9) adversarial verification

| Scenario | Input | Expected | Actual | Match |
|---|---|---|---|---|
| A: independent + overlapping + dependent units | `plan-good.json` (U1/U2 disjoint files; U3 overlaps U2's file; U4 deps on U1+U2, no files declared) | U1+U2 parallel wave; U3 serialized (file-overlap); U4 serialized (unknown footprint), after deps | exit 0; wave1=[U1,U2] parallel-safe, wave2=[U3] (serialized vs U2, file-overlap), wave3=[U4] (serialized vs U3, unknown-footprint) | ✅ |
| B: dependency cycle | `plan-cycle.json` (U1↔U2) | structural FAIL, cycle named | exit 1, "dependency cycle among: U1, U2" | ✅ |
| C: unit tests | 8 cases (disjoint-parallel, dep-wave, overlap-serialize, unknown-footprint-never-parallel, cycle, missing-dep, empty, diamond) | 8/8 | jest 8/8 pass | ✅ |

0 false positives (no conflicting pair ever shared a wave; unknown footprint never parallelized),
0 false negatives (genuinely disjoint units were parallelized, not needlessly serialized).
Real script output captured in `_workspace/{good,cycle}-result.json`.

**Verdict:** PASS — waves are dependency-correct and file-conflict-free; the unsafe default
(unknown footprint → serialize) holds under pressure.

**Honest bound:** parallel-safety is computed from DECLARED deps/files only. Undeclared coupling
(shared runtime state, implicit ordering) is invisible to this gate — which is why validation of
each worker's output remains serial and mandatory (Validator gate unchanged), and why a wave is
complete only when every unit in it is individually validated.
