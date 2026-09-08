/**
 * Output of the text extraction step.
 * Carries diagnostic flags that the scoring layer uses to decide
 * whether to score normally or short-circuit with a distinct message.
 */
export interface ExtractionResult {
  /** The raw extracted text content */
  readonly text: string;

  /** Number of pages in the document (PDF only; 1 for DOCX) */
  readonly pageCount: number;

  /** Total word count of the extracted text */
  readonly wordCount: number;

  /**
   * True when the PDF has no extractable text layer (scanned/image-only).
   * Triggers a short-circuit: do NOT score an empty resume as bad content.
   */
  readonly isImageOnly: boolean;

  /**
   * True when extraction produced a high ratio of replacement characters
   * (U+FFFD) or control chars, indicating encoding/export issues.
   */
  readonly hasEncodingIssues: boolean;

  /** Optional document metadata */
  readonly metadata: {
    readonly title?: string;
    readonly author?: string;
  };
}
