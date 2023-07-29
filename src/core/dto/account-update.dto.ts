import { PartialType, PickType } from '@nestjs/mapped-types';
import { Account } from '../entity/account.entity';

/**
 * Contains updated attributes for an existing account
 */
export class AccountUpdateDto extends PartialType(
  class AccountUpdate extends PickType(Account, ['code', 'name'] as const) {}
) {}
