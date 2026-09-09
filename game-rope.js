// Game: Thắng Nhảy Dây - Thử Thách Hành Lang 1m5
// High-Fidelity Canvas 2D Engine with High-Res Assets & Physics

class RopeGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

    // Load High-Res Graphic Assets
    this.assetsLoaded = false;
    this.loadAssets();

    // Game state
    this.state = 'START'; // 'START', 'PLAYING', 'GAMEOVER'
    this.score = 0;
    this.combo = 0;
    this.highScore = parseInt(localStorage.getItem('thang_high_score') || '0', 10);
    this.playerName = localStorage.getItem('thang_player_name') || 'VĐV Hành Lang';

    // Character physics & state
    this.char = {
      x: 0,
      y: 0,
      baseY: 0,
      vy: 0,
      jumpForce: -13.8,
      gravity: 0.72,
      isGrounded: true,
      jumpHeight: 0,
      scaleX: 1,
      scaleY: 1,
      targetScaleX: 1,
      targetScaleY: 1
    };

    // Rope rotation mechanics
    this.rope = {
      angle: -Math.PI / 2, // Starts at the top
      baseSpeed: 0.076,
      speed: 0.076,
      passedBottom: false,
      isDangerZone: false,
      glowIntensity: 1
    };

    // Screen shake on hit
    this.shake = 0;

    // Confetti / Particle system
    this.particles = [];
    this.floatingTexts = [];

    // Setup canvas dimensions and initial coords
    this.setupCanvas();

    // Bind event listeners
    this.initEvents();

    // Game loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  loadAssets() {
    this.bgImg = new Image();
    this.bgImg.src = 'assets/hallway-bg.jpg';

    this.jumpSprite = new Image();
    this.jumpSprite.src = 'assets/thang-jump.png';

    this.tripSprite = new Image();
    this.tripSprite.src = 'assets/thang-tripped.png';

    let loadedCount = 0;
    const onLoad = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        this.assetsLoaded = true;
      }
    };

    this.bgImg.onload = onLoad;
    this.jumpSprite.onload = onLoad;
    this.tripSprite.onload = onLoad;
  }

  setupCanvas() {
    const parent = this.canvas.parentElement;
    const rect = parent.getBoundingClientRect();
    const width = Math.min(rect.width || 460, 460);
    const height = Math.min(window.innerHeight * 0.75, 660);

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.scale(dpr, dpr);
    this.width = width;
    this.height = height;

    // Set character coordinates
    this.char.x = this.width / 2;
    this.char.baseY = this.height * 0.70;
    this.char.y = this.char.baseY;
  }

  initEvents() {
    window.addEventListener('resize', () => this.setupCanvas());

    const handleAction = (e) => {
      if (e.target.closest('#nameModal') || e.target.closest('.ui-interactive')) return;
      if (this.state === 'START') {
        this.startGame();
      } else if (this.state === 'PLAYING') {
        this.jump();
      } else if (this.state === 'GAMEOVER') {
        if (this.canRestart) {
          this.restartGame();
        }
      }
    };

    this.canvas.addEventListener('pointerdown', handleAction);

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleAction(e);
      }
    });
  }

  jump() {
    if (this.char.isGrounded) {
      this.char.vy = this.char.jumpForce;
      this.char.isGrounded = false;
      this.char.targetScaleX = 0.9;
      this.char.targetScaleY = 1.15; // Stretch up
      window.soundEngine.playJump();
    }
  }

  startGame() {
    this.state = 'PLAYING';
    this.score = 0;
    this.combo = 0;
    this.rope.speed = this.rope.baseSpeed;
    this.rope.angle = -Math.PI / 2;
    this.rope.passedBottom = false;
    this.char.y = this.char.baseY;
    this.char.vy = 0;
    this.char.isGrounded = true;
    this.canRestart = false;

    this.updateHUD();
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('gameHUD').classList.remove('hidden');
  }

  restartGame() {
    this.startGame();
  }

  gameOver() {
    this.state = 'GAMEOVER';
    this.shake = 16;
    window.soundEngine.playTrip();

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('thang_high_score', this.highScore);
    }

    if (window.leaderboard) {
      window.leaderboard.submitScore(this.playerName, this.score);
    }

    setTimeout(() => {
      this.canRestart = true;
      document.getElementById('finalScore').innerText = this.score;
      document.getElementById('finalHighScore').innerText = this.highScore;
      document.getElementById('finalTitle').innerText = this.getTitle(this.score);
      document.getElementById('gameOverOverlay').classList.remove('hidden');
    }, 450);
  }

  getTitle(score) {
    if (score >= 100) return '👑 Huyền Thoại Hành Lang 1m5';
    if (score >= 50) return '⚡ Bậc Thầy Double Under';
    if (score >= 30) return '🔥 Quái Kiệt Nhảy Dây';
    if (score >= 15) return '⭐ Chuyên Gia Bắt Nhịp';
    if (score >= 5) return '👟 Khởi Động Hành Lang';
    return '🌱 Tập Sự Nhảy Dây';
  }

  updateHUD() {
    const scoreEl = document.getElementById('hudScore');
    const comboEl = document.getElementById('hudCombo');
    if (scoreEl) scoreEl.innerText = this.score;
    if (comboEl) {
      if (this.combo > 2) {
        comboEl.innerText = `x${this.combo} Combo!`;
        comboEl.classList.remove('hidden');
      } else {
        comboEl.classList.add('hidden');
      }
    }
  }

  spawnScoreParticles(x, y) {
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 60,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 5,
        vy: -Math.random() * 4 - 2,
        color: ['#39ff14', '#00f0ff', '#facc15', '#ffffff'][Math.floor(Math.random() * 4)],
        size: Math.random() * 5 + 2,
        life: 1,
        decay: 0.035
      });
    }

    // Floating text "+1"
    this.floatingTexts.push({
      x: x + 40,
      y: y - 20,
      text: '+1',
      life: 1,
      decay: 0.03
    });
  }

  update(dt) {
    if (this.shake > 0) this.shake *= 0.88;
    if (this.shake < 0.2) this.shake = 0;

    // Smooth squash/stretch return
    this.char.scaleX += (this.char.targetScaleX - this.char.scaleX) * 0.18;
    this.char.scaleY += (this.char.targetScaleY - this.char.scaleY) * 0.18;

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.2;
      ft.life -= ft.decay;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }

    if (this.state !== 'PLAYING') return;

    // 1. Character Jump Physics
    this.char.y += this.char.vy;
    this.char.vy += this.char.gravity;

    if (this.char.y >= this.char.baseY) {
      this.char.y = this.char.baseY;
      this.char.vy = 0;
      if (!this.char.isGrounded) {
        this.char.isGrounded = true;
        this.char.targetScaleX = 1.15; // Squash on landing
        this.char.targetScaleY = 0.85;
        setTimeout(() => {
          this.char.targetScaleX = 1;
          this.char.targetScaleY = 1;
        }, 80);
      }
    }

    this.char.jumpHeight = this.char.baseY - this.char.y;

    // 2. Rope Rotation Physics
    const prevAngle = this.rope.angle;
    this.rope.angle += this.rope.speed;

    if (this.rope.angle > Math.PI) {
      this.rope.angle -= Math.PI * 2;
      this.rope.passedBottom = false;
    }

    // Play whoosh when rope sweeps down in front
    if (prevAngle < 0 && this.rope.angle >= 0) {
      window.soundEngine.playWhoosh(1 + this.score * 0.01);
    }

    // 3. Collision Detection at bottom
    const hitAngle = Math.PI / 2;
    const dangerRange = 0.28;
    const isAtBottom = Math.abs(this.rope.angle - hitAngle) < dangerRange;

    if (isAtBottom && !this.rope.passedBottom) {
      const isCleared = this.char.jumpHeight >= 15;

      if (!isCleared) {
        this.gameOver();
        return;
      } else {
        this.rope.passedBottom = true;
        this.score++;
        this.combo++;
        this.updateHUD();
        window.soundEngine.playScore();
        this.spawnScoreParticles(this.char.x, this.char.baseY + 30);

        if (this.score % 25 === 0) {
          window.soundEngine.playCelebration();
        }

        this.rope.speed = Math.min(0.138, this.rope.baseSpeed + Math.floor(this.score / 5) * 0.004);
      }
    }
  }

  draw() {
    this.ctx.save();

    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      this.ctx.translate(sx, sy);
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw Beautiful 1.5m Hallway Background
    this.drawHallwayBackground();

    // 2. Rope behind character
    const isRopeBehind = this.rope.angle > Math.PI / 2 || this.rope.angle < -Math.PI / 2;
    if (isRopeBehind) {
      this.drawRope();
    }

    // 3. Draw Character Shadow & Thắng Character
    this.drawShadow();
    this.drawThangCharacter();

    // 4. Rope in front of character
    if (!isRopeBehind) {
      this.drawRope();
    }

    // 5. Particles & Popups
    this.drawParticles();
    this.drawFloatingTexts();

    this.ctx.restore();
  }

  drawHallwayBackground() {
    const w = this.width;
    const h = this.height;

    if (this.bgImg.complete && this.bgImg.naturalWidth > 0) {
      // Draw Cover Image with subtle vignette
      this.ctx.drawImage(this.bgImg, 0, 0, w, h);

      // Subtle atmospheric dark vignette on edges
      const grad = this.ctx.createRadialGradient(w / 2, h * 0.45, w * 0.25, w / 2, h * 0.45, w * 0.85);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(6, 7, 20, 0.55)');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, w, h);
    } else {
      // Fallback
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(0, 0, w, h);
    }
  }

  drawShadow() {
    const x = this.char.x;
    const y = this.char.baseY + 54;
    const jump = this.char.jumpHeight;

    const scale = Math.max(0.35, 1 - jump / 140);
    const alpha = Math.max(0.18, 0.65 - jump / 180);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 52 * scale, 15 * scale, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fill();

    // Soft colored floor reflection of lime shirt & shoes
    if (jump < 40) {
      this.ctx.beginPath();
      this.ctx.ellipse(x, y + 2, 35 * scale, 8 * scale, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(57, 255, 20, ${0.15 * (1 - jump / 40)})`;
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawThangCharacter() {
    this.ctx.save();
    const cx = this.char.x;
    const cy = this.char.y;

    this.ctx.translate(cx, cy);
    this.ctx.scale(this.char.scaleX, this.char.scaleY);

    // Desired sprite size
    const spriteSize = 210;

    if (this.state === 'GAMEOVER') {
      // Draw Tripped / Game Over sprite
      if (this.tripSprite.complete && this.tripSprite.naturalWidth > 0) {
        this.ctx.drawImage(this.tripSprite, -spriteSize / 2, -spriteSize / 2 - 15, spriteSize, spriteSize);
      }
    } else {
      // Draw Jumping / Athletic sprite
      if (this.jumpSprite.complete && this.jumpSprite.naturalWidth > 0) {
        // Draw crisp character
        this.ctx.drawImage(this.jumpSprite, -spriteSize / 2, -spriteSize / 2 - 15, spriteSize, spriteSize);
      }
    }

    this.ctx.restore();
  }

  drawRope() {
    const cx = this.char.x;
    const cy = this.char.baseY + 10;
    const angle = this.rope.angle;

    // 3D Ellipse Radii
    const radiusY = 110;
    const radiusX = 75;

    const ropeY = cy - 25 + Math.sin(angle) * radiusY;
    const ropeZ = Math.cos(angle);

    // Handle anchor coordinates near Thắng's hands
    const leftHandleX = cx - 38;
    const leftHandleY = this.char.y - 12;
    const rightHandleX = cx + 38;
    const rightHandleY = this.char.y - 12;

    this.ctx.save();

    const isFront = ropeZ >= 0;
    const lineWidth = isFront ? 4.5 : 2.6;
    const alpha = isFront ? 0.98 : 0.6;

    // Glowing Neon Lime speed rope
    this.ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = '#39ff14';
    this.ctx.shadowBlur = isFront ? 14 : 4;

    this.ctx.beginPath();
    this.ctx.moveTo(leftHandleX, leftHandleY);

    const ctrlSpread = radiusX * (1 + 0.22 * ropeZ);
    this.ctx.bezierCurveTo(
      cx - ctrlSpread,
      ropeY,
      cx + ctrlSpread,
      ropeY,
      rightHandleX,
      rightHandleY
    );
    this.ctx.stroke();

    // Inner bright core
    if (isFront) {
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      this.ctx.lineWidth = 1.6;
      this.ctx.shadowBlur = 0;
      this.ctx.stroke();
    }

    // Floor contact flash
    if (Math.abs(angle - Math.PI / 2) < 0.22 && this.char.jumpHeight > 10) {
      this.ctx.fillStyle = 'rgba(57, 255, 20, 0.55)';
      this.ctx.shadowColor = '#39ff14';
      this.ctx.shadowBlur = 20;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy + radiusY - 26, 36, 6, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 8;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  drawFloatingTexts() {
    this.ctx.save();
    for (const ft of this.floatingTexts) {
      this.ctx.font = 'bold 18px "Chakra Petch", sans-serif';
      this.ctx.fillStyle = `rgba(57, 255, 20, ${ft.life})`;
      this.ctx.shadowColor = '#39ff14';
      this.ctx.shadowBlur = 10;
      this.ctx.fillText(ft.text, ft.x, ft.y);
    }
    this.ctx.restore();
  }

  loop(timestamp) {
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  }
}

window.RopeGame = RopeGame;
