const API_HOST = "api.songgpt.soli.blue";
const INTERNAL_API_PREFIX = "/api";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization",
};

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: corsHeaders,
  });
}

function apiPath(pathname) {
  if (pathname === "" || pathname === "/") return null;
  if (pathname === INTERNAL_API_PREFIX) return INTERNAL_API_PREFIX;
  if (pathname.startsWith(`${INTERNAL_API_PREFIX}/`)) return pathname;
  return `${INTERNAL_API_PREFIX}${pathname}`;
}

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname !== API_HOST) return context.next();

  if (context.request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const pathname = apiPath(url.pathname);
  if (!pathname) {
    return json({
      ok: true,
      service: "SongGPT API",
      endpoints: ["/songs/", "/composer/claim"],
    });
  }

  if (pathname === url.pathname) return context.next();

  url.pathname = pathname;
  return fetch(new Request(url, context.request));
}
