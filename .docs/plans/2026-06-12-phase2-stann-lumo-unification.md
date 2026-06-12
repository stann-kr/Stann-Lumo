# Phase 2: stann-lumo (SL-01) 통일 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phase 1에서 확정된 토큰 정본(`stann-web/src/styles/stann-os.css`)을 stann-lumo에 복사·브릿지하고, 글루(셀렉션·focus)·SIGNAL_NET(SL-01)·라벨 문법·언어 규칙을 정렬. colors.ts↔globals.css 수동 동기화의 어긋남 버그(`#cbcbcb` vs `#999999`) 해소.

**Architecture:** lumo의 기존 `--color-*` 변수가 `--os-music-*`를 브릿지 참조(컴포넌트 무수정). 색 외 사이트 고유 레이어(muted/bgSidebar/3D/CustomScrollbar/동적 테마)는 유지. 설계 근거: `stann-web/.docs/2026-06-11-stann-os-ui-unification-design.md` §2-3, §5.

**Tech Stack:** Next.js 15 + Tailwind 3.4 + react-i18next. 모든 명령은 `docker compose run --rm web …`. 브랜치 `dev`. **lint는 `--max-warnings 0`(엄격) 주의.**

**전제 조건:**
- 브랜치 확인: `git -C /Users/stann/Dev/stann-lumo branch --show-current` → `dev`
- 포트 3000 충돌 주의: 검증은 `run --rm`(포트 미바인딩) 사용, 프리뷰는 `-p 3100:3000`
- 테스트 인프라 없음(vitest 부재) — 드리프트 가드는 정본(stann-web) 쪽 테스트가 담당, lumo 쪽 검증은 `diff` + lint/type-check/build
- **시각 변화 2건 의도됨(스팟 점검 대상):** ① html 17px→16px(전역 약 6% 축소) ② secondary `#cbcbcb`→`#b8b8b8`(정본 MUSIC sub 정렬, 약간 어두워짐)

---

### Task 1: stann-os.css 복사 + 브릿지 + colors.ts 정리

**Files:**
- Create: `src/styles/stann-os.css` (정본 복사)
- Modify: `src/app/globals.css` (import + :root 브릿지)
- Modify: `src/styles/colors.ts` (neonGreen 제거, secondary 정렬, 동기화 규칙 문구 교체)

- [ ] **Step 1: 정본 복사**

```bash
cp /Users/stann/Dev/stann-web/src/styles/stann-os.css /Users/stann/Dev/stann-lumo/src/styles/stann-os.css
diff /Users/stann/Dev/stann-web/src/styles/stann-os.css /Users/stann/Dev/stann-lumo/src/styles/stann-os.css && echo "SYNC OK"
```

- [ ] **Step 2: globals.css 1행에 import 추가** (기존 Google Fonts `@import url(...)` 2줄보다 앞)

```css
@import "../styles/stann-os.css";
```

