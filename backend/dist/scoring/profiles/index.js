"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generalProfile = exports.supportProfile = exports.financeProfile = exports.techProfile = exports.RESUME_TYPE_PROFILES = void 0;
exports.getResumeTypeProfile = getResumeTypeProfile;
const tech_profile_1 = require("./tech.profile");
Object.defineProperty(exports, "techProfile", { enumerable: true, get: function () { return tech_profile_1.techProfile; } });
const finance_profile_1 = require("./finance.profile");
Object.defineProperty(exports, "financeProfile", { enumerable: true, get: function () { return finance_profile_1.financeProfile; } });
const support_profile_1 = require("./support.profile");
Object.defineProperty(exports, "supportProfile", { enumerable: true, get: function () { return support_profile_1.supportProfile; } });
const general_profile_1 = require("./general.profile");
Object.defineProperty(exports, "generalProfile", { enumerable: true, get: function () { return general_profile_1.generalProfile; } });
exports.RESUME_TYPE_PROFILES = new Map([
    [tech_profile_1.techProfile.id, tech_profile_1.techProfile],
    [finance_profile_1.financeProfile.id, finance_profile_1.financeProfile],
    [support_profile_1.supportProfile.id, support_profile_1.supportProfile],
    [general_profile_1.generalProfile.id, general_profile_1.generalProfile],
]);
function getResumeTypeProfile(typeId) {
    if (typeId && exports.RESUME_TYPE_PROFILES.has(typeId)) {
        return exports.RESUME_TYPE_PROFILES.get(typeId);
    }
    return general_profile_1.generalProfile;
}
//# sourceMappingURL=index.js.map