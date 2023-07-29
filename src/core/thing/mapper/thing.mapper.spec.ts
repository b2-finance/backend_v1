import { Test, TestingModule } from '@nestjs/testing';
import { ThingMapper } from './thing.mapper';
import { randomUUID } from 'crypto';
import { Thing } from '../entity/thing.entity';
import { ThingDto } from '../dto/thing.dto';
import { ThingCreateDto } from '../dto/thing-create.dto';

describe('ThingMapper', () => {
  let map: ThingMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ThingMapper]
    }).compile();

    map = module.get<ThingMapper>(ThingMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('thingToDto()', () => {
    it('should convert a thing to thing DTO', () => {
      const thing: Thing = {
        id: randomUUID(),
        name: 'name',
        description: 'description',
        createDate: new Date(),
        updateDate: new Date()
      };
      const dto: ThingDto = {
        id: thing.id,
        name: thing.name,
        description: thing.description
      };
      const actual = map.thingToDto(thing);
      expect(actual).toEqual(dto);
    });
  });

  describe('createToThing()', () => {
    it('should convert a thing-create DTO to thing', () => {
      const dto: ThingCreateDto = {
        name: 'name',
        description: 'description'
      };
      const thing = new Thing();
      thing.name = dto.name;
      thing.description = dto.description;

      const actual = map.createToThing(dto);
      expect(actual).toEqual(thing);
    });
  });
});
