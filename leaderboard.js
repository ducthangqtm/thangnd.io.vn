// Cloudflare D1 Leaderboard Client with LocalStorage Fallback

class LeaderboardManager {
  constructor() {
    this.apiBase = '/api/leaderboard';
    this.cachedScores = [];
    this.defaultScores = [
      { name: 'Thắng (Kỷ lục gia)', score: 128, date: '2026-09-08' },
      { name: 'DoubleUnder_Pro', score: 85, date: '2026-09-08' },
      { name: 'Nam Nhảy Dây', score: 64, date: '2026-09-07' },
      { name: 'Lan Fitness', score: 48, date: '2026-09-07' },
      { name: 'VĐV Hành Lang 1m5', score: 32, date: '2026-09-06' }
    ];
  }

  async fetchTopScores() {
    try {
      const response = await fetch(this.apiBase, { method: 'GET' });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          this.cachedScores = data;
          return data;
        }
      }
    } catch (err) {
      // Local or static environment fallback
    }

    // Fallback to local stored scores
    const local = localStorage.getItem('thang_leaderboard_data');
    if (local) {
      try {
        this.cachedScores = JSON.parse(local);
        return this.cachedScores;
      } catch (e) {}
    }

    this.cachedScores = this.defaultScores;
    return this.cachedScores;
  }

  async submitScore(name, score) {
    if (!name || score <= 0) return;

    // 1. Try sending to Cloudflare D1
    try {
      await fetch(this.apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, score })
      });
    } catch (e) {
      // Offline / Static fallback
    }

    // 2. Also save to local leaderboard storage
    let list = this.cachedScores.slice();
    list.push({ name, score, date: new Date().toISOString().split('T')[0] });
    list.sort((a, b) => b.score - a.score);
    list = list.slice(0, 10); // Keep top 10

    this.cachedScores = list;
    localStorage.setItem('thang_leaderboard_data', JSON.stringify(list));
    this.renderLeaderboardTable();
  }

  async renderLeaderboardTable() {
    const list = await this.fetchTopScores();
    const container = document.getElementById('leaderboardList');
    if (!container) return;

    container.innerHTML = list.map((item, index) => {
      let medal = `#${index + 1}`;
      if (index === 0) medal = '🥇 1st';
      if (index === 1) medal = '🥈 2nd';
      if (index === 2) medal = '🥉 3rd';

      return `
        <div class="flex items-center justify-between py-2 px-3 rounded-lg ${index === 0 ? 'bg-emerald-950/60 border border-emerald-500/30' : 'bg-slate-800/40'} text-sm">
          <div class="flex items-center space-x-2">
            <span class="font-bold text-xs w-12 text-slate-400">${medal}</span>
            <span class="font-semibold text-slate-200">${escapeHtml(item.name)}</span>
          </div>
          <span class="font-bold text-emerald-400">${item.score} cái</span>
        </div>
      `;
    }).join('');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

window.leaderboard = new LeaderboardManager();
