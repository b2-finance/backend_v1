import { PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

/**
 * Contains required attributes for a new user
 */
export class UserCreateDto extends PickType(User, [
  'username',
  'email'
] as const) {}
