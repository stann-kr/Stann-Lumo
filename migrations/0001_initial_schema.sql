-- =============================================================
-- stann-lumo D1 초기 스키마
-- Phase 4: Cloudflare D1 + R2 통합
-- =============================================================

-- -------------------------------------------------------------
-- 설정 테이블 (단일 행)
-- -------------------------------------------------------------

-- 사이트 전역 설정
CREATE TABLE IF NOT EXISTS site_config (
  id                  INTEGER PRIMARY KEY DEFAULT 1,
  site_name           TEXT    NOT NULL DEFAULT 'STANN LUMO',
  tagline             TEXT    NOT NULL DEFAULT 'TECHNO / SEOUL',
  version             TEXT    NOT NULL DEFAULT 'v1.0.0',
  terminal_url        TEXT,
  terminal_description TEXT
);

-- 초기 행 삽입
INSERT OR IGNORE INTO site_config (id) VALUES (1);

-- 테마 색상
CREATE TABLE IF NOT EXISTS theme_colors (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  `primary`  TEXT NOT NULL DEFAULT '#00ff00',
  secondary  TEXT NOT NULL DEFAULT '#ffffff',
  accent     TEXT NOT NULL DEFAULT '#00ff00',
  muted      TEXT NOT NULL DEFAULT '#666666',
  bg         TEXT NOT NULL DEFAULT '#000000',
  bg_sidebar TEXT NOT NULL DEFAULT '#000000'
);

-- 초기 행 삽입
INSERT OR IGNORE INTO theme_colors (id) VALUES (1);

-- RA API 설정
CREATE TABLE IF NOT EXISTS ra_api_config (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  user_id TEXT,
  api_key TEXT,
  dj_id   TEXT,
  option  TEXT NOT NULL DEFAULT '1'
);

-- 초기 행 삽입
INSERT OR IGNORE INTO ra_api_config (id) VALUES (1);

-- -------------------------------------------------------------
-- 콘텐츠 테이블 (다국어: lang = 'en' | 'ko')
-- -------------------------------------------------------------

-- 아티스트 정보 key-value
CREATE TABLE IF NOT EXISTS artist_info (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  key        TEXT    NOT NULL,
  value      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 바이오그래피 단락
CREATE TABLE IF NOT EXISTS biography_paragraphs (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  content    TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 음악 철학 항목
CREATE TABLE IF NOT EXISTS musical_philosophy (
  id          TEXT    NOT NULL,
  lang        TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  quote       TEXT    NOT NULL,
  description TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 디자인 철학 단락
CREATE TABLE IF NOT EXISTS design_philosophy_paragraphs (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  content    TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 홈 섹션 카드
CREATE TABLE IF NOT EXISTS home_sections (
  id          TEXT    NOT NULL,
  lang        TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  title       TEXT    NOT NULL,
  description TEXT    NOT NULL,
  path        TEXT    NOT NULL,
  icon        TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 음악 트랙
CREATE TABLE IF NOT EXISTS tracks (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  title      TEXT    NOT NULL,
  type       TEXT    NOT NULL,
  duration   TEXT    NOT NULL,
  year       TEXT    NOT NULL,
  platform   TEXT    NOT NULL,
  link       TEXT    NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 공연 일정 (언어 무관)
CREATE TABLE IF NOT EXISTS performances (
  id            TEXT NOT NULL PRIMARY KEY,
  date          TEXT NOT NULL,
  venue         TEXT NOT NULL,
  location      TEXT,
  time          TEXT,
  title         TEXT NOT NULL,
  lineup        TEXT,
  ra_event_link TEXT,
  ra_event_id   TEXT,
  status        TEXT NOT NULL CHECK (status IN ('Confirmed', 'Pending', 'Cancelled')),
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- 이벤트 기본 정보 (언어 무관 단일 행)
CREATE TABLE IF NOT EXISTS events_info (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  contact_email  TEXT NOT NULL DEFAULT '',
  response_time  TEXT NOT NULL DEFAULT ''
);

INSERT OR IGNORE INTO events_info (id) VALUES (1);

-- 세트 길이 목록 (언어별)
CREATE TABLE IF NOT EXISTS events_set_durations (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  value      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 기술 요구사항 목록 (언어별)
CREATE TABLE IF NOT EXISTS events_tech_requirements (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  value      TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 링크 플랫폼
CREATE TABLE IF NOT EXISTS link_platforms (
  id          TEXT    NOT NULL,
  lang        TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  platform    TEXT    NOT NULL,
  url         TEXT    NOT NULL,
  icon        TEXT    NOT NULL,
  description TEXT    NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 연락처 항목
CREATE TABLE IF NOT EXISTS contact_info (
  id         TEXT    NOT NULL,
  lang       TEXT    NOT NULL CHECK (lang IN ('en', 'ko')),
  label      TEXT    NOT NULL,
  value      TEXT    NOT NULL,
  icon       TEXT    NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- -------------------------------------------------------------
-- 인증 테이블
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_sessions (
  id         TEXT    NOT NULL PRIMARY KEY,
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at
  ON admin_sessions (expires_at);

-- -------------------------------------------------------------
-- 미디어 테이블
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS media_files (
  id         TEXT    NOT NULL PRIMARY KEY,
  r2_key     TEXT    NOT NULL UNIQUE,
  filename   TEXT    NOT NULL,
  mime_type  TEXT    NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
