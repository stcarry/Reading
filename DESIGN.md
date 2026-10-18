# 리딩 자이언트 Design System (Apple HIG 기반 · Dark)

> 구현: `src/index.css` (토큰·컴포넌트), `src/components/ui.jsx` (공용 컴포넌트)
> 아이콘: `lucide-react` 단일 라이브러리 · 이모지 사용 금지

## 1. Visual Theme & Atmosphere

Apple Human Interface Guidelines의 세 원칙을 그대로 따른다.

- **Clarity(명료)** — 모든 크기에서 글자가 읽히고, 아이콘은 정확하며, 장식은 기능을 돕는 범위에서만.
- **Deference(양보)** — UI는 콘텐츠(책, 기록, 대화)보다 앞에 나서지 않는다. 배경은 순흑, 표면은 밝기 단계로만 구분하고, 그라디언트·글로우·블러 장식은 쓰지 않는다.
- **Depth(계층)** — 시트·메뉴·사이드바는 반투명 머티리얼과 스프링 모션으로 "위에 떠 있음"을 표현한다.

독서 앱이므로 분위기는 **조용한 서재**다. 단 하나의 악센트(시스템 블루)만 상호작용 요소에 쓰고, 나머지는 흰색·회색 계조로 해결한다.

**Key Characteristics**
- 배경 `#000000` → 카드 `#1C1C1E` → 중첩 `#2C2C2E` 의 3단 표면 (iOS grouped background)
- 단일 악센트 `#0A84FF` (링크·주요 버튼·선택 상태·진행 바에만)
- 상태 색은 의미가 있을 때만: 완료 `#30D158`, 삭제·경고 `#FF453A`
- 라벨은 흰색의 불투명도로 4단계 (100% / 60% / 30% / 18%)
- SF Pro / Apple SD Gothic Neo 시스템 폰트, 폴백 Pretendard
- 아이콘은 Lucide 단색 스트로크(1.75–2px), 악센트 또는 라벨 색만 사용
- Large Title(34px)로 시작하는 HIG 타입 스케일
- 모서리는 10 / 14 / 18px 연속 곡률 느낌, 버튼은 10px, 칩은 캡슐
- 44px 터치 타깃, 0.5px 구분선

## 2. Color Palette & Roles

### Backgrounds (Grouped, Dark)
| 토큰 | 값 | 용도 |
|---|---|---|
| `--bg-base` | `#000000` | 페이지 배경 |
| `--bg-elevated` | `#1C1C1E` | 카드·리스트·시트 |
| `--bg-elevated-2` | `#2C2C2E` | 카드 안의 카드, 말풍선 |
| `--bg-sidebar` | `rgba(28,28,30,.78)` + blur | 사이드바 머티리얼 |
| `--bg-bar` | `rgba(22,22,24,.82)` + blur | 모바일 탭바 |

### Fills (입력·버튼 배경)
`--fill-1` `rgba(120,120,128,.36)` → `--fill-5` `rgba(120,120,128,.10)` 5단계. 입력 필드는 `--fill-4`, 보조 버튼은 `--fill-3`.

### Labels
| 토큰 | 값 | 용도 |
|---|---|---|
| `--label-1` | `#FFFFFF` | 본문·제목 |
| `--label-2` | `rgba(235,235,245,.6)` | 보조 설명 |
| `--label-3` | `rgba(235,235,245,.3)` | 메타·플레이스홀더 |
| `--label-4` | `rgba(235,235,245,.18)` | 비활성 |

### Accent & Semantic
| 토큰 | 값 | 용도 |
|---|---|---|
| `--accent` | `#0A84FF` | 주요 버튼, 링크, 선택, 진행 |
| `--accent-tint` | `rgba(10,132,255,.16)` | 틴트 버튼·선택 배경·콜아웃 |
| `--green` | `#30D158` | 완독, 완료 단계, 저장됨 |
| `--red` | `#FF453A` | 삭제, 오류 |
| `--gray` | `#8E8E93` | '읽고 싶은' 등 중립 상태 |

### Separators
`--separator` `rgba(84,84,88,.6)` 0.5px. 카드에는 테두리를 두지 않고 표면 밝기로만 구분한다.

## 3. Typography Rules

폰트 스택: `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Apple SD Gothic Neo", "Pretendard Variable", Pretendard, "Noto Sans KR", system-ui, sans-serif`

