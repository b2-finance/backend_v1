import { Injectable } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { AccountService } from '../service/account.service';
import { CompanyService } from '../service/company.service';
import { Transaction } from '../entity/transaction.entity';
import { TransactionDto } from '../dto/transaction/transaction.dto';
import { TransactionWithLinesDto } from '../dto/transaction/transaction-with-lines.dto';
import { TransactionCreateDto } from '../dto/transaction/transaction-create.dto';
import { TransactionUpdateDto } from '../dto/transaction/transaction-update.dto';
import { TransactionLine } from '../entity/transaction-line.entity';
import { TransactionLineDto } from '../dto/transaction/line/transaction-line.dto';
import { TransactionLineCreateDto } from '../dto/transaction/line/transaction-line-create.dto';

/**
 * Maps between transaction entities and DTOs
 */
@Injectable()
export class TransactionMapper {
  constructor(
    private readonly USER_SVC: UserService,
    private readonly ACCT_SVC: AccountService,
    private readonly COMP_SVC: CompanyService
  ) {}

  /**
   * Converts a transaction entity to a transaction DTO
   *
   * @param transaction A transaction
   * @returns A transaction DTO
   */
  transactionToDto(transaction: Transaction): TransactionDto {
    const dto: TransactionDto = {
      id: transaction.id,
      date: transaction.date,
      memo: transaction.memo
    };
    return dto;
  }

  /**
   * Converts a transaction entity to a transaction-with-lines DTO
   *
   * @param transaction A transaction
   * @returns A transaction-with-lines DTO
   */
  transactionToTransactionWithLinesDto(
    transaction: Transaction
  ): TransactionWithLinesDto {
    return {
      id: transaction.id,
      date: transaction.date,
      memo: transaction.memo,
      lines: transaction.lines?.map((line) => this.transactionLineToDto(line))
    };
  }

  /**
   * Converts a transaction-line entity to a transaction-line DTO
   *
   * @param line A transaction-line
   * @param transactionId If true, includes the parent transaction id with the line (optional, default=false)
   * @returns A transaction-line DTO
   */
  transactionLineToDto(
    line: TransactionLine,
    transactionId = false
  ): TransactionLineDto {
    return {
      id: line.id,
      lineId: line.lineId,
      ...(transactionId && { transactionId: line.transaction?.id }),
      accountId: line.account?.id,
      companyId: line.company?.id,
      amount: line.amount,
      memo: line.memo
    };
  }

  /**
   * Converts a transaction-create DTO to a transaction
   *
   * @param userId The id of the user performing the transaction
   * @param dto A transaction-create DTO
   * @returns A transaction
   */
  async createToTransaction(
    userId: string,
    dto: TransactionCreateDto
  ): Promise<Transaction> {
    const transaction = new Transaction();
    transaction.date = dto.date;
    transaction.memo = dto.memo;
    transaction.lines = await this.transactionLineCreateDtosToTransactionLines(
      dto.lines,
      transaction
    );
    const user = await this.USER_SVC.findOneById(userId);
    transaction.createUser = user;
    transaction.updateUser = user;

    return transaction;
  }

  /**
   * Converts a transaction-update DTO to a transaction
   *
   * @param userId The id of the user performing the transaction
   * @param id A transaction id
   * @param dto A transaction-update DTO
   * @returns A transaction
   */
  async updateToTransaction(
    userId: string,
    id: string,
    dto: TransactionUpdateDto
  ): Promise<Transaction> {
    const { date, memo, lines } = dto;
    const transaction = new Transaction();
    transaction.id = id;
    transaction.updateUser = await this.USER_SVC.findOneById(userId);

    if (date) transaction.date = dto.date;
    if (memo) transaction.memo = dto.memo;
    if (lines) {
      transaction.lines =
        await this.transactionLineCreateDtosToTransactionLines(
          dto.lines,
          transaction
        );
    }
    return transaction;
  }

  /**
   * Converts a list of transaction-line-create DTOs to a list of transaction-lines
   *
   * @param dtos A list of transaction-line-create DTOs
   * @param transaction The parent transaction of the line
   * @returns A list of transaction-lines
   */
  private async transactionLineCreateDtosToTransactionLines(
    dtos: TransactionLineCreateDto[],
    transaction: Transaction
  ): Promise<TransactionLine[]> {
    const lines: TransactionLine[] = [];

    for (let lineId = 0; lineId < dtos.length; lineId++) {
      const { amount, memo, accountId, companyId } = dtos[lineId];

      const line = new TransactionLine();
      line.lineId = lineId;
      line.transaction = transaction;
      line.amount = amount;
      line.memo = memo;
      line.account = await this.ACCT_SVC.findOneById(accountId);

      if (companyId) line.company = await this.COMP_SVC.findOneById(companyId);

      lines.push(line);
    }
    return lines;
  }
}
