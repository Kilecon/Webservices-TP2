import type { Response } from 'express';

import { status } from '@grpc/grpc-js';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/** gRPC status of the services -> HTTP status of the public API */
const HTTP_STATUS: Partial<Record<status, number>> = {
  [status.ALREADY_EXISTS]: 409,
  [status.INVALID_ARGUMENT]: 400,
  [status.NOT_FOUND]: 404,
  [status.PERMISSION_DENIED]: 403,
  [status.UNAUTHENTICATED]: 401,
  [status.UNAVAILABLE]: 503,
};

interface GrpcFailure {
  code: status;
  message?: string;
}

@Catch()
export class ErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());

      return;
    }

    const failure = isGrpcFailure(exception) ? exception : undefined;
    const statusCode =
      failure === undefined
        ? HttpStatus.INTERNAL_SERVER_ERROR
        : (HTTP_STATUS[failure.code] ?? HttpStatus.INTERNAL_SERVER_ERROR);

    response.status(statusCode).json({
      message: failure?.message ?? 'Internal server error',
      statusCode,
    });
  }
}

function isGrpcFailure(exception: unknown): exception is GrpcFailure {
  return (
    typeof exception === 'object' &&
    exception !== null &&
    'code' in exception &&
    typeof exception.code === 'number'
  );
}
