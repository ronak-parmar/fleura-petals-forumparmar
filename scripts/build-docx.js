/*
 * build-docx.js
 * Generates report/Project_report.docx from report/source.md and the rendered
 * figures in report/assets/figures/. Run ONLY when report.html is approved.
 *
 *   node scripts/build-docx.js
 *
 * The .docx is assembled as raw OOXML in a hand-written ZIP container
 * (scripts/lib/zip.js) — no external packages.
 *
 * Formatting follows the college standard: A4, Times New Roman 12 pt body /
 * 14 pt headings, 1.5 line spacing, margins L 1.5" · R/T/B 1".
 */
const fs = require("fs");
const path = require("path");
const { makeZip } = require("./lib/zip");
const { parse, inlineRuns } = require("./lib/markdown");
const FIGS = require("./lib/figures");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "report", "source.md");
const FIGDIR = path.join(ROOT, "report", "assets", "figures");
const OUT = path.join(ROOT, "report", "Project_report.docx");

// Page + margins matched to reference/TY_PROJECT_REPORT_FORMAT_2026_27.docx
const PG = { w: 11920, h: 16840, top: 1382, bottom: 936, left: 1426, right: 1430, footer: 757 };
const EMU_PER_TWIP = 635;
const CONTENT_WIDTH_EMU = (PG.w - PG.left - PG.right) * EMU_PER_TWIP; // ~5.76M EMU
const CONTENT_WIDTH_TWIPS = PG.w - PG.left - PG.right;                // ~9064

