# stann-lumo

Stann Lumo의 음악, 공연, 비주얼 아카이브를 제공하는 아티스트 사이트이자 콘텐츠 관리 애플리케이션이다.

## 주요 기능

- 음악, 공연, 아카이브, 소개, 연락처와 외부 링크를 제공하는 공개 사이트
- 영어·한국어 콘텐츠 전환
- 콘텐츠와 미디어를 관리하는 관리자 대시보드
- Cloudflare D1·R2와 OpenNext 기반 배포
- STANN OS 허브·라이브 인터페이스 연결

## 시작하기

```bash
npm install
cp .env.example .env
cp .dev.vars.example .dev.vars
npm run dev
```

개발 서버는 항상 `http://localhost:3004`에서 실행한다. `npm run dev`는 OpenNext artifact를 만든 뒤 Wrangler local preview로 실행되어 local D1/R2 binding만 사용하며, 시작 전에 local D1 migration을 적용한다. 실행 wrapper는 `.dev.vars`에서 관리자 비밀번호만 일회성 환경 파일로 전달하고 Cloudflare credential을 포함한 나머지 키를 배제한다. 공개 URL은 `.env`, 로컬 서버 전용 값은 git-ignored `.dev.vars`에 둔다.

Docker 환경에서는 다음 명령을 사용한다.

```bash
docker compose up --build
```

## 검증

```bash
npm run lint
npm run test:local-config
npm run test:local-worker
npm run type-check
npm run build
```

`npm run dev`는 OpenNext artifact `.next`와 Wrangler local runtime을 사용하고, `npm run build`는 `.next-build`를 사용한다. `npm run start`는 `npm run build`가 만든 `.next-build`를 실행한다. Worker binding이 필요 없는 빠른 UI 확인에는 `npm run dev:next`를 쓸 수 있지만 D1/R2 API는 의도적으로 fail-closed 한다. Cloudflare Workers Builds에서는 OpenNext 호환을 위해 같은 build 명령이 `.next`를 사용한다.

원격 배포는 Cloudflare Workers Builds가 담당한다. feature branch는 development Worker preview, `dev`는 고정 development Worker, `main`은 production Worker로 분리되며 각 환경은 별도 D1·R2 binding을 사용한다. 로컬에서 production deploy를 직접 실행하는 경로는 제공하지 않는다.

## 문서

- [프로젝트 문서](docs/README.md)
- [요구사항](docs/REQUIREMENTS.md)
- [기술 명세](docs/TECH_SPEC.md)
- [디자인 시스템](docs/DESIGN_SYSTEM.md)
- [배포 가이드](docs/DEPLOYMENT.md)
- [변경 이력](docs/CHANGE_LOG.md)
- [트러블슈팅](docs/TROUBLESHOOTING.md)
