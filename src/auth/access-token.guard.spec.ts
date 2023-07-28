import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenGuard } from './access-token.guard';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';

describe('AccessTokenGuard', () => {
  let guard: AccessTokenGuard;
  let jwtSvc: JwtService;
  let config: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AccessTokenGuard, JwtService, ConfigService, LogService]
    }).compile();

    guard = module.get<AccessTokenGuard>(AccessTokenGuard);
    jwtSvc = module.get<JwtService>(JwtService);
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('canActivate()', () => {
    it('should return true if token is valid', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer XYZ' }
          })
        })
      };
      jest.spyOn(jwtSvc, 'verifyAsync').mockResolvedValue({});

      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toEqual(true);
    });

    it('should call jwtSvc.verifyAsync with correct arguments', async () => {
      const token = 'XYZ';
      const secret = 'JWT_ACCESS_SECRET';

      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: `Bearer ${token}` }
          })
        })
      };
      jest
        .spyOn(config, 'get')
        .mockImplementation((key: string) =>
          key === 'JWT_ACCESS_SECRET' ? secret : ''
        );
      jest.spyOn(jwtSvc, 'verifyAsync').mockResolvedValue({});

      await guard.canActivate(context as ExecutionContext);
      expect(jwtSvc.verifyAsync).toHaveBeenCalledWith(token, { secret });
    });

    it('should throw UnauthorizedException if no token in header', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: {} })
        })
      };
      expect(
        async () => await guard.canActivate(context as ExecutionContext)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token not marked as "Bearer"', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({ headers: { authorization: 'XYZ' } })
        })
      };
      expect(
        async () => await guard.canActivate(context as ExecutionContext)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const context = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: 'Bearer XYZ' }
          })
        })
      };
      jest.spyOn(jwtSvc, 'verifyAsync').mockImplementation(() => {
        throw new Error();
      });
      expect(
        async () => await guard.canActivate(context as ExecutionContext)
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should add the JWT payload to request.user', async () => {
      const request = {
        headers: { authorization: 'Bearer XYZ' }
      };
      const context = {
        switchToHttp: () => ({
          getRequest: () => request
        })
      };
      const payload = {
        sub: randomUUID(),
        username: 'username'
      };
      jest.spyOn(jwtSvc, 'verifyAsync').mockResolvedValue(payload);

      await guard.canActivate(context as ExecutionContext);
      expect(request['user']).toEqual(payload);
    });
  });
});
