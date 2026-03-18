# 변경 이력

---

## [Unreleased] — 2026-03-18

### Hydration 오류 수정

#### 수정

- `src/app/layout.tsx`: `<html suppressHydrationWarning>` — inline 스크립트의 CSS 변수 주입으로 인한 hydration 불일치 억제
- `src/contexts/LanguageContext.tsx`: `useState` 초기값 `'en'` 고정 → `useEffect`에서 localStorage 복원 (SSR/CSR 불일치 해소)
- `src/contexts/ContentContext.tsx`: `useState` 초기값 `defaultMultiLanguageContent` 고정 → `useEffect`에서 `loadFromStorage()` 호출. `migrateContent` 함수 모듈 수준으로 추출

---

## [Unreleased] — 2026-03-17 (Phase 4-a Cloudflare 기반)

### Phase 4-a: Cloudflare 인프라 기반 구축

#### 추가

- `wrangler.json`: Cloudflare Workers 설정 — D1(`DB`), R2(`MEDIA`) 바인딩, `nodejs_compat` 플래그
- `open-next.config.ts`: `@opennextjs/cloudflare` 어댑터 설정 (`cloudflare-node` wrapper, `edge` converter)
- `migrations/0001_initial_schema.sql`: D1 전체 스키마 (콘텐츠 12개 + 인증 + 미디어 테이블)
- `src/lib/db.ts`: CF Workers/Node.js 이중 환경 D1·R2 바인딩 헬퍼 (`getDB`, `getR2`, `getEnv`)
- `src/lib/auth.ts`: D1 기반 세션 관리 (`createSession`, `validateSession`, `deleteSession`, `buildSessionCookieHeader`)
- `src/lib/adminAuth.ts`: Route Handler 세션 인증 미들웨어 (`requireAdminSession`)
- `src/app/api/auth/login/route.ts`: `POST` — 비밀번호 검증 → 세션 쿠키 발급
- `src/app/api/auth/logout/route.ts`: `POST` — 세션 삭제
- `src/app/api/auth/session/route.ts`: `GET` — 세션 유효성 확인

#### 수정

