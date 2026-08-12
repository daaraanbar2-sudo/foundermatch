import { Fragment, useEffect, useRef, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { T, F } from "../theme.js";
import { Btn, Input, Card, SectionLabel, Spinner, ErrorBox, Pill } from "../ui.jsx";
import { getRecentGames } from "../api.js";
import { getEngine, evalToBarPercent, formatEval } from "../engine.js";
import { buildReport, CLASS_META } from "../analysis.js";

const DEPTH_OPTIONS = [
  { id: 10, label: "Fast" },
  { id: 14, label: "Balanced" },
  { id: 18, label: "Deep (slow)" },
];

function parseGame(pgn) {
  const chess = new Chess();
  chess.loadPgn(pgn);
  const headers = chess.header();
  const moves = chess.history({ verbose: true });
  const fens = [new Chess().fen(), ...moves.map((m) => m.after)];
  return { headers, moves, fens };
}

export default function GameAnalysis({ username, initialGame }) {
  const [pgnText, setPgnText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [parseError, setParseError] = useState("");
  const [ply, setPly] = useState(0);
  const [evals, setEvals] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [depth, setDepth] = useState(14);
  const [picker, setPicker] = useState({ open: false, loading: false, games: [], error: "" });
  const cancelRef = useRef(false);

  useEffect(() => {
    if (initialGame?.pgn) loadPgn(initialGame.pgn);
  }, [initialGame]);

  useEffect(() => () => (cancelRef.current = true), []);

  function loadPgn(pgn) {
    try {
      const p = parseGame(pgn);
      setParsed(p);
      setPgnText(pgn);
      setPly(p.moves.length > 0 ? 1 : 0);
      setEvals([]);
      setParseError("");
    } catch {
      setParseError("Couldn't parse that PGN. Make sure it's a full, valid game.");
    }
  }

  async function openPicker() {
    setPicker({ open: true, loading: true, games: [], error: "" });
    try {
      const games = await getRecentGames(username, { months: 3, limit: 25 });
      setPicker({ open: true, loading: false, games, error: "" });
    } catch {
      setPicker({ open: true, loading: false, games: [], error: "Couldn't load your games. Set your username on the Dashboard tab first." });
    }
  }

  async function runAnalysis() {
    if (!parsed) return;
    cancelRef.current = false;
    setAnalyzing(true);
    setProgress(0);
    const engine = getEngine();
    const results = [];
    try {
      for (let i = 0; i < parsed.fens.length; i++) {
        if (cancelRef.current) return;
        const ev = await engine.evaluate(parsed.fens[i], { depth });
        results.push(ev);
        setProgress(Math.round(((i + 1) / parsed.fens.length) * 100));
      }
      if (!cancelRef.current) setEvals(results);
    } finally {
      if (!cancelRef.current) setAnalyzing(false);
    }
  }

  const report = evals.length > 0 ? buildReport(evals) : null;
  const currentEval = evals[ply];
  const barPct = currentEval ? evalToBarPercent(currentEval) : 50;
  const moveInfo = report?.moves[ply - 1];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      {!parsed && (
        <Card>
          <SectionLabel>Load a game to review</SectionLabel>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <Btn onClick={openPicker}>Pick from my recent games</Btn>
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>...or paste a PGN directly:</div>
          <textarea
            value={pgnText}
            onChange={(e) => setPgnText(e.target.value)}
            placeholder="[Event &quot;...&quot;]&#10;1. e4 e5 2. Nf3 ..."
            style={{
              width: "100%",
              minHeight: 120,
              background: T.panel2,
              border: `1px solid ${T.border}`,
              color: T.text,
              borderRadius: 5,
              padding: 12,
              fontFamily: F.mono,
              fontSize: 12,
              resize: "vertical",
            }}
          />
          <div style={{ marginTop: 10 }}>
            <Btn onClick={() => loadPgn(pgnText)} disabled={!pgnText.trim()}>
              Load PGN
            </Btn>
          </div>
          {parseError && (
            <div style={{ marginTop: 10 }}>
              <ErrorBox>{parseError}</ErrorBox>
            </div>
          )}

          {picker.open && (
            <div style={{ marginTop: 16, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
              {picker.loading && <Spinner label="Loading recent games…" />}
              {picker.error && <ErrorBox>{picker.error}</ErrorBox>}
              {!picker.loading &&
                picker.games.map((g) => (
                  <div
                    key={g.url}
                    onClick={() => loadPgn(g.pgn)}
                    style={{ padding: "9px 4px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", fontSize: 13, display: "flex", justifyContent: "space-between" }}
                  >
                    <span>
                      {g.white?.username} vs {g.black?.username}
                    </span>
                    <span style={{ color: T.muted }}>
                      {g.time_class} · {new Date(g.end_time * 1000).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Card>
      )}

      {parsed && (
        <>
          <Card style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 13 }}>
              <strong>{parsed.headers.White}</strong> ({parsed.headers.WhiteElo || "?"}) vs <strong>{parsed.headers.Black}</strong> ({parsed.headers.BlackElo || "?"})
              <span style={{ color: T.muted, marginLeft: 10 }}>{parsed.headers.Result}</span>
            </div>
            <Btn ghost small onClick={() => { setParsed(null); setEvals([]); setPgnText(""); setPicker({ open: false, loading: false, games: [], error: "" }); }}>
              Load a different game
            </Btn>
          </Card>

          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 320px", gap: 22 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", width: 18, borderRadius: 4, overflow: "hidden", border: `1px solid ${T.border}` }}>
                <div style={{ background: T.text, height: `${100 - barPct}%`, transition: "height 0.2s" }} />
                <div style={{ background: "#2a2a2a", height: `${barPct}%`, transition: "height 0.2s" }} />
              </div>
              <div style={{ flex: 1, maxWidth: 520 }}>
                <Chessboard
                  options={{
                    position: parsed.fens[ply],
                    allowDragging: false,
                    boardStyle: { borderRadius: 6 },
                  }}
                />
                <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
                  <Btn ghost small onClick={() => setPly(0)} disabled={ply === 0}>
                    ⏮
                  </Btn>
                  <Btn ghost small onClick={() => setPly((p) => Math.max(0, p - 1))} disabled={ply === 0}>
                    ← Prev
                  </Btn>
                  <Btn ghost small onClick={() => setPly((p) => Math.min(parsed.moves.length, p + 1))} disabled={ply === parsed.moves.length}>
                    Next →
                  </Btn>
                  <Btn ghost small onClick={() => setPly(parsed.moves.length)} disabled={ply === parsed.moves.length}>
                    ⏭
                  </Btn>
                </div>
                {currentEval && (
                  <div style={{ textAlign: "center", marginTop: 10, fontFamily: F.mono, fontSize: 14, color: T.gold }}>
                    Eval: {formatEval(currentEval)}
                    {moveInfo?.classification !== "ok" && moveInfo && (
                      <span style={{ marginLeft: 10, color: CLASS_META[moveInfo.classification].color }}>
                        {CLASS_META[moveInfo.classification].symbol} {CLASS_META[moveInfo.classification].label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card>
                <SectionLabel>Engine analysis</SectionLabel>
                {!analyzing && evals.length === 0 && (
                  <>
                    <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                      {DEPTH_OPTIONS.map((d) => (
                        <button
                          key={d.id}
                          onClick={() => setDepth(d.id)}
                          style={{
                            flex: 1,
                            padding: "8px 4px",
                            fontSize: 11,
                            borderRadius: 4,
                            cursor: "pointer",
                            background: depth === d.id ? "rgba(127,176,105,0.15)" : "none",
                            border: `1px solid ${depth === d.id ? T.accent : T.border}`,
                            color: depth === d.id ? T.accent : T.muted,
                          }}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <Btn onClick={runAnalysis} style={{ width: "100%" }}>
                      Analyze full game
                    </Btn>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>Runs Stockfish locally in your browser. Deeper = slower but more accurate.</div>
                  </>
                )}
                {analyzing && (
                  <div>
                    <div style={{ height: 6, background: T.panel2, borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                      <div style={{ width: `${progress}%`, height: "100%", background: T.accent, transition: "width 0.15s" }} />
                    </div>
                    <div style={{ fontSize: 12, color: T.muted }}>Analyzing… {progress}%</div>
                  </div>
                )}
                {report && !analyzing && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>White accuracy</span>
                      <strong style={{ color: T.accent }}>{report.accuracy.white?.toFixed(1)}%</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                      <span>Black accuracy</span>
                      <strong style={{ color: T.accent }}>{report.accuracy.black?.toFixed(1)}%</strong>
                    </div>
                    <div style={{ display: "flex", gap: 10, fontSize: 11, color: T.muted, marginTop: 6 }}>
                      <span>?? {report.moves.filter((m) => m.classification === "blunder").length} blunders</span>
                      <span>? {report.moves.filter((m) => m.classification === "mistake").length} mistakes</span>
                      <span>?! {report.moves.filter((m) => m.classification === "inaccuracy").length} inaccuracies</span>
                    </div>
                  </div>
                )}
              </Card>

              <Card style={{ maxHeight: 420, overflowY: "auto" }}>
                <SectionLabel>Moves</SectionLabel>
                <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr", rowGap: 2, fontSize: 13, fontFamily: F.mono }}>
                  {Array.from({ length: Math.ceil(parsed.moves.length / 2) }).map((_, i) => {
                    const whiteIdx = i * 2;
                    const blackIdx = i * 2 + 1;
                    const wMove = parsed.moves[whiteIdx];
                    const bMove = parsed.moves[blackIdx];
                    const wCls = report?.moves[whiteIdx]?.classification;
                    const bCls = report?.moves[blackIdx]?.classification;
                    return (
                      <Fragment key={i}>
                        <div style={{ color: T.muted, padding: "4px 0" }}>
                          {i + 1}.
                        </div>
                        <div
                          key={`w${i}`}
                          onClick={() => setPly(whiteIdx + 1)}
                          style={{
                            padding: "4px 6px",
                            cursor: "pointer",
                            borderRadius: 3,
                            background: ply === whiteIdx + 1 ? "rgba(127,176,105,0.18)" : "none",
                            color: wCls && wCls !== "ok" ? CLASS_META[wCls].color : T.text,
                          }}
                        >
                          {wMove?.san}
                          {wCls && wCls !== "ok" ? ` ${CLASS_META[wCls].symbol}` : ""}
                        </div>
                        <div
                          key={`b${i}`}
                          onClick={() => bMove && setPly(blackIdx + 1)}
                          style={{
                            padding: "4px 6px",
                            cursor: bMove ? "pointer" : "default",
                            borderRadius: 3,
                            background: ply === blackIdx + 1 ? "rgba(127,176,105,0.18)" : "none",
                            color: bCls && bCls !== "ok" ? CLASS_META[bCls].color : T.text,
                          }}
                        >
                          {bMove?.san}
                          {bCls && bCls !== "ok" ? ` ${CLASS_META[bCls].symbol}` : ""}
                        </div>
                      </Fragment>
                    );
                  })}
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
