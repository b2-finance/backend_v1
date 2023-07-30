import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { LogService } from 'src/log/log.service';
import { TransactionService } from '../service/transaction.service';
import { TransactionMapper } from '../mapper/transaction.mapper';
import { TransactionDto } from '../dto/transaction/transaction.dto';
import { TransactionWithLinesDto } from '../dto/transaction/transaction-with-lines.dto';
import { TransactionCreateDto } from '../dto/transaction/transaction-create.dto';
import { TransactionUpdateDto } from '../dto/transaction/transaction-update.dto';
import { TransactionLineDto } from '../dto/transaction/line/transaction-line.dto';
import { AuthRequest } from 'src/auth/auth-request.dto';

/**
 * Handles requests for transaction and transaction-line entities
 */
@UseGuards(AccessTokenGuard)
@Controller('/api/transactions')
export class TransactionController {
  constructor(
    private readonly SVC: TransactionService,
    private readonly MAP: TransactionMapper,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(TransactionController.name);
  }

  /**
   * Creates a new transaction
   *
   * @param req An authorized HTTP request
   * @param dto A transaction-create DTO
   * @returns A transaction-with-lines DTO
   */
  @Post()
  async createOne(
    @Req() req: AuthRequest,
    @Body() dto: TransactionCreateDto
  ): Promise<TransactionWithLinesDto> {
    this.LOGGER.log(`Create transaction=${JSON.stringify(dto)}.`);

    let transaction = await this.MAP.createToTransaction(req.user.sub, dto);
    transaction = await this.SVC.create(transaction);

    return this.MAP.transactionToTransactionWithLinesDto(transaction);
  }

  /**
   * Gets all transactions created by the identified user
   *
   * @param req An authorized HTTP request
   * @param lines Specifies if transaction-lines should be returned (optional, default=false)
   * @returns A list of transaction DTOs or transaction-with-lines DTOs
   */
  @Get()
  async getAllByCreatorId(
    @Req() req: AuthRequest,
    @Query('lines') lines = false
  ): Promise<TransactionDto[] | TransactionWithLinesDto[]> {
    this.LOGGER.log(`Get all transactions${lines ? ' with lines' : ''}.`);

    const transactions = await this.SVC.findAllByCreatorId(req.user.sub, {
      lines
    });
    return lines
      ? transactions.map((transaction) =>
          this.MAP.transactionToTransactionWithLinesDto(transaction)
        )
      : transactions.map((transaction) =>
          this.MAP.transactionToDto(transaction)
        );
  }

  /**
   * Gets all transaction-lines created by the identified user
   *
   * @param req An authorized HTTP request
   * @param accountId An account id (optional)
   * @param companyId A company id (optional)
   * @returns A list of transaction-line DTOs
   */
  @Get('/lines')
  async getAllLinesByCreatorId(
    @Req() req: AuthRequest,
    @Query('accountId') accountId: string,
    @Query('companyId') companyId: string
  ): Promise<TransactionLineDto[]> {
    const accountIdLog = accountId ? ` accountId=${accountId}` : '';
    const companyIdLog = companyId
      ? `${accountIdLog ? ',' : ''} companyId=${companyId}`
      : '';
    this.LOGGER.log(`Get all transaction-lines${accountIdLog}${companyIdLog}.`);

    const lines = await this.SVC.findAllLinesByCreatorId(req.user.sub, {
      accountId,
      companyId
    });
    return lines.map((line) => this.MAP.transactionLineToDto(line, true));
  }

  /**
   * Gets the identified transaction
   *
   * @param id A transaction id
   * @returns A transaction DTO
   */
  @Get('/:id')
  async getOne(@Param('id') id: string): Promise<TransactionWithLinesDto> {
    this.LOGGER.log(`Get transaction with id=${id}.`);

    const transaction = await this.SVC.findOneById(id, { lines: true });

    if (!transaction)
      throw new NotFoundException('Transaction does not exist.');

    return this.MAP.transactionToTransactionWithLinesDto(transaction);
  }

  /**
   * Updates the identified transaction
   *
   * @param req An authorized HTTP request
   * @param id A transaction id
   * @param updates A transaction-update DTO
   */
  @Patch('/:id')
  async updateOne(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updates: TransactionUpdateDto
  ): Promise<void> {
    this.LOGGER.log(
      `Update transaction with id=${id}, updates=${JSON.stringify(updates)}.`
    );
    const transaction = await this.MAP.updateToTransaction(
      req.user.sub,
      id,
      updates
    );
    await this.SVC.update(id, transaction);
  }

  /**
   * Deletes the identified transaction
   *
   * @param id A transaction id
   */
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string): Promise<void> {
    this.LOGGER.log(`Delete transaction with id=${id}.`);
    await this.SVC.delete(id);
  }
}
