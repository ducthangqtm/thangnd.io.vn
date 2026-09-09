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

    // Character physics & state (Realistic Jump Rope Hop: quick & low clearance)
    this.char = {
      x: 0,
      y: 0,
      baseY: 0,
      vy: 0,
      jumpForce: -7.6, // Low, snappy realistic jump rope hop
      gravity: 0.82,
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
      baseSpeed: 0.078,
      speed: 0.078,
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

    // Set character coordinates (Symmetrical front center)
    this.char.x = this.width / 2;
    this.char.baseY = this.height * 0.60;
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
      // Fast, realistic jump clearance (7px off the floor)
      const isCleared = this.char.jumpHeight >= 7;

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
    const vanishX = w / 2;
    const vanishY = h * 0.30; // Deep perspective horizon

    const comboBoost = Math.min(1, this.combo * 0.08);

    // 1. CEILING (Deep synthwave violet ceiling with glowing perspective grid)
    const ceilGrad = this.ctx.createLinearGradient(0, 0, 0, vanishY);
    ceilGrad.addColorStop(0, '#0a081a');
    ceilGrad.addColorStop(1, '#16102e');
    this.ctx.fillStyle = ceilGrad;
    this.ctx.fillRect(0, 0, w, vanishY);

    // Perspective Synthwave Grid on Ceiling (Cyan & Amber lines)
    this.ctx.save();
    this.ctx.lineWidth = 1.2;
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    for (let x = -60; x <= w + 60; x += 35) {
      this.ctx.beginPath();
      this.ctx.moveTo(vanishX, vanishY);
      this.ctx.lineTo(x, 0);
      this.ctx.stroke();
    }

    // Horizontal ceiling neon crossbars (Warm amber / violet)
    for (let i = 1; i <= 5; i++) {
      const frac = Math.pow(i / 5, 1.8);
      const y = vanishY * (1 - frac);
      this.ctx.strokeStyle = `rgba(255, 158, 0, ${0.2 + frac * 0.3})`;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Overhead central neon fluorescent tube
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 16;
    this.ctx.lineWidth = 2.5;
    this.ctx.beginPath();
    this.ctx.moveTo(vanishX, vanishY);
    this.ctx.lineTo(vanishX, 0);
    this.ctx.stroke();
    this.ctx.restore();

    // 2. END OF CORRIDOR BULKHEAD (Closed metal door in distance)
    this.ctx.save();
    this.ctx.fillStyle = '#0e1124';
    this.ctx.fillRect(vanishX - 60, vanishY - 50, 120, 100);

    // Cyan door rim
    this.ctx.strokeStyle = '#00f0ff';
    this.ctx.lineWidth = 2;
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 10;
    this.ctx.strokeRect(vanishX - 32, vanishY - 35, 64, 85);

    // Digital status badge
    this.ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    this.ctx.fillRect(vanishX - 32, vanishY - 35, 64, 85);
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.font = 'bold 8px "Chakra Petch", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚡ 1.5M HALLWAY', vanishX, vanishY - 18);
    this.ctx.fillText('● TiT ARCADE', vanishX, vanishY);
    this.ctx.restore();

    // 3. LEFT & RIGHT INDUSTRIAL CORRIDOR WALLS
    // Left Wall (Deep indigo with metallic panels)
    const leftWall = this.ctx.createLinearGradient(0, 0, w * 0.35, 0);
    leftWall.addColorStop(0, '#0c0e22');
    leftWall.addColorStop(1, '#181b3b');
    this.ctx.fillStyle = leftWall;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(vanishX - 60, vanishY - 50);
    this.ctx.lineTo(vanishX - 60, vanishY + 50);
    this.ctx.lineTo(0, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Right Wall
    const rightWall = this.ctx.createLinearGradient(w * 0.65, 0, w, 0);
    rightWall.addColorStop(0, '#181b3b');
    rightWall.addColorStop(1, '#0c0e22');
    this.ctx.fillStyle = rightWall;
    this.ctx.beginPath();
    this.ctx.moveTo(w, 0);
    this.ctx.lineTo(vanishX + 60, vanishY - 50);
    this.ctx.lineTo(vanishX + 60, vanishY + 50);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // WALL FIXTURES & PIPES (Matching JUMP MASTER '86!)
    this.ctx.save();
    // Conduit pipes on left wall
    this.ctx.strokeStyle = '#2f3559';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.12, 0);
    this.ctx.lineTo(w * 0.12, h * 0.7);
    this.ctx.lineTo(0, h * 0.75);
    this.ctx.stroke();

    // Conduit pipes on right wall
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.88, 0);
    this.ctx.lineTo(w * 0.88, h * 0.7);
    this.ctx.lineTo(w, h * 0.75);
    this.ctx.stroke();

    // LEFT WALL AMBER / ORANGE NEON LAMP (Exact like in JUMP MASTER '86!)
    this.ctx.shadowColor = '#ff9e00';
    this.ctx.shadowBlur = 18 + comboBoost * 10;
    this.ctx.fillStyle = '#ff9e00';
    this.ctx.fillRect(w * 0.16, h * 0.17, 36, 10);
    this.ctx.fillStyle = '#fff4a6';
    this.ctx.fillRect(w * 0.18, h * 0.18, 32, 8);

    // Left door frame
    this.ctx.strokeStyle = 'rgba(255, 158, 0, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(w * 0.14, h * 0.22, 45, h * 0.45);

    // RIGHT WALL CYAN NEON LAMP (Exact like in JUMP MASTER '86!)
    this.ctx.shadowColor = '#00f0ff';
    this.ctx.shadowBlur = 18 + comboBoost * 10;
    this.ctx.fillStyle = '#00f0ff';
    this.ctx.fillRect(w * 0.74, h * 0.17, 36, 10);
    this.ctx.fillStyle = '#e0ffff';
    this.ctx.fillRect(w * 0.74, h * 0.18, 32, 8);

    // Right door frame
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeRect(w * 0.76, h * 0.22, 45, h * 0.45);

    // Right wall Keypad / Control Panel with LED grid
    this.ctx.fillStyle = '#1e2440';
    this.ctx.fillRect(w * 0.86, h * 0.24, 28, 48);
    this.ctx.strokeStyle = '#394370';
    this.ctx.strokeRect(w * 0.86, h * 0.24, 28, 48);
    // Amber/Red LEDs
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 3; col++) {
        this.ctx.fillStyle = (row + col) % 2 === 0 ? '#ff3b30' : '#ff9500';
        this.ctx.fillRect(w * 0.88 + col * 6, h * 0.26 + row * 6, 3, 3);
      }
    }
    this.ctx.restore();

    // 4. REFLECTIVE INDUSTRIAL CORRIDOR FLOOR
    const floorGrad = this.ctx.createLinearGradient(0, vanishY + 50, 0, h);
    floorGrad.addColorStop(0, '#12162a');
    floorGrad.addColorStop(0.5, '#202642');
    floorGrad.addColorStop(1, '#0e1122');
    this.ctx.fillStyle = floorGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(vanishX - 60, vanishY + 50);
    this.ctx.lineTo(vanishX + 60, vanishY + 50);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Floor Perspective Joints & Tile seams
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    this.ctx.lineWidth = 1.2;
    for (let x = -40; x <= w + 40; x += 40) {
      this.ctx.beginPath();
      this.ctx.moveTo(vanishX, vanishY + 50);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }

    // Horizontal tile seams
    for (let r = 1; r <= 7; r++) {
      const frac = Math.pow(r / 7, 2.2);
      const ly = (vanishY + 50) + (h - (vanishY + 50)) * frac;
      const spread = 60 + (w / 2 - 60) * frac;
      this.ctx.beginPath();
      this.ctx.moveTo(vanishX - spread, ly);
      this.ctx.lineTo(vanishX + spread, ly);
      this.ctx.stroke();
    }

    // Floor neon light reflections
    const amberReflect = this.ctx.createRadialGradient(w * 0.3, h * 0.65, 5, w * 0.3, h * 0.65, 80);
    amberReflect.addColorStop(0, 'rgba(255, 158, 0, 0.16)');
    amberReflect.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = amberReflect;
    this.ctx.fillRect(w * 0.1, h * 0.45, w * 0.4, h * 0.45);

    const cyanReflect = this.ctx.createRadialGradient(w * 0.7, h * 0.65, 5, w * 0.7, h * 0.65, 80);
    cyanReflect.addColorStop(0, 'rgba(0, 240, 255, 0.16)');
    cyanReflect.addColorStop(1, 'rgba(0, 0, 0, 0)');
    this.ctx.fillStyle = cyanReflect;
    this.ctx.fillRect(w * 0.5, h * 0.45, w * 0.4, h * 0.45);
    this.ctx.restore();
  }

  drawShadow() {
    const x = this.char.x;
    const y = this.char.baseY + 160;
    const jump = this.char.jumpHeight;

    const scale = Math.max(0.4, 1 - jump / 45);
    const alpha = Math.max(0.25, 0.75 - jump / 35);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 75 * scale, 18 * scale, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fill();

    // Floor neon amber reflection under shoes
    if (jump < 20) {
      this.ctx.beginPath();
      this.ctx.ellipse(x, y + 2, 50 * scale, 10 * scale, 0, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 158, 0, ${0.22 * (1 - jump / 20)})`;
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

    // Pixel character dimensions (Sharp, high fidelity pixel scaling)
    const spriteW = 240;
    const spriteH = 328;

    if (this.state === 'GAMEOVER') {
      // Tripped pose: tilted with dizzyness & rope tangle
      this.ctx.rotate(0.18);
      if (this.jumpSprite.complete && this.jumpSprite.naturalWidth > 0) {
        this.ctx.drawImage(this.jumpSprite, -spriteW / 2, -spriteH / 2 + 15, spriteW, spriteH);
      }
      this.drawDizzyStars(0, -spriteH / 2 - 12);
    } else {
      if (this.jumpSprite.complete && this.jumpSprite.naturalWidth > 0) {
        this.ctx.drawImage(this.jumpSprite, -spriteW / 2, -spriteH / 2, spriteW, spriteH);
      }
    }

    this.ctx.restore();
  }

  drawDizzyStars(cx, cy) {
    this.ctx.save();
    const now = performance.now() * 0.005;
    for (let i = 0; i < 4; i++) {
      const ang = now + (i * Math.PI) / 2;
      const sx = cx + Math.cos(ang) * 35;
      const sy = cy + Math.sin(ang) * 12;
      this.ctx.fillStyle = i % 2 === 0 ? '#ffd60a' : '#ff9e00';
      this.ctx.font = '16px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('💫', sx, sy);
    }
    this.ctx.restore();
  }

  drawRope() {
    const cx = this.char.x;
    const cy = this.char.baseY + 12;
    const angle = this.rope.angle;

    // True aerodynamic vertical ellipse for jump rope
    const radiusY = 168;
    const ropeY = cy + Math.sin(angle) * radiusY;
    const ropeZ = Math.cos(angle);

    // Precise handle anchors at hands of pixel character
    const leftHandleX = cx - 106;
    const leftHandleY = this.char.y + 14;
    const rightHandleX = cx + 115;
    const rightHandleY = this.char.y + 16;

    this.ctx.save();

    const isFront = ropeZ >= 0;
    const lineWidth = isFront ? 4.8 : 2.8;
    const alpha = isFront ? 1.0 : 0.65;

    // Glowing Neon Amber / Orange speed rope matching JUMP MASTER '86!
    this.ctx.strokeStyle = `rgba(255, 158, 0, ${alpha})`;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = '#ff6a00';
    this.ctx.shadowBlur = isFront ? 20 : 6;

    // Authentic vertical ellipse
    const isBottom = Math.sin(angle) >= 0;
    const curveApexY = ropeY;
    const midSpread = 72 * (1 + 0.12 * ropeZ);
    const sag = isBottom ? 18 : -18;

    // Motion trail rings when swinging fast
    if (isFront && this.state === 'PLAYING') {
      this.ctx.save();
      this.ctx.strokeStyle = 'rgba(255, 180, 20, 0.28)';
      this.ctx.lineWidth = 1.8;
      this.ctx.beginPath();
      this.ctx.moveTo(leftHandleX, leftHandleY - 10);
      this.ctx.bezierCurveTo(
        leftHandleX - 14, leftHandleY + (curveApexY - leftHandleY) * 0.45 - 8,
        cx - midSpread - 8, curveApexY + sag - 8,
        cx, curveApexY - 8
      );
      this.ctx.bezierCurveTo(
        cx + midSpread + 8, curveApexY + sag - 8,
        rightHandleX + 14, rightHandleY + (curveApexY - rightHandleY) * 0.45 - 8,
        rightHandleX, rightHandleY - 10
      );
      this.ctx.stroke();
      this.ctx.restore();
    }

    // Main rope curve: Left Handle -> Apex under shoes / above head -> Right Handle
    this.ctx.beginPath();
    this.ctx.moveTo(leftHandleX, leftHandleY);
    this.ctx.bezierCurveTo(
      leftHandleX - 10 + 14 * ropeZ,
      leftHandleY + (curveApexY - leftHandleY) * 0.45,
      cx - midSpread,
      curveApexY + sag,
      cx,
      curveApexY
    );
    this.ctx.bezierCurveTo(
      cx + midSpread,
      curveApexY + sag,
      rightHandleX + 10 - 14 * ropeZ,
      rightHandleY + (curveApexY - rightHandleY) * 0.45,
      rightHandleX,
      rightHandleY
    );
    this.ctx.stroke();

    // Inner bright golden-white hot core
    if (isFront) {
      this.ctx.strokeStyle = '#fff8bd';
      this.ctx.lineWidth = 1.8;
      this.ctx.shadowBlur = 4;
      this.ctx.shadowColor = '#ffd60a';
      this.ctx.stroke();
    }

    // Floor contact flash (under feet)
    if (Math.abs(angle - Math.PI / 2) < 0.22 && this.char.jumpHeight > 2) {
      this.ctx.fillStyle = 'rgba(255, 180, 0, 0.75)';
      this.ctx.shadowColor = '#ff9e00';
      this.ctx.shadowBlur = 18;
      this.ctx.beginPath();
      this.ctx.ellipse(cx, curveApexY, 36, 6, 0, 0, Math.PI * 2);
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
