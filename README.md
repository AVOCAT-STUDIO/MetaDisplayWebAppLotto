# 복복이 로또 웹앱 500x500 버전

## 기준 사이즈
500 x 500 px 고정 정사각형

## 주요 수정 위치
- 전체 크기: style.css의 `:root`
- 용 캐릭터: style.css의 `.dragon`
- 새 캐릭터: style.css의 `.bird`
- 추첨기: style.css의 `.machine-wrap`
- 추첨기 안 공 영역: style.css의 `.machine-balls`
- 공 개수: script.js의 `IDLE_BALL_COUNT`
- 발표 전 대기 시간: script.js의 `setTimeout(..., 2000)`
- 번호 발표 간격: script.js의 `index * 560`
