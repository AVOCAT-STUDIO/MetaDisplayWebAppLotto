/* =========================================================
   복복이 로또 웹앱 script.js
   ---------------------------------------------------------
   이 파일은 로또 번호 생성, 추첨 버튼 동작,
   공 움직임, 번호 발표 시간 등을 관리하는 파일이야.

   수정할 때 가장 많이 만질 부분:
   1) LOTTO_MAX                  → 로또 번호 최대값
   2) PICK_COUNT                 → 메인 번호 개수
   3) IDLE_BALL_COUNT            → 추첨기 안 가짜 공 개수
   4) fixedBallPositions         → 시작 전 공들의 고정 위치
   5) setTimeout(..., 2000)      → 추첨 시작 후 발표까지 기다리는 시간
   6) index * 620                → 번호가 하나씩 발표되는 간격
   7) randomBetween 값들         → 공이 움직이는 범위와 속도
   ========================================================= */


/* 로또 번호 최대값.
   한국 로또 기준 1~45라서 45로 설정.
   예: 1~50 번호를 쓰고 싶으면 50으로 수정 */
const LOTTO_MAX = 45;


/* 메인 번호 개수.
   한국 로또는 6개라서 6으로 설정 */
const PICK_COUNT = 6;


/* 추첨기 안에 보이는 가짜 공 개수.
   많을수록 풍성하지만, 너무 많으면 화면이 복잡하고 성능이 떨어질 수 있음.
   추천 범위: 12~24 */
const IDLE_BALL_COUNT = 18;


/* HTML에서 필요한 요소들을 가져오는 부분.
   id 이름은 index.html 안의 요소 id와 일치해야 함. */
const drawBtn = document.getElementById("drawBtn");           // 추첨하기 버튼
const resetBtn = document.getElementById("resetBtn");         // 초기화 버튼
const numberList = document.getElementById("numberList");     // 결과 번호가 들어가는 영역
const dateText = document.getElementById("dateText");         // 날짜/상태 문구 영역
const machine = document.getElementById("machine");           // 추첨기 이미지
const machineBalls = document.getElementById("machineBalls"); // 추첨기 안 공 영역


/* 현재 추첨기 안에 들어 있는 가짜 공 DOM 요소들을 저장하는 배열 */
let idleBalls = [];


/* 추첨 중인지 확인하는 값.
   true면 추첨 버튼을 다시 눌러도 중복 실행되지 않음. */
let isDrawing = false;

/* =========================================================
   [사운드 파일]
   ---------------------------------------------------------
   assets/audio 폴더 안의 음향 파일을 불러옴.
   volume 값으로 소리 크기를 조절 가능.
   0.0 = 무음
   1.0 = 최대
   ========================================================= */

const soundDrawStart = new Audio("./assets/audio/draw_start.wav");
const soundRolling = new Audio("./assets/audio/ball_rolling.wav");
const soundAnnounce = new Audio("./assets/audio/number_announce.wav");
const soundFanfare = new Audio("./assets/audio/fanfare.wav");

soundDrawStart.volume = 0.5;
soundRolling.volume = 0.4;
soundAnnounce.volume = 0.55;
soundFanfare.volume = 0.6;




/* =========================================================
   [추첨 전 공들의 고정 위치]
   ---------------------------------------------------------
   시작 전에 공들이 멈춰 있는 위치야.
   각 값은 [left%, top%] 형식.

   예:
   [18, 58] → 공을 machine-balls 영역 안에서
              왼쪽 18%, 위쪽 58% 위치에 둠.

   공 위치를 직접 예쁘게 조정하고 싶으면 여기 숫자를 수정하면 돼.
   IDLE_BALL_COUNT 값을 18보다 크게 만들면 위치도 추가하는 게 좋아.
   ========================================================= */
const fixedBallPositions = [
  [18, 58], [30, 42], [43, 60], [55, 40], [66, 58], [76, 44],
  [22, 28], [36, 24], [50, 29], [63, 22], [70, 32], [12, 42],
  [28, 68], [42, 76], [58, 70], [72, 66], [48, 46], [60, 52],
];


