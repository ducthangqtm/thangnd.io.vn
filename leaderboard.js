// Cloudflare D1 Multi-Game Leaderboard Client
// Pure real-time data: Clean empty-state ready for real players to compete for Top 1!

class LeaderboardManager {
  constructor() {
    this.apiBase = '/api/leaderboard';
    this.activeGame = 'rope';
    this.playerId = this.initPlayerId();
    this.purgeLegacyMockCache();
  }

  purgeLegacyMockCache() {
    // Clean up any legacy mock data stored during development
    ['rope', 'snake', '2048'].forEach(g => {
      const item = localStorage.getItem(`thang_lb_${g}`);
      if (item && (item.includes('DoubleUnder_Pro') || item.includes('CyberCobra') || item.includes('TileSwiper'))) {
        localStorage.removeItem(`thang_lb_${g}`);
      }
    });
    localStorage.removeItem('thang_leaderboard_data');
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
        if (Array.isArray(data)) {
          localStorage.setItem(`thang_lb_${game}`, JSON.stringify(data));
          return data;
        }
      }
    } catch (err) {
      // Offline / network fallback
    }

    // Fallback to local cached scores
    const local = localStorage.getItem(`thang_lb_${game}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }

    return [];
  }

  async submitScore(gameOrName, score, maybeName) {
    let game = 'rope';
    let finalScore = 0;
    let name = this.getPlayerName();

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
    if (!Array.isArray(list)) list = [];

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

    // 3. Re-render if viewing this game
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

    if (!list || list.length === 0) {
      container.innerHTML = `
        <div class="text-center py-3.5 sm:py-5 px-3 rounded-xl bg-slate-800/30 border border-dashed border-slate-700/60 font-sans">
          <div class="text-xl sm:text-2xl mb-1 animate-bounce">👑</div>
          <div class="text-xs font-bold text-slate-200 mb-0.5">Chưa có kỷ lục nào!</div>
          <div class="text-[10px] sm:text-[11px] text-emerald-400 font-semibold">Chơi ngay để chiếm ngôi Quán quân Top 1! 🚀</div>
        </div>
      `;
      return;
    }

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
        <div class="flex items-center justify-between py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-lg sm:rounded-xl ${rowStyle} text-xs sm:text-sm transition hover:border-emerald-500/30">
          <div class="flex items-center space-x-2 min-w-0">
            <span class="text-[11px] sm:text-xs w-11 sm:w-12 shrink-0 ${textBadge}">${medal}</span>
            <span class="font-semibold text-slate-200 truncate max-w-[140px] sm:max-w-[240px]">${escapeHtml(item.name)}</span>
          </div>
          <span class="font-bold text-[11px] sm:text-xs shrink-0 ${scoreColor}">${item.score} ${unit}</span>
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