- `package.json`: `@opennextjs/cloudflare`, `wrangler`, `@cloudflare/workers-types` devDependencies 추가
- `docker-compose.yml`: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` 환경변수 추가
- `.env.example`: Cloudflare 관련 변수 추가
- `eslint.config.ts`: `no-require-imports` 규칙 조정 (dynamic require 허용)

---

## [Unreleased] — 2026-03-17 (Phase 4)

### Phase 4: 빌드 오류 수정 + 파일 구조 정리 (완료)

#### 추가

- `src/app/global-error.tsx`: 루트 레이아웃 에러 바운더리 (App Router, `<html>/<body>` 포함)
- `src/components/home/TypingText.tsx`: 터미널 타이핑 애니메이션 컴포넌트 (이동)
- `src/components/home/CursorGlow.tsx`: 마우스 커서 글로우 효과 컴포넌트 (이동)
- `src/components/home/LiveClock.tsx`: 서울 시간 실시간 시계 컴포넌트 (이동)

#### 수정

- `src/app/layout.tsx`: `export const dynamic = 'force-dynamic'` 추가 — 정적 사전 렌더링 비활성화
- `src/app/not-found.tsx`: Server Component로 전환, `export const dynamic = 'force-dynamic'` 추가
- `src/components/feature/TerminalLayout.tsx`: 미사용 `Link` import 제거, home 서브컴포넌트 경로 갱신
- `src/components/feature/PageLayout.tsx`: TypingText import 경로 갱신
- `src/lib/db.ts`: eslint-disable 주석 정비
- `package.json`: build 스크립트에 `NODE_ENV=production` 명시 (Docker 환경 영향 차단)
- `src/app/(public)/page.tsx` ~ `src/app/admin/(dashboard)/music/page.tsx`: `src/views/` 컴포넌트 직접 이관

#### 삭제

- `src/views/` (전체) — thin wrapper 이중 레이어 제거

---

## [Unreleased] — 2026-03-17

### Phase 3: Next.js 15 App Router 이주 (완료)

#### 추가

- `next.config.ts`: Next.js 설정 (standalone 출력)
- `app/layout.tsx`: Root layout (Server Component, metadata + hydration script)
- `app/Providers.tsx`: Client 측 I18nextProvider + LanguageProvider + ContentProvider
- `app/globals.css`: 전역 CSS (src/index.css → app/globals.css)
- `app/not-found.tsx`: 404 페이지 래퍼
- `app/(public)/layout.tsx`: 공개 페이지 그룹 — TerminalLayout 래핑
- `app/(public)/(page).tsx`: 공개 6개 페이지 라우트 래퍼 (/, /about, /music, /events, /contact, /link)
- `app/admin/page.tsx`: 어드민 로그인 래퍼
- `app/admin/(dashboard)/layout.tsx`: ProtectedRoute + AdminLayout 그룹 레이아웃
- `app/admin/(dashboard)/(page).tsx`: 어드민 7개 페이지 라우트 래퍼
- `app/api/auth/login/route.ts`: 인증 Route Handler (ADMIN_PASSWORD 서버사이드 검증)
- `postcss.config.js`: Next.js 호환 PostCSS 설정 (CJS)

#### 수정

- `package.json`: next@15 추가, vite/react-router-dom/unplugin-auto-import/eslint-plugin-react-refresh 제거
- `tsconfig.json`: jsx: preserve, plugins: next, app/ include — Next.js 호환 tsconfig로 대체
- `docker-compose.yml`: .next 익명 볼륨 추가, 환경변수 VITE_ → NEXT_PUBLIC_ 전환
- `.env.example`: VITE_ 접두사 제거, ADMIN_PASSWORD 서버사이드 전용
- `.gitignore`: .next/ 추가
- `tailwind.config.ts`: app/**/*.{ts,tsx} content 경로 추가
- `eslint.config.ts`: autoImportGlobals, react-refresh, route-element-jsx 제거
- `src/i18n/local/index.ts`: import.meta.glob → 정적 import (en, ko)
- `src/constants/site.ts`: VITE_TERMINAL_URL → NEXT_PUBLIC_TERMINAL_URL
- `src/contexts/LanguageContext.tsx`: SSR 가드 (typeof window === 'undefined')
- `src/contexts/ContentContext.tsx`: SSR 가드 (typeof window === 'undefined')
- `src/components/feature/TerminalLayout.tsx`: useNavigate/useLocation → useRouter/usePathname (next/navigation), 'use client' 추가
- `src/components/feature/AdminLayout.tsx`: useNavigate/useLocation → useRouter/usePathname, 'use client' 추가
- `src/components/feature/ProtectedRoute.tsx`: Navigate → useRouter + useEffect, 'use client' 추가
- `src/pages/admin/login/page.tsx`: VITE_ADMIN_PASSWORD 제거 → /api/auth/login Route Handler 호출
- `src/pages/NotFound.tsx`: useLocation → usePathname (next/navigation), 'use client' 추가
- `src/pages/contact/page.tsx`: VITE_FORM_ENDPOINT → NEXT_PUBLIC_FORM_ENDPOINT
- `src/pages/home/page.tsx`: Link to= → Link href= (next/link), 'use client' 추가

#### 삭제

- `vite.config.ts`, `index.html`, `vite-env.d.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `postcss.config.ts`, `auto-imports.d.ts`
- `src/router/` (전체), `src/App.tsx`, `src/main.tsx`

---

## [Unreleased] — 2026-03-17

### Phase 1: 인프라 기반 정비

#### 추가

