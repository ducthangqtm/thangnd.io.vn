import { defineConfig } from 'vite';

// In-memory mock store cho môi trường local development (tránh lỗi 404 khi test host ip)
const localMockScores = {
  jump: [
    { rank: 1, player_name: "Thắng Nhảy Dây", display_name: "Thắng Nhảy Dây", score: 128, created_at: "2026-09-01" },
    { rank: 2, player_name: "Pro_Skipper", display_name: "Pro_Skipper", score: 105, created_at: "2026-09-05" },
    { rank: 3, player_name: "SpeedHop", display_name: "SpeedHop", score: 88, created_at: "2026-09-10" },
    { rank: 4, player_name: "HànhLangMaster", display_name: "HànhLangMaster", score: 72, created_at: "2026-09-12" },
    { rank: 5, player_name: "MinhNhảy", display_name: "MinhNhảy", score: 65, created_at: "2026-09-15" }
  ],
  snake: [
    { rank: 1, player_name: "CyberViper", display_name: "CyberViper", score: 680, created_at: "2026-09-01" },
    { rank: 2, player_name: "NeonSnake", display_name: "NeonSnake", score: 540, created_at: "2026-09-05" },
    { rank: 3, player_name: "Thắng Nhảy Dây", display_name: "Thắng Nhảy Dây", score: 420, created_at: "2026-09-10" }
  ],
  '2048': [
    { rank: 1, player_name: "NeonMaster", display_name: "NeonMaster", score: 16384, created_at: "2026-09-01" },
    { rank: 2, player_name: "QuickMerge", display_name: "QuickMerge", score: 8192, created_at: "2026-09-05" },
    { rank: 3, player_name: "Thắng Nhảy Dây", display_name: "Thắng Nhảy Dây", score: 4096, created_at: "2026-09-10" }
  ],
  tetris: [
    { rank: 1, player_name: "BlockKing", display_name: "BlockKing", score: 9800, created_at: "2026-09-01" },
    { rank: 2, player_name: "TetrisPro", display_name: "TetrisPro", score: 8400, created_at: "2026-09-05" },
    { rank: 3, player_name: "Thắng Nhảy Dây", display_name: "Thắng Nhảy Dây", score: 6500, created_at: "2026-09-10" }
  ],
  space_shooter: [
    { rank: 1, player_name: "AcePilot_VN", display_name: "AcePilot_VN", score: 3250, created_at: "2026-09-12" },
    { rank: 2, player_name: "CosmicLegend", display_name: "CosmicLegend", score: 2680, created_at: "2026-09-14" },
    { rank: 3, player_name: "Thắng Nhảy Dây", display_name: "Thắng Nhảy Dây", score: 1980, created_at: "2026-09-16" }
  ],
  racer: [
    { rank: 1, player_name: "OutrunKing", display_name: "OutrunKing", score: 3850, created_at: "2026-09-12" },
    { rank: 2, player_name: "SpeedDemon", display_name: "SpeedDemon", score: 3100, created_at: "2026-09-14" },
    { rank: 3, player_name: "Thắng Nhảy Dây", display_name: "Thắng Nhảy Dây", score: 2450, created_at: "2026-09-16" }
  ]
};

let localTotalPlays = 142;
let localTotalVisits = 1050;

function localApiDevPlugin() {
  return {
    name: 'local-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!req.url.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:5173');
        const pathname = url.pathname;

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          return res.end();
        }

        // 1. /api/my-ip
        if (pathname === '/api/my-ip' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          const clientIp = req.socket.remoteAddress || '127.0.0.1';
          return res.end(JSON.stringify({
            ip: clientIp.replace(/^.*:/, '') || '172.16.1.59',
            country: 'VN',
            city: 'Hanoi',
            region: 'HN',
            asn: 7552,
            asOrganization: 'Viettel Telecom',
            colo: 'HAN',
            timestamp: new Date().toISOString()
          }));
        }

        // 2. /api/stats
        if (pathname === '/api/stats') {
          res.setHeader('Content-Type', 'application/json');
          if (req.method === 'POST') {
            localTotalPlays += 1;
            return res.end(JSON.stringify({ success: true, total_plays: localTotalPlays }));
          }
          return res.end(JSON.stringify({
            success: true,
            total_plays: localTotalPlays,
            totalVisits: localTotalVisits,
            data: [
              { id: 'portal_visits', name: 'Trang chủ Arcade Portal', visits: localTotalVisits },
              { id: 'arcade_plays', name: 'Lượt chơi Mini-Games', visits: localTotalPlays }
            ],
            timestamp: new Date().toISOString()
          }));
        }

        // 3. /api/leaderboard
        if (pathname === '/api/leaderboard') {
          res.setHeader('Content-Type', 'application/json');
          const gameId = url.searchParams.get('game_id') || url.searchParams.get('game') || 'jump';

          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body || '{}');
                const gId = parsed.game_id || parsed.game || 'jump';
                const pName = (parsed.player_name || '').trim();
                const score = Number(parsed.score);

                if (pName && score > 0) {
                  if (!localMockScores[gId]) localMockScores[gId] = [];
                  localMockScores[gId].push({
                    rank: 1,
                    player_name: pName,
                    display_name: pName,
                    score,
                    created_at: new Date().toISOString()
                  });
                  localMockScores[gId].sort((a, b) => b.score - a.score);
                  localMockScores[gId].forEach((item, idx) => { item.rank = idx + 1; });
                  localMockScores[gId] = localMockScores[gId].slice(0, 10);
                }
                return res.end(JSON.stringify({ success: true, message: 'Đã lưu kỷ lục (Local Dev)' }));
              } catch (e) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ success: false, error: 'Invalid JSON' }));
              }
            });
            return;
          }

          const top10 = (localMockScores[gameId] || []).slice(0, 10);
          return res.end(JSON.stringify({
            success: true,
            game_id: gameId,
            type: 'alltime',
            results: top10,
            top10,
            min_qualifying_score: top10.length < 10 ? 1 : top10[top10.length - 1].score
          }));
        }

        // 4. /api/track
        if (pathname === '/api/track') {
          res.setHeader('Content-Type', 'application/json');
          localTotalVisits += 1;
          return res.end(JSON.stringify({ success: true, message: 'Track recorded (Local Dev)' }));
        }

        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [localApiDevPlugin()],
  server: {
    host: true,
    port: 5173
  },
  preview: {
    host: true,
    port: 4173
  }
});
