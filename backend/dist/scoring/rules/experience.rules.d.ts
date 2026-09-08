import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';
import { ResumeTypeProfile } from '../profiles/resume-type-profile.interface';
export declare function checkDatesPresentConsistent(parsedResume: ParsedResume, profile?: ResumeTypeProfile, experienceLevel?: string): RuleResult;
export declare function checkActionVerbsUsed(parsedResume: ParsedResume, profile: ResumeTypeProfile, experienceLevel?: string): RuleResult;
export declare function checkQuantifiedImpact(parsedResume: ParsedResume, profile: ResumeTypeProfile, experienceLevel?: string): RuleResult;
export declare function runExperienceRules(parsedResume: ParsedResume, profile: ResumeTypeProfile, experienceLevel?: string): RuleResult[];
