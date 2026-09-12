/**
 * GET /api/stats
 * Cloudflare Pages Function with D1 Database binding
 */
export async function onRequest(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (!env.DB) {
    return new Response(
      JSON.stringify({ success: false, error: 'D1 database binding "DB" not found in Pages configuration.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }

  try {
    const query = await env.DB.prepare(
      'SELECT id, name, visits, updated_at FROM site_stats ORDER BY visits DESC'
    ).all();

    const results = query.results || [];
    const totalVisits = results.reduce((acc, row) => acc + (row.visits || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        data: results,
        totalVisits,
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
      JSON.stringify({ success: false, error: err.message || 'Database query error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders },
      }
    );
  }
}
