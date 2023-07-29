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
    it('should call repo.save with correct arguments', async () => {
      const user = new User();
      await svc.create(user);
      expect(repo.save).toHaveBeenCalledWith(user);
    });

    it('should return a user', async () => {
      const user = new User();
      jest.spyOn(repo, 'save').mockResolvedValue(user);
      const actual = await svc.create(user);
      expect(actual).toEqual(user);
    });
  });

  describe('findAll()', () => {
    it('should call repo.find', async () => {
      await svc.findAll();
      expect(repo.find).toHaveBeenCalled();
    });

    it('should return a list of users', async () => {
      const user = new User();
      const users = [user, user];
      jest.spyOn(repo, 'find').mockResolvedValue(users);
      const actual = await svc.findAll();
      expect(actual).toEqual(users);
    });
  });

  describe('findOneById()', () => {
    it('should call repo.findOneBy with correct arguments', async () => {
      const id = randomUUID();
      await svc.findOneById(id);
      expect(repo.findOneBy).toHaveBeenCalledWith({ id });
    });

    it('should return a user', async () => {
      const user = new User();
      jest.spyOn(repo, 'findOneBy').mockResolvedValue(user);
      const actual = await svc.findOneById(randomUUID());
      expect(actual).toEqual(user);
    });

    it('should return null if id does not exist', async () => {
      jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
      const actual = await svc.findOneById(randomUUID());
      expect(actual).toBeNull();
    });
  });

  describe('findOneByUsername()', () => {
    it('should call repo.findOneBy with correct arguments', async () => {
      const username = 'username';
      await svc.findOneByUsername(username);
      expect(repo.findOneBy).toHaveBeenCalledWith({ username });
    });

    it('should return a user', async () => {
      const user = new User();
      jest.spyOn(repo, 'findOneBy').mockResolvedValue(user);
      const actual = await svc.findOneByUsername('username');
      expect(actual).toEqual(user);
    });

    it('should return null if username does not exist', async () => {
      jest.spyOn(repo, 'findOneBy').mockResolvedValue(null);
      const actual = await svc.findOneByUsername('username');
      expect(actual).toBeNull();
    });
  });

  describe('update()', () => {
    it('should call repo.update with correct arguments', async () => {
      const id = randomUUID();
      const updates: Partial<User> = { username: 'username' };
      await svc.update(id, updates);
      expect(repo.update).toHaveBeenCalledWith(id, updates);
    });
  });

  describe('delete()', () => {
    it('should call repo.delete with correct arguments', async () => {
      const id = randomUUID();
      await svc.delete(id);
      expect(repo.delete).toHaveBeenCalledWith(id);
    });
  });
});
