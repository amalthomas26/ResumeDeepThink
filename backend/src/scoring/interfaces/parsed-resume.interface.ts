/**
 * Canonical section types recognized by the resume parser.
 * The fuzzy header taxonomy maps many variations onto these keys.
 */
export type SectionType =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'certifications'
  | 'projects'
  | 'awards'
  | 'languages'
  | 'unknown';

/**
 * Extracted contact information from the resume header area.
 */
export interface ContactInfo {
  readonly name: string | null;
  readonly email: string | null;
  readonly phone: string | null;
  readonly linkedinUrl: string | null;
  readonly portfolioUrl: string | null;
}

/**
 * A single employment/experience entry parsed from the resume.
 */
export interface ExperienceEntry {
  readonly title: string | null;
  readonly company: string | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
  readonly bullets: string[];
}

/**
 * Identified section from the resume with its content and header info.
 */
export interface ResumeSection {
  readonly type: SectionType;
  readonly headerText: string;
  readonly content: string;
  readonly startLine: number;
  readonly endLine: number;
  readonly confidence: number; // 0-1, for fuzzy header matching
}

/**
 * The fully-parsed resume — input to all scoring rule functions.
 */
export interface ParsedResume {
  readonly fullText: string;
  readonly sections: ResumeSection[];
  readonly contactInfo: ContactInfo;
  readonly experienceEntries: ExperienceEntry[];
  readonly skillsList: string[];
  readonly wordCount: number;
  readonly pageCount: number;
}
