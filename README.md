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
npm run dev
```

개발 서버는 항상 `http://localhost:3004`에서 실행한다.

Docker 환경에서는 다음 명령을 사용한다.

```bash
docker compose up --build
```

## 검증

```bash
npm run lint
npm run test:local-config
npm run type-check
npm run build
```

## 문서

- [프로젝트 문서](docs/README.md)
- [요구사항](docs/REQUIREMENTS.md)
- [기술 명세](docs/TECH_SPEC.md)
- [디자인 시스템](docs/DESIGN_SYSTEM.md)
- [배포 가이드](docs/DEPLOYMENT.md)
- [변경 이력](docs/CHANGE_LOG.md)
- [트러블슈팅](docs/TROUBLESHOOTING.md)
