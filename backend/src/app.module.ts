import { Module } from '@nestjs/common';
import { FileIngestModule } from './file-ingest/file-ingest.module';

@Module({
  imports: [FileIngestModule],
})
export class AppModule {}
