import { Injectable, BadRequestException, Logger } from '@nestjs/common';

/**
 * Supported MIME types and their corresponding magic byte signatures.
 */
const MAGIC_BYTES: ReadonlyArray<{
  mime: string;
  ext: string;
  bytes: number[];
}> = [
  // PDF: starts with %PDF
  { mime: 'application/pdf', ext: 'pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  // DOCX (ZIP-based): PK\x03\x04
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: 'docx',
    bytes: [0x50, 0x4b, 0x03, 0x04],
  },
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

@Injectable()
export class FileValidatorService {
  private readonly logger = new Logger(FileValidatorService.name);

  /**
   * Validates an uploaded file before it reaches the parsing pipeline.
   *
   * Per edge-cases.md:
   * - Validate file signature/magic bytes, not just extension
   * - Reject corrupted / non-resume files with clear messages
   * - Enforce 5MB size limit
   *
   * @throws BadRequestException with a specific, user-facing message
   */
  validate(file: Express.Multer.File): { type: 'pdf' | 'docx' } {
    // 1. Check file presence
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded. Please select a PDF or DOCX resume.');
    }

    // 2. Check file size (Multer also enforces this, but defense-in-depth)
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). ` +
        'Maximum allowed size is 5MB. Resumes are text-dominant and should be well under this limit.',
      );
    }

    // 3. Check extension (first-pass filter)
    const ext = this.getExtension(file.originalname);
    if (ext !== 'pdf' && ext !== 'docx') {
      throw new BadRequestException(
        `Unsupported file type ".${ext}". Only PDF and DOCX files are accepted.`,
      );
    }

    // 4. Validate magic bytes (defense against renamed files)
    const detectedType = this.detectFileType(file.buffer);
    if (!detectedType) {
      throw new BadRequestException(
        'This file does not appear to be a valid PDF or DOCX. ' +
        'It may be a renamed image, a corrupted file, or an unsupported format. ' +
        'Please upload a genuine PDF or DOCX resume.',
      );
    }

    // 5. Cross-check: extension matches detected type
    if (ext !== detectedType) {
      this.logger.warn(
        `Extension/content mismatch: .${ext} but detected as ${detectedType}`,
      );
      // We trust the magic bytes over the extension
    }

    return { type: detectedType };
  }

  /**
   * Detects file type by examining magic bytes.
   * Returns 'pdf' | 'docx' | null.
   */
  private detectFileType(buffer: Buffer): 'pdf' | 'docx' | null {
    if (buffer.length < 4) return null;

    for (const entry of MAGIC_BYTES) {
      const matches = entry.bytes.every(
        (byte, i) => buffer[i] === byte,
      );
      if (matches) {
        return entry.ext as 'pdf' | 'docx';
      }
    }

    return null;
  }

  /**
   * Extracts the file extension from a filename, lowercased.
   */
  private getExtension(filename: string): string {
    const parts = filename.split('.');
    return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
  }
}
