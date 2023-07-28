import { Injectable } from '@nestjs/common';
import { Thing } from '../entity/thing.entity';
import { ThingDto } from '../dto/thing.dto';
import { ThingCreateDto } from '../dto/thing-create.dto';

/**
 * Maps between thing entities and DTOs
 */
@Injectable()
export class ThingMapper {
  /**
   * Converts a thing entity to a thing DTO
   *
   * @param thing A thing
   * @returns A thing DTO
   */
  thingToDto(thing: Thing): ThingDto {
    return {
      id: thing.id,
      name: thing.name,
      description: thing.description
    };
  }

  /**
   * Converts a thing-create DTO to a thing
   *
   * @param dto A thing-create DTO
   * @returns A thing
   */
  createToThing(dto: ThingCreateDto): Thing {
    const thing = new Thing();
    thing.name = dto.name;
    thing.description = dto.description;
    return thing;
  }
}
