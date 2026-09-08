# 디자인 시스템

## 구성

Stann Lumo의 음악·공연·이미지를 검정 바탕, 큰 제목, 가는 구획선으로 보여준다. 홈은 펼침 패널로 탐색하고, 각 본문은 콘텐츠에 맞는 목록·정보·미디어 배치를 사용한다.

- 공개 탐색은 상단 헤더에 놓고, 1200px 미만에서는 메뉴로 접는다. SignalNet의 실제 hub/live 연결은 푸터에 둔다.
- 홈은 CMS 순서의 앞 4개 항목을 패널로, 이후 항목을 보조 링크로 표시한다. 펼침 버튼과 페이지 방문 링크를 구분한다.
- 음악은 커버나 자체 재생기를 가정하지 않는 트랙 목록이다. 공연은 날짜 중심 목록과 정보·포스터 상세를 사용한다.
- 아카이브는 원본을 자르지 않는 포스터 그리드다. 상세의 이전·다음 버튼은 미디어 조작 영역과 분리한다.
- 소개는 실제 프로필 정보와 본문, 연락은 실제 이메일과 공연 문의 정보, 링크는 등록된 플랫폼을 표시한다.
- 관리자는 같은 글꼴·표면·구획선을 쓰며 기존 편집 흐름과 입력 밀도를 유지한다.

## 글꼴과 색상

| 역할 | 값과 소유권 |
|---|---|
| 제목·본문 | Inter; 한글은 Apple SD Gothic Neo, Malgun Gothic, sans-serif fallback |
| 날짜·보조 정보 | JetBrains Mono, 12~14px |
| 공통 글꼴·표면 | `src/styles/designV2.module.css`, public/admin root에 제한 |
| 본문 / 보조 본문 | `--color-primary` / `--color-secondary` |
| 선택·포커스 | `--color-accent`, 기존 레드 `#ff0033` |
| 구획선 / 배경 | `--color-muted` / `--color-bg` |

STANN OS 공통 토큰은 `src/styles/stann-os.css`의 사본으로 유지한다. `globals.css`는 이를 Lumo 변수에 연결하고, `check-token-sync.mjs`는 빌드 전에 사본의 동기화를 검사한다. 각 화면의 배치·반응형·모션 규칙은 해당 컴포넌트의 CSS Module이 소유한다.

## 상호작용

홈 패널은 Framer Motion의 layout 전환으로 최종 배치 사이를 550ms에 이동한다. 같은 요소에 CSS 크기 전환을 중첩하지 않는다. 모바일은 강제 스크롤 스냅 없이 콘텐츠 높이로 펼친다. 닫힌 내용은 탐색 대상에서도 제외하며, 움직임 감소 설정과 설정 확인 전에는 정적으로 시작한다.

본문은 문서 스크롤을 사용한다. 메뉴의 포커스 순환·Escape·닫기 후 복귀, 경로 이동 후 본문 포커스, skip link를 유지한다. 영상·입력·메뉴에서 사용하는 키는 아카이브 전역 단축키가 가로채지 않는다.

기존 3D·cipher 모듈과 관련 의존성은 보관되어 있지만 공개 shell과 본문에서는 마운트하지 않는다.

## 주요 소유자

| 구성 | 역할 |
|---|---|
| `PublicSiteShell` | 공개 탐색, 언어 전환, 메뉴·본문 포커스, SignalNet |
| `PageLayout` | 정적인 큰 페이지 제목과 본문 폭 |
| `HomePageClient` | 홈 패널·제한된 공개 미리보기·Terminal 설정 표시 |
| `src/components/public/*PageClient` | 화면별 콘텐츠와 인접 CSS Module |
| `AdminLayout`, `AdminCard`, `AdminSectionHeader` | 관리자 공통 구성 |

화면의 실제 표시·반응형·모션 검토와 코드 테스트·빌드 결과는 별도로 확인한다.
