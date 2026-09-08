export interface ExtractionResult {
    readonly text: string;
    readonly pageCount: number;
    readonly wordCount: number;
    readonly isImageOnly: boolean;
    readonly hasEncodingIssues: boolean;
    readonly metadata: {
        readonly title?: string;
        readonly author?: string;
    };
}
