import { Request } from 'express';

/**
 * Represents an HTTP request with user information
 */
export class AuthRequest extends Request {
  user: {
    sub: string;
  };
}
