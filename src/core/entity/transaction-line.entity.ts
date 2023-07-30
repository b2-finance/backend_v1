import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique
} from 'typeorm';
import { Base } from 'src/shared/entity/base.entity';
import { IsNotEmpty } from 'class-validator';
import { Transaction } from './transaction.entity';
import { Account } from './account.entity';
import { Company } from './company.entity';

/**
 * Represents a single line of a general ledger transaction
 */
@Entity()
@Unique('UQ__TRANSACTION_LINE__LINE_ID__TRANSACTION', ['lineId', 'transaction'])
export class TransactionLine extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column()
  lineId: number;

  @IsNotEmpty()
  @ManyToOne(() => Transaction, (transaction) => transaction.lines, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete'
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK__TRANSACTION_LINE__TRANSACTION' })
  transaction: Transaction;

  @IsNotEmpty()
  @ManyToOne(() => Account, {
    onDelete: 'RESTRICT'
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK__TRANSACTION_LINE__ACCOUNT' })
  account: Account;

  @ManyToOne(() => Company, {
    onDelete: 'RESTRICT',
    nullable: true
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK__TRANSACTION_LINE__COMPANY' })
  company?: Company;

  @IsNotEmpty()
  @Column()
  amount: number;

  @Column({ nullable: true })
  memo?: string;
}
