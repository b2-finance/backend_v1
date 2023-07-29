import { Injectable } from '@nestjs/common';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { UserCreateDto } from '../dto/user-create.dto';

/**
 * Maps between user entities and DTOs
 */
@Injectable()
export class UserMapper {
  /**
   * Converts a user entity to a user DTO
   *
   * @param user A user
   * @returns A user DTO
   */
  userToDto(user: User): UserDto {
    return {
      id: user.id,
      username: user.username,
      email: user.email
    };
  }

  /**
   * Converts a user-create DTO to a user
   *
   * @param id A user id
   * @param dto A user-create DTO
   * @returns A user
   */
  createToUser(id: string, dto: UserCreateDto): User {
    const user = new User();
    user.id = id;
    user.username = dto.username;
    user.email = dto.email;
    return user;
  }
}
