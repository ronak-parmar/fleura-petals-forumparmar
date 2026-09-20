# Fleuréa Petals — TY B.Sc. (Computer Science) Field Project

**Fleuréa Petals – Flower Bouquet Ordering Application** — a minimal flower-ordering
website (browse a catalogue, fill a cart, place an order, request a custom bouquet)
with a small admin panel. Built with **Next.js · ASP.NET Core Web API · PostgreSQL**.
No payment gateway — orders are pay-on-delivery.

Student: **Forum Parmar** (Roll 576) · Nagindas Khandwala College · 2026–27

---

## The workflow

```
report/source.md   ──►   report/report.html   ──►   [review & approve]   ──►   report/Project_report.docx
(single source of truth)  (styled preview of the doc)                          (generated on demand only)
```

- **Edit content in `report/source.md` only.** Everything else is generated.
- `node scripts/build-report.js` regenerates `report/report.html` (the preview).
- When the preview is right: `node scripts/build-docx.js` produces the Word file.
- Figures are authored as HTML in `diagrams/` and `mockups/`, rendered to PNG by
  `node scripts/render-figures.js`, and embedded by both build steps.

The `.docx` is **not** rebuilt on every edit — only when you ask for it.

---

## Folder structure

```
.
├── README.md                     ← this file
├── CLAUDE.md                     ← project context for AI assistants
│
├── report/
│   ├── source.md                ← THE report content (edit here)
│   ├── report.html              ← generated preview (open in a browser)
│   ├── report.artifact.html     ← generated, images inlined (for sharing as an Artifact)
│   ├── Project_report.docx      ← generated Word file (on demand)
│   └── assets/figures/*.png     ← rendered figures the report embeds
│
├── diagrams/                     ← figure sources (HTML) — architecture, ER, DB (pgAdmin-style),
│   │                              DB functions, use-case, activity, sequence, class, 2 lifecycles,
│   │                              two-natures, test summary
│   └── diagram.css              ← shared styling for the diagrams
│
├── mockups/
│   ├── screens/*.html           ← 15 hi-fi screen mockups (Figures 4.1–4.15)
│   └── shared/fleurea.css       ← shared design system (palette, type, components)
│
├── database/
│   ├── schema.sql               ← tables, enums, constraints, indexes, sequences
│   ├── functions.sql            ← PL/pgSQL functions the API calls (fn_place_order, …)
│   └── seed.sql                 ← demo data (products, admin "forum")
│
├── tests/
│   ├── Fleurea.http             ← API request tests (VS Code REST Client / Visual Studio)
│   └── test-cases.md            ← page-by-page test catalogue (load · clicks · API cases)
│
├── scripts/
│   ├── render-figures.js        ← diagrams + mockups  →  report/assets/figures/*.png
│   ├── build-report.js          ← source.md  →  report.html  (add --inline for the artifact build)
│   ├── build-docx.js            ← source.md + figures  →  Project_report.docx
│   └── lib/                     ← markdown parser, figure map, zip writer (no npm packages)
│
├── planning/                     ← understand.md, ecom-plan.md, ecom-plan.html (early planning)
│
└── reference/                    ← the college template + a sample report, the original
                                    static site (test.html), and the untouched first draft
```

---

## Regenerating things

| To do this | Run |
|---|---|
| Re-render all figures | `node scripts/render-figures.js` |
| Re-render only diagrams / only mockups | `node scripts/render-figures.js diagrams` \| `... mockups` |
| Rebuild the HTML preview | `node scripts/build-report.js` |
| Rebuild the shareable (inlined) HTML | `node scripts/build-report.js --inline` |
| Rebuild the Word document | `node scripts/build-docx.js` |

Requires **Node.js** and **Google Chrome** (used headless for figure rendering).
No npm install — the scripts use only Node's standard library.

After opening `Project_report.docx` in Word, press **Ctrl+A** then **F9** once to
refresh the page-number field in the footer.

---

## Report structure (matches the college format)

Front matter → Title, Certificate, Certificate by the Organization, Declaration,
Acknowledgement, Abstract, Table of Contents, List of Figures, List of Tables.

| Ch | Contents |
|----|----------|
| 1 | Introduction (1.1–1.4) |
| 2 | Organization Profile & Field Study (2.1–2.5) |
| 3 | System Analysis & Design (3.1–3.7) — architecture, ER, DB functions, UML |
| 4 | System Implementation (4.1–4.6) — hardware, software, tech, modules, screens, code |
| 5 | Testing & Results (5.1 test cases + traceability, 5.2 results) |
| 6 | Conclusion & Future Scope (6.1–6.3) |
| 7 | References (APA) |
| 8 | Appendix (user manual, screenshots, code, weekly activity log) |

Formatting applied by `build-docx.js`: A4, Times New Roman 12 pt body / 14 pt headings,
1.5 line spacing, margins L 1.5″ · R/T/B 1″, page numbers from the footer.
"# fleura-petals-forumparmar" 
