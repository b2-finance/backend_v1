import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { JwtService } from '@nestjs/jwt';
import { TransactionController } from './transaction.controller';
import { TransactionService } from '../service/transaction.service';
import { TransactionMapper } from '../mapper/transaction.mapper';
import { Transaction } from '../entity/transaction.entity';
import { TransactionDto } from '../dto/transaction/transaction.dto';
import { TransactionWithLinesDto } from '../dto/transaction/transaction-with-lines.dto';
import { TransactionCreateDto } from '../dto/transaction/transaction-create.dto';
import { TransactionUpdateDto } from '../dto/transaction/transaction-update.dto';
import { TransactionLine } from '../entity/transaction-line.entity';
import { TransactionLineDto } from '../dto/transaction/line/transaction-line.dto';
import { Account } from '../entity/account.entity';
import { Company } from '../entity/company.entity';
import { User } from '../entity/user.entity';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AuthRequest } from 'src/auth/auth-request.dto';

describe('TransactionController', () => {
  let con: TransactionController;
  let svc: TransactionService;
  let map: TransactionMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransactionController],
      providers: [
        ConfigService,
        LogService,
        JwtService,
        {
          provide: TransactionService,
          useValue: {
            create: jest.fn(),
            findAllByCreatorId: jest.fn(),
            findOneById: jest.fn(),
            findAllLinesByCreatorId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: TransactionMapper,
          useValue: {
            transactionToDto: jest.fn(),
            transactionToTransactionWithLinesDto: jest.fn(),
            transactionLineToDto: jest.fn(),
            createToTransaction: jest.fn(),
            updateToTransaction: jest.fn()
          }
        }
      ]
    }).compile();

    con = module.get<TransactionController>(TransactionController);
    svc = module.get<TransactionService>(TransactionService);
    map = module.get<TransactionMapper>(TransactionMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOne()', () => {
    it('should return the expected transaction-with-lines DTO', async () => {
      const req = { user: { sub: randomUUID() } };

      const createDto: TransactionCreateDto = {
        date: new Date(),
        memo: 'memo',
        lines: []
      };
      for (let i = 0; i < 4; i++) {
        createDto.lines.push({
          accountId: randomUUID(),
          companyId: randomUUID(),
          amount: Math.pow(-1, i + 1),
          memo: 'memo'
        });
      }
      const transaction = new Transaction();
      transaction.id = randomUUID();

      const withLinesDto: TransactionWithLinesDto = {
        id: transaction.id,
        date: transaction.date,
        memo: transaction.memo,
        lines: []
      };
      for (let i = 0; i < createDto.lines.length; i++) {
        const { amount, memo, accountId, companyId } = createDto.lines[i];

        withLinesDto.lines.push({
          id: expect.any(String),
          lineId: i,
          amount,
          memo,
          accountId,
          companyId
        });
      }
      jest
        .spyOn(map, 'createToTransaction')
        .mockImplementation(async (x, y) =>
          x === req.user.sub && y === createDto ? transaction : null
        );
      jest
        .spyOn(svc, 'create')
        .mockImplementation(async (x) =>
          x === transaction ? transaction : null
        );
      jest
        .spyOn(map, 'transactionToTransactionWithLinesDto')
        .mockImplementation((x) => (x === transaction ? withLinesDto : null));

      const actual = await con.createOne(req as AuthRequest, createDto);
      expect(actual).toEqual(withLinesDto);
    });
  });

  describe('getAllByCreatorId()', () => {
    it('should return a list of transaction DTOs', async () => {
      const req = { user: { sub: randomUUID() } };
      const user = new User();
      user.id = req.user.sub;

      const account = new Account();
      account.id = randomUUID();

      const company = new Company();
      company.id = randomUUID();

      const transaction: Transaction = {
        id: randomUUID(),
        date: new Date(),
        memo: 'memo',
        lines: [],
        createUser: user,
        updateUser: user,
        createDate: new Date(),
        updateDate: new Date()
      };
      const dto: TransactionDto = {
        id: transaction.id,
        date: transaction.date,
        memo: transaction.memo
      };
      jest
        .spyOn(svc, 'findAllByCreatorId')
        .mockImplementation(async (x) =>
          x === user.id ? [transaction, transaction] : null
        );
      jest
        .spyOn(map, 'transactionToDto')
        .mockImplementation((x) => (x === transaction ? dto : null));

      const actual = await con.getAllByCreatorId(req as AuthRequest);
      expect(actual).toEqual([dto, dto]);
    });

    it('should return a list of transaction-with-lines DTOs', async () => {
      const req = { user: { sub: randomUUID() } };
      const user = new User();
      user.id = req.user.sub;

      const account = new Account();
      account.id = randomUUID();

      const company = new Company();
      company.id = randomUUID();

      const transaction: Transaction = {
        id: randomUUID(),
        date: new Date(),
        memo: 'memo',
        lines: [],
        createUser: user,
        updateUser: user,
        createDate: new Date(),
        updateDate: new Date()
      };
      for (let lineId = 0; lineId < 2; lineId++) {
        transaction.lines.push({
          id: randomUUID(),
          lineId,
          transaction,
          account,
          company,
          amount: Math.pow(-1, lineId + 1),
          memo: `memo${lineId}`,
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      const dto: TransactionWithLinesDto = {
        id: transaction.id,
        date: transaction.date,
        memo: transaction.memo,
        lines: transaction.lines.map((l) => ({
          id: l.id,
          lineId: l.lineId,
          accountId: l.account.id,
          companyId: l.company.id,
          amount: l.amount,
          memo: l.memo
        }))
      };
      jest
        .spyOn(svc, 'findAllByCreatorId')
        .mockImplementation(async (x) =>
          x === user.id ? [transaction, transaction] : null
        );
      jest
        .spyOn(map, 'transactionToTransactionWithLinesDto')
        .mockImplementation((x) => (x === transaction ? dto : null));

      const actual = await con.getAllByCreatorId(req as AuthRequest, true);
      expect(actual).toEqual([dto, dto]);
    });
  });

  describe('getAllLinesByCreatorId', () => {
    it('should return a list of transaction-line DTOs', async () => {
      const req = { user: { sub: randomUUID() } };

      const account = new Account();
      account.id = randomUUID();

      const company = new Company();
      company.id = randomUUID();

      const transaction = new Transaction();
      transaction.id = randomUUID();

      const line: TransactionLine = {
        id: randomUUID(),
        lineId: 1,
        transaction,
        account,
        company,
        amount: 1,
        memo: 'memo',
        createDate: new Date(),
        updateDate: new Date()
      };
      transaction.lines = [line, line];

      const dto: TransactionLineDto = {
        id: line.id,
        lineId: line.lineId,
        transactionId: line.transaction.id,
        accountId: line.account.id,
        companyId: line.company.id,
        amount: line.amount,
        memo: line.memo
      };
      jest
        .spyOn(svc, 'findAllLinesByCreatorId')
        .mockImplementation(async (x, _y) =>
          x === req.user.sub ? transaction.lines : null
        );
      jest
        .spyOn(map, 'transactionLineToDto')
        .mockImplementation((x, _y) => (x === line ? dto : null));

      const actual = await con.getAllLinesByCreatorId(
        req as AuthRequest,
        undefined,
        undefined
      );
      expect(actual).toEqual([dto, dto]);
    });
  });

  describe('getOne()', () => {
    it('should return the expected transaction-with-lines DTO', async () => {
      const account = new Account();
      account.id = randomUUID();

      const company = new Company();
      company.id = randomUUID();

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
          account,
          company,
          amount: Math.pow(-1, lineId + 1),
          memo: `memo${lineId}`,
          createDate: new Date(),
          updateDate: new Date()
        });
      }
      const dto: TransactionWithLinesDto = {
        id: transaction.id,
        date: transaction.date,
        memo: transaction.memo,
        lines: transaction.lines.map((l) => ({
          id: l.id,
          lineId: l.lineId,
          accountId: l.account.id,
          companyId: l.company.id,
          amount: l.amount,
          memo: l.memo
        }))
      };
      jest
        .spyOn(svc, 'findOneById')
        .mockImplementation(async (x) =>
          x === transaction.id ? transaction : null
        );
      jest
        .spyOn(map, 'transactionToTransactionWithLinesDto')
        .mockImplementation((x) => (x === transaction ? dto : null));

      const actual = await con.getOne(transaction.id);
      expect(actual).toEqual(dto);
    });

    it('should throw NotFoundException if id does not exist', async () => {
      jest.spyOn(svc, 'findOneById').mockResolvedValue(null);
      expect(async () => await con.getOne(randomUUID())).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('updateOne()', () => {
    it('should call svc.update with expected arguments', async () => {
      const req = { user: { sub: randomUUID() } };

      const transaction = new Transaction();
      transaction.id = randomUUID();
      const updates: TransactionUpdateDto = { date: new Date() };

      jest
        .spyOn(map, 'updateToTransaction')
        .mockImplementation(async (x, y, z) =>
          x === req.user.sub && y === transaction.id && z === updates
            ? transaction
            : null
        );

      await con.updateOne(req as AuthRequest, transaction.id, updates);
      expect(svc.update).toHaveBeenCalledWith(transaction.id, transaction);
    });
  });

  describe('deleteOne()', () => {
    it('should call svc.delete with expected arguments', async () => {
      const id = randomUUID();
      await con.deleteOne(id);
      expect(svc.delete).toHaveBeenCalledWith(id);
    });
  });
});
