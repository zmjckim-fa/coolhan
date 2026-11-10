# -*- coding: utf-8 -*-
"""thereum 분석·카탈로그 자료를 하나의 엑셀 통합문서로 정리한다. (수식 없음: 모든 값은 DB/크롤 결과에서 계산한 정적 값)
실행: python build_xlsx.py   → ../thereum_쇼핑몰_개발자료.xlsx
"""
import json, re, sqlite3, os
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

HERE = os.path.dirname(os.path.abspath(__file__))
FR = os.path.dirname(HERE)                      # docs/furniture-research
TH = os.path.join(FR, 'thereum')
OUT = os.path.join(FR, 'thereum_쇼핑몰_개발자료.xlsx')
db = sqlite3.connect(os.path.join(TH, 'thereum_catalog.sqlite'))
db.row_factory = sqlite3.Row

FONT = '맑은 고딕'
HDR_FILL = PatternFill('solid', start_color='173D3B')          # 브랜드색(진한 청록)
HDR_FONT = Font(name=FONT, bold=True, color='FFFFFF', size=10)
BODY = Font(name=FONT, size=10)
TITLE = Font(name=FONT, bold=True, size=14, color='173D3B')
NOTE = Font(name=FONT, size=9, italic=True, color='666666')
WARN_FILL = PatternFill('solid', start_color='FFF4CE')
THIN = Side(style='thin', color='DDDDDD')
BORDER = Border(top=THIN, bottom=THIN, left=THIN, right=THIN)

wb = Workbook()
wb.remove(wb.active)
sheet_index = []   # (시트명, 구분, 설명, 출처)


def add_sheet(name, group, desc, source, headers, rows, widths=None, notes=None, wrap_cols=(), num_cols=(), freeze=True):
    ws = wb.create_sheet(name)
    sheet_index.append((name, group, desc, source))
    r0 = 1
    ws.cell(row=1, column=1, value=name).font = TITLE
    r0 = 2
    ws.cell(row=r0, column=1, value=desc).font = NOTE
    r0 += 1
    for n in (notes or []):
        c = ws.cell(row=r0, column=1, value=n)
        c.font = Font(name=FONT, size=9, bold=True, color='7A4B00')
        c.fill = WARN_FILL
        ws.merge_cells(start_row=r0, start_column=1, end_row=r0, end_column=max(len(headers), 4))
        c.alignment = Alignment(wrap_text=True, vertical='top')
        ws.row_dimensions[r0].height = 30
        r0 += 1
    hr = r0 + 1
    for j, h in enumerate(headers, 1):
        c = ws.cell(row=hr, column=j, value=h)
        c.font = HDR_FONT; c.fill = HDR_FILL; c.border = BORDER
        c.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
    ws.row_dimensions[hr].height = 22
    for i, row in enumerate(rows, hr + 1):
        for j, v in enumerate(row, 1):
            c = ws.cell(row=i, column=j, value=v)
            c.font = BODY; c.border = BORDER
            if j in wrap_cols:
                c.alignment = Alignment(wrap_text=True, vertical='top')
            else:
                c.alignment = Alignment(vertical='top')
            if j in num_cols and isinstance(v, (int, float)):
                c.number_format = '#,##0'
    if widths:
        for j, w in enumerate(widths, 1):
            ws.column_dimensions[get_column_letter(j)].width = w
    if freeze:
        ws.freeze_panes = ws.cell(row=hr + 1, column=1)
    if len(rows) > 0:
        ws.auto_filter.ref = f"A{hr}:{get_column_letter(len(headers))}{hr + len(rows)}"
    return ws


def q(sql, *a):
    return [tuple(r) for r in db.execute(sql, a).fetchall()]


# ---------------------------------------------------------------- 요약
stats = {
    '상품(총)': q('SELECT COUNT(*) FROM products')[0][0],
    '공개 상품': q("SELECT COUNT(*) FROM products WHERE access='public'")[0][0],
    '회원 전용 상품': q("SELECT COUNT(*) FROM products WHERE access='members_only'")[0][0],
    '색상 SKU': q('SELECT COUNT(*) FROM product_colors')[0][0],
    '부품 상품': q('SELECT COUNT(*) FROM addon_products')[0][0],
    '부품 옵션(표시·판매 중)': q("SELECT COUNT(*) FROM addon_options WHERE is_display='T' AND is_selling='T'")[0][0],
    '부품 옵션(숨김 템플릿 포함 전체)': q('SELECT COUNT(*) FROM addon_options')[0][0],
    '구성기 이미지 URL': q('SELECT COUNT(*) FROM viewer_assets')[0][0],
    '설명 문구 보유 상품': q('SELECT COUNT(*) FROM products WHERE description IS NOT NULL')[0][0],
}
summary_rows = [
    ('대상', 'thereum.co.kr (주식회사 더리움) — USM Haller 단일 브랜드 쇼핑몰, 카페24 기반', '사이트 하단·스크립트 분석'),
    ('수집일', '2026-11-02 ~ 2026-11-03', ''),
    ('수집 방식', '읽기 전용: 공개 페이지, 사용자가 직접 로그인한 회원 세션(상품 페이지만), 공개 후기 API(집계만)', ''),
]
for k, v in stats.items():
    summary_rows.append((k, v, 'thereum_catalog.sqlite'))
summary_rows += [
    ('DB 검증', '25개 항목 모두 통과 (사이트에서 직접 선택해 확인한 금액·옵션 표본 포함)', 'verify-db.js'),
    ('회원 전용 번호 975개', '개인결제창 901 / 접근 불가 42 / 실제 상품 32(DB에 추가)', 'probe-ids.json'),
    ('상품번호 조회 범위', '1~9000 (최대 번호 3662, 4201~9000은 없음)', 'probe-ids.js, probe-range.js'),
    ('판매 통계 근거', '공개 후기 2,869건(2021-09~2026-11-02), 스마트스토어 80.5%', 'SALES_STATS.md'),
    ('공급 경로(운영자 진술)', '더리움의 독일 공급사 = 우리 공급사와 동일, 병행수입, 라이선스 문제 없음(근거 문서 미확인)', '운영자 진술'),
    ('미수집', '주문·회원 DB, 개인결제창 내용(개인정보), 재고 실수량, 스마트스토어(접근 차단), 이미지 파일, 회원 등급별 가격', '미확인·후속 시트'),
]
add_sheet('요약(보고)', '보고용', '핵심 수치와 수집 범위 한눈에 보기', 'DB·문서 종합',
          ['항목', '값', '출처/비고'], summary_rows, widths=[28, 80, 34], wrap_cols=(2, 3), num_cols=(2,))

