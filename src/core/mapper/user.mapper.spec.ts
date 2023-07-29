import { Test, TestingModule } from '@nestjs/testing';
import { UserMapper } from './user.mapper';
import { randomUUID } from 'crypto';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { UserCreateDto } from '../dto/user-create.dto';

describe('UserMapper', () => {
  let map: UserMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserMapper]
    }).compile();

    map = module.get<UserMapper>(UserMapper);
  });

  describe('userToDto()', () => {
    it('should convert a User to UserDto', () => {
      const user: User = {
        id: randomUUID(),
        username: 'username',
        email: 'username@email.com',
        createDate: new Date(),
        updateDate: new Date()
      };
      const dto: UserDto = {
        id: user.id,
        username: user.username,
        email: user.email
      };
      const actual = map.userToDto(user);
      expect(actual).toEqual(dto);
    });
  });

  describe('createToUser()', () => {
    it('should convert a UserCreateDto to User', () => {
      const dto: UserCreateDto = {
        username: 'username',
        email: 'username@email.com'
      };
      const user = new User();
      user.id = randomUUID();
      user.username = dto.username;
      user.email = dto.email;

      const actual = map.createToUser(user.id, dto);
      expect(actual).toEqual(user);
    });
  });
});
