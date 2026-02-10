const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

const images = {};
["jughead.PNG", "redpipe.PNG", "ground.PNG"].forEach(name => {
  const img = new Image();
  img.src = `assets/${name}`;
  images[name] = img;
});

const sounds = {
  score: new Audio("assets/score.mp3"),
  hit: new Audio("assets/hit.mp3")
};
let soundUnlocked = false;

let state = "start";
let score = 0;
let best = Number(localStorage.getItem("flappy_best") || 0);
let frames = 0;
let shake = 0;

/* bird */
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
    const img = images["jughead.PNG"];
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    } else {
      ctx.fillStyle = "#ff0";
      ctx.fillRect(this.x - this.w / 2, this.y - this.h / 2, this.w, this.h);
    }
  }
};

/* ground */
const ground = {
  h: 96,
  y: H - 96,
  speed: 2.2,
  offset: 0,
  update() {
    this.offset = (this.offset + this.speed) % W;
  },
  draw() {
    const img = images["ground.PNG"];
    if (img.complete && img.naturalWidth) {
      ctx.drawImage(img, -this.offset, this.y, W, this.h);
      ctx.drawImage(img, W - this.offset, this.y, W, this.h);
    } else {
      ctx.fillStyle = "#c2a16a";
      ctx.fillRect(0, this.y, W, this.h);
    }
  }
};

/* pipes */
const pipes = [];
const pipeGap = 150;
const pipeWidth = 56;
const pipeSpeed = 2.2;

function spawnPipe() {
  const top = 80 + Math.random() * 220;
  pipes.push({ x: W + 40, top, passed: false });
}

function reset() {
  pipes.length = 0;
  bird.y = H / 2;
  bird.vel = 0;
  score = 0;
  frames = 0;
  state = "start";
  document.getElementById("score").textContent = score;
}

function die() {
  if (state !== "playing") return;
  state = "over";
  shake = 20;
  sounds.hit.currentTime = 0;
  sounds.hit.play();
  best = Math.max(best, score);
  localStorage.setItem("flappy_best", best);
}

function update() {
  frames++;

  if (state === "playing") {
    bird.update();
    ground.update();

    if (frames % 100 === 0) spawnPipe();

    for (let i = pipes.length - 1; i >= 0; i--) {
      const p = pipes[i];
      p.x -= pipeSpeed;

      if (!p.passed && p.x + pipeWidth < bird.x) {
        p.passed = true;
        score++;
        document.getElementById("score").textContent = score;
        try {
          sounds.score.currentTime = 0;
          sounds.score.play();
        } catch (err) { }
      }

      if (p.x < -pipeWidth) pipes.splice(i, 1);

      if (
        bird.x + bird.w / 2 > p.x &&
        bird.x - bird.w / 2 < p.x + pipeWidth &&
        (bird.y - bird.h / 2 < p.top ||
         bird.y + bird.h / 2 > p.top + pipeGap)
      ) {
        die();
      }
    }

    if (bird.y < 0 || bird.y + bird.h / 2 >= ground.y) {
      bird.y = ground.y - bird.h / 2;
      die();
    }
  }
}

function drawScoreScreen() {
  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.fillRect(0, 0, W, H);

  ctx.textAlign = "center";

  ctx.font = "bold 42px system-ui";
  ctx.fillStyle = "#fff";
  ctx.fillText("Crashed!", W / 2, H / 2 - 80);

  ctx.font = "bold 28px system-ui";
  ctx.fillStyle = "#ffd166";
  ctx.fillText(`Score: ${score}`, W / 2, H / 2 - 10);

  ctx.font = "20px system-ui";
  ctx.fillStyle = "#fff";
  ctx.fillText(`Best: ${best}`, W / 2, H / 2 + 30);

  ctx.font = "16px system-ui";
  ctx.fillStyle = "#ddd";
  ctx.fillText("Press R to retry", W / 2, H / 2 + 70);
}

function draw() {
  ctx.save();

  if (shake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * shake,
      (Math.random() - 0.5) * shake
    );
    shake--;
  }

  ctx.fillStyle = "#70c5ce";
  ctx.fillRect(0, 0, W, H);

  for (const p of pipes) {
    const img = images["redpipe.PNG"];
    if (img && img.complete && img.naturalWidth !== 0) {
      ctx.save();
      ctx.translate(p.x + pipeWidth / 2, p.top);
      ctx.scale(1, -1);
      ctx.drawImage(img, -pipeWidth / 2, 0, pipeWidth, p.top);
      ctx.restore();

      ctx.drawImage(
        img,
        p.x,
        p.top + pipeGap,
        pipeWidth,
        ground.y - (p.top + pipeGap)
      );
    } else {
      ctx.fillStyle = "#2ecc71";
      ctx.fillRect(p.x, 0, pipeWidth, p.top);
      ctx.fillRect(
        p.x,
        p.top + pipeGap,
        pipeWidth,
        ground.y - (p.top + pipeGap)
      );
    }
  }

  // ground and bird
  ground.draw();
  bird.draw();

  ctx.restore();

  if (state === "start") {
    ctx.fillStyle = "#000";
    ctx.font = "20px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Click or press Space", W / 2, H / 2 - 60);
  }

  if (state === "over") {
    drawScoreScreen();
  }
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

function unlockSound() {
  if (!soundUnlocked) {
    Object.values(sounds).forEach(s => {
      s.play().then(() => s.pause()).catch(() => {});
    });
    soundUnlocked = true;
  }
}

document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    unlockSound();
    if (state === "start") state = "playing";
    if (state === "playing") bird.flap();
  }
  if (e.key.toLowerCase() === "r") reset();
});

document.addEventListener("click", () => {
  unlockSound();
  if (state === "start") state = "playing";
  if (state === "playing") bird.flap();
});

reset();
loop();
