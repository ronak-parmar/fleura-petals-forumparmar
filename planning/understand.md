# Understanding — TY Project Report (Fleuréa Petals)

This note explains what the three files in this folder are, how they relate, and
exactly what still has to be done to turn the draft into a submission-ready report.

---

## 1. The three files

| File | Role | What it gives us |
|------|------|------------------|
| `TY_PROJECT_REPORT_FORMAT_2026_27.docx` | **The rulebook** | Official college template: the required section order, the full Table of Contents (chapter/sub-section numbering), the Weekly Activity Log table, and the formatting standards (fonts, margins, spacing, page-numbering rules). Contains only placeholders like "PROJECT TITLE" / "Name of the Student". |
| `TY_PROJECT_REPORT_FORMAT_2026_27_1.pdf` | **The worked example** | A *completed* report by a previous student — **"AutoCare Hub – Garage Management System" (Norafsha Shaikh, Roll 563)**. 38 pages. Shows how much detail each section needs, the writing tone, how tables/diagrams/screenshots are placed, and how References/Appendix are handled. It is a model to imitate in *structure and depth*, not in content. |
| `Project_report.docx` | **Our half-baked draft** | Forum Parmar's actual report for **"Fleuréa Petals – Flower Bouquet Ordering Application"**. All chapters are drafted in prose but several required sections are missing, some headings don't match the template, and every diagram / screenshot / code / DB schema is still a `[Insert ...]` placeholder. **This is the file we edit.** |

**Mental model:** the FORMAT `.docx` says *what sections must exist and how the page must look*; the PDF shows *how good a finished one looks*; `Project_report.docx` is *our content, not yet conformed to either*.

---

## 2. Our project at a glance (from the draft)

- **Title:** Fleuréa Petals – Flower Bouquet Ordering Application
- **Student:** Forum Parmar, Roll No. 576, B.Sc. (Computer Science)
- **College:** Nagindas Khandwala College (Empowered Autonomous College), Mumbai – 400064, 2026–27
- **Organization (field study):** Fleuréa Petals — a small handmade flower-bouquet & gifting business
- **Problem:** orders currently happen over social-media DMs / phone — hard to present products, capture requirements, and track orders.
- **Solution:** a web app to showcase bouquets & gifts, take orders, and accept **custom bouquet requests**.
- **Tech stack:** React / Next.js (frontend) · .NET (backend) · PostgreSQL (database) · VS Code (IDE)
- **Scope:** core ordering experience only — not a full e-commerce platform. Payments, accounts, admin dashboard, tracking = future scope.

---

## 3. Required structure vs. what the draft has

### Front matter (before Chapter 1)

Template order → our draft status:

1. Title Page — ✅ present
2. Certificate — ✅ present
3. Certificate by the Organization — ✅ present (but draft places it *after* Declaration — **reorder**)
4. Declaration — ✅ present
5. Acknowledgement — ✅ present
6. Abstract — ✅ present
7. **Table of Contents — ❌ MISSING**
8. **List of Figures — ❌ MISSING**
9. **List of Tables — ❌ MISSING**

### Chapters (template TOC → draft)

| Template section | In draft? | Note |
|---|---|---|
| **Ch.1 Introduction** — 1.1 Project Overview / 1.2 Problem Statement / 1.3 Objectives / 1.4 Scope | ✅ all four | Objectives list has 4 points — good, template wants "4 objectives". |
| **Ch.2 Organization Profile & Field Study** — 2.1 About the Organization / 2.2 Organization Structure / 2.3 Services / Products Offered / 2.4 Existing Business Process / 2.5 Problem Identified During Field Study | ⚠️ partial | Draft has About / Products & Services / Existing Business Process / *Field Study Observations* / Problem Identified. **Missing 2.2 Organization Structure.** Rename "Products and Services" → "Services / Products Offered". "Field Study Observations" is extra — fold into 2.4 or drop. |
| **Ch.3 System Analysis & Design** — 3.1 Existing System / 3.2 Proposed System / 3.3 Functional Requirements / 3.4 Non-Functional Requirements / 3.5 System Architecture / 3.6 Database Design / 3.7 UML Diagrams | ✅ all present | 3.6 needs a real ER diagram + table list; 3.7 currently a placeholder paragraph — needs actual Use-Case, Activity, ER, Sequence, Class diagrams (see PDF §3.7). |
| **Ch.4 System Implementation** — 4.1 Hardware Requirements / 4.2 Software Requirements / 4.3 Technologies Used / 4.4 Module Description / 4.5 User Interface Screens / 4.6 Sample Source Code | ✅ headings present | 4.3 should be a **table** (Technology / Purpose) like the PDF. 4.5 & 4.6 are placeholders — need real screenshots and real code snippets. Consider a hardware table in 4.1. |
| **Ch.5 Testing and Results** — 5.1 Test Cases / 5.2 Results and Outputs | ⚠️ extra sections | Draft adds "Testing Approach" and "User Experience". Keep content but collapse under 5.1 / 5.2, or the numbering won't match the TOC. 5.1 should ideally be a test-case **table** (Test / Expected / Actual / Status). 5.2 needs result screenshots. |
| **Ch.6 Conclusion and Future Scope** — 6.1 Conclusion / 6.2 Learning Outcomes / 6.3 Future Scope | ✅ all present | Good shape. |
| **Ch.7 References** | ✅ present as "REFERENCES" | Template/PDF treat this as **Chapter 7**. Re-title "Chapter 7: References". Must be **APA style**. |
| **Ch.8 Appendix** (User Manual, Additional Screenshots, Code Snippets, Activity Log) | ✅ present as "APPENDIX" | Re-title "Chapter 8: Appendix". Contains User Manual (✅ drafted), screenshot placeholders, and a **12-week Activity Log** (✅ drafted, matches template weeks). |

