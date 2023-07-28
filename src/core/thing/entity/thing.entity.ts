import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Base } from 'src/shared/entity/base.entity';
import { IsNotEmpty } from 'class-validator';

/**
 * Represents a thing
 */
@Entity()
export class Thing extends Base {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @IsNotEmpty()
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;
}
