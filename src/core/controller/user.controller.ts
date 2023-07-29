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
import { AccessTokenGuard } from '../../auth/access-token.guard';
import { LogService } from 'src/log/log.service';
import { UserService } from '../service/user.service';
import { UserMapper } from '../mapper/user.mapper';
import { UserDto } from '../dto/user.dto';
import { UserCreateDto } from '../dto/user-create.dto';
import { UserUpdateDto } from '../dto/user-update.dto';
import { AuthRequest } from 'src/auth/auth-request.dto';

/**
 * Handles requests for user entities
 */
@UseGuards(AccessTokenGuard)
@Controller('/api/users')
export class UserController {
  constructor(
    private readonly SVC: UserService,
    private readonly MAP: UserMapper,
    private readonly LOGGER: LogService
  ) {
    this.LOGGER.setContext(UserController.name);
  }

  /**
   * Creates a new user
   *
   * @param req An authorized HTTP request
   * @param dto A user-create DTO
   * @returns A user DTO
   */
  @Post()
  async createOne(
    @Req() req: AuthRequest,
    @Body() dto: UserCreateDto
  ): Promise<UserDto> {
    this.LOGGER.log(`Create user=${JSON.stringify(dto)}.`);

    let user = this.MAP.createToUser(req.user.sub, dto);
    user = await this.SVC.create(user);

    return this.MAP.userToDto(user);
  }

  /**
   * Gets all users
   *
   * @returns A list of user DTOs
   */
  @Get()
  async getAll(): Promise<UserDto[]> {
    this.LOGGER.log('Get all users.');
    const users = await this.SVC.findAll();
    return users?.map((user) => this.MAP.userToDto(user));
  }

  /**
   * Gets the identified user
   *
   * @param id A user id
   * @returns A user DTO
   */
  @Get('/:id')
  async getOne(@Param('id') id: string): Promise<UserDto> {
    this.LOGGER.log(`Get user with id=${id}.`);
    const user = await this.SVC.findOneById(id);

    if (!user) throw new NotFoundException('User does not exist.');

    return this.MAP.userToDto(user);
  }

  /**
   * Updates the identified user
   *
   * @param id A user id
   * @param updates A user-update DTO
   */
  @Patch('/:id')
  async updateOne(
    @Param('id') id: string,
    @Body() updates: UserUpdateDto
  ): Promise<void> {
    this.LOGGER.log(
      `Update user with id=${id}, updates=${JSON.stringify(updates)}.`
    );
    await this.SVC.update(id, updates);
  }

  /**
   * Deletes the identified user
   *
   * @param id A user id
   */
  @Delete('/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOne(@Param('id') id: string): Promise<void> {
    this.LOGGER.log(`Delete user with id=${id}.`);
    await this.SVC.delete(id);
  }
}
