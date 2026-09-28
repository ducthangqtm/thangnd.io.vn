// Cloudflare Pages Functions API: /api/leaderboard
// Kết nối Cloudflare D1 Database binding: env.DB (All-Time Leaderboard)

const responseHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Content-Type': 'application/json; charset=utf-8'
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: responseHeaders
  });
}

async function ensureLeaderboardsTable(db) {
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS leaderboards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        score INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    await db.prepare(`
      CREATE INDEX IF NOT EXISTS idx_leaderboards_game_score 
      ON leaderboards(game_id, score DESC)
    `).run();
  } catch (e) {
    console.error('Error ensuring leaderboards table:', e);
  }
}

// 1. GET: Lấy Top 10 kỷ lục All-Time theo game_id
export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  const game_id = url.searchParams.get('game_id') || url.searchParams.get('game') || 'jump';

  // Fallback nếu chưa kết nối D1
  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        game_id,
        type: 'alltime',
        results: [],
        top10: [],
        min_qualifying_score: 1,
        mock: true
      }),
      { status: 200, headers: responseHeaders }
    );
  }

  try {
    await ensureLeaderboardsTable(env.DB);

    const query = `
      SELECT player_name, MAX(score) as score, MAX(created_at) as created_at 
      FROM leaderboards 
      WHERE game_id = ? 
      GROUP BY player_name 
      ORDER BY score DESC LIMIT 10
    `;

    const { results } = await env.DB.prepare(query).bind(game_id).all();
    const rows = results || [];

    const top10 = rows.map((row, idx) => ({
      rank: idx + 1,
      player_name: row.player_name,
      display_name: row.player_name,
      score: Number(row.score),
      created_at: row.created_at
    }));

    return new Response(
      JSON.stringify({
        success: true,
        game_id,
        type: 'alltime',
        results: top10,
        top10,
        min_qualifying_score: top10.length < 10 ? 1 : top10[top10.length - 1].score
      }),
      {
        status: 200,
        headers: responseHeaders
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Lỗi truy vấn Database' }),
      { status: 500, headers: responseHeaders }
    );
  }
}

// 2. POST: Lưu điểm kỷ lục mới
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const game_id = body.game_id || body.game || 'jump';
    const player_name = (body.player_name || body.display_name || '').trim();
    const score = Number(body.score);

    if (!player_name || player_name.length < 2) {
      return new Response(
        JSON.stringify({ success: false, error: 'Tên người chơi phải có ít nhất 2 ký tự' }),
        { status: 400, headers: responseHeaders }
      );
    }

    if (isNaN(score) || score <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Điểm số phải lớn hơn 0' }),
        { status: 400, headers: responseHeaders }
      );
    }

    if (!env.DB) {
      return new Response(
        JSON.stringify({ success: true, message: 'Đã lưu điểm (mock mode)' }),
        { status: 200, headers: responseHeaders }
      );
    }

    await ensureLeaderboardsTable(env.DB);

    await env.DB.prepare("INSERT INTO leaderboards (game_id, player_name, score) VALUES (?, ?, ?)")
      .bind(game_id, player_name, score)
      .run();

    return new Response(
      JSON.stringify({ success: true, message: 'Kỷ lục đã được ghi nhận vào D1!' }),
      {
        status: 200,
        headers: responseHeaders
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Lỗi server xử lý lưu điểm' }),
      { status: 500, headers: responseHeaders }
    );
  }
}
