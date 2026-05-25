/* =========================================================
   복복이 로또 웹앱 script.js - 550x550 / 초기화 기능 제거 버전
   ========================================================= */

const LOTTO_MAX = 45;
const PICK_COUNT = 6;
const IDLE_BALL_COUNT = 15;

const drawBtn = document.getElementById("drawBtn");
const numberList = document.getElementById("numberList");
const dateText = document.getElementById("dateText");
const machine = document.getElementById("machine");
const machineBalls = document.getElementById("machineBalls");

let idleBalls = [];
let isDrawing = false;

/* 사운드 */
const soundDrawStart = new Audio("./assets/audio/draw_start.wav");
const soundRolling = new Audio("./assets/audio/ball_rolling.wav");
const soundAnnounce = new Audio("./assets/audio/number_announce.wav");
const soundFanfare = new Audio("./assets/audio/fanfare.wav");

soundDrawStart.volume = 0.45;
soundRolling.volume = 0.32;
soundAnnounce.volume = 0.48;
soundFanfare.volume = 0.5;

/* 550x550 추첨기 안 공 고정 위치 */
const fixedBallPositions = [
  [18, 58], [31, 42], [45, 59], [58, 41], [70, 57],
  [23, 28], [38, 24], [53, 30], [66, 27], [12, 43],
  [30, 68], [46, 72], [62, 68], [54, 49], [75, 42],
];

function generateLottoNumbers() {
  const pool = Array.from({ length: LOTTO_MAX }, (_, i) => i + 1);

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return {
    main: pool.slice(0, PICK_COUNT).sort((a, b) => a - b),
    bonus: pool[PICK_COUNT],
  };
}

function ballGradient(num) {
  if (num <= 10) return "linear-gradient(135deg, #ffe76a, #f2a51f)";
  if (num <= 20) return "linear-gradient(135deg, #85d7ff, #3e91e8)";
  if (num <= 30) return "linear-gradient(135deg, #ff929c, #e95468)";
  if (num <= 40) return "linear-gradient(135deg, #b9e968, #61b846)";
  return "linear-gradient(135deg, #d3a4ff, #8e5bd8)";
}

function createBall(num, className = "ball", delay = 0) {
  const ball = document.createElement("div");
  ball.className = className;
  ball.textContent = num;
  ball.style.background = ballGradient(num);
  ball.style.animationDelay = `${delay}ms`;
  return ball;
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* 첫 화면과 재추첨 직전 공들을 고정 상태로 배치 */
function setupFakeBalls() {
  machineBalls.innerHTML = "";
  idleBalls = [];

  for (let i = 0; i < IDLE_BALL_COUNT; i++) {
    const num = randomBetween(1, LOTTO_MAX);
    const ball = createBall(num, "mini-ball idle");
    const [left, top] = fixedBallPositions[i];

    ball.style.left = `${left}%`;
    ball.style.top = `${top}%`;

    /* 550x550용 이동 거리 */
    ball.style.setProperty("--x1", `${randomBetween(-38, 38)}px`);
    ball.style.setProperty("--y1", `${randomBetween(-22, 22)}px`);
    ball.style.setProperty("--x2", `${randomBetween(-46, 46)}px`);
    ball.style.setProperty("--y2", `${randomBetween(-29, 29)}px`);
    ball.style.setProperty("--x3", `${randomBetween(-42, 42)}px`);
    ball.style.setProperty("--y3", `${randomBetween(-27, 27)}px`);
    ball.style.setProperty("--x4", `${randomBetween(-38, 38)}px`);
    ball.style.setProperty("--y4", `${randomBetween(-24, 24)}px`);
    ball.style.setProperty("--x5", `${randomBetween(-48, 48)}px`);
    ball.style.setProperty("--y5", `${randomBetween(-31, 31)}px`);

    ball.style.setProperty("--duration", `${(randomBetween(55, 90) / 100).toFixed(2)}s`);
    ball.style.setProperty("--delay", `${(randomBetween(0, 22) / 100).toFixed(2)}s`);

    machineBalls.appendChild(ball);
    idleBalls.push(ball);
  }
}

function startFakeBallMotion() {
  idleBalls.forEach((ball) => {
    ball.classList.remove("idle");
    ball.classList.add("active");
  });
}

function stopFakeBallMotion() {
  idleBalls.forEach((ball) => {
    ball.classList.remove("active");
    ball.classList.add("idle");
  });
}

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

function announceNumbers(result) {
  const sequence = [
    ...result.main.map((num) => ({ num, bonus: false })),
    { num: result.bonus, bonus: true },
  ];

  sequence.forEach((item, index) => {
    setTimeout(() => {
      const fake = idleBalls[index % idleBalls.length];

      if (fake) {
        fake.textContent = item.num;
        fake.style.background = ballGradient(item.num);
        fake.classList.add("selected");
        setTimeout(() => fake.classList.remove("selected"), 550);
      }

      soundAnnounce.currentTime = 0;
      soundAnnounce.play();

      appendResultBall(item.num, index, item.bonus);

      if (index === sequence.length - 1) {
        const today = new Date().toLocaleDateString("ko-KR");
        dateText.textContent = `${today} 추첨 완료`;

        machine.classList.remove("shaking");
        stopFakeBallMotion();

        soundRolling.pause();
        soundRolling.currentTime = 0;

        soundFanfare.currentTime = 0;
        soundFanfare.play();

        drawBtn.disabled = false;
        isDrawing = false;
      }
    }, index * 560);
  });
}

function draw() {
  if (isDrawing) return;

  isDrawing = true;

  /* 재추첨할 때는 결과를 지우고 공을 다시 고정 배치 */
  setupFakeBalls();

  const result = generateLottoNumbers();

  drawBtn.disabled = true;
  numberList.innerHTML = '<p class="empty-message">복복이가 행운 공을 섞는 중이에요...</p>';
  dateText.textContent = "2초 뒤 번호가 하나씩 발표돼요";

  machine.classList.add("shaking");

  soundDrawStart.currentTime = 0;
  soundDrawStart.play();

  soundRolling.currentTime = 0;
  soundRolling.loop = true;
  soundRolling.play();

  startFakeBallMotion();

  setTimeout(() => {
    announceNumbers(result);
  }, 2000);
}

/* 버튼 클릭 이벤트 */
drawBtn.addEventListener("click", draw);

/* 최초 실행 상태 */
setupFakeBalls();
numberList.innerHTML = '<p class="empty-message">공들이 멈춰 있어요. 추첨하기 버튼을 눌러줘!</p>';
dateText.textContent = "추첨 전에는 공이 고정되어 있어요";
