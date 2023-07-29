import { Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base } from 'src/shared/entity/base.entity';
import { User } from './user.entity';

/**
 * Contains information about the user edit history of an object
 */
@Entity()
export abstract class UserHistory extends Base {
  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK__USER_HISTORY__CREATE_USER' })
  createUser: User;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK__USER_HISTORY__UPDATE_USER' })
  updateUser: User;
}
