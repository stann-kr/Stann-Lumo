# 배포 가이드

## 개요

`stann-lumo`는 OpenNext for Cloudflare와 Wrangler를 사용해 Cloudflare에 배포한다. D1 database와 R2 bucket binding을 사용한다.

## 배포 대상

| 항목 | 값 |
|---|---|
| Worker name | `stann-lumo` |
| Custom domain | `lumo.stann.kr` |
| Worker entry | `.open-next/worker.js` |
| Static assets | `.open-next/assets` |
| D1 binding | `DB` |
| R2 binding | `MEDIA` |

## 사전 체크리스트

- Cloudflare/Wrangler 인증이 유효해야 한다.
- D1 database `stann-lumo-db`가 존재해야 한다.
- R2 bucket `stann-lumo-media`가 존재해야 한다.
- 필요한 secret과 환경 변수 실값은 배포 환경에만 저장한다.
- token sync 검사가 통과해야 한다.
- OpenNext가 읽는 `.env*`에는 허용된 공개 URL 설정만 둔다. 로컬 Node/Docker 개발의 서버 전용 값은 git-ignored `.dev.vars`, production 값은 Cloudflare secret 또는 binding으로 제공한다.
- 표준 `npm run build`는 `.next-build`를 사용하지만, OpenNext 호환을 위해 `npm run build:cloudflare`는 `.next`를 생성한다.

## 로컬 검증

```bash
npm run lint
npm test
npm run test:env
npm run test:local-config
npm run type-check
npm run build:cloudflare
```

## 배포

```bash
npm run deploy
```

`deploy` script는 token과 환경 변수 소스·산출물 검사를 포함한 `build:cloudflare`가 성공한 뒤에만 Wrangler deploy를 실행한다.

## 배포 후 확인

- `https://lumo.stann.kr` 접속 확인.
- public route와 admin route 기본 응답 확인.
- D1/R2 의존 기능 smoke test.
- 보안 header와 static asset 응답 확인.

## 주의사항

- Cloudflare token, account id, secret 값은 공개 문서와 git history에 기록하지 않는다.
- D1/R2 binding 이름은 공개 가능하지만 실 인증값은 공개하지 않는다.
- remote push와 production deploy는 별도 승인 후 진행한다.
