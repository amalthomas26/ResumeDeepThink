import { Injectable, Logger } from '@nestjs/common';
import { ExtractionResult } from '../interfaces/extraction-result.interface';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PDFParse, PasswordException } = require('pdf-parse');
import * as mammoth from 'mammoth';

/**
 * Minimum characters per page to consider a PDF as having a text layer.
 * Below this, it's treated as scanned/image-only.
 */
const MIN_CHARS_PER_PAGE = 50;

/**
 * Maximum ratio of replacement characters (U+FFFD) or control chars
 * to total characters before we flag encoding issues.
 */
const ENCODING_ISSUE_THRESHOLD = 0.05;

@Injectable()
export class TextExtractorService {
  private readonly logger = new Logger(TextExtractorService.name);

  /**
   * Extracts text from a PDF buffer.
   *
   * Per edge-cases.md:
   * - Scanned/image-only PDF: detect explicitly via text-length-per-page threshold
   * - Encoding issues: detect high ratio of U+FFFD or control chars
   * - Password-protected: catch password exceptions and throw descriptive error
   */
  async extractFromPdf(buffer: Buffer): Promise<ExtractionResult> {
    let parser: any;
    try {
      parser = new PDFParse({ data: buffer });
      await parser.load();
      const textResult = await parser.getText();
      const infoResult = await parser.getInfo().catch(() => null);

      const text = textResult.text || '';
      const pageCount = textResult.total || textResult.pages?.length || 1;
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      // Scanned/image-only detection
      const charsPerPage = text.length / pageCount;
      const isImageOnly = charsPerPage < MIN_CHARS_PER_PAGE;

      // Encoding issue detection
      const hasEncodingIssues = this.detectEncodingIssues(text);

      return {
        text,
        pageCount,
        wordCount,
        isImageOnly,
        hasEncodingIssues,
        metadata: {
          title: infoResult?.info?.Title || undefined,
          author: infoResult?.info?.Author || undefined,
        },
      };
    } catch (error: any) {
      if (
        (PasswordException && error instanceof PasswordException) ||
        (error instanceof Error && /password|encrypted/i.test(error.message))
      ) {
        throw new Error(
          'This file appears to be password-protected. Please remove the password protection and re-upload.',
        );
      }
      throw error;
    } finally {
      if (parser) {
        await parser.destroy().catch(() => {});
      }
    }
  }

  /**
   * Extracts text from a DOCX buffer using mammoth.
   * mammoth.extractRawText() gives us plain text without formatting.
   */
  async extractFromDocx(buffer: Buffer): Promise<ExtractionResult> {
    const result = await mammoth.extractRawText({ buffer });

    const text = result.value || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;

    // Log any conversion warnings
    if (result.messages.length > 0) {
      this.logger.warn(
        `DOCX extraction warnings: ${result.messages.map((m) => m.message).join('; ')}`,
      );
    }

    // DOCX doesn't have page-count metadata; estimate from word count
    // Average page ≈ 300-400 words
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 350));

    return {
      text,
      pageCount: estimatedPages,
      wordCount,
      isImageOnly: false, // DOCX always has text content if parseable
      hasEncodingIssues: this.detectEncodingIssues(text),
      metadata: {},
    };
  }

  /**
   * Detects encoding issues: high ratio of replacement characters (U+FFFD),
   * null bytes, or other control characters that indicate a bad PDF export.
   */
  private detectEncodingIssues(text: string): boolean {
    if (text.length === 0) return false;

    let issueCount = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      // U+FFFD replacement character
      if (code === 0xfffd) issueCount++;
      // Null byte or non-standard control chars (except tab, newline, carriage return)
      else if (code < 32 && code !== 9 && code !== 10 && code !== 13) issueCount++;
    }

    return issueCount / text.length > ENCODING_ISSUE_THRESHOLD;
  }
}
