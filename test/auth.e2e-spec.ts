import { Test, TestingModule } from '@nestjs/testing';
import {
  Controller,
  Get,
  HttpStatus,
  INestApplication,
  Req,
  UseGuards
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app/app.module';
import { LogService } from 'src/log/log.service';
import { AccessTokenGuard } from 'src/auth/access-token.guard';
import { AuthRequest } from 'src/auth/auth-request.dto';
import { ACCESS_TOKEN_DEFAULTS, getAccessToken } from './test-utils';

@UseGuards(AccessTokenGuard)
@Controller('/test')
export class TestController {
  @Get()
  get(@Req() req: AuthRequest): string {
    const { sub } = req.user;
    return sub;
  }
}

describe('AccessTokenGuard (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      controllers: [TestController],
      providers: [LogService]
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should block requests that have no access token with UNAUTHORIZED status', async () => {
    await request(app.getHttpServer())
      .get('/test')
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should block requests that have an invalid access token with UNAUTHORIZED status', async () => {
    // Using a secret other than the default shared secret will produce an invalid token
    const invalidToken = await getAccessToken({
      secret: `${ACCESS_TOKEN_DEFAULTS.secret}1`
    });
    await request(app.getHttpServer())
      .get('/test')
      .set('Authorization', `Bearer ${invalidToken}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it('should allow requests that have a valid access token', async () => {
    await request(app.getHttpServer())
      .get('/test')
      .set('Authorization', `Bearer ${await getAccessToken()}`)
      .expect(HttpStatus.OK);
  });

  it('should attach a user object on the request upon successful authorization', async () => {
    const sub = 'joe';
    await request(app.getHttpServer())
      .get('/test')
      .set('Authorization', `Bearer ${await getAccessToken({ sub })}`)
      .expect(({ text }) => {
        expect(text).toEqual(sub);
      });
  });

  it('should block requests if access token is expired', async () => {
    const accessToken = await getAccessToken({ expiresIn: '1s' });

    // Wait 3 seconds before using the token
    await new Promise((x) => setTimeout(x, 3000));

    await request(app.getHttpServer())
      .get('/test')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(HttpStatus.UNAUTHORIZED);
  });
});
