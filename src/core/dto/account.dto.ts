import { PickType } from '@nestjs/mapped-types';
import { Account } from '../entity/account.entity';

/**
 * Represents a general ledger account
 */
export class AccountDto extends PickType(Account, [
  'id',
  'code',
  'name'
] as const) {}
