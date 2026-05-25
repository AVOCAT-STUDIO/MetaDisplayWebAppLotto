# 복복이 로또 스마트글라스 웹앱 - 주석 버전

## 실행 방법
압축을 풀고 `index.html` 파일을 브라우저에서 열면 됩니다.

## 수정할 파일
- `style.css`: 화면 크기, 캐릭터 위치, 추첨기 위치, 버튼 디자인, 결과창 디자인 수정
- `script.js`: 번호 생성, 공 개수, 공 움직임, 발표 시간, 발표 간격 수정
- `index.html`: 화면 구조나 문구를 크게 바꿀 때 수정

## 자주 수정할 위치
### 캐릭터 위치
`style.css`에서 `.dragon`, `.bird` 부분을 수정하세요.

### 추첨기 위치/크기
`style.css`에서 `.machine-wrap` 부분을 수정하세요.

### 추첨기 안 공 위치
`style.css`의 `.machine-balls`와 `script.js`의 `fixedBallPositions`를 수정하세요.

### 2초 뒤 발표 시간
`script.js`의 `setTimeout(() => { announceNumbers(result); }, 2000);`에서 2000을 바꾸세요.

### 번호 하나씩 발표되는 간격
`script.js`의 `index * 620`에서 620을 바꾸세요.
