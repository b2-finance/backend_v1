import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { LogService } from 'src/log/log.service';
import { JwtService } from '@nestjs/jwt';
import { UserController } from './user.controller';
import { UserService } from '../service/user.service';
import { UserMapper } from '../mapper/user.mapper';
import { User } from '../entity/user.entity';
import { UserDto } from '../dto/user.dto';
import { UserCreateDto } from '../dto/user-create.dto';
import { UserUpdateDto } from '../dto/user-update.dto';
import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { AuthRequest } from 'src/auth/auth-request.dto';

describe('UserController', () => {
  let con: UserController;
  let svc: UserService;
  let map: UserMapper;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        ConfigService,
        LogService,
        JwtService,
        {
          provide: UserService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOneById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
          }
        },
        {
          provide: UserMapper,
          useValue: {
            userToDto: jest.fn(),
            createToUser: jest.fn()
          }
        }
      ]
    }).compile();

    con = module.get<UserController>(UserController);
    svc = module.get<UserService>(UserService);
    map = module.get<UserMapper>(UserMapper);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('createOne()', () => {
    it('should call svc.create with correct arguments', async () => {
      const request = {
        user: { sub: randomUUID(), username: 'username' }
      };
      const user = new User();
      jest.spyOn(map, 'createToUser').mockReturnValue(user);
      await con.createOne(request as AuthRequest, new UserCreateDto());
      expect(svc.create).toHaveBeenCalledWith(user);
    });

    it('should call map.userToDto with correct arguments', async () => {
      const request = {
        user: { sub: randomUUID(), username: 'username' }
      };
      const dto = new UserCreateDto();
      const user = new User();
      jest.spyOn(svc, 'create').mockResolvedValue(user);
      await con.createOne(request as AuthRequest, dto);
      expect(map.userToDto).toHaveBeenCalledWith(user);
    });

    it('should return a UserDto', async () => {
      const request = {
        user: { sub: randomUUID(), username: 'username' }
      };
      const dto = new UserDto();
      jest.spyOn(map, 'userToDto').mockReturnValue(dto);
      const actual = await con.createOne(
        request as AuthRequest,
        new UserCreateDto()
      );
      expect(actual).toEqual(dto);
    });
  });

  describe('getAll()', () => {
    it('should call svc.findAll', async () => {
      await con.getAll();
      expect(svc.findAll).toHaveBeenCalled();
    });

    it('should call map.userToDto with correct arguments', async () => {
      const user = new User();
      jest.spyOn(svc, 'findAll').mockResolvedValue([user]);
      await con.getAll();
      expect(map.userToDto).toHaveBeenCalledWith(user);
    });

    it('should call map.userToDto the correct number of times', async () => {
      const user = new User();
      const users = [user, user];
      jest.spyOn(svc, 'findAll').mockResolvedValue(users);
      await con.getAll();
      expect(map.userToDto).toHaveBeenCalledTimes(users.length);
    });

    it('should return a list of UserDtos', async () => {
      const user = new User();
      const dto = new UserDto();
      jest.spyOn(svc, 'findAll').mockResolvedValue([user, user]);
      jest.spyOn(map, 'userToDto').mockReturnValue(dto);
      const actual = await con.getAll();
      expect(actual).toEqual([dto, dto]);
    });
  });

  describe('getOne()', () => {
    it('should call svc.findOneById with correct arguments', async () => {
      const id = randomUUID();
      jest.spyOn(svc, 'findOneById').mockResolvedValue(new User());
      await con.getOne(id);
      expect(svc.findOneById).toHaveBeenCalledWith(id);
    });

    it('should call map.userToDto with correct arguments', async () => {
      const user = new User();
      jest.spyOn(svc, 'findOneById').mockResolvedValue(user);
      await con.getOne(randomUUID());
      expect(map.userToDto).toHaveBeenCalledWith(user);
    });

    it('should return a UserDto', async () => {
      const user = new User();
      const dto = new UserDto();
      jest.spyOn(svc, 'findOneById').mockResolvedValue(user);
      jest.spyOn(map, 'userToDto').mockReturnValue(dto);
      const actual = await con.getOne(randomUUID());
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
    it('should call svc.update with correct arguments', async () => {
      const id = randomUUID();
      const updates: UserUpdateDto = { username: 'username' };
      await con.updateOne(id, updates);
      expect(svc.update).toHaveBeenCalledWith(id, updates);
    });
  });

  describe('deleteOne()', () => {
    it('should call svc.delete with correct arguments', async () => {
      const id = randomUUID();
      await con.deleteOne(id);
      expect(svc.delete).toHaveBeenCalledWith(id);
    });
  });
});
