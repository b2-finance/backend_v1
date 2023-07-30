import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserHistory } from './user-history.entity';
import { IsNotEmpty } from 'class-validator';
import { TransactionLine } from './transaction-line.entity';

/**
 * Represents a general ledger transaction
 */
@Entity()
export class Transaction extends UserHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column()
  date: Date;

  @Column({ nullable: true })
  memo?: string;

  @OneToMany(() => TransactionLine, (line) => line.transaction, {
    cascade: true
  })
  lines: TransactionLine[];
}
