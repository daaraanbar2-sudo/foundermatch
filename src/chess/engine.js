// Wrapper around a Stockfish UCI engine running in a Web Worker.
// Used only for POST-GAME analysis (finding blunders in games that already
// ended) and for the opening trainer's legality checks — never to suggest
// moves during a game in progress.

const ENGINE_URL = "/engine/stockfish-18-lite-single.js";

export class Engine {
  constructor() {
    this.worker = null;
    this.ready = null;
    this.busy = false;
    this.queue = [];
  }

  init() {
    if (this.ready) return this.ready;
    this.ready = new Promise((resolve, reject) => {
      try {
        this.worker = new Worker(ENGINE_URL);
      } catch (err) {
        reject(err);
        return;
      }
      const onMessage = (e) => {
        const line = typeof e.data === "string" ? e.data : "";
        if (line === "uciok") {
          this.worker.postMessage("isready");
        } else if (line === "readyok") {
          this.worker.removeEventListener("message", onMessage);
          resolve();
        }
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.onerror = (e) => reject(e);
      this.worker.postMessage("uci");
    });
    return this.ready;
  }

  terminate() {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    this.ready = null;
  }

  // Analyze a FEN to a given depth. Resolves with the evaluation from
  // WHITE's perspective: { cp: number|null, mate: number|null, bestMove, pv }
  async evaluate(fen, { depth = 14 } = {}) {
    await this.init();
    return this._enqueue(() => this._runEval(fen, depth));
  }

  _enqueue(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this._drain();
    });
  }

  async _drain() {
    if (this.busy) return;
    const next = this.queue.shift();
    if (!next) return;
    this.busy = true;
    try {
      const result = await next.task();
      next.resolve(result);
    } catch (err) {
      next.reject(err);
    } finally {
      this.busy = false;
      this._drain();
    }
  }

  _runEval(fen, depth) {
    const sideToMove = fen.split(" ")[1] === "b" ? "b" : "w";
    return new Promise((resolve) => {
      let latest = { cp: null, mate: null, pv: "" };
      const onMessage = (e) => {
        const line = typeof e.data === "string" ? e.data : "";
        if (line.startsWith("info") && line.includes(" score ")) {
          const mateMatch = line.match(/score mate (-?\d+)/);
          const cpMatch = line.match(/score cp (-?\d+)/);
          const pvMatch = line.match(/ pv (.+)$/);
          if (mateMatch) latest = { cp: null, mate: Number(mateMatch[1]), pv: pvMatch?.[1] || latest.pv };
          else if (cpMatch) latest = { cp: Number(cpMatch[1]), mate: null, pv: pvMatch?.[1] || latest.pv };
        } else if (line.startsWith("bestmove")) {
          this.worker.removeEventListener("message", onMessage);
          const bestMove = line.split(" ")[1];
          // UCI scores are from the side-to-move's perspective; flip to White's.
          const sign = sideToMove === "w" ? 1 : -1;
          resolve({
            cp: latest.cp != null ? latest.cp * sign : null,
            mate: latest.mate != null ? latest.mate * sign : null,
            bestMove: bestMove === "(none)" ? null : bestMove,
            pv: latest.pv,
          });
        }
      };
      this.worker.addEventListener("message", onMessage);
      this.worker.postMessage("ucinewgame");
      this.worker.postMessage(`position fen ${fen}`);
      this.worker.postMessage(`go depth ${depth}`);
    });
  }
}

let sharedEngine = null;
export function getEngine() {
  if (!sharedEngine) sharedEngine = new Engine();
  return sharedEngine;
}

// Converts a White-perspective centipawn/mate score to a 0-100 "win probability"
// style bar value, matching the common chess-site eval-bar convention.
export function evalToBarPercent({ cp, mate }) {
  if (mate != null) return mate > 0 ? 100 : 0;
  if (cp == null) return 50;
  const clamped = Math.max(-1000, Math.min(1000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.004 * clamped)) - 1);
}

export function formatEval({ cp, mate }) {
  if (mate != null) return `#${Math.abs(mate)}`;
  if (cp == null) return "—";
  return (cp / 100).toFixed(2);
}
