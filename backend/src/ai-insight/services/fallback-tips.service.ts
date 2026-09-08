import { Injectable } from '@nestjs/common';
import {
  AiInsightResult,
  InsightBottleneck,
  InsightFix,
} from '../interfaces/ai-insight.interface';
import { CategoryResult } from '../../scoring/interfaces/rule-result.interface';

/**
 * Static, pre-written fallback tips keyed by scoring category.
 *
 * Per ai-integration.md: "cache category-level fallback tips (static,
 * not AI-generated) so a total AI outage doesn't mean zero insights, ever."
 *
 * These are returned when the Gemini call fails, times out, or returns
 * invalid data after the retry budget is exhausted.
 */

/** One fallback tip per scoring category. */
const CATEGORY_TIPS: ReadonlyMap<
  string,
  { issue: string; action: string; example: string }
> = new Map([
  [
    'File & Format Integrity',
    {
      issue:
        'ATS parsers work best with clean, text-based PDFs or DOCX files — avoid scanned images or heavily formatted templates.',
      action:
        'Export your resume as a text-based PDF from Word or Google Docs. Avoid using Canva or image-heavy templates.',
      example:
        'In Google Docs: File → Download → PDF Document (.pdf). This preserves the text layer that ATS systems read.',
    },
  ],
  [
    'Contact & Identity Parsing',
    {
      issue:
        'Missing or malformatted contact info causes ATS systems to fail at the very first step — identity extraction.',
      action:
        'Place your full name, email, phone number, and LinkedIn URL at the top of the resume in plain text (not in a header/footer or text box).',
      example:
        'Amal Thomas | amal@email.com | +91 98765 43210 | linkedin.com/in/amalthomas',
    },
  ],
  [
    'Structural Parsing',
    {
      issue:
        'Non-standard section headers, multi-column layouts, or tables break ATS reading order and cause content to be skipped.',
      action:
        'Use standard section headers (Experience, Education, Skills, Summary) and a single-column layout without tables or text boxes.',
      example:
        'Instead of "My Journey" or "What I Bring", use "Professional Experience" or "Work Experience".',
    },
  ],
  [
    'Keyword & Skills Alignment',
    {
      issue:
        'Recruiters search ATS databases by specific skill keywords. Missing them means your resume never surfaces in search results.',
      action:
        'Add a dedicated Skills section with a clean, comma-separated or bulleted list of relevant hard skills matching job descriptions in your domain.',
      example:
        'Skills: React, TypeScript, Node.js, PostgreSQL, REST APIs, Docker, CI/CD, AWS',
    },
  ],
  [
    'Experience Quality Signals',
    {
      issue:
        'Vague bullet points without dates, action verbs, or quantified impact make it hard for both ATS and recruiters to assess your contributions.',
      action:
        'Start each bullet with a strong action verb, include specific metrics where possible, and ensure consistent date formatting across all roles.',
      example:
        'Before: "Responsible for managing team projects."\nAfter: "Led a 6-member team delivering 3 product releases, reducing time-to-market by 25%."',
    },
  ],
  [
    'Length & Density',
    {
      issue:
        'Resumes that are too short (sparse) or too long (unfocused) both hurt ATS indexing and recruiter attention.',
      action:
        'Aim for 400-800 words for early-career resumes (0-5 years) and 600-1200 words for experienced professionals. Remove empty sections.',
      example:
        'A 1-page resume for 10+ years of experience likely under-represents your work. A 4-page resume for a fresher signals lack of editing.',
    },
  ],
]);

@Injectable()
export class FallbackTipsService {
  /**
   * Generates a static AiInsightResult from the categories that failed
   * or partially passed in the deterministic scoring.
   *
   * Only includes tips for categories with at least one failed/warning rule,
   * so the fallback is still contextually relevant even without AI.
   */
  generateFallbackTips(categories: CategoryResult[]): AiInsightResult {
    const bottlenecks: InsightBottleneck[] = [];
    const fixes: InsightFix[] = [];

    for (const category of categories) {
      const hasIssues = category.rules.some(
        (r) => r.severity === 'fail' || r.severity === 'warning',
      );
      if (!hasIssues) continue;

      const tip = CATEGORY_TIPS.get(category.name);
      if (!tip) continue;

      const worstSeverity = category.rules.some((r) => r.severity === 'fail')
        ? 'high'
        : 'medium';

      bottlenecks.push({
        category: category.name,
        issue: tip.issue,
        severity: worstSeverity as 'high' | 'medium' | 'low',
      });

      fixes.push({
        category: category.name,
        action: tip.action,
        example: tip.example,
      });
    }

    // If no categories had issues (unlikely but possible), provide a generic summary.
    const summary =
      bottlenecks.length > 0
        ? `Your resume has ${bottlenecks.length} area(s) that could affect ATS parsing. Focus on the highest-severity items first for the biggest improvement.`
        : 'Your resume structure looks solid for ATS parsing. Minor polish may still help with recruiter readability.';

    return {
      bottlenecks,
      fixes,
      summary,
      source: 'fallback',
    };
  }
}
