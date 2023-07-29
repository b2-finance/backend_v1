import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../entity/account.entity';
import { LogService } from 'src/log/log.service';

/**
 * Provides services for manipulating account entities
 */
@Injectable()
export class AccountService {
  constructor(
    @InjectRepository(Account) private readonly REPO: Repository<Account>,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(AccountService.name);
  }

  /**
   * Creates a new account
   *
   * @param account An account
   * @returns The created account
   */
  async create(account: Account): Promise<Account> {
    return this.REPO.save(account);
  }

  /**
   * Finds all accounts created by the identified user
   *
   * @param id A user id
   * @returns A list of accounts
   */
  async findAllByCreatorId(id: string): Promise<Account[]> {
    return this.REPO.findBy({ createUser: { id } });
  }

  /**
   * Finds the identified account
   *
   * @param id An account id
   * @returns The identified account, or null if it does not exist
   */
  async findOneById(id: string): Promise<Account> {
    return this.REPO.findOneBy({ id });
  }

  /**
   * Updates the identified account
   *
   * @param id An account id
   * @param updates Updates to the account
   */
  async update(id: string, updates: Partial<Account>): Promise<void> {
    await this.REPO.update(id, updates);
  }

  /**
   * Deletes the identified account
   *
   * @param id An account id
   */
  async delete(id: string): Promise<void> {
    await this.REPO.delete(id);
  }
}