# ---------------------------------------------------------------- 상품
rows = q("""SELECT p.product_no, p.product_code, p.name, p.name_display, p.name_site, p.tag, p.access, p.fulfilment, p.kind,
  p.grid_cols, p.grid_rows, p.panel_mode, p.consumer_price, p.price, p.best_price, p.lead_time_text,
  (SELECT group_concat(c.name, ' / ') FROM product_categories pc JOIN categories c ON c.cate_no=pc.cate_no WHERE pc.product_no=p.product_no),
  p.has_color_option, p.desc_title, p.description, p.source_url
  FROM products p ORDER BY p.product_no""")
add_sheet('상품', '개발 재사용', '상품 880개(공개 848 + 회원 전용 32). 가격은 KRW·VAT 포함. 설명 문구는 출처 사이트 원문이다.', 'products 테이블',
          ['상품번호', '상품코드', '정식 상품명', '표시명(태그 포함)', '사이트 원래 상품명', '태그', '접근', '출고방식', '유형', '가로칸', '세로단', '도어구성',
           '소비자가', '판매가', '최적할인가', '납기', '카테고리', '색상옵션', '설명 제목', '설명(원문)', '원본 URL'],
          rows, widths=[9, 11, 44, 48, 40, 9, 11, 15, 14, 7, 7, 10, 12, 12, 12, 26, 26, 8, 30, 60, 46],
          notes=['※ 정식 상품명 = "{구성} {종류}"(예: 1x2(1단오픈) 수납 모듈, 2x2(가로750/500) 책상). 사이트의 원래 상품명은 구성 코드만 있는 경우가 많아 종류를 붙였다(규칙: names.js, 종류어는 사이트 SEO 제목의 "수납 모듈" 등을 따름).',
                 '※ 설명 문구는 출처 사이트(thereum.co.kr)의 원문이다. 우리 쇼핑몰에 게시하기 전에 자체 문구로 다시 쓰고, 구성·치수 같은 사실 정보만 유지할 것.'],
          wrap_cols=(20,), num_cols=(13, 14, 15))

# ---------------------------------------------------------------- 색상 SKU
rows = q("""SELECT c.item_code, c.product_no, p.name, co.name_ko, co.hex, c.lead_note, c.unit_price, c.use_stock, c.stock_number, c.is_display, c.is_selling
  FROM product_colors c JOIN products p ON p.product_no=c.product_no JOIN colors co ON co.color_id=c.color_id ORDER BY c.product_no, c.item_code""")
add_sheet('색상SKU', '개발 재사용', '판매 SKU(색상 옵션 1건 = SKU 1건). item_code는 카페24 형식(상품코드 8자 + 옵션ID 4자). 색상 없는 상품은 M…#default 형태의 합성 키.', 'product_colors',
          ['item_code', '상품번호', '상품명', '색상', 'HEX', '납기 안내', '단가', '재고관리', '재고수', '표시', '판매'],
          rows, widths=[17, 9, 42, 22, 9, 16, 12, 8, 8, 6, 6], num_cols=(7,))

# ---------------------------------------------------------------- 부품 상품 / 옵션 / 연결
rows = q("SELECT add_product_no, product_code, name, option_names, scope, item_type, is_display FROM addon_products ORDER BY add_product_no")
add_sheet('부품상품', '개발 재사용', '추가구성상품(부품 상품) 811개. scope=parts(상품별 부품) / inos(이노스 5칸). 옵션은 "옵션 > 상세" 2단 구조.', 'addon_products',
          ['부품상품번호', '코드', '이름', '옵션 구조', '구분', '유형', '표시'], rows, widths=[12, 11, 56, 18, 8, 12, 6])
rows = q("""SELECT ao.item_code, ao.add_product_no, ap.scope, ao.level1_value, ao.level2_value, ao.unit_price, ao.stock_number
  FROM addon_options ao JOIN addon_products ap ON ap.add_product_no=ao.add_product_no
  WHERE ao.is_display='T' AND ao.is_selling='T' ORDER BY ao.add_product_no, ao.item_code""")
add_sheet('부품옵션', '개발 재사용', '사이트에 실제로 표시·판매 중인 부품 옵션 24,189건과 단가. (숨김 템플릿 행 116,850건은 SQLite에만 있음)', 'addon_options',
          ['item_code', '부품상품번호', '구분', '옵션(1단)', '상세(2단)', '단가', '재고수'], rows, widths=[17, 12, 8, 34, 46, 12, 8], num_cols=(6,))
rows = q("""SELECT pa.product_no, p.name, pa.add_product_no, ap.name, ap.scope FROM product_addons pa
  JOIN products p ON p.product_no=pa.product_no JOIN addon_products ap ON ap.add_product_no=pa.add_product_no ORDER BY pa.product_no, ap.scope""")
add_sheet('상품-부품연결', '개발 재사용', '상품별로 붙는 부품 상품(부품 1개 + 이노스 5칸 1개).', 'product_addons',
          ['상품번호', '상품명', '부품상품번호', '부품상품명', '구분'], rows, widths=[9, 42, 12, 56, 8])

# ---------------------------------------------------------------- 카테고리 / 색상 / 구성기
add_sheet('카테고리', '개발 재사용', '카테고리 10개와 소속 상품 수', 'categories, product_categories',
          ['카테고리번호', '이름', '구분', '소속 상품 수'],
          q("SELECT c.cate_no, c.name, c.kind, (SELECT COUNT(*) FROM product_categories pc WHERE pc.cate_no=c.cate_no) FROM categories c ORDER BY c.cate_no"),
          widths=[12, 30, 10, 12], num_cols=(4,))
add_sheet('색상', '개발 재사용', '표준 14색(HEX·구성기 코드)과 테이블 상판 등 기타', 'colors, colors.json',
          ['색상ID', '색상명', 'HEX', '구성기 코드'], q('SELECT color_id, name_ko, hex, viewer_code FROM colors ORDER BY color_id'), widths=[9, 28, 10, 12])
rows = q("""SELECT vb.product_no, p.name, vb.base_code, vb.label, vb.extra_price FROM viewer_bases vb JOIN products p ON p.product_no=vb.product_no ORDER BY vb.product_no, vb.base_code""")
add_sheet('구성기_바퀴', '개발 재사용', '구성기의 바닥 구성(기본 발/바퀴 3종)별 추가금. 상품 구성에 따라 3벌의 가격표가 있다.', 'viewer_bases',
          ['상품번호', '상품명', '코드', '이름', '추가금'], rows, widths=[9, 42, 18, 24, 10], num_cols=(5,))
