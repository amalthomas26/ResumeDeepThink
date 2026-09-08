# ResumePro — Product Overview

## What it is
A web app that scores a resume against ATS (Applicant Tracking System) parsing rules, explains *why* it scored that way, and tells the user exactly what to fix. Not a resume builder in v1 — a resume **diagnostic tool**. Building the checker first is the right call: it needs no auth to deliver value, generates the "wow, it found real problems" moment that makes people trust the premium plan, and is 10x less work than a full builder (no template system, no drag-and-drop editor, no PDF generation pipeline).

## Decision log (the things you asked "which one" about)
These are settled, not open — the rest of the docs build on top of them:

| Question | Decision | Why |
|---|---|---|
| Backend | NestJS (Node, TypeScript) | Matches your stack, modular by default (good for the scoring pipeline), first-class support for queues/guards/interceptors which this app needs a lot of |
| Frontend | React + Tailwind + Zustand, SPA | As requested, with one carve-out — see `06-seo-strategy.md`. Pure SPA and "top-in-class SEO" conflict; the fix is a hybrid, not a compromise on the SPA app itself |
| AI provider | Google Gemini, via **Google AI Studio API key**, not your Gemini Pro subscription | Your Gemini **Pro/Ultra subscription is a consumer product** (gemini.google.com / the app) — it has no API access and cannot be billed for server-side calls. You need a separate Gemini **API** key from Google AI Studio with billing enabled. Free-tier API quota (currently a handful of requests/minute, no cost) is fine for local dev and your first weeks of real users; budget for pay-as-you-go once you're past ~50-100 checks/day. See `03-ai-integration.md` for model choice and per-check cost. |
| Payment gateway | Cashfree (Individual/PAN KYC) as primary, Instamojo as fallback | No-GST path exists but is capped and gateway-specific — see `05-payment-integration.md` |
| Resume types | Tech, Finance/Accounting, Customer Support/Ops, General/Other (extensible) | Each gets its own keyword taxonomy and section-weighting profile, not a single generic rubric — see `07-resume-type-handling.md` |

## Tiers (as specified)
- **Anonymous (no login):** 3 resume checks. Tracked by a signed device fingerprint + IP, not just a cookie (cookies alone are trivially reset — see `04-auth-and-tiers.md` for the abuse model).
- **Logged in (free):** +2 checks (5 total), personalization unlocked (saved history, resume type auto-remembered, tracked score-over-time).
- **Premium:** ₹49/month or ₹549/year (₹45.75/mo effective, ~7% discount — frame the yearly plan as "get 1 month free" in the UI, it converts better than a raw % badge). Unlimited or high-cap checks (recommend a soft cap like 100/month even on premium — see `05-payment-integration.md` for why unlimited is a liability) + full AI insights depth + resume history + priority AI model for insights.

## What "done" looks like for v1
1. Upload a resume (PDF/DOCX) → see a step-by-step scan animation → get a score (0-100) with a full breakdown.
2. AI-generated insights: bottlenecks + concrete fixes, tailored to resume type.
3. Optional login for 2 extra checks + history.
4. Premium upgrade via Cashfree, monthly or yearly.
5. Fast, crawlable marketing pages; SPA app behind them.

## Reading order for the rest of this plan
`01-architecture.md` → `02-ats-scoring-engine.md` → `03-ai-integration.md` → `04-auth-and-tiers.md` → `05-payment-integration.md` → `06-seo-strategy.md` → `07-resume-type-handling.md` → `08-edge-cases.md` → `09-design-and-wireframe.md` → `10-roadmap.md`