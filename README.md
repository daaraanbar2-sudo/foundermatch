# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Chess Companion (`/chess`)

A standalone chess.com companion, isolated from the main app — separate route, separate code
under `src/chess/`, no shared state. Run `npm run dev` and visit `/chess`.

It intentionally does **not** suggest moves during a live game — that's against chess.com's
Fair Play policy and can get an account banned. Everything here operates on completed games or
pre-game prep instead:

- **Dashboard** — your chess.com profile, ratings, and recent games.
- **Game Analysis** — pick a finished game (or paste a PGN) and step through it with a local
  Stockfish engine (WebAssembly, runs in your browser via a Web Worker) flagging blunders,
  mistakes, and inaccuracies, plus a per-side accuracy score.
- **Opponent Prep** — look up an upcoming opponent's public stats and most-played openings
  before you sit down to play, the same way you'd study a database.
- **Opening Trainer** — build and save opening lines, drill them against move validation, and
  run a "deviation check" against your own recent games to see exactly where you left book.
- **Spectator** — chess.com's public API only exposes in-progress **Daily (correspondence)**
  games; live Rapid/Blitz/Bullet games aren't available for spectating through it, so this tab
  is scoped to Daily games only.

Data comes from the public, unauthenticated [chess.com Published-Data
API](https://www.chess.com/news/view/published-data-api). `api/chess-proxy.js` is a small Vercel
function that forwards requests server-side (adds a proper User-Agent, sidesteps any CORS
issues); the client tries a direct fetch first and falls back to it automatically.

The bundled engine (`public/engine/`) is Stockfish 18 (single-threaded WASM build), licensed
GPL-3.0.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
