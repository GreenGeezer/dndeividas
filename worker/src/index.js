const PREFIX = "music/";

const LANE_MAP = {
  ambience: {
    lane: "ambience",
    title: "Ambience Lane",
    subtitle: "Layered environmental textures",
    volume: 80,
    category: "Ambience",
  },
  locations: {
    lane: "score",
    title: "Score Lane",
    subtitle: "Location, nation, or character themes",
    volume: 85,
    category: "Locations",
  },
  location: {
    lane: "score",
    title: "Score Lane",
    subtitle: "Location, nation, or character themes",
    volume: 85,
    category: "Locations",
  },
  characters: {
    lane: "score",
    title: "Score Lane",
    subtitle: "Location, nation, or character themes",
    volume: 85,
    category: "Characters",
  },
  character: {
    lane: "score",
    title: "Score Lane",
    subtitle: "Location, nation, or character themes",
    volume: 85,
    category: "Characters",
  },
  events: {
    lane: "score",
    title: "Score Lane",
    subtitle: "Location, nation, or character themes",
    volume: 85,
    category: "Events",
  },
  event: {
    lane: "score",
    title: "Score Lane",
    subtitle: "Location, nation, or character themes",
    volume: 85,
    category: "Events",
  },
  combat: {
    lane: "combat",
    title: "Combat Lane",
    subtitle: "Priority score that suppresses other music",
    volume: 90,
    category: "Combat",
  },
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/, "");

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders() });
    }

    if (path === "debug-keys") {
      const prefix = url.searchParams.get("prefix") || "";
      const result = await env.AUDIO.list({ prefix, limit: 200 });
      return jsonResponse({
        prefix,
        truncated: result.truncated,
        count: result.objects.length,
        keys: result.objects.map((obj) => obj.key),
      });
    }

    if (path === "library.json") {
      const library = await buildLibrary(env.AUDIO, url.origin);
      return jsonResponse(library);
    }

    if (!path) return new Response("Not found", { status: 404, headers: corsHeaders() });

    const key = decodeURIComponent(path);

    let object;
    const rangeHeader = request.headers.get("range") ?? undefined;
    try {
      object = await env.AUDIO.get(key, {
        range: rangeHeader,
      });
    } catch (error) {
      try {
        object = await env.AUDIO.get(key);
      } catch (fallbackError) {
        return new Response(`Storage error: ${String(fallbackError)}`, {
          status: 500,
          headers: corsHeaders(),
        });
      }
    }

    if (!object) return new Response("Not found", { status: 404, headers: corsHeaders() });

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    if (!headers.get("content-type")) {
      headers.set("content-type", guessContentType(path));
    }
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");
    applyCors(headers);
    headers.set("cache-control", "public, max-age=31536000, immutable");

    return new Response(object.body, {
      status: object.range ? 206 : 200,
      headers,
    });
  },
};

async function buildLibrary(bucket, baseUrl) {
  const lanes = new Map();

  let cursor = undefined;
  do {
    const list = await bucket.list({ prefix: PREFIX, cursor });
    cursor = list.cursor;

    list.objects.forEach((obj) => {
      const relative = obj.key.slice(PREFIX.length);
      if (!relative) return;

      const parts = relative.split("/");
      if (parts.length < 2) return;

      const folder = parts[0];
      const file = parts.slice(1).join("/");

      if (!isAudio(file)) return;

      const map = LANE_MAP[folder];
      if (!map) return;

      const laneId = map.lane;
      if (!lanes.has(laneId)) {
        lanes.set(laneId, {
          id: laneId,
          title: map.title,
          subtitle: map.subtitle,
          volume: map.volume,
          categories: new Map(),
        });
      }

      const lane = lanes.get(laneId);
      const categoryId = folder;
      if (!lane.categories.has(categoryId)) {
        lane.categories.set(categoryId, {
          id: categoryId,
          title: map.category,
          tracks: [],
        });
      }

      const displayName = formatTitle(file.replace(/\.[^/.]+$/, ""));
      const id = `${categoryId}-${slugify(file.replace(/\.[^/.]+$/, ""))}`;
      const filePath = `/${PREFIX}${relative}`;
      lane.categories.get(categoryId).tracks.push({
        id,
        name: displayName,
        file: encodeURI(filePath),
        volume: 70,
      });
    });
  } while (cursor);

  return {
    baseUrl: baseUrl || "",
    lanes: Array.from(lanes.values()).map((lane) => ({
      ...lane,
      categories: Array.from(lane.categories.values()),
    })),
  };
}

function isAudio(name) {
  return /\.(mp3|wav|ogg|flac|m4a)$/i.test(name);
}

function formatTitle(name) {
  return name
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function jsonResponse(data) {
  const headers = new Headers({
    "content-type": "application/json",
    "cache-control": "no-store",
  });
  applyCors(headers);
  return new Response(JSON.stringify(data, null, 2), { headers });
}

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, HEAD, OPTIONS",
    "access-control-allow-headers": "*",
    "access-control-expose-headers": "content-length, content-range, etag",
  };
}

function applyCors(headers) {
  headers.set("access-control-allow-origin", "*");
  headers.set("access-control-allow-methods", "GET, HEAD, OPTIONS");
  headers.set("access-control-allow-headers", "*");
  headers.set(
    "access-control-expose-headers",
    "content-length, content-range, etag"
  );
}

function guessContentType(path) {
  const lower = path.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".flac")) return "audio/flac";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  return "application/octet-stream";
}
