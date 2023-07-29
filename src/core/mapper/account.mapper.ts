import { Injectable } from '@nestjs/common';
import { Account } from '../entity/account.entity';
import { AccountDto } from '../dto/account.dto';
import { AccountCreateDto } from '../dto/account-create.dto';
import { AccountUpdateDto } from '../dto/account-update.dto';
import { UserService } from '../service/user.service';

/**
 * Maps between account entities and DTOs
 */
@Injectable()
export class AccountMapper {
  constructor(private readonly USER_SVC: UserService) {}
  /**
   * Converts an account entity to an account DTO
   *
   * @param account An account
   * @returns An account DTO
   */
  accountToDto(account: Account): AccountDto {
    return {
      id: account.id,
      code: account.code,
      name: account.name
    };
  }

  /**
   * Converts an account-create DTO to an account
   *
   * @param userId The id of the user performing the transaction
   * @param dto An account-create DTO
   * @returns An account
   */
  async createToAccount(
    userId: string,
    dto: AccountCreateDto
  ): Promise<Account> {
    const account = new Account();
    account.code = dto.code;
    account.name = dto.name;

    const user = await this.USER_SVC.findOneById(userId);
    account.createUser = user;
    account.updateUser = user;

    return account;
  }

  /**
   * Converts an account-update DTO to an account
   *
   * @param userId The id of the user performing the transaction
   * @param dto An account-update DTO
   * @returns An account
   */
  async updateToAccount(
    userId: string,
    dto: AccountUpdateDto
  ): Promise<Account> {
    const account = new Account();
    account.code = dto.code;
    account.name = dto.name;
    account.updateUser = await this.USER_SVC.findOneById(userId);
    return account;
  }
}
