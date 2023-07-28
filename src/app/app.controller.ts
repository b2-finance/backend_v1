import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';

/**
 * Handles requests at the application root path
 */
@Controller()
export class AppController {
  constructor(
    private readonly CONFIG: ConfigService,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(AppController.name);
  }

  /**
   * Returns a hello message and a 200 HTTP status code
   *
   * @returns Hello World!
   */
  @Get()
  getHello(): string {
    this.LOGGER.log('Hello.');
    return 'Hello World!';
  }

  /**
   * Gets the current environment of the app
   *
   * @returns The current environment name
   */
  @Get('/env')
  getEnvironment(): string {
    this.LOGGER.log('Get env.');
    return this.CONFIG.get('NODE_ENV');
  }
}
