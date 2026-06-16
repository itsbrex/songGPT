import { cors, json, songRow } from "../../_shared.js";

export const onRequestOptions = () => cors();

export const onRequestGet = async ({ env, params }) => {
  const row = await env.DB.prepare("SELECT * FROM songs WHERE id = ?")
    .bind(params.id)
    .first();
  if (!row) return json({ error: "Song not found." }, 404);
  return json(songRow(row));
};
