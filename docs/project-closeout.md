# 프로젝트 마감 / Project closeout

마감일 / Closeout date: 2026-09-17

실사용 / Live game: https://spacedust-nine.vercel.app/

## 한국어

초등학생 아들이 만들어 달라고 요청한 게임을 몇 시간 만에 플레이 가능한 웹게임으로 만들었습니다. 도구, 혜성, 성장 단계, 특수 재화와 별자리 등 기획도 아들의 요청을 따랐습니다. 이번 마감은 완성된 기능을 유지하면서 코드를 정리하고, 공개 저장소와 검증 절차를 남기는 작업입니다.

- 설정·도움말·성장 여정·완료 화면을 `GameDialogs`로, 별 배경을 `Starfield`로 분리했습니다.
- 사용하지 않는 이전 상점, UI 템플릿 54개, 모바일 훅과 직접 의존성 8개를 제거했습니다.
- 실제 사용하는 컴포넌트 전체를 린트에 포함하고, 스크롤 영역과 스위치의 접근성 표시를 정리했습니다.
- Node.js 24, 정적 Vercel 빌드, 린트·타입·테스트·포맷 검사와 GitHub Actions를 명시했습니다.
- 게임 수치, 구매·제작 규칙, 저장 키와 버전 4 마이그레이션은 유지했습니다.

새 기능 개발은 이 상태로 마감합니다. 저장소는 수정과 PR 검토가 가능하도록 유지하며, 이 문서는 GitHub 저장소를 읽기 전용으로 보관 처리한다는 뜻이 아닙니다.

## English

This game began with a request from my elementary-school-aged son and became playable within a few hours. His requests also guided the tools, comets, growth stages, currencies, and constellations. This closeout keeps the completed game intact while organizing its code, public repository, and verification process.

- Extracted settings, help, journey, and completion views into `GameDialogs`, and the animated background into `Starfield`.
- Removed the obsolete shop, 54 unused UI templates, the unused mobile hook, and eight direct dependencies.
- Included every active component in lint checks and improved scroll-region semantics and switch labeling.
- Documented Node.js 24, the static Vercel build, lint/type/test/format checks, and GitHub Actions.
- Preserved balance, transaction and crafting rules, the save key, and version-4 migrations.

Feature development closes at this point. The repository stays writable for review and maintenance; this document does not mean that the GitHub repository has been archived.

## Handover

- Production: `https://spacedust-nine.vercel.app/`
- Verified runtime: Node.js 24.21.0. On this Windows machine, Node.js 24.14.0 produced the static files but aborted during Vinext shutdown with a libuv assertion. The same build completed successfully on 24.21.0; use the version in `.nvmrc` rather than masking build exit codes.
- Runtime: browser-only game; no game backend, accounts, or cloud save.
- Vercel output: `dist/client`, built with `npm run build:vercel`.
- Local checks: `npm run check`; build verification: `npm run build:vercel`.
- Persistence: `spacedust.save.v1`, schema 4; origin-specific browser storage.
- Current gameplay specification: [workshop-update.md](workshop-update.md).
- Earlier balance notes: [constellation-balance.md](constellation-balance.md); the workshop revision takes precedence where values differ.
- Private local data and generated output (`.env*`, `.vercel`, `outputs`, `dist`, browser profiles) stay out of Git.
- The production site is deployed independently of this pull request. Merging the PR does not automatically deploy until Git integration or a deployment workflow is configured.
