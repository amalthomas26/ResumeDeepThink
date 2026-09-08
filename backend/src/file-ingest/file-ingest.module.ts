import { Module } from '@nestjs/common';
import { FileIngestController } from './file-ingest.controller';
import { FileValidatorService } from './services/file-validator.service';
import { TextExtractorService } from './services/text-extractor.service';
import { ScoringModule } from '../scoring/scoring.module';
import { AiInsightModule } from '../ai-insight/ai-insight.module';
import { UsageModule } from '../usage/usage.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ScoringModule, AiInsightModule, UsageModule, AuthModule],
  controllers: [FileIngestController],
  providers: [FileValidatorService, TextExtractorService],
})
export class FileIngestModule {}

