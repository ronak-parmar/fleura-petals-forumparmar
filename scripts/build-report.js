/*
 * build-report.js
 * Renders report/source.md into report/report.html — a styled preview of the
 * Word document. Review this; when it is right, run build-docx.js.
 *
 *   node scripts/build-report.js
 */
const fs = require("fs");
const path = require("path");
const { parse, inlineHtml, escapeHtml } = require("./lib/markdown");
const FIGS = require("./lib/figures");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "report", "source.md");
const INLINE = process.argv.includes("--inline");
const OUT = path.join(ROOT, "report", INLINE ? "report.artifact.html" : "report.html");
const FIG_DIR = "assets/figures";

function imgSrc(file) {
  const abs = path.join(ROOT, "report", FIG_DIR, file);
  if (!fs.existsSync(abs)) return null;
  if (!INLINE) return `${FIG_DIR}/${file}`;
  return "data:image/png;base64," + fs.readFileSync(abs).toString("base64");
}

const blocks = parse(fs.readFileSync(SRC, "utf8"));

const FRONT_MATTER = new Set([
  "TITLE PAGE", "CERTIFICATE", "CERTIFICATE BY THE ORGANIZATION", "DECLARATION",
  "ACKNOWLEDGEMENT", "ABSTRACT", "TABLE OF CONTENTS", "LIST OF FIGURES", "LIST OF TABLES",
]);

function cell(s) { return inlineHtml(escapeHtml(s)); }

const CENTERED = new Set(["TITLE PAGE", "CERTIFICATE", "CERTIFICATE BY THE ORGANIZATION", "DECLARATION"]);

const html = [];
let figCounterSeen = new Set();
let centerMode = false;

for (let b = 0; b < blocks.length; b++) {
  const blk = blocks[b];
  switch (blk.t) {
    case "h": {
      const txt = blk.text;
      const U = txt.toUpperCase();
      if (blk.level === 2 && FRONT_MATTER.has(U)) {
        centerMode = CENTERED.has(U);
        html.push(`<div class="pagebreak"></div><h2 class="fm-title">${cell(txt)}</h2>`);
      } else if (blk.level === 1) {
        centerMode = false;
        html.push(`<div class="pagebreak"></div><h1>${cell(txt)}</h1>`);
      } else {
        if (blk.level === 2) centerMode = false;
        html.push(`<h${blk.level}>${cell(txt)}</h${blk.level}>`);
      }
      break;
    }
    case "p": {
      const body = (blk.lines || [blk.text]).map((l) => inlineHtml(escapeHtml(l))).join("<br>");
      html.push(`<p${centerMode ? ' class="center"' : ""}>${body}</p>`);
      break;
    }
    case "ul":
      html.push("<ul>" + blk.items.map((it) => `<li>${cell(it)}</li>`).join("") + "</ul>");
      break;
    case "ol":
      html.push("<ol>" + blk.items.map((it) => `<li>${cell(it)}</li>`).join("") + "</ol>");
      break;
    case "hr":
      html.push('<hr>');
      break;
    case "blockquote":
      html.push(`<blockquote>${cell(blk.text)}</blockquote>`);
      break;
    case "code":
      html.push(`<pre class="code"><code>${escapeHtml(blk.text)}</code></pre>`);
      break;
    case "table": {
      const th = "<tr>" + blk.headers.map((h) => `<th>${cell(h)}</th>`).join("") + "</tr>";
      const tr = blk.rows.map((r) => "<tr>" + r.map((c) => `<td>${cell(c)}</td>`).join("") + "</tr>").join("");
      html.push(`<div class="tablewrap"><table>${th}${tr}</table></div>`);
      break;
    }
    case "figure": {
      const file = FIGS[blk.num];
      figCounterSeen.add(blk.num);
      const src = file ? imgSrc(file) : null;
      html.push(
        `<figure class="fig">` +
        (src ? `<img src="${src}" alt="Figure ${blk.num}">` : `<div class="fig-missing">[ Figure ${blk.num} — image not rendered ]</div>`) +
        `<figcaption>Figure ${blk.num} &mdash; ${cell(blk.caption)}.</figcaption></figure>`
      );
      break;
    }
    case "logo": {
      const abs = path.join(ROOT, "report", "assets", "logo.png");
      const src = fs.existsSync(abs)
        ? (INLINE ? "data:image/png;base64," + fs.readFileSync(abs).toString("base64") : "assets/logo.png")
        : null;
      html.push(src ? `<img class="logo" src="${src}" alt="Nagindas Khandwala College logo">` : `<div class="fig-missing">[ logo not found: report/assets/logo.png ]</div>`);
      break;
    }
  }
}

