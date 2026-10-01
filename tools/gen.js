// Generates puzzles.json: for each hand-made puzzle, finds a tiling of a hex board by word paths
// and keeps only layouts whose full solution is UNIQUE (checked by exhaustive exact-cover search).
const fs = require("fs"), path = require("path");
const { W, boardCells, adjacency } = require("./hex");
const { countSolutions } = require("./solver");
const PUZ = require("./puzzles");
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function shuffle(a, rand) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function partition(n, lengths, rand) {
  const { cells } = boardCells(n), adj = adjacency(cells), owner = Array(n).fill(-1);
  const paths = []; let budget = 300000;
  function compsOk(rem) {
    const seen = Array(n).fill(false);
    const sums = new Set([0]); for (const L of rem) for (const s of [...sums]) sums.add(s + L);
    const minL = Math.min(...rem);
    for (let i = 0; i < n; i++) if (owner[i] < 0 && !seen[i]) {
      let sz = 0; const st = [i]; seen[i] = true;
      while (st.length) { const x = st.pop(); sz++; for (const y of adj[x]) if (owner[y] < 0 && !seen[y]) { seen[y] = true; st.push(y); } }
      if (sz < minL || !sums.has(sz)) return false;
    }
    return true;
  }
  function rec(rem) {
    if (!rem.length) return true;
    if (--budget < 0) return false;
    let x = -1, best = 99;
    for (let i = 0; i < n; i++) if (owner[i] < 0) { const d = adj[i].filter(j => owner[j] < 0).length + rand() * 0.5; if (d < best) { best = d; x = i; } }
    const lens = shuffle([...new Set(rem)], rand);
    for (const k of lens) {
      const rest = rem.slice(); rest.splice(rest.indexOf(k), 1);
      let tries = 0;
      const p = [x]; owner[x] = paths.length;
      const ok = (function dfs() {
        if (p.length === k) {
          if (++tries > 25) return false;
          paths.push(p.slice());
          if ((rest.length === 0 || compsOk(rest)) && rec(rest)) return true;
          paths.pop(); return false;
        }
        const last = p[p.length - 1];
        for (const y of shuffle(adj[last].filter(j => owner[j] < 0), rand)) {
          owner[y] = paths.length; p.push(y);
          if (dfs()) return true;
          p.pop(); owner[y] = -1;
          if (tries > 25 || budget < 0) break;
        }
        return false;
      })();
      if (ok) return true;
      owner[x] = -1;
      if (budget < 0) return false;
    }
    return false;
  }
  return rec(lengths.slice()) ? { cells, paths } : null;
}

const out = [];
PUZ.forEach((cats, pi) => {
  const words = []; cats.forEach((c, ci) => c.words.forEach(w => words.push({ cat: ci, word: w })));
  const n = words.reduce((a, w) => a + w.word.length, 0);
  let chosen = null, attempts = 0, lastCount = null;
  for (let seed = 1; seed < 400 && !chosen; seed++) {
    const rand = rng(pi * 1000 + seed);
    const part = partition(n, words.map(w => w.word.length), rand);
    if (!part) continue;
    attempts++;
    // assign words to paths of matching length, random direction
    const byLen = {}; part.paths.forEach(p => (byLen[p.length] = byLen[p.length] || []).push(p));
    Object.values(byLen).forEach(a => shuffle(a, rand));
    const letters = Array(n).fill("");
    const placed = words.map(w => { let p = byLen[w.word.length].pop(); if (rand() < 0.5) p = p.slice().reverse(); p.forEach((ci, i) => letters[ci] = w.word[i]); return { cat: w.cat, word: w.word, path: p }; });
    const board = { n, rows: boardCells(n).rows, cells: part.cells.map((c, i) => ({ r: c.r, c: c.c, ch: letters[i] })), words: placed };
    lastCount = countSolutions(board, 2);
    if (lastCount === 1) chosen = board;
  }
  if (!chosen) throw new Error(`Puzzle ${pi + 1}: no unique layout found (last count ${lastCount})`);
  out.push({ cats: cats.map(c => c.name), rows: chosen.rows, cells: chosen.cells.map(c => [c.r, c.c, c.ch]), words: chosen.words.map(w => [w.cat, w.word, w.path]) });
  console.log(`P${pi + 1}: ${n} tiles, ${words.length} words, ${chosen.rows} rows, layouts tried ${attempts}`);
});
fs.writeFileSync(path.join(__dirname, "puzzles.json"), JSON.stringify(out));
