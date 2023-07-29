import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/core/entity/user.entity';
import { UserCreateDto } from 'src/core/dto/user-create.dto';
import { randomUUID } from 'crypto';

const JWT_SVC = new JwtService();
const CONFIG = new ConfigService();

/**
 * Options for the {@link getAccessToken} function
 */
export interface GetAccessTokenOptions {
  /**
   * The userId of an authorized user
   *
   * @default A randomly generated UUID
   */
  sub?: string;
  /**
   * The username of an authorized user
   *
   * @default 'test-username'
   */
  username?: string;
  /**
   * The secret used to generate the access token
   *
   * @default JWT_ACCESS_SECRET env value or 'XYZ'
   */
  secret?: string;
  /**
   * The expiration of the access token in seconds
   *
   * @default '5m'
   */
  expiresIn?: string;
}

/**
 * Defaults for the {@link GetAccessTokenOptions} object
 */
export const ACCESS_TOKEN_DEFAULTS: GetAccessTokenOptions = {
  username: 'test-username',
  secret: CONFIG.get('JWT_ACCESS_SECRET') ?? 'XYZ',
  expiresIn: '5m'
};

/**
 * Creates a JSON Web Token (JWT) for use in tests
 *
 * @param options {@link GetAccessTokenOptions}
 * @returns A JWT
 */
export async function getAccessToken(
  options?: GetAccessTokenOptions
): Promise<string> {
  const sub = options?.sub ?? randomUUID();
  const username = options?.username ?? ACCESS_TOKEN_DEFAULTS.username;
  const secret = options?.secret ?? ACCESS_TOKEN_DEFAULTS.secret;
  const expiresIn = options?.expiresIn ?? ACCESS_TOKEN_DEFAULTS.expiresIn;

  return JWT_SVC.signAsync({ sub, username }, { secret, expiresIn });
}

/**
 * Default user-create DTO for the {@link signUp} function
 */
export const SIGNUP_USER_DEFAULTS = {
  username: ACCESS_TOKEN_DEFAULTS.username,
  email: `${ACCESS_TOKEN_DEFAULTS.username}@email.com`
};

/**
 * The return type of the {@link signUp} function
 */
export interface SignUpResult {
  accessToken: string;
  user: User;
}

/**
 * Creates a new user in the database. If a user-create DTO is not provided,
 * defaults to {@link SIGNUP_USER_DEFAULTS}
 *
 * @param app A nest application
 * @param dto A user-create DTO (optional)
 * @returns A {@link SignUpResult}
 */
export async function signUp(
  app: INestApplication,
  dto: UserCreateDto = SIGNUP_USER_DEFAULTS
): Promise<SignUpResult> {
  const accessToken = await getAccessToken(dto);

  const { body: userDto } = await request(app.getHttpServer())
    .post('/api/users')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(dto);

  const user: User = {
    ...userDto,
    createDate: expect.any(Date),
    updateDate: expect.any(Date)
  };

  return { accessToken, user };
}
