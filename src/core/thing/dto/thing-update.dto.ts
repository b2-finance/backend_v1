import { PartialType, PickType } from '@nestjs/mapped-types';
import { Thing } from '../entity/thing.entity';

/**
 * Contains updated attributes for an existing thing
 */
export class ThingUpdateDto extends PartialType(
  class ThingUpdate extends PickType(Thing, ['name', 'description'] as const) {}
) {}