/* =========================================================
   [로또 번호 생성 함수]
   ---------------------------------------------------------
   1부터 LOTTO_MAX까지 숫자를 만든 뒤 섞고,
   앞에서 6개는 메인 번호,
   그 다음 1개는 보너스 번호로 사용함.

   Math.random()은 일반 웹앱용 랜덤이야.
   실제 복권/보안용 난수는 아님.
   ========================================================= */
function generateLottoNumbers() {
  const pool = Array.from({ length: LOTTO_MAX }, (_, i) => i + 1);

  /* Fisher-Yates Shuffle 방식으로 숫자 섞기 */
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return {
    /* 메인 번호는 보기 좋게 오름차순 정렬 */
    main: pool.slice(0, PICK_COUNT).sort((a, b) => a - b),

    /* 보너스 번호 */
    bonus: pool[PICK_COUNT],
  };
}


/* =========================================================
   [번호별 공 색상]
   ---------------------------------------------------------
   번호 범위에 따라 공 색을 다르게 지정함.

   수정 예:
   - 1~10 노란색이 싫으면 첫 번째 return 색을 바꾸면 됨.
   - 색은 CSS linear-gradient 형식.
   ========================================================= */
function ballGradient(num) {
  if (num <= 10) return "linear-gradient(135deg, #ffe76a, #f2a51f)";
  if (num <= 20) return "linear-gradient(135deg, #85d7ff, #3e91e8)";
  if (num <= 30) return "linear-gradient(135deg, #ff929c, #e95468)";
  if (num <= 40) return "linear-gradient(135deg, #b9e968, #61b846)";
  return "linear-gradient(135deg, #d3a4ff, #8e5bd8)";
}


/* =========================================================
   [공 HTML 요소 만들기]
   ---------------------------------------------------------
   num: 공 안에 표시할 번호
   className: 어떤 종류의 공인지 CSS 클래스 지정
              - "ball" → 아래 결과창 큰 공
              - "mini-ball idle" → 추첨기 안 멈춘 작은 공
              - "mini-ball active" → 추첨기 안 움직이는 작은 공
   delay: 등장 애니메이션 지연 시간(ms)
   ========================================================= */
function createBall(num, className = "ball", delay = 0) {
  const ball = document.createElement("div");

  ball.className = className;
  ball.textContent = num;
  ball.style.background = ballGradient(num);
  ball.style.animationDelay = `${delay}ms`;

  return ball;
}


/* min~max 사이의 랜덤 정수를 만드는 보조 함수 */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


/* =========================================================
   [추첨기 안 가짜 공 배치]
   ---------------------------------------------------------
   초기화되거나 처음 실행될 때 호출됨.
   공들은 처음에는 움직이지 않고 고정되어 있음.

   수정 포인트:
   - IDLE_BALL_COUNT → 공 개수
   - fixedBallPositions → 공의 고정 위치
   - --x1 ~ --y5 → 움직일 때 이동 거리
   - --duration → 공 움직임 속도
   - --delay → 공마다 애니메이션 시작 차이
   ========================================================= */
