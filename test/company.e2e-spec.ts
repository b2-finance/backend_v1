import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app/app.module';
import { LogService } from 'src/log/log.service';
import { CompanyService } from 'src/core/service/company.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Company } from 'src/core/entity/company.entity';
import { CompanyDto } from 'src/core/dto/company.dto';
import { CompanyCreateDto } from 'src/core/dto/company-create.dto';
import { User } from 'src/core/entity/user.entity';
import { randomUUID } from 'crypto';
import { signUp } from './test-utils';

describe('CompanyController (e2e)', () => {
  let app: INestApplication;
  let compRepo: Repository<Company>;
  let userRepo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        LogService,
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useClass: Repository<Company>
        },
        {
          provide: getRepositoryToken(User),
          useClass: Repository<User>
        }
      ]
    }).compile();

    app = module.createNestApplication();
    compRepo = module.get<Repository<Company>>(getRepositoryToken(Company));
    userRepo = module.get<Repository<User>>(getRepositoryToken(User));
    await app.init();
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await compRepo.query('DELETE FROM db_company');
    await userRepo.query('DELETE FROM db_user');
    await app.close();
  });

  describe('POST /api/companies', () => {
    it('should require an access token', async () => {
      const dto: CompanyCreateDto = { name: 'name' };
      await request(app.getHttpServer())
        .post('/api/companies')
        .send(dto)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return CREATED status', async () => {
      const { accessToken } = await signUp(app);
      const dto: CompanyCreateDto = { name: 'name' };

      await request(app.getHttpServer())
        .post('/api/companies')
        .send(dto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.CREATED);
    });

    it('should return the created company DTO', async () => {
      const { accessToken } = await signUp(app);
      const companyCreateDto: CompanyCreateDto = { name: 'name' };

      const companyDto: CompanyDto = {
        id: expect.any(String),
        name: companyCreateDto.name
      };
      await request(app.getHttpServer())
        .post('/api/companies')
        .send(companyCreateDto)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body).toEqual(companyDto);
        });
    });

    it('should add the company to the database', async () => {
      const { accessToken, user } = await signUp(app);
      const dto: CompanyCreateDto = { name: 'name' };

      const company: Company = {
        id: expect.any(String),
        name: dto.name,
        createUser: user,
        updateUser: user,
        createDate: expect.any(Date),
        updateDate: expect.any(Date)
      };
      await request(app.getHttpServer())
        .post('/api/companies')
        .send(dto)
        .set('Authorization', `Bearer ${accessToken}`);

      const [actual] = await compRepo.find({
        relations: { createUser: true, updateUser: true }
      });
      expect(actual).toEqual(company);
    });
  });

  describe('GET /api/companies', () => {
    it('should require an access token', async () => {
      await request(app.getHttpServer())
        .get('/api/companies')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return OK status', async () => {
      const { accessToken } = await signUp(app);

      await request(app.getHttpServer())
        .get('/api/companies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });

    it('should return a list of all company DTOs', async () => {
      const { accessToken, user } = await signUp(app);
      const n = 3;

      for (let i = 0; i < n; i++) {
        const company: Partial<Company> = {
          name: `name${i}`,
          createUser: user,
          updateUser: user
        };
        await compRepo.save(company);
      }
      await request(app.getHttpServer())
        .get('/api/companies')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body.length).toEqual(n);
        });
    });
  });

  describe('GET /api/companies/:id', () => {
    it('should require an access token', async () => {
      const { user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await compRepo.save(company);

      await request(app.getHttpServer())
        .get(`/api/companies/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return OK status', async () => {
      const { accessToken, user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await compRepo.save(company);

      await request(app.getHttpServer())
        .get(`/api/companies/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);
    });

    it('should return NOT FOUND status if id does not exist', async () => {
      const { accessToken, user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await compRepo.save(company);

      let id2: string;
      while (!id2 || id2 === id) id2 = randomUUID();

      await request(app.getHttpServer())
        .get(`/api/companies/${id2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('should return a company DTO if it exists', async () => {
      const { accessToken, user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await compRepo.save(company);
      const dto: CompanyDto = { id, name };

      await request(app.getHttpServer())
        .get(`/api/companies/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(({ body }) => {
          expect(body).toEqual(dto);
        });
    });
  });

  describe('PATCH /api/companies/:id', () => {
    it('should require an access token', async () => {
      const { user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await compRepo.save(company);
      const newName = `${name}1`;

      await request(app.getHttpServer())
        .patch(`/api/companies/${id}`)
        .send({ name: newName })
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return OK status', async () => {
      const { accessToken, user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await compRepo.save(company);
      const newName = `${name}1`;

      await request(app.getHttpServer())
        .patch(`/api/companies/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: newName })
        .expect(HttpStatus.OK);
    });

    it('should update the database record', async () => {
      const { accessToken, user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await compRepo.save(company);
      const newName = `${name}1`;

      await request(app.getHttpServer())
        .patch(`/api/companies/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: newName });

      const { name: actual } = await compRepo.findOneBy({ id });
      expect(actual).toEqual(newName);
    });

    it('should update the updateUser field', async () => {
      const { user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id, name } = await compRepo.save(company);
      const newName = `${name}1`;

      const {
        accessToken,
        user: { id: updateUserId }
      } = await signUp(app, {
        username: `${user.username}1`,
        email: `1${user.username}`
      });

      await request(app.getHttpServer())
        .patch(`/api/companies/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: newName });

      const {
        updateUser: { id: actual }
      } = await compRepo.findOne({
        where: { id },
        relations: { updateUser: true }
      });
      expect(actual).toEqual(updateUserId);
    });
  });

  describe('DELETE /api/companies/:id', () => {
    it('should require an access token', async () => {
      const { user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await compRepo.save(company);

      await request(app.getHttpServer())
        .delete(`/api/companies/${id}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('should return NO CONTENT status', async () => {
      const { accessToken, user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await compRepo.save(company);

      await request(app.getHttpServer())
        .delete(`/api/companies/${id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should remove the company record from the database', async () => {
      const { accessToken, user } = await signUp(app);

      const company: Partial<Company> = {
        name: 'name',
        createUser: user,
        updateUser: user
      };
      const { id } = await compRepo.save(company);

      await request(app.getHttpServer())
        .delete(`/api/companies/${id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      const actual = await compRepo.findOneBy({ id });
      expect(actual).toBeNull();
    });
  });
});
