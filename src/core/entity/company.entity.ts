import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserHistory } from './user-history.entity';
import { IsNotEmpty } from 'class-validator';

/**
 * Represents a customer and/or vendor entity
 */
@Entity()
@Unique('UQ__COMPANY__NAME__CREATE_USER', ['name', 'createUser'])
export class Company extends UserHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column()
  name: string;
}
