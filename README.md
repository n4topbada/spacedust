# SPACE DUST

**아들의 상상에서 시작해, 몇 시간 만에 만든 우주 클리커 게임.**

[지금 플레이하기](https://spacedust-nine.vercel.app/) · [English](docs/README.en.md)

## 프로젝트 이야기

초등학생 아들이 “우주먼지를 모으는 게임을 만들어 달라”고 해서 시작했습니다. 작은 먼지가 덩어리가 되고, 소행성과 행성으로 자라다가 블랙홀과 은하를 거쳐 우주 전체가 되는 게임입니다.

기획도 아들이 원하는 대로 만들었습니다. 자동으로 먼지를 모으는 SF 로봇, 지나가는 혜성 보상, 업그레이드, 특수 재화, 별자리 제작까지 아들의 아이디어와 손으로 적은 기획을 웹게임으로 옮겼습니다. 몇 시간 만에 플레이할 수 있는 게임을 만들고, 이후 요청받은 내용을 반영해 완성했습니다.

**프로젝트 상태:** 기능 개발 완료. 2026년 9월 17일 코드와 문서를 정리해 마감합니다.

![Space Dust 게임 화면](docs/screenshots/universe.png)

## 게임에 담긴 것

- 먼지부터 우주 전체까지 12단계 천체 성장과 Canvas 애니메이션
- 직접 클릭 수집, SF 수집 도구 14종, 1개·10개·최대 수량 구매
- 도구별 2배 업그레이드 28개, 상호작용 12개, 수동 클릭 연구 3단계
- 일반·황금 혜성 보너스와 화면·소리 연출
- 전용 Craft 화면, 서로 다른 별자리 15개와 제작 가능한 별 60개
- 고정 전환 상품 4종, 특수 재화 5종, 영구 강화와 럭키박스
- 브라우저 자동 저장, 최대 8시간 오프라인 수집, 소리·모션 설정
- 1800 × 750 기준 가로형 UI와 모바일 반응형 화면

천체 성장은 게임을 위한 상상 속 진행 방식입니다.

## 실행과 검증

Node.js 24.21.0 이상(24.x)을 사용합니다. 검증 버전은 `.nvmrc`에 명시돼 있습니다.

```sh
npm ci
npm run dev -- --hostname 127.0.0.1
```

로컬 주소: [http://localhost:3000](http://localhost:3000)

```sh
npm run check         # 린트, 타입 검사, 게임 테스트 23개, 포맷 검사
npm run build:vercel  # Vercel용 정적 빌드 → dist/client
npm run build         # 기존 Cloudflare / Sites 빌드
```

`npm run format`으로 소스와 문서의 형식을 맞춥니다. GitHub Actions도 PR마다 동일한 검사와 Vercel 빌드를 수행합니다.

## 구조

| 경로                                                           | 역할                                              |
| -------------------------------------------------------------- | ------------------------------------------------- |
| `app/page.tsx`                                                 | 게임 시계, 저장, 입력 처리, 화면 전환             |
| `components/game-dialogs.tsx`                                  | 도움말, 설정, 성장 여정, 완료 화면                |
| `components/starfield.tsx`, `celestial-scene.tsx`              | 배경 별과 천체 애니메이션                         |
| `components/tool-market.tsx`                                   | 도구 구매와 연구 탭                               |
| `components/crafting-screen.tsx`, `constellation-workshop.tsx` | Craft 화면과 별자리 제작                          |
| `components/progression-panels.tsx`                            | 연구, 재화 전환, 영구 강화                        |
| `lib/economy.ts`                                               | 수급, 구매, 제작, 보상, 저장 데이터 마이그레이션  |
| `lib/catalog.ts`, `constellations.ts`                          | 도구·천체 데이터와 별자리 도형                    |
| `tests/game.test.mjs`                                          | 경제 규칙과 기존 저장 호환 검증                   |
| `public/`                                                      | 개발 과정에서 생성한 일러스트 스프라이트와 파비콘 |

React 19, TypeScript, Vinext/Vite, Tailwind CSS, Base UI를 사용합니다. 공개 버전은 브라우저에서 실행되는 정적 게임으로, 게임용 계정이나 데이터베이스가 필요하지 않습니다.

## 배포와 저장

실사용 주소는 **[spacedust-nine.vercel.app](https://spacedust-nine.vercel.app/)** 입니다. Vercel 프로젝트 이름은 `spacedust`입니다. 프로젝트를 연결한 뒤 `vercel deploy --prod`로 배포하며, 빌드 설정은 `vercel.json`에 포함돼 있습니다.

진행 상황은 각 브라우저·주소의 `localStorage`에 저장됩니다. 같은 주소로 재배포하면 저장을 계속 사용하지만, 기기나 도메인 사이에서 자동 동기화되지는 않습니다. 저장 키는 `spacedust.save.v1`, 현재 저장 형식은 버전 4이며 이전 형식의 진행도는 마이그레이션합니다.

현재 밸런스와 설계 판단은 [워크숍 업데이트 문서](docs/workshop-update.md)에, 마감 범위와 인수인계는 [마감 기록](docs/project-closeout.md)에 정리했습니다.
