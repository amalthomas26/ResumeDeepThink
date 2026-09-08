import { RuleResult } from '../interfaces/rule-result.interface';
import { ParsedResume } from '../interfaces/parsed-resume.interface';
export declare function checkWordCountInRange(parsedResume: ParsedResume, experienceLevel?: string): RuleResult;
export declare function checkNoBlankSections(parsedResume: ParsedResume): RuleResult;
export declare function runLengthDensityRules(parsedResume: ParsedResume, experienceLevel?: string): RuleResult[];
