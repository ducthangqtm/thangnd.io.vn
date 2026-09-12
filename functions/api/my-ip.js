/**
 * GET /api/my-ip
 * Cloudflare Pages Function
 */
export async function onRequest(context) {
  const { request } = context;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const cf = request.cf || {};
  const ip =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for') ||
    '127.0.0.1';

  const country = cf.country || request.headers.get('cf-ipcountry') || 'VN';
  const city = cf.city || 'Hanoi';
  const region = cf.region || '';
  const asn = cf.asn || null;
  const asOrganization = cf.asOrganization || '';
  const colo = cf.colo || '';

  return new Response(
    JSON.stringify({
      ip,
      country,
      city,
      region,
      asn,
      asOrganization,
      colo,
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
}
