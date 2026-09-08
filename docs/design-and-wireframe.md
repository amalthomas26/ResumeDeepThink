# Design Direction

## Where the concept comes from
ResumePro's actual job is literally "read a document the way a machine reads it, then show a human what was found." That's the design brief — not "SaaS dashboard," not "AI tool." The concept: **an annotated document, not a dashboard.** The resume itself stays visually present and central (it's a paper, a real document on a desk), with findings shown as margin annotations next to it — the same mental model as a reviewer marking up a paper, or comments in the margin of a Google Doc. This is grounded in the product, not decoration, and it naturally avoids the generic "gauge + card grid" template every resume-checker competitor already uses.

## Why this avoids the current AI-generic defaults
- Not cream-background-plus-terracotta, not near-black-plus-neon — palette below is a cool paper tone with an ink/pine/rust system tied to real meaning (pass/flag), not a trend color.
- Not the SaaS-card-kit (identical rounded cards with the same soft shadow) — the diagnostic report uses hairline dividers between categories, because the categories genuinely are a sequential, distinct list — not decorative cards standing in for content.
- No tracked-out ALL-CAPS eyebrows, no middle-dot-joined meta strings, no arrow-suffixed buttons, no monospace-for-everything.

## Design tokens

**Color**
| Token | Hex | Role |
|---|---|---|
| Canvas | `#EEF1F3` | App background — cool, pale, "scanner light," not warm cream |
| Paper | `#FFFFFF` | The resume preview surface — a literal page on the canvas |
| Ink | `#16213D` | Primary text, borders, the "pen" color |
| Pine | `#2C6B4F` | Pass/positive/primary CTA — confident, not typical SaaS blue/purple |
| Rust | `#C1573B` | Flagged issues only — functional, never decorative |
| Amber | `#E7A93B` | Score-band highlight mark only — used once per screen, sparingly |

**Type**
- **Source Serif 4** — headlines and all body/paragraph copy (insights, descriptions). A serif reads as editorial/human, which offsets the "machine scoring you" premise with warmth, and doubles as the headline face with no second display font needed.
- **IBM Plex Mono** — reserved strictly for data: the score number, rule status tags (`PASS`/`FLAG`), category labels in the diagnostic list. This is a functional choice (these are literally machine-parsed data points), not a decorative "tech" signal.

**Layout**
- Two-pane, asymmetric, left-aligned throughout (no centered hero treatment inside the app itself — that's reserved for the separate marketing site).
- Left pane: the resume preview, rendered as an actual paper rectangle with a subtle drop shadow (the *only* shadow in the UI — used because it's literally a page, not a UI affordance sprinkled everywhere).
- Right pane: score band + diagnostic report, divided by 1px hairline rules between categories, not cards.
- One motion moment: on the loading state, a soft horizontal light-band sweeps down the resume preview once, synced to checklist items resolving in the right pane one at a time. No hover-lift animations, no fade-up-on-scroll — everything else is static and calm.

## The three core screens
1. **Upload** — minimal: drag-and-drop the paper directly onto the canvas, a resume-type selector below it. No hero illustration, no marketing copy here (that lives on the separate SEO'd landing page).
2. **Scanning** — the two-pane layout appears immediately with a blank/skeleton paper, checklist items resolve one by one in the right pane in real time as the backend emits them (see `01-architecture.md` SSE flow), scan-line sweep on the left.
3. **Results** — same layout, now populated: score band + label at the top of the right pane, diagnostic categories below it (hairline-divided, not cards), AI insights (bottlenecks + fixes) as the final section, resume preview on the left with small ink/rust tick marks in the margin next to the lines each finding refers to.

## Wireframe and mockup
A structural wireframe (screen layout/regions) and a coded high-fidelity mockup of the Scanning/Results screen are provided as separate deliverables alongside this plan — see the presented files. The mockup is real HTML/Tailwind, close enough to the token system above to lift directly into the React build; treat it as the visual source of truth, this document as the reasoning behind it.