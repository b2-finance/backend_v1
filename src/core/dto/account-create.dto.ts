import { PickType } from '@nestjs/mapped-types';
import { Account } from '../entity/account.entity';

/**
 * Contains required attributes for a new account
 */
export class AccountCreateDto extends PickType(Account, [
  'code',
  'name'
] as const) {}
