"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoringService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const resume_parser_service_1 = require("./resume-parser.service");
const profiles_1 = require("../profiles");
const score_band_util_1 = require("../utils/score-band.util");
const file_format_rules_1 = require("../rules/file-format.rules");
const contact_rules_1 = require("../rules/contact.rules");
const structure_rules_1 = require("../rules/structure.rules");
const keywords_rules_1 = require("../rules/keywords.rules");
const experience_rules_1 = require("../rules/experience.rules");
const length_density_rules_1 = require("../rules/length-density.rules");
const resume_type_detector_util_1 = require("../utils/resume-type-detector.util");
const RULE_LABELS = new Map([
    ['file-is-valid-document', 'Validating document format'],
    ['text-layer-extractable', 'Checking text layer'],
    ['no-encoding-issues', 'Scanning for encoding problems'],
    ['name-detected', 'Detecting your name'],
    ['email-present-valid', 'Looking for email address'],
    ['phone-present', 'Looking for phone number'],
    ['linkedin-or-portfolio', 'Scanning for profile URLs'],
    ['standard-sections-detected', 'Analyzing section structure'],
    ['no-multi-column-layout', 'Checking page layout'],
    ['no-tables-or-textboxes', 'Detecting tables and text boxes'],
    ['skills-section-parseable', 'Parsing skills section'],
    ['keyword-coverage', 'Evaluating keyword coverage'],
    ['no-keyword-stuffing', 'Checking for keyword stuffing'],
    ['dates-present-consistent', 'Analyzing date formatting'],
    ['action-verbs-used', 'Evaluating action verbs'],
    ['quantified-impact', 'Measuring quantified impact'],
    ['word-count-appropriate', 'Checking resume length'],
    ['no-blank-sections', 'Scanning for empty sections'],
]);
let ScoringService = class ScoringService {
    resumeParser;
    constructor(resumeParser) {
        this.resumeParser = resumeParser;
    }
    score(extractionResult, resumeTypeHint) {
        const startTime = Date.now();
        const checkId = (0, crypto_1.randomUUID)();
        if (extractionResult.isImageOnly) {
            return this.buildImageOnlyResult(checkId, extractionResult, startTime);
        }
        const parsedResume = this.resumeParser.parse(extractionResult.text, extractionResult.pageCount);
        const detectedType = (0, resume_type_detector_util_1.detectResumeType)(parsedResume);
        const effectiveType = resumeTypeHint || detectedType;
        const profile = (0, profiles_1.getResumeTypeProfile)(effectiveType);
        const allRuleResults = [
            ...(0, file_format_rules_1.runFileFormatRules)(extractionResult),
            ...(0, contact_rules_1.runContactRules)(parsedResume),
            ...(0, structure_rules_1.runStructureRules)(parsedResume, profile),
            ...(0, keywords_rules_1.runKeywordRules)(parsedResume, profile),
            ...(0, experience_rules_1.runExperienceRules)(parsedResume, profile),
            ...(0, length_density_rules_1.runLengthDensityRules)(parsedResume),
        ];
        const categories = this.groupByCategory(allRuleResults);
        const overallScore = allRuleResults.reduce((sum, r) => sum + r.points, 0);
        const { band, label: bandLabel } = (0, score_band_util_1.getScoreBand)(Math.min(100, Math.max(0, overallScore)));
        const processingTimeMs = Date.now() - startTime;
        return {
            checkId,
            overallScore: Math.min(100, Math.max(0, overallScore)),
            maxScore: 100,
            band,
            bandLabel,
            resumeType: profile.id,
            categories,
            ruleResults: allRuleResults,
            meta: {
                wordCount: parsedResume.wordCount,
                pageCount: parsedResume.pageCount,
                processingTimeMs,
            },
        };
    }
    scoreWithProgress(extractionResult, resumeTypeHint, onProgress) {
        const startTime = Date.now();
        const checkId = (0, crypto_1.randomUUID)();
        if (extractionResult.isImageOnly) {
            return this.buildImageOnlyResult(checkId, extractionResult, startTime);
        }
        const parsedResume = this.resumeParser.parse(extractionResult.text, extractionResult.pageCount);
        const detectedType = (0, resume_type_detector_util_1.detectResumeType)(parsedResume);
        const effectiveType = resumeTypeHint || detectedType;
        const profile = (0, profiles_1.getResumeTypeProfile)(effectiveType);
        const categoryRunners = [
            {
                categoryLabel: 'File & Format Integrity',
                run: () => (0, file_format_rules_1.runFileFormatRules)(extractionResult),
            },
            {
                categoryLabel: 'Contact & Identity Parsing',
                run: () => (0, contact_rules_1.runContactRules)(parsedResume),
            },
            {
                categoryLabel: 'Structural Parsing',
                run: () => (0, structure_rules_1.runStructureRules)(parsedResume, profile),
            },
            {
                categoryLabel: 'Keyword & Skills Alignment',
                run: () => (0, keywords_rules_1.runKeywordRules)(parsedResume, profile),
            },
            {
                categoryLabel: 'Experience Quality Signals',
                run: () => (0, experience_rules_1.runExperienceRules)(parsedResume, profile),
            },
            {
                categoryLabel: 'Length & Density',
                run: () => (0, length_density_rules_1.runLengthDensityRules)(parsedResume),
            },
        ];
        const allRuleResults = [];
        for (const runner of categoryRunners) {
            const results = runner.run();
            for (const rule of results) {
                const label = RULE_LABELS.get(rule.id) ?? `Checking ${rule.id}`;
                onProgress({
                    type: 'step-start',
                    ruleId: rule.id,
                    category: rule.category,
                    label,
                });
                onProgress({
                    type: 'step-complete',
                    ruleId: rule.id,
                    category: rule.category,
                    label,
                    severity: rule.severity,
                    points: rule.points,
                    maxPoints: rule.maxPoints,
                    message: rule.message,
                });
                allRuleResults.push(rule);
            }
        }
        const categories = this.groupByCategory(allRuleResults);
        const overallScore = allRuleResults.reduce((sum, r) => sum + r.points, 0);
        const { band, label: bandLabel } = (0, score_band_util_1.getScoreBand)(Math.min(100, Math.max(0, overallScore)));
        const processingTimeMs = Date.now() - startTime;
        return {
            checkId,
            overallScore: Math.min(100, Math.max(0, overallScore)),
            maxScore: 100,
            band,
            bandLabel,
            resumeType: profile.id,
            categories,
            ruleResults: allRuleResults,
            meta: {
                wordCount: parsedResume.wordCount,
                pageCount: parsedResume.pageCount,
                processingTimeMs,
            },
        };
    }
    groupByCategory(rules) {
        const categoryMap = new Map();
        for (const rule of rules) {
            const existing = categoryMap.get(rule.category) || [];
            existing.push(rule);
            categoryMap.set(rule.category, existing);
        }
        return Array.from(categoryMap.entries()).map(([name, categoryRules]) => ({
            name,
            earnedPoints: categoryRules.reduce((sum, r) => sum + r.points, 0),
            maxPoints: categoryRules.reduce((sum, r) => sum + r.maxPoints, 0),
            rules: categoryRules,
        }));
    }
    buildImageOnlyResult(checkId, extractionResult, startTime) {
        const fileFormatResults = (0, file_format_rules_1.runFileFormatRules)(extractionResult);
        return {
            checkId,
            overallScore: 0,
            maxScore: 100,
            band: 'high-risk',
            bandLabel: 'Unable to score — scanned/image-only document',
            resumeType: 'general',
            categories: [
                {
                    name: 'File & Format Integrity',
                    earnedPoints: fileFormatResults.reduce((s, r) => s + r.points, 0),
                    maxPoints: fileFormatResults.reduce((s, r) => s + r.maxPoints, 0),
                    rules: fileFormatResults,
                },
            ],
            ruleResults: fileFormatResults,
            meta: {
                wordCount: 0,
                pageCount: extractionResult.pageCount,
                processingTimeMs: Date.now() - startTime,
            },
        };
    }
};
exports.ScoringService = ScoringService;
exports.ScoringService = ScoringService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resume_parser_service_1.ResumeParserService])
], ScoringService);
//# sourceMappingURL=scoring.service.js.map