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

// GET: Lấy thống kê tổng hợp (Lượt gọi API/Edge Requests + Lượt chơi Arcade Game)
export async function onRequestGet(context) {
  const { env } = context;

  // Fallback nếu chưa kết nối D1 (preview dev local)
  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: true,
        total_plays: 128,
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
    let totalPlays = 0;
    try {
      const gameRow = await env.DB.prepare(
        "SELECT value FROM game_stats WHERE key = 'total_plays'"
      ).first();
      totalPlays = gameRow ? Number(gameRow.value) : 0;
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
      JSON.stringify({ success: false, error: err.message || 'Database query error', total_plays: 0, totalVisits: 0 }),
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
      JSON.stringify({ success: true, total_plays: 129, message: 'Recorded (mock)' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }

  try {
    // Tăng total_plays
    await env.DB.prepare(`
      INSERT INTO game_stats (key, value) VALUES ('total_plays', 1)
      ON CONFLICT(key) DO UPDATE SET value = value + 1, updated_at = CURRENT_TIMESTAMP
    `).run();

    const row = await env.DB.prepare("SELECT value FROM game_stats WHERE key = 'total_plays'").first();
    const updatedTotalPlays = row ? Number(row.value) : 0;

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
      JSON.stringify({ success: false, error: err.message || 'Tracking update error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }
}
