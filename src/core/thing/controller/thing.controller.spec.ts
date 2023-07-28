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
    it('should call svc.create with correct arguments', async () => {
      const thing = new Thing();
      jest.spyOn(map, 'createToThing').mockReturnValue(thing);
      await con.createOne(new ThingCreateDto());
      expect(svc.create).toHaveBeenCalledWith(thing);
    });

    it('should call map.thingToDto with correct arguments', async () => {
      const dto = new ThingCreateDto();
      const thing = new Thing();
      jest.spyOn(svc, 'create').mockResolvedValue(thing);
      await con.createOne(dto);
      expect(map.thingToDto).toHaveBeenCalledWith(thing);
    });

    it('should return a ThingDto', async () => {
      const dto = new ThingDto();
      jest.spyOn(map, 'thingToDto').mockReturnValue(dto);
      const actual = await con.createOne(new ThingCreateDto());
      expect(actual).toEqual(dto);
    });
  });

  describe('getAll()', () => {
    it('should call svc.findAll', async () => {
      await con.getAll();
      expect(svc.findAll).toHaveBeenCalled();
    });

    it('should call map.thingToDto with correct arguments', async () => {
      const thing = new Thing();
      jest.spyOn(svc, 'findAll').mockResolvedValue([thing]);
      await con.getAll();
      expect(map.thingToDto).toHaveBeenCalledWith(thing);
    });

    it('should call map.thingToDto the correct number of times', async () => {
      const thing = new Thing();
      const things = [thing, thing];
      jest.spyOn(svc, 'findAll').mockResolvedValue(things);
      await con.getAll();
      expect(map.thingToDto).toHaveBeenCalledTimes(things.length);
    });

    it('should return a list of ThingDtos', async () => {
      const thing = new Thing();
      const dto = new ThingDto();
      jest.spyOn(svc, 'findAll').mockResolvedValue([thing, thing]);
      jest.spyOn(map, 'thingToDto').mockReturnValue(dto);
      const actual = await con.getAll();
      expect(actual).toEqual([dto, dto]);
    });
  });

  describe('getOne()', () => {
    it('should call svc.findOneById with correct arguments', async () => {
      const id = randomUUID();
      jest.spyOn(svc, 'findOneById').mockResolvedValue(new Thing());
      await con.getOne(id);
      expect(svc.findOneById).toHaveBeenCalledWith(id);
    });

    it('should call map.thingToDto with correct arguments', async () => {
      const thing = new Thing();
      jest.spyOn(svc, 'findOneById').mockResolvedValue(thing);
      await con.getOne(randomUUID());
      expect(map.thingToDto).toHaveBeenCalledWith(thing);
    });

    it('should return a ThingDto', async () => {
      const thing = new Thing();
      const dto = new ThingDto();
      jest.spyOn(svc, 'findOneById').mockResolvedValue(thing);
      jest.spyOn(map, 'thingToDto').mockReturnValue(dto);
      const actual = await con.getOne(randomUUID());
      expect(actual).toEqual(dto);
    });

    it('should throw NotFoundException if id does not exist', async () => {
      jest.spyOn(svc, 'findOneById').mockResolvedValue(null);
      expect(async () => await con.getOne(randomUUID())).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateOne()', () => {
    it('should call svc.update with correct arguments', async () => {
      const id = randomUUID();
      const updates: ThingUpdateDto = { name: 'name' };
      await con.updateOne(id, updates);
      expect(svc.update).toHaveBeenCalledWith(id, updates);
    });
  });

  describe('deleteOne()', () => {
    it('should call svc.delete with correct arguments', async () => {
      const id = randomUUID();
      await con.deleteOne(id);
      expect(svc.delete).toHaveBeenCalledWith(id);
    });
  });
});