- [ ] **Step 3: :root 색 변수 브릿지** — 기존 `:root`의 색 리터럴을 교체. `--color-muted`(#333333 구분선)·`--color-bg-sidebar`(#050505)는 **사이트 고유 레이어로 리터럴 유지**:

```css
:root {
  /*
   * ── 색상: 정본은 src/styles/stann-os.css (STANN OS 공통 토큰) ──
   *  primary/secondary/accent/bg = MUSIC 신호 팔레트 브릿지.
   *  muted/bg-sidebar = lumo 고유 레이어(리터럴 유지).
   *  colors.ts(THEME)는 JS 참조용 — 값 변경은 정본에서.
   */
  --color-primary: var(--os-music-primary); /* #ffffff */
  --color-secondary: var(--os-music-sub); /* #b8b8b8 — 구 #cbcbcb에서 정본 정렬 */
  --color-accent: var(--os-music-accent); /* #ff0033 */
  --color-muted: #333333; /* lumo 고유 — 구분선/보더 */
  --color-bg: var(--os-music-bg); /* #000000 */
  --color-bg-sidebar: #050505; /* lumo 고유 — 사이드바 */
}
```

(기존 :root 블록의 "색상 단일 소스" 주석 블록은 위 새 주석으로 교체 — "두 파일 1:1 수동 동기화" 규칙은 폐지됨)

- [ ] **Step 4: colors.ts 정리**

1. `PALETTE`에서 `neonGreen: "#999999",` 줄 삭제, 그 자리에 `subGray: "#b8b8b8",` 추가
2. `THEME.secondary: PALETTE.neonGreen` → `secondary: PALETTE.subGray`
3. 파일 상단 주석의 "색상 변경 방법" 부분을 다음으로 교체:

```ts
 * 색상 변경 방법:
 *   1. 정본 stann-os.css(STANN OS 공통 토큰)에서 변경 — stann-web가 원본
 *   2. THEME은 JS 참조용 미러 — 정본과 일치 유지 (드리프트 가드는 stann-web의 stann-os.test.ts)
```

- [ ] **Step 5: 검증 + 커밋**

```bash
docker compose run --rm web sh -c "npm run lint && npm run type-check && npm run build"
git add src/styles/stann-os.css src/app/globals.css src/styles/colors.ts
git commit -m "feat: stann-os 토큰 정본 도입 — secondary 정렬 및 수동 동기화 폐지"
```

---

### Task 2: html 17px → 16px 정렬

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1:** `html { font-size: 17px; }` 블록(주석 "기본 16px → 17px..." 포함)을 삭제 — 브라우저 기본 16px 사용. 삭제 자리에 한 줄 주석:

```css
/* 타입 베이스 = 16px (브라우저 기본, STANN OS 공통 — 구 17px 오버라이드 제거) */
```

- [ ] **Step 2: 검증 + 커밋** (시각 영향은 Task 7 프리뷰에서 일괄 점검)

```bash
docker compose run --rm web sh -c "npm run lint && npm run type-check && npm run build"
git add src/app/globals.css
git commit -m "feat: 타입 베이스 16px 정렬 (17px 오버라이드 제거)"
```

---

### Task 3: 셀렉션·focus-visible 글루

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/feature/TerminalLayout.tsx` (인라인 selection 클래스 제거)

- [ ] **Step 1: globals.css에 글루 추가** (네이티브 스크롤바 숨김 블록 근처, `@layer` 바깥):

```css
/* 셀렉션 — 액센트 배경 (STANN OS 불변 글루) */
::selection {
  background: var(--color-accent);
  color: var(--color-bg);
}

/* 포커스 가시화 — STANN OS 불변 글루 (web canon: 2px accent, offset 2px) */
:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}
```

(스크롤바는 lumo의 CustomScrollbar(React)가 이미 "커스텀" 규칙을 충족 — 네이티브 숨김 유지, 변경 없음)

- [ ] **Step 2: TerminalLayout 인라인 selection 클래스 제거** — 최외곽 div 클래스에서 `selection:bg-[var(--color-accent)] selection:text-white` 제거 (전역 규칙으로 대체, text-white→bg 색으로 통일됨)

- [ ] **Step 3: 검증 + 커밋**

```bash
docker compose run --rm web sh -c "npm run lint && npm run type-check && npm run build"
git add src/app/globals.css src/components/feature/TerminalLayout.tsx
git commit -m "feat: 셀렉션·focus-visible 글루 적용 (전역 규칙로 승격)"
```

---

### Task 4: SIGNAL_NET(SL-01) + HUB 네비 링크

**Files:**
- Create: `src/constants/signalNet.ts`
- Create: `src/components/base/SignalNet.tsx`
- Modify: `src/constants/site.ts` (HUB_URL 추가)
- Modify: `src/components/feature/TerminalLayout.tsx` (사이드바 푸터에 SignalNet, NAV에 HUB)
- Modify: `src/i18n/local/` 사전 (en/ko aria 키 — 구조 확인 후 양쪽 추가)

- [ ] **Step 1: site.ts에 HUB_URL 추가** (TERMINAL_URL 패턴과 동일)

```ts
export const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL || 'https://stann.kr';
```

(`.env.example`에 `NEXT_PUBLIC_HUB_URL=` 항목 추가 — 파일이 있으면)

- [ ] **Step 2: signalNet.ts** — stann-web `src/content/signalNet.ts`와 동일 문법, SELF만 교체:

```ts
import { HUB_URL, TERMINAL_URL } from './site';

/** STANN OS 표면 노드 — 3사이트 공통 문법 (설계 §4-2, §4-3) */
export interface SignalNode {
  id: 'ST-00' | 'SL-01' | 'TM-02';
  label: 'HUB' | 'ARCHIVE' | 'LIVE';
  href: string;
}

