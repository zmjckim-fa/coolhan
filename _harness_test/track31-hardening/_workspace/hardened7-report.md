# Production Hardening Probe — http://127.0.0.1:50355 — verdict: PASS

- ✅ H2_stack_fingerprint: no known stack-fingerprint headers
- ✅ H1_ai_agent_bypass: AI agent UAs not served plain HTML
- ✅ H3_express_404_leak: neutral 403 on bogus /api path (no "Cannot GET" body)
- ✅ H4_ua_consistency: incoherent Chrome header set not served plain HTML (403)
- ✅ H5_robots_ai_blocked: robots.txt disallows the AI crawlers (10/10)
- ✅ H6_automation_tools: automation clients (python-requests/HeadlessChrome/curl/Go/Scrapy) not served plain HTML
- ✅ H7_search_index_preserved: search/social crawlers (Googlebot/Bingbot/Yeti/Daum/facebookexternalhit) stay 200

> A FAIL is a measurement — read the middleware/robots/nginx source to confirm which side
> is wrong before fixing. Proves these 5 known holes are closed on the probed origin now,
> not that the site is secure.
