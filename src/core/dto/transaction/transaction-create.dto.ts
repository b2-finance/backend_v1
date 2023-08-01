import { PickType } from '@nestjs/mapped-types';
import { ArrayNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Transaction } from '../../entity/transaction.entity';
import { TransactionLineCreateDto } from './line/transaction-line-create.dto';

/**
 * Contains required attributes for a new transaction
 */
export class TransactionCreateDto extends PickType(Transaction, [
  'date',
  'memo'
] as const) {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TransactionLineCreateDto)
  lines: TransactionLineCreateDto[];
}
