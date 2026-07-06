# Track 17 — G5 Run-Ledger Adversarial Verification Report

Ledger under test: `_harness_test/track17-ledger/ledger.jsonl` (fresh, deleted before run).
All commands executed for real via Bash tool from repo root `C:/sites/CoolHan builder`. No output hand-written.

## Setup — appended entries (real CLI calls, all exit=0)
```
r1 security FAIL u1        reason="hardcoded secret"  t1
r2 security FAIL u2-auth   reason="hardcoded secret"  t2   (same gate+reason as r1 -> recurring pair, count=2)
r3 validator PASS u3       t3
r4 validator FAIL u4-login reason="stage 9 regression" t4
r5 plan     FAIL u5        reason="missing verifies command" t5  (one-off pair, count=1)
r6 security PASS u6        t6
```

## Case 1 — `lessons --min 2 --json`
Command: `node scripts/ledger.js lessons --min 2 --file <ledger> --json`
Real output:
```json
[{"gate":"security","reason":"hardcoded secret","count":2,
  "occurrences":[{"run_id":"r1","unit":"u1","timestamp":"t1"},
                 {"run_id":"r2","unit":"u2-auth","timestamp":"t2"}]}]
```
exit=0. Recurring (security, "hardcoded secret") present with count=2. One-off (plan, "missing verifies command") absent (count=1 < min 2, correctly excluded).
**Verdict: PASS**

## Case 2 — `query` filters
- `--gate security --json` → 3 entries returned (r1, r2, r6) — exactly the 3 security-gate entries appended, no others. exit=0.
- `--status FAIL --json` → 4 entries returned (r1, r2, r4, r5) — exactly the 4 FAIL entries appended (r3, r6 PASS correctly excluded). exit=0.
- `--unit auth --json` → 1 entry returned (r2, unit="u2-auth") — exact substring match, no false matches. exit=0.
**Verdict: PASS** (all three filters returned exactly the expected subset, verified against what was appended)

## Case 3 — Append-only guarantee
- Captured `before.txt` = copy of ledger before append (6 lines).
- Appended 1 entry (r7) → file grew to 7 lines, exit=0.
- `head -n 6 <ledger-after>` vs `before.txt` → `diff` returned **no differences** ("PREFIX MATCH: identical").
- New line (r7) appended strictly at end; last line of file == new entry.
**Verdict: PASS** — byte-exact prefix preserved, no earlier line modified/reordered/removed.

## Case 4 — Malformed append rejected, no corruption
Line count before: 7.
- Missing `gate` field → real stderr: `ledger: ledger.append: entry requires at least {gate, status}`, **exit=2**.
- Missing `status` field → same error message, **exit=2**.
- Unparsable JSON (`{gate: security, status: FAIL`) → real stderr: `ledger: cannot parse entry JSON: Expected property name or '}' in JSON at position 1...`, **exit=2**.
Line count after all 3 attempts: still **7** (unchanged). Parsed every line with `JSON.parse` in a `node -e` script: `total lines: 7 all valid JSON: true`.
**Verdict: PASS** — all 3 malformed attempts rejected pre-write with non-zero exit; zero partial/garbage lines written; all existing lines remain valid JSON.

## Wiring review — advisory-only, lessons-before, append-after

**plan-reviewer.md** (`.claude/agents/plan-reviewer.md`, lines 45-51, section "Run Ledger (G5) — advisory only"):
> "Before reviewing: `node scripts/ledger.js lessons --min 2` — check for recurring `plan`-gate failure patterns from past runs. Surface any match as an advisory note... This is a correlation, not a proven cause; it never substitutes for actually reviewing this plan."
> "After reviewing: `node scripts/ledger.js append '{"run_id":"...","unit":"...","gate":"plan","status":"PASS|FAIL","reason":"..."}'` to record this gate's outcome for future lessons queries."
- (a) Advisory only, never blocks: confirmed — no verdict/gate section references the ledger; gate is driven solely by `structural_status`/`open_risks` (lines 70-76).
- (b) lessons() before review: confirmed (Before reviewing).
- (c) append() after verdict: confirmed (After reviewing).

**security-reviewer.md** (`.claude/agents/security-reviewer.md`, lines 41-46, section "Run Ledger (G5) — advisory only"):
> "Before reviewing: `node scripts/ledger.js lessons --min 2` — check for recurring `security`-gate failure patterns from past runs... Surface a match as an advisory note; it is a correlation across runs, not a substitute for this review."
> "After reviewing: `node scripts/ledger.js append '{"run_id":"...","unit":"...","gate":"security","status":"PASS|FAIL","reason":"..."}'` to record this gate's outcome (reason = the failing category, e.g. "hardcoded secret")."
- (a) Advisory only: confirmed — gate section (lines 56-58) is driven only by P0 category fail/pass, no ledger reference.
- (b) lessons() before review: confirmed.
- (c) append() after verdict: confirmed.

**validator.md** (`.claude/agents/validator.md`, lines 28-32, item 6 under core principles):
> "6. Run ledger (G5), advisory: after the final PASS/FAIL, append the outcome — `node scripts/ledger.js append '{"run_id":"...","unit":"...","gate":"validator","status":"PASS|FAIL","reason":"..."}'` (reason = the failing stage, e.g. "stage 6 security" or "stage 9 regression"). This builds the shared history Plan Reviewer/Security Reviewer query for recurring patterns — it does not change this validation's own verdict."
- (a) Advisory only / never overrides: confirmed explicitly ("it does not change this validation's own verdict").
- (c) append after verdict: confirmed ("after the final PASS/FAIL").
- (b) N/A for validator — validator is not specified to call `lessons()` before its own review (only plan-reviewer and security-reviewer are; validator is the downstream consumer whose failures feed those upstream lessons queries). This matches the task's own framing ("plan-reviewer and security-reviewer call lessons() before review; validator appends after") — no defect.

## Defects found
None. `ledger.js` behaved exactly per its own documented contract in all 4 cases; all 3 agent files match the required advisory-only / lessons-before / append-after wiring with exact quoted lines.

## Tally
- False positives (claimed pass without supporting evidence): **0**
- False negatives (missed/under-reported real defect): **0**
- Cases run: 4/4 PASS. Wiring checks: 3/3 files confirmed (a)(b)(c) as specified.

## Overall verdict: PASS
