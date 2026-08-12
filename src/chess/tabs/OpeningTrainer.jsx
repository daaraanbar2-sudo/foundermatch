import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { T, F } from "../theme.js";
import { Btn, Input, Card, SectionLabel, Spinner, ErrorBox, Pill } from "../ui.jsx";
import { loadRepertoire, saveRepertoire } from "../storage.js";
import { getRecentGames } from "../api.js";
import { normalizeUsername } from "../api.js";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function BuilderBoard({ onSave }) {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [moves, setMoves] = useState([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("white");

  function onDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) return false;
    try {
      const move = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      if (!move) return false;
      setMoves((m) => [...m, move.san]);
      setFen(chess.fen());
      return true;
    } catch {
      return false;
    }
  }

  function undo() {
    chess.undo();
    setMoves((m) => m.slice(0, -1));
    setFen(chess.fen());
  }

  function reset() {
    chess.reset();
    setMoves([]);
    setFen(chess.fen());
  }

  function save() {
    if (!name.trim() || moves.length === 0) return;
    onSave({ id: uid(), name: name.trim(), color, moves });
    setName("");
    reset();
  }

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ width: 320 }}>
        <Chessboard options={{ position: fen, onPieceDrop: onDrop, boardStyle: { borderRadius: 6 } }} />
      </div>
      <div style={{ flex: 1, minWidth: 240, display: "flex", flexDirection: "column", gap: 10 }}>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Line name, e.g. Italian Game — Main Line" />
        <div style={{ display: "flex", gap: 6 }}>
          {["white", "black"].map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              style={{
                flex: 1,
                padding: "8px 4px",
                fontSize: 12,
                borderRadius: 4,
                cursor: "pointer",
                textTransform: "capitalize",
                background: color === c ? "rgba(127,176,105,0.15)" : "none",
                border: `1px solid ${color === c ? T.accent : T.border}`,
                color: color === c ? T.accent : T.muted,
              }}
            >
              I play {c}
            </button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.muted, minHeight: 20, fontFamily: F.mono }}>{moves.join(" ") || "Play moves on the board to build the line…"}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn ghost small onClick={undo} disabled={moves.length === 0}>
            Undo
          </Btn>
          <Btn ghost small onClick={reset} disabled={moves.length === 0}>
            Clear
          </Btn>
          <Btn small onClick={save} disabled={!name.trim() || moves.length === 0}>
            Save line
          </Btn>
        </div>
      </div>
    </div>
  );
}

