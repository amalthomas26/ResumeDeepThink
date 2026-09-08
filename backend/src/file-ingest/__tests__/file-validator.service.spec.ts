import { FileValidatorService } from '../services/file-validator.service';
import { BadRequestException } from '@nestjs/common';

describe('FileValidatorService', () => {
  let validator: FileValidatorService;

  beforeEach(() => {
    validator = new FileValidatorService();
  });

  const makeFile = (
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File => ({
    fieldname: 'file',
    originalname: 'resume.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: 50000,
    buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, ...Array(100).fill(0)]), // PDF magic bytes
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  });

  describe('validate()', () => {
    it('should accept a valid PDF file', () => {
      const result = validator.validate(makeFile());
      expect(result.type).toBe('pdf');
    });

    it('should accept a valid DOCX file', () => {
      const result = validator.validate(
        makeFile({
          originalname: 'resume.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          buffer: Buffer.from([0x50, 0x4b, 0x03, 0x04, ...Array(100).fill(0)]),
        }),
      );
      expect(result.type).toBe('docx');
    });

    it('should reject when no file uploaded', () => {
      expect(() => validator.validate(null as any)).toThrow(BadRequestException);
    });

    it('should reject file with no buffer', () => {
      expect(() =>
        validator.validate(makeFile({ buffer: undefined as any })),
      ).toThrow(BadRequestException);
    });

    it('should reject files exceeding 5MB', () => {
      expect(() =>
        validator.validate(makeFile({ size: 6 * 1024 * 1024 })),
      ).toThrow(BadRequestException);
    });

    it('should reject unsupported extensions', () => {
      expect(() =>
        validator.validate(makeFile({ originalname: 'image.png' })),
      ).toThrow(BadRequestException);
    });

    it('should reject renamed images (wrong magic bytes)', () => {
      // PNG magic bytes but .pdf extension
      const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, ...Array(100).fill(0)]);
      expect(() =>
        validator.validate(makeFile({ buffer: pngBytes })),
      ).toThrow(BadRequestException);
      expect(() =>
        validator.validate(makeFile({ buffer: pngBytes })),
      ).toThrow(/does not appear to be a valid PDF or DOCX/);
    });

    it('should reject files with too-small buffer', () => {
      expect(() =>
        validator.validate(makeFile({ buffer: Buffer.from([0x25]) })),
      ).toThrow(BadRequestException);
    });
  });
});
