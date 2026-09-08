import { Injectable } from '@nestjs/common';
import { ParsedResume } from '../../scoring/interfaces/parsed-resume.interface';
import {
  ScoreBreakdown,
  RuleResult,
} from '../../scoring/interfaces/rule-result.interface';

/**
 * Builds the Gemini prompt from scored resume data.
 *
 * Single Responsibility: prompt construction + PII stripping.
 * Per ai-integration.md: "Feed the model the *output of your deterministic
 * scoring engine*, not the raw resume text alone."
 */
@Injectable()
export class PromptBuilderService {
  /**
   * Constructs the system instruction for the Gemini call.
   *
   * Enhanced per user request: high reasoning, no hypothesis,
   * 2025-2026 Indian market trends, double-check constraints.
   */
  buildSystemPrompt(resumeType: string, experienceLevel?: string): string {
    const isFresher =
      experienceLevel === 'fresher' || resumeType === 'fresher';
    const fresherDirective = isFresher
      ? [
          '- FRESHER / ENTRY-LEVEL CANDIDATE SPECIFICATION: The candidate is a student or fresher (0-1 years experience). Do NOT flag the absence of commercial or corporate work experience as a bottleneck or defect. Instead, focus entirely on the quality, deployment status, architecture, and quantified metrics of their Projects, Hackathons, Open Source contributions, and Coursework, and guide them to format their project bullets using the Google X-Y-Z formula.',
        ]
      : [];

    return [
      `You are an ATS resume reviewer for ${resumeType} roles in the Indian job market.`,
      '',
      'CONSTRAINTS — follow strictly:',
      '- You will be given a resume\'s parsed structure and a list of rule check results.',
      '- Do NOT invent issues that are not present in the check results.',
      '- Do NOT hypothesize or speculate — only state facts supported by the data provided.',
      ...fresherDirective,
      '- Prioritize the 3 highest-impact fixes first, ranked by how much they hurt ATS parseability.',
      '- Base your advice on current (2025-2026) Indian hiring trends, ATS behaviour (Workday, Greenhouse, Taleo, iCIMS, Lever, Zoho Recruit, Naukri RMS), and recruiter practices. Double-check any claim against the provided data before including it.',
      '- Use high reasoning depth: explain WHY each fix matters for ATS parsing, not just WHAT to fix.',
      '- Be specific to the resume type — a tech resume needs different keyword density than a finance resume.',
      '- Respond only in the given JSON schema.',
    ].join('\n');
  }

  /**
   * Constructs the user content: PII-stripped parsed sections + failed rule results.
   *
   * Per ai-integration.md: "strip the candidate's phone number and email
   * from what you send to Gemini — the insight-generation task needs none of it."
   */
  buildUserContent(
    parsedResume: ParsedResume,
    scoreBreakdown: ScoreBreakdown,
  ): string {
    const sanitizedResume = this.stripPii(parsedResume);
    const failedOrPartialRules = this.extractRelevantRules(
      scoreBreakdown.ruleResults,
    );

    const payload = {
      resumeType: scoreBreakdown.resumeType,
      experienceLevel: scoreBreakdown.experienceLevel || 'experienced',
      overallScore: scoreBreakdown.overallScore,
      band: scoreBreakdown.band,
      bandLabel: scoreBreakdown.bandLabel,
      parsedSections: sanitizedResume.sections.map((s) => ({
        type: s.type,
        headerText: s.headerText,
        content: s.content,
        confidence: s.confidence,
      })),
      skills: sanitizedResume.skillsList,
      experienceEntries: sanitizedResume.experienceEntries.map((e) => ({
        title: e.title,
        company: e.company,
        startDate: e.startDate,
        endDate: e.endDate,
        bullets: e.bullets,
      })),
      ruleResults: failedOrPartialRules,
      meta: {
        wordCount: scoreBreakdown.meta.wordCount,
        pageCount: scoreBreakdown.meta.pageCount,
      },
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * Strips PII from the parsed resume before sending to Gemini.
   * Keeps structure intact but nullifies phone and email.
   */
  private stripPii(parsedResume: ParsedResume): ParsedResume {
    return {
      ...parsedResume,
      contactInfo: {
        ...parsedResume.contactInfo,
        email: null,
        phone: null,
      },
      // Also strip PII patterns from fullText to be safe
      fullText: this.redactPiiFromText(parsedResume.fullText),
    };
  }

  /**
   * Redacts email addresses and phone numbers from raw text.
   */
  private redactPiiFromText(text: string): string {
    // Redact emails
    let redacted = text.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[EMAIL REDACTED]',
    );

    // Redact Indian phone numbers (+91, 0-prefixed, or 10-digit sequences)
    redacted = redacted.replace(
      /(?:\+91[\s-]?|0)?[6-9]\d{4}[\s-]?\d{5}/g,
      '[PHONE REDACTED]',
    );

    return redacted;
  }

  /**
   * Filters rule results to only include failed or partially-passed rules.
   * Passed rules don't need AI commentary — this keeps the prompt focused
   * and reduces token count.
   */
  private extractRelevantRules(ruleResults: RuleResult[]): object[] {
    return ruleResults
      .filter((r) => r.severity === 'fail' || r.severity === 'warning')
      .map((r) => ({
        id: r.id,
        category: r.category,
        passed: r.passed,
        points: r.points,
        maxPoints: r.maxPoints,
        message: r.message,
        severity: r.severity,
      }));
  }
}