function setupFakeBalls() {
  machineBalls.innerHTML = "";
  idleBalls = [];

  for (let i = 0; i < IDLE_BALL_COUNT; i++) {
    /* 가짜 공에는 1~45 중 임의 번호를 표시 */
    const num = randomBetween(1, LOTTO_MAX);
    const ball = createBall(num, "mini-ball idle");

    /* fixedBallPositions에 저장된 고정 위치 사용 */
    const [left, top] = fixedBallPositions[i];

    ball.style.left = `${left}%`;
    ball.style.top = `${top}%`;

    /* -----------------------------------------------------
       공이 움직일 때 이동할 거리 설정
       px 값이 커질수록 더 멀리 움직임.

       예:
       randomBetween(-95, 95)
       → 왼쪽으로 최대 95px, 오른쪽으로 최대 95px 이동 가능

       공이 너무 추첨기 밖으로 나가면 값을 줄여줘.
       공이 너무 조금 움직이면 값을 키워줘.
       ----------------------------------------------------- */
    ball.style.setProperty("--x1", `${randomBetween(-95, 95)}px`);
    ball.style.setProperty("--y1", `${randomBetween(-58, 58)}px`);
    ball.style.setProperty("--x2", `${randomBetween(-115, 115)}px`);
    ball.style.setProperty("--y2", `${randomBetween(-72, 72)}px`);
    ball.style.setProperty("--x3", `${randomBetween(-105, 105)}px`);
    ball.style.setProperty("--y3", `${randomBetween(-66, 66)}px`);
    ball.style.setProperty("--x4", `${randomBetween(-90, 90)}px`);
    ball.style.setProperty("--y4", `${randomBetween(-58, 58)}px`);
    ball.style.setProperty("--x5", `${randomBetween(-120, 120)}px`);
    ball.style.setProperty("--y5", `${randomBetween(-74, 74)}px`);

    /* -----------------------------------------------------
       공 움직임 속도
       현재: 0.55초 ~ 0.90초 사이에서 랜덤.
       숫자가 작을수록 빠르게 움직임.

       더 빠르게: randomBetween(35, 65) / 100
       더 느리게: randomBetween(90, 150) / 100
       ----------------------------------------------------- */
    ball.style.setProperty("--duration", `${(randomBetween(55, 90) / 100).toFixed(2)}s`);

    /* 공마다 출발 타이밍을 조금 다르게 해서 자연스럽게 보이게 함 */
    ball.style.setProperty("--delay", `${(randomBetween(0, 22) / 100).toFixed(2)}s`);

    machineBalls.appendChild(ball);
    idleBalls.push(ball);
  }
}


/* =========================================================
   [가짜 공 움직이기 시작]
   ---------------------------------------------------------
   추첨 버튼을 누르면 idle 클래스를 제거하고 active 클래스를 붙임.
   CSS에서 .mini-ball.active 애니메이션이 실행됨.
   ========================================================= */
function startFakeBallMotion() {
  idleBalls.forEach((ball) => {
    ball.classList.remove("idle");
    ball.classList.add("active");
  });
}


/* =========================================================
   [가짜 공 움직임 멈추기]
   ---------------------------------------------------------
   번호 발표가 끝나면 다시 멈춘 상태로 바꿈.
   ========================================================= */
function stopFakeBallMotion() {
  idleBalls.forEach((ball) => {
    ball.classList.remove("active");
    ball.classList.add("idle");
  });
}


/* =========================================================
   [결과창에 번호 하나 추가]
   ---------------------------------------------------------
   num: 발표할 번호
   index: 몇 번째 번호인지
   isBonus: 보너스 번호인지 여부

   index가 0이면 기존 안내문을 지우고 시작.
   보너스 번호라면 앞에 + 표시를 추가.
   ========================================================= */
function appendResultBall(num, index, isBonus = false) {
  if (index === 0) numberList.innerHTML = "";

  if (isBonus) {
    const plus = document.createElement("div");
    plus.className = "plus";
    plus.textContent = "+";
    numberList.appendChild(plus);
  }

  const ball = createBall(num, "ball", 0);
  numberList.appendChild(ball);
}


/* =========================================================
   [번호를 하나씩 발표]
   ---------------------------------------------------------
   추첨 시작 후 2초가 지난 뒤 이 함수가 실행됨.
   메인 번호 6개 + 보너스 번호 1개를 순서대로 발표.

   수정 포인트:
   - index * 620
     → 번호 하나가 발표되고 다음 번호가 나오기까지의 간격.
       현재 620ms.
       더 빠르게: 400
       더 느리게: 900 또는 1000
   ========================================================= */
