import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app/app.module';
import { LogService } from 'src/log/log.service';
import { AccountService } from 'src/core/service/account.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from 'src/core/entity/account.entity';
import { AccountDto } from 'src/core/dto/account.dto';
import { AccountCreateDto } from 'src/core/dto/account-create.dto';
import { User } from 'src/core/entity/user.entity';
import { randomUUID } from 'crypto';
import { signUp } from './test-utils';

describe('AccountController (e2e)', () => {
  let app: INestApplication;
  let acctRepo: Repository<Account>;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        LogService,
        AccountService,
        {
          provide: getRepositoryToken(Account),
          useClass: Repository<Account>
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository<User>
        }
      ]
    }).compile();

    app = module.createNestApplication();
    acctRepo = module.get<Repository<Account>>(getRepositoryToken(Account));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await acctRepo.query('DELETE FROM db_account');
    await userRepo.query('DELETE FROM db_user');
    await app.close();
  });

  describe('POST /api/accounts', () => {
    it('should require an access token', async () => {
      const dto: AccountCreateDto = {
        code: 'code',
        name: 'name'
      };
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send(dto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return CREATED status', async () => {
      const { accessToken } = await signUp(app);

      const dto: AccountCreateDto = {
        code: 'code',
        name: 'name'
      };
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send(dto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.CREATED);
    });

    it('should return the created account DTO', async () => {
      const { accessToken } = await signUp(app);

      const accountCreateDto: AccountCreateDto = {
        code: 'code',
        name: 'name'
      };
      const accountDto: AccountDto = {
        id: expect.any(String),
        code: accountCreateDto.code,
        name: accountCreateDto.name
      };
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send(accountCreateDto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body).toEqual(accountDto);
        });
    });

    it('should add the account to the database', async () => {
      const { accessToken, user } = await signUp(app);

      const dto: AccountCreateDto = {
        code: 'code',
        name: 'name'
      };
      const account: Account = {
        id: expect.any(String),
        code: dto.code,
        name: dto.name,
        createUser: user,
        updateUser: user,
        createDate: expect.any(Date),
        updateDate: expect.any(Date)
      };
      await request(app.getHttpServer())
        .post('/api/accounts')
        .send(dto)
        .set('Authorization', `Bearer ${accessToken}`);

      const [actual] = await acctRepo.find({
        relations: { createUser: true, updateUser: true }
      });
      expect(actual).toEqual(account);
    });
  });

  describe('GET /api/accounts', () => {
    it('should require an access token', async () => {
      await request(app.getHttpServer())
        .get('/api/accounts')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return OK status', async () => {
      const { accessToken } = await signUp(app);

      await request(app.getHttpServer())
        .get('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });

    it('should return a list of all account DTOs', async () => {
      const { accessToken, user } = await signUp(app);
      const n = 3;

      for (let i = 0; i < n; i++) {
        const account: Partial<Account> = {
          code: `code${i}`,
          name: `name${i}`,
          createUser: user,
          updateUser: user
        };
        await acctRepo.save(account);
      }
      await request(app.getHttpServer())
        .get('/api/accounts')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body.length).toEqual(n);
        });
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should require an access token', async () => {
      const { user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await acctRepo.save(account);

      await request(app.getHttpServer())
        .get(`/api/accounts/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return OK status', async () => {
      const { accessToken, user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await acctRepo.save(account);

      await request(app.getHttpServer())
        .get(`/api/accounts/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });

    it('should return NOT FOUND status if id does not exist', async () => {
      const { accessToken, user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await acctRepo.save(account);

      let id2: string;
      while (!id2 || id2 === id) id2 = randomUUID();

      await request(app.getHttpServer())
        .get(`/api/accounts/${id2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return an account DTO if it exists', async () => {
      const { accessToken, user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, code, name } = await acctRepo.save(account);
      const dto: AccountDto = { id, code, name };

      await request(app.getHttpServer())
        .get(`/api/accounts/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body).toEqual(dto);
        });
    });
  });

  describe('PATCH /api/accounts/:id', () => {
    it('should require an access token', async () => {
      const { user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await acctRepo.save(account);
      const newName = `${name}1`;

      await request(app.getHttpServer())
        .patch(`/api/accounts/${id}`)
        .send({ name: newName })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return OK status', async () => {
      const { accessToken, user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await acctRepo.save(account);
      const newName = `${name}1`;

      await request(app.getHttpServer())
        .patch(`/api/accounts/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: newName })
        .expect(HttpStatus.OK);
    });

    it('should update the database record', async () => {
      const { accessToken, user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await acctRepo.save(account);
      const newName = `${name}1`;

      await request(app.getHttpServer())
        .patch(`/api/accounts/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: newName });

      const { name: actual } = await acctRepo.findOneBy({ id });
      expect(actual).toEqual(newName);
    });

    it('should update the updateUser field', async () => {
      const { user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await acctRepo.save(account);
      const newName = `${name}1`;

      const {
        accessToken,
        user: { id: updateUserId }
      } = await signUp(app, {
        username: `${user.username}1`,
        email: `1${user.username}`
      });

      await request(app.getHttpServer())
        .patch(`/api/accounts/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: newName });

      const {
        updateUser: { id: actual }
      } = await acctRepo.findOne({
        where: { id },
        relations: { updateUser: true }
      });
      expect(actual).toEqual(updateUserId);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should require an access token', async () => {
      const { user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await acctRepo.save(account);

      await request(app.getHttpServer())
        .delete(`/api/accounts/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return NO CONTENT status', async () => {
      const { accessToken, user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await acctRepo.save(account);

      await request(app.getHttpServer())
        .delete(`/api/accounts/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('it should remove the account record from the database', async () => {
      const { accessToken, user } = await signUp(app);

      const account: Partial<Account> = {
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await acctRepo.save(account);

      await request(app.getHttpServer())
        .delete(`/api/accounts/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const actual = await acctRepo.findOneBy({ id });
      expect(actual).toBeNull();
    });
  });
});
