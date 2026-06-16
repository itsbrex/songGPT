import { cors, json, nowIso, requireComposer } from "../../../_shared.js";

export const onRequestOptions = () => cors();

export const onRequestPost = async ({ env, request, params }) => {
  const authError = requireComposer(request, env);
  if (authError) return authError;
  const body = await request.json().catch(() => ({}));
  await env.DB.prepare(
    `UPDATE songs
     SET status = 'failed',
         error = ?,
         updated_at = ?,
         lease_expires_at = NULL
     WHERE id = ?`,
  )
    .bind(String(body.error || "Song generation failed.").slice(0, 2000), nowIso(), params.id)
    .run();
  return json({ id: params.id, status: "failed" });
};
