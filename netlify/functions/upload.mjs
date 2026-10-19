import { getStore } from "@netlify/blobs";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per photo (photos are shrunk in the browser first)
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST" }, 405);

  let form;
  try {
    form = await req.formData();
  } catch {
    return json({ error: "Bad upload" }, 400);
  }

  const code = String(form.get("code") || "").trim();
  const trip = String(form.get("trip") || "").trim();
  const name = String(form.get("name") || "").trim().slice(0, 60);
  const file = form.get("photo");

  const expected = (process.env.UPLOAD_CODE || "").trim();
  if (!expected) return json({ error: "Site not set up yet: UPLOAD_CODE is missing in Netlify." }, 500);
  if (code.toLowerCase() !== expected.toLowerCase()) return json({ error: "That trip code is not right." }, 401);
  if (!/^[a-z0-9-]{2,60}$/.test(trip)) return json({ error: "Unknown trip." }, 400);
  if (!file || typeof file === "string") return json({ error: "No photo received." }, 400);
  if (!OK_TYPES.includes(file.type)) return json({ error: "Please upload a photo (JPG or PNG)." }, 400);
  if (file.size > MAX_BYTES) return json({ error: "That photo is too large." }, 413);

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : file.type === "image/gif" ? "gif" : "jpg";
  const key = `${trip}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const store = getStore({ name: "trip-photos", consistency: "strong" });
  await store.set(key, await file.arrayBuffer(), {
    metadata: { name, type: file.type, uploaded: new Date().toISOString() },
  });

  return json({ ok: true, key });
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export const config = { path: "/api/upload" };
