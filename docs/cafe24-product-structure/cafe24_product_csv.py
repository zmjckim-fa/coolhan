"""Cafe24 상품 업로드 CSV 생성기.

컬럼 순서와 이름은 columns.csv(= 카페24 excelUploadProductDefault 템플릿의 90개 컬럼)가 유일한 기준이다.
입력: 상품 목록(JSON 배열, 키는 컬럼명). 출력: 템플릿과 같은 순서의 CSV(UTF-8 BOM).
사용: python cafe24_product_csv.py 입력.json 출력.csv
"""
import csv
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent
OPTION_RE = re.compile(r"^[^{}|/]+\{[^{}|]+(\|[^{}|]+)*\}(//[^{}|/]+\{[^{}|]+(\|[^{}|]+)*\})*$")
CATEGORY_COLUMNS = ("상품분류 번호", "상품분류 신상품영역", "상품분류 추천상품영역")


def load_columns():
    with open(HERE / "columns.csv", encoding="utf-8-sig", newline="") as f:
        return [row["컬럼명"] for row in csv.DictReader(f)]


COLUMNS = load_columns()


def validate(product):
    """관찰된 규칙(템플릿 예시와 다운로드 파일)만 검사한다. 위반 목록을 돌려준다."""
    errors = []
    unknown = [k for k in product if k not in COLUMNS]
    if unknown:
        errors.append(f"템플릿에 없는 컬럼: {unknown}")
    if not str(product.get("상품명", "")).strip():
        errors.append("상품명이 비어 있음")
    sizes = {len(str(product.get(c, "")).split("|")) for c in CATEGORY_COLUMNS if str(product.get(c, "")) != ""}
    if len(sizes) > 1:
        errors.append("상품분류 번호·신상품영역·추천상품영역의 항목 수가 다름")
    option = str(product.get("옵션입력", ""))
    if option:
        if not OPTION_RE.match(option):
            errors.append(f"옵션입력 형식 오류: {option}")
        else:
            required = str(product.get("필수여부", ""))
            if required and len(required.split("|")) != len(option.split("//")):
                errors.append("필수여부 항목 수가 옵션 개수와 다름")
    return errors


def write_csv(products, path):
    problems = {i: validate(p) for i, p in enumerate(products, 1)}
    problems = {i: e for i, e in problems.items() if e}
    if problems:
        raise ValueError(problems)
    with open(path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.writer(f)
        w.writerow(COLUMNS)
        for p in products:
            w.writerow([p.get(c, "") for c in COLUMNS])


if __name__ == "__main__":
    write_csv(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")), sys.argv[2])
