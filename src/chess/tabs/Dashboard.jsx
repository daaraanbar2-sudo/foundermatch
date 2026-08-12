import { useState } from "react";
import { T, F } from "../theme.js";
import { Btn, Input, Card, SectionLabel, Spinner, ErrorBox, Pill } from "../ui.jsx";
import { getProfile, getStats, getRecentGames, resultLabel } from "../api.js";

function StatRow({ label, stats }) {
  if (!stats) return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
      <span style={{ color: T.muted, fontSize: 13 }}>{label}</span>
      <div style={{ display: "flex", gap: 14, fontSize: 13 }}>
        <span>
          <strong style={{ color: T.gold }}>{stats.last?.rating ?? "—"}</strong> rating
        </span>
        <span style={{ color: T.muted }}>
          {stats.record?.win ?? 0}W / {stats.record?.loss ?? 0}L / {stats.record?.draw ?? 0}D
        </span>
        {stats.best?.rating && <span style={{ color: T.muted }}>best {stats.best.rating}</span>}
      </div>
    </div>
  );
}

export default function Dashboard({ username, setUsername, onOpenGame }) {
  const [input, setInput] = useState(username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [games, setGames] = useState([]);

  async function load(u) {
    if (!u.trim()) return;
    setLoading(true);
    setError("");
    try {
      const [p, s, g] = await Promise.all([getProfile(u), getStats(u), getRecentGames(u, { months: 2, limit: 15 })]);
      setProfile(p);
      setStats(s);
      setGames(g);
      setUsername(u.trim());
    } catch (e) {
      setError(e.message === "not_found" ? "No chess.com player found with that username." : "Couldn't reach chess.com. Try again in a moment.");
      setProfile(null);
      setStats(null);
      setGames([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Card>
        <SectionLabel>Your chess.com username</SectionLabel>
        <div style={{ display: "flex", gap: 10 }}>
          <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && load(input)} placeholder="e.g. hikaru" />
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

      {loading && <Spinner label="Fetching your chess.com data…" />}

      {profile && !loading && (
        <>
          <Card style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {profile.avatar && <img src={profile.avatar} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover" }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{profile.name || profile.username}</div>
              <div style={{ color: T.muted, fontSize: 13 }}>@{profile.username}</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {profile.title && <Pill color={T.gold}>{profile.title}</Pill>}
                {profile.country && <Pill>{profile.country.split("/").pop()}</Pill>}
                <Pill>{profile.followers ?? 0} followers</Pill>
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Ratings</SectionLabel>
            <StatRow label="Rapid" stats={stats?.chess_rapid} />
            <StatRow label="Blitz" stats={stats?.chess_blitz} />
            <StatRow label="Bullet" stats={stats?.chess_bullet} />
            <StatRow label="Daily" stats={stats?.chess_daily} />
          </Card>

          <Card>
            <SectionLabel>Recent games</SectionLabel>
            {games.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>No recent games found.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {games.map((g) => {
                const { isWhite, them, outcome } = resultLabel(g, username || input);
                const color = outcome === "win" ? T.accent : outcome === "loss" ? T.danger : T.muted;
                return (
                  <div
                    key={g.url}
                    onClick={() => onOpenGame(g)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px 4px",
                      borderBottom: `1px solid ${T.border}`,
                      cursor: "pointer",
                    }}
                  >
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12 }}>{isWhite ? "⚪" : "⚫"}</span>
                      <span style={{ fontSize: 13 }}>vs {them?.username || "?"}</span>
                      <Pill>{g.time_class}</Pill>
                    </div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color, fontWeight: 700, textTransform: "uppercase" }}>{outcome}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>Analyze →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
