import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { ThingService } from './thing.service';
import { Thing } from '../entity/thing.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';

describe('ThingService', () => {
  let svc: ThingService;
  let repo: Repository<Thing>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        LogService,
        ThingService,
        {
          provide: getRepositoryToken(Thing),
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

    svc = module.get<ThingService>(ThingService);
    repo = module.get<Repository<Thing>>(getRepositoryToken(Thing));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create()', () => {
    it('should return the expected thing', async () => {
      const thing = new Thing();
      thing.name = 'name';
      thing.description = 'description';

      jest
        .spyOn(repo, 'save')
        .mockImplementation(async (x) => (x === thing ? thing : null));

      const actual = await svc.create(thing);
      expect(actual).toEqual(thing);
    });
  });

  describe('findAll()', () => {
    it('should return a list of things', async () => {
      const thing = new Thing();
      thing.name = 'name';
      thing.description = 'description';

      const things = [thing, thing];
      jest.spyOn(repo, 'find').mockResolvedValue(things);

      const actual = await svc.findAll();
      expect(actual).toEqual(things);
    });

    it('should return an empty list if there are no things', async () => {
      jest.spyOn(repo, 'find').mockResolvedValue([]);
      const actual = await svc.findAll();
      expect(actual).toEqual([]);
    });
  });

  describe('findOneById()', () => {
    it('should return the expected thing', async () => {
      const id = randomUUID();

      const thing = new Thing();
      thing.id = id;
      thing.name = 'name';
      thing.description = 'description';

      jest
        .spyOn(repo, 'findOneBy')
        .mockImplementation(async ({ id: x }: any) =>
          x === id ? thing : null
        );

      const actual = await svc.findOneById(id);
      expect(actual).toEqual(thing);
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
      const updates: Partial<Thing> = { name: 'name' };
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
