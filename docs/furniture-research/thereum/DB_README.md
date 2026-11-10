# thereum 카탈로그 DB (thereum_catalog.sqlite)

수집일 2026-11-02~03. 공개 상품 **848개**와 로그인(회원) 세션에서 읽은 회원 전용 상품 **32개**(총 880개)의 이름·가격·구성·옵션(색상)·부품(추가구성상품)·상품 설명·구성기 이미지 주소·치수를 SQLite로 정리했다. 재생성: `node build-db.js` (Node 22.5+ `node:sqlite`), 검증: `node verify-db.js`(25/25 PASS).

## 범위와 한계 (먼저 읽을 것)
| 항목 | 상태 |
|---|---|
| 공개 상품 848개 | **전부 수집** (카테고리 목록 + sitemap 803개 전부 포함 + 상품번호 1~9000 전수 조회(4201~9000은 해당 없음)) |
| 회원 전용 상품 975개(번호 조회) | 회원 로그인 세션(사용자가 직접 로그인)에서 분류: **개인결제창 901개**(고객별 결제 페이지, 수집·저장 안 함), 접근 불가 42개, **실제 상품 32개 → DB에 추가**(`products.access='members_only'`, 카테고리 35 CUSTOM ORDER). 32개는 확장시공·맞춤 구성 상품이며 설명 문구·색상 옵션 없음, 이노스 5칸(국내재고 +344,000, 14색)만 추가구성 |
| 상품 설명 | 838개 보유, 10개는 사이트 자체에 설명 없음(53, 55, 659, 741, 1159, 1163, 1168, 1175, 1951, 1952) |
| 이미지 | **파일은 받지 않았다.** 구성기 이미지 주소 19,278건(전부 webp)만 참조용으로 저장 |
| 재고 수량 | 사이트가 노출하는 값만 저장(대부분 0, 신뢰 불가). 실재고는 미확인 |
| 가격 기준 | 사이트 표시가(KRW, VAT 포함). 회원 로그인 후 가격은 다를 수 있음(미확인) |

**저작물 주의**: `products.description`은 출처 사이트의 문구 원문이다. 같은 문구를 우리 쇼핑몰에 그대로 게시하면 저작권 문제가 될 수 있으므로, 게시 전에 자체 문구로 다시 쓰고(구성·치수 같은 사실 정보는 유지) 이미지도 자체 촬영/렌더 또는 공급사 제공 자료를 써야 한다.

## 테이블
| 테이블 | 행 | 내용 |
|---|---|---|
| `brands` | 1 | 유에스엠 할러 |
| `categories` | 10 |  81 일반배송, 82 빠른배송, 83 테이블, 34 리퍼브, 85~89 가로1~4단, 84 Size(전체), 35 CUSTOM ORDER(회원 전용) |
| `products` | 880 (공개 848 + 회원 전용 32) — `name`=정식 상품명("{구성} {종류}"), `name_display`=태그 포함 표시명, `name_site`=사이트 원래 이름 | 상품번호·코드·이름·태그·판매/소비자/최적할인가·구성(grid_cols×grid_rows, panel_mode)·납기·설명 |
| `product_categories` | 1,675 | 상품↔카테고리 |
| `colors` | 19 | 표준 14색(hex·구성기 코드) + 테이블 상판 등 |
| `product_colors` | 11,318 | **판매 SKU**(색상 옵션 1건 = SKU 1건), `item_code`(예 P0000FKG000D), 단가, "5주 소요예정" 안내, 재고 플래그 |
| `addon_products` | 811 | 추가구성상품(부품 상품·이노스 5칸) |
| `product_addons` | 1,721 | 상품↔부품 상품 연결 |
| `addon_options` | 141,039 | 부품 옵션(옵션→상세 2단) + 단가. **사이트에 표시·판매 중인 행은 24,189개**(`is_display='T'`), 나머지 116,850개는 사이트가 숨겨 둔 템플릿 행 |
| `viewer_assets` | 19,278 | 구성기 이미지 키·URL(색×시점, 열림, 바퀴, 유리, 박스 인서트) |
| `viewer_bases` | 792 | 바퀴 구성별 추가금 |
| `viewer_dimensions` | 468 | 구성기 치수(가로·높이·깊이 mm) |

뷰: `v_product_price_summary`, `v_sellable_sku`, `v_addon_catalog`(표시·판매 중인 부품 옵션만).

## 주문 금액 계산(사이트 동작과 동일하게 검증됨)
`합계 = product_colors.unit_price(선택 색상) + Σ addon_options.unit_price(선택 부품) × 수량`
예) 상품 3646 퓨어 화이트 3,247,000 + [열쇠핸들로 교체 / 도어 1개] 100,000 = **3,347,000원**(사이트에서 직접 선택해 확인).

## 자주 쓰는 질의
```sql
-- 상품 1개의 색상 SKU와 단가
SELECT item_code, option_value, unit_price FROM product_colors WHERE product_no = 3646;
-- 상품 1개에서 고를 수 있는 부품(표시 중)
SELECT addon_product, level1_value, level2_value, unit_price FROM v_addon_catalog WHERE product_no = 3646 ORDER BY 2,3;
-- 구성별(가로칸×세로단) 가격표
SELECT grid_cols, grid_rows, panel_mode, price FROM products WHERE kind='grid' AND fulfilment='made_to_order' ORDER BY 1,2,3;
```

## 데이터에서 알게 된 규칙
- 제작주문(405)·국내재고(409)·리퍼브(34). 같은 이름의 국내재고 가격은 제작주문 가격의 **×1.028**(397쌍, 1.0275~1.0288).
- 국내재고 443개는 **소비자가 > 판매가**(판매가/소비자가 평균 0.96, 범위 0.84~0.97), 제작주문은 소비자가 = 판매가. 최적할인가는 판매가의 약 4% 아래(무통장·회원).
- 구성(가로칸 m × 세로단 n)이 도어형/도어없음/오픈 중 하나로 통일된 이름이면 가격은 거의 정확히 `상수 + a·m + b·n + c·m·n`이다(R² 0.9994~0.9999, 최대 오차 1.6~2.8%). 계수: 도어형 40,700 + 212,240·m + 157,800·n + 798,340·m·n / 도어없음 26,810 + 215,780·m + 161,340·n + 429,258·m·n / 오픈 46,061 + 216,412·m + 79,218·n + 289,825·m·n. (`price-model.js`)
- 색상에 따라 단가가 달라지는 상품은 29개(테이블 상판 등).
- 이노스 5칸은 2종: 제작주문 325,000 / 국내재고 344,000, 각 14색.

## 파일
`thereum_catalog.sqlite`(27MB) · `export/*.csv`(UTF-8 BOM) · `products.json`(크롤 원본) · `addons-raw.json` · `assets-inventory.json` · `descriptions-raw.json` · `colors.json` · `probe-ids.json` · `price-model.json` · 스크립트 `crawl*.js`, `build-db.js`, `verify-db.js`, `export-csv.js`, `price-model.js`, `probe-ids.js`.
