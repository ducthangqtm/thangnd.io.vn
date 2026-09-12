/**
 * Thắng ND — Digital Identity & Lab API Gateway
 * Cloudflare Worker with D1 Database Integration
 * Host: lab.thangnd.io.vn
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Helper: CORS Headers setup
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // Hoặc whitelist các domain trong hệ sinh thái
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    };

    // Xử lý CORS Preflight (OPTIONS)
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    // Helper response JSON
    const jsonResponse = (data, status = 200, extraHeaders = {}) => {
      return new Response(JSON.stringify(data, null, 2), {
        status,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          ...corsHeaders,
          ...extraHeaders,
        },
      });
    };

    try {
      // 1. Endpoint: GET /api/my-ip
      if (method === 'GET' && url.pathname === '/api/my-ip') {
        const cf = request.cf || {};
        const ip =
          request.headers.get('cf-connecting-ip') ||
          request.headers.get('x-real-ip') ||
          request.headers.get('x-forwarded-for') ||
          '127.0.0.1';

        const country = cf.country || request.headers.get('cf-ipcountry') || 'VN';
        const city = cf.city || 'Unknown';
        const region = cf.region || '';
        const asn = cf.asn || null;
        const asOrganization = cf.asOrganization || '';
        const colo = cf.colo || '';

        return jsonResponse({
          ip,
          country,
          city,
          region,
          asn,
          asOrganization,
          colo,
          timestamp: new Date().toISOString(),
        });
      }

      // 2. Endpoint: GET /api/stats
      if (method === 'GET' && url.pathname === '/api/stats') {
        if (!env.DB) {
          return jsonResponse(
            { success: false, error: 'Database binding DB not found.' },
            500
          );
        }

        const query = await env.DB.prepare(
          'SELECT id, name, visits, updated_at FROM site_stats ORDER BY visits DESC'
        ).all();

        return jsonResponse({
          success: true,
          data: query.results || [],
          totalVisits: (query.results || []).reduce((acc, row) => acc + (row.visits || 0), 0),
          timestamp: new Date().toISOString(),
        });
      }

      // 3. Endpoint: POST /api/track
      if (method === 'POST' && url.pathname === '/api/track') {
        if (!env.DB) {
          return jsonResponse(
            { success: false, error: 'Database binding DB not found.' },
            500
          );
        }

        let siteId = '';

        // Support cả JSON body và text/plain từ sendBeacon
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
          return jsonResponse(
            { success: false, error: 'Missing or invalid siteId parameter' },
            400
          );
        }

        // Làm sạch siteId (chỉ cho phép chữ, số, gạch dưới, gạch ngang)
        const sanitizedSiteId = siteId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);

        if (!sanitizedSiteId) {
          return jsonResponse({ success: false, error: 'Invalid siteId format' }, 400);
        }

        // Cập nhật lượt truy cập hoặc tự tạo nếu chưa có
        const updateResult = await env.DB.prepare(
          `INSERT INTO site_stats (id, name, visits, updated_at) 
           VALUES (?, ?, 1, CURRENT_TIMESTAMP)
           ON CONFLICT(id) DO UPDATE SET 
             visits = visits + 1, 
             updated_at = CURRENT_TIMESTAMP`
        )
          .bind(sanitizedSiteId, sanitizedSiteId)
          .run();

        // Lấy thông tin lượt truy cập mới nhất của site
        const current = await env.DB.prepare(
          'SELECT id, name, visits, updated_at FROM site_stats WHERE id = ?'
        )
          .bind(sanitizedSiteId)
          .first();

        return jsonResponse({
          success: true,
          siteId: sanitizedSiteId,
          site: current || null,
          message: 'Tracking recorded successfully',
        });
      }

      // Root endpoint / lab status
      if (url.pathname === '/' || url.pathname === '/api') {
        return jsonResponse({
          service: 'Thắng ND Ecosystem Lab API',
          version: '1.0.0',
          author: 'Nguyễn Đức Thắng (ducthangqtm)',
          endpoints: [
            { method: 'GET', path: '/api/my-ip', description: 'Returns client IP and Cloudflare geo details' },
            { method: 'GET', path: '/api/stats', description: 'Returns current visit statistics from Cloudflare D1' },
            { method: 'POST', path: '/api/track', description: 'Increments visits count for given siteId' },
          ],
          systemStatus: 'operational',
          time: new Date().toISOString(),
        });
      }

      // Route 404
      return jsonResponse({ success: false, error: 'Not Found' }, 404);
    } catch (err) {
      return jsonResponse(
        {
          success: false,
          error: err.message || 'Internal Server Error',
        },
        500
      );
    }
  },
};
