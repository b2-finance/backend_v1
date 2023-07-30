import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../entity/transaction.entity';
import { TransactionLine } from '../entity/transaction-line.entity';
import { LogService } from 'src/log/log.service';

/**
 * Specifies which relations to load with the returned entities of a transaction search
 */
export interface FindTransactionOptions {
  createUser?: boolean;
  lines?: boolean;
}

/**
 * Specifies properties on which to filter the results of a transaction-line search
 */
export interface FindTransactionLineFilters {
  accountId?: string;
  companyId?: string;
}

/**
 * Provides services for manipulating transaction entities
 */
@Injectable()
export class TransactionService {
  constructor(
    @InjectRepository(Transaction)
    private readonly TRAN_REPO: Repository<Transaction>,
    @InjectRepository(TransactionLine)
    private readonly LINE_REPO: Repository<TransactionLine>,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(TransactionService.name);
  }

  /**
   * Creates a new transaction. The sum of all transaction-line amounts must equal zero
   *
   * @param transaction A transaction
   * @returns The created transaction
   */
  async create(transaction: Transaction): Promise<Transaction> {
    if (transaction.lines) this.verifyLineSum(transaction.lines);
    const result = await this.TRAN_REPO.save(transaction);
    return this.sortLines(result);
  }

  /**
   * Finds all transactions created by the identified user
   *
   * @param id A user id
   * @param options {@link FindTransactionOptions}
   * @returns A list of transactions
   */
  async findAllByCreatorId(
    id: string,
    options: FindTransactionOptions = {}
  ): Promise<Transaction[]> {
    const { createUser, lines } = options;

    return this.TRAN_REPO.find({
      where: { createUser: { id } },
      relations: {
        createUser,
        ...(lines && {
          lines: {
            account: true,
            company: true
          }
        })
      },
      ...(lines && { order: { lines: { lineId: 'ASC' } } })
    });
  }

  /**
   * Finds the identified transaction
   *
   * @param id A transaction id
   * @param options {@link FindTransactionOptions}
   * @returns The identified transaction, or null if it does not exist
   */
  async findOneById(
    id: string,
    options: FindTransactionOptions = {}
  ): Promise<Transaction> {
    const { createUser, lines } = options;

    return this.TRAN_REPO.findOne({
      where: { id },
      relations: {
        createUser,
        ...(lines && {
          lines: {
            account: true,
            company: true
          }
        })
      },
      ...(lines && { order: { lines: { lineId: 'ASC' } } })
    });
  }

  /**
   * Finds all transaction-lines created by the identified user
   *
   * @param id A user id
   * @param filters {@link FindTransactionLineFilters}
   * @returns A list of transaction-lines, sorted by date descending
   */
  async findAllLinesByCreatorId(
    id: string,
    filters: FindTransactionLineFilters = {}
  ): Promise<TransactionLine[]> {
    const { accountId, companyId } = filters;

    return this.LINE_REPO.find({
      where: {
        transaction: { createUser: { id } },
        ...(accountId && { account: { id: accountId } }),
        ...(companyId && { company: { id: companyId } })
      },
      relations: {
        transaction: { createUser: false },
        account: { createUser: false },
        company: { createUser: false }
      },
      order: { transaction: { date: 'DESC' } }
    });
  }

  /**
   * Updates the identified transaction
   *
   * @param id A transaction id
   * @param updates Updates to the transaction
   */
  async update(id: string, updates: Partial<Transaction>): Promise<void> {
    const { id: _id, lines, ...other } = updates;

    if (lines) {
      this.verifyLineSum(lines);

      // Update does not cascade, so manually deleting and replacing the lines
      await this.TRAN_REPO.manager.transaction(async (entityManager) => {
        const transaction = await entityManager.findOneBy(Transaction, { id });

        // Delete existing lines by orphaning them
        transaction.lines = [];
        await entityManager.save(transaction);

        transaction.lines = lines;
        await entityManager.save(transaction);
        await entityManager.update(Transaction, id, other);
      });
    } else {
      await this.TRAN_REPO.update(id, other);
    }
  }

  /**
   * Deletes the identified transaction
   *
   * @param id A transaction id
   */
  async delete(id: string): Promise<void> {
    await this.TRAN_REPO.delete(id);
  }

  /**
   * Verifies that the sum of all transaction-line amounts equals zero. If not, throws a BadRequestException
   *
   * @param lines A list of transaction-lines
   */
  private verifyLineSum(lines: TransactionLine[]): void {
    const sum = lines.reduce((prev, curr) => prev + curr.amount, 0);

    if (sum !== 0) {
      const message = `The sum of all transaction-line amounts must equal zero, but is ${sum}.`;
      this.LOGGER.error(message);
      throw new BadRequestException(message);
    }
  }

  /**
   * Sorts the lines of the given transaction by line-id ascending
   *
   * @param transaction A transaction
   * @returns The given transaction, with its lines sorted
   */
  private sortLines(transaction: Transaction): Transaction {
    transaction?.lines?.sort((a, b) => {
      if (a.lineId < b.lineId) return -1;
      if (a.lineId > b.lineId) return 1;
      else return 0;
    });
    return transaction;
  }
}
