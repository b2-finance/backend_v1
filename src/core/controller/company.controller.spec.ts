import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { JwtService } from '@nestjs/jwt';
import { CompanyController } from './company.controller';
import { CompanyService } from '../service/company.service';
import { CompanyMapper } from '../mapper/company.mapper';
import { Company } from '../entity/company.entity';
import { CompanyDto } from '../dto/company.dto';
import { CompanyCreateDto } from '../dto/company-create.dto';
import { CompanyUpdateDto } from '../dto/company-update.dto';
import { User } from '../entity/user.entity';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AuthRequest } from 'src/auth/auth-request.dto';

describe('CompanyController', () => {
  let con: CompanyController;
  let svc: CompanyService;
  let map: CompanyMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyController],
      providers: [
        ConfigService,
        LogService,
        JwtService,
        {
          provide: CompanyService,
          useValue: {
            create: jest.fn(),
            findAllByCreatorId: jest.fn(),
            findOneById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: CompanyMapper,
          useValue: {
            companyToDto: jest.fn(),
            createToCompany: jest.fn(),
            updateToCompany: jest.fn()
          }
        }
      ]
    }).compile();

    con = module.get<CompanyController>(CompanyController);
    svc = module.get<CompanyService>(CompanyService);
    map = module.get<CompanyMapper>(CompanyMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOne()', () => {
    it('should return the expected company DTO', async () => {
      const req = { user: { sub: randomUUID() } };
      const user = new User();
      user.id = req.user.sub;

      const companyCreateDto: CompanyCreateDto = { name: 'name' };
      const company: Company = {
        id: randomUUID(),
        name: companyCreateDto.name,
        createUser: user,
        updateUser: user,
        createDate: new Date(),
        updateDate: new Date()
      };
      const companyDto: CompanyDto = {
        id: company.id,
        name: company.name
      };
      jest
        .spyOn(map, 'createToCompany')
        .mockImplementation(async (x, y) =>
          x === user.id && y === companyCreateDto ? company : null
        );
      jest
        .spyOn(svc, 'create')
        .mockImplementation(async (x) => (x === company ? company : null));
      jest
        .spyOn(map, 'companyToDto')
        .mockImplementation((x) => (x === company ? companyDto : null));

      const actual = await con.createOne(req as AuthRequest, companyCreateDto);
      expect(actual).toEqual(companyDto);
    });
  });

  describe('getAllByCreatorId()', () => {
    it('should return a list of company DTOs', async () => {
      const req = { user: { sub: randomUUID() } };
      const user = new User();
      user.id = req.user.sub;

      const company: Company = {
        id: randomUUID(),
        name: 'name',
        createUser: user,
        updateUser: user,
        createDate: new Date(),
        updateDate: new Date()
      };
      const companyDto: CompanyDto = {
        id: company.id,
        name: company.name
      };
      jest
        .spyOn(svc, 'findAllByCreatorId')
        .mockImplementation(async (x) =>
          x === user.id ? [company, company] : []
        );
      jest
        .spyOn(map, 'companyToDto')
        .mockImplementation((x) => (x === company ? companyDto : null));

      const actual = await con.getAllByCreatorId(req as AuthRequest);
      expect(actual).toEqual([companyDto, companyDto]);
    });
  });

  describe('getOne()', () => {
    it('should return the expected company DTO', async () => {
      const id = randomUUID();
      const company: Company = {
        id,
        name: 'name',
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date()
      };
      const companyDto: CompanyDto = {
        id,
        name: company.name
      };
      jest
        .spyOn(svc, 'findOneById')
        .mockImplementation(async (x) => (x === id ? company : null));
      jest
        .spyOn(map, 'companyToDto')
        .mockImplementation((x) => (x === company ? companyDto : null));

      const actual = await con.getOne(id);
      expect(actual).toEqual(companyDto);
    });

    it('should throw NotFoundException if id does not exist', async () => {
      jest.spyOn(svc, 'findOneById').mockResolvedValue(null);
      expect(async () => await con.getOne(randomUUID())).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateOne()', () => {
    it('should call svc.update with expected arguments', async () => {
      const req = { user: { sub: randomUUID() } };

      const id = randomUUID();
      const updates: CompanyUpdateDto = { name: 'name' };

      const company = new Company();
      company.name = updates.name;
      company.updateUser = new User();

      jest
        .spyOn(map, 'updateToCompany')
        .mockImplementation(async (x, y) =>
          x === req.user.sub && y === updates ? company : null
        );

      await con.updateOne(req as AuthRequest, id, updates);
      expect(svc.update).toHaveBeenCalledWith(id, company);
    });
  });

  describe('deleteOne()', () => {
    it('should call svc.delete with expected arguments', async () => {
      const id = randomUUID();
      await con.deleteOne(id);
      expect(svc.delete).toHaveBeenCalledWith(id);
    });
  });
});
