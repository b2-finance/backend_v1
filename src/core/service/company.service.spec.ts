import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { CompanyService } from './company.service';
import { Company } from '../entity/company.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { User } from '../entity/user.entity';

describe('CompanyService', () => {
  let svc: CompanyService;
  let repo: Repository<Company>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        LogService,
        CompanyService,
        {
          provide: getRepositoryToken(Company),
          useValue: {
            save: jest.fn(),
            findBy: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    svc = module.get<CompanyService>(CompanyService);
    repo = module.get<Repository<Company>>(getRepositoryToken(Company));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create()', () => {
    it('should return the expected company', async () => {
      const company = new Company();
      company.name = 'name';

      jest
        .spyOn(repo, 'save')
        .mockImplementation(async (x) => (x === company ? company : null));

      const actual = await svc.create(company);
      expect(actual).toEqual(company);
    });
  });

  describe('findAllByCreatorId()', () => {
    it('should return a list of companies', async () => {
      const user = new User();
      user.id = randomUUID();

      const company = new Company();
      company.name = 'name';
      company.createUser = user;

      const companies = [company, company];
      jest
        .spyOn(repo, 'findBy')
        .mockImplementation(async ({ createUser: { id: x } }: any) =>
          x === user.id ? companies : null
        );

      const actual = await svc.findAllByCreatorId(user.id);
      expect(actual).toEqual(companies);
    });

    it('should return an empty list if there are no companies', async () => {
      jest.spyOn(repo, 'findBy').mockResolvedValue([]);
      const actual = await svc.findAllByCreatorId(randomUUID());
      expect(actual).toEqual([]);
    });
  });

  describe('findOneById()', () => {
    it('should return the expected company', async () => {
      const id = randomUUID();

      const company = new Company();
      company.id = id;
      company.name = 'name';

      jest
        .spyOn(repo, 'findOneBy')
        .mockImplementation(async ({ id: x }: any) =>
          x === id ? company : null
        );

      const actual = await svc.findOneById(id);
      expect(actual).toEqual(company);
    });

    it('should return null if id does not exist', async () => {
      jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
      const actual = await svc.findOneById(randomUUID());
      expect(actual).toBeNull();
    });
  });

  describe('update()', () => {
    it('should call repo.update with expected arguments', async () => {
      const id = randomUUID();
      const updates: Partial<Company> = { name: 'name' };
      await svc.update(id, updates);
      expect(repo.update).toHaveBeenCalledWith(id, updates);
    });
  });

  describe('delete()', () => {
    it('should call repo.delete with expected arguments', async () => {
      const id = randomUUID();
      await svc.delete(id);
      expect(repo.delete).toHaveBeenCalledWith(id);
    });
  });
});
