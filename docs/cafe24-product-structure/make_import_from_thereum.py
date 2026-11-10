"""더리움에서 조사한 데이터 전체를 카페24 업로드 엑셀로 만든다.

산출물(import/):
- 카페24_상품_import_USM_Haller_더리움구성.xlsx : 첫 시트 '상품' = 카페24 업로드 형식(90컬럼). 나머지 시트 = 조사한 나머지 데이터 전부
- 카페24_상품_import_USM_Haller_더리움구성.csv  : '상품' 시트만(업로드 전용)
- 색별가격_API용.csv                         : 색 선택 시 단가 목록(카페24 품목 API용)

원본: ../furniture-research/thereum/ (thereum_catalog.sqlite, products.json, seo-raw.json, reviews/products.txt)
상품명은 더리움 사이트의 상품명 그대로, 이미지는 더리움 상품 이미지 주소를 그대로 넣는다.
"더리움의 자산"이라고 적힌 상품 12개는 이미지를 넣지 않는다. 이미지를 빼려면 USE_IMAGES = False.
사용: python make_import_from_thereum.py
"""
import csv
import json
import re
import sqlite3
from pathlib import Path

from openpyxl import Workbook
from openpyxl.cell import WriteOnlyCell

import cafe24_product_csv as m

USE_IMAGES = True
HERE = Path(__file__).parent
SRC = HERE.parent / "furniture-research" / "thereum"
OUT = HERE / "import"
STEM = "카페24_상품_import_USM_Haller_더리움구성"
NOTICE = "이 상품 이미지는 더리움의 자산입니다"

CUSTOMS = {"grid": "ALAFAC00", "storage_box": "ALAFAC00", "trolley": "ALAFAC00", "tv": "ALALAD00",
           "table": "ALALAB00", "side_table": "ALALAB00", "sofa_table": "ALALAB00"}
KIND_LABEL = {"grid": "수납 모듈", "tv": "TV장", "side_table": "협탁", "table": "테이블",
              "sofa_table": "소파 테이블", "trolley": "트롤리", "storage_box": "수납 박스"}
VIEW_ORDER = ["official", "front", "left", "right", "top", "open"]


def text(v):
    return v if isinstance(v, str) else json.dumps(v, ensure_ascii=False)


def paragraphs_html(desc):
    paras = [p.strip() for p in (desc or "").split("\n") if p.strip() and NOTICE not in p]
    return "".join(f"<p>{p}</p>" for p in paras)


def load():
    c = sqlite3.connect(SRC / "thereum_catalog.sqlite")
    c.row_factory = sqlite3.Row
    site = {int(r["id"]): r for r in json.load(open(SRC / "products.json", encoding="utf-8"))}
    seo = {r["product_no"]: r for r in json.load(open(SRC / "seo-raw.json", encoding="utf-8"))}
    reviews = {}
    for line in open(SRC / "reviews" / "products.txt", encoding="utf-8").read().strip().split("\n"):
        pc, name, n, avg, sm, own = line.split("|")
        reviews[int(pc)] = (int(n), avg, int(sm), int(own))
    colors, assets = {}, {}
    for r in c.execute("select pc.product_no,co.name_ko,co.hex,pc.unit_price,pc.item_code from product_colors pc "
                       "join colors co on co.color_id=pc.color_id where pc.is_display='T' and pc.is_selling='T' "
                       "order by pc.product_no,co.color_id"):
        colors.setdefault(r["product_no"], []).append(r)
    for r in c.execute("select product_no,color_code,view_kind,url from viewer_assets "
                       "where view_kind in ('official','front','left','right','top','open') order by product_no,color_code"):
        assets.setdefault(r["product_no"], {}).setdefault(r["color_code"], {})[r["view_kind"]] = r["url"]
    cats = {}
    for r in c.execute("select pc.product_no,ca.name from product_categories pc join categories ca on ca.cate_no=pc.cate_no"):
        cats.setdefault(r["product_no"], []).append(r["name"])
    return c, site, seo, reviews, colors, assets, cats


