import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import {
  FindTransactionLineFilters,
  FindTransactionOptions,
  TransactionService
} from './transaction.service';
import { Transaction } from '../entity/transaction.entity';
import { TransactionLine } from '../entity/transaction-line.entity';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from '../entity/account.entity';
import { Company } from '../entity/company.entity';
import { User } from '../entity/user.entity';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';

describe('TransactionService', () => {
  let svc: TransactionService;
  let tranRepo: Repository<Transaction>;
  let lineRepo: Repository<TransactionLine>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConfigService,
        LogService,
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: {
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: getRepositoryToken(TransactionLine),
          useValue: {
            find: jest.fn()
          }
        }
      ]
    }).compile();

    svc = module.get<TransactionService>(TransactionService);
    tranRepo = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction)
    );
    lineRepo = module.get<Repository<TransactionLine>>(
      getRepositoryToken(TransactionLine)
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create()', () => {
    it('should return the expected transaction', async () => {
      const transaction = new Transaction();
      transaction.id = randomUUID();
      transaction.date = new Date();
      transaction.memo = 'memo';
      transaction.lines = [];

      for (let lineId = 3; lineId >= 0; lineId--) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account: new Account(),
          company: new Company(),
          amount: Math.pow(-1, lineId + 1),
          memo: 'memo',
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      jest
        .spyOn(tranRepo, 'save')
        .mockImplementation(async (x) =>
          x === transaction ? transaction : null
        );

      const actual = await svc.create(transaction);
      expect(actual).toEqual(transaction);
    });

    it('should sort all transaction-lines by line-id ascending', async () => {
      const transaction = new Transaction();
      transaction.lines = [];

      for (let lineId = 3; lineId >= 0; lineId--) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account: new Account(),
          company: new Company(),
          amount: Math.pow(-1, lineId + 1),
          memo: 'memo',
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      jest.spyOn(tranRepo, 'save').mockResolvedValue(transaction);
      const actual = await svc.create(transaction);
      let inOrder = true;

      for (let i = 1; i < actual.lines.length; i++) {
        if (actual.lines[i].lineId - actual.lines[i - 1].lineId !== 1) {
          inOrder = false;
          break;
        }
      }
      expect(inOrder).toEqual(true);
    });

    it('should not throw BadRequestException if transaction-line sum === 0', () => {
      const transaction = new Transaction();
      transaction.lines = [];

      for (let lineId = 0; lineId < 4; lineId++) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account: new Account(),
          company: new Company(),
          amount: Math.pow(-1, lineId + 1),
          memo: 'memo',
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      expect(async () => await svc.create(transaction)).not.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException if transaction-line sum !== 0', () => {
      const transaction = new Transaction();
      transaction.lines = [];

      for (let lineId = 0; lineId < 4; lineId++) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account: new Account(),
          company: new Company(),
          amount: 1,
          memo: 'memo',
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      expect(async () => await svc.create(transaction)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('findAllByCreatorId()', () => {
    it('should return the expected number of transactions', async () => {
      const user = new User();
      user.id = randomUUID();

      const transactions: Transaction[] = [];

      // Every even indexed transaction will be created by this user
      for (let i = 0; i < 8; i++) {
        const transaction: Transaction = {
          id: randomUUID(),
          date: new Date(),
          memo: `memo${i}`,
          lines: [],
          createUser: i % 2 === 0 ? user : new User(),
          updateUser: i % 2 === 0 ? user : new User(),
          createDate: new Date(),
          updateDate: new Date()
        };
        for (let lineId = 0; lineId < 2; lineId++) {
          transaction.lines.push({
            id: randomUUID(),
            lineId,
            transaction,
            account: new Account(),
            company: new Company(),
            amount: Math.pow(-1, lineId + 1),
            memo: `memo${i}${lineId}`,
            createDate: new Date(),
            updateDate: new Date()
          });
        }
        transactions.push(transaction);
      }
      jest
        .spyOn(tranRepo, 'find')
        .mockImplementation(async (x: any) =>
          x.where?.createUser?.id === user.id
            ? transactions.filter((t) => t.createUser.id === user.id)
            : []
        );

      const actual = await svc.findAllByCreatorId(user.id);
      expect(actual.length).toEqual(transactions.length / 2);
    });

    it('should sort all transaction-lines by line-id ascending', async () => {
      const user = new User();
      user.id = randomUUID();

      const transactions: Transaction[] = [];

      for (let i = 0; i < 3; i++) {
        const transaction: Transaction = {
          id: randomUUID(),
          date: new Date(),
          memo: `memo${i}`,
          lines: [],
          createUser: user,
          updateUser: user,
          createDate: new Date(),
          updateDate: new Date()
        };
        for (let lineId = 3; lineId >= 0; lineId--) {
          transaction.lines.push({
            id: randomUUID(),
            lineId,
            transaction,
            account: new Account(),
            company: new Company(),
            amount: Math.pow(-1, lineId + 1),
            memo: `memo${i}${lineId}`,
            createDate: new Date(),
            updateDate: new Date()
          });
        }
        transactions.push(transaction);
      }
      jest.spyOn(tranRepo, 'find').mockImplementation(async (x: any) => {
        const result =
          x.where?.createUser?.id === user.id
            ? transactions.filter((t) => t.createUser.id === user.id)
            : [];

        if (x.order?.lines?.lineId === 'ASC') {
          result.forEach((t) =>
            t.lines.sort((a, b) => {
              if (a.lineId < b.lineId) return -1;
              if (a.lineId > b.lineId) return 1;
              return 0;
            })
          );
        }
        return result;
      });

      const actual = await svc.findAllByCreatorId(user.id, { lines: true });

      for (const t of actual) {
        let inOrder = true;

        for (let i = 1; i < t.lines.length; i++) {
          if (t.lines[i].lineId - t.lines[i - 1].lineId !== 1) {
            inOrder = false;
            break;
          }
        }
        expect(inOrder).toEqual(true);
      }
    });

    it.each([
      [randomUUID(), {}],
      [randomUUID(), { createUser: true }],
      [randomUUID(), { lines: true }],
      [randomUUID(), { createUser: true, lines: true }]
    ])(
      'should load the expected optional relations for each transaction',
      async (userId: string, options: FindTransactionOptions) => {
        const user = new User();
        user.id = userId;

        const transactions: Transaction[] = [];

        // Every even indexed transaction will be created by this user
        for (let i = 0; i < 8; i++) {
          const transaction: Transaction = {
            id: randomUUID(),
            date: new Date(),
            memo: `memo${i}`,
            lines: [],
            createUser: i % 2 === 0 ? user : new User(),
            updateUser: i % 2 === 0 ? user : new User(),
            createDate: new Date(),
            updateDate: new Date()
          };
          for (let lineId = 0; lineId < 2; lineId++) {
            transaction.lines.push({
              id: randomUUID(),
              lineId,
              transaction,
              account: new Account(),
              company: new Company(),
              amount: Math.pow(-1, lineId + 1),
              memo: `memo${i}${lineId}`,
              createDate: new Date(),
              updateDate: new Date()
            });
          }
          transactions.push(transaction);
        }
        jest.spyOn(tranRepo, 'find').mockImplementation(async (x: any) => {
          const result =
            x.where?.createUser?.id === user.id
              ? transactions.filter((t) => t.createUser.id === user.id)
              : [];

          if (!x.relations?.createUser)
            result.forEach((t) => (t.createUser = null));

          if (!x.relations?.lines) result.forEach((t) => (t.lines = null));

          return result;
        });

        const actual = await svc.findAllByCreatorId(userId, options);

        // Fail if we find a transaction with a non-null createUser field
        if (!options.createUser) {
          const hasCreateUser = actual.find((t) => t.createUser);
          expect(hasCreateUser).toBeUndefined();
        }

        // Fail if we find a transaction with a non-null lines field
        if (!options.lines) {
          const hasLines = actual.find((t) => t.lines);
          expect(hasLines).toBeUndefined();
        }

        // Fail if we find a transaction with a line that has a null account and/or company field
        if (options.lines) {
          const hasNullLineRelations = actual.find((t) =>
            t.lines.find((l) => !l.account || !l.company)
          );
          expect(hasNullLineRelations).toBeUndefined();
        }
      }
    );
  });

  describe('findOneById()', () => {
    it('should return the expected transaction', async () => {
      const transaction: Transaction = {
        id: randomUUID(),
        date: new Date(),
        memo: 'memo',
        lines: [],
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date()
      };
      for (let lineId = 0; lineId < 2; lineId++) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account: new Account(),
          company: new Company(),
          amount: Math.pow(-1, lineId + 1),
          memo: `memo${lineId}`,
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      jest
        .spyOn(tranRepo, 'findOne')
        .mockImplementation(async (x: any) =>
          x.where?.id === transaction.id ? transaction : null
        );

      const actual = await svc.findOneById(transaction.id);
      expect(actual).toEqual(transaction);
    });

    it('should sort all transaction-lines by line-id ascending', async () => {
      const transaction: Transaction = {
        id: randomUUID(),
        date: new Date(),
        memo: 'memo',
        lines: [],
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date()
      };
      for (let lineId = 3; lineId >= 0; lineId--) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account: new Account(),
          company: new Company(),
          amount: Math.pow(-1, lineId + 1),
          memo: `memo${lineId}`,
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      jest.spyOn(tranRepo, 'findOne').mockImplementation(async (x: any) => {
        const result = x.where?.id === transaction.id ? transaction : null;

        if (x.order?.lines?.lineId === 'ASC') {
          result.lines.sort((a, b) => {
            if (a.lineId < b.lineId) return -1;
            if (a.lineId > b.lineId) return 1;
            return 0;
          });
        }
        return result;
      });

      const actual = await svc.findOneById(transaction.id, { lines: true });
      let inOrder = true;

      for (let i = 1; i < actual.lines.length; i++) {
        if (actual.lines[i].lineId - actual.lines[i - 1].lineId !== 1) {
          inOrder = false;
          break;
        }
      }
      expect(inOrder).toEqual(true);
    });

    it.each([
      [randomUUID(), {}],
      [randomUUID(), { createUser: true }],
      [randomUUID(), { lines: true }],
      [randomUUID(), { createUser: true, lines: true }]
    ])(
      'should load the expected optional relations',
      async (id: string, options: FindTransactionOptions) => {
        const transaction: Transaction = {
          id,
          date: new Date(),
          memo: 'memo',
          lines: [],
          createUser: new User(),
          updateUser: new User(),
          createDate: new Date(),
          updateDate: new Date()
        };
        for (let lineId = 0; lineId < 2; lineId++) {
          transaction.lines.push({
            id: randomUUID(),
            lineId,
            transaction,
            account: new Account(),
            company: new Company(),
            amount: Math.pow(-1, lineId + 1),
            memo: `memo${lineId}`,
            createDate: new Date(),
            updateDate: new Date()
          });
        }
        jest.spyOn(tranRepo, 'findOne').mockImplementation(async (x: any) => {
          const result = x.where?.id === transaction.id ? transaction : null;

          if (!x.relations?.createUser) result.createUser = null;
          if (!x.relations?.lines) result.lines = null;

          return result;
        });

        const actual = await svc.findOneById(id, options);

        if (!options.createUser) expect(actual.createUser).toBeNull();
        if (!options.lines) expect(actual.lines).toBeNull();
      }
    );

    it('should return null if id does not exist', async () => {
      jest.spyOn(tranRepo, 'findOne').mockResolvedValue(null);
      const actual = await svc.findOneById(randomUUID());
      expect(actual).toBeNull();
    });
  });

  describe('findAllLinesByCreatorId()', () => {
    it.each([
      // There are a total of 4 transactions with 12 lines each

      // Half the transactions are created by the user
      [randomUUID(), {}, 4 * (1 / 2) * 12],

      // 1/2 of the lines on all transactions have this account id
      [randomUUID(), { accountId: randomUUID() }, 4 * (1 / 2) * 12 * (1 / 2)],

      // 1/3 of the lines on all transactions have this company id
      [randomUUID(), { companyId: randomUUID() }, 4 * (1 / 2) * 12 * (1 / 3)],

      // 1/2 of 1/3 of the lines have both this account id and company id
      [
        randomUUID(),
        { accountId: randomUUID(), companyId: randomUUID() },
        4 * (1 / 2) * 12 * (1 / 2) * (1 / 3)
      ]
    ])(
      'should return the expected number of transaction-lines',
      async (
        userId: string,
        filters: FindTransactionLineFilters,
        expected: number
      ) => {
        const user = new User();
        user.id = userId;

        const transactions: Transaction[] = [];

        const account = new Account();
        account.id = filters.accountId;

        const company = new Company();
        company.id = filters.companyId;

        // Every even indexed transaction will be created by this user
        for (let i = 0; i < 4; i++) {
          const transaction: Transaction = {
            id: randomUUID(),
            date: new Date(),
            memo: `memo${i}`,
            lines: [],
            createUser: i % 2 === 0 ? user : new User(),
            updateUser: i % 2 === 0 ? user : new User(),
            createDate: new Date(),
            updateDate: new Date()
          };
          // Every other line will have the specified account id
          // Every 3rd line will have the specified company id
          for (let lineId = 0; lineId < 12; lineId++) {
            transaction.lines.push({
              id: randomUUID(),
              lineId,
              transaction,
              account: lineId % 2 === 0 ? account : new Account(),
              company: lineId % 3 === 0 ? company : new Company(),
              amount: Math.pow(-1, lineId + 1),
              memo: `memo${i}${lineId}`,
              createDate: new Date(),
              updateDate: new Date()
            });
          }
          transactions.push(transaction);
        }
        jest.spyOn(lineRepo, 'find').mockImplementation(async (x: any) => {
          let result =
            x.where?.transaction?.createUser?.id === user.id
              ? transactions
                  .filter((t) => t.createUser.id === user.id)
                  .map((t) => t.lines)
                  .flat()
              : [];

          if (x.where?.account)
            result = result.filter((l) => l.account.id === x.where.account.id);

          if (x.where?.company)
            result = result.filter((l) => l.company.id === x.where.company.id);

          return result;
        });

        const actual = await svc.findAllLinesByCreatorId(userId, filters);
        expect(actual.length).toEqual(expected);
      }
    );

    it('should sort the transaction-lines by transaction date descending', async () => {
      const user = new User();
      user.id = randomUUID();

      const transactions: Transaction[] = [];

      // Every even indexed transaction will be created by this user
      for (let i = 0; i < 8; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        const transaction: Transaction = {
          id: randomUUID(),
          date,
          memo: `memo${i}`,
          lines: [],
          createUser: i % 2 === 0 ? user : new User(),
          updateUser: i % 2 === 0 ? user : new User(),
          createDate: new Date(),
          updateDate: new Date()
        };
        for (let lineId = 0; lineId < 2; lineId++) {
          transaction.lines.push({
            id: randomUUID(),
            lineId,
            transaction,
            account: new Account(),
            company: new Company(),
            amount: Math.pow(-1, lineId + 1),
            memo: `memo${i}${lineId}`,
            createDate: new Date(),
            updateDate: new Date()
          });
        }
        transactions.push(transaction);
      }
      jest.spyOn(lineRepo, 'find').mockImplementation(async (x: any) => {
        const result =
          x.where?.transaction?.createUser?.id === user.id
            ? transactions
                .filter((t) => t.createUser.id === user.id)
                .map((t) => t.lines)
                .flat()
            : [];

        if (x.order?.transaction?.date === 'DESC') {
          result.sort((a, b) => {
            if (a.transaction.date > b.transaction.date) return -1;
            if (a.transaction.date < b.transaction.date) return 1;
            return 0;
          });
        }
        return result;
      });

      const actual = await svc.findAllLinesByCreatorId(user.id);
      let inOrder = true;

      for (let i = 1; i < actual.length; i++) {
        if (actual[i].transaction.date > actual[i - 1].transaction.date) {
          inOrder = false;
          break;
        }
      }
      expect(inOrder).toEqual(true);
    });
  });

  describe('update()', () => {
    it('should call repo.update with expected arguments', async () => {
      const id = randomUUID();
      const updates: Partial<Transaction> = { memo: 'memo' };
      await svc.update(id, updates);
      expect(tranRepo.update).toHaveBeenCalledWith(id, updates);
    });

    it('should throw BadRequestException if transaction-line sum !== 0', async () => {
      const transaction: Transaction = {
        id: randomUUID(),
        date: new Date(),
        memo: 'memo',
        lines: [],
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date()
      };
      for (let lineId = 0; lineId < 2; lineId++) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account: new Account(),
          company: new Company(),
          amount: 1,
          memo: `memo${lineId}`,
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      expect(
        async () =>
          await svc.update(transaction.id, { lines: transaction.lines })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete()', () => {
    it('should call repo.delete with expected arguments', async () => {
      const id = randomUUID();
      await svc.delete(id);
      expect(tranRepo.delete).toHaveBeenCalledWith(id);
    });
  });
});
