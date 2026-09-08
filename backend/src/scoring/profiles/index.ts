import { ResumeTypeProfile } from './resume-type-profile.interface';
import { techProfile } from './tech.profile';
import { financeProfile } from './finance.profile';
import { supportProfile } from './support.profile';
import { generalProfile } from './general.profile';
import { fresherProfile } from './fresher.profile';
import { marketingProfile } from './marketing.profile';
import { creativeProfile } from './creative.profile';

/**
 * Registry of all resume type profiles, keyed by profile ID.
 * Adding a new type means adding one profile file and one entry here.
 */
export const RESUME_TYPE_PROFILES: ReadonlyMap<string, ResumeTypeProfile> =
  new Map<string, ResumeTypeProfile>([
    [techProfile.id, techProfile],
    [financeProfile.id, financeProfile],
    [supportProfile.id, supportProfile],
    [generalProfile.id, generalProfile],
    [fresherProfile.id, fresherProfile],
    [marketingProfile.id, marketingProfile],
    [creativeProfile.id, creativeProfile],
  ]);

/**
 * Returns the profile for a given type ID, falling back to 'general'.
 */
export function getResumeTypeProfile(typeId: string | undefined): ResumeTypeProfile {
  if (typeId && RESUME_TYPE_PROFILES.has(typeId)) {
    return RESUME_TYPE_PROFILES.get(typeId)!;
  }
  return generalProfile;
}

export {
  techProfile,
  financeProfile,
  supportProfile,
  generalProfile,
  fresherProfile,
  marketingProfile,
  creativeProfile,
};
export type { ResumeTypeProfile } from './resume-type-profile.interface';