def upload_row(p, site, seo, reviews, cols, assets, cats):
    no = p["product_no"]
    s = site[no]
    name = s["name"]
    kind = p["kind"]
    summary = KIND_LABEL.get(kind, "")
    if p["grid_cols"] and p["grid_rows"]:
        summary += f" · 가로 {p['grid_cols']}칸 × 세로 {p['grid_rows']}단"
    summary = summary or p["name"]
    sk = seo.get(no, {})
    keywords = ",".join(k.strip() for k in (sk.get("keywords") or "").split(",") if k.strip() and "더리움" not in k)
    title = re.sub(r"\s*-\s*더리움\s*$", "", sk.get("title") or name)
    brief = p["desc_title"] or name
    rv = reviews.get(no)
    memo = [f"더리움 링크 {s['url']}", f"더리움#{no}", f"코드 {p['product_code']}", f"종류 {kind}",
            f"구성 {p['grid_cols']}x{p['grid_rows']} {p['panel_mode']}" if p["grid_cols"] else "",
            f"납기 {p['lead_time_text']}" if p["lead_time_text"] else "", f"이행 {p['fulfilment']}",
            f"최적할인가 {p['best_price']}", f"더리움 카테고리 {', '.join(cats.get(no, []))}",
            f"후기 {rv[0]}건 평점 {rv[1]}" if rv else ""]
    out = {
        "자체 상품코드": f"USM-{no}", "진열상태": "N", "판매상태": "N",
        "상품명": name, "상품명(관리용)": f"{no} | {p['name']}", "상품 요약설명": summary, "상품 간략설명": brief,
        "상품 상세설명": paragraphs_html(p["description"]), "모바일 상품 상세설명 설정": "A", "검색어설정": keywords,
        "과세구분": "A|10", "소비자가": p["consumer_price"] or p["price"], "상품가": p["price"] * 10 // 11,
        "판매가": p["price"], "판매가 대체문구 사용": "N", "주문수량 제한 기준": "O", "최소 주문수량(이상)": p["min_qty"] or 1,
        "적립금": 0, "적립금 구분": "P", "공통이벤트 정보": "Y", "성인인증": "N", "추가입력옵션": "F",
        "제조사": "M0000000", "공급사": "S0000000", "브랜드": "B0000000", "트렌드": "T0000000", "자체분류 코드": "C000000A",
        "유효기간 사용여부": "F", "검색엔진최적화(SEO) 검색엔진 노출 설정": "Y", "검색엔진최적화(SEO) Title": title,
        "검색엔진최적화(SEO) Description": summary, "검색엔진최적화(SEO) Keywords": keywords,
        "검색엔진최적화(SEO) 상품 이미지 Alt 텍스트": name, "상품배송유형 코드": "C",
        "메모": " | ".join(x for x in memo if x),
    }
    if p["max_qty"] and p["max_qty"] > 0:
        out["최대 주문수량(이하)"] = p["max_qty"]
    if kind in CUSTOMS:
        out["상품 구분(해외통관)"] = CUSTOMS[kind]
    if p["has_color_option"] and cols:
        out.update({"옵션사용": "Y", "품목 구성방식": "T", "옵션 표시방식": "S",
                    "옵션입력": "색상{" + "|".join(c["name_ko"] for c in cols) + "}", "필수여부": "T"})
        if all(c["hex"] for c in cols):
            out["색상 설정"] = "{" + "|".join(c["hex"] for c in cols) + "}"
    if USE_IMAGES and NOTICE not in (p["description"] or "") and s.get("image"):
        out.update({"이미지등록(상세)": s["image"], "이미지등록(목록)": s["image"],
                    "이미지등록(작은목록)": s["image"], "이미지등록(축소)": s["image"]})
        views = assets.get(no)
        if views:
            code = max(views, key=lambda k: len(views[k]))
            extra = [views[code][v] for v in VIEW_ORDER if v in views[code]]
            if extra:
                out["이미지등록(추가)"] = "|".join(extra)
    return out


def dump(wb, title, cursor):
    ws = wb.create_sheet(title)
    ws.append([d[0] for d in cursor.description])
    for r in cursor:
        ws.append(list(r))
    return ws


