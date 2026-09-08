# Handling Different Resume Types

## Why this can't be one generic rubric
"Add more keywords" means something completely different for a backend engineer, a financial analyst, and a customer support lead. A single generic keyword list either misses obvious gaps (a finance resume with zero mention of "reconciliation," "variance analysis," or "SAP/Tally" scores fine on a generic rubric) or unfairly penalizes valid resumes (a support resume with no "Python" or "React" shouldn't lose keyword points against a tech taxonomy).

## Structure: a `ResumeTypeProfile` per category
Each resume type is a config object, not a hardcoded branch of if/else logic — this is what lets you add "marketing," "sales," "design," etc. later without touching the scoring engine's core logic:

```ts
interface ResumeTypeProfile {
  id: 'tech' | 'finance' | 'support' | 'general';
  label: string;
  hardSkillKeywords: string[];       // weighted keyword bank
  softSkillKeywords: string[];       // lower weight than hard skills
  expectedSections: string[];        // e.g. finance often has "Certifications" (CFA/CA) as a near-required section
  impactMetricPatterns: RegExp[];    // what "quantified impact" looks like per field
  actionVerbBank: string[];          // "engineered/deployed" vs "reconciled/audited" vs "resolved/de-escalated"
}
```

### Tech
- Hard skills: languages/frameworks (JS, Python, React, Node, AWS, Docker, SQL, etc.), pulled from a maintained list, not a fixed one-time snapshot — this taxonomy goes stale fast (new frameworks) and needs a quarterly review.
- Impact patterns: latency/performance numbers, uptime %, user/scale figures, "reduced load time by X%."
- Common failure mode to check for: skills dumped as an unstructured paragraph instead of a discrete list (very common in self-taught/bootcamp resumes) — flag this specifically rather than just under-scoring keywords, since the fix (reformat into a list) is different from the fix for genuinely missing skills.

### Finance
- Hard skills: tools (Excel/advanced formulas, SAP, Tally, QuickBooks, Power BI), domain terms (reconciliation, variance analysis, P&L, forecasting, audit, compliance, GST/TDS for Indian finance roles specifically), certifications (CA, CFA, CPA, MBA-Finance) as a distinct expected section.
- Impact patterns: currency figures (₹/$/€), percentage-based metrics (cost reduction %, accuracy %), portfolio/budget sizes.
- Common failure mode: certifications buried in the education section instead of a distinct, scannable "Certifications" section — many finance recruiters and ATS keyword searches specifically query cert fields.

### Customer Support / Ops
- Hard skills: tools (Zendesk, Freshdesk, Salesforce Service Cloud, Intercom), metrics vocabulary (CSAT, NPS, SLA, first-response time, ticket volume, resolution rate).
- Impact patterns: CSAT/NPS scores, ticket volume handled, resolution time improvements, escalation rate reductions.
- Common failure mode: support resumes lean heavily on soft-skill adjectives ("great communicator," "team player") with almost no quantified impact — this profile should weight the "quantified impact" rule more heavily relative to keyword presence, since the fix that matters most here is usually "add numbers," not "add keywords."

### General/Other (fallback)
- A conservative, broadly-applicable profile (generic professional keywords, standard section expectations) used when the user doesn't pick a type or the resume doesn't clearly match one — never force a resume into a wrong-fit category, a bad match here (e.g. scoring a teacher's resume against the tech taxonomy) is worse than a slightly generic score.

## Detecting the type (don't just rely on a dropdown)
Let the user pick a resume type explicitly (a simple selector before upload — cheap, accurate, avoids misclassification entirely), but also run a lightweight auto-detect (keyword-density match against each profile) as a **suggestion**, not a silent override — e.g. "This looks like a Finance resume — switch to the Finance rubric?" if the user's stated type and the detected type disagree. Never silently rescoring against a type the user didn't choose; it breaks trust in exactly the kind of tool whose entire pitch is "this is accurate."

## Extensibility note
Adding a 5th, 6th, 7th resume type later should mean adding one new `ResumeTypeProfile` object and updating the frontend dropdown — not touching `ScoringModule` internals. If you find yourself editing the core scoring functions to add a new type, the abstraction has leaked and needs fixing before you scale category count.