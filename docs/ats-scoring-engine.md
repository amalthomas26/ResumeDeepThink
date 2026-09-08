# ATS Scoring Engine

## Design principle
Every rule in this engine must map to something a *real* ATS (Workday, Greenhouse, Taleo, iCIMS, Lever) actually does when it parses a resume: extract text, split into sections, tag entities (name, email, phone, dates, job titles, skills), and index keywords for recruiter search. Score what breaks that pipeline — not vague "quality" — that's the AI insight layer's job.

## The rule categories (also = your loading-screen steps, in run order)
Each category below is shown to the user as a step label while it runs (e.g. "Checking file format compatibility…" → ✅/⚠️). Weight is out of 100 total.

### 1. File & format integrity — 15 pts
- File is a real PDF/DOCX, not a renamed image or corrupted file (5 pts)
- Text layer is extractable (not a scanned/image-only PDF) (5 pts) — critical check, see edge cases doc
- No unsupported encoding issues (garbled characters from bad PDF export) (5 pts)

### 2. Contact & identity parsing — 10 pts
- Name is detected as a standalone element near the top, not buried in a paragraph (3 pts)
- Email present and regex-valid (3 pts)
- Phone number present and in a parseable format (2 pts)
- LinkedIn/portfolio URL detected and valid (2 pts)

### 3. Structural parsing — 20 pts
- Standard section headers detected (Experience, Education, Skills, Summary) using a fuzzy-matched header taxonomy, not exact strings — "Professional Experience," "Work History," "Employment" all map to "Experience" (10 pts)
- No multi-column layout detected (columns break ATS reading order — most parsers read left-to-right across the whole line, jumbling a two-column resume into nonsense) (5 pts)
- No tables/text boxes used for content (same failure mode as columns, plus many parsers skip text-box content entirely) (5 pts)

### 4. Keyword & skills alignment — 25 pts
- Skills section present and parses into a clean, discrete list (not a paragraph of prose) (5 pts)
- Resume-type-specific hard-skill keyword coverage against the taxonomy for the detected/selected resume type (15 pts) — see `07-resume-type-handling.md`
- No obvious keyword stuffing (a skills list with 60 keywords in white 1pt font or repeated 10x is a real thing people try — detect abnormal keyword density/repetition and penalize, don't reward it) (5 pts)

### 5. Experience quality signals — 20 pts
- Dates present and in a consistent, parseable format per entry (5 pts)
- Bullet points start with strong action verbs, not "Responsible for…" (5 pts)
- Quantified impact present (numbers, %, ₹/$ figures, team sizes) in a meaningful share of bullets (10 pts) — count, don't just detect presence, since one stray number shouldn't max this out

### 6. Length & density — 10 pts
- Word count and page-estimate within reasonable range for experience level (a 1-page resume for 12 years of experience or a 3-page resume for a fresher are both flagged, in opposite directions) (5 pts)
- No large blank sections or near-empty resume (5 pts)

**Total: 100.** Each rule returns partial credit where it makes sense (e.g. "3 of 5 expected sections found" = proportional points), not just pass/fail — binary scoring on a 100-point scale feels arbitrary to users when they're 1 point off a threshold.

## Score bands (for the results screen, not just a raw number)
- 85-100: "Strong — minor polish only"
- 65-84: "Workable — several fixable gaps"
- 40-64: "At risk — likely to be mis-parsed or under-indexed by ATS"
- 0-39: "High risk — significant rewrite needed"

Show the band label prominently, the raw number secondarily. Users act on "you're at risk," not "you're a 61."

## What this engine explicitly does NOT try to do
- Judge writing quality/grammar — that's a job for a lightweight grammar check (e.g. a regex/heuristic pass for common issues) or left to the AI insight layer to *mention*, not score.
- Guess whether the person is a good fit for a specific job posting — that's a different, much harder product (JD-matching) you can add later as a premium feature ("paste a job description, get a match score"), not v1 scope.
- Detect lies or verify claims — out of scope entirely.

## Implementation note
Write this as ~20 small pure functions, each independently unit-testable with 3-5 sample resumes (a clean one, a two-column one, a scanned-image one, an empty one, a keyword-stuffed one). This is the highest-leverage test suite in the whole app — it's the thing your "accurate scoring" reputation lives or dies on, and it's the cheapest part of the system to test exhaustively since it has zero AI non-determinism.