/** 이 사이트의 노드 ID */
export const SELF_NODE_ID = 'SL-01' as const;

export const SIGNAL_NET: readonly SignalNode[] = [
  { id: 'ST-00', label: 'HUB', href: HUB_URL },
  { id: 'SL-01', label: 'ARCHIVE', href: 'https://lumo.stann.kr' },
  { id: 'TM-02', label: 'LIVE', href: TERMINAL_URL },
] as const;
```

- [ ] **Step 3: SignalNet.tsx** (base/) — web 버전을 lumo 스타일 시스템(`--color-*` 변수·react-i18next)으로 이식:

```tsx
'use client';
import { useTranslation } from 'react-i18next';
import { SIGNAL_NET, SELF_NODE_ID } from '../../constants/signalNet';

/**
 * SIGNAL_NET — 3표면 상호 링크 (STANN OS 불변 글루, 설계 §4-2).
 * 현재 표면(SL-01)은 링크 대신 액센트 마커로 표시.
 */
const SignalNet = () => {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('footer_signal_net_aria')} className="flex flex-col gap-1">
      <span className="text-[9px] font-mono text-[var(--color-muted)] uppercase tracking-widest">
        SIGNAL_NET
      </span>
      <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
        {SIGNAL_NET.map((node) =>
          node.id === SELF_NODE_ID ? (
            <span
              key={node.id}
              aria-current="page"
              className="text-[10px] font-mono tracking-widest text-[var(--color-accent)]"
            >
              ● [{node.label}] {node.id}
            </span>
          ) : (
            // 같은 OS의 표면 이동이므로 의도적으로 같은 탭 (target 미지정)
            <a
              key={node.id}
              href={node.href}
              rel="noopener noreferrer"
              className="text-[10px] font-mono tracking-widest text-[var(--color-secondary)] transition-colors hover:text-[var(--color-accent)]"
            >
              [{node.label}] {node.id}
            </a>
          ),
        )}
      </span>
    </nav>
  );
};

export default SignalNet;
```

- [ ] **Step 4: i18n 키 추가** — `src/i18n/local/` 구조를 먼저 읽고(en/ko 파일 분리 형태 확인) 양쪽에 추가:
  - en: `footer_signal_net_aria: "Navigate between STANN OS surfaces"`
  - ko: `footer_signal_net_aria: "STANN OS 표면 간 이동"`

- [ ] **Step 5: TerminalLayout 통합**
  1. 사이드바 HUD Footer(`LOCAL TIME` 블록 위)에 `<SignalNet />` 삽입 (`space-y-4` 안 첫 자식)
  2. `NAV_ITEMS`의 `TERMINAL` 항목 다음에 `{ label: "HUB", path: HUB_URL, external: true }` 추가 (import에 HUB_URL)
  3. 모바일 메뉴가 NAV_ITEMS를 공유하면 자동 반영 — 확인만

- [ ] **Step 6: 검증 + 커밋**

```bash
docker compose run --rm web sh -c "npm run lint && npm run type-check && npm run build"
git add src/constants/signalNet.ts src/constants/site.ts src/components/base/SignalNet.tsx src/components/feature/TerminalLayout.tsx src/i18n/local/
git commit -m "feat: SIGNAL_NET(SL-01)·HUB 링크 도입 — 3표면 상호 연결"
```

(`.env.example` 수정 시 함께 add)

---

### Task 5: 라벨 문법 `[ ]` 정렬 + 자간 토큰

**Files:**
- Modify: `src/components/feature/PageLayout.tsx`
- Modify: `tailwind.config.ts` (letterSpacing 토큰)

- [ ] **Step 1: tailwind.config.ts에 자간 토큰 추가** (theme.extend 안):

```ts
letterSpacing: {
  label: 'var(--os-tracking)', // 0.14em — STANN OS 모노 라벨 자간
},
```

- [ ] **Step 2: PageLayout 메타 라벨 문법 정렬** — 기존:

```tsx
<div className="font-mono text-xs text-[var(--color-accent)] tracking-widest flex items-center gap-2">
  <span className="w-1.5 h-1.5 bg-[var(--color-accent)] animate-pulse"></span>
  ACCESS_GRANTED // PAGE_INIT
