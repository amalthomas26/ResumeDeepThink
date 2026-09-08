import { Module } from '@nestjs/common';
import { AiInsightService } from './services/ai-insight.service';
import { PromptBuilderService } from './services/prompt-builder.service';
import { FallbackTipsService } from './services/fallback-tips.service';

@Module({
  providers: [AiInsightService, PromptBuilderService, FallbackTipsService],
  exports: [AiInsightService],
})
export class AiInsightModule {}
