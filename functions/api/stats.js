/**
 * GET & POST /api/stats
 * Cloudflare Pages Function with D1 Database binding
 * Hợp nhất Telemetry Lab Stats & Arcade Total Plays
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

// Helper đảm bảo bảng game_stats luôn tồn tại và có giá trị khởi đầu
async function ensureGameStatsTable(db) {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS game_stats (
        key TEXT PRIMARY KEY,
        value INTEGER NOT NULL DEFAULT 0,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO game_stats (key, value) VALUES ('total_plays', 142);
    `);
  } catch (err) {
    console.warn('ensureGameStatsTable warning:', err);
  }
}

// GET: Lấy thống kê tổng hợp (Lượt gọi API/Edge Requests + Lượt chơi Arcade Game)
export async function onRequestGet(context) {
  const { env } = context;

  // Fallback nếu chưa kết nối D1 (preview dev local)
  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        total_plays: 142,
        totalVisits: 1024,
        data: [
          { id: 'api_my_ip', name: 'API /api/my-ip Calls', visits: 512, updated_at: new Date().toISOString() },
          { id: 'api_stats', name: 'API /api/stats Queries', visits: 256, updated_at: new Date().toISOString() },
          { id: 'api_leaderboard', name: 'API /api/leaderboard Calls', visits: 128, updated_at: new Date().toISOString() },
          { id: 'portal_visits', name: 'Portal Page Impressions', visits: 128, updated_at: new Date().toISOString() }
        ],
        mock: true,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }

  try {
    await ensureGameStatsTable(env.DB);

    // 1. Lấy thống kê từ site_stats
    let siteStatsResults = [];
    let totalVisits = 0;
    try {
      const statsQuery = await env.DB.prepare(
        'SELECT id, name, visits, updated_at FROM site_stats ORDER BY visits DESC'
      ).all();
      siteStatsResults = statsQuery.results || [];
      totalVisits = siteStatsResults.reduce((acc, row) => acc + (row.visits || 0), 0);
    } catch (e) {
      console.warn('Lỗi đọc bảng site_stats:', e);
    }

    // 2. Lấy total_plays từ game_stats
    let totalPlays = 142;
    try {
      const gameRow = await env.DB.prepare(
        "SELECT value FROM game_stats WHERE key = 'total_plays'"
      ).first();
      if (gameRow && Number(gameRow.value) > 0) {
        totalPlays = Number(gameRow.value);
      } else {
        await env.DB.prepare("INSERT OR REPLACE INTO game_stats (key, value) VALUES ('total_plays', 142)").run();
        totalPlays = 142;
      }
    } catch (e) {
      console.warn('Lỗi đọc bảng game_stats:', e);
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_plays: totalPlays,
        totalVisits,
        data: siteStatsResults,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...corsHeaders,
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Database query error', total_plays: 142, totalVisits: 0 }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }
}

// POST: Tăng lượt chơi game hoặc tăng telemetry stat
export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: true, total_plays: 143, message: 'Recorded (mock)' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }

  try {
    await ensureGameStatsTable(env.DB);

    // Tăng total_plays: Nếu < 142 thì nhảy lên 143, còn lại tăng +1
    await env.DB.prepare(`
      INSERT INTO game_stats (key, value) VALUES ('total_plays', 143)
      ON CONFLICT(key) DO UPDATE SET value = CASE WHEN value < 142 THEN 143 ELSE value + 1 END, updated_at = CURRENT_TIMESTAMP
    `).run();

    const row = await env.DB.prepare("SELECT value FROM game_stats WHERE key = 'total_plays'").first();
    const updatedTotalPlays = row ? Number(row.value) : 143;

    return new Response(
      JSON.stringify({
        success: true,
        total_plays: updatedTotalPlays,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Tracking update error', total_plays: 143 }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }
}
