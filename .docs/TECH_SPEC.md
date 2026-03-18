# 기술 명세서

---

## 현재 아키텍처 (Phase 2)

### 상태 관리

- `ContentContext`: localStorage 기반 다국어 콘텐츠 관리 (EN/KO)
- `LanguageContext`: 언어 선택 상태
- 인증: `VITE_ADMIN_PASSWORD` 환경변수 비교 → localStorage 플래그

### 데이터 흐름

```
ContentContext (localStorage)
  └─ content[language]
       ├─ artistInfo, biography, musicalPhilosophy, designPhilosophy
       ├─ homeSections, tracks, performances, eventsInfo
       ├─ linkPlatforms, terminalInfo, contactInfo
       └─ themeColors → CSS 변수 적용
```

---

## Phase 3 — Cloudflare D1 스키마 설계

### 설정 테이블

```sql
-- 사이트 전역 설정 (단일 행)
CREATE TABLE site_config (
  id                   INTEGER PRIMARY KEY DEFAULT 1,
  site_name            TEXT    NOT NULL DEFAULT 'STANN LUMO',
  tagline              TEXT    NOT NULL DEFAULT 'TECHNO / SEOUL',
  version              TEXT    NOT NULL DEFAULT 'v1.0.0',
  terminal_url         TEXT,
  terminal_description TEXT  -- terminalInfo.description 저장
);

-- 테마 색상 (단일 행)
-- 주의: primary 는 SQL 예약어 → 쿼리 시 백틱 처리 (`primary`)
CREATE TABLE theme_colors (
  id         INTEGER PRIMARY KEY DEFAULT 1,
  `primary`  TEXT NOT NULL DEFAULT '#00ff00',
  secondary  TEXT NOT NULL DEFAULT '#ffffff',
  accent     TEXT NOT NULL DEFAULT '#00ff00',
  muted      TEXT NOT NULL DEFAULT '#666666',
  bg         TEXT NOT NULL DEFAULT '#000000',
  bg_sidebar TEXT NOT NULL DEFAULT '#000000'  -- 사이드바/모바일 헤더 별도 배경색
);

-- RA API 설정 (단일 행)
CREATE TABLE ra_api_config (
  id      INTEGER PRIMARY KEY DEFAULT 1,
  user_id TEXT,
  api_key TEXT,
  dj_id   TEXT,
  option  TEXT NOT NULL DEFAULT '1'
);
```

### 콘텐츠 테이블 (다국어: lang 컬럼 EN/KO)

```sql
-- 아티스트 정보 key-value
CREATE TABLE artist_info (
  id    TEXT NOT NULL,
  lang  TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  key   TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 바이오그래피 단락
CREATE TABLE biography_paragraphs (
  id         TEXT NOT NULL,
  lang       TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  content    TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 음악 철학
CREATE TABLE musical_philosophy (
  id          TEXT NOT NULL,
  lang        TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  quote       TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 디자인 철학 단락
CREATE TABLE design_philosophy_paragraphs (
  id         TEXT NOT NULL,
  lang       TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  content    TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 홈 섹션 카드
CREATE TABLE home_sections (
  id          TEXT NOT NULL,
  lang        TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  path        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 트랙
CREATE TABLE tracks (
  id         TEXT NOT NULL,
  lang       TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  title      TEXT NOT NULL,
  type       TEXT NOT NULL,
  duration   TEXT NOT NULL,
  year       TEXT NOT NULL,
  platform   TEXT NOT NULL,
  link       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 공연 일정
CREATE TABLE performances (
  id           TEXT NOT NULL,
  date         TEXT NOT NULL,
  venue        TEXT NOT NULL,
  location     TEXT,
  time         TEXT,
  title        TEXT NOT NULL,
  lineup       TEXT,
  ra_event_link TEXT,
  ra_event_id  TEXT,
  status       TEXT NOT NULL CHECK (status IN ('Confirmed', 'Pending', 'Cancelled')),
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id)
);

-- 이벤트 정보
CREATE TABLE events_info (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  contact_email  TEXT NOT NULL,
  response_time  TEXT NOT NULL
);

CREATE TABLE events_set_durations (
  id         TEXT PRIMARY KEY,
  lang       TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  value      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE events_tech_requirements (
  id         TEXT PRIMARY KEY,
  lang       TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  value      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- 링크 플랫폼
CREATE TABLE link_platforms (
  id          TEXT NOT NULL,
  lang        TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  platform    TEXT NOT NULL,
  url         TEXT NOT NULL,
  icon        TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);

-- 연락처
CREATE TABLE contact_info (
  id         TEXT NOT NULL,
  lang       TEXT NOT NULL CHECK (lang IN ('en', 'ko')),
  label      TEXT NOT NULL,
  value      TEXT NOT NULL,
  icon       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (id, lang)
);
```

### 인증 테이블

```sql
-- admin_users 테이블 없음 — ADMIN_PASSWORD 환경변수 단일 비밀번호 방식 유지
-- 세션만 D1에 저장 (HTTP-only 쿠키 기반)
CREATE TABLE admin_sessions (
  id         TEXT NOT NULL PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);

CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions (expires_at);
```

### 미디어 테이블

```sql
CREATE TABLE media_files (
  id         TEXT PRIMARY KEY,
  r2_key     TEXT NOT NULL UNIQUE,
  filename   TEXT NOT NULL,
  mime_type  TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## Phase 3 — API 엔드포인트 설계

```
functions/api/
  auth/login.ts          POST  로그인 → 세션 쿠키 발급
  auth/logout.ts         POST  세션 삭제
  auth/session.ts        GET   세션 유효성 확인
  content/[lang].ts      GET   공개 콘텐츠 전체 조회
  admin/_middleware.ts         세션 인증 미들웨어
  admin/artist-info.ts   GET/PUT
  admin/biography.ts     GET/PUT
  admin/philosophy.ts    GET/PUT
  admin/home-sections.ts GET/PUT
  admin/tracks.ts        GET/PUT
  admin/performances.ts  GET/PUT
  admin/events-info.ts   GET/PUT
  admin/link-platforms.ts GET/PUT
  admin/contact-info.ts  GET/PUT
  admin/theme.ts         GET/PUT
  admin/site-config.ts   GET/PUT
  media/upload.ts        POST  R2 업로드
  media/[id].ts          GET/DELETE
```

### API 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
```

---

## R2 스토리지 구조

```
stann-lumo-media/
  images/profile/{uuid}.{ext}
  images/events/{uuid}.{ext}
  audio/tracks/{uuid}.{ext}
  audio/mixes/{uuid}.{ext}
  documents/{uuid}.{ext}
```
