import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app/app.module';
import { LogService } from 'src/log/log.service';
import { UserService } from 'src/core/service/user.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/core/entity/user.entity';
import { UserDto } from 'src/core/dto/user.dto';
import { UserCreateDto } from 'src/core/dto/user-create.dto';
import { randomUUID } from 'crypto';
import { getAccessToken, signUp } from './test-utils';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        LogService,
        UserService,
        {
          provide: getRepositoryToken(User),
          useClass: Repository<User>
        }
      ]
    }).compile();

    app = module.createNestApplication();
    repo = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await repo.query('DELETE FROM db_user');
    await app.close();
  });

  describe('POST /api/users', () => {
    it('should return CREATED status', async () => {
      const dto: UserCreateDto = {
        username: 'username',
        email: 'username@email.com'
      };
      await request(app.getHttpServer())
        .post('/api/users')
        .send(dto)
        .set('Authorization', `Bearer ${await getAccessToken()}`)
        .expect(HttpStatus.CREATED);
    });

    it('should return the created user', async () => {
      const sub = randomUUID();
      const username = 'username';
      const accessToken = await getAccessToken({ sub, username });

      const userCreateDto: UserCreateDto = {
        username,
        email: 'username@email.com'
      };
      const userDto: UserDto = {
        id: sub,
        username,
        email: userCreateDto.email
      };
      await request(app.getHttpServer())
        .post('/api/users')
        .send(userCreateDto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body).toEqual(userDto);
        });
    });
  });

  describe('GET /api/users', () => {
    it('should return OK status', async () => {
      const accessToken = await getAccessToken();

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });

    it('should return a list of all users', async () => {
      const n = 5;
      let accessToken: string;

      for (let i = 0; i < n; i++) {
        const dto: UserCreateDto = {
          username: `username${i}`,
          email: `username${i}@email.com`
        };
        accessToken = (await signUp(app, dto)).accessToken;
      }
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body.length).toEqual(n);
        });
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return OK status', async () => {
      const {
        user: { id },
        accessToken
      } = await signUp(app);

      await request(app.getHttpServer())
        .get(`/api/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });

    it('should return NOT FOUND status if id does not exist', async () => {
      const {
        accessToken,
        user: { id }
      } = await signUp(app);

      let id2: string;
      while (!id2 || id2 === id) id2 = randomUUID();

      await request(app.getHttpServer())
        .get(`/api/users/${id2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return a user DTO if it exists', async () => {
      const {
        accessToken,
        user: { id, username, email }
      } = await signUp(app);

      await request(app.getHttpServer())
        .get(`/api/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body.id).toEqual(id);
          expect(body.username).toEqual(username);
          expect(body.email).toEqual(email);
        });
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('should return OK status', async () => {
      const {
        accessToken,
        user: { id, username }
      } = await signUp(app);
      const newUsername = `${username}1`;

      await request(app.getHttpServer())
        .patch(`/api/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: newUsername })
        .expect(HttpStatus.OK);
    });

    it('should update the database record', async () => {
      const {
        accessToken,
        user: { id, username }
      } = await signUp(app);
      const newUsername = `${username}1`;

      await request(app.getHttpServer())
        .patch(`/api/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ username: newUsername });

      const { username: actual } = await repo.findOneBy({ id });
      expect(actual).toEqual(newUsername);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should return NO CONTENT status', async () => {
      const {
        accessToken,
        user: { id }
      } = await signUp(app);

      await request(app.getHttpServer())
        .delete(`/api/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('it should remove the user record from the database', async () => {
      const {
        accessToken,
        user: { id }
      } = await signUp(app);

      await request(app.getHttpServer())
        .delete(`/api/users/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(await repo.findOneBy({ id })).toBeNull();
    });
  });
});
