import { PartialType, PickType } from '@nestjs/mapped-types';
import { ArrayNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Transaction } from '../../entity/transaction.entity';
import { TransactionLineCreateDto } from './line/transaction-line-create.dto';

/**
 * Contains updated attributes for an existing transaction
 */
export class TransactionUpdateDto extends PartialType(
  class TransactionUpdate extends PickType(Transaction, [
    'date',
    'memo'
  ] as const) {}
) {
  @IsOptional()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => TransactionLineCreateDto)
  lines?: TransactionLineCreateDto[];
}
