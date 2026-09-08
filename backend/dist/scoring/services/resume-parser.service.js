"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeParserService = void 0;
const common_1 = require("@nestjs/common");
const SECTION_HEADER_MAP = new Map([
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
function matchSectionHeader(headerText) {
    const normalized = headerText
        .toLowerCase()
        .replace(/[^a-z0-9\s&]/g, '')
        .trim();
    if (normalized.length === 0 || normalized.length > 60)
        return null;
    let bestMatch = null;
    for (const [sectionType, variants] of SECTION_HEADER_MAP) {
        for (const variant of variants) {
            if (normalized === variant) {
                return { type: sectionType, confidence: 1.0 };
            }
            if (normalized.startsWith(variant)) {
                const conf = variant.length / normalized.length;
                if (!bestMatch || conf > bestMatch.confidence) {
                    bestMatch = { type: sectionType, confidence: Math.max(conf, 0.7) };
                }
            }
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
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/;
const LINKEDIN_REGEX = /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9\-._~%]+/i;
const URL_REGEX = /https?:\/\/(?:www\.)?[a-zA-Z0-9\-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?/i;
const DATE_PATTERNS = [
    /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}/i,
    /\b\d{1,2}\/\d{4}\b/,
    /\b(19|20)\d{2}(?:-\d{2})?\b/,
    /\b(?:present|current|till\s+date|ongoing|now)\b/i,
];
const BULLET_REGEX = /^[\s]*(?:[-•●○■►▸▹→⊳⊲]|\*|–|—|\d+[.)]\s)/;
function isSectionHeaderCandidate(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.length > 80)
        return false;
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount > 8)
        return false;
    if (BULLET_REGEX.test(trimmed))
        return false;
    if (EMAIL_REGEX.test(trimmed))
        return false;
    if (/^\+?\d[\d\s.()\-]{7,}$/.test(trimmed))
        return false;
    return true;
}
let ResumeParserService = class ResumeParserService {
    parse(text, pageCount) {
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
    parseSections(lines) {
        const sections = [];
        let currentSection = null;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            if (isSectionHeaderCandidate(trimmed)) {
                const match = matchSectionHeader(trimmed);
                if (match && match.confidence >= 0.5) {
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
    parseContactInfo(fullText, lines) {
        const emailMatch = fullText.match(EMAIL_REGEX);
        const email = emailMatch ? emailMatch[0] : null;
        const phoneMatch = fullText.match(PHONE_REGEX);
        const phone = phoneMatch ? phoneMatch[0] : null;
        const linkedinMatch = fullText.match(LINKEDIN_REGEX);
        const linkedinUrl = linkedinMatch ? linkedinMatch[0] : null;
        let portfolioUrl = null;
        const urlMatches = fullText.match(new RegExp(URL_REGEX.source, 'gi')) || [];
        for (const url of urlMatches) {
            if (!LINKEDIN_REGEX.test(url)) {
                portfolioUrl = url;
                break;
            }
        }
        const name = this.extractName(lines);
        return { name, email, phone, linkedinUrl, portfolioUrl };
    }
    extractName(lines) {
        const headerArea = lines.slice(0, 10);
        for (const line of headerArea) {
            const trimmed = line.trim();
            if (trimmed.length === 0)
                continue;
            if (EMAIL_REGEX.test(trimmed))
                continue;
            if (LINKEDIN_REGEX.test(trimmed))
                continue;
            if (URL_REGEX.test(trimmed))
                continue;
            if (/^\+?\d[\d\s.()\-]{7,}$/.test(trimmed))
                continue;
            if (matchSectionHeader(trimmed))
                continue;
            const words = trimmed.split(/\s+/);
            if (words.length >= 1 && words.length <= 5) {
                const alphabeticRatio = words.filter((w) => /^[A-Za-z.\-']+$/.test(w)).length / words.length;
                if (alphabeticRatio >= 0.8) {
                    return trimmed;
                }
            }
        }
        return null;
    }
    parseExperienceEntries(sections) {
        const experienceSections = sections.filter((s) => s.type === 'experience');
        if (experienceSections.length === 0)
            return [];
        const entries = [];
        for (const section of experienceSections) {
            const lines = section.content.split('\n');
            let currentEntry = null;
            for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.length === 0)
                    continue;
                const dateMatch = this.extractDates(trimmed);
                const isBullet = BULLET_REGEX.test(trimmed);
                if (dateMatch.start || dateMatch.end) {
                    if (currentEntry) {
                        entries.push({ ...currentEntry });
                    }
                    const titleCompany = this.extractTitleCompany(trimmed, dateMatch);
                    currentEntry = {
                        title: titleCompany.title,
                        company: titleCompany.company,
                        startDate: dateMatch.start,
                        endDate: dateMatch.end,
                        bullets: [],
                    };
                }
                else if (isBullet && currentEntry) {
                    const bulletText = trimmed.replace(BULLET_REGEX, '').trim();
                    if (bulletText.length > 0) {
                        currentEntry.bullets.push(bulletText);
                    }
                }
                else if (!isBullet && !currentEntry && trimmed.length > 0) {
                    currentEntry = {
                        title: trimmed,
                        company: null,
                        startDate: null,
                        endDate: null,
                        bullets: [],
                    };
                }
                else if (currentEntry && !isBullet) {
                    if (currentEntry.company === null && trimmed.length < 80) {
                        currentEntry.company = trimmed;
                    }
                }
            }
            if (currentEntry) {
                entries.push({ ...currentEntry });
            }
        }
        return entries;
    }
    extractDates(line) {
        const dateMatches = [];
        for (const pattern of DATE_PATTERNS) {
            const globalPattern = new RegExp(pattern.source, 'gi');
            let match;
            while ((match = globalPattern.exec(line)) !== null) {
                dateMatches.push(match[0]);
            }
        }
        if (dateMatches.length === 0)
            return { start: null, end: null };
        if (dateMatches.length === 1)
            return { start: dateMatches[0], end: null };
        return { start: dateMatches[0], end: dateMatches[1] };
    }
    extractTitleCompany(line, dates) {
        let cleaned = line;
        if (dates.start)
            cleaned = cleaned.replace(dates.start, '');
        if (dates.end)
            cleaned = cleaned.replace(dates.end, '');
        cleaned = cleaned.replace(/[|–—\-]/g, ' ').replace(/\s+/g, ' ').trim();
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
    parseSkillsList(sections) {
        const skillsSections = sections.filter((s) => s.type === 'skills');
        if (skillsSections.length === 0)
            return [];
        const skills = [];
        for (const section of skillsSections) {
            const content = section.content;
            let items;
            if (content.includes('|')) {
                items = content.split('|');
            }
            else if (content.includes(',')) {
                items = content.split(',');
            }
            else if (content.includes(';')) {
                items = content.split(';');
            }
            else {
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
};
exports.ResumeParserService = ResumeParserService;
exports.ResumeParserService = ResumeParserService = __decorate([
    (0, common_1.Injectable)()
], ResumeParserService);
//# sourceMappingURL=resume-parser.service.js.map