import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const JWT_SVC = new JwtService();
const CONFIG = new ConfigService();

/**
 * Options for the {@link getAccessToken} function
 */
export interface GetAccessTokenOptions {
  /**
   * @default 'test-sub'
   */
  sub?: string;
  /**
   * @default 'test-username'
   */
  username?: string;
  /**
   * @default JWT_ACCESS_SECRET env value or 'XYZ'
   */
  secret?: string;
  /**
   * @default '5m'
   */
  expiresIn?: string;
}

/**
 * Defaults for the {@link GetAccessTokenOptions} object
 */
export const ACCESS_TOKEN_DEFAULTS: GetAccessTokenOptions = {
  sub: 'test-sub',
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
  const sub = options?.sub ?? ACCESS_TOKEN_DEFAULTS.sub;
  const username = options?.username ?? ACCESS_TOKEN_DEFAULTS.username;
  const secret = options?.secret ?? ACCESS_TOKEN_DEFAULTS.secret;
  const expiresIn = options?.expiresIn ?? ACCESS_TOKEN_DEFAULTS.expiresIn;

  return JWT_SVC.signAsync({ sub, username }, { secret, expiresIn });
}
