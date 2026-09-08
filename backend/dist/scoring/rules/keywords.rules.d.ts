import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';
import { ResumeTypeProfile } from '../profiles/resume-type-profile.interface';
export declare function checkSkillsSectionParseable(parsedResume: ParsedResume): RuleResult;
export declare function checkKeywordCoverage(parsedResume: ParsedResume, profile: ResumeTypeProfile): RuleResult;
export declare function checkNoKeywordStuffing(parsedResume: ParsedResume, profile: ResumeTypeProfile): RuleResult;
export declare function runKeywordRules(parsedResume: ParsedResume, profile: ResumeTypeProfile): RuleResult[];