function DrillBoard({ line, onExit }) {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [idx, setIdx] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const userIsWhite = line.color === "white";

  function playBookMove(i) {
    const san = line.moves[i];
    if (!san) return;
    chess.move(san);
    setFen(chess.fen());
  }

  useEffect(() => {
    chess.reset();
    setIdx(0);
    setFeedback(null);
    if (!userIsWhite) playBookMove(0);
    setFen(chess.fen());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line]);

  function onDrop({ sourceSquare, targetSquare }) {
    if (!targetSquare) return false;
    const expected = line.moves[idx];
    if (!expected) return false;
    let move;
    try {
      move = chess.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
    } catch {
      return false;
    }
    if (!move) return false;
    if (move.san !== expected) {
      chess.undo();
      setFeedback({ ok: false, expected });
      setFen(chess.fen());
      return false;
    }
    setFeedback({ ok: true });
    setFen(chess.fen());
    const nextIdx = idx + 1;
    setIdx(nextIdx);
    if (nextIdx < line.moves.length) {
      setTimeout(() => {
        chess.move(line.moves[nextIdx]);
        setFen(chess.fen());
        setIdx(nextIdx + 1);
      }, 400);
    }
    return true;
  }

  const done = idx >= line.moves.length;

  return (
    <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
      <div style={{ width: 320 }}>
        <Chessboard options={{ position: fen, onPieceDrop: onDrop, boardOrientation: userIsWhite ? "white" : "black", boardStyle: { borderRadius: 6 } }} />
      </div>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{line.name}</div>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Playing as {line.color}. Play the book move on the board.</div>
        {feedback?.ok === false && (
          <div style={{ marginBottom: 12 }}>
            <ErrorBox>Not book — the line continues {feedback.expected}. Try again.</ErrorBox>
          </div>
        )}
        {done && (
          <div style={{ color: T.accent, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Line complete! ✓</div>
        )}
        <div style={{ fontFamily: F.mono, fontSize: 12, color: T.muted, marginBottom: 14 }}>{line.moves.join(" ")}</div>
        <Btn ghost small onClick={onExit}>
          ← Back to repertoire
        </Btn>
      </div>
    </div>
  );
}

function longestCommonPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

export default function OpeningTrainer({ username }) {
  const [lines, setLines] = useState(loadRepertoire());
  const [mode, setMode] = useState("list"); // list | build | drill
  const [drillLine, setDrillLine] = useState(null);
  const [deviation, setDeviation] = useState({ loading: false, rows: [], error: "" });

  function persist(next) {
    setLines(next);
    saveRepertoire(next);
  }

  function addLine(line) {
    persist([...lines, line]);
  }

  function removeLine(id) {
    persist(lines.filter((l) => l.id !== id));
  }

  async function runDeviationCheck() {
    if (!username) {
      setDeviation({ loading: false, rows: [], error: "Set your chess.com username on the Dashboard tab first." });
      return;
    }
    setDeviation({ loading: true, rows: [], error: "" });
    try {
      const games = await getRecentGames(username, { months: 2, limit: 20 });
      const u = normalizeUsername(username);
      const rows = [];
      for (const g of games) {
        const isWhite = normalizeUsername(g.white?.username) === u;
        const chess = new Chess();
        try {
          chess.loadPgn(g.pgn);
        } catch {
          continue;
        }
        const san = chess.history();
        const mySan = isWhite ? san.filter((_, i) => i % 2 === 0) : san.filter((_, i) => i % 2 === 1);
        const candidateLines = lines.filter((l) => l.color === (isWhite ? "white" : "black"));
        let best = null;
        for (const l of candidateLines) {
          const prefix = longestCommonPrefix(mySan, l.moves);
          if (prefix > 0 && (!best || prefix > best.prefix)) best = { line: l, prefix };
        }
        if (!best) continue;
        const followedFull = best.prefix >= best.line.moves.length;
        rows.push({
          url: g.url,
          opponent: isWhite ? g.black?.username : g.white?.username,
          color: isWhite ? "White" : "Black",
          lineName: best.line.name,
          followedFull,
          deviatedAt: followedFull ? null : best.prefix + 1,
          played: followedFull ? null : mySan[best.prefix],
          book: followedFull ? null : best.line.moves[best.prefix],
        });
      }
      setDeviation({ loading: false, rows, error: "" });
    } catch {
      setDeviation({ loading: false, rows: [], error: "Couldn't load your games right now." });
    }
  }

  if (mode === "drill" && drillLine) {
    return (
      <Card>
        <DrillBoard line={drillLine} onExit={() => setMode("list")} />
      </Card>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <Card>
        <SectionLabel>{mode === "build" ? "Add a repertoire line" : "Your repertoire"}</SectionLabel>
        {mode === "list" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <Btn small onClick={() => setMode("build")}>
                + Add a line
              </Btn>
            </div>
            {lines.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>No lines saved yet. Build one from moves you want to memorize.</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {lines.map((l) => (
                <div key={l.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 4px", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, fontFamily: F.mono }}>
                      <Pill>{l.color}</Pill> {l.moves.join(" ")}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn small ghost onClick={() => { setDrillLine(l); setMode("drill"); }}>
                      Drill
                    </Btn>
                    <Btn small ghost onClick={() => removeLine(l.id)} style={{ color: T.danger, borderColor: T.danger }}>
                      Delete
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {mode === "build" && (
          <>
            <div style={{ marginBottom: 14 }}>
              <Btn small ghost onClick={() => setMode("list")}>
                ← Back
              </Btn>
            </div>
            <BuilderBoard onSave={(l) => { addLine(l); setMode("list"); }} />
          </>
        )}
      </Card>

      <Card>
        <SectionLabel>Deviation check</SectionLabel>
        <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>
          Compares your recent games against your saved repertoire to show exactly where you left the book.
        </div>
        <Btn onClick={runDeviationCheck} disabled={deviation.loading}>
          {deviation.loading ? "Checking…" : "Check my recent games"}
        </Btn>
        {deviation.error && (
          <div style={{ marginTop: 12 }}>
            <ErrorBox>{deviation.error}</ErrorBox>
          </div>
        )}
        {deviation.loading && <Spinner label="Comparing games to your repertoire…" />}
        {!deviation.loading && deviation.rows.length > 0 && (
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 2 }}>
            {deviation.rows.map((r) => (
              <div key={r.url} style={{ padding: "9px 4px", borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>
                    <Pill>{r.color}</Pill> vs {r.opponent} — <em>{r.lineName}</em>
                  </span>
                </div>
                {r.followedFull ? (
                  <div style={{ color: T.accent, fontSize: 12, marginTop: 4 }}>Followed the full line ✓</div>
                ) : (
                  <div style={{ color: T.warn, fontSize: 12, marginTop: 4 }}>
                    Left book at move {Math.ceil(r.deviatedAt / 2)} — played <strong>{r.played}</strong>, book has <strong>{r.book}</strong>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