rows = q("""SELECT vd.product_no, p.name, vd.base_mode, vd.width_mm, vd.height_mm, vd.depth_mm FROM viewer_dimensions vd JOIN products p ON p.product_no=vd.product_no ORDER BY vd.product_no, vd.base_mode""")
add_sheet('구성기_치수', '개발 재사용', '구성기에 표시되는 치수(mm). base=기본 발, wheels=바퀴 구성.', 'viewer_dimensions',
          ['상품번호', '상품명', '구성', '가로mm', '높이mm', '깊이mm'], rows, widths=[9, 42, 10, 9, 9, 9], num_cols=(4, 5, 6))
rows = q("""SELECT va.product_no, va.asset_key, va.color_code, va.view_kind, va.url FROM viewer_assets va ORDER BY va.product_no, va.asset_key""")
add_sheet('구성기_이미지URL', '개발 재사용', '구성기 이미지 주소 19,278건(전부 webp). 파일은 내려받지 않았고 주소만 참조용으로 저장했다. 키 규칙: <색코드>-<시점>, <색코드>-open, <대표색>-<바퀴>, <대표색>-glass_<바퀴>.', 'viewer_assets',
          ['상품번호', '키', '색코드', '시점/변형', 'URL'], rows, widths=[9, 28, 8, 22, 90],
          notes=['※ 이미지는 출처 사이트의 자산이다("이 상품 이미지는 더리움의 자산입니다"). 우리 쇼핑몰에서는 자체 촬영/렌더 또는 공급사 제공 이미지를 써야 한다.'])

# ---------------------------------------------------------------- 가격 모델
pm = json.load(open(os.path.join(TH, 'price-model.json'), encoding='utf-8'))
rows = [
    ('도어형(전 칸 드롭다운 도어)', 25, 0.99991, 40700, 212240, 157800, 798340, '1.6%'),
    ('도어없음', 24, 0.99971, 26810, 215780, 161340, 429258, '2.6%'),
    ('오픈', 13, 0.99940, 46061, 216412, 79218, 289825, '2.8%'),
]
ws = add_sheet('가격모델', '보고용·개발', '격자 구성(가로칸 m × 세로단 n)이 한 가지 모드로 통일된 상품의 가격 식: 가격 ≈ 상수 + a·m + b·n + c·m·n (KRW).', 'price-model.js',
               ['모드', '표본 수', 'R²', '상수', 'a (m)', 'b (n)', 'c (m·n)', '최대 오차'], rows, widths=[30, 9, 9, 11, 11, 11, 11, 10], num_cols=(4, 5, 6, 7),
               notes=['※ 복합 이름(도어 일부·가로 500/350·깊이 500·서랍 등)까지 하나의 식으로 묶으면 R² 0.94(중앙값 오차 6.3%)로 부족하다. 실제 판매가는 상품 시트 값을 쓰고, 이 식은 새 구성의 가격 추정·이상값 점검용으로만 쓸 것.'])
base = ws.max_row + 2
extra = [
    ('국내재고 가격', '같은 이름의 국내재고 가격 = 제작주문 가격 × 1.028 (397쌍, 1.0275~1.0288)'),
    ('소비자가/판매가', '제작주문: 소비자가 = 판매가. 국내재고 443개: 판매가 < 소비자가 (평균 0.96, 범위 0.84~0.97)'),
    ('최적할인가', '판매가의 약 4% 아래(0.91~0.96) — 회원가입 후 무통장입금 시 적용'),
    ('쿠폰', '3% (500만 원 이상 구매), 5% (1,000만 원 이상 구매)'),
    ('색상별 가격', '색상에 따라 단가가 달라지는 상품은 29개(테이블 상판 등). 나머지는 색상 무관 동일가'),
    ('이노스 5칸', '2종: 제작주문 325,000 / 국내재고 344,000, 각 14색'),
    ('바퀴 추가금', '3벌: +111,000/88,000/66,000, +117,000/94,000/70,000, +166,000/133,000/99,000 (고정4/고정2+일반2/일반4)'),
    ('주문 합계', '합계 = 색상 SKU 단가 + Σ(부품 옵션 단가 × 수량). 예) 3646 퓨어 화이트 3,247,000 + 열쇠핸들/도어1개 100,000 = 3,347,000원'),
]
ws.cell(row=base, column=1, value='가격 규칙').font = Font(name=FONT, bold=True, size=11, color='173D3B')
for i, (k, v) in enumerate(extra, base + 1):
    a = ws.cell(row=i, column=1, value=k); a.font = Font(name=FONT, bold=True, size=10); a.border = BORDER
    b = ws.cell(row=i, column=2, value=v); b.font = BODY; b.border = BORDER
    ws.merge_cells(start_row=i, start_column=2, end_row=i, end_column=8)
    b.alignment = Alignment(wrap_text=True, vertical='top')

# ---------------------------------------------------------------- 판매 통계
mrows = []
for l in open(os.path.join(TH, 'reviews', 'monthly.txt'), encoding='utf-8').read().strip().split('\n'):
    m, n, sm, own = l.split(':'); mrows.append((m, int(n), int(sm), int(own)))
add_sheet('판매통계_월별후기', '보고용', '월별 공개 후기 수(판매량의 대리 지표). 후기 수 ≠ 판매 수.', 'reviews/monthly.txt',
          ['월', '후기 수', '스마트스토어', '자사몰'], mrows, widths=[10, 10, 14, 10], num_cols=(2, 3, 4),
          notes=['※ 후기 작성률을 알 수 없어 절대 판매량이 아니라 상대 비중·추세용이다. 스마트스토어 후기는 2023-07부터 시작.'])
prows = []
for l in open(os.path.join(TH, 'reviews', 'products.txt'), encoding='utf-8').read().strip().split('\n'):
    pc, name, n, avg, sm, own = l.split('|')
    r = db.execute('SELECT price FROM products WHERE product_no=?', (int(pc),)).fetchone()
    rn = db.execute('SELECT name_display FROM products WHERE product_no=?', (int(pc),)).fetchone()
    prows.append((int(pc), rn[0] if rn else name, name, int(n), float(avg), int(sm), int(own), r[0] if r else None))
prows.sort(key=lambda x: -x[3])
add_sheet('판매통계_상품별후기', '보고용', '상품별 후기 수(개인결제창 74건·상품 미상 20건 제외). 현재가는 카탈로그에 같은 번호가 있을 때만 표시.', 'reviews/products.txt + DB',
          ['상품번호(후기)', '정식 상품명(카탈로그와 연결된 경우)', '후기에 적힌 이름', '후기 수', '평균 별점', '스마트스토어', '자사몰', '현재가'], prows, widths=[12, 46, 46, 9, 9, 12, 9, 12], num_cols=(4, 6, 7, 8))
