import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserHistory } from './user-history.entity';
import { IsNotEmpty } from 'class-validator';

/**
 * Represents a general ledger account
 */
@Entity()
@Unique('UQ__ACCOUNT__CODE__CREATE_USER', ['code', 'createUser'])
@Unique('UQ__ACCOUNT__NAME__CREATE_USER', ['name', 'createUser'])
export class Account extends UserHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column()
  code: string;

  @IsNotEmpty()
  @Column()
  name: string;
}