def main():
    c, site, seo, reviews, colors, assets, cats = load()
    public = c.execute("select * from products where access='public' order by product_no").fetchall()
    rows = [upload_row(p, site, seo, reviews, colors.get(p["product_no"], []), assets, cats) for p in public]
    OUT.mkdir(exist_ok=True)
    m.write_csv(rows, OUT / f"{STEM}.csv")

    wb = Workbook(write_only=True)
    ws = wb.create_sheet("상품")
    ws.append(m.COLUMNS)
    for r in rows:
        ws.append([r.get(col, "") for col in m.COLUMNS])

    ws = wb.create_sheet("더리움_링크")
    ws.append(["자체 상품코드", "상품명", "더리움 상품 링크(클릭)", "더리움 대표 이미지 링크(클릭)"])
    for r, p in zip(rows, public):
        cells = [r["자체 상품코드"], r["상품명"]]
        for url in (site[p["product_no"]]["url"], site[p["product_no"]].get("image") or ""):
            cell = WriteOnlyCell(ws, value=url)
            if url:
                cell.hyperlink = url
            cells.append(cell)
        ws.append(cells)

    ws = wb.create_sheet("더리움_원본상품")
    ws.append(["product_no", "사이트 상품명", "사이트 대표이미지", "사이트 URL", "사이트 카테고리", "사이트 가격표기", "사이트 정보", "사이트 옵션조합",
               "SEO title", "SEO meta_description", "SEO keywords", "후기수", "후기 평점", "스마트스토어 후기", "자사몰 후기"]
              + [r[1] for r in c.execute("pragma table_info(products)")])
    for p in c.execute("select * from products order by product_no"):
        s, sk, rv = site.get(p["product_no"], {}), seo.get(p["product_no"], {}), reviews.get(p["product_no"])
        ws.append([p["product_no"], s.get("name"), s.get("image"), s.get("url"), text(s.get("categories", "")), s.get("price_text"),
                   text(s.get("info", "")), text(s.get("option_combinations", "")), sk.get("title"), sk.get("meta_description"), sk.get("keywords"),
                   rv[0] if rv else None, rv[1] if rv else None, rv[2] if rv else None, rv[3] if rv else None] + list(p))
    for title, sql in [
        ("색상_SKU", "select pc.*,co.name_ko as 색상명,co.hex as 색상값 from product_colors pc left join colors co on co.color_id=pc.color_id order by pc.product_no,pc.item_code"),
        ("색상표", "select * from colors order by color_id"),
        ("카테고리", "select pc.product_no,pc.cate_no,ca.name,ca.kind from product_categories pc join categories ca on ca.cate_no=pc.cate_no order by pc.product_no"),
        ("부속상품", "select * from addon_products order by add_product_no"),
        ("상품_부속연결", "select pa.product_no,pa.add_product_no,ap.name as 부속상품명 from product_addons pa join addon_products ap on ap.add_product_no=pa.add_product_no order by pa.product_no"),
        ("부속옵션", "select * from addon_options order by add_product_no,item_code"),
        ("구성기_이미지", "select * from viewer_assets order by product_no,asset_key"),
        ("구성기_치수", "select * from viewer_dimensions order by product_no"),
        ("구성기_바퀴", "select * from viewer_bases order by product_no"),
        ("브랜드", "select * from brands")]:
        dump(wb, title, c.execute(sql))
    wb.save(OUT / f"{STEM}.xlsx")

    with open(OUT / "색별가격_API용.csv", "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(["자체 상품코드", "색상", "품목코드(더리움)", "색 선택 시 단가", "상품 판매가와의 차이"])
        base = {p["product_no"]: p["price"] for p in public}
        for no, cols in colors.items():
            if no in base:
                for col in cols:
                    w.writerow([f"USM-{no}", col["name_ko"], col["item_code"], col["unit_price"], col["unit_price"] - base[no]])
    with_img = sum(1 for r in rows if r.get("이미지등록(상세)"))
    print(f"상품 {len(rows)}개 (이미지 연결 {with_img}개, 추가 이미지 {sum(1 for r in rows if r.get('이미지등록(추가)'))}개)")


if __name__ == "__main__":
    main()
