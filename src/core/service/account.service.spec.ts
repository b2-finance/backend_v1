import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { AccountService } from './account.service';
import { Account } from '../entity/account.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { User } from '../entity/user.entity';

describe('AccountService', () => {
  let svc: AccountService;
  let repo: Repository<Account>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        LogService,
        AccountService,
        {
          provide: getRepositoryToken(Account),
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

    svc = module.get<AccountService>(AccountService);
    repo = module.get<Repository<Account>>(getRepositoryToken(Account));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create()', () => {
    it('should return the expected account', async () => {
      const account = new Account();
      account.code = 'code';
      account.name = 'name';

      jest
        .spyOn(repo, 'save')
        .mockImplementation(async (x) => (x === account ? account : null));

      const actual = await svc.create(account);
      expect(actual).toEqual(account);
    });
  });

  describe('findAllByCreatorId()', () => {
    it('should return a list of accounts', async () => {
      const user = new User();
      user.id = randomUUID();

      const account = new Account();
      account.code = 'code';
      account.name = 'name';
      account.createUser = user;

      const accounts = [account, account];
      jest
        .spyOn(repo, 'findBy')
        .mockImplementation(async ({ createUser: { id: x } }: any) =>
          x === user.id ? accounts : null
        );

      const actual = await svc.findAllByCreatorId(user.id);
      expect(actual).toEqual(accounts);
    });

    it('should return an empty list if there are no accounts', async () => {
      jest.spyOn(repo, 'findBy').mockResolvedValue([]);
      const actual = await svc.findAllByCreatorId(randomUUID());
      expect(actual).toEqual([]);
    });
  });

  describe('findOneById()', () => {
    it('should return the expected account', async () => {
      const id = randomUUID();

      const account = new Account();
      account.id = id;
      account.code = 'code';
      account.name = 'name';

      jest
        .spyOn(repo, 'findOneBy')
        .mockImplementation(async ({ id: x }: any) =>
          x === id ? account : null
        );

      const actual = await svc.findOneById(id);
      expect(actual).toEqual(account);
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
      const updates: Partial<Account> = { name: 'name' };
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
