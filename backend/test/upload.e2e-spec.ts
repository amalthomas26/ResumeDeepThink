import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import * as path from 'path';
import * as fs from 'fs';

describe('Resume Upload E2E (POST /resume/upload)', () => {
  let app: INestApplication;
  const fixturesDir = path.join(__dirname, 'fixtures');

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Valid PDF upload', () => {
    it('should upload clean-resume.pdf and return a full score breakdown', async () => {
      const pdfPath = path.join(fixturesDir, 'clean-resume.pdf');
      const response = await request(app.getHttpServer())
        .post('/resume/upload')
        .attach('file', pdfPath)
        .field('resumeType', 'tech')
        .expect(200);

      const body = response.body;
      expect(body).toBeDefined();
      expect(body.checkId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
      expect(body.overallScore).toBeGreaterThanOrEqual(0);
      expect(body.overallScore).toBeLessThanOrEqual(100);
      expect(body.maxScore).toBe(100);
      expect(['strong', 'workable', 'at-risk', 'high-risk']).toContain(body.band);
      expect(body.resumeType).toBe('tech');
      expect(body.categories).toHaveLength(6);
      expect(body.ruleResults.length).toBeGreaterThan(10);
      expect(body.meta).toBeDefined();
      expect(body.meta.wordCount).toBeGreaterThan(50);
      expect(body.meta.processingTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should auto-detect resume type when not provided', async () => {
      const pdfPath = path.join(fixturesDir, 'clean-resume.pdf');
      const response = await request(app.getHttpServer())
        .post('/resume/upload')
        .attach('file', pdfPath)
        .expect(200);

      expect(response.body.resumeType).toBeDefined();
      expect(['tech', 'finance', 'support', 'general']).toContain(
        response.body.resumeType,
      );
    });

    it('should handle scanned / image-only PDF by flagging text layer', async () => {
      const pdfPath = path.join(fixturesDir, 'scanned-image-resume.pdf');
      const response = await request(app.getHttpServer())
        .post('/resume/upload')
        .attach('file', pdfPath)
        .expect(200);

      const body = response.body;
      const textLayerRule = body.ruleResults.find(
        (r: any) => r.id === 'text-layer-extractable',
      );
      expect(textLayerRule).toBeDefined();
      expect(textLayerRule.passed).toBe(false);
      expect(textLayerRule.points).toBe(0);
    });
  });

  describe('Validation & Edge Cases', () => {
    it('should reject upload without a file', async () => {
      const response = await request(app.getHttpServer())
        .post('/resume/upload')
        .expect(400);

      expect(response.body.message).toContain('No file uploaded');
    });

    it('should reject invalid resumeType query/field', async () => {
      const pdfPath = path.join(fixturesDir, 'clean-resume.pdf');
      const response = await request(app.getHttpServer())
        .post('/resume/upload')
        .attach('file', pdfPath)
        .field('resumeType', 'invalid-type-123')
        .expect(400);

      expect(response.body.message).toContain('Invalid resume type');
    });

    it('should reject unsupported file extension (.txt)', async () => {
      const txtPath = path.join(fixturesDir, 'clean-resume.txt');
      const response = await request(app.getHttpServer())
        .post('/resume/upload')
        .attach('file', txtPath)
        .expect(400);

      expect(response.body.message).toContain('Unsupported file type');
    });

    it('should reject renamed file with mismatching magic bytes', async () => {
      const fakePdf = Buffer.from('RIFF1234WAVEfmt not a pdf');
      const response = await request(app.getHttpServer())
        .post('/resume/upload')
        .attach('file', fakePdf, 'fake.pdf')
        .expect(400);

      expect(response.body.message).toContain('does not appear to be a valid PDF or DOCX');
    });
  });

  describe('Phase 2 SSE Streaming (POST /resume/check + GET /resume/check/:checkId/stream)', () => {
    it('should initiate check and return checkId', async () => {
      const pdfPath = path.join(fixturesDir, 'clean-resume.pdf');
      const response = await request(app.getHttpServer())
        .post('/resume/check')
        .attach('file', pdfPath)
        .field('resumeType', 'tech')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(response.body.checkId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    });

    it('should return 404 when streaming non-existent checkId', async () => {
      const response = await request(app.getHttpServer())
        .get('/resume/check/00000000-0000-0000-0000-000000000000/stream')
        .expect(404);

      expect(response.body.message).toContain('not found');
    });

    it('should stream check progress events and complete with full scoring result', async () => {
      const pdfPath = path.join(fixturesDir, 'clean-resume.pdf');
      const initResponse = await request(app.getHttpServer())
        .post('/resume/check')
        .attach('file', pdfPath)
        .field('resumeType', 'tech')
        .expect(200);

      const checkId = initResponse.body.checkId;
      expect(checkId).toBeDefined();

      // Connect to SSE stream
      const streamResponse = await request(app.getHttpServer())
        .get(`/resume/check/${checkId}/stream`)
        .expect(200)
        .expect('Content-Type', /text\/event-stream/);

      const rawText = streamResponse.text;
      expect(rawText).toContain('step-start');
      expect(rawText).toContain('step-complete');
      expect(rawText).toContain('complete');

      // Verify the categories have name, earnedPoints, maxPoints (not the old buggy names)
      expect(rawText).toContain('"earnedPoints"');
      expect(rawText).toContain('"maxPoints"');
      expect(rawText).toContain('File & Format Integrity');
    });
  });
});

