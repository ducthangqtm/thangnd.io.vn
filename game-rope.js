// Game: Thắng Nhảy Dây - Thử Thách Hành Lang 1m5
// 100% Canvas 2D + Vanilla JS

class RopeGame {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');

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
      jumpForce: -13.5,
      gravity: 0.75,
      isGrounded: true,
      jumpHeight: 0,
      squash: 1, // Stretch/squash factor
      blinkTimer: 0,
      isBlinking: false
    };

    // Rope rotation mechanics
    this.rope = {
      angle: -Math.PI / 2, // Starts at the top
      baseSpeed: 0.075,     // Speed in radians per frame (~100-110 RPM)
      speed: 0.075,
      passedBottom: false,
      isDangerZone: false,
      swingCount: 0
    };

    // Hallway visual elements
    this.hallway = {
      wallColorLeft: '#1e293b',
      wallColorRight: '#0f172a',
      floorTilesOffset: 0
    };

    // Screen shake on hit
    this.shake = 0;

    // Confetti / Particle system
    this.particles = [];

    // Setup canvas dimensions and initial coords
    this.setupCanvas();

    // Bind event listeners
    this.initEvents();

    // Game loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  setupCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const width = Math.min(rect.width, 480);
    const height = Math.min(window.innerHeight * 0.72, 640);

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
    this.char.baseY = this.height * 0.74;
    this.char.y = this.char.baseY;
  }

  initEvents() {
    window.addEventListener('resize', () => this.setupCanvas());

    // Tap / Click to jump
    const handleAction = (e) => {
      if (e.target.closest('#nameModal') || e.target.closest('.ui-interactive')) return;
      if (this.state === 'START') {
        this.startGame();
      } else if (this.state === 'PLAYING') {
        this.jump();
      } else if (this.state === 'GAMEOVER') {
        // Can tap to restart after small cooldown
        if (this.canRestart) {
          this.restartGame();
        }
      }
    };

    this.canvas.addEventListener('pointerdown', handleAction);

    // Keyboard Space / Up Arrow
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
      this.char.squash = 1.25; // Stretch upwards
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

    // Update UI
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
    this.shake = 15;
    window.soundEngine.playTrip();

    // Check high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('thang_high_score', this.highScore);
    }

    // Submit to leaderboard if available
    if (window.leaderboard) {
      window.leaderboard.submitScore(this.playerName, this.score);
    }

    // Show Game Over UI after brief moment
    setTimeout(() => {
      this.canRestart = true;
      document.getElementById('finalScore').innerText = this.score;
      document.getElementById('finalHighScore').innerText = this.highScore;
      document.getElementById('finalTitle').innerText = this.getTitle(this.score);
      document.getElementById('gameOverOverlay').classList.remove('hidden');
    }, 400);
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
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 40,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 2,
        color: ['#39ff14', '#facc15', '#38bdf8', '#ffffff'][Math.floor(Math.random() * 4)],
        size: Math.random() * 4 + 2,
        life: 1,
        decay: 0.03
      });
    }
  }

  update(dt) {
    // Screen shake decay
    if (this.shake > 0) this.shake *= 0.88;
    if (this.shake < 0.2) this.shake = 0;

    // Character blink timer
    this.char.blinkTimer++;
    if (this.char.blinkTimer > 180) {
      this.char.isBlinking = true;
      if (this.char.blinkTimer > 190) {
        this.char.isBlinking = false;
        this.char.blinkTimer = 0;
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) this.particles.splice(i, 1);
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
        this.char.squash = 0.85; // Squash on landing
      }
    }

    // Return squash to normal
    this.char.squash += (1 - this.char.squash) * 0.15;
    this.char.jumpHeight = this.char.baseY - this.char.y;

    // 2. Rope Rotation Physics
    // Rope rotates clockwise: Top (-PI/2) -> Front (0) -> Bottom (PI/2) -> Back (PI)
    const prevAngle = this.rope.angle;
    this.rope.angle += this.rope.speed;

    // Normalize angle to [-PI, PI]
    if (this.rope.angle > Math.PI) {
      this.rope.angle -= Math.PI * 2;
      this.rope.passedBottom = false; // Reset for next rotation
    }

    // Play whoosh when rope sweeps down in front
    if (prevAngle < 0 && this.rope.angle >= 0) {
      window.soundEngine.playWhoosh(1 + this.score * 0.01);
    }

    // 3. Danger Zone / Collision Detection
    // The bottom-most point is angle = Math.PI / 2 (90 degrees, hitting the floor)
    const hitAngle = Math.PI / 2;
    const dangerRange = 0.28; // Arc around the floor
    const isAtBottom = Math.abs(this.rope.angle - hitAngle) < dangerRange;

    if (isAtBottom && !this.rope.passedBottom) {
      // Must jump high enough off the floor to clear rope (min clearance 16px)
      const isCleared = this.char.jumpHeight >= 15;

      if (!isCleared) {
        // TRIPPED!
        this.gameOver();
        return;
      } else {
        // SUCCESSFUL JUMP!
        this.rope.passedBottom = true;
        this.score++;
        this.combo++;
        this.updateHUD();
        window.soundEngine.playScore();
        this.spawnScoreParticles(this.char.x, this.char.baseY + 15);

        // Milestone fanfare every 25 points
        if (this.score % 25 === 0) {
          window.soundEngine.playCelebration();
        }

        // Slight speed progression (starts at 0.075, caps at 0.135 for crazy challenge)
        this.rope.speed = Math.min(0.135, this.rope.baseSpeed + Math.floor(this.score / 5) * 0.004);
      }
    }
  }

  draw() {
    this.ctx.save();

    // Apply screen shake
    if (this.shake > 0) {
      const sx = (Math.random() - 0.5) * this.shake;
      const sy = (Math.random() - 0.5) * this.shake;
      this.ctx.translate(sx, sy);
    }

    // Clear background
    this.ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw 1.5m Hallway Perspective
    this.drawHallway();

    // 2. Draw Rope Layer Behind Character
    // When rope is between PI/2 and -PI/2 (behind back), draw first
    const isRopeBehind = this.rope.angle > Math.PI / 2 || this.rope.angle < -Math.PI / 2;
    if (isRopeBehind) {
      this.drawRope();
    }

    // 3. Draw Character Shadow & Character (Thắng)
    this.drawShadow();
    this.drawThang();

    // 4. Draw Rope Layer in Front of Character
    if (!isRopeBehind) {
      this.drawRope();
    }

    // 5. Draw Particles
    this.drawParticles();

    this.ctx.restore();
  }

  drawHallway() {
    const w = this.width;
    const h = this.height;
    const vanishX = w / 2;
    const vanishY = h * 0.32; // Horizon vanishing point

    // Ceiling gradient
    const ceilGrad = this.ctx.createLinearGradient(0, 0, 0, vanishY);
    ceilGrad.addColorStop(0, '#090d16');
    ceilGrad.addColorStop(1, '#1e293b');
    this.ctx.fillStyle = ceilGrad;
    this.ctx.fillRect(0, 0, w, vanishY);

    // Back wall (end of hallway)
    this.ctx.fillStyle = '#1e293b';
    this.ctx.fillRect(vanishX - 80, vanishY - 60, 160, 120);

    // Hallway End Window / Door with light
    const lightGrad = this.ctx.createRadialGradient(vanishX, vanishY, 5, vanishX, vanishY, 90);
    lightGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
    lightGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.15)');
    lightGrad.addColorStop(1, 'rgba(30, 41, 59, 0)');
    this.ctx.fillStyle = lightGrad;
    this.ctx.fillRect(vanishX - 90, vanishY - 70, 180, 140);

    // Window frame
    this.ctx.strokeStyle = '#475569';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(vanishX - 35, vanishY - 45, 70, 90);
    this.ctx.beginPath();
    this.ctx.moveTo(vanishX, vanishY - 45);
    this.ctx.lineTo(vanishX, vanishY + 45);
    this.ctx.moveTo(vanishX - 35, vanishY);
    this.ctx.lineTo(vanishX + 35, vanishY);
    this.ctx.stroke();

    // Left Corridor Wall
    const leftWall = this.ctx.createLinearGradient(0, 0, w * 0.25, 0);
    leftWall.addColorStop(0, '#0f172a');
    leftWall.addColorStop(1, '#1e293b');
    this.ctx.fillStyle = leftWall;
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(vanishX - 80, vanishY - 60);
    this.ctx.lineTo(vanishX - 80, vanishY + 60);
    this.ctx.lineTo(0, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Right Corridor Wall
    const rightWall = this.ctx.createLinearGradient(w * 0.75, 0, w, 0);
    rightWall.addColorStop(0, '#1e293b');
    rightWall.addColorStop(1, '#0f172a');
    this.ctx.fillStyle = rightWall;
    this.ctx.beginPath();
    this.ctx.moveTo(w, 0);
    this.ctx.lineTo(vanishX + 80, vanishY - 60);
    this.ctx.lineTo(vanishX + 80, vanishY + 60);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Wall Perspective Lines & Door Moldings
    this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.4)';
    this.ctx.lineWidth = 1.5;
    // Left door line
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.12, h * 0.85);
    this.ctx.lineTo(w * 0.12, h * 0.25);
    this.ctx.lineTo(w * 0.22, h * 0.28);
    this.ctx.lineTo(w * 0.22, h * 0.75);
    this.ctx.stroke();

    // Signboard on left wall: "HÀNH LANG 1.5M"
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    this.ctx.strokeStyle = '#10b981';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(10, h * 0.38);
    this.ctx.lineTo(75, h * 0.39);
    this.ctx.lineTo(75, h * 0.46);
    this.ctx.lineTo(10, h * 0.44);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#39ff14';
    this.ctx.font = 'bold 9px "Segoe UI", sans-serif';
    this.ctx.fillText('HÀNH LANG 1.5M', 14, h * 0.42);
    this.ctx.restore();

    // Floor (Tiled corridor floor)
    const floorGrad = this.ctx.createLinearGradient(0, vanishY + 60, 0, h);
    floorGrad.addColorStop(0, '#1a2333');
    floorGrad.addColorStop(1, '#0b0f17');
    this.ctx.fillStyle = floorGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(0, h);
    this.ctx.lineTo(vanishX - 80, vanishY + 60);
    this.ctx.lineTo(vanishX + 80, vanishY + 60);
    this.ctx.lineTo(w, h);
    this.ctx.closePath();
    this.ctx.fill();

    // Floor tile perspective lines
    this.ctx.strokeStyle = 'rgba(51, 65, 85, 0.35)';
    this.ctx.lineWidth = 1;
    for (let x = -100; x <= w + 100; x += 55) {
      this.ctx.beginPath();
      this.ctx.moveTo(vanishX, vanishY + 60);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
  }

  drawShadow() {
    const x = this.char.x;
    const y = this.char.baseY + 22;
    const jump = this.char.jumpHeight;

    // Shadow gets smaller and lighter when jumping high
    const scale = Math.max(0.3, 1 - jump / 130);
    const alpha = Math.max(0.15, 0.45 - jump / 200);

    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.ellipse(x, y, 42 * scale, 12 * scale, 0, 0, Math.PI * 2);
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fill();
    this.ctx.restore();
  }

  drawThang() {
    this.ctx.save();
    const cx = this.char.x;
    const cy = this.char.y;
    const sq = this.char.squash;

    this.ctx.translate(cx, cy);
    this.ctx.scale(1 / Math.sqrt(sq), sq); // Squash & stretch around center

    // If Tripped/GameOver: Rotate slightly
    if (this.state === 'GAMEOVER') {
      this.ctx.rotate(0.18);
    }

    // Character dimensions
    const headRadius = 22;
    const bodyWidth = 38;
    const bodyHeight = 44;

    // 1. LEGS & SNEAKERS
    const legOffset = this.char.jumpHeight > 5 ? -6 : 0; // Tuck legs slightly in air
    this.ctx.fillStyle = '#1e293b'; // Athletic shorts
    this.ctx.fillRect(-18, 5, 36, 18);

    // Left leg
    this.ctx.fillStyle = '#f8b48f'; // Skin tone
    this.ctx.fillRect(-14, 23, 10, 16 + legOffset);
    // Left Shoe (Neon Green sneaker)
    this.ctx.fillStyle = '#39ff14';
    this.ctx.beginPath();
    this.ctx.roundRect(-17, 39 + legOffset, 15, 8, 3);
    this.ctx.fill();

    // Right leg
    this.ctx.fillStyle = '#f8b48f';
    this.ctx.fillRect(4, 23, 10, 16 + legOffset);
    // Right Shoe
    this.ctx.fillStyle = '#39ff14';
    this.ctx.beginPath();
    this.ctx.roundRect(2, 39 + legOffset, 15, 8, 3);
    this.ctx.fill();

    // 2. TORSO / T-SHIRT (Signature Lime Green / Neon Green)
    const shirtGrad = this.ctx.createLinearGradient(0, -bodyHeight, 0, 8);
    shirtGrad.addColorStop(0, '#5aff1a');
    shirtGrad.addColorStop(1, '#32d60a');
    this.ctx.fillStyle = shirtGrad;
    this.ctx.beginPath();
    this.ctx.roundRect(-bodyWidth / 2, -bodyHeight, bodyWidth, bodyHeight, [8, 8, 2, 2]);
    this.ctx.fill();

    // Lightning bolt sports icon on chest
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.moveTo(1, -28);
    this.ctx.lineTo(-7, -18);
    this.ctx.lineTo(-1, -18);
    this.ctx.lineTo(-4, -8);
    this.ctx.lineTo(6, -20);
    this.ctx.lineTo(0, -20);
    this.ctx.closePath();
    this.ctx.fill();

    // 3. ARMS & ROPE HANDLES
    // Arms positioned at hips, holding black handles
    this.ctx.fillStyle = '#f8b48f';
    // Left Arm
    this.ctx.beginPath();
    this.ctx.arc(-24, -14, 6, 0, Math.PI * 2);
    this.ctx.fill();
    // Left Handle (Black grip)
    this.ctx.fillStyle = '#111827';
    this.ctx.beginPath();
    this.ctx.roundRect(-27, -18, 6, 16, 2);
    this.ctx.fill();

    // Right Arm
    this.ctx.fillStyle = '#f8b48f';
    this.ctx.beginPath();
    this.ctx.arc(24, -14, 6, 0, Math.PI * 2);
    this.ctx.fill();
    // Right Handle
    this.ctx.fillStyle = '#111827';
    this.ctx.beginPath();
    this.ctx.roundRect(21, -18, 6, 16, 2);
    this.ctx.fill();

    // 4. NECK & HEAD
    this.ctx.fillStyle = '#e59d79'; // Neck shadow
    this.ctx.fillRect(-7, -bodyHeight - 5, 14, 8);

    // Head
    this.ctx.fillStyle = '#f8b48f';
    this.ctx.beginPath();
    this.ctx.arc(0, -bodyHeight - 20, headRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Modern Stylish Hair (Short black hair with texture)
    this.ctx.fillStyle = '#18181b';
    this.ctx.beginPath();
    this.ctx.arc(0, -bodyHeight - 25, headRadius + 2, Math.PI * 0.9, Math.PI * 2.1);
    this.ctx.lineTo(headRadius + 2, -bodyHeight - 20);
    this.ctx.lineTo(-headRadius - 2, -bodyHeight - 20);
    this.ctx.closePath();
    this.ctx.fill();

    // Spiky front tuft
    this.ctx.beginPath();
    this.ctx.moveTo(-10, -bodyHeight - 40);
    this.ctx.lineTo(0, -bodyHeight - 46);
    this.ctx.lineTo(8, -bodyHeight - 42);
    this.ctx.lineTo(14, -bodyHeight - 38);
    this.ctx.lineTo(-8, -bodyHeight - 38);
    this.ctx.closePath();
    this.ctx.fill();

    // 5. FACIAL EXPRESSION
    if (this.state === 'GAMEOVER') {
      // Tripped / Dizzy expression: 'X' eyes & sad mouth
      this.ctx.strokeStyle = '#18181b';
      this.ctx.lineWidth = 2.5;
      // Left X eye
      this.ctx.beginPath();
      this.ctx.moveTo(-11, -bodyHeight - 23);
      this.ctx.lineTo(-5, -bodyHeight - 17);
      this.ctx.moveTo(-5, -bodyHeight - 23);
      this.ctx.lineTo(-11, -bodyHeight - 17);
      this.ctx.stroke();
      // Right X eye
      this.ctx.beginPath();
      this.ctx.moveTo(5, -bodyHeight - 23);
      this.ctx.lineTo(11, -bodyHeight - 17);
      this.ctx.moveTo(11, -bodyHeight - 23);
      this.ctx.lineTo(5, -bodyHeight - 17);
      this.ctx.stroke();
      // O mouth
      this.ctx.beginPath();
      this.ctx.arc(0, -bodyHeight - 10, 5, 0, Math.PI * 2);
      this.ctx.stroke();

      // Spinning stars around head
      const now = performance.now() * 0.005;
      for (let s = 0; s < 3; s++) {
        const starAngle = now + (s * Math.PI * 2) / 3;
        const sx = Math.cos(starAngle) * 32;
        const sy = -bodyHeight - 42 + Math.sin(starAngle) * 9;
        this.ctx.fillStyle = '#facc15';
        this.ctx.font = '13px sans-serif';
        this.ctx.fillText('⭐', sx - 6, sy);
      }
    } else {
      // Friendly, energetic smile!
      // Eyes
      if (this.char.isBlinking) {
        // Blinking line
        this.ctx.strokeStyle = '#18181b';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(-10, -bodyHeight - 20);
        this.ctx.lineTo(-4, -bodyHeight - 20);
        this.ctx.moveTo(4, -bodyHeight - 20);
        this.ctx.lineTo(10, -bodyHeight - 20);
        this.ctx.stroke();
      } else {
        // Cheerful open eyes
        this.ctx.fillStyle = '#18181b';
        this.ctx.beginPath();
        this.ctx.arc(-7, -bodyHeight - 20, 2.8, 0, Math.PI * 2);
        this.ctx.arc(7, -bodyHeight - 20, 2.8, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye highlights
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(-8, -bodyHeight - 21, 1, 0, Math.PI * 2);
        this.ctx.arc(6, -bodyHeight - 21, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Rosy cheeks
      this.ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
      this.ctx.beginPath();
      this.ctx.arc(-12, -bodyHeight - 14, 4, 0, Math.PI * 2);
      this.ctx.arc(12, -bodyHeight - 14, 4, 0, Math.PI * 2);
      this.ctx.fill();

      // Broad friendly smile
      this.ctx.strokeStyle = '#18181b';
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(0, -bodyHeight - 15, 8, 0.2, Math.PI - 0.2);
      this.ctx.stroke();

      // White teeth
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(0, -bodyHeight - 15, 6, 0.2, Math.PI - 0.2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawRope() {
    const cx = this.char.x;
    const cy = this.char.baseY; // Center of rotation near hips
    const angle = this.rope.angle;

    // 3D Ellipse projection:
    // Vertical radius (height of loop above and below hands)
    const radiusY = 92;
    // Horizontal radius (width of loop around player)
    const radiusX = 60;

    // The apex/sweep of the rope in 3D:
    // sin(angle): height position (-1 is TOP, +1 is BOTTOM floor)
    // cos(angle): depth position (-1 is behind, +1 is front)
    const ropeY = cy - 20 + Math.sin(angle) * radiusY;
    const ropeZ = Math.cos(angle); // Depth (-1 to 1)

    // Handle anchor coordinates (held in Thắng's hands)
    const leftHandleX = cx - 25;
    const leftHandleY = this.char.y - 14;
    const rightHandleX = cx + 25;
    const rightHandleY = this.char.y - 14;

    this.ctx.save();

    // Rope color and thickness vary with depth to give genuine 3D feel
    const isFront = ropeZ >= 0;
    const lineWidth = isFront ? 3.8 : 2.4;
    const alpha = isFront ? 0.95 : 0.55;

    // Glowing Neon Yellow-Green rope
    this.ctx.strokeStyle = `rgba(57, 255, 20, ${alpha})`;
    this.ctx.lineWidth = lineWidth;
    this.ctx.lineCap = 'round';
    this.ctx.shadowColor = '#39ff14';
    this.ctx.shadowBlur = isFront ? 8 : 2;

    // Draw quadratic curve from left hand through rope bottom/top to right hand
    this.ctx.beginPath();
    this.ctx.moveTo(leftHandleX, leftHandleY);

    // Control points curve outward
    const ctrlSpread = radiusX * (1 + 0.2 * ropeZ);
    this.ctx.bezierCurveTo(
      cx - ctrlSpread,
      ropeY,
      cx + ctrlSpread,
      ropeY,
      rightHandleX,
      rightHandleY
    );
    this.ctx.stroke();

    // Light flash when rope strikes the floor
    if (Math.abs(angle - Math.PI / 2) < 0.2 && this.char.jumpHeight > 10) {
      this.ctx.fillStyle = 'rgba(57, 255, 20, 0.4)';
      this.ctx.beginPath();
      this.ctx.ellipse(cx, cy + radiusY - 18, 25, 4, 0, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.restore();
  }

  drawParticles() {
    this.ctx.save();
    for (const p of this.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
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
