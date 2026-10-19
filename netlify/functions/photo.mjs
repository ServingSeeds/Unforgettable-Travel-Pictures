import { getStore } from "@netlify/blobs";

// Serves one photo: GET /api/photo?key=<trip-id>/<file>
export default async (req) => {
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!/^[a-z0-9-]{2,60}\/[a-z0-9.-]+$/.test(key)) return new Response("Not found", { status: 404 });

  const store = getStore({ name: "trip-photos", consistency: "strong" });
  const result = await store.getWithMetadata(key, { type: "arrayBuffer" });
  if (!result) return new Response("Not found", { status: 404 });

  return new Response(result.data, {
    headers: {
      "content-type": result.metadata?.type || "image/jpeg",
      "cache-control": "public, max-age=31536000, immutable",
    },
  });
};

export const config = { path: "/api/photo" };
