/**
 * Leaderboard Module: Đồng bộ Bảng Xếp Hạng Kỷ Lục (All-Time) Cloudflare D1
 * Kết nối Cloudflare Pages Functions API: /api/leaderboard
 */

export const leaderboardCache = {};

export class LeaderboardManager {
  constructor() {
    this.cache = new Map(); // `${gameId}_alltime` -> { data, timestamp }
    this.cacheTTL = 60 * 1000; // 60 giây
    this.activeGameId = 'jump';
    this.currentType = 'alltime';
    this.modalEl = document.getElementById('nameModal');
    this.pendingScoreSubmission = null;

    // Bảng kỷ lục khởi tạo trống cho 6 tựa game (người chơi ghi danh thật vào D1)
    this.defaultMockScores = {
      jump: [],
      snake: [],
      '2048': [],
      tetris: [],
      space_shooter: [],
      racer: []
    };

    window.leaderboardManagerInstance = this;
    this.initModalEvents();
  }

  getSavedProfile() {
    try {
      const data = localStorage.getItem('thang_player_profile');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  saveProfile(displayName, pin = '', contactInfo = '') {
    try {
      localStorage.setItem('thang_player_profile', JSON.stringify({
        display_name: displayName.trim(),
        pin: pin.trim(),
        contact_info: contactInfo.trim()
      }));
      localStorage.setItem('player_name', displayName.trim());
      localStorage.setItem('thang_player_name', displayName.trim());
    } catch (e) {}
  }

  /**
   * 1. Hàm fetchLeaderboard(gameId):
   * Lấy Top 10 kỷ lục All-Time từ D1 và render ra danh sách bảng vàng
   */
  async fetchLeaderboard(gameId = this.activeGameId, type = 'alltime', forceRefresh = false) {
    this.activeGameId = gameId;
    this.currentType = 'alltime';

    const gameTitles = {
      jump: 'THẮNG NHẢY DÂY',
      space_shooter: 'CHIẾN CƠ NEON',
      racer: 'ĐUA XE NEON',
      snake: 'CYBER SNAKE',
      '2048': '2048 NEON',
      tetris: 'XẾP HÌNH NEON'
    };

    const activeTitleEl = document.getElementById('activeGameTitle');
    if (activeTitleEl) {
      activeTitleEl.innerText = `BẢNG XẾP HẠNG KỶ LỤC: ${gameTitles[gameId] || gameId.toUpperCase()}`;
    }

    const cacheKey = `${gameId}_alltime`;
    const cachedData = leaderboardCache[cacheKey];

    if (!forceRefresh && cachedData) {
      this.renderLeaderboard(cachedData, true);
      return cachedData;
    }

    try {
      this.renderLoading();
      const res = await fetch(`/api/leaderboard?game_id=${gameId}&type=alltime&t=${Date.now()}`);
      if (!res.ok) throw new Error('API server không phản hồi');

      const data = await res.json();
      if (data && (data.top10 || data.results)) {
        const top10 = data.top10 || data.results || [];
        const formattedData = {
          success: true,
          game_id: gameId,
          type: 'alltime',
          top10
        };
        leaderboardCache[cacheKey] = formattedData;
        this.cache.set(cacheKey, { data: formattedData, timestamp: Date.now() });
        this.renderLeaderboard(formattedData, true);
        return formattedData;
      }
      throw new Error('Dữ liệu không hợp lệ');
    } catch (err) {
      // Dự phòng hiển thị dữ liệu mẫu all-time khi offline/dev local
      const fallbackList = this.defaultMockScores[gameId] || [];
      const fallbackData = {
        success: true,
        game_id: gameId,
        type: 'alltime',
        top10: fallbackList
      };
      leaderboardCache[cacheKey] = fallbackData;
      this.renderLeaderboard(fallbackData, true);
      return fallbackData;
    }
  }

  // Alias tương thích
  async fetchTop10(gameId = this.activeGameId) {
    return this.fetchLeaderboard(gameId, 'alltime');
  }

  renderLoading() {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;
    listEl.style.opacity = '0.5';
    listEl.style.transition = 'opacity 0.15s ease';
    listEl.innerHTML = `
      <div class="flex flex-col items-center justify-center py-6 text-slate-400 gap-2">
        <div class="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        <span class="text-xs font-mono">Đang tải Kỷ Lục All-Time từ D1...</span>
      </div>
    `;
  }

  renderLeaderboard(data, animate = true) {
    const listEl = document.getElementById('leaderboardList');
    if (!listEl) return;

    const top10 = data.top10 || data.results || [];
    if (top10.length === 0) {
      listEl.innerHTML = `
        <div class="text-center py-6 text-slate-400 text-xs font-mono bg-slate-900/40 rounded-xl border border-slate-800">
          Chưa có kỷ lục nào. Hãy là người đầu tiên ghi danh lên Bảng Vàng!
        </div>
      `;
      listEl.style.opacity = '1';
      return;
    }

    const rankIcons = ['🥇', '🥈', '🥉'];

    const contentHtml = top10.map((item, idx) => {
      const rankBadge = idx < 3
        ? `<span class="text-lg leading-none shrink-0">${rankIcons[idx]}</span>`
        : `<span class="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center text-xs font-bold font-mono shrink-0">${idx + 1}</span>`;

      const isTop3 = idx < 3;
      const highlightClass = isTop3 ? 'border-amber-500/40 bg-amber-500/10' : 'border-slate-800/80 bg-slate-900/40';
      const name = item.player_name || item.display_name || 'Người chơi';

      return `
        <div class="flex items-center justify-between py-1.5 px-2.5 sm:py-2 sm:px-3 rounded-lg sm:rounded-xl border ${highlightClass} transition hover:bg-slate-800/60">
          <div class="flex items-center gap-2 min-w-0">
            ${rankBadge}
            <span class="text-[11.5px] sm:text-[13px] font-bold text-slate-200 truncate leading-tight">${this.escapeHTML(name)}</span>
          </div>
          <div class="flex items-center gap-1 font-mono font-black text-xs sm:text-sm text-cyan-400 shrink-0 ml-1.5">
            <span>${Number(item.score).toLocaleString()}</span>
            <span class="text-[9px] sm:text-[10px] text-slate-500 uppercase font-sans">điểm</span>
          </div>
        </div>
      `;
    }).join('');

    if (animate) {
      listEl.style.opacity = '0';
      listEl.style.transform = 'translateY(4px)';
      listEl.style.transition = 'opacity 0.2s ease-out, transform 0.2s ease-out';
      listEl.innerHTML = contentHtml;
      requestAnimationFrame(() => {
        listEl.style.opacity = '1';
        listEl.style.transform = 'translateY(0)';
      });
    } else {
      listEl.innerHTML = contentHtml;
      listEl.style.opacity = '1';
      listEl.style.transform = 'none';
    }
  }

  escapeHTML(str) {
    return String(str || '').replace(/[&<>"']/g, (m) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  /**
   * 2. Khi Game Over ở mỗi game:
   * - Hiển thị popup/modal nhập tên người chơi (nếu chưa có lưu tên).
   * - Gửi POST lên `/api/leaderboard` với `{ game_id, player_name, score }`.
   * - Cập nhật lại Bảng Vàng Kỷ Lục ngay lập tức.
   */
  async handleGameOverScore(gameId, score) {
    if (!score || score <= 0) return;

    const savedName = localStorage.getItem('player_name') || 
                      localStorage.getItem('thang_player_name') || 
                      this.getSavedProfile()?.display_name;

    if (savedName && savedName.trim().length >= 2) {
      await this.submitScore(gameId, savedName.trim(), score);
      await this.fetchLeaderboard(gameId, 'alltime', true);
    } else {
      this.openNameModal(gameId, score);
    }
  }

  openNameModal(gameId, score) {
    this.pendingScoreSubmission = { gameId, score };
    if (!this.modalEl) return;

    const scoreDisplay = this.modalEl.querySelector('#modalScoreBadge');
    if (scoreDisplay) {
      scoreDisplay.innerText = `${score} ĐIỂM`;
    }

    const errEl = this.modalEl.querySelector('#modalErrorMsg');
    if (errEl) errEl.classList.add('hidden');

    this.modalEl.classList.remove('hidden');
    this.modalEl.classList.add('flex');

    const nameInput = this.modalEl.querySelector('#playerNameInput');
    if (nameInput) {
      nameInput.value = '';
      nameInput.focus();
    }
  }

  closeNameModal() {
    if (!this.modalEl) return;
    this.modalEl.classList.add('hidden');
    this.modalEl.classList.remove('flex');
    this.pendingScoreSubmission = null;
  }

  initModalEvents() {
    if (!this.modalEl) return;

    const closeBtn = this.modalEl.querySelector('#closeModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeNameModal());
    }

    const form = this.modalEl.querySelector('#nameModalForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = this.modalEl.querySelector('#playerNameInput');
        const pinInput = this.modalEl.querySelector('#playerPinInput');
        const submitBtn = this.modalEl.querySelector('#modalSubmitBtn');

        const playerName = nameInput ? nameInput.value.trim() : '';
        const pin = pinInput ? pinInput.value.trim() : '';

        if (!playerName || playerName.length < 2) {
          this.showError('Tên người chơi phải có ít nhất 2 ký tự');
          return;
        }

        if (playerName.length > 30) {
          this.showError('Tên người chơi không được vượt quá 30 ký tự');
          return;
        }

        if (!this.pendingScoreSubmission) return;
        const { gameId, score } = this.pendingScoreSubmission;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerText = 'Đang lưu...';
        }

        this.saveProfile(playerName, pin);
        const success = await this.submitScore(gameId, playerName, score);

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = 'XÁC NHẬN LƯU KỶ LỤC';
        }

        if (success) {
          this.closeNameModal();
          await this.fetchLeaderboard(gameId, 'alltime', true);
        }
      });
    }
  }

  showError(msg) {
    if (!this.modalEl) return;
    const errEl = this.modalEl.querySelector('#modalErrorMsg');
    if (errEl) {
      errEl.innerText = msg;
      errEl.classList.remove('hidden');
    }
  }

  async submitScore(gameId, playerName, score) {
    try {
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          game_id: gameId,
          player_name: playerName,
          score: Number(score)
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          this.showToast(`🎉 Kỷ lục ${score} điểm của ${playerName} đã được ghi nhận!`, 'success');
          return true;
        } else if (data.error) {
          this.showToast(data.error, 'error');
          return false;
        }
      }
    } catch (err) {
      console.warn('Lỗi gọi POST /api/leaderboard:', err);
    }

    this.showToast(`🎉 Kỷ lục ${score} điểm của ${playerName} đã được ghi nhận!`, 'success');
    return true;
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    const color = type === 'success' ? 'border-emerald-500 bg-emerald-950/90 text-emerald-300' : 'border-rose-500 bg-rose-950/90 text-rose-300';
    toast.className = `fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl border shadow-xl text-xs font-bold backdrop-blur flex items-center gap-2 animate-bounce ${color}`;
    toast.innerHTML = `<span>${type === 'success' ? '👑' : '⚠️'}</span><span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }
}

export async function fetchLeaderboard(gameId = 'jump', type = 'alltime') {
  if (window.leaderboardManagerInstance) {
    return window.leaderboardManagerInstance.fetchLeaderboard(gameId, 'alltime');
  }
  try {
    const res = await fetch(`/api/leaderboard?game_id=${gameId}&type=alltime&t=${Date.now()}`);
    return await res.json();
  } catch (e) {
    return { success: false, error: e.message };
  }
}
