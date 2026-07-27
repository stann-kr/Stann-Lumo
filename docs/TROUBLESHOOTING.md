# 트러블슈팅

## 2026-07-28 — 공개 문서에 task tracker와 긴 작업 이력이 섞임

### 증상

공개 문서에 잔여 작업 목록, 완료된 작업 목록, 긴 빌드/배포 이력이 함께 포함되어 문서 허브와 운영 이슈 기록의 역할이 흐려졌다.

### 원인

기존 private 작업 문서가 public docs로 이관되는 과정에서 task tracker 성격의 문서까지 함께 이동되었다.

### 해결

- public docs는 제품/기술/배포/트러블슈팅 중심으로 재작성했다.
- task tracker는 public docs에서 제외하고 private `.docs` 레이어에서 관리한다.
- 이전 상세 원본은 `.docs/원본/2026-07-28/docs/`에 보존했다.

### 검증

```bash
test ! -f docs/TASKS.md
grep -RIn '\[\[' docs/ || true
grep -RInE '<private-marker>|<local-user-path>' docs/ || true
```

## 이전 이슈

Cloudflare, OpenNext, D1/R2, React hook, TypeScript 관련 재발 가능한 이슈는 추후 실제 운영 기준으로 다시 정리한다.
