// Validates the PUZZLES embedded in ../index.html against the hand-made source (puzzles.js).
const fs = require("fs"), path = require("path");
const { isAdj, W } = require("./hex");
const { countSolutions } = require("./solver");
const SRC = require("./puzzles");
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const m = html.match(/\/\*PUZZLES_START\*\/([\s\S]*?)\/\*PUZZLES_END\*\//);
if (!m) { console.error("PUZZLES block not found"); process.exit(1); }
const PZ = JSON.parse(m[1]), errs = [];
if (PZ.length < 30) errs.push("only " + PZ.length + " puzzles");
const allAnswers = [];
PZ.forEach((p, pi) => {
  const tag = "Puzzle " + (pi + 1), src = SRC[pi];
  const cells = p.cells.map(([r, c, ch]) => ({ r, c, ch }));
  // board shape
  const keys = new Set(cells.map(c => c.r + "," + c.c));
  if (keys.size !== cells.length) errs.push(tag + ": duplicate cell coords");
  cells.forEach(c => { if (c.c < 0 || c.c >= W || c.r < 0 || c.r >= p.rows) errs.push(tag + ": cell out of bounds"); if (!/^[A-Z]$/.test(c.ch)) errs.push(tag + ": bad letter"); });
  if (p.rows > 11) errs.push(tag + ": too many rows " + p.rows);
  // categories match source
  if (p.cats.length !== src.length || p.cats.some((n, i) => n !== src[i].name)) errs.push(tag + ": categories differ from source");
  const expected = src.flatMap((c, ci) => c.words.map(w => ci + ":" + w)).sort().join();
  const got = p.words.map(([ci, w]) => ci + ":" + w).sort().join();
  if (expected !== got) errs.push(tag + ": answers differ from source");
  if (p.cats.length < 3) errs.push(tag + ": fewer than 3 categories");
  // tiling: every cell used exactly once, paths contiguous, letters match
  const use = Array(cells.length).fill(0);
  const words = p.words.map(([cat, word, pth]) => ({ cat, word, path: pth }));
  words.forEach(w => {
    if (w.word.length < 3) errs.push(tag + ": short answer " + w.word);
    if (w.path.length !== w.word.length) errs.push(tag + ": path length mismatch " + w.word);
    w.path.forEach((ci, k) => { use[ci]++; if (cells[ci].ch !== w.word[k]) errs.push(tag + ": letter mismatch in " + w.word); if (k && !isAdj(cells[w.path[k - 1]], cells[ci])) errs.push(tag + ": non-adjacent step in " + w.word); });
    allAnswers.push(w.word);
  });
  use.forEach((u, i) => { if (u !== 1) errs.push(tag + ": cell " + i + " used " + u + " times"); });
  if (new Set(words.map(w => w.word)).size !== words.length) errs.push(tag + ": duplicate answer");
  // board connected
  const seen = new Set([0]), st = [0];
  while (st.length) { const x = st.pop(); cells.forEach((c, j) => { if (!seen.has(j) && isAdj(cells[x], c)) { seen.add(j); st.push(j); } }); }
  if (seen.size !== cells.length) errs.push(tag + ": board not connected");
  // uniqueness of the full solution
  const n = countSolutions({ cells, words }, 2);
  if (n !== 1) errs.push(tag + ": full solution count = " + n + " (want exactly 1)");
  p._sum = `${tag}: ${cells.length} tiles, ${p.rows} rows, ${p.cats.length} categories, ${words.length} answers, unique solution`;
});
if (/https?:\/\/(?!www\.w3\.org)/.test(html)) errs.push("external URL in index.html");
if (errs.length) { console.error("VALIDATION FAILED:\n" + errs.join("\n")); process.exit(1); }
PZ.forEach(p => console.log(p._sum));
console.log(`OK: ${PZ.length} puzzles, ${allAnswers.length} answers; every tile used exactly once, every path contiguous & matching, answers match hand-made source, boards connected, each puzzle has exactly one full solution.`);
