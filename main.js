const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const images = {};
["bird.png", "pipe.png", "ground.png"].forEach(name => {
  const img = new Image();
  img.src = `assets/${name}`;
  images[name] = img;
});

let gameState = "start";
let score = 0;

const bird = {
  x: 100,
  y: H / 2,
  w: 34,
  h: 24,
  vel: 0,
  gravity: 0.6,
  jump: -10,
  update() {
    this.vel += this.gravity;
    this.y += this.vel;
  },
  flap() {
    this.vel = this.jump;
  },
  draw() {
    const img = images["bird.png"];
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    } else {
      ctx.fillStyle = "#ff0";
      ctx.fillRect(this.x - this.w/2, this.y - this.h/2, this.w, this.h);
    }
  }
};

const pipes = [];
const pipeGap = 150;
const pipeWidth = 56;
const pipeSpeed = 2;

function spawnPipe() {
  const top = 80 + Math.random() * 200;
  pipes.push({ x: W + 20, top, passed: false });
}

function reset() {
  pipes.length = 0;
  bird.y = H / 2;
  bird.vel = 0;
  score = 0;
  gameState = "start";
  document.getElementById("score").textContent = score;
}

function update() {
  if (gameState === "playing") {
    bird.update();

    if (frames % 100 === 0) spawnPipe();

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed;

      if (!p.passed && p.x + pipeWidth < bird.x) {
        p.passed = true;
        score++;
        document.getElementById("score").textContent = score;
      }

      if (p.x < -pipeWidth) pipes.splice(i, 1);

      if (
        bird.x + bird.w/2 > p.x &&
        bird.x - bird.w/2 < p.x + pipeWidth &&
        (bird.y - bird.h/2 < p.top ||
         bird.y + bird.h/2 > p.top + pipeGap)
      ) {
        gameState = "over";
      }
    }

    if (bird.y > H || bird.y < 0) {
      gameState = "over";
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#70c5ce";
  ctx.fillRect(0, 0, W, H);

  for (const p of pipes) {
    const img = images["pipe.png"];
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, p.x, 0, pipeWidth, p.top);
      ctx.drawImage(
        img,
        p.x,
        p.top + pipeGap,
        pipeWidth,
        H - p.top - pipeGap
      );
    } else {
      ctx.fillStyle = "#2ecc71";
      ctx.fillRect(p.x, 0, pipeWidth, p.top);
      ctx.fillRect(p.x, p.top + pipeGap, pipeWidth, H);
    }
  }

  bird.draw();

  if (gameState === "start") {
    ctx.fillStyle = "#000";
    ctx.font = "20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Click or press Space", W/2, H/2 - 60);
  }

  if (gameState === "over") {
    ctx.fillStyle = "#000";
    ctx.font = "28px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", W/2, H/2);
    ctx.font = "16px system-ui";
    ctx.fillText("Press R to restart", W/2, H/2 + 30);
  }
}

let frames = 0;
function loop() {
  frames++;
  update();
  draw();
  requestAnimationFrame(loop);
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    if (gameState === "start") gameState = "playing";
    if (gameState === "playing") bird.flap();
  }
  if (e.key.toLowerCase() === "r") reset();
});

document.addEventListener("click", () => {
  if (gameState === "start") gameState = "playing";
  if (gameState === "playing") bird.flap();
});

reset();
loop();