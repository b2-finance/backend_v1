import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { Request } from 'express';

/**
 * Route handlers using this guard require a valid JSON Web Token (JWT)
 */
@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly JWT_SVC: JwtService,
    private readonly CONFIG: ConfigService,
    private readonly LOGGER: LogService
  ) {
    // FIXME: logs are using controller context for some reason
    this.LOGGER.setContext(AccessTokenGuard.name);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.LOGGER.error('Malformed token.');
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.JWT_SVC.verifyAsync(token, {
        secret: this.CONFIG.get('JWT_ACCESS_SECRET')
      });
      request.user = payload;
      payload.sub && this.LOGGER.log(`Authorized user with id=${payload.sub}.`);
    } catch {
      this.LOGGER.error('Invalid token.');
      throw new UnauthorizedException();
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
