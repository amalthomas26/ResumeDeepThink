import { ExtractionResult } from '../interfaces/extraction-result.interface';
export declare class TextExtractorService {
    private readonly logger;
    extractFromPdf(buffer: Buffer): Promise<ExtractionResult>;
    extractFromDocx(buffer: Buffer): Promise<ExtractionResult>;
    private detectEncodingIssues;
}
