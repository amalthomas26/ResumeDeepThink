import { Module } from '@nestjs/common';
import { FileIngestController } from './file-ingest.controller';
import { FileValidatorService } from './services/file-validator.service';
import { TextExtractorService } from './services/text-extractor.service';
import { ScoringModule } from '../scoring/scoring.module';

@Module({
  imports: [ScoringModule],
  controllers: [FileIngestController],
  providers: [FileValidatorService, TextExtractorService],
})
export class FileIngestModule {}
