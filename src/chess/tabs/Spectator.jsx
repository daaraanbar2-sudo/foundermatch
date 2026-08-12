import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { T, F } from "../theme.js";
import { Btn, Input, Card, SectionLabel, Spinner, ErrorBox, Pill } from "../ui.jsx";
import { getCurrentDailyGames, normalizeUsername } from "../api.js";

export default function Spectator() {
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [games, setGames] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const intervalRef = useRef(null);

  async function load(u) {
    if (!u.trim()) return;
    setLoading(true);
    setError("");
    try {
      const list = await getCurrentDailyGames(u);
      setGames(list);
      setUsername(u.trim());
    } catch (e) {
      setError(e.message === "not_found" ? "No chess.com player found with that username." : "Couldn't reach chess.com. Try again in a moment.");
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (autoRefresh && username) {
      intervalRef.current = setInterval(() => load(username), 30000);
    }
    return () => clearInterval(intervalRef.current);
  }, [autoRefresh, username]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Card>
        <SectionLabel>Watch in-progress games</SectionLabel>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14, lineHeight: 1.6 }}>
          chess.com's public API only exposes <strong>Daily (correspondence)</strong> games while they're in progress. Live Rapid,
          Blitz, and Bullet games aren't available through the public API for spectating — not for this player, and not for anyone
          else's games either. This shows Daily games only.
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(input)} placeholder="chess.com username" />
          <Btn onClick={() => load(input)} disabled={loading}>
            {loading ? "Loading…" : "Load"}
          </Btn>
        </div>
        {error && (
          <div style={{ marginTop: 12 }}>
            <ErrorBox>{error}</ErrorBox>
          </div>
        )}
      </Card>

      {loading && <Spinner label="Loading in-progress games…" />}

      {!loading && username && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <SectionLabel>{games.length} daily game{games.length === 1 ? "" : "s"} in progress</SectionLabel>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.muted, cursor: "pointer" }}>
              <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
              Auto-refresh every 30s
            </label>
          </div>
          {games.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>No daily games in progress right now.</div>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {games.map((g) => {
              const isWhite = normalizeUsername(g.white?.split("/").pop()) === normalizeUsername(username);
              const toMove = g.turn === "white" ? g.white : g.black;
              const toMoveName = toMove?.split("/").pop();
              return (
                <div key={g.url} style={{ border: `1px solid ${T.border}`, borderRadius: 6, padding: 10 }}>
                  <Chessboard options={{ position: g.fen, allowDragging: false, boardStyle: { borderRadius: 4 } }} />
                  <div style={{ marginTop: 8, fontSize: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>{isWhite ? "You're White" : "You're Black"}</span>
                    <Pill color={T.gold}>{g.turn === (isWhite ? "white" : "black") ? "Your move" : "Waiting"}</Pill>
                  </div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>To move: {toMoveName}</div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
