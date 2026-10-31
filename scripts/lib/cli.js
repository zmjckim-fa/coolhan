/**
 * CoolHan shared CLI argument helpers (S8 공용 라이브러리 — one arg parser instead of one per script).
 * New scripts use this; existing scripts (their local `get`/`parseFlags`) migrate when touched (§4-d).
 */

/** Value of `--name <value>` or undefined. */
function argValue(args, name) { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; }

/** Comma-separated `--name a,b,c` → ['a','b','c'] or undefined. */
function argList(args, name) { const v = argValue(args, name); return v === undefined ? undefined : v.split(',').map(s => s.trim()).filter(Boolean); }

/** First positional argument: not a flag and not the value of one of `valueFlags`. */
function positional(args, valueFlags = []) {
  const set = new Set(valueFlags);
  return args.find((a, i) => !a.startsWith('--') && !set.has(args[i - 1]));
}

module.exports = { argValue, argList, positional };