</div>
```

을 다음으로 (불변 문법 `[ META ]` + 자간 토큰, 펄스 닷은 lumo 플레이버로 유지):

```tsx
<div className="font-mono text-xs text-[var(--color-accent)] tracking-label flex items-center gap-2">
  <span className="w-1.5 h-1.5 bg-[var(--color-accent)] animate-pulse"></span>
  [ ACCESS_GRANTED // PAGE_INIT ]
</div>
```

- [ ] **Step 3: 디코드 속도 토큰 주석** — `PageLayout.tsx`의 `typingSpeed = 80` 기본값에 주석:

```ts
typingSpeed = 80, // --os-decode-speed(80ms/char) 정본과 일치 (stann-os.css)
```

- [ ] **Step 4: 검증 + 커밋**

```bash
docker compose run --rm web sh -c "npm run lint && npm run type-check && npm run build"
git add src/components/feature/PageLayout.tsx tailwind.config.ts
git commit -m "feat: 페이지 라벨 [ ] 문법·자간 토큰 정렬"
```

---

### Task 6: 첫 방문 언어 규칙 정렬

**Files:**
- Modify: `src/contexts/LanguageContext.tsx`

- [ ] **Step 1: getSnapshot에 브라우저 감지 추가** — 기존:

```ts
function getSnapshot(): Language {
  const saved = localStorage.getItem('app_language');
  return saved === 'ko' || saved === 'en' ? saved : 'en';
}
```

을 다음으로 (STANN OS 공통 규칙: 저장값 > 브라우저 감지. **폴백만 사이트 고유 'en'** — 국제 청중 대상이라 web의 ko 폴백과 의도적으로 다름):

```ts
/**
 * 첫 방문 언어 결정 (STANN OS 공통 규칙, 설계 §6-5).
 * 우선순위: 저장값 > 브라우저 언어(ko 계열만 ko) > en 폴백(lumo 고유 — 국제 청중).
 */
function getSnapshot(): Language {
  const saved = localStorage.getItem('app_language');
  if (saved === 'ko' || saved === 'en') return saved;
  const nav = (navigator.languages?.[0] || navigator.language || 'en').toLowerCase();
  return nav.startsWith('ko') ? 'ko' : 'en';
}
```

- [ ] **Step 2: 검증 + 커밋**

```bash
docker compose run --rm web sh -c "npm run lint && npm run type-check && npm run build"
git add src/contexts/LanguageContext.tsx
git commit -m "feat: 첫 방문 언어 브라우저 감지 (저장값>감지>en 폴백)"
```

---

### Task 7: Phase 2 종합 검증

**Files:** 없음 (검증 전용)

- [ ] **Step 1: 정적 게이트** — `docker compose run --rm web sh -c "npm run lint && npm run type-check && npm run build"` 전부 통과

- [ ] **Step 2: 토큰 동기화 diff** — `diff /Users/stann/Dev/stann-web/src/styles/stann-os.css /Users/stann/Dev/stann-lumo/src/styles/stann-os.css` → 차이 0

- [ ] **Step 3: 프리뷰 시각 점검** (`docker compose run --rm -p 3100:3000 web npm run dev`)

| 항목 | 위치 | 기대 |
|---|---|---|
| 16px 전환 영향 | home/about/music/events/archive | 본문 가독성 유지, 깨지는 레이아웃 없음 |
| secondary #b8b8b8 | 본문 텍스트 전반 | 과도하게 어둡지 않음 |
| 셀렉션 | 전 페이지 | 레드 배경 + 검정 텍스트 |
| focus-visible | Tab 순회 | 2px 레드 아웃라인 |
| SIGNAL_NET | 사이드바 푸터 | SL-01 마커 + HUB/LIVE 링크 |
| HUB 네비 | 사이드바·모바일 메뉴 | 외부 링크 동작 |
| 라벨 `[ ]` | 모든 PageLayout 페이지 | `[ ACCESS_GRANTED // PAGE_INIT ]` |
| 언어 감지 | localStorage 비우고 ko 브라우저 | KO 첫 렌더 |

- [ ] **Step 4: CHANGE_LOG 갱신 + 마무리 커밋**

`.docs/CHANGE_LOG.md` 최상단에 Phase 2 개조식 요약 추가 (Phase 1 WORK_LOG 형식 참조), 커밋:

```bash
git add .docs/CHANGE_LOG.md
git commit -m "docs: Phase 2 통일 작업 변경 이력 기록"
```
