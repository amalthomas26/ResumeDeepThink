# SEO Strategy

## The conflict you need to know about upfront
"Top-in-class SEO" and "pure React SPA" pull against each other. A client-side-rendered SPA ships an almost-empty HTML shell and builds the page in the browser with JavaScript — Google can eventually render and index JS-heavy pages, but slower, less reliably, and worse on Core Web Vitals (a direct ranking factor) than pre-rendered HTML. If "top-in-class SEO" is a real requirement and not a nice-to-have, the honest fix is architectural, not a meta-tag checklist.

## The fix: split the app by what actually needs to rank
Not everything in ResumePro needs to be crawlable — only the pages a stranger finds via Google search do.

| Route | Needs SEO? | Rendering |
|---|---|---|
| `/` (landing), `/pricing`, `/blog/*`, `/resume-tips/tech-resume-ats-guide` etc. | **Yes** — these are your acquisition surface | Static-generated (SSG) or server-rendered HTML |
| `/app`, `/app/check`, `/app/results/:id`, `/app/dashboard` | No — these are behind an action (upload a resume), not something anyone searches for and lands on directly | Pure React SPA, exactly as planned, zero compromise |

Build the marketing/content pages with **Astro** (or Next.js if you'd rather stay all-React) as a *separate small app* that statically generates HTML at build time, deployed on the same domain (e.g. Astro serves `/` and `/blog/*`, and `/app/*` is your Zustand+React SPA, routed at the CDN/edge level so it's invisible to the visitor that two different rendering strategies exist). This gets you genuinely fast, fully pre-rendered HTML for every page Google needs to index, while keeping the actual product exactly as you specified — a client-rendered SPA — for the logged-in/working experience where SEO is irrelevant anyway.

If you'd rather not run two apps: Next.js App Router can do both (SSG marketing pages + a fully client-rendered `/app` section) inside one codebase, at the cost of learning Next.js conventions instead of a plain Vite SPA. Pick based on how much you value staying in a stack you already know versus a marginally cleaner single-repo setup — either gets you a technically correct result.

## Content strategy (this is most of what "top-in-class SEO" actually is)
Technical SEO gets you crawlable; content is what actually ranks. For a resume-checker tool, the realistic high-intent search terms are things like "ats resume checker free," "why is my resume not getting shortlisted," "ats friendly resume format for [tech/finance/customer support]," "resume score checker india." Build:
- A genuinely useful, indexable **free-tool landing page** per resume type (`/ats-checker/tech-resumes`, `/ats-checker/finance-resumes`, etc.) — each targets its own keyword cluster and doubles as a natural entry point that pre-selects the right resume type for the tool.
- A **blog/guide section** with real, specific content (not thin AI-generated filler — Google's ranking systems specifically demote unhelpful, mass-produced content, and this exact niche is saturated with low-effort "10 resume tips" pages). Write from what your own scoring engine actually detects — "we analyzed X resumes and the #1 reason ATS systems reject Indian tech resumes is Y" is genuinely differentiated content only you can write, because it comes from your own data.

## Technical SEO checklist (apply to the marketing pages)
- Semantic HTML, one `<h1>` per page, proper heading hierarchy — not styled `<div>`s standing in for headings.
- `next-seo`/Astro equivalent for per-page `<title>`, meta description, canonical URL, and Open Graph/Twitter card tags — every page, not just the homepage.
- **Structured data (JSON-LD)**: `SoftwareApplication` schema on the tool page, `FAQPage` schema on any FAQ content, `Article`/`BlogPosting` on blog posts — this is what earns rich results in search, a real differentiator against competitors who skip it.
- Core Web Vitals: since the marketing pages are static HTML, this is mostly "don't undo it" — lazy-load below-the-fold images, avoid render-blocking third-party scripts on the landing page, self-host fonts instead of a render-blocking Google Fonts request.
- `sitemap.xml` and `robots.txt` generated at build time from your actual route list, not hand-maintained (they will drift out of sync otherwise).
- Internal linking: every blog post links to the relevant `/ats-checker/:type` page and vice versa — this is free, high-value SEO equity that a lot of small SaaS sites skip.

## What NOT to do
- Don't try to make the `/app/*` SPA itself "SEO-friendly" via hacks like prerendering every possible results page — results pages contain a stranger's resume data, they should never be publicly indexable at all (this is also a privacy requirement, see `08-edge-cases.md`). Trying to rank a logged-in tool's internal pages is wasted effort and a data-exposure risk in one move.
- Don't buy into "AI SEO"/keyword-stuffed pages generated purely to rank — for a resume tool audience specifically (people already worried about being penalized by an algorithm for gaming a system), thin content will hurt brand trust even before it hurts your Google ranking.