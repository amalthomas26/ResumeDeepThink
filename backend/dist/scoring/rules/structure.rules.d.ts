import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';
import { ResumeTypeProfile } from '../profiles/resume-type-profile.interface';
export declare function checkStandardSectionsDetected(parsedResume: ParsedResume, profile: ResumeTypeProfile, experienceLevel?: string): RuleResult;
export declare function checkNoMultiColumnLayout(parsedResume: ParsedResume): RuleResult;
export declare function checkNoTablesOrTextboxes(parsedResume: ParsedResume): RuleResult;
export declare function runStructureRules(parsedResume: ParsedResume, profile: ResumeTypeProfile, experienceLevel?: string): RuleResult[];