---

## 4. Formatting standards (from the FORMAT file) — must be applied to `Project_report.docx`

- **Printing:** single-sided
- **Font face:** Times New Roman *or* Arial (pick one, use throughout)
- **Font size:** headings **14 pt**, body **12 pt**
- **Line spacing:** ~**1.5** between paragraphs
- **Margins:** Left **1.5"**, Right **1.0"**, Top **1.0"**, Bottom **1.0"**
- **Page size:** A4
- **Colour:** all black (no coloured text)
- **Page numbers:** start at **Chapter 1** and run through **Chapter 8** (front matter is not numbered, or uses roman numerals)
- **References:** APA style only

---

## 5. Placeholders in the draft that need real project material

Everything below is currently bracketed text or a vague "should be inserted" note:

1. **Project Guide name** — appears as "Project Guide" on the title page, certificate, declaration, acknowledgement. (PDF example: "Prof. Khushi Mam, Assistant Professor".)
2. **Dates / Place** on Certificate, Declaration, Organization Certificate.
3. **2.2 Organization Structure** — write it (roles/functions of Fleuréa Petals, e.g. owner/maker, order handling, customization, delivery).
4. **3.6 Database Design** — real PostgreSQL table list (e.g. `products`, `customers`, `orders`, `order_items`, `custom_requests`) + **ER diagram** image.
5. **3.7 UML Diagrams** — Use-Case, Activity, ER, Sequence, Class diagrams (as images).
6. **4.1 / 4.3** — convert to tables; add exact versions of Next.js / .NET / PostgreSQL used.
7. **4.5 User Interface Screens** — real screenshots: Home, Product Listing, Product Details, Order Form, Custom Bouquet Form, Order Confirmation.
8. **4.6 Sample Source Code** — 1 React/Next component, 1 .NET API endpoint, 1 PostgreSQL query — from the actual build.
9. **5.1 Test Cases** — fill Actual Result + Pass/Fail once tested.
10. **5.2 Results and Outputs** — screenshots of working flows.
11. **Chapter 7 References** — rewrite the 4 stubs in proper APA format + add anything actually used.
12. **Appendix** — same screenshots again + short code snippets + signed Activity Log.
13. **Table of Contents / List of Figures / List of Tables** — generate after everything else is placed and paginated.

---

## 6. Suggested order of work

1. Fix **structure**: add missing front-matter sections, correct Chapter 2 headings, renumber Ch.5, retitle References/Appendix as Ch.7/Ch.8.
2. Apply **formatting standards** (font, sizes, margins, spacing, page numbers).
3. Fill **text-only placeholders** (guide name, 2.2, APA references, dates).
4. Insert **project artefacts** (diagrams, ER, screenshots, code) once the app is far enough along.
5. Convert appropriate sections to **tables** (3.3/3.4 optional, 4.1, 4.3, 5.1).
6. Generate **TOC / List of Figures / List of Tables** last.
7. Proofread against the PDF for depth and tone; export final PDF.

---

## 7. Key differences to remember

- The PDF example is **MySQL + Node/Express + React(Vite)**; our project is **PostgreSQL + .NET + Next.js**. Do **not** copy its technical wording — only its layout and level of detail.
- The PDF example is an **admin-only internal management system**; ours is a **customer-facing ordering app**. The "organization" framing differs: for us the org is the *client business* (Fleuréa Petals), and the app is customer-facing, so Chapter 2 should describe the business, and Chapter 3+ the customer app.
- Template says **Chapters 1–8** (References and Appendix count as chapters); the draft currently treats them as unnumbered back-matter.
