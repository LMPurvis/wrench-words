# Wrench Words

A hex-grid themed word-search puzzle in one self-contained `index.html` (no network requests). Play: https://lmpurvis.github.io/wrench-words/

Each puzzle hides themed answers in a honeycomb of letters. Orange tiles mark where answers start, answers wind through touching hexes, and every tile belongs to exactly one answer. Easy, Medium, and Hard modes; hints reveal vowels, the last letter, or the location.

- 34 hand-written puzzles (4 categories each, 481 answers)
- `tools/gen.js` tiles each board and keeps only layouts with exactly one full solution; `tools/validate.js` re-checks everything