const FRONT_MATTER = new Set([
  "TITLE PAGE", "CERTIFICATE", "CERTIFICATE BY THE ORGANIZATION", "DECLARATION",
  "ACKNOWLEDGEMENT", "ABSTRACT", "TABLE OF CONTENTS", "LIST OF FIGURES", "LIST OF TABLES",
]);
const CENTERED = new Set(["TITLE PAGE", "CERTIFICATE", "CERTIFICATE BY THE ORGANIZATION", "DECLARATION"]);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function pngSize(buf) {
  // IHDR: width at byte 16, height at byte 20 (big-endian, after 8-byte sig)
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

// ---- run / paragraph helpers -------------------------------------------------

function runsXml(text, extraRpr = "") {
  return inlineRuns(text).map((r) => {
    const rpr = [];
    if (r.b) rpr.push("<w:b/>");
    if (r.i) rpr.push("<w:i/>");
    if (r.code) rpr.push('<w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="20"/>');
    const rprXml = (rpr.join("") || extraRpr) ? `<w:rPr>${rpr.join("")}${extraRpr}</w:rPr>` : "";
    return `<w:r>${rprXml}<w:t xml:space="preserve">${esc(r.text)}</w:t></w:r>`;
  }).join("");
}

function para(text, opts = {}) {
  const ppr = [];
  const spacing = opts.spacing || 'w:line="360" w:lineRule="auto" w:after="120"';
  if (opts.keepNext) ppr.push("<w:keepNext/><w:keepLines/>");
  if (opts.pageBreakBefore) ppr.push("<w:pageBreakBefore/>");
  ppr.push(`<w:spacing ${spacing}/>`);
  if (opts.ind) ppr.push(opts.ind);
  if (opts.jc) ppr.push(`<w:jc w:val="${opts.jc}"/>`);
  if (opts.outlineLvl != null) ppr.push(`<w:outlineLvl w:val="${opts.outlineLvl}"/>`);
  const rpr = opts.rpr || "";
  let body;
  if (opts.raw) body = opts.raw;
  else if (opts.lines) body = opts.lines.map((l) => runsXml(l, rpr)).join('<w:r><w:br/></w:r>');
  else body = runsXml(text || "", rpr);
  return `<w:p><w:pPr>${ppr.join("")}</w:pPr>${body}</w:p>`;
}

function heading(text, level, opts = {}) {
  const sz = level === 1 ? 28 : level === 2 ? 26 : 24; // 14 / 13 / 12 pt bold
  const rpr = `<w:b/><w:sz w:val="${sz}"/>` + (level === 1 ? "<w:caps/>" : "");
  // No space-before when the heading already starts a new page.
  const before = opts.pageBreakBefore ? 0 : level === 1 ? 240 : level === 2 ? 220 : 160;
  const after = level === 1 ? 160 : 80;
  return para(text, {
    ...opts,
    rpr,
    spacing: `w:line="360" w:lineRule="auto" w:before="${before}" w:after="${after}"`,
    keepNext: true,
    outlineLvl: level - 1,
  });
}

function codeBlock(text) {
  const lines = text.split("\n");
  const body = lines.map((l) =>
    `<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="16"/></w:rPr><w:t xml:space="preserve">${esc(l) || " "}</w:t></w:r>`
  ).join('<w:r><w:br/></w:r>');
  return `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:after="0"/>` +
    `<w:shd w:val="clear" w:color="auto" w:fill="F2EFEC"/>` +
    `<w:pBdr><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/>` +
    `<w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:pBdr>` +
    `</w:pPr>${body}</w:p>`;
}

function tableXml(headers, rows, opts = {}) {
  const compact = !!opts.compact;          // TOC / List of Figures / List of Tables
  const cols = headers.length;
  const colW = Math.floor(CONTENT_WIDTH_TWIPS / cols);
  const grid = `<w:tblGrid>${Array(cols).fill(`<w:gridCol w:w="${colW}"/>`).join("")}</w:tblGrid>`;
  const borderSz = compact ? 2 : 4;
  const borderCol = compact ? "CCCCCC" : "999999";
  const borders = `<w:tblBorders>` +
    ["top", "left", "bottom", "right", "insideH", "insideV"].map((s) =>
      `<w:${s} w:val="single" w:sz="${borderSz}" w:space="0" w:color="${borderCol}"/>`).join("") +
    `</w:tblBorders>`;
  // Tight cell margins so tables (especially the TOC) stay short.
  const cellMar = compact
    ? `<w:tblCellMar><w:top w:w="10" w:type="dxa"/><w:bottom w:w="10" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar>`
    : `<w:tblCellMar><w:top w:w="30" w:type="dxa"/><w:bottom w:w="30" w:type="dxa"/><w:left w:w="90" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>`;
  const fontSz = compact ? 18 : 20;        // 9 pt / 10 pt
  const cell = (txt, isHead) => {
    const shd = isHead ? '<w:shd w:val="clear" w:color="auto" w:fill="F0ECE8"/>' : "";
    const rpr = (isHead ? "<w:b/>" : "") + `<w:sz w:val="${fontSz}"/>`;
    return `<w:tc><w:tcPr><w:tcW w:w="${colW}" w:type="dxa"/>${shd}</w:tcPr>` +
      para(txt, { spacing: 'w:line="240" w:lineRule="auto" w:after="0"', rpr, jc: "left" }) +
      `</w:tc>`;
  };
  const tr = (cells, isHead) =>
    `<w:tr>${isHead ? "<w:trPr><w:tblHeader/></w:trPr>" : ""}${cells.map((c) => cell(c, isHead)).join("")}</w:tr>`;
  return `<w:tbl><w:tblPr><w:tblW w:w="${CONTENT_WIDTH_TWIPS}" w:type="dxa"/>${borders}${cellMar}` +
    `<w:tblLayout w:type="fixed"/></w:tblPr>${grid}` +
    tr(headers, true) + rows.map((r) => tr(r, false)).join("") + `</w:tbl>` +
    `<w:p><w:pPr><w:spacing w:line="240" w:lineRule="auto" w:after="120"/></w:pPr></w:p>`;
}

// ---- build ------------------------------------------------------------------

const blocks = parse(fs.readFileSync(SRC, "utf8"));
const bodyParts = [];
const media = [];       // {name, buf}
const imageRels = [];    // {id, target}
let relSeq = 10;
let centerMode = false;
let compactTables = false;      // true inside TOC / List of Figures / List of Tables
const COMPACT_SECTIONS = new Set(["TABLE OF CONTENTS", "LIST OF FIGURES", "LIST OF TABLES"]);

for (const blk of blocks) {
  switch (blk.t) {
    case "h": {
      const U = blk.text.toUpperCase();
      if (blk.level === 2 && FRONT_MATTER.has(U)) {
        centerMode = CENTERED.has(U);
        compactTables = COMPACT_SECTIONS.has(U);
        bodyParts.push(heading(blk.text, 2, { pageBreakBefore: true, jc: "center" }));
      } else if (blk.level === 1) {
        centerMode = false;
        compactTables = false;
        bodyParts.push(heading(blk.text, 1, { pageBreakBefore: true }));
      } else {
        if (blk.level === 2) { centerMode = false; compactTables = false; }
        bodyParts.push(heading(blk.text, Math.min(blk.level, 3)));
      }
      break;
    }
    case "p":
      bodyParts.push(para(blk.text, {
        lines: blk.lines && blk.lines.length > 1 ? blk.lines : null,
        jc: centerMode ? "center" : "both",
      }));
      break;
    case "ul":
    case "ol":
      blk.items.forEach((it, idx) => {
        const marker = blk.t === "ol" ? `${idx + 1}.  ` : "•  ";
        bodyParts.push(para(null, {
          raw: runsXml(marker) + runsXml(it),
          spacing: 'w:line="320" w:lineRule="auto" w:after="60"',
          ind: '<w:ind w:left="360" w:hanging="360"/>',
          jc: "both",
        }));
      });
      break;
    case "blockquote":
      bodyParts.push(para(blk.text, { rpr: "<w:i/>", jc: "both" }));
      break;
    case "hr":
      bodyParts.push('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="4" w:color="CCCCCC"/></w:pBdr></w:pPr></w:p>');
      break;
    case "code":
      bodyParts.push(codeBlock(blk.text));
      break;
    case "table":
      bodyParts.push(tableXml(blk.headers, blk.rows, { compact: compactTables }));
      break;
    case "figure": {
      const file = FIGS[blk.num];
      const abs = file && path.join(FIGDIR, file);
      if (abs && fs.existsSync(abs)) {
        const buf = fs.readFileSync(abs);
        const { w, h } = pngSize(buf);
        // Fit to content width, but never taller than ~7.5in so a figure + caption
        // stays on one page.
        let cx = CONTENT_WIDTH_EMU;
        let cy = Math.round(cx * (h / w));
        const MAX_H = Math.round(7.4 * 914400);
        if (cy > MAX_H) { cy = MAX_H; cx = Math.round(cy * (w / h)); }
        const idx = media.length + 1;
        const mname = `image${idx}.png`;
        media.push({ name: mname, buf });
        const rid = `rId${relSeq++}`;
        imageRels.push({ id: rid, target: `media/${mname}` });
        bodyParts.push(
          `<w:p><w:pPr><w:spacing w:before="180" w:after="60"/><w:jc w:val="center"/><w:keepNext/></w:pPr>` +
          `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
          `<wp:extent cx="${cx}" cy="${cy}"/>` +
          `<wp:docPr id="${idx}" name="Figure ${blk.num}"/>` +
          `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
          `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
          `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
          `<pic:nvPicPr><pic:cNvPr id="${idx}" name="${mname}"/><pic:cNvPicPr/></pic:nvPicPr>` +
          `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
          `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
          `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
          `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
        );
      } else {
        bodyParts.push(para(`[ Figure ${blk.num} — image not found: run scripts/render-figures.js ]`, { jc: "center", rpr: "<w:i/><w:color w:val=\"AA0000\"/>" }));
      }
      bodyParts.push(para(null, {
        raw: `<w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">Figure ${blk.num} — </w:t></w:r>` +
             inlineRuns(blk.caption + ".").map((r) => `<w:r><w:rPr><w:i/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">${esc(r.text)}</w:t></w:r>`).join(""),
        jc: "center",
        spacing: 'w:line="240" w:lineRule="auto" w:after="200"',
      }));
      break;
    }
    case "logo": {
      const abs = path.join(ROOT, "report", "assets", "logo.png");
      if (fs.existsSync(abs)) {
        const buf = fs.readFileSync(abs);
        const { w, h } = pngSize(buf);
        // Matches the reference template's exact logo size (952029 x 673277 EMU),
        // not a numbered/captioned figure like the report's other figures.
        const cx = 952029;
        const cy = Math.round(cx * (h / w));
        const idx = media.length + 1;
        const mname = `image${idx}.png`;
        media.push({ name: mname, buf });
        const rid = `rId${relSeq++}`;
        imageRels.push({ id: rid, target: `media/${mname}` });
        bodyParts.push(
          `<w:p><w:pPr><w:spacing w:before="0" w:after="160"/><w:jc w:val="center"/></w:pPr>` +
          `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0">` +
          `<wp:extent cx="${cx}" cy="${cy}"/>` +
          `<wp:docPr id="${idx}" name="College logo"/>` +
          `<a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">` +
          `<a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
          `<pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
          `<pic:nvPicPr><pic:cNvPr id="${idx}" name="${mname}"/><pic:cNvPicPr/></pic:nvPicPr>` +
          `<pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill>` +
          `<pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm>` +
          `<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr>` +
          `</pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>`
        );
      } else {
        bodyParts.push(para(`[ logo not found: report/assets/logo.png ]`, { jc: "center", rpr: "<w:i/><w:color w:val=\"AA0000\"/>" }));
      }
      break;
    }
  }
}

// Section properties — A4 with margins matched to the reference format document.
const sectPr =
  `<w:sectPr>` +
  `<w:footerReference w:type="default" r:id="rIdFooter"/>` +
  `<w:pgSz w:w="${PG.w}" w:h="${PG.h}" w:orient="portrait"/>` +
  `<w:pgMar w:top="${PG.top}" w:right="${PG.right}" w:bottom="${PG.bottom}" w:left="${PG.left}" ` +
  `w:header="0" w:footer="${PG.footer}" w:gutter="0"/>` +
  `<w:pgNumType w:start="1"/><w:cols w:space="708"/>` +
  `</w:sectPr>`;

const documentXml =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
  `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ` +
  `xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ` +
  `xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" ` +
  `xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture">` +
  `<w:body>${bodyParts.join("")}${sectPr}</w:body></w:document>`;

const stylesXml =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
  `<w:docDefaults><w:rPrDefault><w:rPr>` +
  `<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/>` +
  `<w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:val="en-IN"/>` +
  `</w:rPr></w:rPrDefault>` +
  `<w:pPrDefault><w:pPr><w:spacing w:line="360" w:lineRule="auto"/><w:jc w:val="both"/></w:pPr></w:pPrDefault>` +
  `</w:docDefaults>` +
  `<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/>` +
  `<w:pPr><w:spacing w:line="360" w:lineRule="auto" w:after="120"/><w:jc w:val="both"/></w:pPr></w:style>` +
  `</w:styles>`;

const footerXml =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<w:ftr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
  `<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr>` +
  `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r>` +
  `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r>` +
  `<w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r>` +
  `</w:p></w:ftr>`;

const contentTypes =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
  `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
  `<Default Extension="xml" ContentType="application/xml"/>` +
  `<Default Extension="png" ContentType="image/png"/>` +
  `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
  `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
  `<Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/>` +
  `</Types>`;

const rootRels =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
  `</Relationships>`;

const docRels =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n` +
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
  `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
  `<Relationship Id="rIdFooter" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/>` +
  imageRels.map((r) =>
    `<Relationship Id="${r.id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${r.target}"/>`).join("") +
  `</Relationships>`;

const entries = [
  { name: "[Content_Types].xml", data: contentTypes },
  { name: "_rels/.rels", data: rootRels },
  { name: "word/document.xml", data: documentXml },
  { name: "word/_rels/document.xml.rels", data: docRels },
  { name: "word/styles.xml", data: stylesXml },
  { name: "word/footer1.xml", data: footerXml },
  ...media.map((m) => ({ name: `word/media/${m.name}`, data: m.buf })),
];

fs.writeFileSync(OUT, makeZip(entries));
const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(2);
console.log(`Wrote ${path.relative(ROOT, OUT)}  (${bodyParts.length} paragraphs, ${media.length} figures embedded, ${mb} MB)`);
console.log("Open it in Word and press Ctrl+A then F9 to refresh the page-number field.");
