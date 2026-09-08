"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.URL_REGEX = exports.LINKEDIN_REGEX = exports.PHONE_REGEX = exports.EMAIL_REGEX = void 0;
exports.checkNameDetected = checkNameDetected;
exports.checkEmailPresent = checkEmailPresent;
exports.checkPhonePresent = checkPhonePresent;
exports.checkLinkedInOrPortfolio = checkLinkedInOrPortfolio;
exports.runContactRules = runContactRules;
const CATEGORY = 'Contact & Identity Parsing';
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
exports.EMAIL_REGEX = EMAIL_REGEX;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
exports.PHONE_REGEX = PHONE_REGEX;
const LINKEDIN_REGEX = /linkedin\.com\/in\/[a-zA-Z0-9\-._~%]+/i;
exports.LINKEDIN_REGEX = LINKEDIN_REGEX;
const URL_REGEX = /https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;
exports.URL_REGEX = URL_REGEX;
function checkNameDetected(parsedResume) {
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
function checkEmailPresent(parsedResume) {
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
function checkPhonePresent(parsedResume) {
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
function checkLinkedInOrPortfolio(parsedResume) {
    const maxPoints = 2;
    const hasLinkedIn = parsedResume.contactInfo.linkedinUrl !== null;
    const hasPortfolio = parsedResume.contactInfo.portfolioUrl !== null;
    const hasUrl = hasLinkedIn || hasPortfolio;
    const points = hasUrl ? maxPoints : 0;
    let message;
    if (hasLinkedIn && hasPortfolio) {
        message = 'LinkedIn profile and portfolio URL found.';
    }
    else if (hasLinkedIn) {
        message = 'LinkedIn profile URL found.';
    }
    else if (hasPortfolio) {
        message = 'Portfolio/personal website URL found.';
    }
    else {
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
function runContactRules(parsedResume) {
    return [
        checkNameDetected(parsedResume),
        checkEmailPresent(parsedResume),
        checkPhonePresent(parsedResume),
        checkLinkedInOrPortfolio(parsedResume),
    ];
}
//# sourceMappingURL=contact.rules.js.map