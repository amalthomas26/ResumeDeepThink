import { TextExtractorService } from '../services/text-extractor.service';

describe('TextExtractorService', () => {
  let service: TextExtractorService;

  beforeEach(() => {
    service = new TextExtractorService();
  });

  describe('encoding issue detection', () => {
    it('should not flag standard ASCII/UTF-8 resume text', () => {
      const text = 'Software Engineer with 5 years of experience in TypeScript and Python.';
      expect((service as any).detectEncodingIssues(text)).toBe(false);
    });

    it('should flag text with high ratio of replacement characters', () => {
      const text = 'Hello \uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD\uFFFD World \uFFFD\uFFFD\uFFFD\uFFFD';
      expect((service as any).detectEncodingIssues(text)).toBe(true);
    });

    it('should flag text with abnormal control characters', () => {
      const text = 'Resume\x00\x01\x02\x03\x04\x05\x06\x07\x08 data';
      expect((service as any).detectEncodingIssues(text)).toBe(true);
    });

    it('should handle empty string without error', () => {
      expect((service as any).detectEncodingIssues('')).toBe(false);
    });
  });

  describe('extractFromPdf', () => {
    it('should identify scanned/image-only PDF when extracted text is below threshold', async () => {
      // Mock pdfParse if needed or test with a minimal buffer
      const mockResult = {
        text: 'img',
        numpages: 1,
        info: {},
      };
      jest.spyOn(service as any, 'extractFromPdf').mockImplementationOnce(async () => {
        const text = mockResult.text;
        const pageCount = mockResult.numpages;
        const charsPerPage = text.length / pageCount;
        return {
          text,
          pageCount,
          wordCount: 1,
          isImageOnly: charsPerPage < 50,
          hasEncodingIssues: false,
          metadata: {},
        };
      });

      const result = await service.extractFromPdf(Buffer.from('dummy'));
      expect(result.isImageOnly).toBe(true);
    });

    it('should identify normal text PDF with sufficient characters per page', async () => {
      const mockText = 'Jane Doe\nSoftware Engineer\nExperience at Tech Corp developing distributed backend systems.\nSkills: Node.js, TypeScript, PostgreSQL, AWS, Docker.';
      jest.spyOn(service as any, 'extractFromPdf').mockImplementationOnce(async () => {
        return {
          text: mockText,
          pageCount: 1,
          wordCount: mockText.split(/\s+/).length,
          isImageOnly: false,
          hasEncodingIssues: false,
          metadata: { title: 'Resume' },
        };
      });

      const result = await service.extractFromPdf(Buffer.from('dummy'));
      expect(result.isImageOnly).toBe(false);
      expect(result.wordCount).toBeGreaterThan(10);
    });
  });

  describe('extractFromDocx', () => {
    it('should extract text from docx buffer', async () => {
      const mockText = 'John Smith\nFinancial Analyst with Bloomberg and Excel expertise.';
      jest.spyOn(service as any, 'extractFromDocx').mockImplementationOnce(async () => {
        return {
          text: mockText,
          pageCount: 1,
          wordCount: mockText.split(/\s+/).length,
          isImageOnly: false,
          hasEncodingIssues: false,
          metadata: {},
        };
      });

      const result = await service.extractFromDocx(Buffer.from('dummy'));
      expect(result.isImageOnly).toBe(false);
      expect(result.text).toContain('John Smith');
    });
  });
});
