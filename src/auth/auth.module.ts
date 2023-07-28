import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * Provides services related to authorization
 */
@Module({
  imports: [JwtModule.register({ global: true })]
})
export class AuthModule {}
