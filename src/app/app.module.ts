import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LogModule } from 'src/log/log.module';
import { AuthModule } from 'src/auth/auth.module';
import { AppController } from './app.controller';
import { CoreModule } from 'src/core/core.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `env/.env.${process.env.NODE_ENV}`,
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) =>
        ({
          type: config.get('DATABASE_TYPE'),
          host: config.get('DATABASE_HOST'),
          port: config.get('DATABASE_PORT'),
          username: config.get('DATABASE_USER'),
          password: config.get('DATABASE_PASS'),
          database: config.get('DATABASE_NAME'),
          entityPrefix: 'db_',
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV === 'prod' ? false : true
        } as TypeOrmModuleOptions)
    }),
    LogModule,
    AuthModule,
    CoreModule
  ],
  controllers: [AppController]
})
export class AppModule {}
