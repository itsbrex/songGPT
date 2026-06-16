import { contentTypes, cors, fileKeys, json } from "../../../../_shared.js";

export const onRequestOptions = () => cors();

const fileHeaders = (type, key) => ({
  "Content-Type": contentTypes[type],
  "Content-Disposition": `attachment; filename="${key.split("/").pop()}"`,
  "Cache-Control": "public, max-age=31536000, immutable",
});

const fileResponse = async ({ env, params }, includeBody) => {
  if (!contentTypes[params.type]) return json({ error: "File not found." }, 404);
  const keys = fileKeys(params.id);
  const key = keys[params.type];
  const object = await env.SONG_FILES.get(key);
  if (!object && params.type === "abc") {
    const row = await env.DB.prepare("SELECT abc FROM songs WHERE id = ?")
      .bind(params.id)
      .first();
    if (row?.abc) {
      return new Response(includeBody ? row.abc : null, {
        headers: fileHeaders("abc", key),
      });
    }
  }
  if (!object) return json({ error: "File not found." }, 404);

  return new Response(includeBody ? object.body : null, {
    headers: fileHeaders(params.type, key),
  });
};

export const onRequestGet = (context) => fileResponse(context, true);

export const onRequestHead = (context) => fileResponse(context, false);
