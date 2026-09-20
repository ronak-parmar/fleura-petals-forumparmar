/*
 * Minimal Markdown -> block AST parser for the Fleuréa Petals report.
 * Handles only what report/source.md uses: headings, paragraphs, ordered/unordered
 * lists, pipe tables, fenced code, horizontal rules, blockquotes, the
 * "*Figure N – caption.*" figure marker, and the "[LOGO]" title-page marker.
 */

function parse(md) {
  // Normalise newlines, drop everything before the first front-matter section.
  md = md.replace(/\r\n/g, "\n");
  const startIdx = md.indexOf("## TITLE PAGE");
  if (startIdx >= 0) md = md.slice(startIdx);

  const lines = md.split("\n");
  const blocks = [];
  let i = 0;

  const figureRe = /^\*Figure\s+([\d.]+)\s*[–-]\s*(.+?)\.?\*$/;

  while (i < lines.length) {
    let line = lines[i];

    // blank
    if (/^\s*$/.test(line)) { i++; continue; }

    // fenced code
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] || "";
      const buf = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
      i++; // closing fence
      blocks.push({ t: "code", lang, text: buf.join("\n") });
      continue;
    }

    // horizontal rule
    if (/^---+\s*$/.test(line)) { blocks.push({ t: "hr" }); i++; continue; }

    // figure marker (single italic line)
    const fig = line.trim().match(figureRe);
    if (fig) { blocks.push({ t: "figure", num: fig[1], caption: fig[2].trim() }); i++; continue; }

    // logo marker (title page only, no numbering/caption)
    if (line.trim() === "[LOGO]") { blocks.push({ t: "logo" }); i++; continue; }

    // heading
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { blocks.push({ t: "h", level: h[1].length, text: h[2].trim() }); i++; continue; }

    // blockquote
    if (/^>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^>\s?/, "")); i++; }
      blocks.push({ t: "blockquote", text: buf.join(" ").trim() });
      continue;
    }

    // table (a header row followed by a |---|--- separator)
    if (/^\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\|[\s:|-]+\|\s*$/.test(lines[i + 1])) {
      const splitRow = (r) => r.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const headers = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) { rows.push(splitRow(lines[i])); i++; }
      blocks.push({ t: "table", headers, rows });
      continue;
    }

    // list
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (li) {
      const ordered = /\d+\./.test(li[2]);
      const items = [];
      while (i < lines.length) {
        const m = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (!m) {
          // continuation line (indented, non-blank) -> append to last item
          if (/^\s+\S/.test(lines[i]) && items.length) { items[items.length - 1] += " " + lines[i].trim(); i++; continue; }
          break;
        }
        items.push(m[3].trim());
        i++;
      }
      blocks.push({ t: ordered ? "ol" : "ul", items });
      continue;
    }

    // paragraph (gather until blank / block starter). Internal newlines are kept
    // as hard line breaks — prose paragraphs in source.md are single lines, so only
    // the formal front-matter blocks (title page, certificates) are affected.
    const buf = [line];
    i++;
    while (i < lines.length && !/^\s*$/.test(lines[i]) &&
           !/^(#{1,6}\s|```|>\s?|\||\s*([-*]|\d+\.)\s|---+\s*$)/.test(lines[i]) &&
           !lines[i].trim().match(figureRe)) {
      buf.push(lines[i]); i++;
    }
    blocks.push({ t: "p", lines: buf.map((s) => s.trim()), text: buf.join(" ").trim() });
  }

  return blocks;
}

// Inline markdown -> HTML (after the caller has HTML-escaped the text).
function inlineHtml(escaped) {
  return escaped
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1<em>$2</em>");
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Inline markdown -> plain runs for OOXML: [{text, b, i, code}]
function inlineRuns(text) {
  const runs = [];
  const re = /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\*([^*]+)\*)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index) });
    if (m[1]) runs.push({ text: m[2], b: true });
    else if (m[3]) runs.push({ text: m[4], code: true });
    else if (m[5]) runs.push({ text: m[6], i: true });
    last = re.lastIndex;
  }
  if (last < text.length) runs.push({ text: text.slice(last) });
  return runs.length ? runs : [{ text }];
}

module.exports = { parse, inlineHtml, escapeHtml, inlineRuns };
