import { contentTypes, cors, fileKeys, json } from "../../../../_shared.js";

export const onRequestOptions = () => cors();

export const onRequestGet = async ({ env, params }) => {
  if (!contentTypes[params.type]) return json({ error: "File not found." }, 404);
  const keys = fileKeys(params.id);
  const key = keys[params.type];
  const object = await env.SONG_FILES.get(key);
  if (!object && params.type === "abc") {
    const row = await env.DB.prepare("SELECT abc FROM songs WHERE id = ?")
      .bind(params.id)
      .first();
    if (row?.abc) {
      return new Response(row.abc, {
        headers: {
          "Content-Type": contentTypes.abc,
          "Content-Disposition": `attachment; filename="${key.split("/").pop()}"`,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
  }
  if (!object) return json({ error: "File not found." }, 404);

  return new Response(object.body, {
    headers: {
      "Content-Type": contentTypes[params.type],
      "Content-Disposition": `attachment; filename="${key.split("/").pop()}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
};
