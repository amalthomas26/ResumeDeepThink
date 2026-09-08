import { Module } from '@nestjs/common';
import { ScoringService } from './services/scoring.service';
import { ResumeParserService } from './services/resume-parser.service';

@Module({
  providers: [ScoringService, ResumeParserService],
  exports: [ScoringService],
})
export class ScoringModule {}
