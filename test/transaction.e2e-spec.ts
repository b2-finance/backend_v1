import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from 'src/app/app.module';
import { LogService } from 'src/log/log.service';
import { TransactionService } from 'src/core/service/transaction.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Transaction } from 'src/core/entity/transaction.entity';
import { TransactionWithLinesDto } from 'src/core/dto/transaction/transaction-with-lines.dto';
import { TransactionCreateDto } from 'src/core/dto/transaction/transaction-create.dto';
import { TransactionUpdateDto } from 'src/core/dto/transaction/transaction-update.dto';
import { TransactionLine } from 'src/core/entity/transaction-line.entity';
import { Account } from 'src/core/entity/account.entity';
import { Company } from 'src/core/entity/company.entity';
import { User } from 'src/core/entity/user.entity';
import { randomUUID } from 'crypto';
import { QueryStringParams, getQueryString, signUp } from './test-utils';

/**
 * Generates an amount value for a transaction-line
 *
 * @param lineId A transaction-line line-id
 * @returns -1 raised to the power of (lineId + 1), i.e., `(-1)^(lineId + 1)`
 */
const getLineAmount = (lineId: number) => Math.pow(-1, lineId + 1);

describe('TransactionController (e2e)', () => {
  let app: INestApplication;
  let tranRepo: Repository<Transaction>;
  let acctRepo: Repository<Account>;
  let compRepo: Repository<Company>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        LogService,
        TransactionService,
        {
          provide: getRepositoryToken(Transaction),
          useClass: Repository<Transaction>
        },
        {
          provide: getRepositoryToken(TransactionLine),
          useClass: Repository<TransactionLine>
        },
        {
          provide: getRepositoryToken(Account),
          useClass: Repository<Account>
        },
        {
          provide: getRepositoryToken(Company),
          useClass: Repository<Company>
        }
      ]
    }).compile();

    app = module.createNestApplication();
    tranRepo = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction)
    );
    acctRepo = module.get<Repository<Account>>(getRepositoryToken(Account));
    compRepo = module.get<Repository<Company>>(getRepositoryToken(Company));
    await app.init();
  });

  /**
   * Sets the database with an initial state of `numTrans` transactions populated.
   * Each call to this function will create a unique account and company in the
   * database, and all transactions created within the same function call will
   * share that account, company and the given user. Subsequent calls to this
   * function will crete different accounts and companies.
   *
   * @param user The user creating the initial transactions
   * @param numTrans The number of transactions to populate the database
   * @param numLines The number of lines for each transaction
   * @returns The account, company and transactions created in the database
   */
  async function setup(
    user: User,
    numTrans: number,
    numLines: number
  ): Promise<{
    account: Account;
    company: Company;
    transactions: Transaction[];
  }> {
    const account = await acctRepo.save({
      code: `code${randomUUID()}`,
      name: `name${randomUUID()}`,
      createUser: user,
      updateUser: user
    });
    const company = await compRepo.save({
      name: `name${randomUUID()}`,
      createUser: user,
      updateUser: user
    });
    const transactions: Transaction[] = [];

    for (let i = 0; i < numTrans; i++) {
      const transaction = await tranRepo.save({
        date: new Date(),
        memo: 'memo',
        get lines() {
          const lines = [];

          for (let lineId = 0; lineId < numLines; lineId++) {
            lines.push({
              lineId,
              transaction: this,
              account,
              company,
              amount: getLineAmount(lineId),
              memo: `memo${lineId}`
            });
          }
          return lines;
        },
        createUser: user,
        updateUser: user
      });
      transactions.push(transaction);
    }
    return {
      account,
      company,
      transactions
    };
  }

  afterEach(async () => {
    jest.restoreAllMocks();
    await tranRepo.query('DELETE FROM db_transaction');
    await tranRepo.query('DELETE FROM db_account');
    await tranRepo.query('DELETE FROM db_company');
    await tranRepo.query('DELETE FROM db_user');
    await app.close();
  });

  describe('POST /api/transactions', () => {
    /**
     * Sets up the initial state of the database for the `POST /api/transactions` test block by
     * populating the database with `initialState` transactions.
     *
     * @param user The user creating the initial transactions
     * @param initialState The number of transactions to populate the database
     * @returns A transaction-create DTO to use in the test
     */
    async function setupForCreate(user: User, initialState: number) {
      const {
        account: { id: accountId },
        company: { id: companyId }
      } = await setup(user, initialState, 2);

      const dto: TransactionCreateDto = {
        date: new Date(),
        memo: 'memo',
        lines: [...Array(4).keys()].map((i) => ({
          amount: getLineAmount(i),
          memo: `memo${i}`,
          accountId,
          companyId
        }))
      };
      return dto;
    }

    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should require an access token (%s)',
      async (_: string, initialState: number) => {
        const { user } = await signUp(app);
        const createDto = await setupForCreate(user, initialState);

        await request(app.getHttpServer())
          .post('/api/transactions')
          .send(createDto)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    );

    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should return CREATED status (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const createDto = await setupForCreate(user, initialState);

        await request(app.getHttpServer())
          .post('/api/transactions')
          .send(createDto)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.CREATED);
      }
    );

    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should return the created transaction-with-lines DTO (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const createDto = await setupForCreate(user, initialState);

        const withLinesDto: TransactionWithLinesDto = {
          id: expect.any(String),
          // The returned body contains date as a string for some reason
          date: expect.stringContaining(createDto.date.toISOString()),
          memo: createDto.memo,
          lines: createDto.lines.map((l, lineId) => ({
            id: expect.any(String),
            lineId,
            accountId: l.accountId,
            companyId: l.companyId,
            amount: l.amount,
            memo: l.memo
          }))
        };
        await request(app.getHttpServer())
          .post('/api/transactions')
          .send(createDto)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(({ body }) => {
            expect(body).toEqual(withLinesDto);
          });
      }
    );

    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should add the transaction to the database (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const createDto = await setupForCreate(user, initialState);

        const {
          body: { id }
        } = await request(app.getHttpServer())
          .post('/api/transactions')
          .send(createDto)
          .set('Authorization', `Bearer ${accessToken}`);

        const actual = await tranRepo.findOneBy({ id });
        expect(actual).not.toBeNull();
      }
    );
  });

  describe('GET /api/transactions', () => {
    it.each([
      ['no params, initial state: 0', 0, {}],
      ['no params, initial state: 3', 3, {}],
      ['lines=true, initial state: 0', 0, { lines: true }],
      ['lines=true, initial state: 3', 3, { lines: true }],
      ['lines=false, initial state: 0', 0, { lines: false }],
      ['lines=false, initial state: 3', 3, { lines: false }]
    ])(
      'should require an access token (%s)',
      async (_: string, initialState: number, params: QueryStringParams) => {
        const { user } = await signUp(app);
        await setup(user, initialState, 2);

        await request(app.getHttpServer())
          .get(`/api/transactions${getQueryString(params)}`)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    );

    it.each([
      ['no params, initial state: 0', 0, {}],
      ['no params, initial state: 3', 3, {}],
      ['lines=true, initial state: 0', 0, { lines: true }],
      ['lines=true, initial state: 3', 3, { lines: true }],
      ['lines=false, initial state: 0', 0, { lines: false }],
      ['lines=false, initial state: 3', 3, { lines: false }]
    ])(
      'should return OK status (%s)',
      async (_: string, initialState: number, params: QueryStringParams) => {
        const { accessToken, user } = await signUp(app);
        await setup(user, initialState, 2);

        await request(app.getHttpServer())
          .get(`/api/transactions${getQueryString(params)}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.OK);
      }
    );

    it.each([
      ['no params, initial state: 0', 0, {}],
      ['no params, initial state: 3', 3, {}],
      ['lines=true, initial state: 0', 0, { lines: true }],
      ['lines=true, initial state: 3', 3, { lines: true }],
      ['lines=false, initial state: 0', 0, { lines: false }],
      ['lines=false, initial state: 3', 3, { lines: false }]
    ])(
      'should return a list of all transaction DTOs (%s)',
      async (_: string, initialState: number, params: QueryStringParams) => {
        const { accessToken, user } = await signUp(app);
        await setup(user, initialState, 2);

        await request(app.getHttpServer())
          .get(`/api/transactions${getQueryString(params)}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(({ body }) => {
            expect(body.length).toEqual(initialState);
          });
      }
    );
  });

  describe('GET /api/transactions/lines', () => {
    it.each([
      ['no params, initial state: 0', 0, {}],
      ['no params, initial state: 3', 3, {}],
      ['accountId, initial state: 0', 0, { accountId: randomUUID() }],
      ['accountId, initial state: 3', 3, { accountId: randomUUID() }],
      ['companyId, initial state: 0', 0, { companyId: randomUUID() }],
      ['companyId, initial state: 3', 3, { companyId: randomUUID() }],
      [
        'all params, initial state: 0',
        0,
        { accountId: randomUUID(), companyId: randomUUID() }
      ],
      [
        'all params, initial state: 3',
        3,
        { accountId: randomUUID(), companyId: randomUUID() }
      ]
    ])(
      'should require an access token (%s)',
      async (_: string, initialState: number, params: QueryStringParams) => {
        const { user } = await signUp(app);
        await setup(user, initialState, 4);

        await request(app.getHttpServer())
          .get(`/api/transactions/lines${getQueryString(params)}`)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    );

    it.each([
      ['no params, initial state: 0', 0, {}],
      ['no params, initial state: 3', 3, {}],
      ['accountId, initial state: 0', 0, { accountId: randomUUID() }],
      ['accountId, initial state: 3', 3, { accountId: randomUUID() }],
      ['companyId, initial state: 0', 0, { companyId: randomUUID() }],
      ['companyId, initial state: 3', 3, { companyId: randomUUID() }],
      [
        'all params, initial state: 0',
        0,
        { accountId: randomUUID(), companyId: randomUUID() }
      ],
      [
        'all params, initial state: 3',
        3,
        { accountId: randomUUID(), companyId: randomUUID() }
      ]
    ])(
      'should return OK status (%s)',
      async (_: string, initialState: number, params: QueryStringParams) => {
        const { accessToken, user } = await signUp(app);
        await setup(user, initialState, 4);

        await request(app.getHttpServer())
          .get(`/api/transactions/lines${getQueryString(params)}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.OK);
      }
    );

    it.each([
      /*
        There are a total 60 transaction-lines:
        1 initial transaction with 12 lines = 12 lines
        4 new transactions with 12 lines each = 48 lines
      */

      // 1/2 of the new transactions were created by the target user + the 12 initial
      ['no params, 12 lines in database', 1, 12 + 48 * (1 / 2), {}],

      [
        'accountId, 12 lines in database',
        1,
        // 1/2 of the lines on the new transactions have this account id
        48 * (1 / 2) * (1 / 2),
        { accountId: randomUUID() }
      ],

      [
        'companyId, 12 lines in database',
        1,
        // 1/3 of the lines on the new transactions have this company id
        48 * (1 / 2) * (1 / 3),
        { companyId: randomUUID() }
      ],

      [
        'all params, 12 lines in database',
        1,
        // 1/2 of 1/3 of the new lines have both this account id and company id
        48 * (1 / 2) * (1 / 2) * (1 / 3),
        { accountId: randomUUID(), companyId: randomUUID() }
      ]
    ])(
      'should return a list of all transaction-line DTOs (%s)',
      async (
        _: string,
        initialState: number,
        expected: number,
        params: QueryStringParams
      ) => {
        const { accessToken, user: targetUser } = await signUp(app);

        // Creates 12 initial transaction-lines created by target user, with different account/company
        await setup(targetUser, initialState, 12);

        const targetAccount = await acctRepo.save({
          id: params.accountId,
          code: 'code',
          name: 'name',
          createUser: targetUser,
          updateUser: targetUser
        });
        const targetCompany = await compRepo.save({
          id: params.companyId,
          name: 'name',
          createUser: targetUser,
          updateUser: targetUser
        });

        const { user: otherUser } = await signUp(app, {
          username: `${targetUser.username}1`,
          email: `1${targetUser.email}`
        });
        const otherAccount = await acctRepo.save({
          code: `${targetAccount.code}1`,
          name: `${targetAccount.name}1`,
          createUser: otherUser,
          updateUser: otherUser
        });
        const otherCompany = await compRepo.save({
          name: `${targetCompany.name}1`,
          createUser: otherUser,
          updateUser: otherUser
        });

        const numTrans = 4;
        const numLines = 12;

        for (let i = 0; i < numTrans; i++) {
          const transaction = {
            date: new Date(),
            memo: 'memo',
            get lines() {
              const lines = [];

              for (let lineId = 0; lineId < numLines; lineId++) {
                // Every other line has the target account
                // Every 3rd line has target company
                lines.push({
                  lineId,
                  transaction: this,
                  amount: getLineAmount(lineId),
                  memo: `memo${lineId}`,
                  account: lineId % 2 === 0 ? targetAccount : otherAccount,
                  company: lineId % 3 === 0 ? targetCompany : otherCompany
                });
              }
              return lines;
            },
            // Every other transaction is created by the target user
            createUser: i % 2 === 0 ? targetUser : otherUser,
            updateUser: targetUser
          };
          await tranRepo.save(transaction);
        }
        await request(app.getHttpServer())
          .get(`/api/transactions/lines${getQueryString(params)}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(({ body }) => {
            expect(body.length).toEqual(expected);
          });
      }
    );
  });

  describe('GET /api/transactions/:id', () => {
    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should require an access token (%s)',
      async (_: string, initialState: number) => {
        const { user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        const id = initialState === 0 ? randomUUID() : transactions[0].id;

        await request(app.getHttpServer())
          .get(`/api/transactions/${id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    );

    it.each([
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should return OK status (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);

        await request(app.getHttpServer())
          .get(`/api/transactions/${transactions[0].id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.OK);
      }
    );

    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should return NOT FOUND status if id does not exist (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        const existingIds = transactions.map((t) => t.id);

        let id: string;
        while (!id || existingIds.includes(id)) id = randomUUID();

        await request(app.getHttpServer())
          .get(`/api/transactions/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.NOT_FOUND);
      }
    );

    it.each([
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should return a transaction-with-lines DTO if it exists (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        const { id, date, memo, lines } = transactions[0];

        const withLinesDto: TransactionWithLinesDto = {
          id,
          date: expect.stringContaining(date.toISOString()),
          memo,
          lines: lines.map((l) => ({
            /*
              The line id does not get loaded in the setup function
              so need to expect anything here
            */
            id: expect.any(String),
            lineId: l.lineId,
            accountId: l.account.id,
            companyId: l.company.id,
            amount: l.amount,
            memo: l.memo
          }))
        };
        await request(app.getHttpServer())
          .get(`/api/transactions/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(({ body }) => {
            expect(body).toEqual(withLinesDto);
          });
      }
    );
  });

  describe('PATCH /api/transactions/:id', () => {
    const NEW_ACCOUNT_ID = randomUUID();
    const NEW_COMPANY_ID = randomUUID();

    /**
     * Sets up the initial state of the database for the `PATCH /api/transactions/:id` test block
     * by populating the database with an account and company with ids of {@link NEW_ACCOUNT_ID} and
     * {@link NEW_COMPANY_ID} respectively.
     *
     * @param user The user creating the account and company used in the tests
     */
    async function setupForUpdate(user: User) {
      await acctRepo.save({
        id: NEW_ACCOUNT_ID,
        code: 'code',
        name: 'name',
        createUser: user,
        updateUser: user
      });
      await compRepo.save({
        id: NEW_COMPANY_ID,
        name: 'name',
        createUser: user,
        updateUser: user
      });
    }

    const UPDATE_PARAMS = [
      ['no updates, initial state: 1', 1, {}],
      ['date, initial state: 1', 1, { date: new Date() }],
      ['memo, initial state: 1', 1, { memo: 'new memo' }],
      [
        'lines, initial state: 1',
        1,
        {
          lines: [
            {
              amount: -1,
              memo: 'new memo',
              accountId: NEW_ACCOUNT_ID,
              companyId: NEW_COMPANY_ID
            },
            {
              amount: 1,
              memo: 'new memo',
              accountId: NEW_ACCOUNT_ID,
              companyId: NEW_COMPANY_ID
            }
          ]
        }
      ],
      [
        'update all, initial state: 1',
        1,
        {
          date: new Date(),
          memo: 'new memo',
          lines: [
            {
              amount: -1,
              memo: 'new memo',
              accountId: NEW_ACCOUNT_ID,
              companyId: NEW_COMPANY_ID
            },
            {
              amount: 1,
              memo: 'new memo',
              accountId: NEW_ACCOUNT_ID,
              companyId: NEW_COMPANY_ID
            }
          ]
        }
      ]
    ];

    it.each(UPDATE_PARAMS)(
      'should require an access token (%s)',
      async (
        _: string,
        initialState: number,
        updates: TransactionUpdateDto
      ) => {
        const { user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        await setupForUpdate(user);

        await request(app.getHttpServer())
          .patch(`/api/transactions/${transactions[0].id}`)
          .send(updates)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    );

    it.each(UPDATE_PARAMS)(
      'should return OK status (%s)',
      async (
        _: string,
        initialState: number,
        updates: TransactionUpdateDto
      ) => {
        const { accessToken, user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        await setupForUpdate(user);

        await request(app.getHttpServer())
          .patch(`/api/transactions/${transactions[0].id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updates)
          .expect(HttpStatus.OK);
      }
    );

    it.each(UPDATE_PARAMS)(
      'should update the database record (%s)',
      async (
        _: string,
        initialState: number,
        updates: TransactionUpdateDto
      ) => {
        const { accessToken, user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        const { id, lines } = transactions[0];
        await setupForUpdate(user);

        await request(app.getHttpServer())
          .patch(`/api/transactions/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updates);

        const actual = await tranRepo.findOne({
          where: { id },
          relations: {
            lines: {
              account: true,
              company: true,
              transaction: true
            }
          }
        });
        const entries = Object.entries(updates);

        for (const [key, value] of entries) {
          if (key !== 'lines') {
            expect(actual[key]).toEqual(value);
          } else {
            for (let i = 0; i < lines.length; i++) {
              const line = actual.lines[i];

              // Database does not consistently return lines in order so cannot compare index by index
              const lineId = line.lineId;

              expect(line.transaction.id).toEqual(lines[lineId].transaction.id);
              expect(line.account.id).toEqual(NEW_ACCOUNT_ID);
              expect(line.company.id).toEqual(NEW_COMPANY_ID);
              expect(line.amount).toEqual(updates.lines[lineId].amount);
              expect(line.memo).toEqual(updates.lines[lineId].memo);
            }
          }
        }
      }
    );

    it.each(UPDATE_PARAMS)(
      'should update the updateUser field (%s)',
      async (
        _: string,
        initialState: number,
        updates: TransactionUpdateDto
      ) => {
        const { user } = await signUp(app);

        // Creating the transaction with this initial user
        const { transactions } = await setup(user, initialState, 2);
        const { id } = transactions[0];
        await setupForUpdate(user);

        // Will update the transaction with this other user
        const { accessToken, user: otherUser } = await signUp(app, {
          username: `${user.username}1`,
          email: `1${user.email}`
        });
        await request(app.getHttpServer())
          .patch(`/api/transactions/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send(updates);

        const actual = await tranRepo.findOne({
          where: { id },
          relations: { updateUser: true }
        });
        expect(actual.updateUser).toEqual(otherUser);
      }
    );
  });

  describe('DELETE /api/companies/:id', () => {
    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should require an access token (%s)',
      async (_: string, initialState: number) => {
        const { user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        const id = initialState === 0 ? randomUUID() : transactions[0].id;

        await request(app.getHttpServer())
          .delete(`/api/transactions/${id}`)
          .expect(HttpStatus.UNAUTHORIZED);
      }
    );

    it.each([
      ['initial state: 0', 0],
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should return NO CONTENT status (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        const id = initialState === 0 ? randomUUID() : transactions[0].id;

        await request(app.getHttpServer())
          .delete(`/api/transactions/${id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(HttpStatus.NO_CONTENT);
      }
    );

    it.each([
      ['initial state: 1', 1],
      ['initial state: 3', 3]
    ])(
      'should remove the transaction record from the database (%s)',
      async (_: string, initialState: number) => {
        const { accessToken, user } = await signUp(app);
        const { transactions } = await setup(user, initialState, 2);
        const { id } = transactions[0];

        await request(app.getHttpServer())
          .delete(`/api/transactions/${id}`)
          .set('Authorization', `Bearer ${accessToken}`);

        const actual = await tranRepo.findOneBy({ id });
        expect(actual).toBeNull();
      }
    );
  });
});
