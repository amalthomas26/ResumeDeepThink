import { Injectable } from '@nestjs/common';
import {
  ParsedResume,
  SectionType,
  ContactInfo,
  ExperienceEntry,
  ResumeSection,
} from '../interfaces/parsed-resume.interface';

/**
 * Fuzzy header taxonomy: maps many real-world section header variations
 * onto canonical SectionType keys.
 *
 * Per ats-scoring-engine.md: "using a fuzzy-matched header taxonomy,
 * not exact strings."
 */
const SECTION_HEADER_MAP: ReadonlyMap<SectionType, readonly string[]> = new Map([
  [
    'summary',
    [
      'summary', 'professional summary', 'career summary', 'executive summary',
      'profile', 'professional profile', 'career profile', 'about me',
      'about', 'objective', 'career objective', 'professional objective',
      'overview', 'career overview', 'introduction',
    ],
  ],
  [
    'experience',
    [
      'experience', 'work experience', 'professional experience',
      'employment history', 'work history', 'employment', 'career history',
      'relevant experience', 'professional background', 'positions held',
      'internship', 'internships', 'work', 'career',
    ],
  ],
  [
    'education',
    [
      'education', 'academic background', 'educational background',
      'academic qualifications', 'qualifications', 'academic history',
      'educational qualifications', 'degrees', 'academic credentials',
      'schooling',
    ],
  ],
  [
    'skills',
    [
      'skills', 'technical skills', 'core competencies', 'competencies',
      'key skills', 'professional skills', 'areas of expertise',
      'technologies', 'tools', 'tools & technologies',
      'skills & competencies', 'skill set', 'proficiencies',
      'technical proficiencies', 'core skills',
    ],
  ],
  [
    'certifications',
    [
      'certifications', 'certificates', 'professional certifications',
      'licenses', 'licenses & certifications', 'certifications & licenses',
      'accreditations', 'professional development', 'training',
      'training & certifications',
    ],
  ],
  [
    'projects',
    [
      'projects', 'key projects', 'personal projects', 'academic projects',
      'notable projects', 'selected projects', 'project experience',
    ],
  ],
  [
    'awards',
    [
      'awards', 'honors', 'awards & honors', 'achievements',
      'accomplishments', 'recognition', 'awards & achievements',
      'honors & awards',
    ],
  ],
  [
    'languages',
    [
      'languages', 'language skills', 'language proficiency',
      'languages known',
    ],
  ],
]);

// Compile a flat lookup: lowercase header text -> { type, confidence }
interface HeaderMatch {
  type: SectionType;
  confidence: number;
}

/**
 * Matches a header text against the fuzzy taxonomy.
 * Returns the best match with a confidence score, or null.
 */
function matchSectionHeader(headerText: string): HeaderMatch | null {
  const normalized = headerText
    .toLowerCase()
    .replace(/[^a-z0-9\s&]/g, '')
    .trim();

  if (normalized.length === 0 || normalized.length > 60) return null;

  let bestMatch: HeaderMatch | null = null;

  for (const [sectionType, variants] of SECTION_HEADER_MAP) {
    for (const variant of variants) {
      if (normalized === variant) {
        // Exact match
        return { type: sectionType, confidence: 1.0 };
      }

      // Starts-with match (e.g. "Professional Experience & Achievements")
      if (normalized.startsWith(variant)) {
        const conf = variant.length / normalized.length;
        if (!bestMatch || conf > bestMatch.confidence) {
          bestMatch = { type: sectionType, confidence: Math.max(conf, 0.7) };
        }
      }

      // Contains match (e.g. "My Work Experience")
      if (normalized.includes(variant) && variant.length >= 5) {
        const conf = variant.length / normalized.length * 0.8;
        if (conf >= 0.5 && (!bestMatch || conf > bestMatch.confidence)) {
          bestMatch = { type: sectionType, confidence: conf };
        }
      }
    }
  }

  return bestMatch;
}

// Email, phone, LinkedIn, URL patterns
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-._~%]+/i;
const URL_REGEX =
  /https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;

// Date patterns for experience entries
const DATE_PATTERNS = [
  // "Jan 2020", "January 2020"
  /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/i,
  // "01/2020", "1/2020"
  /\b\d{1,2}\/\d{4}\b/,
  // "2020-01", "2020"
  /\b(19|20)\d{2}(?:-\d{2})?\b/,
  // "Present", "Current", "Till Date"
  /\b(?:present|current|till\s+date|ongoing|now)\b/i,
];

// Bullet point markers
const BULLET_REGEX = /^[\s]*(?:[-•●○■►▸▹→⊳⊲]|\*|–|—|\d+[.)]\s)/;

/**
 * Detects if a line is a section header candidate.
 * Headers are typically: short (1-6 words), may be ALL CAPS or Title Case,
 * not a bullet point, and often followed by content.
 */
