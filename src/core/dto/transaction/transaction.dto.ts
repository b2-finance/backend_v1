import { PickType } from '@nestjs/mapped-types';
import { Transaction } from '../../entity/transaction.entity';

/**
 * Represents a general ledger transaction
 */
export class TransactionDto extends PickType(Transaction, [
  'id',
  'date',
  'memo'
] as const) {}
