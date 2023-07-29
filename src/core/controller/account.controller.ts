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
  Req,
  UseGuards
} from '@nestjs/common';
import { AccessTokenGuard } from 'src/auth/access-token.guard';
import { LogService } from 'src/log/log.service';
import { AccountService } from '../service/account.service';
import { AccountMapper } from '../mapper/account.mapper';
import { AccountDto } from '../dto/account.dto';
import { AccountCreateDto } from '../dto/account-create.dto';
import { AccountUpdateDto } from '../dto/account-update.dto';
import { AuthRequest } from 'src/auth/auth-request.dto';

/**
 * Handles requests for account entities
 */
@UseGuards(AccessTokenGuard)
@Controller('/api/accounts')
export class AccountController {
  constructor(
    private readonly SVC: AccountService,
    private readonly MAP: AccountMapper,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(AccountController.name);
  }

  /**
   * Creates a new account
   *
   * @param req An authorized HTTP request
   * @param dto An account-create DTO
   * @returns An account DTO
   */
  @Post()
  async createOne(
    @Req() req: AuthRequest,
    @Body() dto: AccountCreateDto
  ): Promise<AccountDto> {
    this.LOGGER.log(`Create account=${JSON.stringify(dto)}.`);

    let account = await this.MAP.createToAccount(req.user.sub, dto);
    account = await this.SVC.create(account);

    return this.MAP.accountToDto(account);
  }

  /**
   * Gets all accounts created by the identified user
   *
   * @param req An authorized HTTP request
   * @returns A list of account DTOs
   */
  @Get()
  async getAllByCreatorId(@Req() req: AuthRequest): Promise<AccountDto[]> {
    this.LOGGER.log('Get all accounts.');
    const accounts = await this.SVC.findAllByCreatorId(req.user.sub);
    return accounts?.map((account) => this.MAP.accountToDto(account));
  }

  /**
   * Gets the identified account
   *
   * @param id An account id
   * @returns An account DTO
   */
  @Get('/:id')
  async getOne(@Param('id') id: string): Promise<AccountDto> {
    this.LOGGER.log(`Get account with id=${id}.`);
    const account = await this.SVC.findOneById(id);

    if (!account) throw new NotFoundException('Account does not exist.');

    return this.MAP.accountToDto(account);
  }

  /**
   * Updates the identified account
   *
   * @param req An authorized HTTP request
   * @param id An account id
   * @param updates An account-update DTO
   */
  @Patch('/:id')
  async updateOne(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() updates: AccountUpdateDto
  ): Promise<void> {
    this.LOGGER.log(
      `Update account with id=${id}, updates=${JSON.stringify(updates)}.`
    );
    const account = await this.MAP.updateToAccount(req.user.sub, updates);
    await this.SVC.update(id, account);
  }

  /**
   * Deletes the identified account
   *
   * @param id An account id
   */
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string): Promise<void> {
    this.LOGGER.log(`Delete account with id=${id}.`);
    await this.SVC.delete(id);
  }
}
