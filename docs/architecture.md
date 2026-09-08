# Architecture

## High-level flow
```
Browser (React SPA)
   |
   |  1. POST /resume/upload (multipart, resume file + resumeType hint)
   v
NestJS API
   |-- FileIngestModule    -> validates, virus-scans, extracts raw text
   |-- ScoringModule       -> deterministic ATS rules engine (fast, no AI)
   |-- AiInsightModule     -> calls Gemini for qualitative insights (slow-ish)
   |-- UsageModule         -> enforces free/premium check limits
   |-- AuthModule          -> optional JWT auth (email/OTP or Google OAuth)
   |-- PaymentModule       -> Cashfree webhooks, subscription state
   v
Postgres (primary data)  +  Redis (rate limits, job queue, SSE progress)  +  S3-compatible storage (resume files, short TTL)
```

## Why this split (deterministic scoring vs. AI insights are two separate modules)
This is the single most important architectural decision in the app. Don't send the resume to Gemini and ask "give me a score out of 100." That produces:
- Non-deterministic scores (same resume, different score on retry) — destroys trust instantly for a tool whose entire value prop is "accurate."
- No way to show the step-by-step checklist you want in the loading screen, because you don't control the steps — the model does.
- 3-5x higher cost and latency for the part of the product (the score) that doesn't need a model at all.

Instead:
- **Score = deterministic rules engine**, written in plain TypeScript, no AI involved. It parses the resume into structured sections (contact, summary, experience, education, skills), runs ~15-20 checks (see `02-ats-scoring-engine.md`), and sums weighted points. This is fast (<200ms), free, reproducible, and testable with unit tests per rule.
- **AI insights = Gemini**, called once per check, given the *already-scored, already-parsed* resume as structured JSON, and asked only to explain and prioritize — not to invent a score. This is the part users pay for the depth of.

This also directly solves your loading-screen requirement: you can emit the 15-20 deterministic rule names as discrete progress events in real time (each one genuinely just ran), instead of faking a progress bar over a single opaque AI call.

## Module breakdown (NestJS)
- **FileIngestModule**: accepts PDF/DOCX, extracts text (`pdf-parse` for PDF, `mammoth` for DOCX), detects if a PDF is image-only/scanned (no extractable text layer) and routes to a warning path rather than silently returning an empty resume (see `08-edge-cases.md`).
- **ScoringModule**: pure functions, one file per rule category (`formatting.rules.ts`, `keywords.rules.ts`, `structure.rules.ts`, `contact.rules.ts`, `impact.rules.ts`). Each rule returns `{ id, passed, points, maxPoints, message }`. This is what streams to the frontend as "checking..." events.
- **AiInsightModule**: builds a structured prompt from the ScoringModule's output + resume type, calls Gemini with a strict JSON schema (see `03-ai-integration.md`), validates the response shape before trusting it (never render raw model output directly into the DOM without validation — treat it as untrusted structured data, not HTML).
- **UsageModule**: single source of truth for "can this request run a check." Checks device fingerprint / user ID against Redis counters before FileIngestModule even runs, so you never burn compute or AI cost on a request that's over quota.
- **AuthModule**: optional. Email OTP (cheapest, no OAuth app review, works for a solo dev) as primary; add Google OAuth later once you have traction, since a lot of users bounce off "enter your email" for OTP-based flows but Google sign-in is 1-click.
- **PaymentModule**: owns Cashfree order creation + webhook verification + subscription state machine. Nothing else in the app should talk to Cashfree directly.

## Real-time progress (the "steps being checked" loading window)
Use **Server-Sent Events (SSE)**, not WebSockets. You only need one-directional server→client progress updates for a single request-response lifecycle — SSE is simpler to implement in NestJS, works over plain HTTP/1.1, auto-reconnects in the browser natively, and avoids the operational overhead of a WebSocket gateway for something this simple.

Flow: `POST /resume/check` kicks off processing and immediately returns a `checkId`. Frontend opens `GET /resume/check/:checkId/stream` (SSE). Backend emits one event per rule as it completes (`{ step: "Parsing contact information", status: "pass" }`), then a final `{ type: "complete", result: {...} }` event with the full score + AI insights once both the rules engine and Gemini call finish. If the rules engine finishes in 200ms but Gemini takes 3-4s, don't block the step animation on Gemini — show all deterministic steps completing quickly, then a distinct final step "Generating personalized insights..." that covers the AI latency. This keeps the animation honest instead of artificially slowed down to "feel" thorough.

## Hosting (cost-conscious, matches "no GST / solo builder" reality)
- **Frontend**: Vercel or Cloudflare Pages (free tier is enough at launch).
- **Backend**: Render or Railway (NestJS as a Docker service) — cheaper and simpler than AWS/GCP for a solo dev at this scale; both have managed Postgres add-ons.
- **File storage**: Cloudflare R2 (S3-compatible, no egress fees — matters because resume files get downloaded back for the AI call and preview).
- **Redis**: Upstash (serverless Redis, pay-per-request, fits bursty low-volume traffic better than a fixed Redis instance at this stage).

None of this needs GST or a registered business to sign up for — all bill in USD to a personal card, which is a separate question from *collecting* INR payments from your users (that's `05-payment-integration.md`).