| 역할 | 크기 / 행간 | 굵기 | 자간 | 클래스 |
|---|---|---|---|---|
| Large Title | 34 / 41 | 700 | -0.022em | `.page-title` `.t-large-title` |
| Title 1 | 28 / 34 | 700 | -0.015em | `.t-title1` (문서 제목, 통계 숫자) |
| Title 2 | 22 / 28 | 700 | -0.012em | `.section-head h2` |
| Title 3 | 20 / 25 | 600 | -0.01em | `.t-title3` |
| Headline | 17 / 22 | 600 | 0 | 카드 제목, 모달 제목 |
| Body | 17 / 24 | 400 | 0 | 긴 읽기 콘텐츠 |
| Subhead | 15 / 20 | 400–600 | -0.005em | **기본 UI 텍스트** (body 기본값) |
| Footnote | 13 / 18 | 400–600 | 0 | 보조 설명, 라벨, 버튼 sm |
| Caption | 12 / 16 | 500–600 | 0 | 태그, 메타 |
| Caption 2 | 11 / 13 | 500–600 | 0.02em | 섹션 라벨, 탭바 |

원칙
- 제목은 굵고 타이트하게(음수 자간), 본문은 넉넉한 행간.
- 위계는 **크기와 불투명도**로 만든다. 색으로 강조하지 않는다.
- 숫자는 `font-variant-numeric: tabular-nums` (`.num`).
- 한 화면에 Large Title은 하나.

## 4. Component Stylings

### Buttons (`.btn`)
- 높이 36px(기본) / 28px(`.btn-sm`) / 44px(`.btn-lg`), 모서리 10px, 글자 15px/600
- `btn-primary` 악센트 채움 · `btn-tinted` 악센트 틴트 · `btn-secondary` 회색 fill · `btn-ghost` 투명(악센트 글자) · `btn-danger` 빨강
- 눌림: `scale(0.97)`, 비활성: 40% 불투명. 그림자·그라디언트 없음.

### Inputs (`.input` `.textarea` `.select` `.search-field`)
- fill 배경, 테두리 없음, 높이 40px, 모서리 10px
- 포커스: 배경 한 단계 밝아지고 `0 0 0 3px accent-tint-strong` 링
- 라벨은 위에 13px/600 `label-2` (`.field > label`)

### Segmented Control (`.seg`)
- 트랙 `fill-3` 9px, 선택 세그먼트 `#636366` 7px + 얕은 그림자. 필터·탭 전환에 사용.

### Chips / Tags
- `.chip` 캡슐 30px, 선택 시 악센트 채움 (키워드·유형 필터)
- `.tag` 22px 6px 모서리 라벨 (상태 표시, 시점)

### Cards & Lists
- `.card` `#1C1C1E` 14px 모서리, 패딩 20px, 테두리 없음
- `.list` + `.list-row` — iOS inset grouped list. 행 48px+, 아이콘 30px 틴트 박스, 0.5px 인셋 구분선, 우측 셰브론
- `.disclosure` — 접히는 섹션 (워크북, 가이드)

### Steps (`.steps .step`)
- 단계 타일. 활성: 악센트 틴트 + 1px 악센트 인셋, 완료: 번호 배지 초록

### Chat (`.chat`)
- AI 말풍선 `#2C2C2E` 좌측, 사용자 말풍선 악센트 우측(iMessage), 모서리 18px(꼬리쪽 6px)
- 입력은 캡슐 필드 + 원형 보내기 버튼
- 메시지 액션(다듬기·삭제)은 호버 시 말풍선 옆에 오버레이 — 레이아웃을 밀지 않는다

### Modal / Sheet (`.modal`)
- 데스크톱: 중앙 18px 모서리 시트, 배경 블러 6px
- 모바일: 하단에서 올라오는 시트(상단만 24px 모서리)
- `ConfirmDialog`: iOS Alert — 아이콘·제목·설명·2버튼 그리드

### Menu (`.menu`)
- 반투명 `rgba(44,44,46,.92)` + blur, 12px 모서리, 항목 호버 시 악센트 채움, 파괴적 항목 빨강

### Empty / Skeleton
- `.empty`: 56px 아이콘 박스 + 제목 + 설명 + 틴트 버튼
- `.skeleton`: shimmer. 데이터 로딩 중 빈 화면 금지

## 5. Layout Principles

- 4pt 그리드: `--s-1`(4) … `--s-16`(64)
- 데스크톱: 고정 사이드바 240px + 콘텐츠 최대 1080px(가이드는 820px), 좌우 32px, 상단 40px
- 모바일(≤768px): 사이드바 숨김 → 하단 탭바 56px(+safe area), 콘텐츠 좌우 16px
- 페이지 구조: `page-header`(Large Title + 부제 + 우측 액션) → 필터/툴바 → 콘텐츠
- 섹션 사이 32px, 카드 사이 16px, 카드 내부 20px
- 2단 그리드는 1100px 이하에서 1단으로

## 6. Depth & Elevation

| 레벨 | 처리 | 용도 |
|---|---|---|
| 0 | `#000` | 페이지 |
| 1 | `#1C1C1E` (그림자 없음) | 카드, 리스트 |
| 2 | `#2C2C2E` | 카드 안 요소, 말풍선 |
| 머티리얼 | 반투명 + `blur(24px) saturate(180%)` | 사이드바, 탭바, 메뉴 |
| 팝 | `0 10px 40px rgba(0,0,0,.55)` + 0.5px 하이라이트 | 메뉴 |
| 시트 | `0 24px 80px rgba(0,0,0,.65)` | 모달 |
| 표지 | `0 6px 16px rgba(0,0,0,.5)` | 책 표지 |

