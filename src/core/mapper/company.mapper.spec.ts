import { Test, TestingModule } from '@nestjs/testing';
import { CompanyMapper } from './company.mapper';
import { randomUUID } from 'crypto';
import { Company } from '../entity/company.entity';
import { CompanyDto } from '../dto/company.dto';
import { CompanyCreateDto } from '../dto/company-create.dto';
import { CompanyUpdateDto } from '../dto/company-update.dto';
import { UserService } from '../service/user.service';
import { User } from '../entity/user.entity';

describe('CompanyMapper', () => {
  let userSvc: UserService;
  let map: CompanyMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyMapper,
        {
          provide: UserService,
          useValue: { findOneById: jest.fn() }
        }
      ]
    }).compile();

    userSvc = module.get<UserService>(UserService);
    map = module.get<CompanyMapper>(CompanyMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('companyToDto()', () => {
    it('should convert a company to company DTO', () => {
      const company: Company = {
        id: randomUUID(),
        name: 'name',
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date()
      };
      const dto: CompanyDto = {
        id: company.id,
        name: company.name
      };
      const actual = map.companyToDto(company);
      expect(actual).toEqual(dto);
    });
  });

  describe('createToCompany()', () => {
    it('should convert a company-create DTO to company', async () => {
      const user = new User();
      user.id = randomUUID();

      const dto: CompanyCreateDto = { name: 'name' };

      const company = new Company();
      company.name = dto.name;
      company.createUser = user;
      company.updateUser = user;

      jest
        .spyOn(userSvc, 'findOneById')
        .mockImplementation(async (x) => (x === user.id ? user : null));

      const actual = await map.createToCompany(user.id, dto);
      expect(actual).toEqual(company);
    });
  });

  describe('updateToCompany()', () => {
    it('should convert a company-update DTO to company', async () => {
      const user = new User();
      user.id = randomUUID();

      const dto: CompanyUpdateDto = { name: 'name' };

      const company = new Company();
      company.name = dto.name;
      company.updateUser = user;

      jest
        .spyOn(userSvc, 'findOneById')
        .mockImplementation(async (x) => (x === user.id ? user : null));

      const actual = await map.updateToCompany(user.id, dto);
      expect(actual).toEqual(company);
    });
  });
});
