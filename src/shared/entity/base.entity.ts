import { CreateDateColumn, Entity, UpdateDateColumn } from 'typeorm';

/**
 * A base entity for all entities
 */
@Entity()
export abstract class Base {
  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;
}