stat_rows = [
    ('수집 후기 수', '2,869건 (2021-09-14 ~ 2026-11-02)'),
    ('채널', '네이버 스마트스토어 2,310건(80.5%) / 자사몰 559건(19.5%)'),
    ('연도별', '2022: 71 / 2023: 301 / 2024: 716 / 2025: 970 / 2026(~11/2): 800'),
    ('최근 12개월', '964건 (월 52~109건)'),
    ('상품 유형 비중', '수납 모듈(격자) 83.0% / TV장 7.0% / 협탁 6.4% / 테이블 1.9% / 부품·서비스 0.8%'),
    ('출고 방식', '국내재고 표기 92.2% / 그 외 7.5% / B급 0.3%'),
    ('구성별(수납 모듈)', '1x2 50.5% / 1x3 20.1% / 2x2 16.2% / 3x2 4.4% / 2x3 3.6%'),
    ('도어 구성', '오픈 73.6% / 도어형 19.2% / 도어없음 7.2%'),
    ('세로 단 수', '2단 71.6% / 3단 25.2% / 1단 2.2% / 4단 0.9% / 5단 0.1%'),
    ('쏠림', '상위 1개 상품([국내재고] 1x2(1단오픈)) 31.1%, 상위 5개 57.2%'),
    ('가격대', '150~250만 원 49.5% / 250~350만 26.6% / 350~500만 12.1% / 150만 미만 6.9% / 500만 이상 4.8%'),
    ('별점', '5점 2,802 / 4점 61 / 3점 5 / 1점 1'),
    ('한계', '색상별 통계 불가(상품명에 색 없음), 개인결제창·맞춤 주문 규모는 후기로 알 수 없음'),
]
add_sheet('판매통계_요약', '보고용', '후기 기반 판매 통계 요약(상세: SALES_STATS.md)', 'SALES_STATS.md', ['항목', '내용'], stat_rows, widths=[22, 100], wrap_cols=(2,))

