import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * DatabaseModule — global module providing the SQLite connection.
 * Marked @Global so every module can inject DatabaseService
 * without explicitly importing this module.
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
