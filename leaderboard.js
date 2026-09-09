// Cloudflare D1 Multi-Game Leaderboard Client with LocalStorage Fallback & Unique Player ID

class LeaderboardManager {
  constructor() {
    this.apiBase = '/api/leaderboard';
    this.activeGame = 'rope';
    this.playerId = this.initPlayerId();
    this.defaultMocks = {
      rope: [
        { name: 'Thắng (Kỷ lục gia)', score: 128, date: '2026-09-08' },
        { name: 'DoubleUnder_Pro', score: 85, date: '2026-09-08' },
        { name: 'Nam Nhảy Dây', score: 64, date: '2026-09-07' },
        { name: 'Lan Fitness', score: 48, date: '2026-09-07' },
        { name: 'VĐV Hành Lang 1m5', score: 32, date: '2026-09-06' }
      ],
      snake: [
        { name: 'Thắng Viper', score: 280, date: '2026-09-08' },
        { name: 'CyberCobra', score: 190, date: '2026-09-08' },
        { name: 'RetroGamer', score: 140, date: '2026-09-07' },
        { name: 'NeonHunter', score: 90, date: '2026-09-07' },
        { name: 'PixelSnake', score: 60, date: '2026-09-06' }
      ],
      '2048': [
        { name: 'Thắng Master', score: 4096, date: '2026-09-08' },
        { name: 'NeonGrid', score: 2048, date: '2026-09-08' },
        { name: 'TileSwiper', score: 1536, date: '2026-09-07' },
        { name: 'Logitech2048', score: 1024, date: '2026-09-07' },
        { name: 'CubeMath', score: 512, date: '2026-09-06' }
      ]
    };
  }

  initPlayerId() {
    let pid = localStorage.getItem('thang_arcade_player_id');
    if (!pid) {
      pid = 'player_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      localStorage.setItem('thang_arcade_player_id', pid);
    }
    return pid;
  }

  getPlayerId() {
    return this.playerId;
  }

  getPlayerName() {
    return localStorage.getItem('thang_player_name') || 'VĐV Hành Lang';
  }

  async setPlayerName(name) {
    if (!name || !name.trim()) return;
    const cleanName = name.trim().slice(0, 30);
    localStorage.setItem('thang_player_name', cleanName);

    // Notify backend to update name across all leaderboards for this player
    try {
      await fetch(this.apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_name',
          player_id: this.playerId,
          name: cleanName
        })
      });
    } catch (e) {
      // Local fallback
    }

    // Refresh current leaderboard table
    this.renderLeaderboardTable(this.activeGame);
  }

  async fetchTopScores(game = this.activeGame) {
    try {
      const response = await fetch(`${this.apiBase}?game=${encodeURIComponent(game)}`, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          localStorage.setItem(`thang_lb_${game}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      // Offline / Static fallback
    }

    // Fallback to local cached scores
    const local = localStorage.getItem(`thang_lb_${game}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }

    return this.defaultMocks[game] || this.defaultMocks.rope;
  }

  async submitScore(gameOrName, score, maybeName) {
    let game = 'rope';
    let finalScore = 0;
    let name = this.getPlayerName();

    // Determine parameters signature:
    // Pattern 1: submitScore('snake', 280, 'Thắng') or submitScore('snake', 280)
    // Pattern 2: submitScore('Thắng', 128) [legacy rope call]
    if (typeof gameOrName === 'string' && ['rope', 'snake', '2048'].includes(gameOrName.toLowerCase())) {
      game = gameOrName.toLowerCase();
      finalScore = parseInt(score, 10);
      if (maybeName) name = String(maybeName).trim();
    } else if (typeof score === 'number' || !isNaN(parseInt(score, 10))) {
      name = String(gameOrName || this.getPlayerName()).trim();
      finalScore = parseInt(score, 10);
      if (maybeName && typeof maybeName === 'string') game = maybeName.toLowerCase();
    }

    if (isNaN(finalScore) || finalScore <= 0) return;

    // 1. Send to Cloudflare D1
    try {
      await fetch(this.apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_id: this.playerId,
          game: game,
          name: name,
          score: finalScore
        })
      });
    } catch (e) {
      // Offline fallback
    }

    // 2. Update local storage cache (Best score per player)
    let list = [];
    const local = localStorage.getItem(`thang_lb_${game}`);
    if (local) {
      try { list = JSON.parse(local); } catch (e) {}
    }
    if (!list || !list.length) {
      list = (this.defaultMocks[game] || this.defaultMocks.rope).slice();
    }

    // Upsert player's best score in local list
    const existingIdx = list.findIndex(item => item.name === name);
    if (existingIdx !== -1) {
      if (finalScore > list[existingIdx].score) {
        list[existingIdx].score = finalScore;
        list[existingIdx].date = new Date().toISOString().split('T')[0];
      }
    } else {
      list.push({ name, score: finalScore, date: new Date().toISOString().split('T')[0] });
    }

    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10);
    localStorage.setItem(`thang_lb_${game}`, JSON.stringify(list));

    // 3. If currently viewing this game's leaderboard, re-render
    if (this.activeGame === game) {
      this.renderLeaderboardTable(game);
    }
  }

  getUnitForGame(game) {
    switch (game) {
      case 'rope': return 'cái';
      case 'snake': return 'điểm';
      case '2048': return 'điểm';
      default: return 'điểm';
    }
  }

  async renderLeaderboardTable(game = this.activeGame) {
    this.activeGame = game;
    const container = document.getElementById('leaderboardList');
    if (!container) return;

    const list = await this.fetchTopScores(game);
    const unit = this.getUnitForGame(game);

    container.innerHTML = list.map((item, index) => {
      let medal = `#${index + 1}`;
      let rowStyle = 'bg-slate-800/40 border border-slate-800/60';
      let textBadge = 'text-slate-400';
      let scoreColor = 'text-emerald-400';

      if (index === 0) {
        medal = '🥇 1st';
        rowStyle = 'bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/40 shadow-sm';
        textBadge = 'text-amber-300 font-extrabold';
        scoreColor = 'text-amber-300 font-black';
      } else if (index === 1) {
        medal = '🥈 2nd';
        rowStyle = 'bg-slate-800/60 border border-slate-600/40';
        textBadge = 'text-slate-300 font-bold';
      } else if (index === 2) {
        medal = '🥉 3rd';
        rowStyle = 'bg-slate-800/50 border border-amber-700/30';
        textBadge = 'text-amber-600 font-bold';
      }

      return `
        <div class="flex items-center justify-between py-2 px-3 rounded-xl ${rowStyle} text-sm transition hover:border-emerald-500/30">
          <div class="flex items-center space-x-2.5 min-w-0">
            <span class="text-xs w-12 shrink-0 ${textBadge}">${medal}</span>
            <span class="font-semibold text-slate-200 truncate max-w-[170px] sm:max-w-[240px]">${escapeHtml(item.name)}</span>
          </div>
          <span class="font-bold text-xs shrink-0 ${scoreColor}">${item.score} ${unit}</span>
        </div>
      `;
    }).join('');
  }

  initTabs() {
    const tabs = document.querySelectorAll('.lb-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.stopPropagation();
        const game = tab.dataset.game;
        if (!game) return;

        tabs.forEach(t => {
          t.classList.remove('active', 'text-emerald-400', 'bg-slate-800/90', 'border-emerald-500/40');
          t.classList.add('text-slate-400');
        });
        tab.classList.add('active', 'text-emerald-400', 'bg-slate-800/90', 'border-emerald-500/40');
        tab.classList.remove('text-slate-400');

        this.renderLeaderboardTable(game);
      });
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.leaderboard = new LeaderboardManager();
