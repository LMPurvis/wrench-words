// Exhaustive exact-cover solver: counts how many ways ALL answers can be traced so that every tile
// is used exactly once, each answer starting on a shaded tile (first letters). Stops at `limit`.
const { isAdj } = require("./hex");
function countSolutions(board, limit) {
  const cells = board.cells, n = cells.length;
  const adj = cells.map(a => cells.map((b, j) => isAdj(a, b) ? j : -1).filter(j => j >= 0));
  const shaded = new Set(board.words.map(w => w.path[0]));
  // all candidate paths for each word, starting on any shaded tile
  const cands = board.words.map(w => {
    const res = [];
    for (const s of shaded) if (cells[s].ch === w.word[0]) {
      const p = [s], used = new Set([s]);
      (function dfs() {
        if (p.length === w.word.length) { res.push(p.slice()); return; }
        for (const y of adj[p[p.length - 1]]) if (!used.has(y) && cells[y].ch === w.word[p.length]) { used.add(y); p.push(y); dfs(); p.pop(); used.delete(y); }
      })();
    }
    return res;
  });
  if (cands.some(c => c.length === 0)) return 0;
  const usedCell = Array(n).fill(false), usedStart = new Set();
  let count = 0;
  const order = board.words.map((_, i) => i).sort((a, b) => cands[a].length - cands[b].length);
  (function rec(k) {
    if (count >= limit) return;
    if (k === order.length) { if (usedCell.every(Boolean)) count++; return; }
    for (const p of cands[order[k]]) {
      if (usedStart.has(p[0]) || p.some(c => usedCell[c])) continue;
      p.forEach(c => usedCell[c] = true); usedStart.add(p[0]);
      rec(k + 1);
      p.forEach(c => usedCell[c] = false); usedStart.delete(p[0]);
      if (count >= limit) return;
    }
  })(0);
  return count;
}
module.exports = { countSolutions };
