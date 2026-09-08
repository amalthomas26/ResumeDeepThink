# ResumePro — agent rules

This project has a full written plan in docs/plan/ — read the relevant file before
starting any task in that area. Do not deviate from decisions already made there
without flagging it first.

- Backend: NestJS. Deterministic ATS scoring engine is plain TypeScript, NO AI calls
  (docs/plan/02-ats-scoring-engine.md). AI insights are a separate module, Gemini API,
  structured output only (docs/plan/03-ai-integration.md).
- Frontend: React + Tailwind + Zustand, SPA. Visual design must match
  design/resumepro-results-mockup.html and docs/plan/09-design-and-wireframe.md —
  do not fall back to a generic card-grid/dashboard layout.
- Payments: Cashfree. Webhook signature verification and server-side price resolution
  are non-negotiable on every payment-related change (docs/plan/05-payment-integration.md).
- Before implementing a phase, state which file in docs/plan/ you're following and any
  point where you think it should change — don't silently diverge from it.
  All code should follow SOLID principles.