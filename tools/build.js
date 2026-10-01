// Embeds tools/puzzles.json (from gen.js) into ../index.html.
const fs = require("fs"), path = require("path");
const data = fs.readFileSync(path.join(__dirname, "puzzles.json"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "template.html"), "utf8").replace(/\/\*PUZZLES_START\*\/[\s\S]*?\/\*PUZZLES_END\*\//, () => `/*PUZZLES_START*/${data}/*PUZZLES_END*/`);
fs.writeFileSync(path.join(__dirname, "..", "index.html"), html);
console.log("index.html bytes:", Buffer.byteLength(html));
