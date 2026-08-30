# Production Hardening Probe — http://127.0.0.1:50357 — verdict: FAIL

- ❌ H2_stack_fingerprint: stack fingerprint leaked in headers: x-powered-by: Next.js · x-nextjs-cache: HIT (note: framework still inferable from asset paths e.g. /_next/ — removing the header is finishing work, not concealment)
    ↳ fix: operator-approval (server-file: web-server Header unset OR server next.config.js; app middleware delete is re-attached downstream)
- ❌ H1_ai_agent_bypass: AI agent UAs served a 200 HTML page (allowlist-before-blocklist?): ChatGPT-User, Claude-User, PerplexityBot, OAI-SearchBot, GPTBot
- ❌ H3_express_404_leak: Express default 404 body leaked: "Cannot GET /api/__coolhan_probe_xyz"
- ❌ H4_ua_consistency: UA claims Chrome but sec-ch-ua + sec-fetch-mode both absent, yet served 200 HTML (200) — UA-only spoofing passes
- ❌ H5_robots_ai_blocked: robots.txt does not disallow AI crawlers: GPTBot, ChatGPT-User, ClaudeBot, Claude-User, anthropic-ai, PerplexityBot, Google-Extended, CCBot, Bytespider, Amazonbot
- ❌ H6_automation_tools: automation clients served 200 HTML: python-requests, HeadlessChrome-UA, curl, Go-http-client, Scrapy
- ✅ H7_search_index_preserved: search/social crawlers (Googlebot/Bingbot/Yeti/Daum/facebookexternalhit) stay 200

> A FAIL is a measurement — read the middleware/robots/nginx source to confirm which side
> is wrong before fixing. Proves these 5 known holes are closed on the probed origin now,
> not that the site is secure.