function isSectionHeaderCandidate(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 8) return false;

  // Skip lines that look like bullet points
  if (BULLET_REGEX.test(trimmed)) return false;

  // Skip lines that look like dates or contact info
  if (EMAIL_REGEX.test(trimmed)) return false;
  if (/^\+?\d[\d\s.()\-]{7,}$/.test(trimmed)) return false;

  return true;
}

@Injectable()
export class ResumeParserService {
  /**
   * Transforms raw extracted text into a structured ParsedResume.
   * This is the central parsing step that all scoring rules consume.
   */
  parse(text: string, pageCount: number): ParsedResume {
    const lines = text.split('\n');
    const sections = this.parseSections(lines);
    const contactInfo = this.parseContactInfo(text, lines);
    const experienceEntries = this.parseExperienceEntries(sections);
    const skillsList = this.parseSkillsList(sections);
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    return {
      fullText: text,
      sections,
      contactInfo,
      experienceEntries,
      skillsList,
      wordCount,
      pageCount,
    };
  }

  /**
   * Splits text into identified sections using the fuzzy header taxonomy.
   */
  private parseSections(lines: string[]): ResumeSection[] {
    const sections: ResumeSection[] = [];
    let currentSection: {
      type: SectionType;
      headerText: string;
      startLine: number;
      confidence: number;
      contentLines: string[];
    } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (isSectionHeaderCandidate(trimmed)) {
        const match = matchSectionHeader(trimmed);

        if (match && match.confidence >= 0.5) {
          // Save previous section
          if (currentSection) {
            sections.push({
              type: currentSection.type,
              headerText: currentSection.headerText,
              content: currentSection.contentLines.join('\n').trim(),
              startLine: currentSection.startLine,
              endLine: i - 1,
              confidence: currentSection.confidence,
            });
          }

          currentSection = {
            type: match.type,
            headerText: trimmed,
            startLine: i,
            confidence: match.confidence,
            contentLines: [],
          };
          continue;
        }
      }

      if (currentSection) {
        currentSection.contentLines.push(line);
      }
    }

    // Save final section
    if (currentSection) {
      sections.push({
        type: currentSection.type,
        headerText: currentSection.headerText,
        content: currentSection.contentLines.join('\n').trim(),
        startLine: currentSection.startLine,
        endLine: lines.length - 1,
        confidence: currentSection.confidence,
      });
    }