# ---------------------------------------------------------------- 사이트 구조
pages = [
    ('홈', '/', '띠배너·헤더·가로메뉴·배너(Swiper 3장)·상품 탭(일반/빠른배송)·Best Review 마퀴·"우리집 공간에 맞게" 탭(가로1~4단)·푸터'),
    ('카테고리 목록', '/category/<slug>/<cate_no>/ 또는 /product/list_thumb.html?cate_no=N', '배너·빵부스러기·제목·정렬(신상품5/상품명1/낮은가격3/높은가격4)·총 N개·2열/1열 보기·색상 칩·30개씩 더보기(ajax $M.displayMore)'),
    ('상품 상세', '/product/<slug>/<product_no>/category/<cate>/display/<n>/', '이미지 Swiper→이름·가격→정보표→색상 select→쿠폰 다운로드→총상품 영역→추가구성상품→하단 고정 버튼(관심/장바구니/바로구매)→탭(상세/이용안내/리뷰)'),
    ('검색', '/product/search.html?keyword=', '카페24 표준'),
    ('장바구니', '/order/basket.html', '선택상품주문/전체상품주문/변경/취소, 빈 장바구니 문구'),
    ('주문서', '/order/orderform.html?basket_type=all_buy', '미수집(장바구니 비어 진입 불가). 무통장입금 안내: 입금자명 일치, 23시간 내 입금, 미입금 자동취소'),
    ('로그인', '/member/login.html', '아이디/비밀번호·소셜 6종(네이버/페이스북/구글/카카오/라인/애플)·비회원 구매·찾기'),
    ('회원가입', '/member/join.html', '카페24 표준 필드(개인/사업자, 인증, 주소, 선택 항목 다수)'),
    ('상품후기', '/board/상품후기/4/', 'Crema 위젯(iframe) — 후기 목록·평점·채널 표시'),
    ('FAQ', '/_onedesign/html/faq.html', '일반/빠른 배송 차이, 배송기간, 관부가세, 배송 방식, 모듈 변형, AS, 주문취소'),
    ('About Us', '/_onedesign/html/company.html', '750×3590 단일 이미지'),
    ('이용안내/약관/개인정보', '/shopinfo/guide.html, /member/agreement.html, /member/privacy.html', '카페24 표준 + 상품 상세 #prdInfo 아코디언(결제/배송/교환·반품)'),
    ('공지', '/article/공지사항/1/<id>/', 'USM 복원서비스'),
    ('sitemap/robots', '/sitemap.xml, /robots.txt', 'sitemap 838 URL(당시), robots는 /exec/front/·/api·/member/·/myshop/ 차단'),
]
add_sheet('페이지·URL', '개발 재사용', '화면 유형별 URL 규칙과 구성', 'BUILD_BLUEPRINT.md §1·§4', ['화면', 'URL 규칙', '구성/동작'], pages, widths=[18, 52, 100], wrap_cols=(2, 3))
layout = [
    ('레이아웃', '모바일 우선 단일 컬럼 500px을 데스크톱 중앙에 고정(margin 0 136px, 그림자), 좌측 고정 프로모션 패널 475px(배경 이미지)'),
    ('헤더', '고정: 40px 띠배너(#173D3B) + 60px 로고/장바구니(수량 뱃지)/햄버거 + 46px 가로 스크롤 메뉴'),
    ('햄버거 메뉴', '검색폼, 카테고리/커뮤니티 목록, 로그인 상태, 계좌 안내'),
    ('색', '브랜드색 #173D3B, 중립 #fff #eee #999 #000 #f5f5f5 #1b1b1b #ddd #353535 #f9f9f9'),
    ('글꼴', 'Sora + Noto Sans KR(300/400/500/700), 본문 14px / 행간 1.7, 가장 많이 쓰는 크기 13px'),
    ('모서리/전환', '모서리 2px(최다)·4·5·10·20px, 전환 all .35~.55s, 아이콘 xeicon 2.3.3'),
    ('브레이크포인트', 'min-width:1024px, max-width:600px/420px (소수). CSS 변수 미사용(값 하드코딩)'),
    ('상품 카드(목록)', '썸네일 정사각 227px + 이름(굵게 14px) + 브랜드(13px #555) + 취소선 소비자가 + 판매가 + 색상 칩'),
    ('상품 상세 하단 버튼', '#fixedActionButton 고정: 관심상품 / 장바구니 / 바로구매(브랜드색)'),
    ('주문 행 구조', '본 상품 행(option_product, 수량 입력) + 부품 행(add_product, 수량·가격 별도) → 합계 "총상품금액 N원 (M개)"'),
]
add_sheet('디자인·레이아웃', '개발 재사용', '화면 골격·디자인 토큰·상품 행 구조', 'CSS 282KB 분석, 화면 캡처(screens/)', ['항목', '내용'], layout, widths=[22, 120], wrap_cols=(2,))
api = [
    ('장바구니 담기', 'POST /exec/front/order/basket/', '상품 상세 product_submit'),
    ('주문서', 'GET /order/orderform.html?basket_type=all_buy', '장바구니 → 주문서'),
    ('주문', 'POST /exec/front/order/order/', ''),
    ('결제예약', 'POST /exec/front/order/reserve/', 'precreateOrder'),
    ('금액계산', 'POST /exec/front/order/Calculationcreate/', '요청 필드: mobile, member_id, shipping_type, payment_method, country_code, carrier_id, zipcode, address_full, address_state, points_spent_amount, order_coupons, items. 배송유형 A=국내/B=해외'),
    ('혜택 정보', 'POST /exec/front/Product/Benefitinfo', ''),
    ('색상 이미지', 'GET /exec/front/Product/Colorimage', ''),
    ('하위 카테고리', 'GET /exec/front/Product/SubCategory', ''),
    ('찜', '/product/layer_wish.html, add_wishlist()', ''),
    ('더보기', '$M.displayMore(…)', '목록 ajax'),
    ('로그인/가입', 'POST /exec/front/Member/login/, /exec/front/Member/join/', ''),
    ('카페24 WebMCP', '/api/mcp (헤더 X-Cafe24-Surface: webmcp)', '에이전트용 도구 11종 선언(search-products, get_cart, create_cart, create-checkout-url 등). 페이지가 선언한 것이라 호출하지 않음'),
]
add_sheet('기능·API', '개발 재사용', '카페24 프런트 엔드포인트와 주문 흐름(정적 분석). 직접 개발 시 자체 API로 대체할 목록.', 'BUILD_BLUEPRINT.md §7·§12.2', ['기능', '엔드포인트', '비고'], api, widths=[18, 56, 90], wrap_cols=(2, 3))
ext = [
    ('쇼핑몰 코어', '카페24', 'cafe24.com / echosting / cafe24ssl', '호스팅·주문·회원·결제'),
    ('리뷰', 'Crema', 'cre.ma', '상품후기 위젯/API (네이버 스마트스토어 후기 연동)'),
    ('채팅', '채널톡', 'channel.io', '상담'),
    ('팝업', '카페24 스마트팝업', 'app4you.cafe24.com', '팝업'),
    ('분석', 'GTM / GA4 / Naver WCS / Kakao SDK / smlog / ca-log', '여러', '분석'),
    ('광고', 'Google Ads(AW-16498194554) / Meta Pixel / 네이버 NAC', '여러', '광고 전환'),
    ('오류 수집', '카페24 JET', 'assets.poxo.com', '/api/v1/store·vitals·resources'),
    ('정적 자산', 'Google Fonts / jsdelivr(xeicon) / cdnjs', '', '폰트·아이콘'),
    ('개인 서버', 'reum.me (/static/storefront/tv186-*.js)', '', '구성기·상품별 보정 스크립트(31개 모듈)'),
    ('판매 채널', '네이버 스마트스토어', '(접근 차단으로 미수집)', '후기의 80%'),
]
add_sheet('외부서비스', '개발 재사용', '사이트가 사용하는 외부 서비스 35개 호스트 중 주요 항목', 'REA 네트워크 캡처(요청 226건)', ['영역', '서비스', '호스트', '용도'], ext, widths=[14, 48, 36, 60], wrap_cols=(2, 3, 4))
pol = [
    ('배송', '제작주문 4~6개월(생산 2~3 + 해상 2~3개월), 국내재고 수도권 2주/비수도권 3주(강원 4주). 설치 배송(Assemblee 팀), 완조립/반조립, 수령 시 2차 검수(사진·영상)'),
    ('가격 표시', '표시가에 배송비·관부가세 포함(더리움 명의 사업자 통관). 제주·도서 산간 배송 불가. 계단/사다리차/좁은 통로/부재 등은 추가요금'),
    ('결제', '무통장입금(신한은행). 입금자명 일치, 23시간 내 입금, 미입금 자동취소. 회원가입 후 무통장 입금 시 4% 추가할인'),
    ('취소/환불', '주문 24시간 후 자동 발주. 제작주문은 취소·반품·교환 어려움(불가피 시 총 결제액의 15% 위약금). 국내재고는 단순 변심 취소 가능(현장 반품 시 왕복 수도권 10만/비수도권 20만원)'),
    ('A/S', '수령일부터 3년 무상(사용자 과실 제외). 초기 하자 외 유상, 부품 교체. 타 구매처 모듈 확장은 모듈당 최초 등록비 최대 30만 원'),
    ('정품', '"유럽 현지 공식 딜러십 업체를 통한 병행수입, 부품 USM 각인으로 100% 정품" (사이트 자기 주장, 이미지 문구)'),
    ('부가서비스', 'USM 복원서비스, 모듈 확장 서비스(확장시공), 클리닝 서비스 상품'),
    ('운영사', '주식회사 더리움, 대표 김윤정, 서울 용산구 한강대로 205 D동 2716호, 통신판매업 제2026-서울용산-0853호'),
]
add_sheet('정책·운영', '보고용', '사이트가 고객에게 약속하는 정책(참고용). 법적 검토 후 우리 정책으로 재작성 필요.', 'FAQ·이용안내·상품 상세', ['항목', '내용'], pol, widths=[14, 140], wrap_cols=(2,))

# ---------------------------------------------------------------- 회원 전용·개인결제창
cm = [
    ('번호 조회 범위', '상품번호 1~9000 (최대 3662, 4201~9000 없음)'),
    ('회원 전용 번호', '975개 → 개인결제창 901 / 접근 불가(홈으로 이동) 42 / 실제 상품 32'),
    ('실제 상품 32개', 'CUSTOM ORDER(카테고리 35). 확장시공·맞춤 구성 상품. DB의 products.access = members_only, kind = extension_work/custom_order'),
    ('개인결제창 구조', '카테고리 35 "CUSTOM ORDER"의 일반 상품. 상품명 "OOO 고객님 개인결제창"(+ (확장)/(일반배송)/(빠른배송)). 판매가 칸에 고객별 결제 금액. 설명 본문 없음. 대부분 옵션 없음(수량만), 일부는 추가구성상품 포함'),
    ('필요한 정보(제작 시)', '고객 식별 이름(또는 별칭), 결제 금액(KRW, VAT 포함), 배송 방식·비용, 수량 1, 필요 시 부품 옵션 연결, 카테고리 35'),
    ('위험', '접근 제한이 "일반회원 이상"뿐이라 로그인한 회원은 다른 고객의 결제 페이지도 열림 → 우리 쇼핑몰은 고객별 토큰/본인 확인으로 접근 제어 필요'),
    ('저장 여부', '고객 이름·금액·본문은 저장하지 않음(구조만 기록)'),
]
add_sheet('회원전용·개인결제창', '보고용', '회원 전용 번호의 정체와 개인결제창(고객별 결제 페이지) 구조', 'BUILD_BLUEPRINT.md §12.8', ['항목', '내용'], cm, widths=[22, 130], wrap_cols=(2,))

