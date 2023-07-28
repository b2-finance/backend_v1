import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { LogService } from './log/log.service';
import { ValidationPipe } from '@nestjs/common';
import { QueryFailedErrorFilter } from './shared/exception-filter/query-failed-error.filter';
import { EntityNotFoundErrorFilter } from './shared/exception-filter/entity-not-found-error.filter';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true
  });

  app.useLogger(app.get(LogService));
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.useGlobalFilters(
    new QueryFailedErrorFilter(),
    new EntityNotFoundErrorFilter()
  );

  const config = app.get(ConfigService);
  await app.listen(config.get('PORT'));
}
bootstrap();
