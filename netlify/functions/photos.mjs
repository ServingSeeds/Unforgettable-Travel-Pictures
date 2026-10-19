import { getStore } from "@netlify/blobs";

// Lists the photos for one trip: GET /api/photos?trip=<trip-id>
export default async (req) => {
  const trip = new URL(req.url).searchParams.get("trip") || "";
  if (!/^[a-z0-9-]{2,60}$/.test(trip)) {
    return new Response(JSON.stringify({ error: "Unknown trip." }), { status: 400 });
  }

  const store = getStore({ name: "trip-photos", consistency: "strong" });
  const { blobs } = await store.list({ prefix: `${trip}/` });

  const photos = await Promise.all(
    blobs.map(async (b) => {
      const meta = await store.getMetadata(b.key);
      return {
        key: b.key,
        url: `/api/photo?key=${encodeURIComponent(b.key)}`,
        name: meta?.metadata?.name || "",
        uploaded: meta?.metadata?.uploaded || "",
      };
    })
  );
  photos.sort((a, b) => (a.uploaded < b.uploaded ? 1 : -1)); // newest first

  return new Response(JSON.stringify({ photos }), {
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
};

export const config = { path: "/api/photos" };
