# 잔여 작업 목록

> 최종 업데이트: 2026-03-18
> Phase 1~4-a(인프라·코드품질·Next.js 이주·Cloudflare 기반) 완료. 이하 Phase 4-b(D1 콘텐츠 API) 잔여 작업.

---

## ✅ 완료된 작업

- [x] **Phase 1**: Docker 환경, 위생 파일(`.gitignore`, `.dockerignore`, `.env.example`), `.docs/` 문서 폴더
- [x] **Phase 2**: 미사용 의존성/파일 제거, 타입 정합성 수정, 하드코딩 제거, i18n 전환, strict mode 활성화, 린트 정상화
- [x] **Phase 3**: Next.js 15 App Router 이주 (`src/app/`, Route Handlers, SSR 가드, hydration 수정)
- [x] **Phase 4-a: 파일 구조 정리**: `src/views/` 제거 → 컴포넌트 `src/app/` 직접 통합
- [x] **Phase 4-a: 빌드 오류 수정**: `NODE_ENV=production` 명시 / `suppressHydrationWarning` / Context localStorage 지연 로딩
- [x] **Phase 4-a: Cloudflare 인프라 기반**
  - [x] `wrangler.json`: D1(`DB`), R2(`MEDIA`) 바인딩 설정
  - [x] `migrations/0001_initial_schema.sql`: D1 전체 스키마 (콘텐츠 + 인증 + 미디어 테이블)
  - [x] `src/lib/db.ts`: CF Workers/Node.js 이중 환경 D1·R2 바인딩 헬퍼
  - [x] `src/lib/auth.ts`: D1 기반 세션 생성·검증·삭제, 쿠키 헤더 빌더
  - [x] `src/lib/adminAuth.ts`: Route Handler 세션 인증 미들웨어 헬퍼
  - [x] `src/app/api/auth/login/route.ts`: `POST` 로그인 → 세션 쿠키 발급
  - [x] `src/app/api/auth/logout/route.ts`: `POST` 세션 삭제
  - [x] `src/app/api/auth/session/route.ts`: `GET` 세션 유효성 확인

---

## 🔲 Phase 4-b: D1 콘텐츠 API 구현

### 1. 공개 콘텐츠 API

- [ ] `src/app/api/content/[lang]/route.ts` — `GET`: 전체 공개 콘텐츠 조회 (`en` | `ko`)
  - D1 → `ContentData` 타입으로 조합하여 반환
  - DB 없는 개발 환경: 기본값 반환 폴백

### 2. 어드민 콘텐츠 CRUD API

모든 라우트에 `requireAdminSession()` 미들웨어 적용.

- [ ] `src/app/api/admin/artist-info/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/biography/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/philosophy/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/home-sections/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/tracks/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/performances/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/events-info/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/link-platforms/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/contact-info/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/theme/route.ts` — `GET` / `PUT`
- [ ] `src/app/api/admin/site-config/route.ts` — `GET` / `PUT`

---

## 🔲 Phase 4-c: 프론트엔드 서비스 계층

- [ ] `src/services/apiClient.ts` — fetch 래퍼 (`ApiResponse<T>`, 에러 처리)
- [ ] `src/services/contentService.ts` — 공개 콘텐츠 API 호출
- [ ] `src/services/adminService.ts` — 어드민 CRUD API 호출
- [ ] `src/services/authService.ts` — 로그인/로그아웃/세션 API 호출 (기존 직접 fetch 대체)

---

## 🔲 Phase 4-d: ContentContext API 전환

- [ ] `src/contexts/ContentContext.tsx`: localStorage 직접 접근 → `contentService` API 호출로 교체
- [ ] `migrateContent()` / `loadFromStorage()` 제거 (D1 전환 후 불필요)
- [ ] 페이지 로드 시 공개 API에서 콘텐츠 fetch → Context 주입

---

## 🔲 Phase 4-e: 데이터 마이그레이션

- [ ] `src/app/api/admin/migrate/route.ts` — `POST`: localStorage JSON → D1 일괄 INSERT (일회성)
  - 실행 후 라우트 삭제 또는 비활성화 처리

---

## 🔲 Phase 4-f: R2 미디어 (낮은 우선순위)

- [ ] `src/app/api/media/upload/route.ts` — `POST`: R2 직접 업로드
- [ ] `src/app/api/media/[id]/route.ts` — `GET` / `DELETE`
- [ ] 어드민 페이지 미디어 업로드 UI 추가

---

## 🔲 Phase 5: 배포

- [ ] Cloudflare Workers 최종 배포 검증 (`npm run build` → `opennextjs-cloudflare`)
- [ ] D1 마이그레이션 원격 적용: `wrangler d1 migrations apply stann-lumo-db --remote`
- [ ] 환경 변수 Cloudflare Dashboard 설정 (`ADMIN_PASSWORD`)
- [ ] `.docs/README.md` 배포 절차 보강

---

## 🔲 기타 개선 (낮은 우선순위)

- [ ] `admin/events/page.tsx` 한국어 하드코딩 잔존 확인 → i18n 전환
- [ ] 어드민 세션 만료 처리 — 자동 로그아웃 및 `/admin` 리다이렉트
- [ ] `src/types/content.ts` 불필요 타입 정리
