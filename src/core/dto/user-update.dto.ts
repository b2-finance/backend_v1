import { PartialType, PickType } from '@nestjs/mapped-types';
import { User } from '../entity/user.entity';

/**
 * Contains updated attributes for an existing user
 */
export class UserUpdateDto extends PartialType(
  class UserUpdate extends PickType(User, ['username', 'email'] as const) {}
) {}
