import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { UserService } from './user.service';
import { User } from '../entity/user.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';

describe('UserService', () => {
  let svc: UserService;
  let repo: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        LogService,
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOneBy: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    svc = module.get<UserService>(UserService);
    repo = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create()', () => {
    it('should return the expected user', async () => {
      const user = new User();
      user.username = 'username';
      user.email = 'email';

      jest
        .spyOn(repo, 'save')
        .mockImplementation(async (x) => (x === user ? user : null));

      const actual = await svc.create(user);
      expect(actual).toEqual(user);
    });
  });

  describe('findAll()', () => {
    it('should return a list of users', async () => {
      const user = new User();
      user.username = 'username';
      user.email = 'email';

      const users = [user, user];
      jest.spyOn(repo, 'find').mockResolvedValue(users);

      const actual = await svc.findAll();
      expect(actual).toEqual(users);
    });

    it('should return an empty list if there are no users', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([]);
      const actual = await svc.findAll();
      expect(actual).toEqual([]);
    });
  });

  describe('findOneById()', () => {
    it('should return the expected user', async () => {
      const id = randomUUID();

      const user = new User();
      user.id = id;
      user.username = 'username';
      user.email = 'email';

      jest
        .spyOn(repo, 'findOneBy')
        .mockImplementation(async ({ id: x }: any) => (x === id ? user : null));

      const actual = await svc.findOneById(id);
      expect(actual).toEqual(user);
    });

    it('should return null if id does not exist', async () => {
      jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
      const actual = await svc.findOneById(randomUUID());
      expect(actual).toBeNull();
    });
  });

  describe('findOneByUsername()', () => {
    it('should return the expected user', async () => {
      const username = 'username';

      const user = new User();
      user.id = randomUUID();
      user.username = username;
      user.email = 'email';

      jest
        .spyOn(repo, 'findOneBy')
        .mockImplementation(async ({ username: x }: any) =>
          x === username ? user : null
        );

      const actual = await svc.findOneByUsername(username);
      expect(actual).toEqual(user);
    });

    it('should return null if username does not exist', async () => {
      jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
      const actual = await svc.findOneByUsername('username');
      expect(actual).toBeNull();
    });
  });

  describe('update()', () => {
    it('should call repo.update with expected arguments', async () => {
      const id = randomUUID();
      const updates: Partial<User> = { username: 'username' };
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
