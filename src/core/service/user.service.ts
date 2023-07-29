import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entity/user.entity';
import { LogService } from 'src/log/log.service';

/**
 * Provides services for manipulating user entities
 */
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly REPO: Repository<User>,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(UserService.name);
  }

  /**
   * Creates a new user
   *
   * @param user A user
   * @returns The created user
   */
  async create(user: User): Promise<User> {
    return this.REPO.save(user);
  }

  /**
   * Finds all users
   *
   * @returns A list of users
   */
  async findAll(): Promise<User[]> {
    return this.REPO.find();
  }

  /**
   * Finds the identified user
   *
   * @param id A user id
   * @returns The identified user, or null if it does not exist
   */
  async findOneById(id: string): Promise<User> {
    return this.REPO.findOneBy({ id });
  }

  /**
   * Finds the user with the given username
   *
   * @param username A username
   * @returns The user with the given username, or null if it does not exist
   */
  async findOneByUsername(username: string): Promise<User> {
    return this.REPO.findOneBy({ username });
  }

  /**
   * Updates the identified user
   *
   * @param id A user id
   * @param updates Updates to the user
   */
  async update(id: string, updates: Partial<User>): Promise<void> {
    await this.REPO.update(id, updates);
  }

  /**
   * Deletes the identified user
   *
   * @param id A user id
   */
  async delete(id: string): Promise<void> {
    await this.REPO.delete(id);
  }
}