# ---------------------------------------------------------------- 총판 조사
brand_rows = []
region_file = [('nordic.md', '북유럽'), ('italy-living.md', '이탈리아 리빙·소파'), ('italy-design.md', '이탈리아 디자인·조명·아웃도어'), ('dach-fr-es-uk.md', '독일·프랑스·스페인·영국')]
for fn, region in region_file:
    for line in open(os.path.join(FR, fn), encoding='utf-8'):
        if not line.startswith('|') or line.startswith('|---') or line.startswith('| 브랜드') or line.startswith('| Brand'):
            continue
        cells = [c.strip() for c in line.strip().strip('|').split('|')]
        if len(cells) < 5:
            continue
        brand_rows.append((region, cells[0], cells[1], cells[2], cells[3], cells[4]))
# 후속 확인된 정정 반영
corr = {'Timothy Oulton': ('HAS_KR_DISTRIBUTOR', '현대백화점 단독 전개(후속 확인)', 'https://www.munhwa.com/article/11220892'), 'USM Haller': ('HAS_KR_DISTRIBUTOR', '스페이스로직(SpaceLogic)', 'https://www.usm.com/en/stories/a-by-bom')}
for i, r in enumerate(brand_rows):
    if r[1] in corr:
        v, d, u = corr[r[1]]
        brand_rows[i] = (r[0], r[1], v, d, u, '후속 확인으로 정정. ' + r[5])
brand_rows.append(('독일·프랑스·스페인·영국(보강)', 'Timothy Oulton', 'HAS_KR_DISTRIBUTOR', '현대백화점 단독 전개(후속 확인)', 'https://www.munhwa.com/article/11220892', '조사 구간 결과가 NONE_FOUND였으나 기사로 정정'))
add_sheet('총판조사_브랜드', '보고용', '유럽 가구 브랜드 약 100개의 한국 공식 총판 유무(검색 기반 1차 조사). 총판이 없다고 확정된 브랜드는 없다.', 'docs/furniture-research/*.md',
          ['구간', '브랜드', '판정', '한국 유통사', '근거 URL', '확인한 곳/메모'], brand_rows, widths=[18, 22, 22, 36, 50, 80], wrap_cols=(4, 5, 6),
          notes=['※ NONE_FOUND = 검색에서 못 찾음이지 "총판 없음 확정"이 아니다(공식 판매처 페이지를 대부분 열지 못했고 브랜드당 검색 1~2회). 정밀 검증이 필요한 후보 목록으로만 쓸 것.',
                 '※ 운영자 진술(2026-11-02): 독일 공급사가 더리움 공급사와 동일, 병행수입 경로, 라이선스 문제 없음(근거 문서 미확인). 이에 따라 총판 유무만으로 후보를 제외하지 않고 공급사 취급 브랜드 목록으로 후보를 좁히는 것이 다음 단계.'])

# ---------------------------------------------------------------- SEO/접근성
seo = [
    ('메타', 'title, meta description, canonical, og 6종, lang="ko", viewport(확대 허용) 있음'),
    ('구조화 데이터', '상품 페이지에 JSON-LD 1건. 홈·목록 없음. twitter 카드, robots 메타 없음'),
    ('접근성', '상품 상세 평균 img 22.6개, alt 누락 5,186건(848페이지), alt 빈 값 7,228건, 상품 페이지 h1 2개(3646 표본)'),
    ('성능', '상세 HTML 평균 396KB(최대 1.08MB), 상품 상세 한 화면 요청 약 120건'),
    ('구성기 이미지', '792개 상품에 구성기, 키 19,278개(상품당 평균 24.3, 최대 92), 고유 URL 10,117개, 전부 webp·자사 호스팅'),
    ('개선 요구사항', '구조화 데이터 확대, alt 채우기, h1 1개, 상세 HTML 경량화'),
]
add_sheet('SEO·접근성·성능', '개발 재사용', '더리움 점검 결과 → 우리 쇼핑몰 개선 요구사항', 'BUILD_BLUEPRINT.md §12.3·§12.5', ['항목', '내용'], seo, widths=[18, 130], wrap_cols=(2,))

