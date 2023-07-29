import { PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

/**
 * Represents an application user
 */
export class UserDto extends PickType(User, [
  'id',
  'username',
  'email'
] as const) {}
