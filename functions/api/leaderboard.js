// Cloudflare Pages Function: /api/leaderboard
// Connects to Cloudflare D1 database (Binding name: DB)

export async function onRequestGet(context) {
  const { env } = context;

  // If D1 database is bound as DB
  if (env && env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT name, score, strftime('%Y-%m-%d', created_at) as date FROM leaderboard ORDER BY score DESC, created_at ASC LIMIT 10"
      ).all();

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

  // If DB is not bound yet, return placeholder
  return new Response(JSON.stringify([
    { name: 'Thắng (Kỷ lục gia)', score: 128, date: '2026-09-08' },
    { name: 'DoubleUnder_Pro', score: 85, date: '2026-09-08' }
  ]), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const name = String(body.name || 'Ẩn danh').trim().slice(0, 30);
    const score = parseInt(body.score, 10);

    if (isNaN(score) || score <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400 });
    }

    if (env && env.DB) {
      await env.DB.prepare(
        "INSERT INTO leaderboard (name, score) VALUES (?, ?)"
      ).bind(name, score).run();
    }

    return new Response(JSON.stringify({ success: true, name, score }), {
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
