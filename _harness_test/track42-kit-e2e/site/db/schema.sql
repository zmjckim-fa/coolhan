-- bakery-hours 스키마 (SQLite 3.51, Node 24 내장 node:sqlite)
-- 이름의 근거: docs/plan/01_공통규칙.md 7절. 타입, 제약, 인덱스의 최종 권위: docs/plan/02_DB.md
-- 여러 번 실행해도 결과가 같다(IF NOT EXISTS). 검증: node db/check-schema.js
-- 외래 키는 없다. 네 테이블은 서로를 가리키지 않는다.
-- 시각 기록 컬럼은 UTC ISO 8601(2026-11-17T04:00:00.000Z)만 받는다.
--   strftime으로 다시 만든 값이 넣은 값과 같아야 통과한다(형식과 실제 날짜를 함께 본다).

-- T-01 business_hour: 요일마다 한 행, 일곱 행 고정
CREATE TABLE IF NOT EXISTS business_hour (
  weekday    INTEGER NOT NULL PRIMARY KEY
             CONSTRAINT ck_business_hour_weekday
             CHECK (weekday BETWEEN 0 AND 6),
  opens_at   TEXT
             CONSTRAINT ck_business_hour_opens_at
             CHECK (opens_at IS NULL
                    OR (opens_at GLOB '[0-2][0-9]:[0-5][05]' AND substr(opens_at, 1, 2) <= '23')),
  closes_at  TEXT
             CONSTRAINT ck_business_hour_closes_at
             CHECK (closes_at IS NULL
                    OR (closes_at GLOB '[0-2][0-9]:[0-5][05]' AND substr(closes_at, 1, 2) <= '23')),
  is_day_off INTEGER NOT NULL DEFAULT 0
             CONSTRAINT ck_business_hour_is_day_off
             CHECK (is_day_off IN (0, 1)),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
             CONSTRAINT ck_business_hour_updated_at
             CHECK (strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) IS updated_at),
  -- 여는 시각과 닫는 시각은 둘 다 있거나 둘 다 비어 있다
  CONSTRAINT ck_business_hour_pair
    CHECK ((opens_at IS NULL) = (closes_at IS NULL)),
  -- 닫는 시각은 여는 시각보다 늦다(자정을 넘기는 영업은 받지 않는다)
  CONSTRAINT ck_business_hour_order
    CHECK (opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at),
  -- 휴무인 요일은 시각이 없다(00_기획서.md 4-5)
  CONSTRAINT ck_business_hour_day_off
    CHECK (is_day_off = 0 OR (opens_at IS NULL AND closes_at IS NULL))
) STRICT, WITHOUT ROWID;

-- 일곱 행은 지우지 못한다
CREATE TRIGGER IF NOT EXISTS trg_business_hour_no_delete
BEFORE DELETE ON business_hour
BEGIN
  SELECT RAISE(ABORT, 'trg_business_hour_no_delete: business_hour rows are fixed');
END;

-- T-02 menu_item
CREATE TABLE IF NOT EXISTS menu_item (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL
              CONSTRAINT ck_menu_item_name
              CHECK (length(name) <= 40 AND length(trim(name)) >= 1),
  price_krw   INTEGER NOT NULL
              CONSTRAINT ck_menu_item_price_krw
              CHECK (price_krw BETWEEN 0 AND 1000000),
  category    TEXT NOT NULL
              CONSTRAINT ck_menu_item_category
              CHECK (category IN ('bread', 'cake', 'cookie', 'drink')),
  sale_status TEXT NOT NULL DEFAULT 'on_sale'
              CONSTRAINT ck_menu_item_sale_status
              CHECK (sale_status IN ('on_sale', 'sold_out')),
  sort_order  INTEGER NOT NULL
              CONSTRAINT ck_menu_item_sort_order
              CHECK (sort_order >= 0),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
              CONSTRAINT ck_menu_item_created_at
              CHECK (strftime('%Y-%m-%dT%H:%M:%fZ', created_at) IS created_at),
  updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
              CONSTRAINT ck_menu_item_updated_at
              CHECK (strftime('%Y-%m-%dT%H:%M:%fZ', updated_at) IS updated_at)
) STRICT;

-- 메뉴 목록: 분류, 순서, 같은 순서면 먼저 만든 것
CREATE INDEX IF NOT EXISTS idx_menu_item_category_sort
  ON menu_item (category, sort_order, id);

-- T-03 admin_session: 토큰 원문은 저장하지 않는다(SHA-256 16진수 64자)
CREATE TABLE IF NOT EXISTS admin_session (
  token_hash TEXT NOT NULL PRIMARY KEY
             CONSTRAINT ck_admin_session_token_hash
             CHECK (length(token_hash) = 64 AND token_hash NOT GLOB '*[^0-9a-f]*'),
  csrf_token TEXT NOT NULL
             CONSTRAINT ck_admin_session_csrf_token
             CHECK (length(csrf_token) BETWEEN 32 AND 128),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
             CONSTRAINT ck_admin_session_created_at
             CHECK (strftime('%Y-%m-%dT%H:%M:%fZ', created_at) IS created_at),
  expires_at TEXT NOT NULL
             CONSTRAINT ck_admin_session_expires_at
             CHECK (strftime('%Y-%m-%dT%H:%M:%fZ', expires_at) IS expires_at),
  CONSTRAINT ck_admin_session_expiry
    CHECK (expires_at > created_at)
) STRICT, WITHOUT ROWID;

-- 만료된 세션 정리
CREATE INDEX IF NOT EXISTS idx_admin_session_expires_at
  ON admin_session (expires_at);

-- T-04 login_attempt
CREATE TABLE IF NOT EXISTS login_attempt (
  id           INTEGER PRIMARY KEY,
  client_key   TEXT NOT NULL
               CONSTRAINT ck_login_attempt_client_key
               CHECK (length(client_key) BETWEEN 1 AND 64),
  attempted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
               CONSTRAINT ck_login_attempt_attempted_at
               CHECK (strftime('%Y-%m-%dT%H:%M:%fZ', attempted_at) IS attempted_at),
  succeeded    INTEGER NOT NULL
               CONSTRAINT ck_login_attempt_succeeded
               CHECK (succeeded IN (0, 1))
) STRICT;

-- 횟수 제한: 한 접속 키의 최근 시도 세기
CREATE INDEX IF NOT EXISTS idx_login_attempt_client_key_attempted_at
  ON login_attempt (client_key, attempted_at);

-- 오래된 시도 정리
CREATE INDEX IF NOT EXISTS idx_login_attempt_attempted_at
  ON login_attempt (attempted_at);
