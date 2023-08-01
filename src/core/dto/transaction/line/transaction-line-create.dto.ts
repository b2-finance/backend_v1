import { PickType } from '@nestjs/mapped-types';
import { IsOptional, IsUUID } from 'class-validator';
import { TransactionLine } from '../../../entity/transaction-line.entity';

/**
 * Contains required attributes for a new transaction-line
 */
export class TransactionLineCreateDto extends PickType(TransactionLine, [
  'amount',
  'memo'
] as const) {
  @IsUUID()
  accountId: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
