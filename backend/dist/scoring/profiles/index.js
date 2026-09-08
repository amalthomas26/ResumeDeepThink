"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.creativeProfile = exports.marketingProfile = exports.fresherProfile = exports.generalProfile = exports.supportProfile = exports.financeProfile = exports.techProfile = exports.RESUME_TYPE_PROFILES = void 0;
exports.getResumeTypeProfile = getResumeTypeProfile;
const tech_profile_1 = require("./tech.profile");
Object.defineProperty(exports, "techProfile", { enumerable: true, get: function () { return tech_profile_1.techProfile; } });
const finance_profile_1 = require("./finance.profile");
Object.defineProperty(exports, "financeProfile", { enumerable: true, get: function () { return finance_profile_1.financeProfile; } });
const support_profile_1 = require("./support.profile");
Object.defineProperty(exports, "supportProfile", { enumerable: true, get: function () { return support_profile_1.supportProfile; } });
const general_profile_1 = require("./general.profile");
Object.defineProperty(exports, "generalProfile", { enumerable: true, get: function () { return general_profile_1.generalProfile; } });
const fresher_profile_1 = require("./fresher.profile");
Object.defineProperty(exports, "fresherProfile", { enumerable: true, get: function () { return fresher_profile_1.fresherProfile; } });
const marketing_profile_1 = require("./marketing.profile");
Object.defineProperty(exports, "marketingProfile", { enumerable: true, get: function () { return marketing_profile_1.marketingProfile; } });
const creative_profile_1 = require("./creative.profile");
Object.defineProperty(exports, "creativeProfile", { enumerable: true, get: function () { return creative_profile_1.creativeProfile; } });
exports.RESUME_TYPE_PROFILES = new Map([
    [tech_profile_1.techProfile.id, tech_profile_1.techProfile],
    [finance_profile_1.financeProfile.id, finance_profile_1.financeProfile],
    [support_profile_1.supportProfile.id, support_profile_1.supportProfile],
    [general_profile_1.generalProfile.id, general_profile_1.generalProfile],
    [fresher_profile_1.fresherProfile.id, fresher_profile_1.fresherProfile],
    [marketing_profile_1.marketingProfile.id, marketing_profile_1.marketingProfile],
    [creative_profile_1.creativeProfile.id, creative_profile_1.creativeProfile],
]);
function getResumeTypeProfile(typeId) {
    if (typeId && exports.RESUME_TYPE_PROFILES.has(typeId)) {
        return exports.RESUME_TYPE_PROFILES.get(typeId);
    }
    return general_profile_1.generalProfile;
}
//# sourceMappingURL=index.js.map