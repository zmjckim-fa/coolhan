#!/usr/bin/env python3
"""HX Renderer — 화면을 실제 디바이스에 가깝게 렌더하여 스크린샷 생성.

비전 크리틱(hx-vision-critic)의 입력을 만든다. "코드만 읽고 판정"(체크리스트 연극)을
막기 위해 실제 렌더 결과를 증거로 남긴다. 사람 클릭 없이 무인 실행됨.

★ 왜 단순 "창 줄이기"가 아니라 디바이스 에뮬레이션인가:
  PC 브라우저 창을 360px로 줄여도 실제 모바일과 다르게 보인다. 이유 —
  엔진(iOS=WebKit, 데스크톱=Blink)·DPR(고해상도)·UA·터치/호버·스크롤바 폭 차이.
  그래서 모바일은 WebKit+iPhone 디바이스, 태블릿/안드로이드는 Chromium+디바이스 프로필로
  실 UA/DPR/터치/isMobile 을 적용해 실제에 최대한 근접시킨다.
  ※ 그래도 '에뮬레이션'이며 실기기 100%는 아니다 — 진짜 확신은 실기기/클라우드 디바이스팜.

사용:
  python hx_render.py <url-or-file> <out-dir> [--id ID]

의존: playwright (pip install playwright && playwright install chromium webkit).
미설치/엔진없음 시 안내 출력 + 종료코드 3 → 오케스트레이터가 NOT_RUN 처리.
"""
import sys
import os
import pathlib

# (라벨, 엔진, 디바이스 프로필명 | None=데스크톱 뷰포트, 폭, 높이)
TARGETS = [
    ("mobile-ios", "webkit", "iPhone 13", None, None),       # iOS Safari 엔진
    ("mobile-android", "chromium", "Pixel 7", None, None),   # Android Chrome 엔진
    ("tablet-ipad", "webkit", "iPad (gen 7)", None, None),
    ("desktop", "chromium", None, 1280, 900),                # 데스크톱 뷰포트
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
                        errors.append(f"{engine} 미설치/실행불가: {e}")
                        continue
                browser = engines.get(engine)
                if not browser:
                    continue
                if device:
                    ctx = browser.new_context(**p.devices[device])  # 실 UA/DPR/터치/isMobile
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
        print("NO_SHOTS: 엔진 설치 필요 → playwright install chromium webkit")
        return 3
    print(f"OK: {len(shots)} screenshots (device-emulated; 실기기 100%는 클라우드 디바이스팜 필요)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
