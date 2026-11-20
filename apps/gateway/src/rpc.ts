import type { Observable } from 'rxjs';

import { status } from '@grpc/grpc-js';
import {
  BadGatewayException,
  ConflictException,
  ForbiddenException,
  type HttpException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

interface GrpcFailure {
  code: status;
  message?: string;
}

export async function rpc<T>(call: Observable<T>): Promise<T> {
  try {
    return await lastValueFrom(call);
  } catch (error: unknown) {
    throw toHttpError(error);
  }
}

function toHttpError(error: unknown): HttpException {
  const failure = isGrpcFailure(error) ? error : undefined;
  const message = failure?.message ?? 'Upstream service failure';

  switch (failure?.code) {
    case status.UNAUTHENTICATED: {
      return new UnauthorizedException(message);
    }
    case status.PERMISSION_DENIED: {
      return new ForbiddenException(message);
    }
    case status.NOT_FOUND: {
      return new NotFoundException(message);
    }
    case status.ALREADY_EXISTS: {
      return new ConflictException(message);
    }
    default: {
      return new BadGatewayException(message);
    }
  }
}

function isGrpcFailure(error: unknown): error is GrpcFailure {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  const { code } = error;

  return typeof code === 'number';
}
