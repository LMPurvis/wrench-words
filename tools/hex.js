// Hex board geometry (pointy-top hexes, "odd-r" offset rows) shared by generator and validator.
const W = 8;
function boardCells(n) {
  // Full rows of W; the last partial row is centered.
  const cells = [], rows = Math.ceil(n / W);
  for (let r = 0; r < rows; r++) {
    const k = r < rows - 1 ? W : n - W * (rows - 1), off = Math.floor((W - k) / 2);
    for (let c = off; c < off + k; c++) cells.push({ r, c });
  }
  return { rows, cells };
}
function isAdj(a, b) {
  const dr = b.r - a.r, dc = b.c - a.c;
  if (dr === 0) return Math.abs(dc) === 1;
  if (Math.abs(dr) !== 1) return false;
  return (a.r % 2 === 0) ? (dc === -1 || dc === 0) : (dc === 0 || dc === 1);
}
function adjacency(cells) { return cells.map(a => cells.map((b, j) => isAdj(a, b) ? j : -1).filter(j => j >= 0)); }
module.exports = { W, boardCells, isAdj, adjacency };
