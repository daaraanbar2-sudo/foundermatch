// Pure helpers for turning a sequence of engine evaluations into
// move classifications and an accuracy score. Methodology mirrors the
// common "win% swing" approach used by lichess's local analysis.

export function winPercent(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * cp)) - 1);
}

// Collapses a {cp, mate} score (White's perspective) into one comparable number.
export function scoreValue({ cp, mate }) {
  if (mate != null) return mate > 0 ? 100000 - mate : -100000 - mate;
  return cp ?? 0;
}

export function moveAccuracy(winPctBefore, winPctAfter) {
  const drop = Math.max(0, winPctBefore - winPctAfter);
  const acc = 103.1668 * Math.exp(-0.04354 * drop) - 3.1669;
  return Math.max(0, Math.min(100, acc));
}

export function classifyMove(cpLoss) {
  if (cpLoss >= 200) return "blunder";
  if (cpLoss >= 100) return "mistake";
  if (cpLoss >= 50) return "inaccuracy";
  return "ok";
}

export const CLASS_META = {
  blunder: { label: "Blunder", symbol: "??", color: "#ff5f5f" },
  mistake: { label: "Mistake", symbol: "?", color: "#ff9e6b" },
  inaccuracy: { label: "Inaccuracy", symbol: "?!", color: "#ffd76b" },
  ok: { label: "", symbol: "", color: "" },
};

// evals: array of {cp, mate} from White's perspective, one per ply (index 0
// = starting position, index i = position after ply i has been played).
// Returns per-move classification + overall accuracy for each side.
export function buildReport(evals) {
  const moves = [];
  let whiteAccSum = 0, whiteAccCount = 0;
  let blackAccSum = 0, blackAccCount = 0;

  for (let i = 1; i < evals.length; i++) {
    const before = evals[i - 1];
    const after = evals[i];
    const whiteMoved = i % 2 === 1;

    const wpBefore = winPercent(scoreValue(before));
    const wpAfter = winPercent(scoreValue(after));

    // Convert to the mover's own perspective (0-100, higher = better for mover).
    const moverWpBefore = whiteMoved ? wpBefore : 100 - wpBefore;
    const moverWpAfter = whiteMoved ? wpAfter : 100 - wpAfter;

    const acc = moveAccuracy(moverWpBefore, moverWpAfter);
    const rawSwing = whiteMoved
      ? scoreValue(before) - scoreValue(after)
      : scoreValue(after) - scoreValue(before);
    const cpLoss = Math.max(0, rawSwing);

    const cls = classifyMove(cpLoss);
    moves.push({ ply: i, whiteMoved, cpLoss, accuracy: acc, classification: cls });

    if (whiteMoved) { whiteAccSum += acc; whiteAccCount++; }
    else { blackAccSum += acc; blackAccCount++; }
  }

  return {
    moves,
    accuracy: {
      white: whiteAccCount ? whiteAccSum / whiteAccCount : null,
      black: blackAccCount ? blackAccSum / blackAccCount : null,
    },
  };
}
