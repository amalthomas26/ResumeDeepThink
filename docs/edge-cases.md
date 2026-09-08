# Edge Cases (Consolidated)

Organized by the part of the system each case hits. Each one names the failure and the specific handling — not "handle errors gracefully."

## File upload & parsing
- **Scanned/image-only PDF (no text layer)**: `pdf-parse` returns empty/near-empty text. Detect this explicitly (text length below a sane threshold relative to file size/page count) and **do not silently score an empty resume as if it were bad content** — that produces a nonsensical near-zero score that looks like a bug, not a real result. Instead, short-circuit to a distinct result state: "We couldn't read text from this file — it looks like a scanned image. Try exporting your resume as a text-based PDF (Word → Save as PDF, not a scanned copy)." This also directly doubles as real, accurate ATS advice, since a real ATS fails on this exact file the same way.
- **Corrupted or non-resume file** (a random PDF, an image renamed to `.pdf`, a zip file): validate file signature/magic bytes server-side, not just the file extension — reject with a clear message before it reaches the scoring pipeline at all.
- **File too large**: cap at a sane limit (e.g. 5MB — resumes are text-dominant and should never legitimately approach this) and reject with a clear message before upload completes, not after a timeout.
- **Malicious file upload**: run an antivirus/malware scan step (e.g. ClamAV in the ingest pipeline, or a hosted scanning API) before the file touches any parsing library — parsing libraries have had real CVEs around malformed PDFs, and this is a public upload endpoint by definition.
- **Non-English resumes**: decide and state a v1 policy rather than silently mis-scoring — either detect language and show "currently optimized for English-language resumes, results may be less accurate" or explicitly restrict uploads to English for v1 and say so upfront. Silently running the English-tuned rules/keyword taxonomy against, say, a Hindi resume and returning a confident-looking low score is actively misleading.
- **Extremely short/sparse resumes** (a fresher with almost no content) and **very long resumes** (10+ pages): both need distinct messaging from a "bad" resume — a fresher's short resume isn't a formatting failure, it's a different baseline expectation (see resume-type handling for adjusting length scoring by apparent experience level, inferred from date ranges present).
- **Password-protected files**: detect and return a specific "this file is password-protected, please remove the password and re-upload" message rather than a generic parse failure.

## Scoring engine
- **Resume with no dates at all** (common in some support/ops resumes that list roles without clear tenure): don't crash the date-consistency rule — treat missing dates as its own flagged issue ("add employment dates for each role") rather than a null-pointer path.
- **Ambiguous section headers** (a creative resume that uses "My Journey" instead of "Experience"): the fuzzy header-matching should have a confidence threshold; below it, flag as "we couldn't confidently identify an Experience section" rather than either guessing wrong or crashing.
- **Multiple resumes' worth of content pasted/merged into one file** (rare but happens): if parsed length is wildly outside normal bounds with duplicate section headers detected, flag distinctly rather than scoring as one confused resume.

## AI insight layer
- Covered in depth in `03-ai-integration.md` (timeouts, schema validation, fallback tips) — the summary edge case principle: **the deterministic score must never depend on the AI call succeeding.** A Gemini outage should degrade the product to "score, no AI insights yet," never to "no result at all."

## Usage limits & abuse
- Covered in depth in `04-auth-and-tiers.md` — device fingerprint resets, shared-IP false positives, login-time quota migration, account deletion/recreation loophole.
- **Bot/scripted abuse of the anonymous 3-check limit at scale** (not a casual individual, but someone scripting hundreds of fake checks): add a basic rate limit per IP independent of the per-device check count (e.g. max N upload requests per IP per hour via Redis), which catches scripted abuse without affecting normal users who'd never hit that request rate.

## Payment
- Covered in depth in `05-payment-integration.md` — webhook signature verification, idempotent webhook handling, server-side price enforcement, renewal failure grace period, cancellation timing, refund policy.
- **Currency/amount mismatch or tampered client request**: never accept a price or plan-to-amount mapping from the frontend; always resolve amount server-side from the plan ID.
- **Double-submission** (user double-clicks "Pay" or refreshes mid-payment): disable the button on click and check for an existing pending order for that user/plan before creating a new one, to avoid duplicate orders/charges.

## Privacy & data handling (this is a resume-upload tool — treat it accordingly)
- **Resume files contain PII by definition** (name, phone, email, sometimes address). Set a **short retention window** on raw uploaded files (e.g. auto-delete the original file from storage after 30 days, or immediately after processing if you don't need to support re-download) — keep only the derived score/insights, not the source file, for longer-term history features.
- **Results pages must never be publicly accessible by guessable/sequential IDs** — use non-sequential IDs (UUID) and require the requesting session/account to match the check's owner; a results page containing someone's resume content is a real data leak if it's just `/results/1`, `/results/2`.
- **Right to delete**: give logged-in users a clear "delete my account and data" action that actually removes stored resumes and history, not just deactivates the account — India's DPDP Act (Digital Personal Data Protection Act) creates real obligations here once you're handling personal data at any scale, and building it in from the start is far cheaper than retrofitting it later.
- **Don't log full resume content in application logs** (error logs, request logs) — log check IDs and metadata, never raw resume text/PII, since logs are often less carefully secured than the primary database.

## Internationalization/localization of pricing display
- Show ₹ pricing with clear monthly-vs-yearly framing and a visible "no hidden fees" note near the payment button — small-ticket recurring Indian consumer payments see meaningfully higher drop-off when the total/renewal terms feel unclear, independent of the actual price being low.