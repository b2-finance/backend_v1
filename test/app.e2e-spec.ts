import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /', () => {
    it('should return OK status', async () => {
      await request(app.getHttpServer()).get('').expect(HttpStatus.OK);
    });

    it('should return Hello World!', async () => {
      await request(app.getHttpServer())
        .get('')
        .expect(({ text }) => {
          expect(text).toEqual('Hello World!');
        });
    });
  });

  describe('GET /env', () => {
    it('should return OK status', async () => {
      await request(app.getHttpServer()).get('/env').expect(HttpStatus.OK);
    });

    it('should return current env name', async () => {
      await request(app.getHttpServer())
        .get('/env')
        .expect(({ text }) => {
          expect(text).toEqual('dev-test');
        });
    });
  });
});
