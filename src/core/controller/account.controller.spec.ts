import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { JwtService } from '@nestjs/jwt';
import { AccountController } from './account.controller';
import { AccountService } from '../service/account.service';
import { AccountMapper } from '../mapper/account.mapper';
import { Account } from '../entity/account.entity';
import { AccountDto } from '../dto/account.dto';
import { AccountCreateDto } from '../dto/account-create.dto';
import { AccountUpdateDto } from '../dto/account-update.dto';
import { User } from '../entity/user.entity';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AuthRequest } from 'src/auth/auth-request.dto';

describe('AccountController', () => {
  let con: AccountController;
  let svc: AccountService;
  let map: AccountMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AccountController],
      providers: [
        ConfigService,
        LogService,
        JwtService,
        {
          provide: AccountService,
          useValue: {
            create: jest.fn(),
            findAllByCreatorId: jest.fn(),
            findOneById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: AccountMapper,
          useValue: {
            accountToDto: jest.fn(),
            createToAccount: jest.fn(),
            updateToAccount: jest.fn()
          }
        }
      ]
    }).compile();

    con = module.get<AccountController>(AccountController);
    svc = module.get<AccountService>(AccountService);
    map = module.get<AccountMapper>(AccountMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOne()', () => {
    it('should return the expected account DTO', async () => {
      const req = { user: { sub: randomUUID() } };
      const user = new User();
      user.id = req.user.sub;

      const accountCreateDto: AccountCreateDto = {
        code: 'code',
        name: 'name'
      };
      const account: Account = {
        id: randomUUID(),
        code: accountCreateDto.code,
        name: accountCreateDto.name,
        createUser: user,
        updateUser: user,
        createDate: new Date(),
        updateDate: new Date()
      };
      const accountDto: AccountDto = {
        id: account.id,
        code: account.code,
        name: account.name
      };
      jest
        .spyOn(map, 'createToAccount')
        .mockImplementation(async (x, y) =>
          x === user.id && y === accountCreateDto ? account : null
        );
      jest
        .spyOn(svc, 'create')
        .mockImplementation(async (x) => (x === account ? account : null));
      jest
        .spyOn(map, 'accountToDto')
        .mockImplementation((x) => (x === account ? accountDto : null));

      const actual = await con.createOne(req as AuthRequest, accountCreateDto);
      expect(actual).toEqual(accountDto);
    });
  });

  describe('getAllByCreatorId()', () => {
    it('should return a list of account DTOs', async () => {
      const req = { user: { sub: randomUUID() } };
      const user = new User();
      user.id = req.user.sub;

      const account: Account = {
        id: randomUUID(),
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user,
        createDate: new Date(),
        updateDate: new Date()
      };
      const accountDto: AccountDto = {
        id: account.id,
        code: account.code,
        name: account.name
      };
      jest
        .spyOn(svc, 'findAllByCreatorId')
        .mockImplementation(async (x) =>
          x === user.id ? [account, account] : []
        );
      jest
        .spyOn(map, 'accountToDto')
        .mockImplementation((x) => (x === account ? accountDto : null));

      const actual = await con.getAllByCreatorId(req as AuthRequest);
      expect(actual).toEqual([accountDto, accountDto]);
    });
  });

  describe('getOne()', () => {
    it('should return the expected account DTO', async () => {
      const id = randomUUID();
      const account: Account = {
        id,
        code: 'code',
        name: 'name',
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date()
      };
      const accountDto: AccountDto = {
        id,
        code: account.code,
        name: account.name
      };
      jest
        .spyOn(svc, 'findOneById')
        .mockImplementation(async (x) => (x === id ? account : null));
      jest
        .spyOn(map, 'accountToDto')
        .mockImplementation((x) => (x === account ? accountDto : null));

      const actual = await con.getOne(id);
      expect(actual).toEqual(accountDto);
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
      const updates: AccountUpdateDto = { name: 'name' };

      const account = new Account();
      account.name = updates.name;
      account.updateUser = new User();

      jest
        .spyOn(map, 'updateToAccount')
        .mockImplementation(async (x, y) =>
          x === req.user.sub && y === updates ? account : null
        );

      await con.updateOne(req as AuthRequest, id, updates);
      expect(svc.update).toHaveBeenCalledWith(id, account);
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
