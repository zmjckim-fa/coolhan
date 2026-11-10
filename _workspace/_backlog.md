# Backlog — run_id 20261029-00module-specs (00Module_site 모듈 명세 B03~B26)

목표: `C:/sites/00Module_site/atlas/CLASSIFICATION.md` §6 묶음 26개 중 명세가 없는 22개를 B01·B02·B05·B15와 같은 방식(사이트 코드 검증 → `_specs/Bnn-*.md` + `_specs/modules.json` v2 칸 → `node tools/check-specs.mjs` 오류 0 → 커밋)으로 끝낸다. 추출(코드 생성)은 범위 밖. 내 작업이 아닌 00Module_site 변경 5파일은 건드리지 않는다.

| # | Unit | Files | Verification | Status |
|---|------|-------|--------------|--------|
| U1 | B03 관리자 셸 | 00Module_site/_specs/B03-관리자-셸.md, modules.json admin-shell/* | 사이트 코드 검증 ≥3 + 주장 대조 + check-specs 오류 0 + 커밋 | ✅ done (커밋, check-specs 오류 0) |
| U2 | B04 마이페이지 셸 | _specs/B04-마이페이지-셸.md, mypage/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U3 | B06 문서양식 | _specs/B06-문서양식.md, docforms/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U4 | B07 결제 | _specs/B07-결제.md, payments/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U5 | B08 알림 | _specs/B08-알림.md, notify/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U6 | B09 외부 연동 일반형 | _specs/B09-외부연동.md, integration/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U7 | B10 원장·증거 | _specs/B10-원장-증거.md, ledger/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U8 | B11 콘텐츠·SEO·i18n | _specs/B11-콘텐츠-SEO-i18n.md, content/* seo/* i18n/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U9 | B12 통계 | _specs/B12-통계.md, stats/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U10 | B13 문의·메시지·파일 | _specs/B13-문의-파일.md, messages/* files/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U11 | B14 운영·설정·감사·개점 게이트 | _specs/B14-운영-설정-게이트.md, ops/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U12 | B16 택배·이사·보관 신청서 인스턴스 | _specs/B16-택배-이사-보관.md, logistics/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U13 | B17 파트너·정산 | _specs/B17-파트너-정산.md, partner/* | 동일 | ✅ done (커밋 359e1d5, check-specs 오류 0) |
| U14 | B18 카탈로그·품목·재고 | _specs/B18-카탈로그-재고.md, catalog/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U15 | B19 마켓 업로드 어댑터 | _specs/B19-마켓-업로드.md, market-upload/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U16 | B20 전자청구·회계 | _specs/B20-전자청구-회계.md, einvoice/* accounting/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U17 | B21 세무 신고 | _specs/B21-세무-신고.md, tax-filing/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U18 | B22 테넌트 프로비저닝·관제 | _specs/B22-테넌트-관제.md, tenant/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U19 | B23 WMS·3PL | _specs/B23-WMS-3PL.md, wms/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U20 | B24 AI 중계·계량 | _specs/B24-AI-중계.md, ai-relay/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U21 | B25 전문가 서비스·생활정보 | _specs/B25-전문가-생활정보.md, portal/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
| U22 | B26 환불·예치금·포인트·쿠폰 | _specs/B26-환불-예치금-포인트.md, refunds/* wallet/* loyalty/* | 동일 | ✅ done (커밋, check-specs 오류 0) |