    return sections;
  }

  /**
   * Extracts contact information from the resume.
   * Per ats-scoring-engine.md: "Name is detected as a standalone element
   * near the top, not buried in a paragraph."
   */
  private parseContactInfo(fullText: string, lines: string[]): ContactInfo {
    // Find email
    const emailMatch = fullText.match(EMAIL_REGEX);
    const email = emailMatch ? emailMatch[0] : null;

    // Find phone
    const phoneMatch = fullText.match(PHONE_REGEX);
    const phone = phoneMatch ? phoneMatch[0] : null;

    // Find LinkedIn URL
    const linkedinMatch = fullText.match(LINKEDIN_REGEX);
    const linkedinUrl = linkedinMatch ? linkedinMatch[0] : null;

    // Find portfolio URL (any URL that's not LinkedIn)
    let portfolioUrl: string | null = null;
    const urlMatches = fullText.match(new RegExp(URL_REGEX.source, 'gi')) || [];
    for (const url of urlMatches) {
      if (!LINKEDIN_REGEX.test(url)) {
        portfolioUrl = url;
        break;
      }
    }

    // Find name: first substantive line near the top that isn't
    // email/phone/URL/section-header
    const name = this.extractName(lines);

    return { name, email, phone, linkedinUrl, portfolioUrl };
  }

  /**
   * Extracts the candidate name from the top of the resume.
   * Heuristic: the first non-empty line that is 2-5 words,
   * contains no email/phone/URL, and appears before any section header.
   */
  private extractName(lines: string[]): string | null {
    // Look only at the first ~10 lines for the name
    const headerArea = lines.slice(0, 10);

    for (const line of headerArea) {
      const trimmed = line.trim();
      if (trimmed.length === 0) continue;

      // Skip if it contains email, phone, URL
      if (EMAIL_REGEX.test(trimmed)) continue;
      if (LINKEDIN_REGEX.test(trimmed)) continue;
      if (URL_REGEX.test(trimmed)) continue;
      if (/^\+?\d[\d\s.()\-]{7,}$/.test(trimmed)) continue;

      // Skip if it matches a section header
      if (matchSectionHeader(trimmed)) continue;

      // Name heuristic: 1-5 words, mostly alphabetic
      const words = trimmed.split(/\s+/);
      if (words.length >= 1 && words.length <= 5) {
        const alphabeticRatio =
          words.filter((w) => /^[A-Za-z.\-']+$/.test(w)).length / words.length;
        if (alphabeticRatio >= 0.8) {
          return trimmed;
        }
      }
    }

    return null;
  }

  /**
   * Parses experience entries from the experience section.
   * Detects date-delimited blocks and extracts bullet points.
   */
  private parseExperienceEntries(
    sections: ResumeSection[],
  ): ExperienceEntry[] {
    const experienceSections = sections.filter(
      (s) => s.type === 'experience',
    );
    if (experienceSections.length === 0) return [];

    const entries: ExperienceEntry[] = [];

    for (const section of experienceSections) {
      const lines = section.content.split('\n');
      let currentEntry: {
        title: string | null;
        company: string | null;
        startDate: string | null;
        endDate: string | null;
        bullets: string[];
      } | null = null;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length === 0) continue;

        // Check if this line contains dates (likely a new entry header)
        const dateMatch = this.extractDates(trimmed);
        const isBullet = BULLET_REGEX.test(trimmed);

        if (dateMatch.start || dateMatch.end) {
          // Save previous entry
          if (currentEntry) {
            entries.push({ ...currentEntry });
          }

          // Start new entry
          const titleCompany = this.extractTitleCompany(trimmed, dateMatch);
          currentEntry = {
            title: titleCompany.title,
            company: titleCompany.company,
            startDate: dateMatch.start,
            endDate: dateMatch.end,
            bullets: [],
          };
        } else if (isBullet && currentEntry) {
          // Clean the bullet marker
          const bulletText = trimmed.replace(BULLET_REGEX, '').trim();
          if (bulletText.length > 0) {
            currentEntry.bullets.push(bulletText);
          }
        } else if (!isBullet && !currentEntry && trimmed.length > 0) {
          // Non-bullet, non-date line at the start — might be a title line
          // followed by a date line
          currentEntry = {
            title: trimmed,
            company: null,
            startDate: null,
            endDate: null,
            bullets: [],
          };
        } else if (currentEntry && !isBullet) {
          // Non-bullet line within an entry — could be a subtitle or continuation
          // If the entry has no company yet, treat this as company
          if (currentEntry.company === null && trimmed.length < 80) {
            currentEntry.company = trimmed;
          }
        }
      }

      // Save last entry
      if (currentEntry) {
        entries.push({ ...currentEntry });
      }
    }

    return entries;
  }

  /**
   * Extracts start/end dates from a line.
   */
  private extractDates(line: string): { start: string | null; end: string | null } {
    const dateMatches: string[] = [];
    for (const pattern of DATE_PATTERNS) {
      const globalPattern = new RegExp(pattern.source, 'gi');
      let match: RegExpExecArray | null;
      while ((match = globalPattern.exec(line)) !== null) {
        dateMatches.push(match[0]);
      }
    }

    if (dateMatches.length === 0) return { start: null, end: null };
    if (dateMatches.length === 1) return { start: dateMatches[0], end: null };
    return { start: dateMatches[0], end: dateMatches[1] };
  }

  /**
   * Extracts title and company from an entry header line after removing dates.
   */
  private extractTitleCompany(
    line: string,
    dates: { start: string | null; end: string | null },
  ): { title: string | null; company: string | null } {
    let cleaned = line;

    // Remove date strings
    if (dates.start) cleaned = cleaned.replace(dates.start, '');
    if (dates.end) cleaned = cleaned.replace(dates.end, '');

    // Remove common separators
    cleaned = cleaned.replace(/[|–—\-]/g, ' ').replace(/\s+/g, ' ').trim();

    // Split by common title/company separators: comma, " at ", " - "
    const parts = cleaned
      .split(/\s*(?:,|\bat\b|\s+at\s+)\s*/i)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length >= 2) {
      return { title: parts[0], company: parts[1] };
    }
    if (parts.length === 1) {
      return { title: parts[0], company: null };
    }
    return { title: null, company: null };
  }

  /**
   * Parses the skills list from the skills section.
   * Handles comma-, pipe-, semicolon-, and newline-delimited formats.
   */
  private parseSkillsList(sections: ResumeSection[]): string[] {
    const skillsSections = sections.filter((s) => s.type === 'skills');
    if (skillsSections.length === 0) return [];

    const skills: string[] = [];

    for (const section of skillsSections) {
      const content = section.content;

      // Try delimiter-based splitting
      let items: string[];

      // Check for common delimiters: comma, pipe, semicolon, bullet markers
      if (content.includes('|')) {
        items = content.split('|');
      } else if (content.includes(',')) {
        items = content.split(',');
      } else if (content.includes(';')) {
        items = content.split(';');
      } else {
        // Fall back to line-based splitting with bullet cleanup
        items = content
          .split('\n')
          .map((l) => l.replace(BULLET_REGEX, '').trim());
      }

      for (const item of items) {
        const cleaned = item
          .replace(BULLET_REGEX, '')
          .replace(/^[-•●○■►▸▹→⊳⊲*–—]\s*/, '')
          .trim();
        if (cleaned.length > 0 && cleaned.length < 100) {
          skills.push(cleaned);
        }
      }
    }

    return skills;
  }
}