function announceNumbers(result) {
  const sequence = [
    ...result.main.map((num) => ({ num, bonus: false })),
    { num: result.bonus, bonus: true },
  ];

  sequence.forEach((item, index) => {
    setTimeout(() => {
      /* 발표되는 번호와 비슷하게 추첨기 안 공 하나도 반짝이게 함 */
      const fake = idleBalls[index % idleBalls.length];

      if (fake) {
        fake.textContent = item.num;
        fake.style.background = ballGradient(item.num);
        fake.classList.add("selected");

        /* 0.55초 뒤 반짝임 클래스 제거.
           CSS의 selectedPulse 시간과 맞추는 게 좋음. */
        setTimeout(() => fake.classList.remove("selected"), 550);
      }

      /* 아래 결과창에 큰 공 추가 */
      /* 번호 발표 효과음 */
      soundAnnounce.currentTime = 0;
      soundAnnounce.play();

      appendResultBall(item.num, index, item.bonus);

      /* 마지막 번호까지 발표가 끝났을 때 */
      if (index === sequence.length - 1) {
        const today = new Date().toLocaleDateString("ko-KR");

        dateText.textContent = `${today} 추첨 완료`;

        /* 추첨기 흔들림 중지 */
        machine.classList.remove("shaking");

        /* 공 움직임 중지 */
        stopFakeBallMotion();

        /* 버튼 다시 활성화 */
        /* 공 굴러가는 소리 종료 */
        soundRolling.pause();
        soundRolling.currentTime = 0;

        /* 최종 완료 팡파레 */
        soundFanfare.currentTime = 0;
        soundFanfare.play();

        drawBtn.disabled = false;
        isDrawing = false;
      }
    }, index * 620); /* 번호 발표 간격 */
  });
}


/* =========================================================
   [초기화 함수]
   ---------------------------------------------------------
   초기 화면으로 되돌림.
   - 추첨 중 상태 해제
   - 버튼 활성화
   - 추첨기 흔들림 제거
   - 공 다시 고정 위치에 배치
   - 안내 문구 복구
   ========================================================= */
function reset() {
  isDrawing = false;
  /* 공 굴러가는 소리 종료 */
        soundRolling.pause();
        soundRolling.currentTime = 0;

        /* 최종 완료 팡파레 */
        soundFanfare.currentTime = 0;
        soundFanfare.play();

        drawBtn.disabled = false;
  machine.classList.remove("shaking");

  setupFakeBalls();

  numberList.innerHTML = '<p class="empty-message">공들이 멈춰 있어요. 추첨하기 버튼을 눌러줘!</p>';
  dateText.textContent = "추첨 전에는 공이 고정되어 있어요";
}


/* =========================================================
   [추첨 시작 함수]
   ---------------------------------------------------------
   추첨하기 버튼을 누르면 실행됨.

   흐름:
   1) 중복 실행 방지
   2) 로또 번호 미리 생성
   3) 안내문 변경
   4) 추첨기 흔들림 시작
   5) 공 움직임 시작
   6) 2초 뒤 번호 하나씩 발표

   수정 포인트:
   - setTimeout(..., 2000)
     → 공이 움직이기 시작한 뒤 몇 초 후 발표할지.
       현재 2000ms = 2초.
       3초로 바꾸려면 3000.
   ========================================================= */
function draw() {
  if (isDrawing) return;

  isDrawing = true;
  const result = generateLottoNumbers();

  drawBtn.disabled = true;
  numberList.innerHTML = '<p class="empty-message">복복이가 행운 공을 섞는 중이에요...</p>';
  dateText.textContent = "2초 뒤 번호가 하나씩 발표돼요";

  /* 추첨기 흔들림 시작 */
  machine.classList.add("shaking");

  /* 추첨 시작 효과음 */
  soundDrawStart.currentTime = 0;
  soundDrawStart.play();

  /* 공 굴러가는 루프 사운드 */
  soundRolling.currentTime = 0;
  soundRolling.loop = true;
  soundRolling.play();

  /* 공 움직임 시작 */
  startFakeBallMotion();

  /* 2초 뒤 번호 발표 시작 */
  setTimeout(() => {
    announceNumbers(result);
  }, 2000);
}


/* 버튼 클릭 이벤트 연결 */
drawBtn.addEventListener("click", draw);
resetBtn.addEventListener("click", reset);


/* 웹앱이 처음 열렸을 때 초기화 상태로 시작 */
reset();
