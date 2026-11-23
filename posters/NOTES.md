# 포스터 기록

`tools/posters/build.py` 가 만든다(2026-11-20). 네 장 모두 800×1200 SVG 와 1600×2400 PNG.

## 쓴 자산

| 포스터 | 자산 | 출처 |
|---|---|---|
| RUNSHOES | 신발 사진: **호카 시엘로 X1 3.0** (Hoka Cielo X1 3.0, 런슈즈 NO.131, 레이스) | 공개 API `https://runshoes.ronanlab.dev/api/shoes` 의 `image` 주소(StockX 이미지 서버)에서 받음. 사본: `tools/posters/assets/shoe-131-cielo-x1-3.webp` |
| RUNSHOES | 번호 옆 값: 스택하이트 38mm, 미드솔 PEBA, 카본 플레이트 있음(드롭은 선을 바르게 그리기 어려워 2026-11-20 뺌) | 같은 API 의 그 신발 값(2026-11-20) |
| RUNSHOES | 아래 세 줄 풀이 | `runshoes/db.json` 의 terms(`short`) |
| RONANLAB INFRA | 떠 있는 패널 셋: 답변 걸린 시간(맨 앞, petmint 대시보드), CPU 사용량, 접속 요청량(runshoes 대시보드) | `ronanlab-infra/portfolio/img/08_grafana_petmint.png`, `08_grafana_dashboard.png` 에서 그래프 부분을 잘라 씀. 패널 제목은 사진의 제목 글을 그대로 크게 다시 앉혔고, 범례 줄은 잘라 냈다 |
| FOREMAN | 캐릭터 일곱: Master(교장), NinjaMageBlack과 NinjaMageOrange(코더), Princess(디자이너), SorcererOrange(서기), Monk(조사), Noble(관리자). 걷기 그림을 바탕으로, 팔을 든 모습과 다리를 벌린 모습은 그 그림의 네모를 같은 색으로 옮겨 새로 그렸다(`build.py` 의 `arms_up`, `legs_apart`) | `foreman/bridge/static/themes/_shared/ninja/chars/*/Walk.png` (Ninja Adventure, CC0) |
| FOREMAN | 소품과 효과: 두루마리, 물약, 물음표 말풍선, 반짝이 | `foreman/bridge/static/themes/magic/sprites/ninja/items`, `fx` |
| FOREMAN | 부엉이 횃대 | `foreman/bridge/static/themes/magic/sprites/foreman/owl_perch.png` |
| FOREMAN | 역할 이름과 색 | `foreman/bridge/static/js/roles.js` (ROLE_LABEL, ROLE_COLOR) |
| PETMINT | 캐릭터 셋, 질문 말풍선, 지급 한도, 근거 조항 | `petmint-rag-chatbot/web/src/assets/characters`, `portfolio/img/04_consult_overview.png` 의 화면 값 |

## 알아 둘 것

- 포스터 글자에는 줄표와 가운뎃점을 쓰지 않는다(빌드가 검사한다). 예외 둘: PETMINT 의 「지급 한도 · 초코」(굳힌 그림), INFRA 대시보드 사진 속 범례.
- 신발 사진의 흰 배경은 투명하게 바꿨다. 카본 플레이트 점선은 판이 지나는 자리를 옆면 무늬를 따라 어림해 그린 것이다(판은 미드솔 안에 있어 사진에 보이지 않는다).
- 신발 사진은 상품 사진이다. 사이트 밖에 쓸 때는 사용 권한을 따로 확인해야 한다.
- 대시보드 사진은 넣기 전에 확인했다: 비밀값, 서버 주소, 포트, 메일 없음. 보이는 것은 패널 제목, 숫자, 날짜, 파드 이름(runshoes-…)뿐이다.
- FOREMAN 의 네모는 모두 배경과 같은 5px 모눈 위에 있다(캐릭터 10배와 15배, 교장 20배, 소품 5배).

## 글씨체

- 맨 위 한 줄과 그림 안 글자: 사이트 글씨체(FOREMAN, RUNSHOES 는 Noto Sans KR, RUNSHOES 번호는 Archivo Black, 값은 IBM Plex Mono, PETMINT 는 Wanted Sans, INFRA 는 Noto Sans KR)
- 큰 제목, 기술 줄, 맨 아래 줄: 네 장이 함께 쓰는 제목 글씨체(처음 포스터에서 그대로)
