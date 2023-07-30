import { Test, TestingModule } from '@nestjs/testing';
import { TransactionMapper } from './transaction.mapper';
import { Transaction } from '../entity/transaction.entity';
import { TransactionDto } from '../dto/transaction/transaction.dto';
import { TransactionWithLinesDto } from '../dto/transaction/transaction-with-lines.dto';
import { TransactionCreateDto } from '../dto/transaction/transaction-create.dto';
import { TransactionUpdateDto } from '../dto/transaction/transaction-update.dto';
import { TransactionLine } from '../entity/transaction-line.entity';
import { TransactionLineDto } from '../dto/transaction/line/transaction-line.dto';
import { UserService } from '../service/user.service';
import { User } from '../entity/user.entity';
import { AccountService } from '../service/account.service';
import { Account } from '../entity/account.entity';
import { CompanyService } from '../service/company.service';
import { Company } from '../entity/company.entity';
import { randomUUID } from 'crypto';

describe('TransactionMapper', () => {
  let userSvc: UserService;
  let acctSvc: AccountService;
  let compSvc: CompanyService;
  let map: TransactionMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionMapper,
        {
          provide: UserService,
          useValue: { findOneById: jest.fn() }
        },
        {
          provide: AccountService,
          useValue: { findOneById: jest.fn() }
        },
        {
          provide: CompanyService,
          useValue: { findOneById: jest.fn() }
        }
      ]
    }).compile();

    userSvc = module.get<UserService>(UserService);
    acctSvc = module.get<AccountService>(AccountService);
    compSvc = module.get<CompanyService>(CompanyService);
    map = module.get<TransactionMapper>(TransactionMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('transactionToDto()', () => {
    it('should convert a transaction to transaction DTO', () => {
      const transaction = new Transaction();
      transaction.id = randomUUID();
      transaction.date = new Date();
      transaction.memo = 'memo';

      const dto: TransactionDto = {
        id: transaction.id,
        date: transaction.date,
        memo: transaction.memo
      };
      const actual = map.transactionToDto(transaction);
      expect(actual).toEqual(dto);
    });
  });

  describe('transactionToTransactionWithLinesDto()', () => {
    it('should convert a transaction to transaction-with-lines DTO', () => {
      const transaction: Transaction = {
        id: randomUUID(),
        date: new Date(),
        memo: 'memo',
        createUser: new User(),
        updateUser: new User(),
        createDate: new Date(),
        updateDate: new Date(),
        lines: []
      };
      const account = new Account();
      account.id = randomUUID();

      const company = new Company();
      company.id = randomUUID();

      for (let lineId = 0; lineId < 4; lineId++) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account,
          company,
          amount: Math.pow(-1, lineId + 1),
          memo: 'memo',
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      const dto: TransactionWithLinesDto = {
        id: transaction.id,
        date: transaction.date,
        memo: transaction.memo,
        lines: transaction.lines.map((line, lineId) => ({
          id: line.id,
          lineId,
          accountId: account.id,
          companyId: company.id,
          amount: line.amount,
          memo: line.memo
        }))
      };
      const actual = map.transactionToTransactionWithLinesDto(transaction);
      expect(actual).toEqual(dto);
    });
  });

  describe('transactionLineToDto()', () => {
    it('should convert a transaction-line to transaction-line DTO (no transactionId)', () => {
      const transaction = new Transaction();
      transaction.id = randomUUID();

      const account = new Account();
      account.id = randomUUID();

      const company = new Account();
      company.id = randomUUID();

      const line = new TransactionLine();
      line.id = randomUUID();
      line.lineId = 1;
      line.transaction = transaction;
      line.account = account;
      line.company = company;
      line.amount = 123;
      line.memo = 'memo';

      const dto: TransactionLineDto = {
        id: line.id,
        lineId: line.lineId,
        accountId: line.account.id,
        companyId: line.company.id,
        amount: line.amount,
        memo: line.memo
      };
      const actual = map.transactionLineToDto(line);
      expect(actual).toEqual(dto);
    });

    it('should convert a transaction-line to transaction-line DTO (with transactionId)', () => {
      const transaction = new Transaction();
      transaction.id = randomUUID();

      const account = new Account();
      account.id = randomUUID();

      const company = new Account();
      company.id = randomUUID();

      const line = new TransactionLine();
      line.id = randomUUID();
      line.lineId = 1;
      line.transaction = transaction;
      line.account = account;
      line.company = company;
      line.amount = 123;
      line.memo = 'memo';

      const dto: TransactionLineDto = {
        id: line.id,
        lineId: line.lineId,
        transactionId: line.transaction.id,
        accountId: line.account.id,
        companyId: line.company.id,
        amount: line.amount,
        memo: line.memo
      };
      const actual = map.transactionLineToDto(line, true);
      expect(actual).toEqual(dto);
    });
  });

  describe('createToTransaction()', () => {
    it('should convert a transaction-create DTO to transaction', async () => {
      const dto: TransactionCreateDto = {
        date: new Date(),
        memo: 'memo',
        lines: []
      };
      const user = new User();
      user.id = randomUUID();

      const account = new Account();
      account.id = randomUUID();

      const company = new Company();
      company.id = randomUUID();

      for (let i = 0; i < 4; i++) {
        dto.lines.push({
          amount: Math.pow(-1, i + 1),
          memo: 'memo',
          accountId: account.id,
          companyId: company.id
        });
      }
      const transaction = new Transaction();
      transaction.date = dto.date;
      transaction.memo = dto.memo;
      transaction.createUser = user;
      transaction.updateUser = user;
      transaction.lines = dto.lines.map((lineDto, lineId) => {
        const line = new TransactionLine();
        line.lineId = lineId;
        line.transaction = transaction;
        line.account = account;
        line.company = company;
        line.amount = lineDto.amount;
        line.memo = lineDto.memo;
        return line;
      });

      jest
        .spyOn(userSvc, 'findOneById')
        .mockImplementation(async (id) => (id === user.id ? user : null));
      jest
        .spyOn(acctSvc, 'findOneById')
        .mockImplementation(async (id) => (id === account.id ? account : null));
      jest
        .spyOn(compSvc, 'findOneById')
        .mockImplementation(async (id) => (id === company.id ? company : null));

      const actual = await map.createToTransaction(user.id, dto);
      expect(actual).toEqual(transaction);
    });
  });

  describe('updateToTransaction()', () => {
    it('should convert a transaction-update DTO to transaction', async () => {
      const dto: TransactionUpdateDto = {
        date: new Date(),
        memo: 'memo',
        lines: []
      };
      const user = new User();
      user.id = randomUUID();

      const account = new Account();
      account.id = randomUUID();

      const company = new Company();
      company.id = randomUUID();

      for (let i = 0; i < 4; i++) {
        dto.lines.push({
          amount: Math.pow(-1, i + 1),
          memo: 'memo',
          accountId: account.id,
          companyId: company.id
        });
      }
      const transaction = new Transaction();
      transaction.id = randomUUID();
      transaction.date = dto.date;
      transaction.memo = dto.memo;
      transaction.updateUser = user;
      transaction.lines = dto.lines.map((lineDto, lineId) => {
        const line = new TransactionLine();
        line.lineId = lineId;
        line.transaction = transaction;
        line.account = account;
        line.company = company;
        line.amount = lineDto.amount;
        line.memo = lineDto.memo;
        return line;
      });
      jest
        .spyOn(userSvc, 'findOneById')
        .mockImplementation(async (id) => (id === user.id ? user : null));
      jest
        .spyOn(acctSvc, 'findOneById')
        .mockImplementation(async (id) => (id === account.id ? account : null));
      jest
        .spyOn(compSvc, 'findOneById')
        .mockImplementation(async (id) => (id === company.id ? company : null));

      const actual = await map.updateToTransaction(
        user.id,
        transaction.id,
        dto
      );
      expect(actual).toEqual(transaction);
    });
  });
});
