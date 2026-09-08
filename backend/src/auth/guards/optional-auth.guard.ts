import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { AuthPayload } from '../interfaces/auth.interface';

/**
 * OptionalAuthGuard — reads JWT from Authorization header if present.
 *
 * If the token is valid, attaches `req.user = { sub, email }`.
 * If the token is missing or invalid, the request continues
 * WITHOUT error — auth is optional for most endpoints.
 *
 * Per auth-and-tiers.md: "login should feel optional, not gated."
 */
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  private readonly logger = new Logger(OptionalAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      // No token — that's fine, continue as anonymous
      return true;
    }

    const token = authHeader.slice(7);

    try {
      const payload = this.jwtService.verify<AuthPayload>(token);
      // Attach user info to request for downstream handlers
      (request as Request & { user?: AuthPayload }).user = payload;
    } catch {
      // Invalid/expired token — continue as anonymous, don't block
      this.logger.debug('Invalid JWT token — continuing as anonymous.');
    }

    return true;
  }
}
