# stann-lumo 문서

## 개요

`stann-lumo`는 Stann Lumo의 음악, 공연, archive, contact/link 표면을 제공하는 Next.js 기반 artist web app이다. 3D scene, terminal-inspired layout, 다국어 콘텐츠, admin CMS, Cloudflare D1/R2 배포 구조를 포함한다.

## 현재 상태

- Next.js 15, React 19 기반 web-app/brand-site다.
- public route와 admin dashboard route를 함께 가진다.
- Cloudflare/OpenNext 배포를 사용하며 D1 database와 R2 bucket을 바인딩한다.
- STANN OS 일관화 규칙에 맞춰 hub/live interface와 연결된다.

## 빠른 시작

```bash
docker compose up --build
```

또는 로컬 Node 환경에서:

```bash
npm install
cp .env.example .env
cp .dev.vars.example .dev.vars
npm run dev
```

개발 서버는 항상 `http://localhost:3004`에서 실행한다. 공개 URL은 `.env`, 로컬 서버 전용 값은 git-ignored `.dev.vars`에 둔다.

`npm run dev`는 `.next`, `npm run build`는 `.next-build`를 사용한다. 따라서 개발 서버를 유지한 상태에서도 표준 빌드 산출물이 충돌하지 않으며, `npm run start`는 `.next-build`를 실행한다.

## 기술 스택

| 영역 | 내용 |
|---|---|
| Framework | Next.js 15 App Router |
| React | React 19 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Motion | GSAP, Framer Motion, SplitType |
| 3D | Three.js, React Three Fiber, Drei, Postprocessing |
| i18n | i18next, react-i18next |
| Deploy | OpenNext for Cloudflare, Wrangler |
| Storage | Cloudflare D1, R2 |

## 주요 구조

```text
src/app/(public)/        # public artist site routes
src/app/admin/           # admin dashboard routes
src/components/base/     # reusable UI primitives
src/components/feature/  # layout, scene, protected route
src/contexts/            # language/content contexts
src/constants/           # site and signal constants
wrangler.json            # Cloudflare bindings
docs/                    # public project docs
```

## 문서 목록

- [요구사항](./REQUIREMENTS.md)
- [기술 명세](./TECH_SPEC.md)
- [디자인 시스템](./DESIGN_SYSTEM.md)
- [배포 가이드](./DEPLOYMENT.md)
- [변경 이력](./CHANGE_LOG.md)
- [트러블슈팅](./TROUBLESHOOTING.md)

## 문서 최신성

- route, API, schema, 인증 경계가 바뀌면 요구사항과 기술 명세를 함께 갱신한다.
- 디자인 토큰과 공용 컴포넌트 계약이 바뀌면 디자인 시스템을 갱신한다.
- 배포 명령이나 Cloudflare binding이 바뀌면 배포 가이드와 트러블슈팅을 확인한다.
