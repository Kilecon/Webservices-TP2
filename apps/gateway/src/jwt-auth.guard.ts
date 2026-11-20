import type { Request } from 'express';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { jwtVerify } from 'jose';

import { config } from './config.js';

export interface AuthenticatedRequest extends Request {
  userId: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const token =
      typeof authorization === 'string'
        ? /^Bearer (.+)$/i.exec(authorization)?.[1]
        : undefined;
    if (!token) throw new UnauthorizedException('Missing bearer token');

    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(config.jwtSecret),
        { algorithms: ['HS256'] },
      );
      if (!payload.sub)
        throw new UnauthorizedException('Invalid token subject');
      request.userId = payload.sub;

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
