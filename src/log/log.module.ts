import { Module } from '@nestjs/common';
import { LogService } from './log.service';

/**
 * Provides application logging services
 */
@Module({
  providers: [LogService],
  exports: [LogService]
})
export class LogModule {}
