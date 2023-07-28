import { PickType } from '@nestjs/mapped-types';
import { Thing } from '../entity/thing.entity';

/**
 * Contains required attributes for a new thing
 */
export class ThingCreateDto extends PickType(Thing, [
  'name',
  'description'
] as const) {}
