// Cloudflare Pages Function: /api/leaderboard
// Multi-game Leaderboard backed by Cloudflare D1 (Binding name: DB)
// 100% Clean: Only returns real player scores directly from D1 database

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

  // If DB is not bound yet, return clean empty list
  return new Response(JSON.stringify([]), {
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
