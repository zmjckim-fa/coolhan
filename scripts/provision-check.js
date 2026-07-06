#!/usr/bin/env node

/**
 * CoolHan provision-check — environment/secret readiness gate BEFORE execution (G6).
 *
 * G1 (exec-runner) honestly reports NOT_RUN when a TOOL is missing. It has no concept of missing
 * ENVIRONMENT: a stack with every tool installed can still fail because a required env var/config
 * was never set — and that currently surfaces as a generic install/test FAILED, indistinguishable
 * from a real code defect. This gate runs first: it reads a project's declared required env vars
 * (from `.env.example` / `.env.sample` — one `KEY=` per non-comment line) and checks which are
 * present. Missing vars are reported by NAME ONLY.
 *
 * Security invariant (P0): this module never reads or reports an env var's VALUE — only the key
 * name and a presence boolean. It must be safe to log/append this output anywhere (ledger, evidence
 * files) without leaking a secret.
 *
 * No .env.example/.env.sample found → nothing is required → passes trivially (not an error; this is
 * a readiness check, not a provisioner — it never creates infrastructure or secrets).
 *
 * Usage:
 *   node scripts/provision-check.js <dir> [--json]
 * Exit: 0 if all required vars present (or none required); 1 if any required var missing/empty.
 */

const fs = require('fs');
const path = require('path');

const EXAMPLE_FILENAMES = ['.env.example', '.env.sample'];

/** Extract required key names from an env-example file's contents. Values are never returned. */
function extractRequiredKeys(fileContents) {
  const keys = [];
  for (const rawLine of fileContents.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    keys.push(line.slice(0, eq).trim());
  }
  return keys;
}

function findExampleFile(dir) {
  for (const name of EXAMPLE_FILENAMES) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Evaluate readiness. `env` defaults to process.env but accepts an injected object for testability.
 * Empty-string values count as missing (declared but not actually configured).
 */
function evaluate(dir, env = process.env) {
  const exampleFile = findExampleFile(dir);
  if (!exampleFile) {
    return { example_file: null, required: [], present: [], missing: [], ok: true };
  }
  const contents = fs.readFileSync(exampleFile, 'utf8');
  const required = extractRequiredKeys(contents);
  const present = [];
  const missing = [];
  for (const key of required) {
    const val = env[key];
    if (val !== undefined && val !== '') present.push(key);
    else missing.push(key);
  }
  return { example_file: exampleFile, required, present, missing, ok: missing.length === 0 };
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const dir = args.find(a => !a.startsWith('--')) || process.cwd();

  const ev = evaluate(dir);

  if (json) console.log(JSON.stringify(ev, null, 2));
  else {
    console.log(`provision-check: ${dir} — ${ev.example_file ? `${ev.required.length} required (from ${ev.example_file})` : 'no .env.example/.env.sample — nothing required'}`);
    if (ev.missing.length) console.log(`  ✗ missing required env var(s): ${ev.missing.join(', ')}`);
    console.log(ev.ok
      ? '✔ environment ready (all required vars present, or none required)'
      : '✗ provision gate FAILED — set the missing env var(s) before running (values never shown here)');
  }
  return ev.ok ? 0 : 1;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { evaluate, extractRequiredKeys, findExampleFile, main };
