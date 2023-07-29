import { Test, TestingModule } from '@nestjs/testing';
import { AccountMapper } from './account.mapper';
import { randomUUID } from 'crypto';
import { Account } from '../entity/account.entity';
import { AccountDto } from '../dto/account.dto';
import { AccountCreateDto } from '../dto/account-create.dto';
import { AccountUpdateDto } from '../dto/account-update.dto';
import { UserService } from '../service/user.service';
import { User } from '../entity/user.entity';

describe('AccountMapper', () => {
  let userSvc: UserService;
  let map: AccountMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccountMapper,
        {
          provide: UserService,
          useValue: { findOneById: jest.fn() }
        }
      ]
    }).compile();

    userSvc = module.get<UserService>(UserService);
    map = module.get<AccountMapper>(AccountMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('accountToDto()', () => {
    it('should convert an account to account DTO', () => {
      const account: Account = {
        id: randomUUID(),
        code: 'code',
        name: 'name',
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date()
      };
      const dto: AccountDto = {
        id: account.id,
        code: account.code,
        name: account.name
      };
      const actual = map.accountToDto(account);
      expect(actual).toEqual(dto);
    });
  });

  describe('createToAccount()', () => {
    it('should convert an account-create DTO to account', async () => {
      const user = new User();
      user.id = randomUUID();

      const dto: AccountCreateDto = { code: 'code', name: 'name' };

      const account = new Account();
      account.code = dto.code;
      account.name = dto.name;
      account.createUser = user;
      account.updateUser = user;

      jest
        .spyOn(userSvc, 'findOneById')
        .mockImplementation(async (x) => (x === user.id ? user : null));

      const actual = await map.createToAccount(user.id, dto);
      expect(actual).toEqual(account);
    });
  });

  describe('updateToAccount()', () => {
    it('should convert an account-update DTO to account', async () => {
      const user = new User();
      user.id = randomUUID();

      const dto: AccountUpdateDto = { code: 'code', name: 'name' };

      const account = new Account();
      account.code = dto.code;
      account.name = dto.name;
      account.updateUser = user;

      jest
        .spyOn(userSvc, 'findOneById')
        .mockImplementation(async (x) => (x === user.id ? user : null));

      const actual = await map.updateToAccount(user.id, dto);
      expect(actual).toEqual(account);
    });
  });
});
