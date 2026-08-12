const USERNAME_KEY = "chessAssistant.username";
const REPERTOIRE_KEY = "chessAssistant.repertoire";

export function loadUsername() {
  return localStorage.getItem(USERNAME_KEY) || "";
}
export function saveUsername(u) {
  localStorage.setItem(USERNAME_KEY, u);
}

// A repertoire is a flat list of lines: { id, name, color, moves: ["e4","e5","Nf3",...] }
export function loadRepertoire() {
  try {
    const raw = localStorage.getItem(REPERTOIRE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
export function saveRepertoire(lines) {
  localStorage.setItem(REPERTOIRE_KEY, JSON.stringify(lines));
}