# ---------------------------------------------------------------- 운영·서비스·마케팅 (OPERATIONS_MARKETING.md)
ops = [
    ('① 상담·주문', '자사몰(카페24) 또는 네이버 스마트스토어(smartstore.naver.com/thereum, 빠른배송상품 중심). 등록되지 않은 모듈은 카카오톡 채널 "더리움"/채널톡으로 문의. 상담 평일 9~18시, 주말·공휴일 휴무', '사이트·링크트리'),
    ('② 결제', '무통장입금(입금자명 일치, 23시간 내, 미입금 자동취소). 회원가입 후 무통장 4% 추가할인', '사이트'),
    ('③ 발주', '재고 보유 상품이 아니면 주문 접수 24시간 후 자동 발주. 제작주문은 취소·반품·교환 어렵고 불가피한 환불은 결제액 15% 위약금', '사이트 FAQ'),
    ('④ 제작·운송', '제작주문 생산 2~3개월 + 해상운송 2~3개월 = 4~6개월(색·모듈 무관). 국내재고 수도권 2주/비수도권 3주(강원 4주). 재고 없는 색은 "5주 소요예정"', '사이트'),
    ('⑤ 통관', '더리움 명의 사업자 통관, 관·부가세는 더리움이 전액 납부(표시가 포함)', '사이트'),
    ('⑥ 배송', '화물 택배·단순 가구 전달업체를 쓰지 않고 배송팀이 직접 배송("Assemblee 팀"). 출고 준비 후 해피콜로 일정 조율, 엘리베이터 적재 가능하면 완조립/아니면 반조립, 당일 원하는 위치까지 설치. 조율 불가 시 문앞 배송(동일 클리닝·2차 검수, 사진·영상)', '사이트 FAQ·About Us'),
    ('⑦ 배송비·현장 조건', '지역별 추가 배송비 없음(제주·도서 산간 불가). 계단·사다리차·좁은 통로·추가 인력·부재 대기·당일 예약 취소 시 추가 요금. 설치 공간은 미리 비우고 기존 가구 철거·내림 서비스 없음', '사이트 이용안내'),
    ('⑧ 설치·검수', '수령 시 현장에서 고객과 함께 2차 검수(사진·영상), 취급 유의사항·관리 방법 안내, 클리닝 서비스', '사이트·후기'),
    ('⑨ AS', '수령 시 하자는 더리움 100% 책임 무상 AS. 수령일부터 3년 무상(사용자 과실 유상). 부품 단위 교체, 사진을 카카오톡 채널로 보내면 견적 안내, 국내 재고 없는 부품 4~6개월', '사이트 FAQ'),
    ('⑩ 사후 서비스', '모듈 확장·변형(추가 부품·조립비, 타 구매처 모듈 최초 등록비 최대 30만 원, 국내 백화점·매장 구매 시 증빙으로 면제), 이전 설치(가로 3칸 이상, 이사 1개월 전 문의, 해체·포장 → 재조립), 무료 클리닝 서비스, 복원서비스(내용 미확인)', '사이트 상세 이미지·링크트리'),
    ('⑪ 지연 보상', '안내한 배송기간보다 지연되면 주문 취소 시 위약금 없이 환불', '사이트 About Us'),
]
add_sheet('운영방식(주문~AS)', '보고용', '주문부터 AS까지 더리움의 운영 흐름(근거 구분 포함). 직원 복장·차량·도구는 확인하지 못했다.', 'OPERATIONS_MARKETING.md', ['단계', '방식', '근거'], ops, widths=[18, 130, 26], wrap_cols=(2, 3))
promise = [
    ('약속 01', 'USM 구매 후 모듈 변형이 자유롭다 — 전문 조립·해체 팀이 보유 모듈을 원하는 모듈로 바꿔 준다'),
    ('약속 02', '수령 시 발견된 하자는 끝까지 책임 — 현장 공동 검수'),
    ('약속 03', '구매 후 사용 중 하자도 AS 지원 (패널 긁힘, 이동 중 부품 파손 등)'),
    ('약속 04', '프리미엄 배송서비스 — 현장 검수, 취급 유의사항 전달, 클리닝까지(화물 택배 미사용)'),
    ('약속 05', '고객과의 약속 최우선 — 지연 시 위약금 없는 환불'),
    ('정품', '유럽 현지 공식 딜러십 업체를 통한 병행수입, USM 각인(볼·커넥터·힌지·패널 안쪽)으로 정품 확인'),
    ('로고', '워드마크 "THE REUM" — 기하학적 산세리프 대문자, R의 가로 획이 잘려 이어지는 형태, 진한 청록(#173D3B)'),
    ('보조 모티프', '12각 스타버스트 아이콘(청록·크림), 이모지 💚'),
    ('슬로건', '프리미엄 배송으로 프리미엄 가구의 가치를 / 프리미엄 가구의 가치를 프리미엄 서비스로 전달합니다 / USM 정품은 더리움에서💚 / USM은 왜 더리움에서 구매해야 할까요? / 우리집 공간에 맞게'),
    ('직원 복장·차량·도구', '미확인 — 사이트·인스타그램 공개 화면·웹 검색에 정보 없음. 배송팀 이름 "Assemblee"만 사이트에 나오며 업체는 확인되지 않음'),
]
add_sheet('서비스약속·브랜드', '보고용', 'About Us의 서비스 약속 5개, 정품 주장, 로고·슬로건', '사이트 이미지(About Us, 홈 배너, 상세 안내)', ['항목', '내용'], promise, widths=[22, 140], wrap_cols=(2,))
themes = [
    ('친절·꼼꼼한 설명', 1251, 0.435), ('설치 기사·설치·조립 언급', 1235, 0.430), ('빠른 배송', 445, 0.155), ('재구매·추천', 300, 0.104),
    ('가격', 264, 0.092), ('배송 지연·오래 걸림', 162, 0.056), ('AS·문의 응대 언급', 153, 0.053), ('정품·각인', 115, 0.040),
    ('모듈 변형·확장', 83, 0.029), ('검수·포장', 83, 0.029), ('클리닝', 72, 0.025), ('하자·파손·스크래치', 51, 0.018),
]
ws = add_sheet('고객응대(후기통계)', '보고용', '공개 후기 2,873건의 텍스트에서 키워드가 들어간 후기 수(중복 가능, 단순 키워드 매칭이라 대략치). 작성자·본문은 저장하지 않음.', '후기 API 집계',
               ['주제', '후기 수', '비율'], themes, widths=[34, 10, 10], num_cols=(2,),
               notes=['※ 자사 게시판·스마트스토어 후기라 객관적인 제3자 평가가 아니다. Crema AI 요약 태그: 만족도 2,291 / 디자인 954 / 배송 714 / 색상 335 / 품질 257 / 가격 210. 부정 표현 포함 후기 134건(4.7%).'])
for r in range(ws.max_row - len(themes) + 1, ws.max_row + 1):
    ws.cell(row=r, column=3).number_format = '0.0%'
mk = [
    ('자사몰(카페24)', '띠배너 "회원가입 후 무통장입금시 4%추가할인", 금액대별 쿠폰(500만↑ 3%, 1,000만↑ 5%), Best Review 마퀴, 일반/빠른배송 탭, 사이즈별 진열', '사이트'),
    ('네이버 스마트스토어', 'smartstore.naver.com/thereum — 빠른배송상품 중심. 후기의 80.5%가 이 채널(2023-07~)이고 Crema로 자사몰 후기에 연동. (네이버 접근 제한으로 상품·가격은 미수집)', '링크트리·후기 집계'),
    ('인스타그램', '@the_reum, 팔로워 약 1.1만, 게시물 221개, 팔로잉 0. 소개 "USM 정품은 더리움에서💚". 하이라이트 REVIEW 1~5 / EVENT / NOTICE. 제품 사진 중심, 월 1~3건', '공개 화면'),
    ('링크트리', 'linktr.ee/thereum — 홈페이지 / 빠른배송상품(스마트스토어) / 구매후기 / 카카오톡 채널 / USM 무료 클리닝 서비스', '공개 화면'),
    ('카카오톡 채널', '"더리움": 상담·AS·확장·이전 설치 접수의 중심 창구. 소개: 프리미엄 가구의 가치를 프리미엄 서비스로 전달합니다', '카카오 채널 페이지'),
    ('채널톡', '홈페이지 내 채팅 상담(평일 9~18시)', '사이트'),
    ('후기 마케팅', 'Crema 후기, 사진·영상 후기(약 89%가 미디어 포함), 홈 후기 마퀴, 인스타 REVIEW 하이라이트', '사이트·후기'),
    ('광고·분석 태그', 'Google Ads 전환·리마케팅(AW-16498194554), Meta Pixel(1016995269929285), 네이버 WCS·NAC, GTM·GA4, 카카오 SDK, 스마트로그', '사이트 소스'),
    ('공개 광고 라이브러리', 'Google 광고 투명성 센터(thereum.co.kr, 대한민국) 광고 0개. Meta 광고 라이브러리(대한민국, "더리움 USM") 결과 없음 → 현재 노출 중인 공개 광고 확인 못 함', '직접 조회'),
    ('확인 불가', '네이버 파워링크·쇼핑검색광고·GFA, 카카오 광고, 인스타그램 협찬·인플루언서, 유튜브 광고(네이버 접근 제한, 검색 도구 한계)', '—'),
]
add_sheet('마케팅·채널', '보고용', '더리움이 쓰는 판매·홍보 채널과 광고 노출(확인한 범위)', 'OPERATIONS_MARKETING.md', ['채널', '내용', '근거'], mk, widths=[22, 130, 22], wrap_cols=(2, 3))

