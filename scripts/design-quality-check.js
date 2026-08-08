#!/usr/bin/env node

/**
 * CoolHan design-quality-check — mechanical gate for the Design Excellence Standard (v1.7.0).
 *
 * Three checkable failure modes of AI-generated design:
 *   1. house-style repeat  — the chosen direction repeats recent projects
 *                            (< 2 differences vs any of the last 3 history entries across
 *                            {palette_family, display_font, layout_archetype})
 *   2. washed-out-palette  — accent saturation < 50% (HSL) without `"muted":"intentional"`
 *   3. text-wall           — an HTML page with zero visual elements (<img>/<svg>/<picture>/
 *                            <video>/<canvas>/background-image) and no `design:text-only` marker
 *
 * Usage:
 *   node scripts/design-quality-check.js --tokens <tokens.json> [--history <history.json>] [--html <file...>] [--json]
 *
 * tokens.json (subset used here):
 *   { "palette_family": "warm-earth", "accent": "#E85D2F", "display_font": "Fraunces",
 *     "layout_archetype": "split-screen-editorial", "muted": "intentional"? , "muted_rationale": "..."? }
 * history.json: [ {palette_family, display_font, layout_archetype}, ... ] (newest last)
 *
 * Exit: 0 clean · 1 findings · 2 usage error.
 *
 * Honesty: catches sameness, blandness-by-default, and imageless pages — it cannot judge
 * beauty. Final aesthetic judgment stays with the human / HX Vision Critic.
 */

const fs = require('fs');

function hexToHsl(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  return { s: s * 100, l: l * 100 };
}

function checkPalette(tokens) {
  const findings = [];
  const hsl = tokens.accent ? hexToHsl(tokens.accent) : null;
  if (!tokens.accent) {
    findings.push({ rule: 'washed-out-palette', detail: 'no accent color declared in tokens' });
  } else if (!hsl) {
    findings.push({ rule: 'washed-out-palette', detail: `accent "${tokens.accent}" is not a #RRGGBB hex` });
  } else if (hsl.s < 50 && tokens.muted !== 'intentional') {
    findings.push({
      rule: 'washed-out-palette',
      detail: `accent ${tokens.accent} saturation ${hsl.s.toFixed(0)}% < 50% and not declared "muted":"intentional" — pastel-by-default is banned (design-excellence-standard Rule 1b)`
    });
  }
  return findings;
}

function checkDiversity(tokens, history) {
  const findings = [];
  const recent = (history || []).slice(-3);
  const AXES = ['palette_family', 'display_font', 'layout_archetype'];
  for (const h of recent) {
    const diffs = AXES.filter(a => String(tokens[a] || '').toLowerCase() !== String(h[a] || '').toLowerCase()).length;
    if (diffs < 2) {
      findings.push({
        rule: 'house-style-repeat',
        detail: `direction differs from a recent project in only ${diffs}/3 axes (${AXES.join('/')}) — must differ in ≥2 (Rule 3)`
      });
    }
  }
  return findings;
}

const VISUAL_RE = /<img[\s>]|<svg[\s>]|<picture[\s>]|<video[\s>]|<canvas[\s>]|background-image\s*:/i;

function checkHtml(file) {
  let content;
  try { content = fs.readFileSync(file, 'utf8'); } catch (_) { return [{ rule: 'text-wall', detail: `${file}: unreadable` }]; }
  if (content.includes('design:text-only')) return [];
  if (!VISUAL_RE.test(content)) {
    return [{ rule: 'text-wall', detail: `${file}: zero visual elements (no img/svg/picture/video/canvas/background-image) and no "design:text-only" marker — text-only pages must be declared (Rule 4)` }];
  }
  return [];
}

function main(argv) {
  const args = argv.slice(2);
  const json = args.includes('--json');
  const get = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
  const tokensFile = get('--tokens');
  const historyFile = get('--history');
  const htmlIdx = args.indexOf('--html');
  const htmlFiles = htmlIdx >= 0 ? args.slice(htmlIdx + 1).filter(a => !a.startsWith('--')) : [];

  if (!tokensFile && htmlFiles.length === 0) {
    console.error('usage: design-quality-check.js [--tokens <tokens.json> [--history <history.json>]] [--html <file...>] [--json]');
    return 2;
  }

  const findings = [];
  if (tokensFile) {
    let tokens;
    try { tokens = JSON.parse(fs.readFileSync(tokensFile, 'utf8')); }
    catch (e) { console.error(`✗ design-quality-check: cannot read ${tokensFile}: ${e.message}`); return 2; }
    findings.push(...checkPalette(tokens));
    if (historyFile && fs.existsSync(historyFile)) {
      const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      findings.push(...checkDiversity(tokens, history));
    }
  }
  for (const f of htmlFiles) findings.push(...checkHtml(f));

  if (json) {
    console.log(JSON.stringify({ findings, ok: findings.length === 0 }, null, 2));
  } else if (findings.length) {
    console.error(`✗ design-quality-check: ${findings.length} finding(s)`);
    for (const f of findings) console.error(`  [${f.rule}] ${f.detail}`);
  } else {
    console.log('✔ design-quality-check: clean (distinct direction, intentional palette, visual elements present)');
  }
  return findings.length ? 1 : 0;
}

if (require.main === module) process.exit(main(process.argv));

module.exports = { hexToHsl, checkPalette, checkDiversity, checkHtml, main };
