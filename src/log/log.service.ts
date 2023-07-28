import { ConsoleLogger, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Provides application logging services
 */
@Injectable()
export class LogService extends ConsoleLogger {
  constructor(private readonly CONFIG: ConfigService) {
    super();
    if (this.CONFIG.get('LOGS') === 'false' || process.env.LOGS === 'false')
      this.setLogLevels([]);
  }
}
