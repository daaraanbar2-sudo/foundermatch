// Thin client for the chess.com "Published-Data API" (public, read-only,
// no auth/API key — https://www.chess.com/news/view/published-data-api).
// Every call tries a direct browser fetch first (chess.com's public API
// sets permissive CORS headers), and falls back to our own /api/chess-proxy
// serverless function if that fails (blocked network, stricter browser, etc).

const BASE = "https://api.chess.com/pub";

async function fetchJSON(url) {
  try {
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`chess.com API ${r.status}`);
    return await r.json();
  } catch {
    const r = await fetch(`/api/chess-proxy?url=${encodeURIComponent(url)}`);
    if (!r.ok) {
      const status = r.status;
      if (status === 404) throw new Error("not_found");
      throw new Error(`chess.com API ${status}`);
    }
    return await r.json();
  }
}

export function normalizeUsername(u) {
  return (u || "").trim().toLowerCase().replace(/^https?:\/\/(www\.)?chess\.com\/member\//, "");
}

export async function getProfile(username) {
  const u = normalizeUsername(username);
  return fetchJSON(`${BASE}/player/${u}`);
}

export async function getStats(username) {
  const u = normalizeUsername(username);
  return fetchJSON(`${BASE}/player/${u}/stats`);
}

export async function getArchiveList(username) {
  const u = normalizeUsername(username);
  const data = await fetchJSON(`${BASE}/player/${u}/games/archives`);
  return data.archives || [];
}

export async function getArchiveGames(archiveUrl) {
  const data = await fetchJSON(archiveUrl);
  return data.games || [];
}

// Pulls games from the most recent N archive months (newest first), up to `limit` games.
export async function getRecentGames(username, { months = 2, limit = 20 } = {}) {
  const archives = await getArchiveList(username);
  const recent = archives.slice(-months).reverse();
  const games = [];
  for (const url of recent) {
    const monthGames = await getArchiveGames(url);
    games.push(...monthGames.reverse());
    if (games.length >= limit) break;
  }
  return games.slice(0, limit);
}

export async function getCurrentDailyGames(username) {
  const u = normalizeUsername(username);
  const data = await fetchJSON(`${BASE}/player/${u}/games`);
  return data.games || [];
}

export async function getGamesToMove(username) {
  const u = normalizeUsername(username);
  const data = await fetchJSON(`${BASE}/player/${u}/games/to-move`);
  return data.games || [];
}

export function resultLabel(game, username) {
  const u = normalizeUsername(username);
  const isWhite = normalizeUsername(game.white?.username) === u;
  const me = isWhite ? game.white : game.black;
  const them = isWhite ? game.black : game.white;
  const outcome =
    me?.result === "win" ? "win" : ["agreed", "repetition", "stalemate", "insufficient", "50move", "timevsinsufficient"].includes(me?.result) ? "draw" : "loss";
  return { isWhite, me, them, outcome };
}
