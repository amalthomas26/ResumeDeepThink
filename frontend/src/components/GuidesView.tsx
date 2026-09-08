import { useState } from 'react';
import { useCheckStore } from '../store/check-store';
import { useShallow } from 'zustand/react/shallow';

interface GuidesViewProps {
  readonly onClose: () => void;
}

export function GuidesView({ onClose }: GuidesViewProps) {
  const [activeTab, setActiveTab] = useState<'fresher' | 'tech' | 'finance' | 'myths'>('fresher');

  const { setResumeType, setExperienceLevel, reset } = useCheckStore(
    useShallow((s) => ({
      setResumeType: s.setResumeType,
      setExperienceLevel: s.setExperienceLevel,
      reset: s.reset,
    })),
  );

  const handleStartScanning = (profile: string, level: 'experienced' | 'fresher') => {
    reset();
    setResumeType(profile);
    setExperienceLevel(level);
    onClose();
  };

  return (
    <div className="min-h-screen bg-canvas text-ink py-10 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation Breadcrumb & Back */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-ink-faint uppercase tracking-widest">
              ResumeDeepThink
            </span>
            <span className="text-ink-faint">/</span>
            <span className="font-serif text-sm font-semibold text-ink">ATS Career Guides</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="font-serif text-sm font-semibold text-pine hover:text-pine/80 transition-colors cursor-pointer flex items-center gap-1"
          >
            ← Back to Resume Scanner
          </button>
        </div>

        {/* Hero Banner */}
        <header className="mb-10 text-center sm:text-left">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink tracking-tight mb-3">
            ATS Resume Optimization Guides
          </h1>
          <p className="font-serif text-base sm:text-lg text-ink-muted max-w-2xl leading-relaxed">
            Data-backed breakdowns of how applicant tracking systems parse Indian and global resumes.
            Learn how freshers pass ATS without corporate experience, and how to format every bullet point for maximum impact.
          </p>
        </header>

        {/* Guide Navigation Tabs */}
        <nav aria-label="Guides Navigation" className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('fresher')}
            className={`px-4 py-2 rounded-lg font-serif text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'fresher'
                ? 'bg-pine text-paper shadow-xs'
                : 'bg-paper border border-border text-ink-muted hover:text-ink hover:border-ink-faint'
            }`}
          >
            <span>🎓</span>
            <span>Fresher Guide (Zero Experience)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tech')}
            className={`px-4 py-2 rounded-lg font-serif text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'tech'
                ? 'bg-pine text-paper shadow-xs'
                : 'bg-paper border border-border text-ink-muted hover:text-ink hover:border-ink-faint'
            }`}
          >
            <span>💻</span>
            <span>Tech &amp; Software Roles</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('finance')}
            className={`px-4 py-2 rounded-lg font-serif text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'finance'
                ? 'bg-pine text-paper shadow-xs'
                : 'bg-paper border border-border text-ink-muted hover:text-ink hover:border-ink-faint'
            }`}
          >
            <span>📊</span>
            <span>Finance &amp; Accounting</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('myths')}
            className={`px-4 py-2 rounded-lg font-serif text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'myths'
                ? 'bg-pine text-paper shadow-xs'
                : 'bg-paper border border-border text-ink-muted hover:text-ink hover:border-ink-faint'
            }`}
          >
            <span>🛡️</span>
            <span>ATS Myths Busted</span>
          </button>
        </nav>

        {/* Tab 1: Fresher Guide */}
        {activeTab === 'fresher' && (
          <article className="space-y-8">
            <div className="bg-paper border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-pine uppercase tracking-wider mb-2">
                <span>Fresher Strategy</span>
                <span>·</span>
                <span>Eliminating the Experience Bottleneck</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink mb-4">
                Can You Pass ATS as a Fresher Without Work Experience?
              </h2>
              <div className="space-y-4 font-serif text-ink-muted leading-relaxed text-base">
                <p>
                  <strong>Yes, absolutely.</strong> The biggest misconception among college graduates and early-career job seekers
                  is that applicant tracking systems automatically reject resumes that lack 3-5 years of full-time corporate experience.
                </p>
                <p>
                  In reality, modern enterprise ATS systems (such as Workday, Taleo, Greenhouse, and Lever) parse resumes into distinct
                  data categories. For entry-level and campus recruitment requisitions, recruiters configure candidate matching to evaluate{' '}
                  <span className="text-ink font-semibold">academic capstones, technical projects, internships, hackathons, and certifications</span>{' '}
                  rather than commercial employment tenure.
                </p>

                <div className="my-6 p-4 rounded-xl bg-pine-light/40 border border-pine/30">
                  <h3 className="font-serif text-base font-bold text-pine mb-2">
                    How ResumeDeepThink Evaluates Fresher Resumes Differently
                  </h3>
                  <ul className="list-disc list-inside space-y-1 text-sm text-ink-muted">
                    <li>
                      <strong>Zero Penalty for No Corporate History:</strong> When you select <em>Fresher Mode</em>, our deterministic rules engine evaluates your project bullets, capstones, and open-source contributions in place of formal employment.
                    </li>
                    <li>
                      <strong>Internship Equivalence:</strong> Summer internships, research assistantships, and open-source fellowships count toward practical experience.
                    </li>
                    <li>
                      <strong>Google X-Y-Z Bullet Formula:</strong> We check whether your project descriptions quantify outcomes (e.g. <em>&quot;Accomplished [X] as measured by [Y], by doing [Z]&quot;</em>).
                    </li>
                  </ul>
                </div>

                <h3 className="font-serif text-xl font-bold text-ink mt-6 mb-3">
                  The 3 Golden Rules for a High-Scoring Fresher Resume
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 my-4">
                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <div className="font-mono text-xs font-bold text-pine uppercase mb-1">Rule 1</div>
                    <div className="font-serif text-sm font-bold text-ink mb-1">Headline &amp; Coursework</div>
                    <p className="text-xs text-ink-faint">
                      Include target title (e.g., &quot;Aspiring Backend Engineer&quot;) and 4-6 relevant core CS/Data subjects.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <div className="font-mono text-xs font-bold text-pine uppercase mb-1">Rule 2</div>
                    <div className="font-serif text-sm font-bold text-ink mb-1">Quantify Project Impact</div>
                    <p className="text-xs text-ink-faint">
                      Don&apos;t just say &quot;Built an e-commerce app&quot;. Say &quot;Built a scalable store handling 500+ mock transactions with 99.8% uptime&quot;.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <div className="font-mono text-xs font-bold text-pine uppercase mb-1">Rule 3</div>
                    <div className="font-serif text-sm font-bold text-ink mb-1">GitHub &amp; Portfolio Links</div>
                    <p className="text-xs text-ink-faint">
                      Working GitHub repo links with READMEs prove practical competence far better than generic skill keywords.
                    </p>
                  </div>
                </div>

                {/* Instant CTA */}
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="font-serif text-base font-bold text-ink">Ready to verify your fresher resume?</div>
                    <div className="font-serif text-xs text-ink-faint">Test against our Fresher rubric in &lt;200ms</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartScanning('fresher', 'fresher')}
                    className="px-6 py-3 rounded-xl bg-pine text-paper font-serif text-sm font-bold hover:bg-pine/90 transition-colors shadow-xs cursor-pointer"
                  >
                    Scan Fresher Resume Now →
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Tab 2: Tech Guide */}
        {activeTab === 'tech' && (
          <article className="space-y-8">
            <div className="bg-paper border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-pine uppercase tracking-wider mb-2">
                <span>Engineering Standards</span>
                <span>·</span>
                <span>Indian &amp; Global Tech Markets</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink mb-4">
                The #1 Reason Indian Tech Resumes Get Filtered Out by ATS
              </h2>
              <div className="space-y-4 font-serif text-ink-muted leading-relaxed text-base">
                <p>
                  When analyzing thousands of engineering resumes, the most frequent failure isn&apos;t a lack of programming knowledge — it is{' '}
                  <strong className="text-ink">the unstructured &quot;Skills Dump&quot; anti-pattern</strong>.
                </p>
                <p>
                  Many candidates write an 8-line paragraph listing 40 technologies (C++, Java, React, Node, Docker, Kubernetes, Spark, Kafka, AWS, Jenkins...).
                  ATS parsers either categorize this as keyword stuffing or fail to map which frameworks belong to which projects, resulting in a low relevance score.
                </p>

                <h3 className="font-serif text-lg font-bold text-ink mt-6 mb-2">
                  What Tech ATS Parsers Expect:
                </h3>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <span className="font-mono text-xs font-bold text-rust uppercase block mb-1">❌ The Anti-Pattern:</span>
                    <p className="font-mono text-xs text-ink-muted">
                      &quot;Skills: Python, TypeScript, React, Next.js, Django, PostgreSQL, Redis, Docker, Kubernetes, AWS, Git, CI/CD, Microservices, Agile.&quot;
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-pine-light/30 border border-pine/30">
                    <span className="font-mono text-xs font-bold text-pine uppercase block mb-1">✓ The High-Scoring Structure:</span>
                    <p className="font-mono text-xs text-ink">
                      • <strong>Languages:</strong> TypeScript, Python, Go, SQL<br />
                      • <strong>Frameworks:</strong> React, Next.js, Node.js/Express, FastAPI<br />
                      • <strong>Infrastructure:</strong> Docker, AWS (ECS, S3), Redis, PostgreSQL, GitHub Actions
                    </p>
                  </div>
                </div>

                <h3 className="font-serif text-lg font-bold text-ink mt-6 mb-2">
                  Quantifiable Impact Metrics for Developers:
                </h3>
                <p className="text-sm">
                  Always connect technologies to outcomes: latency reduction (e.g. <em>&quot;reduced API response time by 35%&quot;</em>),
                  throughput (<em>&quot;handled 10k requests/sec&quot;</em>), or cost savings (<em>&quot;cut AWS cloud bill by 20%&quot;</em>).
                </p>

                {/* Instant CTA */}
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="font-serif text-base font-bold text-ink">Test your software engineering resume</div>
                    <div className="font-serif text-xs text-ink-faint">Evaluates tech stack density, action verbs, and impact metrics</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartScanning('tech', 'experienced')}
                    className="px-6 py-3 rounded-xl bg-pine text-paper font-serif text-sm font-bold hover:bg-pine/90 transition-colors shadow-xs cursor-pointer"
                  >
                    Scan Tech Resume Now →
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Tab 3: Finance Guide */}
        {activeTab === 'finance' && (
          <article className="space-y-8">
            <div className="bg-paper border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-pine uppercase tracking-wider mb-2">
                <span>Finance &amp; Accounting</span>
                <span>·</span>
                <span>Certifications &amp; Indian Regulatory Terms</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink mb-4">
                Finance ATS Breakdown: Certifications and Regulatory Keywords
              </h2>
              <div className="space-y-4 font-serif text-ink-muted leading-relaxed text-base">
                <p>
                  Finance and banking resumes are heavily filtered by professional credentials and enterprise ERP tools.
                  Recruiters searching for CA, CFA, CPA, or MBA-Finance candidates rely on ATS keyword filters targeting specific sections.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 my-4">
                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <h4 className="font-serif text-sm font-bold text-ink mb-2">Essential Hard Skills:</h4>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Variance analysis, P&amp;L management, balance sheet reconciliation, financial modeling (DCF),
                      SAP FICO, Tally Prime, QuickBooks, Power BI, Advanced Excel (VLOOKUP, INDEX-MATCH, XLOOKUP).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <h4 className="font-serif text-sm font-bold text-ink mb-2">Indian Market Specifics:</h4>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      GST filings, TDS reconciliations, Ind AS / IFRS compliance, statutory audits, MCA ROC filings,
                      and RBI banking guidelines.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-light/50 border border-amber/30 text-xs text-ink leading-relaxed">
                  <strong>Critical Warning:</strong> Never bury your CA or CFA certification under the &quot;Education&quot; heading.
                  Always create an independent, standard <span className="font-mono font-bold">Certifications</span> section so ATS algorithms reliably parse your credential authority.
                </div>

                {/* Instant CTA */}
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="font-serif text-base font-bold text-ink">Score your finance resume</div>
                    <div className="font-serif text-xs text-ink-faint">Checks ERP tools, financial metrics, and certification sections</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartScanning('finance', 'experienced')}
                    className="px-6 py-3 rounded-xl bg-pine text-paper font-serif text-sm font-bold hover:bg-pine/90 transition-colors shadow-xs cursor-pointer"
                  >
                    Scan Finance Resume Now →
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}

        {/* Tab 4: Myths Busted */}
        {activeTab === 'myths' && (
          <article className="space-y-8">
            <div className="bg-paper border border-border rounded-2xl p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2 font-mono text-xs font-semibold text-pine uppercase tracking-wider mb-2">
                <span>Industry Transparency</span>
                <span>·</span>
                <span>Debunking Viral Resume Myths</span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-ink mb-4">
                ATS Myths vs. Technical Reality
              </h2>
              <div className="space-y-4 font-serif text-ink-muted leading-relaxed text-base">
                <p>
                  Online career advice is filled with exaggerated claims about secret AI algorithms and invisible resume tricks.
                  Here is what technical reality looks like according to actual ATS parsers:
                </p>

                <div className="space-y-4 mt-4">
                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <h4 className="font-serif text-base font-bold text-rust mb-1">
                      Myth 1: &quot;Putting white text keywords in the margins tricks ATS&quot;
                    </h4>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      <strong>Reality:</strong> Parsers extract plain text and strip styling. A block of 50 unrelated keywords at the bottom of the extracted text file triggers keyword density penalties and gets flagged during human recruiter review.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <h4 className="font-serif text-base font-bold text-rust mb-1">
                      Myth 2: &quot;Fancy Canva graphics and skill bars make you stand out&quot;
                    </h4>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      <strong>Reality:</strong> Visual rating bars (e.g. 5 stars in Python) are unreadable to ATS parsers. Resumes exported as flattened images contain 0 selectable text characters and fail immediately.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-canvas border border-border">
                    <h4 className="font-serif text-base font-bold text-rust mb-1">
                      Myth 3: &quot;You need an expensive paid tool to beat ATS&quot;
                    </h4>
                    <p className="text-sm text-ink-muted leading-relaxed">
                      <strong>Reality:</strong> ATS systems run standard deterministic pattern matching (regex, section headers, dictionary lookup).
                      ResumeDeepThink gives you 100% transparent, deterministic scoring for free without predatory subscription traps.
                    </p>
                  </div>
                </div>

                {/* Instant CTA */}
                <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <div className="font-serif text-base font-bold text-ink">Ready to check your resume format?</div>
                    <div className="font-serif text-xs text-ink-faint">Instant parsing test against 20+ deterministic rules</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleStartScanning('', 'experienced')}
                    className="px-6 py-3 rounded-xl bg-pine text-paper font-serif text-sm font-bold hover:bg-pine/90 transition-colors shadow-xs cursor-pointer"
                  >
                    Test Your Resume Now →
                  </button>
                </div>
              </div>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
