import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { FileIngestModule } from './file-ingest/file-ingest.module';
import { AiInsightModule } from './ai-insight/ai-insight.module';
import { UsageModule } from './usage/usage.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    FileIngestModule,
    AiInsightModule,
    UsageModule,
    AuthModule,
  ],
})
export class AppModule {}
