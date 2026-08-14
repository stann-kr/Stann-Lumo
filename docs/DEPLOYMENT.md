# 배포 가이드

## 개요

`stann-lumo`는 OpenNext for Cloudflare와 Wrangler를 사용해 Cloudflare에 배포한다. D1 database와 R2 bucket binding을 사용한다.

## 배포 대상

| Git branch | Worker | URL/traffic | D1 | R2 |
|---|---|---|---|---|
| feature/fix branch | `stann-lumo-dev` preview version | preview URL, 고정 traffic 없음 | `stann-lumo-db-dev` | `stann-lumo-media-dev` |
| `dev` | `stann-lumo-dev` | 고정 development Worker | `stann-lumo-db-dev` | `stann-lumo-media-dev` |
| `main` | `stann-lumo` | `lumo.stann.kr` production traffic | `stann-lumo-db` | `stann-lumo-media` |

두 Worker 모두 `.open-next/worker.js`와 `.open-next/assets`를 사용한다. D1 binding은 `DB`, R2 binding은 `MEDIA`로 동일하지만 resource ID와 bucket은 환경별로 분리한다.

## 사전 체크리스트

- Cloudflare/Wrangler 인증이 유효해야 한다.
- production과 development의 D1 database와 R2 bucket이 각각 존재해야 한다.
- 필요한 secret과 환경 변수 실값은 배포 환경에만 저장한다.
- token sync 검사가 통과해야 한다.
- OpenNext가 읽는 `.env*`에는 허용된 공개 URL 설정만 둔다. local wrapper는 git-ignored `.dev.vars`에서 관리자 비밀번호만 일회성 Worker 환경으로 전달하고 Cloudflare credential을 배제한다. production 값은 Cloudflare secret 또는 binding으로 제공한다.
- 표준 `npm run build`는 `.next-build`를 사용하지만, Cloudflare Workers Builds에서는 OpenNext 호환을 위해 `.next`를 생성한다.

## 로컬 검증

```bash
npm run lint
npm test
npm run test:env
npm run test:local-config
npm run type-check
npm run build:cloudflare
```

## Workers Builds 계약

- feature/fix branch는 `npm run build:cloudflare` 뒤 `npm run deploy:preview:artifact`를 실행한다.
- `dev`는 `npm run build:cloudflare` 뒤 `npm run deploy:dev:artifact`를 실행한다.
- `main`은 `npm run build:cloudflare` 뒤 `npm run deploy:production:artifact`를 실행한다.
- deploy guard는 `WORKERS_CI_BRANCH`와 `WORKERS_CI_COMMIT_SHA`를 확인해 다른 branch의 배포를 거부한다.
- production Worker에는 `main` trigger만 연결하고, feature와 `dev` trigger는 development Worker에 연결한다.

초기 development Worker 생성이나 복구가 필요할 때만 승인 후 `npm run deploy:dev`를 사용한다. 이 명령은 development 환경만 허용한다. 로컬 production deploy 명령은 제공하지 않으며 production은 승인된 `main` merge의 Workers Builds trigger로만 배포한다.

development D1 migration은 code deploy와 분리한다. 승인된 schema 변경에 한해 다음 명령을 별도로 실행한다.

```bash
npm run d1:dev:apply
```

## 배포 후 확인

- `https://lumo.stann.kr` 접속 확인.
- public route와 admin route 기본 응답 확인.
- D1/R2 의존 기능 smoke test.
- 보안 header와 static asset 응답 확인.

## 주의사항

- Cloudflare token, account id, secret 값은 공개 문서와 git history에 기록하지 않는다.
- D1/R2 binding 이름은 공개 가능하지만 실 인증값은 공개하지 않는다.
- `dev` PR merge는 development 자동 배포까지 포함한다.
- `main` PR 생성은 production merge·deploy 승인이 아니다. `main` merge 전에는 production 승인을 다시 확인한다.
- migration, secret, D1/R2 data와 route 변경은 code deploy와 별도 경계로 취급한다.