# ---------------------------------------------------------------- 미확인
gaps = [
    ('회원 로그인 후 가격 변동 여부', '미확인', '회원 등급별 가격이 일반 가격과 다른지 확인하지 않음'),
    ('주문서·결제수단 화면', '미확인', '장바구니가 비어 있어 진입하지 못함, 주문 제출은 하지 않음'),
    ('마이페이지·관리자 화면', '미확인', '관리자는 비공개'),
    ('재고 실수량', '미확인', '사이트가 0으로만 노출(신뢰 불가)'),
    ('네이버 스마트스토어 상품·가격', '수집 불가', '네이버 도메인이 내장 브라우저·Chrome에서 차단, 직접 요청은 429. 스토어 주소를 받아 화면 캡처/저장 파일로 제공하면 정리 가능'),
    ('이미지 파일', '미수집', '주소만 저장. 게시용 이미지는 자체 제작/공급사 제공 필요'),
    ('상품 설명의 사용 권한', '주의', '출처 사이트 원문 — 게시 전 재작성 필요'),
    ('공급처·스페이스로직과의 관계', '운영자 진술', '독일 공급사 동일, 병행수입, 라이선스 문제 없음(근거 문서 미확인)'),
    ('USM 한국 상표권·병행수입 표시 의무', '미확인', '법률 검토(변리사/관세사) 필요'),
    ('총판 조사 정밀 검증', '후속', '공급사 취급 브랜드 목록으로 후보를 좁힌 뒤 브랜드별 한국 시장 조사'),
    ('신규 상품', '주기 점검', 'probe-range.js로 상품번호 신규 추가 여부 재확인'),
    ('개인결제창 901개 내용', '의도적 미수집', '개인정보'),
]
add_sheet('미확인·후속', '보고용', '확인하지 못한 것과 후속 작업', '전체 작업 기록', ['항목', '상태', '내용'], gaps, widths=[40, 16, 110], wrap_cols=(3,))

# ---------------------------------------------------------------- 파일 목록
files = [
    ('thereum_catalog.sqlite', '개발 재사용', '전체 카탈로그 DB(상품·SKU·부품·이미지URL·치수·설명). 숨김 템플릿 옵션 행 포함. 스키마: DB_README.md'),
    ('export/*.csv', '개발 재사용', 'DB 테이블 CSV(UTF-8 BOM)'),
    ('products.json / addons-raw.json / assets-inventory.json / descriptions-raw.json', '원자료', '크롤 원본(재생성: build-db.js)'),
    ('build-db.js / verify-db.js / export-csv.js', '스크립트', 'DB 생성·검증(25개 항목)·CSV 내보내기'),
    ('crawl*.js, probe-*.js', '스크립트', '읽기 전용 수집·번호 조사'),
    ('price-model.js, review-stats.js', '스크립트', '가격 모델, 후기 기반 판매 통계'),
    ('BUILD_BLUEPRINT.md / ANALYSIS.md / DB_README.md / SALES_STATS.md / OPERATIONS_MARKETING.md', '문서', '설계서·분석·DB 안내·판매 통계·운영방식과 마케팅 조사'),
    ('screens/', '참고', '화면 캡처(데스크톱 + 중앙 컬럼 조각)'),
    ('nordic.md, italy-living.md, italy-design.md, dach-fr-es-uk.md', '문서', '총판 조사 원표'),
    ('thereum_쇼핑몰_개발자료.xlsx / .docx', '산출물', '본 통합 자료(엑셀: 데이터, 워드: 보고용 설명)'),
]
add_sheet('파일목록', '개발 재사용', 'docs/furniture-research/ 폴더 구성과 쓰임', '', ['파일', '분류', '설명'], files, widths=[70, 14, 100], wrap_cols=(1, 3))

# ---------------------------------------------------------------- 목차 (맨 앞)
ws = wb.create_sheet('목차', 0)
ws.cell(row=1, column=1, value='thereum 쇼핑몰 분석·카탈로그 통합 자료').font = Font(name=FONT, bold=True, size=16, color='173D3B')
ws.cell(row=2, column=1, value='작성 2026-11-03 · 보고용(경영/기획)과 개발 재사용 자료를 시트로 구분. 개인정보는 포함하지 않음.').font = NOTE
hdr = ['시트', '구분', '설명', '출처']
for j, h in enumerate(hdr, 1):
    c = ws.cell(row=4, column=j, value=h); c.font = HDR_FONT; c.fill = HDR_FILL; c.border = BORDER
    c.alignment = Alignment(horizontal='center', vertical='center')
for i, (n, g, d, s) in enumerate(sheet_index, 5):
    c = ws.cell(row=i, column=1, value=n); c.hyperlink = f"#'{n}'!A1"; c.font = Font(name=FONT, size=10, color='0563C1', underline='single'); c.border = BORDER
    for j, v in enumerate((g, d, s), 2):
        cc = ws.cell(row=i, column=j, value=v); cc.font = BODY; cc.border = BORDER; cc.alignment = Alignment(wrap_text=True, vertical='top')
for j, w in enumerate([24, 14, 100, 34], 1):
    ws.column_dimensions[get_column_letter(j)].width = w
ws.freeze_panes = 'A5'

wb.save(OUT)
print('saved', OUT, 'sheets', len(wb.sheetnames))
for n in wb.sheetnames:
    print(' ', n, wb[n].max_row)
