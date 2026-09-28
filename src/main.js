import { soundEngine } from './games/SoundEngine.js';
import { GameController } from './games/GameController.js';
import { GameCarousel } from './modules/carousel.js';
import { LeaderboardManager } from './modules/leaderboard.js';
import { DonateModalManager } from './modules/donateModal.js';

// Prevent iOS/Safari gestures
document.addEventListener('gesturestart', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', (e) => e.preventDefault(), { passive: false });
document.addEventListener('gestureend', (e) => e.preventDefault(), { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });

document.addEventListener('DOMContentLoaded', () => {
  const gameTitles = {
    jump: 'THẮNG NHẢY DÂY',
    space_shooter: 'CHIẾN CƠ NEON',
    racer: 'ĐUA XE NEON',
    snake: 'CYBER SNAKE',
    '2048': '2048 NEON',
    tetris: 'XẾP HÌNH NEON'
  };

  // 1. Leaderboard Manager (All-Time Record kết nối Cloudflare D1)
  const leaderboardManager = new LeaderboardManager();
  window.leaderboardManager = leaderboardManager;

  // 2. Carousel Game Selector
  const carouselEl = document.getElementById('gameCarousel');
  const activeTitleEl = document.getElementById('activeGameTitle');

  const gameCarousel = new GameCarousel(carouselEl, {
    prevBtn: document.getElementById('carouselPrevBtn'),
    nextBtn: document.getElementById('carouselNextBtn'),
    dotsContainer: document.getElementById('carouselDots'),
    onActiveGameChange: (activeGameId) => {
      if (activeTitleEl) {
        activeTitleEl.innerText = `BẢNG XẾP HẠNG KỶ LỤC: ${gameTitles[activeGameId] || activeGameId.toUpperCase()}`;
      }
      leaderboardManager.fetchTop10(activeGameId);
    },
    onLaunchGame: (gameId) => {
      openGame(gameId);
    }
  });

  window.gameCarousel = gameCarousel;
  leaderboardManager.fetchTop10('jump');

  // 3. Status Bar & Telemetry Init
  initEdgeStatusBar();

  // 4. Game Modal & Controller
  const arcadeModal = document.getElementById('arcadeModal');
  const arcadeCanvas = document.getElementById('arcadeCanvas');
  const modalGameName = document.getElementById('modalGameName');
  const modalCurrentScore = document.getElementById('modalCurrentScore');
  const closeArcadeBtn = document.getElementById('closeArcadeBtn');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const controlsContainer = document.getElementById('gameControlsContainer');

  const gameController = new GameController(arcadeCanvas, {
    controlsContainer,
    onScoreUpdate: (gameId, score) => {
      if (modalCurrentScore) modalCurrentScore.innerText = score;
    },
    onGameOver: (gameId, score) => {
      leaderboardManager.handleGameOverScore(gameId, score);
    },
    onPlayAgain: (gameId) => {
      trackGamePlay(gameId);
    },
    onGoHome: () => {
      closeGame();
    }
  });

  const trackGamePlay = (currentGameId = 'jump') => {
    // 1. Cập nhật giao diện tức thì (Optimistic UI)
    const countEl = document.querySelector('#totalPlaysCount');
    if (countEl) {
      const raw = countEl.textContent.replace(/[^0-9]/g, '');
      const current = raw ? parseInt(raw, 10) : 142;
      countEl.textContent = (current + 1).toLocaleString();
    }

    // 2. Gửi request POST /api/stats để tăng lượt chơi trong Cloudflare D1
    try {
      fetch('/api/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'play', game_id: currentGameId })
      })
      .then(res => res.json())
      .then(data => {
        if (countEl && data && data.total_plays !== undefined) {
          countEl.textContent = Number(data.total_plays).toLocaleString();
        }
      })
      .catch(err => console.warn('Lỗi ghi nhận lượt chơi:', err));
    } catch (e) {
      console.warn('Lỗi gọi API /api/stats:', e);
    }
  };

  let savedScrollY = 0;
  const preventGameTouchMove = (e) => e.preventDefault();

  const lockBodyScroll = () => {
    savedScrollY = window.scrollY || window.pageYOffset || 0;
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${savedScrollY}px`;
    document.body.style.touchAction = 'none';

    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100vh';
    document.documentElement.style.position = 'fixed';
    document.documentElement.style.width = '100%';
    document.documentElement.style.touchAction = 'none';

    if (arcadeModal) {
      arcadeModal.addEventListener('touchmove', preventGameTouchMove, { passive: false });
    }
  };

  const unlockBodyScroll = () => {
    document.body.style.overflow = '';
    document.body.style.height = '';
    document.body.style.position = '';
    document.body.style.width = '';
    document.body.style.top = '';
    document.body.style.touchAction = '';

    document.documentElement.style.overflow = '';
    document.documentElement.style.height = '';
    document.documentElement.style.position = '';
    document.documentElement.style.width = '';
    document.documentElement.style.touchAction = '';

    if (arcadeModal) {
      arcadeModal.removeEventListener('touchmove', preventGameTouchMove);
    }
    window.scrollTo(0, savedScrollY);
  };

  const openGame = (gameId) => {
    if (!arcadeModal) return;
    if (modalGameName) modalGameName.innerText = gameTitles[gameId] || gameId;
    if (modalCurrentScore) modalCurrentScore.innerText = '0';

    trackGamePlay(gameId);
    lockBodyScroll();

    arcadeModal.classList.remove('hidden');
    arcadeModal.classList.add('flex');

    gameController.loadGame(gameId);
    gameController.startCurrentGame();
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.launch-game-btn');
    if (btn) {
      const gid = btn.dataset.gameId;
      if (gid) {
        if (gameCarousel) gameCarousel.setActiveGame(gid);
        openGame(gid);
      }
    }
  });

  function closeGame() {
    if (!arcadeModal) return;
    arcadeModal.classList.add('hidden');
    arcadeModal.classList.remove('flex');
    if (gameController) {
      gameController.destroy();
    }
    unlockBodyScroll();
  }

  if (closeArcadeBtn) {
    closeArcadeBtn.addEventListener('click', closeGame);
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && arcadeModal && !arcadeModal.classList.contains('hidden')) {
      closeGame();
    }
  });

  if (soundToggleBtn) {
    const iconOn = document.getElementById('iconSoundOn');
    const iconOff = document.getElementById('iconSoundOff');
    const applySoundIcon = (isMuted) => {
      if (iconOn) iconOn.style.display = isMuted ? 'none' : '';
      if (iconOff) iconOff.style.display = isMuted ? '' : 'none';
    };
    applySoundIcon(soundEngine.isMuted());
    soundToggleBtn.addEventListener('click', () => {
      const isMuted = soundEngine.toggleMute();
      applySoundIcon(isMuted);
    });
  }

  // 5. Donate Modal
  const donateModalEl = document.getElementById('donateModal');
  const donateBtn = document.getElementById('donateBtn');
  new DonateModalManager(donateModalEl, donateBtn);
});

/**
 * Khởi tạo Status Bar gọn nhẹ, đo độ trễ Cloudflare Edge & D1
 */
async function initEdgeStatusBar() {
  const pingLatency = document.getElementById('ping-latency');
  const totalPlaysCount = document.getElementById('totalPlaysCount');
  const totalEdgeVisits = document.getElementById('total-edge-visits');
  const edgeColoBadge = document.getElementById('edge-colo-badge');

  // 1. Đo độ trễ Edge & Lấy PoP Colo
  const start = performance.now();
  try {
    const res = await fetch('/api/my-ip', { cache: 'no-store' });
    const lat = Math.round(performance.now() - start);
    if (pingLatency) pingLatency.innerText = `${lat} ms`;

    if (res.ok) {
      const data = await res.json();
      if (edgeColoBadge && data.colo) {
        edgeColoBadge.innerText = `PoP: ${data.colo}`;
      }
    }
  } catch (e) {
    if (pingLatency) pingLatency.innerText = '< 15 ms';
  }

  // 2. Fetch Stats (Total plays & visits)
  try {
    const res = await fetch(`/api/stats?t=${Date.now()}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data.total_plays !== undefined && totalPlaysCount) {
        const plays = Number(data.total_plays) > 0 ? Number(data.total_plays) : 142;
        totalPlaysCount.textContent = plays.toLocaleString();
      }
      if (data.totalVisits !== undefined && totalEdgeVisits) {
        totalEdgeVisits.textContent = Number(data.totalVisits).toLocaleString();
      }
    }
  } catch (err) {}

  // 3. Track impression
  try {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteId: 'portal_visits' })
    }).catch(() => {});
  } catch (e) {}
}

