# 트러블슈팅 이력

---

## 템플릿

```
### [날짜] 이슈 제목

**발생 상황 및 에러 로그 요약**
- 증상:
- 에러 메시지:

**원인 분석**
-

**해결 방법**
- 적용된 Docker 명령어 및 코드 변경 내역:
```

---

## Next.js 빌드 관련 이슈

### [2026-03-17] `<Html> should not be imported outside of pages/_document` 빌드 오류

**발생 상황 및 에러 로그 요약**
- 증상: `npm run build` 실행 시 정적 페이지 생성 단계에서 빌드 실패
- 에러:
  ```
  Generating static pages (0/5) ...
  Error: <Html> should not be imported outside of pages/_document.
  Error occurred prerendering page "/404".
  Export encountered an error on /_error: /404, exiting the build.
  ```

**원인 분석**
- `docker-compose.yml`에 `NODE_ENV=development` 설정 → `npm run build` 실행 시 비표준 NODE_ENV 값 전달됨
- `next build`는 `NODE_ENV=production` 전제로 동작; `development` 환경에서는 Pages Router 렌더링 경로(`_error.js`)를 `/404` 정적 생성에 사용
- Pages Router `_error.js`가 `next/document`의 `Html` 컴포넌트를 호출하는데, App Router 컨텍스트에서 `HtmlContext`가 설정되지 않아 가드(guard) 발동
- 오류 발생 전체 체인: `development` 모드 → `/404` 정적 생성 → `_error.js` Pages Router 폴백 → `Html` 컴포넌트 → `HtmlContext` 없음 → 에러

**해결 방법**
- `package.json` build 스크립트에 `NODE_ENV=production` 명시적 지정:
  ```json
  "build": "NODE_ENV=production next build"
  ```
- 이로써 docker-compose 환경변수(`NODE_ENV=development`)가 빌드에 영향을 주지 않음
- 추가적으로 `src/app/not-found.tsx` → Server Component로 변환 + `export const dynamic = 'force-dynamic'` 추가 (보조적 조치)
- 빌드 검증 명령어: `docker compose exec web npm run build`

---

## Apple Silicon / Docker 관련 이슈

### [2026-03-17] 초기 Docker 환경 구축

**발생 상황**
Apple Silicon(ARM64) 환경에서 Docker 이미지 빌드 시 x86 바이너리 충돌 가능성.

**원인 분석**
macOS ARM64와 Linux x86_64 간 네이티브 바인딩 패키지 이진 호환성 문제.

**해결 방법**
- `Dockerfile`에 `FROM --platform=linux/arm64 node:22-alpine` 명시
- `docker-compose.yml`에 `platforms: linux/arm64` 명시
- `node_modules` 익명 볼륨으로 호스트-컨테이너 간 바이너리 충돌 방지

---

### [2026-03-17] wrangler d1 migrations apply --local 실패 (Alpine glibc 부재)

**발생 상황 및 에러 로그 요약**
- 증상: `wrangler d1 migrations apply stann-lumo-db --local` 실행 시 workerd 바이너리 실행 불가
- 에러: `Error: spawn .../workerd ENOENT` → `ldd` 확인 시 `ld-linux-aarch64.so.1: No such file or directory`

**원인 분석**
- Alpine Linux는 `musl` libc 사용; Cloudflare `workerd` 바이너리는 `glibc(ld-linux-aarch64.so.1)` 동적 링크 대상
- Alpine 컨테이너에서 glibc 기반 바이너리 실행 불가 — 설치되어 있어도 로더가 없어 `ENOENT` 반환

**해결 방법**
- 로컬 D1 에뮬레이션 대신 `--remote` 플래그로 실제 Cloudflare D1에 직접 마이그레이션 적용
- `docker compose run --rm web sh -c "npm install --silent 2>/dev/null; node_modules/.bin/wrangler d1 migrations apply stann-lumo-db --remote"`
- **주의:** Step 3 이후 `wrangler dev` (로컬 Workers 에뮬레이션)도 동일한 이유로 Alpine 환경에서 불가 — 최종 검증은 `--remote` 또는 실제 CF Pages/Workers 배포로 진행
