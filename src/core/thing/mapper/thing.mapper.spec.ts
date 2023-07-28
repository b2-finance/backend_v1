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
    it('should convert a Thing to ThingDto', () => {
      const thing: Thing = {
        id: randomUUID(),
        name: 'a',
        description: 'b',
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
    it('should convert a ThingCreateDto to Thing', () => {
      const dto: ThingCreateDto = {
        name: 'a',
        description: 'b'
      };
      const thing = new Thing();
      thing.name = dto.name;
      thing.description = dto.description;

      const actual = map.createToThing(dto);
      expect(actual).toEqual(thing);
    });
  });
});
