# 디자인 시스템

## 핵심 컨셉

`stann-lumo`는 Stann Lumo의 음악 archive를 terminal-inspired, 3D, motion-heavy interface로 표현한다. STANN OS의 공통 signal grammar를 공유하되, stann-web보다 음악 archive와 감각적 밀도에 집중한다.

## 디자인 원칙

1. artist archive는 정보 탐색과 시각적 분위기를 함께 제공한다.
2. 3D scene과 terminal HUD는 브랜드 경험의 핵심 요소다.
3. navigation은 archive, music, events, contact, link를 빠르게 탐색하게 한다.
4. STANN OS 공통 grammar는 signal ID, HUD label, frame, link 문법에서 유지한다.
5. motion은 콘텐츠 이해를 방해하지 않는 범위에서 사용한다.

## 주요 구성

| 구성 | 역할 |
|---|---|
| `TerminalLayout` | public shell, navigation, scene, signal link |
| `Scene3D` | 3D background |
| `SignalNet` | hub/live 연결 signal 표현 |
| `PageLayout` | public page frame |
| `ViewportFrame` | visual frame primitive |
| `CustomScrollbar` | site-level custom scroll |
| `CipherDecodeText` | text motion effect |

## Motion stack

- GSAP: timeline, reveal, cipher motion.
- Framer Motion: React component transition.
- SplitType: text split 기반 motion.
- R3F/Three: background scene.

## STANN OS 연결

| 표면 | 역할 |
|---|---|
| stann-web hub | music hub와 DEV/MUSIC 연결 |
| stann-lumo archive | artist archive와 release/event context |
| TERMINAL | live interface |

## 변경 시 확인

- `src/components/feature/TerminalLayout.tsx`
- `src/components/feature/Scene3D.tsx`
- `src/components/base/*`
- `src/constants/signalNet`
- `scripts/check-token-sync.mjs`
