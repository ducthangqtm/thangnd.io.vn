// Game 3: 2048 Retro Neon
// 100% Vanilla JS + Mobile Touch Swipe

class Game2048 {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.size = 4;
    this.grid = [];
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('2048_high_score') || '0', 10);
    this.over = false;

    this.initTouch();
    this.initKeyboard();
    this.restart();
  }

  restart() {
    this.grid = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
    this.score = 0;
    this.over = false;
    this.addRandomTile();
    this.addRandomTile();
    this.render();
  }

  addRandomTile() {
    const emptyCells = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const { r, c } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
      this.grid[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
  }

  initKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (document.getElementById('game2048Section').classList.contains('hidden')) return;

      if (['ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); this.move('UP'); }
      else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); this.move('DOWN'); }
      else if (['ArrowLeft', 'KeyA'].includes(e.code)) { e.preventDefault(); this.move('LEFT'); }
      else if (['ArrowRight', 'KeyD'].includes(e.code)) { e.preventDefault(); this.move('RIGHT'); }
    });
  }

  initTouch() {
    let startX = 0, startY = 0;
    this.container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    this.container.addEventListener('touchend', (e) => {
      if (document.getElementById('game2048Section').classList.contains('hidden')) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) > 25) {
        if (absDx > absDy) {
          this.move(dx > 0 ? 'RIGHT' : 'LEFT');
        } else {
          this.move(dy > 0 ? 'DOWN' : 'UP');
        }
      }
    }, { passive: true });
  }

  move(dir) {
    if (this.over) return;
    let moved = false;

    const slideRow = (row) => {
      let arr = row.filter(val => val !== 0);
      for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] === arr[i + 1]) {
          arr[i] *= 2;
          this.score += arr[i];
          arr.splice(i + 1, 1);
          window.soundEngine.playScore();
        }
      }
      while (arr.length < this.size) arr.push(0);
      return arr;
    };

    const prevGrid = JSON.stringify(this.grid);

    if (dir === 'LEFT') {
      for (let r = 0; r < this.size; r++) this.grid[r] = slideRow(this.grid[r]);
    } else if (dir === 'RIGHT') {
      for (let r = 0; r < this.size; r++) this.grid[r] = slideRow(this.grid[r].reverse()).reverse();
    } else if (dir === 'UP') {
      for (let c = 0; c < this.size; c++) {
        let col = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
        col = slideRow(col);
        for (let r = 0; r < this.size; r++) this.grid[r][c] = col[r];
      }
    } else if (dir === 'DOWN') {
      for (let c = 0; c < this.size; c++) {
        let col = [this.grid[3][c], this.grid[2][c], this.grid[1][c], this.grid[0][c]];
        col = slideRow(col);
        for (let r = 0; r < this.size; r++) this.grid[3 - r][c] = col[r];
      }
    }

    if (JSON.stringify(this.grid) !== prevGrid) {
      this.addRandomTile();
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('2048_high_score', this.highScore);
      }
      this.checkGameOver();
      this.render();
    }
  }

  checkGameOver() {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return;
        if (r < this.size - 1 && this.grid[r][c] === this.grid[r + 1][c]) return;
        if (c < this.size - 1 && this.grid[r][c] === this.grid[r][c + 1]) return;
      }
    }
    this.over = true;
    window.soundEngine.playTrip();

    // Submit score to Cloudflare D1 Leaderboard
    if (window.leaderboard && this.score > 0) {
      window.leaderboard.submitScore('2048', this.score);
    }
  }

  render() {
    this.container.innerHTML = '';
    const scoreEl = document.getElementById('score2048');
    const highEl = document.getElementById('high2048');
    if (scoreEl) scoreEl.innerText = this.score;
    if (highEl) highEl.innerText = this.highScore;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const cell = document.createElement('div');
        cell.className = `cell tile-${val} flex items-center justify-center font-black rounded-lg transition-transform text-lg select-none`;
        cell.innerText = val > 0 ? val : '';
        this.container.appendChild(cell);
      }
    }

    if (this.over) {
      const overOverlay = document.createElement('div');
      overOverlay.className = 'absolute inset-0 bg-black/80 flex flex-col items-center justify-center rounded-xl z-20';
      overOverlay.innerHTML = `
        <div class="text-rose-500 font-black text-2xl mb-2">HẾT NƯỚC ĐI!</div>
        <div class="text-slate-300 text-sm mb-4">Điểm: <span class="font-bold text-emerald-400">${this.score}</span></div>
        <button onclick="window.game2048.restart()" class="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-sm">Chơi Lại</button>
      `;
      this.container.appendChild(overOverlay);
    }
  }
}

window.Game2048 = Game2048;
