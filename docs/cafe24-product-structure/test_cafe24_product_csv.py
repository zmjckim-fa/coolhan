import csv
import tempfile
import unittest
from pathlib import Path

import cafe24_product_csv as m

OK = {"상품명": "시험 상품", "상품분류 번호": "26|29", "상품분류 신상품영역": "N|Y", "상품분류 추천상품영역": "N|Y",
      "옵션사용": "Y", "품목 구성방식": "T", "옵션입력": "색상{빨강|파랑}//사이즈{55|66}", "필수여부": "T|F"}


class T(unittest.TestCase):
    def test_columns(self):
        self.assertEqual(len(m.COLUMNS), 90)
        self.assertEqual(len(set(m.COLUMNS)), 90)
        self.assertEqual(m.COLUMNS[0], "상품코드")
        self.assertEqual(m.COLUMNS[-1], "메모")

    def test_valid_product(self):
        self.assertEqual(m.validate(OK), [])

    def test_rejects(self):
        self.assertTrue(m.validate({**OK, "없는컬럼": "x"}))
        self.assertTrue(m.validate({**OK, "상품명": ""}))
        self.assertTrue(m.validate({**OK, "상품분류 신상품영역": "N"}))
        self.assertTrue(m.validate({**OK, "옵션입력": "색상(빨강)"}))
        self.assertTrue(m.validate({**OK, "필수여부": "T"}))

    def test_write_keeps_template_order(self):
        with tempfile.TemporaryDirectory() as d:
            p = Path(d) / "out.csv"
            m.write_csv([OK], p)
            rows = list(csv.reader(open(p, encoding="utf-8-sig", newline="")))
        self.assertEqual(rows[0], m.COLUMNS)
        self.assertEqual(len(rows[1]), 90)
        self.assertEqual(rows[1][m.COLUMNS.index("상품명")], "시험 상품")
        self.assertEqual(rows[1][m.COLUMNS.index("옵션입력")], "색상{빨강|파랑}//사이즈{55|66}")

    def test_write_refuses_invalid(self):
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(ValueError):
                m.write_csv([{"상품명": ""}], Path(d) / "x.csv")


if __name__ == "__main__":
    unittest.main()