다크 모드에서는 그림자 대신 **표면 밝기**로 계층을 만든다. 책 표지와 떠 있는 요소(메뉴·시트)에만 그림자를 쓴다.

## 7. Do's and Don'ts

**Do**
- 악센트는 "누를 수 있는 것"과 "선택된 것"에만
- 상태는 작은 점(`.book-status .dot`)이나 태그로, 색은 의미가 있을 때만
- 빈 상태·로딩 상태를 반드시 설계 (EmptyState / Skeleton)
- 파괴적 행동은 ConfirmDialog, 메뉴에서는 빨강 항목으로 분리
- 모바일에서 호버 전용 액션은 항상 보이게

**Don't**
- 이모지를 아이콘·제목·탭에 쓰지 않는다
- 여러 악센트 색(보라·틸·로즈…)을 섞지 않는다
- 카드에 테두리 + 그림자 + 블러를 겹치지 않는다
- 배경 그라디언트·글로우 애니메이션을 두지 않는다
- 인라인 `style={{}}`로 색·크기를 지정하지 않는다 — 토큰과 클래스를 쓴다
- 버튼을 캡슐과 사각을 혼용하지 않는다 (버튼 10px, 칩만 캡슐)

## 8. Responsive Behavior

| 구간 | 변화 |
|---|---|
| > 1100px | 2단 그리드, 사이드바, 노트 목차 220px |
| 900–1100px | 대시보드 1단, 노트 목차 180px |
| 768–900px | 통계·가이드 1단, 노트 목차 숨김, 단계 타일 축약 |
| ≤ 768px | 사이드바 → 탭바(대시보드·서재·코칭·노트·더보기), Large Title 32px, 모달 → 하단 시트, 2열 통계 타일, 호버 액션 상시 표시 |

- 탭바에 들어가지 않는 메뉴(워크북·통계·가이드·계정)는 "더보기" 시트의 grouped list
- `env(safe-area-inset-bottom)` 적용, `viewport-fit=cover`
- `prefers-reduced-motion` 시 모든 애니메이션 제거

## 9. Agent Prompt Guide

**Quick Reference**
- 페이지 배경 `#000` · 카드 `#1C1C1E` · 입력 `rgba(120,120,128,.18)`
- 악센트 `#0A84FF` · 틴트 `rgba(10,132,255,.16)`
- 본문 `#fff` · 보조 `rgba(235,235,245,.6)` · 메타 `rgba(235,235,245,.3)`
- 구분선 `rgba(84,84,88,.6)` 0.5px · 모서리 10/14/18

**Example Prompts**
- "페이지 상단에 Large Title(34px/700/-0.022em)과 15px 보조 설명, 우측에 `btn btn-primary` 하나. 그 아래 `seg` 세그먼트 컨트롤로 필터."
- "`list` 안에 `list-row with-icon interactive` 행들. 30px 악센트 틴트 아이콘 박스, 제목 15px/500, 부제 13px label-2, 우측 셰브론."
- "`card`에 `card-head`(h3 17px/600 + meta 13px) 그리고 `bar-list`로 수평 막대 차트. 막대는 악센트 단색, 트랙은 fill-4."
- "삭제 확인은 `ConfirmDialog danger` — 빨간 틴트 원형 아이콘, 제목, 설명, 취소/삭제 2열 버튼."
- "모바일에서는 `modal`이 하단 시트로 바뀌고, 호버 전용 액션은 항상 보인다."

**Iteration Guide**
1. 먼저 표면 계층(0/1/2)을 정한다 — 색을 고르지 않는다.
2. 텍스트 위계를 크기·불투명도로 잡는다.
3. 상호작용 요소에만 악센트를 칠한다.
4. 빈 상태·로딩·오류 상태를 붙인다.
5. 390px 폭에서 다시 본다.

---

## Included Components (`src/components/ui.jsx`)

`Segmented` · `EmptyState` · `Modal` · `ConfirmDialog` · `Menu` / `MenuItem` · `PageSkeleton`

## Iconography

- 라이브러리: **Lucide React** 단일 사용. 크기 13(인라인) / 16(리스트·버튼) / 18–22(단독·빈 상태). 스트로크 1.75–2.2.
- 색은 `currentColor` — 악센트(상호작용·강조) 또는 label-2/3(장식)만.
- 이모지·컬러 아이콘·이미지 아이콘 금지.

## Document Policies

- 이 문서는 `src/index.css`의 토큰과 1:1로 대응한다. 토큰을 바꾸면 이 문서도 함께 갱신한다.
- 새 컴포넌트는 먼저 `index.css`에 클래스를 추가하고, 페이지에서는 클래스만 조합한다.
