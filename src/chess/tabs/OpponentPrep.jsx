import { useState } from "react";
import { T, F } from "../theme.js";
import { Btn, Input, Card, SectionLabel, Spinner, ErrorBox, Pill } from "../ui.jsx";
import { getProfile, getStats, getRecentGames, resultLabel, normalizeUsername } from "../api.js";

function openingNameFromGame(game) {
  if (game.eco) {
    try {
      const url = new URL(game.eco);
      const slug = url.pathname.split("/").filter(Boolean).pop();
      if (slug) return slug.replace(/-/g, " ").replace(/\.\.\.$/, "");
    } catch {
      // eco wasn't a URL, fall through
    }
  }
  const pgn = game.pgn || "";
  const ecoMatch = pgn.match(/\[ECOUrl "([^"]+)"\]/);
  if (ecoMatch) {
    const slug = ecoMatch[1].split("/").filter(Boolean).pop();
    if (slug) return slug.replace(/-/g, " ");
  }
  const codeMatch = pgn.match(/\[ECO "([^"]+)"\]/);
  return codeMatch ? `ECO ${codeMatch[1]}` : "Unknown opening";
}

function buildOpeningStats(games, username) {
  const buckets = new Map();
  for (const g of games) {
    const { isWhite, outcome } = resultLabel(g, username);
    const name = openingNameFromGame(g);
    const key = `${isWhite ? "White" : "Black"} — ${name}`;
    if (!buckets.has(key)) buckets.set(key, { name, color: isWhite ? "White" : "Black", win: 0, loss: 0, draw: 0, total: 0 });
    const b = buckets.get(key);
    b[outcome === "win" ? "win" : outcome === "loss" ? "loss" : "draw"]++;
    b.total++;
  }
  return [...buckets.values()].sort((a, b) => b.total - a.total);
}

export default function OpponentPrep() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [openings, setOpenings] = useState([]);
  const [gameCount, setGameCount] = useState(0);

  async function load() {
    if (!input.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [p, s, games] = await Promise.all([getProfile(input), getStats(input), getRecentGames(input, { months: 4, limit: 60 })]);
      setProfile(p);
      setStats(s);
      setGameCount(games.length);
      setOpenings(buildOpeningStats(games, normalizeUsername(input)));
    } catch (e) {
      setError(e.message === "not_found" ? "No chess.com player found with that username." : "Couldn't reach chess.com. Try again in a moment.");
      setProfile(null);
      setOpenings([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Card>
        <SectionLabel>Scout an upcoming opponent</SectionLabel>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
          Pulls public stats and openings from their past games — this is pre-game research, same as looking at a chess database, not
          in-game assistance.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load()} placeholder="opponent's chess.com username" />
          <Btn onClick={load} disabled={loading}>
            {loading ? "Scouting…" : "Scout"}
          </Btn>
        </div>
        {error && (
          <div style={{ marginTop: 12 }}>
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </Card>

      {loading && <Spinner label="Pulling opponent history…" />}

      {profile && !loading && (
        <>
          <Card style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {profile.avatar && <img src={profile.avatar} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />}
            <div>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{profile.name || profile.username}</div>
              <div style={{ color: T.muted, fontSize: 13 }}>@{profile.username}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 12 }}>
                <span>
                  Rapid <strong style={{ color: T.gold }}>{stats?.chess_rapid?.last?.rating ?? "—"}</strong>
                </span>
                <span>
                  Blitz <strong style={{ color: T.gold }}>{stats?.chess_blitz?.last?.rating ?? "—"}</strong>
                </span>
                <span>
                  Bullet <strong style={{ color: T.gold }}>{stats?.chess_bullet?.last?.rating ?? "—"}</strong>
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Most-played openings ({gameCount} recent games)</SectionLabel>
            {openings.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>Not enough recent games to find patterns.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {openings.slice(0, 15).map((o) => (
                <div key={o.color + o.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 4px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                    <Pill color={o.color === "White" ? T.text : T.muted}>{o.color}</Pill>
                    <span>{o.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 12 }}>
                    <span style={{ color: T.muted }}>{o.total} games</span>
                    <span style={{ color: T.accent }}>{o.win}W</span>
                    <span style={{ color: T.danger }}>{o.loss}L</span>
                    <span style={{ color: T.muted }}>{o.draw}D</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
