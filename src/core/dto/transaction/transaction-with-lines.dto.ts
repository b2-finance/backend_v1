import { PickType } from '@nestjs/mapped-types';
import { Transaction } from '../../entity/transaction.entity';
import { TransactionLineDto } from './line/transaction-line.dto';

/**
 * Represents a general ledger transaction, with its corresponding lines
 */
export class TransactionWithLinesDto extends PickType(Transaction, [
  'id',
  'date',
  'memo'
] as const) {
  lines: TransactionLineDto[];
}
