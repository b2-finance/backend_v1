import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { JwtService } from '@nestjs/jwt';
import { ThingController } from './thing.controller';
import { ThingService } from '../service/thing.service';
import { ThingMapper } from '../mapper/thing.mapper';
import { Thing } from '../entity/thing.entity';
import { ThingDto } from '../dto/thing.dto';
import { ThingCreateDto } from '../dto/thing-create.dto';
import { ThingUpdateDto } from '../dto/thing-update.dto';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';

describe('ThingController', () => {
  let con: ThingController;
  let svc: ThingService;
  let map: ThingMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ThingController],
      providers: [
        ConfigService,
        LogService,
        JwtService,
        {
          provide: ThingService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOneById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: ThingMapper,
          useValue: {
            thingToDto: jest.fn(),
            createToThing: jest.fn()
          }
        }
      ]
    }).compile();

    con = module.get<ThingController>(ThingController);
    svc = module.get<ThingService>(ThingService);
    map = module.get<ThingMapper>(ThingMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOne()', () => {
    it('should return the expected thing DTO', async () => {
      const thingCreateDto: ThingCreateDto = {
        name: 'name',
        description: 'description'
      };
      const thing: Thing = {
        id: randomUUID(),
        name: thingCreateDto.name,
        description: thingCreateDto.description,
        createDate: new Date(),
        updateDate: new Date()
      };
      const thingDto: ThingDto = {
        id: thing.id,
        name: thing.name,
        description: thing.description
      };
      jest
        .spyOn(map, 'createToThing')
        .mockImplementation((x) => (x === thingCreateDto ? thing : null));
      jest
        .spyOn(svc, 'create')
        .mockImplementation(async (x) => (x === thing ? thing : null));
      jest
        .spyOn(map, 'thingToDto')
        .mockImplementation((x) => (x === thing ? thingDto : null));

      const actual = await con.createOne(thingCreateDto);
      expect(actual).toEqual(thingDto);
    });
  });

  describe('getAll()', () => {
    it('should return a list of thing DTOs', async () => {
      const thing: Thing = {
        id: randomUUID(),
        name: 'name',
        description: 'description',
        createDate: new Date(),
        updateDate: new Date()
      };
      const thingDto: ThingDto = {
        id: thing.id,
        name: thing.name,
        description: thing.description
      };
      jest.spyOn(svc, 'findAll').mockResolvedValue([thing, thing]);
      jest
        .spyOn(map, 'thingToDto')
        .mockImplementation((x) => (x === thing ? thingDto : null));

      const actual = await con.getAll();
      expect(actual).toEqual([thingDto, thingDto]);
    });
  });

  describe('getOne()', () => {
    it('should return the expected thing DTO', async () => {
      const id = randomUUID();
      const thing: Thing = {
        id,
        name: 'name',
        description: 'description',
        createDate: new Date(),
        updateDate: new Date()
      };
      const thingDto: ThingDto = {
        id,
        name: thing.name,
        description: thing.description
      };
      jest
        .spyOn(svc, 'findOneById')
        .mockImplementation(async (x) => (x === id ? thing : null));
      jest
        .spyOn(map, 'thingToDto')
        .mockImplementation((x) => (x === thing ? thingDto : null));

      const actual = await con.getOne(id);
      expect(actual).toEqual(thingDto);
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
      const id = randomUUID();
      const updates: ThingUpdateDto = { name: 'name' };
      await con.updateOne(id, updates);
      expect(svc.update).toHaveBeenCalledWith(id, updates);
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
