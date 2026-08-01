/**
 * Cloudflare Worker — CORS proxy para Voto Informado
 *
 * Desplegá gratis en Cloudflare Workers (100,000 req/día):
 *   1. Creá una cuenta en https://workers.cloudflare.com
 *   2. npx wrangler deploy (o copiá este código en el dashboard)
 *   3. Configurá la URL del worker en js/app.js (variable CORS_PROXY)
 */

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const target = url.searchParams.get('url');
    if (!target) {
      return new Response('Agregá ?url=... al final', { status: 400 });
    }

    let decoded;
    try {
      decoded = decodeURIComponent(target);
    } catch {
      return new Response('URL inválida', { status: 400 });
    }

    const method = request.method === 'POST' ? 'POST' : 'GET';
    const init = {
      method,
      headers: { 'User-Agent': 'VotoInformado/1.0' },
    };

    if (method === 'POST') {
      init.body = await request.text();
      init.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    try {
      const upstream = await fetch(decoded, init);
      const modified = new Response(upstream.body, upstream);
      modified.headers.set('Access-Control-Allow-Origin', '*');
      modified.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      modified.headers.delete('content-security-policy');
      modified.headers.delete('x-frame-options');
      return modified;
    } catch (e) {
      return new Response(`Error al conectar: ${e.message}`, { status: 502 });
    }
  },
};
