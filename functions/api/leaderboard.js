// Cloudflare Pages Function: /api/leaderboard
// Multi-game Leaderboard backed by Cloudflare D1 (Binding name: DB)
// Supports scalable games ('rope', 'snake', '2048', or any custom future game)

const DEFAULT_MOCKS = {
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

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const game = (url.searchParams.get('game') || 'rope').toLowerCase().trim();

  // If D1 database is bound as DB
  if (env && env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT name, score, strftime('%Y-%m-%d', updated_at) as date FROM leaderboard WHERE game = ? ORDER BY score DESC LIMIT 10"
      ).bind(game).all();

      return new Response(JSON.stringify(results || []), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
  }

  // Fallback mock scores when DB is not yet bound
  const mockData = DEFAULT_MOCKS[game] || [
    { name: 'Thắng Quán Quân', score: 100, date: '2026-09-08' },
    { name: 'Người Chơi Mới', score: 50, date: '2026-09-08' }
  ];

  return new Response(JSON.stringify(mockData), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const playerId = String(body.player_id || '').trim().slice(0, 64) || 'anon_' + Math.random().toString(36).substring(2, 10);
    const name = String(body.name || 'Ẩn danh').trim().slice(0, 30);
    const game = String(body.game || 'rope').toLowerCase().trim().slice(0, 32);

    // Case 1: Player just updated their display name
    if (body.action === 'update_name') {
      if (env && env.DB && playerId) {
        await env.DB.prepare(
          "UPDATE leaderboard SET name = ? WHERE player_id = ?"
        ).bind(name, playerId).run();
      }
      return new Response(JSON.stringify({ success: true, updatedName: name }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Case 2: Score submission
    const score = parseInt(body.score, 10);
    if (isNaN(score) || score <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400 });
    }

    if (env && env.DB) {
      // 1. Synchronize name across all records of this player
      await env.DB.prepare(
        "UPDATE leaderboard SET name = ? WHERE player_id = ?"
      ).bind(name, playerId).run();

      // 2. UPSERT the high score for this specific game
      await env.DB.prepare(`
        INSERT INTO leaderboard (player_id, game, name, score, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(player_id, game) DO UPDATE SET
          score = MAX(leaderboard.score, excluded.score),
          name = excluded.name,
          updated_at = CASE WHEN excluded.score > leaderboard.score THEN CURRENT_TIMESTAMP ELSE leaderboard.updated_at END
      `).bind(playerId, game, name, score).run();
    }

    return new Response(JSON.stringify({ success: true, player_id: playerId, game, name, score }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
