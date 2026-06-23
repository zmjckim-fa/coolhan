#!/usr/bin/env python3
"""HX Renderer — renders the screen close to a real device and captures screenshots.

Produces the input for the vision critic (hx-vision-critic). To prevent "judging by
reading code only" (checklist theater), it leaves the actual render result as evidence.
Runs unattended without human clicks.

★ Why device emulation rather than simply "shrinking the window":
  Even shrinking a PC browser window to 360px looks different from a real mobile device. Reasons —
  differences in engine (iOS=WebKit, desktop=Blink)·DPR (high resolution)·UA·touch/hover·scrollbar width.
  So for mobile we use WebKit+iPhone device, and for tablet/Android Chromium+device profile,
  applying real UA/DPR/touch/isMobile to approximate reality as closely as possible.
  Note: it is still 'emulation' and not 100% a real device — true confidence comes from a real device/cloud device farm.

Usage:
  python hx_render.py <url-or-file> <out-dir> [--id ID]

Depends on: playwright (pip install playwright && playwright install chromium webkit).
If not installed/no engine, prints guidance + exit code 3 → orchestrator handles it as NOT_RUN.
"""
import sys
import os
import pathlib

# (label, engine, device profile name | None=desktop viewport, width, height)
TARGETS = [
    ("mobile-ios", "webkit", "iPhone 13", None, None),       # iOS Safari engine
    ("mobile-android", "chromium", "Pixel 7", None, None),   # Android Chrome engine
    ("tablet-ipad", "webkit", "iPad (gen 7)", None, None),
    ("desktop", "chromium", None, 1280, 900),                # desktop viewport
]


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        print("usage: hx_render.py <url-or-file> <out-dir> [--id ID]")
        return 2
    target, out_dir = args[0], args[1]
    rid = "render"
    if "--id" in sys.argv:
        rid = sys.argv[sys.argv.index("--id") + 1]

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("PLAYWRIGHT_MISSING: pip install playwright && playwright install chromium webkit")
        return 3

    pathlib.Path(out_dir).mkdir(parents=True, exist_ok=True)
    url = target
    if not target.startswith(("http://", "https://")):
        url = pathlib.Path(target).resolve().as_uri()

    shots, errors = [], []
    with sync_playwright() as p:
        engines = {}
        try:
            for label, engine, device, w, h in TARGETS:
                if engine not in engines:
                    try:
                        engines[engine] = getattr(p, engine).launch()
                    except Exception as e:
                        errors.append(f"{engine} not installed/cannot run: {e}")
                        continue
                browser = engines.get(engine)
                if not browser:
                    continue
                if device:
                    ctx = browser.new_context(**p.devices[device])  # real UA/DPR/touch/isMobile
                else:
                    ctx = browser.new_context(viewport={"width": w, "height": h})
                page = ctx.new_page()
                page.goto(url, wait_until="networkidle")
                out = os.path.join(out_dir, f"hx-{rid}-{label}.png")
                page.screenshot(path=out, full_page=True)
                shots.append(out)
                ctx.close()
        finally:
            for b in engines.values():
                b.close()

    for s in shots:
        print(f"SHOT: {s}")
    for e in errors:
        print(f"WARN: {e}")
    if not shots:
        print("NO_SHOTS: engine installation required → playwright install chromium webkit")
        return 3
    print(f"OK: {len(shots)} screenshots (device-emulated; a 100% real device requires a cloud device farm)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
