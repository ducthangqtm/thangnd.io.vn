import { defineConfig } from 'vite';

// In-memory store cho môi trường local development (khởi tạo trống, lưu điểm động khi chơi)
const localMockScores = {
  jump: [],
  snake: [],
  '2048': [],
  tetris: [],
  space_shooter: [],
  racer: []
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
