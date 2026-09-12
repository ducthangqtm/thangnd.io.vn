/**
 * POST /api/track
 * Cloudflare Pages Function with D1 Database binding
 */
export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method Not Allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders } }
    );
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: false, error: 'D1 database binding "DB" not found in Pages configuration.' }),
      { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders } }
    );
  }

  try {
    let siteId = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => ({}));
      siteId = body.siteId || body.id;
    } else {
      const text = await request.text().catch(() => '');
      try {
        const parsed = JSON.parse(text);
        siteId = parsed.siteId || parsed.id;
      } catch {
        siteId = text.trim();
      }
    }

    if (!siteId || typeof siteId !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing or invalid siteId parameter' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders } }
      );
    }

    const sanitizedSiteId = siteId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);

    if (!sanitizedSiteId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid siteId format' }),
        { status: 400, headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders } }
      );
    }

    // Ghi nhận lượt truy cập vào D1
    await env.DB.prepare(
      `INSERT INTO site_stats (id, name, visits, updated_at) 
       VALUES (?, ?, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET 
         visits = visits + 1, 
         updated_at = CURRENT_TIMESTAMP`
    )
      .bind(sanitizedSiteId, sanitizedSiteId)
      .run();

    const current = await env.DB.prepare(
      'SELECT id, name, visits, updated_at FROM site_stats WHERE id = ?'
    )
      .bind(sanitizedSiteId)
      .first();

    return new Response(
      JSON.stringify({
        success: true,
        siteId: sanitizedSiteId,
        site: current || null,
        message: 'Tracking recorded successfully',
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
      JSON.stringify({ success: false, error: err.message || 'Tracking error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }
}
