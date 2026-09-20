/*
 * render-figures.js
 * Renders the diagram + mockup HTML files to PNG using headless Chrome,
 * writing them into report/assets/figures/ for the report to embed.
 *
 * Usage:  node scripts/render-figures.js [diagrams|mockups|all]
 */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "report", "assets", "figures");
fs.mkdirSync(OUT, { recursive: true });

const CHROME = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
].find((p) => fs.existsSync(p));
if (!CHROME) {
  console.error("No Chrome or Edge found for rendering.");
  process.exit(1);
}

// figure key -> { file, width, height }  (height is a generous upper bound; --screenshot captures full page)
const DIAGRAMS = {
  "fig-3-1-architecture":        { file: "diagrams/architecture.html",               w: 1280, h: 760 },
  "fig-3-2-two-natures":         { file: "diagrams/two-natures.html",                 w: 1280, h: 560 },
  "fig-3-3-er-diagram":          { file: "diagrams/er-diagram.html",                  w: 1320, h: 920 },
  "fig-3-4-db-tables":           { file: "diagrams/db-tables.html",                   w: 1460, h: 900 },
  "fig-3-5-db-functions":        { file: "diagrams/db-functions.html",                w: 1460, h: 1760 },
  "fig-3-6-use-case":            { file: "diagrams/use-case.html",                    w: 1280, h: 1060 },
  "fig-3-7-activity-place-order":{ file: "diagrams/activity-place-order.html",        w: 1000, h: 1340 },
  "fig-3-8-sequence-checkout":   { file: "diagrams/sequence-checkout.html",           w: 1320, h: 840 },
  "fig-3-9-class-diagram":       { file: "diagrams/class-diagram.html",               w: 1480, h: 1000 },
  "fig-3-10-order-lifecycle":    { file: "diagrams/order-lifecycle.html",             w: 1200, h: 380 },
  "fig-3-11-custom-request-lifecycle": { file: "diagrams/custom-request-lifecycle.html", w: 1200, h: 420 },
  "fig-5-1-test-summary":        { file: "diagrams/test-summary.html",                w: 1100, h: 700 },
};

const MOCKUPS = {
  "fig-4-1-home":                 { file: "mockups/screens/home.html",                 w: 1360, h: 1680 },
  "fig-4-2-shop":                 { file: "mockups/screens/shop.html",                 w: 1360, h: 1560 },
  "fig-4-3-product":              { file: "mockups/screens/product.html",              w: 1360, h: 1080 },
  "fig-4-4-cart":                 { file: "mockups/screens/cart.html",                 w: 1360, h: 1120 },
  "fig-4-5-checkout":             { file: "mockups/screens/checkout.html",             w: 1360, h: 1560 },
  "fig-4-6-order-confirmation":   { file: "mockups/screens/order-confirmation.html",   w: 1360, h: 1080 },
  "fig-4-7-track-order":          { file: "mockups/screens/track-order.html",          w: 1360, h: 1180 },
  "fig-4-8-custom-request":       { file: "mockups/screens/custom-request.html",       w: 1360, h: 1560 },
  "fig-4-9-custom-received":      { file: "mockups/screens/custom-received.html",      w: 1360, h: 1000 },
  "fig-4-10-account-orders":      { file: "mockups/screens/account-orders.html",       w: 1360, h: 1000 },
  "fig-4-11-admin-dashboard":     { file: "mockups/screens/admin-dashboard.html",      w: 1420, h: 1180 },
  "fig-4-12-admin-product-form":  { file: "mockups/screens/admin-product-form.html",   w: 1420, h: 1120 },
  "fig-4-13-admin-orders":        { file: "mockups/screens/admin-orders.html",         w: 1420, h: 900 },
  "fig-4-14-admin-order-detail":  { file: "mockups/screens/admin-order-detail.html",   w: 1420, h: 1000 },
  "fig-4-15-admin-custom-request":{ file: "mockups/screens/admin-custom-request.html", w: 1420, h: 1140 },
};

// For diagram figures, hide the in-image "Figure N" eyebrow + title — the report
// supplies the figure caption. The explanatory figcaption stays in the image.
const STRIP_CSS =
  ".figure__eyebrow,.figure__title{display:none!important}" +
  ".figure{padding-top:22px!important}";

function render(key, spec, strip) {
  const src = path.join(ROOT, spec.file);
  if (!fs.existsSync(src)) { console.warn("  skip (missing): " + spec.file); return; }
  const outPng = path.join(OUT, key + ".png");
  let url = "file:///" + src.replace(/\\/g, "/");
  if (strip) {
    const raw = fs.readFileSync(src, "utf8").replace("</head>", `<style>${STRIP_CSS}</style></head>`);
    const tmp = src.replace(/\.html$/, ".stripped.html");
    fs.writeFileSync(tmp, raw);
    url = "file:///" + tmp.replace(/\\/g, "/");
    spec.__tmp = tmp;
  }
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-sandbox",
    "--hide-scrollbars",
    "--force-device-scale-factor=2",
    "--default-background-color=00000000",
    "--virtual-time-budget=4000",
    "--window-size=" + spec.w + "," + spec.h,
    "--screenshot=" + outPng,
    url,
  ];
  try {
    execFileSync(CHROME, args, { stdio: "ignore", timeout: 60000 });
    const kb = (fs.statSync(outPng).size / 1024).toFixed(0);
    console.log("  ok  " + key + ".png  (" + kb + " KB)");
  } catch (e) {
    console.error("  FAIL " + key + " : " + e.message);
  } finally {
    if (spec.__tmp && fs.existsSync(spec.__tmp)) fs.unlinkSync(spec.__tmp);
  }
}

const mode = (process.argv[2] || "all").toLowerCase();
const sets = [];
if (mode === "diagrams" || mode === "all") sets.push(["diagrams", DIAGRAMS, true]);
if (mode === "mockups" || mode === "all") sets.push(["mockups", MOCKUPS, false]);

for (const [name, set, strip] of sets) {
  console.log("Rendering " + name + " ...");
  for (const [key, spec] of Object.entries(set)) render(key, spec, strip);
}
console.log("Done. Output: report/assets/figures/");
