import {
  addSecondsIso,
  cors,
  json,
  nowIso,
  requireComposer,
  songRow,
} from "../../_shared.js";

export const onRequestOptions = () => cors();

export const onRequestPost = async ({ env, request }) => {
  const authError = requireComposer(request, env);
  if (authError) return authError;

  const now = nowIso();
  const row = await env.DB.prepare(
    `SELECT * FROM songs
     WHERE status = 'queued'
       OR (status = 'processing' AND lease_expires_at < ?)
     ORDER BY created_at ASC
     LIMIT 1`,
  )
    .bind(now)
    .first();

  if (!row) return new Response(null, { status: 204 });

  const leaseSeconds = Number(env.COMPOSER_LEASE_SECONDS || 600);
  const updated = nowIso();
  await env.DB.prepare(
    `UPDATE songs
     SET status = 'processing',
         processing_started_at = ?,
         lease_expires_at = ?,
         updated_at = ?,
         error = NULL
     WHERE id = ?`,
  )
    .bind(updated, addSecondsIso(leaseSeconds), updated, row.id)
    .run();

  const claimed = await env.DB.prepare("SELECT * FROM songs WHERE id = ?")
    .bind(row.id)
    .first();
  return json({ song: songRow(claimed) });
};
