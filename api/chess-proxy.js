// Server-side proxy for the chess.com Published-Data API.
// Exists so requests carry a proper User-Agent (chess.com's API blocks
// requests that lack one) and so the browser never needs to worry about
// CORS. Only forwards to api.chess.com/pub/* — nothing else.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { url } = req.query;
  if (typeof url !== "string" || !/^https:\/\/api\.chess\.com\/pub\/[^\s]*$/.test(url)) {
    return res.status(400).json({ error: "Invalid or disallowed url" });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        "User-Agent": "FounderMatch-ChessAssistant/1.0 (contact: daaraanbar2@gmail.com)",
        Accept: "application/json",
      },
    });
    const body = await upstream.text();
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
    res.status(upstream.status).send(body);
  } catch (err) {
    res.status(502).json({ error: "Upstream fetch failed", detail: err.message });
  }
}
