export const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": headers.origin || "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      ...headers,
    },
  });

export const cors = () =>
  new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });

export const requireComposer = (request, env) => {
  if (!env.COMPOSER_TOKEN) {
    return json({ error: "Composer token is not configured." }, 500);
  }
  const expected = `Bearer ${env.COMPOSER_TOKEN}`;
  if (request.headers.get("Authorization") !== expected) {
    return json({ error: "Unauthorized." }, 401);
  }
  return null;
};

export const nowIso = () => new Date().toISOString();

export const addSecondsIso = (seconds) =>
  new Date(Date.now() + seconds * 1000).toISOString();

export const songRow = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    system_message: row.system_message,
    prompt: row.prompt,
    soundfont: row.soundfont,
    status: row.status,
    abc: row.abc,
    response: row.response,
    score: row.score_json ? JSON.parse(row.score_json) : null,
    error: row.error,
    is_featured: Boolean(row.is_featured),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const fileKeys = (id) => ({
  abc: `songs/${id}/${id}.abc`,
  mid: `songs/${id}/${id}.mid`,
  midi: `songs/${id}/${id}.mid`,
});

export const contentTypes = {
  abc: "text/vnd.abc; charset=utf-8",
  mid: "audio/midi",
  midi: "audio/midi",
};
