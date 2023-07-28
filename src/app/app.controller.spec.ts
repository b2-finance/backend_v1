import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';

describe('AppController', () => {
  let con: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [ConfigService, LogService]
    }).compile();

    con = app.get<AppController>(AppController);
  });

  describe('getHello()', () => {
    it('should return "Hello World!"', () => {
      expect(con.getHello()).toEqual('Hello World!');
    });
  });

  describe('getEnvironment()', () => {
    it('should return the current env name', () => {
      expect(con.getEnvironment()).toEqual('dev-test');
    });
  });
});
