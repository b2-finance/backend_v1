import { PickType } from '@nestjs/mapped-types';
import { IsOptional, IsUUID } from 'class-validator';
import { TransactionLine } from '../../../entity/transaction-line.entity';

/**
 * Represents a single line of a general ledger transaction
 */
export class TransactionLineDto extends PickType(TransactionLine, [
  'id',
  'lineId',
  'amount',
  'memo'
] as const) {
  @IsOptional()
  @IsUUID()
  transactionId?: string;

  @IsOptional()
  @IsUUID()
  accountId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;
}
