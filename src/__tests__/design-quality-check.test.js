const fs = require('fs');
const os = require('os');
const path = require('path');
const { hexToHsl, checkPalette, checkDiversity, checkHtml } = require('../../scripts/design-quality-check');

describe('design-quality-check (design excellence gate)', () => {
  let dir;
  beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'design-check-')); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  test('hexToHsl: vivid red is high-saturation, gray is zero', () => {
    expect(hexToHsl('#E82F2F').s).toBeGreaterThan(70);
    expect(hexToHsl('#808080').s).toBe(0);
    expect(hexToHsl('not-a-hex')).toBeNull();
  });

  test('washed-out pastel accent without declaration is flagged', () => {
    const f = checkPalette({ accent: '#C9BFD8' }); // low-sat lavender pastel
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('washed-out-palette');
  });

  test('vivid accent passes', () => {
    expect(checkPalette({ accent: '#E85D2F' })).toHaveLength(0);
  });

  test('muted palette declared intentional passes', () => {
    expect(checkPalette({ accent: '#C9BFD8', muted: 'intentional' })).toHaveLength(0);
  });

  test('missing accent is flagged', () => {
    expect(checkPalette({})[0].rule).toBe('washed-out-palette');
  });

  test('house-style repeat: <2 axis differences vs recent history fails', () => {
    const history = [{ palette_family: 'warm-earth', display_font: 'Fraunces', layout_archetype: 'split' }];
    const f = checkDiversity({ palette_family: 'warm-earth', display_font: 'Fraunces', layout_archetype: 'grid' }, history);
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('house-style-repeat');
  });

  test('direction differing in 2+ axes passes diversity', () => {
    const history = [{ palette_family: 'warm-earth', display_font: 'Fraunces', layout_archetype: 'split' }];
    const f = checkDiversity({ palette_family: 'cool-tech', display_font: 'Space Grotesk', layout_archetype: 'split' }, history);
    expect(f).toHaveLength(0);
  });

  test('only the last 3 history entries constrain', () => {
    const old = { palette_family: 'warm-earth', display_font: 'Fraunces', layout_archetype: 'split' };
    const history = [old,
      { palette_family: 'a', display_font: 'b', layout_archetype: 'c' },
      { palette_family: 'd', display_font: 'e', layout_archetype: 'f' },
      { palette_family: 'g', display_font: 'h', layout_archetype: 'i' }];
    const f = checkDiversity(old, history); // identical to entry now outside the window
    expect(f).toHaveLength(0);
  });

  test('text-wall: HTML with zero visual elements is flagged', () => {
    const p = path.join(dir, 'page.html');
    fs.writeFileSync(p, '<html><body><h1>Title</h1><p>Only text here.</p></body></html>');
    const f = checkHtml(p);
    expect(f).toHaveLength(1);
    expect(f[0].rule).toBe('text-wall');
  });

  test('inline SVG counts as a visual element', () => {
    const p = path.join(dir, 'page.html');
    fs.writeFileSync(p, '<body><svg viewBox="0 0 10 10"><circle r="4"/></svg><p>text</p></body>');
    expect(checkHtml(p)).toHaveLength(0);
  });

  test('css background-image counts as a visual element', () => {
    const p = path.join(dir, 'page.html');
    fs.writeFileSync(p, '<body><style>.hero{background-image:url(x.jpg)}</style><p>t</p></body>');
    expect(checkHtml(p)).toHaveLength(0);
  });

  test('declared text-only page is exempt', () => {
    const p = path.join(dir, 'terms.html');
    fs.writeFileSync(p, '<!-- design:text-only (terms of service) --><body><p>legal text</p></body>');
    expect(checkHtml(p)).toHaveLength(0);
  });
});
