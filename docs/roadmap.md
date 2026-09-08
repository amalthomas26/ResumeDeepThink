# Build Roadmap

Build in this order — each phase produces something testable/demoable on its own, and later phases depend on earlier ones being real, not stubbed.

## Phase 1 — Core scoring engine (no AI, no auth, no payment)
- NestJS API, single endpoint: upload → parse → run all deterministic rules → return JSON score breakdown (no SSE yet, just a synchronous response).
- Unit tests for every rule against the 5 sample-resume fixtures described in `02-ats-scoring-engine.md` (clean, two-column, scanned-image, empty, keyword-stuffed).
- Barebones React page to upload and see raw JSON — not the real design yet. Goal here is a correct, trustworthy scoring engine, not a pretty screen.

## Phase 2 — Real-time UX + design
- SSE streaming of rule-check progress.
- Build the actual Results/Scanning screens to the design in `09-design-and-wireframe.md`.
- Zustand store for check state (idle → uploading → scanning → results).

## Phase 3 — AI insights
- Gemini API integration per `03-ai-integration.md` — structured output, schema validation, fallback path.
- This is the first phase where a real API key + billing setup is needed — do this once Phases 1-2 are solid so you're not debugging AI flakiness and scoring bugs at the same time.

## Phase 4 — Anonymous usage limits
- Device fingerprint + Redis counters, the 3-check wall, all the edge cases in `04-auth-and-tiers.md` around resets and shared IPs.

## Phase 5 — Auth + personalization
- Email OTP login, history migration from anonymous to account, the +2 bonus checks, score history view.

## Phase 6 — Payments
- Cashfree integration, the two plans, webhook handling, subscription state machine, grace periods, cancellation — all of `05-payment-integration.md`.
- This is deliberately last among the product features (not last overall) — you want real usage data and a working funnel before wiring up billing, so you're not debugging payment edge cases against a product that's still changing shape underneath it.

## Phase 7 — SEO/marketing site
- Can actually start in parallel with Phase 1 by a second thread of effort (it's a separate small app per `06-seo-strategy.md`) — the content writing (blog posts, per-resume-type landing pages) takes real time regardless of when the code is ready, so don't leave it to the end.

## Phase 8 — Resume-type expansion & polish
- Add resume type profiles beyond the initial tech/finance/support/general set once you see real usage data on what types users are actually uploading (the auto-detect suggestion in `07-resume-type-handling.md` gives you this data for free).
- Address remaining items in `08-edge-cases.md` you deprioritized for launch (e.g. non-English handling, if you shipped "English only" first).

## What to explicitly cut from v1 (don't build these yet)
- The resume **builder** (templates, drag-and-drop editor) — the checker alone is the whole MVP; the builder is a distinct, much larger product to evaluate after the checker has real traction.
- JD-matching ("paste a job description, get a match score") — a strong Phase-9-or-later premium feature, not a launch requirement.
- Google OAuth — email OTP alone is enough for launch; add OAuth once signup volume justifies the extra integration.