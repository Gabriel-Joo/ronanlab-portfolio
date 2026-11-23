# 포스터 빌드

```
python3 tools/posters/build.py            # 네 장 모두 → posters/
python3 tools/posters/build.py runshoes   # 한 장만
```

- `build.py` — 포스터별 그림과 공통 글자 줄(맨 위 한 줄, 제목, 기술 줄, 맨 아래 줄). 문구는 맨 위 `TAGLINES`, `TECHS`.
- `lib.py` — 글씨체 재기 · 줄이기 · 넣기, 픽셀 그림을 네모로 바꾸기.
- `base/` — 바탕 SVG(2026-11-20 굳힘). 배경, 제목 글씨체, PETMINT 그림 전체가 여기에 있다. 스크립트는 이 위에 FOREMAN 캐릭터, INFRA 화면, RUNSHOES 신발과 번호를 다시 그린다. **지우면 다시 만들 수 없다.**
- `assets/` — 받아 둔 신발 사진. 없으면 공개 API 에서 다시 받는다.
- `.cache/` — 내려받은 글씨체와 brotli. 지워도 된다(글씨체는 다시 받고, brotli 는 `pip install brotli`).

필요한 것: Python 3, `fonttools`, `pillow`, `numpy`, `brotli`, Playwright 의 headless Chromium(`~/.cache/ms-playwright`).
다른 저장소는 홈 아래(`~/AI_programming/foreman`, `~/ronanlab-infra`, `~/AI_programming/petmint-rag-chatbot`)에 있다고 본다. 다른 곳이면 환경 변수 `FOREMAN_REPO`, `INFRA_REPO`, `PETMINT_REPO` 로 알려 준다.
