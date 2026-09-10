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

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    };

    // Case 1: Player Registration
    if (body.action === 'register') {
      const pin = String(body.pin || '').trim();
      if (!pin || pin.length !== 4) return new Response(JSON.stringify({ error: 'Mã PIN phải gồm 4 ký tự' }), { status: 400, headers });
      
      if (env && env.DB) {
        const existing = await env.DB.prepare("SELECT * FROM players WHERE name = ?").bind(name).first();
        if (existing) {
          return new Response(JSON.stringify({ error: 'Tên đã tồn tại. Vui lòng nhập PIN để đăng nhập hoặc chọn tên khác.', exists: true }), { status: 409, headers });
        }
        
        await env.DB.prepare("INSERT INTO players (name, pin, player_id) VALUES (?, ?, ?)").bind(name, pin, playerId).run();
        await env.DB.prepare("UPDATE leaderboard SET name = ? WHERE player_id = ?").bind(name, playerId).run();
      }
      return new Response(JSON.stringify({ success: true, name, player_id: playerId }), { headers });
    }

    // Case 2: Player Login
    if (body.action === 'login') {
      const pin = String(body.pin || '').trim();
      if (env && env.DB) {
        const existing = await env.DB.prepare("SELECT * FROM players WHERE name = ? AND pin = ?").bind(name, pin).first();
        if (!existing) {
          return new Response(JSON.stringify({ error: 'Tên không tồn tại hoặc sai mã PIN.' }), { status: 401, headers });
        }
        return new Response(JSON.stringify({ success: true, name, player_id: existing.player_id }), { headers });
      }
      return new Response(JSON.stringify({ error: 'DB not connected' }), { status: 500, headers });
    }

    // Case 3: Score submission
    const score = parseInt(body.score, 10);
    if (isNaN(score) || score <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid score' }), { status: 400, headers });
    }

    if (env && env.DB) {
      // Validate ownership if name is registered
      const registered = await env.DB.prepare("SELECT player_id FROM players WHERE name = ?").bind(name).first();
      if (registered && registered.player_id !== playerId) {
        return new Response(JSON.stringify({ error: 'Tên này đã được đăng ký. Vui lòng đăng nhập hoặc chọn tên khác.', needsLogin: true }), { status: 403, headers });
      }

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

    return new Response(JSON.stringify({ success: true, player_id: playerId, game, name, score }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
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
