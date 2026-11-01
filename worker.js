const DNS_NAME = /^(?=.{1,253}\.?$)(?:[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.)*[a-z0-9_](?:[a-z0-9_-]{0,61}[a-z0-9_])?\.?$/i;
const DNS_RESOLVERS = [
  { name: "Cloudflare DNS", url: "https://cloudflare-dns.com/dns-query", headers: { accept: "application/dns-json" } },
  { name: "Google Public DNS", url: "https://dns.google/resolve", headers: {} }
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/dns") return handleDns(request, url);
    if (url.pathname.startsWith("/api/")) return json({ error: "Rota não encontrada." }, 404);
    return serveStatic(request, env);
  }
};

async function handleDns(request, requestUrl) {
  if (request.method !== "GET") return json({ error: "Método não permitido." }, 405, { Allow: "GET" });
  const name = (requestUrl.searchParams.get("name") || "").trim().toLowerCase();
  const type = (requestUrl.searchParams.get("type") || "TXT").toUpperCase();
  if (!DNS_NAME.test(name)) return json({ error: "Nome DNS inválido." }, 400);
  if (type !== "TXT") return json({ error: "Somente consultas TXT são permitidas." }, 400);

  let lastError;
  for (const resolver of DNS_RESOLVERS) {
    try {
      const upstream = new URL(resolver.url);
      upstream.searchParams.set("name", name);
      upstream.searchParams.set("type", type);
      upstream.searchParams.set("cd", "false");
      upstream.searchParams.set("do", "false");
      const response = await fetch(upstream, {
        headers: resolver.headers,
        cf: { cacheEverything: true, cacheTtl: 60 }
      });
      if (!response.ok) throw new Error(`${resolver.name}: HTTP ${response.status}`);
      const payload = await response.json();
      return json({
        resolver: resolver.name,
        Status: payload.Status,
        Answer: Array.isArray(payload.Answer) ? payload.Answer.filter((answer) => answer.type === 16).slice(0, 50) : []
      }, 200, { "Cache-Control": "public, max-age=60" });
    } catch (error) {
      lastError = error;
    }
  }
  return json({ error: lastError?.message || "Nenhum resolvedor DNS respondeu." }, 502);
}

async function serveStatic(request, env) {
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("X-Frame-Options", "DENY");
  if ((headers.get("Content-Type") || "").includes("text/html")) {
    headers.set("Content-Security-Policy", "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://dns.google https://cloudflare-dns.com; base-uri 'self'; form-action 'none'; frame-ancestors 'none'");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders
    }
  });
}
