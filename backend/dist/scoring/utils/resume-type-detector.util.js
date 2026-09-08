"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectResumeType = detectResumeType;
const profiles_1 = require("../profiles");
function detectResumeType(parsedResume) {
    const fullTextLower = parsedResume.fullText.toLowerCase();
    let bestId = 'general';
    let bestScore = 0;
    for (const [id, profile] of profiles_1.RESUME_TYPE_PROFILES) {
        if (id === 'general')
            continue;
        const matchedKeywords = profile.hardSkillKeywords.filter((kw) => {
            const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const pattern = /^[a-z0-9]+$/i.test(kw)
                ? new RegExp(`\\b${escaped}\\b`, 'i')
                : new RegExp(`(?:^|[\\s,;|/])${escaped}(?:$|[\\s,;|/])`, 'i');
            return pattern.test(fullTextLower);
        });
        const score = matchedKeywords.length / profile.keywordCoverageTarget;
        if (score > bestScore) {
            bestScore = score;
            bestId = id;
        }
    }
    if (bestScore < 0.3) {
        return 'general';
    }
    return bestId;
}
//# sourceMappingURL=resume-type-detector.util.js.map