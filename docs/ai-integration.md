# AI Integration (Gemini)

## Important correction on your Gemini access
Your **Gemini Pro/Ultra membership** (billed via Google One / the Gemini app) is a **consumer subscription** — it gives you higher limits in the Gemini chat app and Gmail/Docs integration. It does **not** give your NestJS backend API access, and there's no way to point server code at it. What you need instead:
1. Go to **Google AI Studio** → create an API key.
2. Enable billing on the associated Google Cloud project (pay-as-you-go). There's a free tier (limited requests/minute, no credit card needed to start), which is enough for development and a soft launch, but production traffic beyond a trickle needs billing enabled or you'll hit hard rate limits.
3. Your Gemini Pro subscription and your API billing are two separate invoices — budget for API costs separately, they will not be "used up" or "free" because of the subscription.

## Model choice — use two different models for two different jobs
Don't use one model for everything; the two AI-touching jobs in this app have very different cost/quality needs:

| Job | Model | Why |
|---|---|---|
| Resume text extraction cleanup (only when needed — see edge cases) | **Gemini Flash-Lite tier** (cheapest current Flash-Lite model) | High volume, simple structured task, near-zero reasoning needed, cost matters most here since every free-tier check hits it |
| Qualitative insights (bottlenecks + fixes, tailored to resume type) | **Gemini Flash (standard, not Lite)** | This is the paid differentiator — worth spending more per call for noticeably better writing and prioritization quality. Reserve the higher tier for logged-in/premium users if you need to control cost early; give free anonymous users the Lite-tier insight generation |

Check current exact model IDs and pricing at `ai.google.dev/gemini-api/docs/pricing` before you build — Google ships new Flash versions every few weeks and old IDs get deprecated. Build the model name as an environment variable, never hardcoded, so a model deprecation is a config change, not a deploy.

## Structured output, not free text
Call Gemini with a strict JSON response schema (`responseSchema` in the Gemini API) — never ask it to "write a paragraph of feedback" and then try to parse that on the frontend. Define the shape you need up front:

```json
{
  "bottlenecks": [
    { "category": "Keywords", "issue": "string", "severity": "high|medium|low" }
  ],
  "fixes": [
    { "category": "Keywords", "action": "string", "example": "string" }
  ],
  "summary": "string, max 2 sentences"
}
```
Validate this response against a schema (Zod on the NestJS side) before it ever reaches the frontend. If validation fails, retry once with a stricter prompt, then fall back to a generic category-level message rather than showing a broken UI or raw JSON to the user. Never trust an LLM response shape blindly, even with `responseSchema` set — treat it like any other third-party API response that can occasionally be malformed.

## Prompt construction
Feed the model the *output of your deterministic scoring engine*, not the raw resume text alone — give it the parsed sections, the specific rules that failed, and the resume type. This constrains the model to explaining and prioritizing real findings instead of freelancing generic advice ("add more keywords!") disconnected from what was actually detected. Roughly:

```
System: You are an ATS resume reviewer for {resumeType} roles in the Indian job market.
You will be given a resume's parsed structure and a list of rule check results.
Do not invent issues not present in the check results. Prioritize the 3 highest-impact fixes first.
Respond only in the given JSON schema.

User: {parsed sections JSON} + {failed/partial rule results} + {resume type}
```

## Guardrails specific to this product
- **No PII leaves your system unnecessarily**: strip the candidate's phone number and email from what you send to Gemini — the insight-generation task needs none of it. Keep only what's needed for the review (skills, experience bullets, structure).
- **Timeouts**: set a hard 8-10s timeout on the Gemini call. If it times out, still return the deterministic score immediately and show "AI insights are taking longer than usual — refresh in a moment" rather than blocking the whole result.
- **Retry budget**: max 1 retry on a failed/invalid response, not an infinite loop — a check that fails twice should degrade gracefully (deterministic score + a static, rule-based fallback tip per failed category) rather than cost you 3+ calls per user request.
- **Cache nothing resume-specific** (each resume is unique, caching doesn't help), but do cache category-level fallback tips (static, not AI-generated) so a total AI outage doesn't mean zero insights, ever.

## Cost sanity check
A typical resume is short — expect roughly 800-1,500 input tokens (parsed sections + rule results) and 300-600 output tokens (structured insights) per call. On current Flash-tier pricing this puts a single AI insight call at a fraction of a rupee. At ₹49/month for even a modest cap (e.g. 100 checks/month), the AI cost per premium user is a small fraction of the subscription price — the economics work even before counting infra cost. Re-run this math whenever pricing changes; don't assume it stays this favorable forever.