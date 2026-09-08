/**
 * Configuration-driven resume type profile.
 * Per resume-type-handling.md: each type is a config object, not a
 * hardcoded branch — adding a new type means adding one object and
 * updating the frontend dropdown, never touching ScoringModule internals.
 */
export interface ResumeTypeProfile {
  /** Unique identifier for this resume type */
  readonly id: 'tech' | 'finance' | 'support' | 'general';

  /** Human-readable label shown in the UI */
  readonly label: string;

  /**
   * Weighted keyword bank for hard/technical skills.
   * These carry full weight in keyword coverage scoring.
   */
  readonly hardSkillKeywords: string[];

  /**
   * Soft skill keywords — weighted at 0.5x relative to hard skills
   * in the keyword coverage score.
   */
  readonly softSkillKeywords: string[];

  /**
   * Sections expected/near-required for this resume type.
   * e.g. Finance often has "Certifications" as near-required.
   */
  readonly expectedSections: string[];

  /**
   * Regex patterns that match "quantified impact" for this field.
   * e.g. tech: latency %, uptime; finance: currency figures, portfolio sizes.
   */
  readonly impactMetricPatterns: RegExp[];

  /**
   * Strong action verbs appropriate to this field.
   * Used to score bullet-point quality.
   * e.g. tech: "engineered", "deployed"; finance: "reconciled", "audited".
   */
  readonly actionVerbBank: string[];

  /**
   * Minimum keyword matches expected for a reasonable coverage score.
   * Used as the denominator in proportional keyword scoring.
   */
  readonly keywordCoverageTarget: number;
}