- `Dockerfile`: Node 22 Alpine, `platform: linux/arm64` 명시
- `docker-compose.yml`: `web` 서비스, port 3000, 볼륨 마운트 + `node_modules` 익명 볼륨
- `.dockerignore`: `node_modules`, `out`, `.git`, `.DS_Store` 제외
- `.gitignore`: `node_modules/`, `out/`, `.env`, `.DS_Store`, `auto-imports.d.ts` 등 추가
- `.env.example`: 환경 변수 템플릿 생성
- `.docs/` 문서 폴더: README, CHANGE_LOG, TROUBLESHOOTING, REQUIREMENTS, TECH_SPEC

### Phase 2: 코드 정리 및 품질 개선

#### 제거

- `package.json`: 미사용 의존성 제거 (`firebase`, `@supabase/supabase-js`, `@stripe/react-stripe-js`, `recharts`, `lucide-react`)
- `src/utils/validation.ts`: 미사용 파일 삭제
- `src/components/base/SectionHeader.tsx`: 미사용 파일 삭제
- `src/components/base/LanguageTab.tsx`: 미사용 파일 삭제

#### 수정

- `src/utils/raApi.ts`: `RAEvent` → `RAEventXML` 타입 불일치 수정, `userid`/`djid` → `userId`/`djId` camelCase 통일
- `src/types/admin.ts`: `AdminFormReturn`, `ListEditorReturn`, `DeleteConfirmReturn` 인터페이스 실제 hook 반환값과 일치하도록 갱신
- `src/router/index.ts`: `window.REACT_APP_NAVIGATE` 전역 패턴 제거
- `src/router/config.tsx`: `withSuspense` 헬퍼 제거 → 각 라우트에 `<Suspense>` 인라인 적용, `PageFallback`/`ProtectedRoute` 별도 파일 분리
- `src/components/feature/PageLayout.tsx`: 미사용 `currentView` prop 제거
- `src/pages/admin/login/page.tsx`: 하드코딩 색상 → CSS 변수, 비밀번호 → `VITE_ADMIN_PASSWORD` 환경변수
- `src/pages/admin/theme/page.tsx`: 미사용 `saved` 상태 제거 → `useSaveNotification` + `SuccessMessage` 통일
- `src/pages/NotFound.tsx`: Tailwind 기본 색상 → CSS 커스텀 프로퍼티 전환
- `src/pages/contact/page.tsx`: 하드코딩 폼 엔드포인트 → `VITE_FORM_ENDPOINT` 환경변수 전환
- `src/components/feature/TerminalLayout.tsx`: 하드코딩 브랜드 텍스트/URL → 환경변수/상수 분리
- `src/components/base/DeleteConfirmModal.tsx`: 한국어 하드코딩 → i18n 키 전환
- `src/components/base/ListItemEditor.tsx`: 한국어 하드코딩 → i18n 키 전환
- `src/utils/colorMix.ts`: 미사용 `COLOR_VARS` import 제거
- `src/contexts/ContentContext.tsx`: 미사용 타입 import 제거, fast-refresh eslint-disable 주석 추가
- `src/contexts/LanguageContext.tsx`: fast-refresh eslint-disable 주석 추가
- `src/i18n/local/index.ts`: 중국어 주석 → 한국어 전환
- `tsconfig.app.json`: `"strict": true` 활성화
- `eslint.config.ts`: `no-explicit-any`, `no-unused-vars`, `prefer-const` → `'warn'` 전환

#### 파일 추가

- `src/components/feature/PageFallback.tsx`: 라우트 로딩 폴백 컴포넌트 분리
- `src/components/feature/ProtectedRoute.tsx`: 어드민 인증 가드 컴포넌트 분리
- `src/constants/site.ts`: 사이트 브랜드 상수 (`SITE_NAME`, `SITE_TAGLINE`, `SITE_VERSION`, `TERMINAL_URL`)

#### 검증

- `npm run type-check`: 타입 에러 0개
- `npm run lint`: 경고/에러 0개
- Docker 개발 서버 (`localhost:3000`) 정상 실행 확인
