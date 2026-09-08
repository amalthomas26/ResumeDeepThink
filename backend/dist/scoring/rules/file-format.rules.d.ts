import { RuleResult } from '../interfaces/rule-result.interface';
import { ExtractionResult } from '../../file-ingest/interfaces/extraction-result.interface';
export declare function checkFileIsValidDocument(extractionResult: ExtractionResult): RuleResult;
export declare function checkTextLayerExtractable(extractionResult: ExtractionResult): RuleResult;
export declare function checkNoEncodingIssues(extractionResult: ExtractionResult): RuleResult;
export declare function runFileFormatRules(extractionResult: ExtractionResult): RuleResult[];
