import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';

const CATEGORY = 'Contact & Identity Parsing';

// Broad email regex — RFC 5322 simplified
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;

// Phone patterns: international (+1 ...), Indian (10-digit with optional +91),
// general (digits with dashes/spaces/parens)
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;

// LinkedIn URL or portfolio/personal website
const LINKEDIN_REGEX = /linkedin\.com\/in\/[a-zA-Z0-9\-._~%]+/i;
const URL_REGEX =
  /https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;

/**
 * Rule: name-detected (3 pts)
 * Name should be a standalone element near the top, not buried in a paragraph.
 * Heuristic: the first non-empty, non-section-header line of the resume that
 * is short (2-5 words), contains no email/phone/URL, and appears before any
 * section header.
 */
export function checkNameDetected(parsedResume: ParsedResume): RuleResult {
  const maxPoints = 3;
  const hasName = parsedResume.contactInfo.name !== null &&
    parsedResume.contactInfo.name.trim().length > 0;
  const points = hasName ? maxPoints : 0;

  return {
    id: 'name-detected',
    category: CATEGORY,
    passed: hasName,
    points,
    maxPoints,
    message: hasName
      ? 'Name detected near the top of the resume.'
      : 'Could not confidently identify your name at the top. Ensure your full name is the first line, clearly separated from other content.',
    severity: hasName ? 'pass' : 'fail',
  };
}

/**
 * Rule: email-present-valid (3 pts)
 * Must have a regex-valid email.
 */
export function checkEmailPresent(parsedResume: ParsedResume): RuleResult {
  const maxPoints = 3;
  const email = parsedResume.contactInfo.email;
  const hasValidEmail = email !== null && EMAIL_REGEX.test(email);
  const points = hasValidEmail ? maxPoints : 0;

  return {
    id: 'email-present-valid',
    category: CATEGORY,
    passed: hasValidEmail,
    points,
    maxPoints,
    message: hasValidEmail
      ? 'Valid email address found.'
      : 'No valid email address detected. ATS systems use this to create your applicant profile — add a professional email.',
    severity: hasValidEmail ? 'pass' : 'fail',
  };
}

/**
 * Rule: phone-present (2 pts)
 * Phone number in a parseable format.
 */
export function checkPhonePresent(parsedResume: ParsedResume): RuleResult {
  const maxPoints = 2;
  const phone = parsedResume.contactInfo.phone;
  const hasPhone = phone !== null && PHONE_REGEX.test(phone);
  const points = hasPhone ? maxPoints : 0;

  return {
    id: 'phone-present',
    category: CATEGORY,
    passed: hasPhone,
    points,
    maxPoints,
    message: hasPhone
      ? 'Phone number found in a parseable format.'
      : 'No phone number detected. Most ATS systems expect a contact number — add one in a standard format (e.g. +91 98765 43210).',
    severity: hasPhone ? 'pass' : 'warning',
  };
}

/**
 * Rule: linkedin-or-portfolio (2 pts)
 * Detect LinkedIn profile URL or other portfolio/personal website.
 */
export function checkLinkedInOrPortfolio(parsedResume: ParsedResume): RuleResult {
  const maxPoints = 2;
  const hasLinkedIn = parsedResume.contactInfo.linkedinUrl !== null;
  const hasPortfolio = parsedResume.contactInfo.portfolioUrl !== null;
  const hasUrl = hasLinkedIn || hasPortfolio;
  const points = hasUrl ? maxPoints : 0;

  let message: string;
  if (hasLinkedIn && hasPortfolio) {
    message = 'LinkedIn profile and portfolio URL found.';
  } else if (hasLinkedIn) {
    message = 'LinkedIn profile URL found.';
  } else if (hasPortfolio) {
    message = 'Portfolio/personal website URL found.';
  } else {
    message = 'No LinkedIn or portfolio URL detected. Adding a LinkedIn profile link helps recruiters verify your professional background.';
  }

  return {
    id: 'linkedin-or-portfolio',
    category: CATEGORY,
    passed: hasUrl,
    points,
    maxPoints,
    message,
    severity: hasUrl ? 'pass' : 'warning',
  };
}

/**
 * Runs all Contact & Identity rules (10 pts total).
 */
export function runContactRules(parsedResume: ParsedResume): RuleResult[] {
  return [
    checkNameDetected(parsedResume),
    checkEmailPresent(parsedResume),
    checkPhonePresent(parsedResume),
    checkLinkedInOrPortfolio(parsedResume),
  ];
}

export { EMAIL_REGEX, PHONE_REGEX, LINKEDIN_REGEX, URL_REGEX };
