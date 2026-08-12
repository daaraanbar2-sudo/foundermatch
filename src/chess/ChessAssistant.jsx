import { useState } from "react";
import { T, F } from "./theme.js";
import { loadUsername, saveUsername } from "./storage.js";
import Dashboard from "./tabs/Dashboard.jsx";
import GameAnalysis from "./tabs/GameAnalysis.jsx";
import OpponentPrep from "./tabs/OpponentPrep.jsx";
import OpeningTrainer from "./tabs/OpeningTrainer.jsx";
import Spectator from "./tabs/Spectator.jsx";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "analysis", label: "Game Analysis" },
  { id: "prep", label: "Opponent Prep" },
  { id: "trainer", label: "Opening Trainer" },
  { id: "spectator", label: "Spectator" },
];

export default function ChessAssistant() {
  const [tab, setTab] = useState("dashboard");
  const [username, setUsernameState] = useState(loadUsername());
  const [selectedGame, setSelectedGame] = useState(null);

  function setUsername(u) {
    setUsernameState(u);
    saveUsername(u);
  }

  function openGameInAnalysis(game) {
    setSelectedGame(game);
    setTab("analysis");
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: F.body }}>
      <style>{`
        @keyframes chess-spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>

      <header style={{ borderBottom: `1px solid ${T.border}`, background: T.panel }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>♞</span>
            <div>
              <div style={{ fontFamily: F.display, fontSize: 20, letterSpacing: "0.01em" }}>Chess Companion</div>
              <div style={{ fontSize: 11, color: T.muted }}>Post-game analysis &amp; prep for chess.com — not for use during live games</div>
            </div>
          </div>
          <nav style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  background: tab === t.id ? "rgba(127,176,105,0.14)" : "none",
                  color: tab === t.id ? T.accent : T.muted,
                  border: `1px solid ${tab === t.id ? T.accent : "transparent"}`,
                  padding: "8px 14px",
                  borderRadius: 5,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: F.body,
                }}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 60px" }}>
        {tab === "dashboard" && <Dashboard username={username} setUsername={setUsername} onOpenGame={openGameInAnalysis} />}
        {tab === "analysis" && <GameAnalysis username={username} initialGame={selectedGame} />}
        {tab === "prep" && <OpponentPrep />}
        {tab === "trainer" && <OpeningTrainer username={username} />}
        {tab === "spectator" && <Spectator />}
      </main>

      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "20px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", fontSize: 11, color: T.muted, lineHeight: 1.7 }}>
          Uses the public chess.com Published-Data API. All analysis here runs on completed games — this tool never
          suggests moves during a game in progress, which chess.com's Fair Play policy prohibits and can get an
          account banned. Engine analysis runs locally in your browser (Stockfish via WebAssembly, GPL-3.0).
        </div>
      </footer>
    </div>
  );
}
