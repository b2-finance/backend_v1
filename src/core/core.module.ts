import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogModule } from 'src/log/log.module';
import { AuthModule } from 'src/auth/auth.module';
import { ThingController } from './thing/controller/thing.controller';
import { ThingService } from './thing/service/thing.service';
import { ThingMapper } from './thing/mapper/thing.mapper';
import { Thing } from './thing/entity/thing.entity';

/**
 * Contains the core services and entities of the app
 */
@Module({
  imports: [TypeOrmModule.forFeature([Thing]), LogModule, AuthModule],
  controllers: [ThingController],
  providers: [ThingService, ThingMapper]
})
export class CoreModule {}
