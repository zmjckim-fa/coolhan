-- bakery-hours 처음 상태 (docs/plan/01_공통규칙.md 7절)
-- business_hour 일곱 행만 넣는다. 시각은 비어 있고 휴무가 아니다(영업 상태 unset).
-- menu_item에는 아무것도 넣지 않는다. 지어낸 영업시간이나 메뉴는 없다.
-- 여러 번 실행해도 일곱 행이고, 이미 있는 행(관리자가 고친 영업시간)은 건드리지 않는다.
INSERT INTO business_hour (weekday)
VALUES (0), (1), (2), (3), (4), (5), (6)
ON CONFLICT (weekday) DO NOTHING;
