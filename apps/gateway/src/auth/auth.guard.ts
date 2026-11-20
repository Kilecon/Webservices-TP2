import type { Request } from 'express';

import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { jwtVerify } from 'jose';

import { config } from '../config.js';

const IS_PUBLIC = 'isPublic';

export const Public = () => SetMetadata(IS_PUBLIC, true);

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

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
      request.user = { id: payload.sub };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