const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fleuréa Petals Project Report</title>
<style>
  :root{
    --paper:#ffffff; --ink:#1a1a1a; --muted:#555; --rule:#c9c9c9;
    --accent:#7f3529;
  }
  *{box-sizing:border-box;}
  body{
    margin:0; background:#e7e2dd; color:var(--ink);
    font-family:"Times New Roman", Times, Georgia, serif;
    font-size:12pt; line-height:1.5;
  }
  .toolbar{
    position:sticky; top:0; z-index:5;
    background:#2b2420; color:#f0e8e2; font-family:Arial, sans-serif; font-size:12px;
    padding:8px 16px; display:flex; gap:16px; align-items:center;
  }
  .toolbar b{ color:#fff; }
  .toolbar span{ color:#c7b8ad; }
  .doc{
    max-width:8.27in; margin:24px auto 60px; background:var(--paper);
    padding:1in 1in 1in 1.5in;         /* mirrors the college margins L1.5 / R1 / T1 / B1 */
    box-shadow:0 4px 24px rgba(0,0,0,.16);
  }
  h1{ font-size:14pt; font-weight:bold; text-transform:uppercase; margin:0 0 16pt; letter-spacing:.02em; }
  h2{ font-size:13pt; font-weight:bold; margin:20pt 0 8pt; }
  h3{ font-size:12pt; font-weight:bold; margin:14pt 0 6pt; }
  h4{ font-size:12pt; font-weight:bold; font-style:italic; margin:12pt 0 4pt; }
  .fm-title{ text-align:center; font-size:14pt; text-transform:uppercase; margin:0 0 18pt; letter-spacing:.06em; }
  p{ margin:0 0 8pt; text-align:justify; }
  p.center{ text-align:center; }
  .fm-title + p.center{ margin-top:10pt; }
  ul,ol{ margin:0 0 10pt; padding-left:26pt; }
  li{ margin:0 0 4pt; text-align:justify; }
  hr{ border:0; border-top:1px solid var(--rule); margin:14pt 0; }
  blockquote{ margin:0 0 10pt; padding-left:14pt; border-left:3px solid var(--rule); color:var(--muted); font-style:italic; }
  a{ color:var(--accent); }
  .tablewrap{ overflow-x:auto; margin:0 0 12pt; }
  table{ border-collapse:collapse; width:100%; font-size:10.5pt; }
  th,td{ border:1px solid #999; padding:4pt 6pt; text-align:left; vertical-align:top; }
  th{ background:#f0ece8; font-weight:bold; }
  pre.code{
    background:#f6f4f1; border:1px solid #ddd; border-radius:4px;
    padding:10pt 12pt; overflow-x:auto; font-family:"Consolas","Courier New",monospace;
    font-size:9pt; line-height:1.45; white-space:pre; margin:0 0 12pt;
  }
  figure.fig{ margin:16pt 0; text-align:center; page-break-inside:avoid; }
  figure.fig img{ max-width:100%; border:1px solid #ddd; }
  figure.fig figcaption{ font-size:10pt; font-style:italic; color:var(--muted); margin-top:6pt; }
  .fig-missing{ padding:24pt; border:1px dashed #b00; color:#b00; font-family:Arial, sans-serif; font-size:11px; }
  img.logo{ display:block; margin:0 auto 14pt; width:75pt; height:auto; }
  .pagebreak{ height:0; }
  @media print{
    body{ background:none; }
    .toolbar{ display:none; }
    .doc{ box-shadow:none; margin:0; max-width:none; padding:0; }
    .pagebreak{ page-break-before:always; }
    h1{ page-break-before:always; }
    figure.fig{ page-break-inside:avoid; }
  }
  @page{ size:A4; margin:1in 1in 1in 1.5in; }
</style>
</head>
<body>
<div class="toolbar">
  <b>Project report — preview of Project_report.docx</b>
  <span>${INLINE
    ? "Fleuréa Petals · TY B.Sc. (Computer Science) field project · Forum Parmar (576)"
    : "Generated from <code>report/source.md</code> — edit the source, re-run <code>build-report.js</code>. When approved, <code>build-docx.js</code> produces the .docx."}</span>
</div>
<div class="doc">
${html.join("\n")}
</div>
</body>
</html>`;

fs.writeFileSync(OUT, page);
const total = Object.keys(FIGS).length;
const mb = (Buffer.byteLength(page) / 1024 / 1024).toFixed(2);
console.log(`Wrote ${path.relative(ROOT, OUT)}  (${blocks.length} blocks, ${figCounterSeen.size}/${total} figures, ${mb} MB${INLINE ? ", images inlined" : ""})`);
