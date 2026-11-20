import type {
  GetUsersRequest,
  GetUsersResponse,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User as UserMessage,
} from '@recipes/contracts';

import { status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { rpcError } from '@recipes/contracts/grpc';
import { SignJWT } from 'jose';
import {
  type HydratedDocument,
  isValidObjectId,
  type Model,
} from 'mongoose';

import { config } from './config.js';
import { hashPassword, verifyPassword } from './password.js';
import { User } from './user.schema.js';

type UserDocument = HydratedDocument<User>;

@Controller()
export class UserController {
  constructor(
    @InjectModel(User.name)
    private readonly users: Model<User>,
  ) {}

  @GrpcMethod('UserService', 'Register')
  async register(request: RegisterRequest): Promise<UserMessage> {
    const existing = await this.users.exists({ email: request.email }).exec();
    if (existing) {
      throw rpcError(status.ALREADY_EXISTS, 'Email already registered');
    }

    const user = await this.users.create({
      email: request.email,
      name: request.name,
      passwordHash: await hashPassword(request.password),
    });

    return toUserMessage(user);
  }

  @GrpcMethod('UserService', 'Login')
  async login({ email, password }: LoginRequest): Promise<LoginResponse> {
    const user = await this.users.findOne({ email }).exec();
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw rpcError(status.UNAUTHENTICATED, 'Invalid credentials');
    }

    const token = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(config.tokenTtl)
      .sign(new TextEncoder().encode(config.jwtSecret));

    return { token, user: toUserMessage(user) };
  }

  @GrpcMethod('UserService', 'GetUsers')
  async getUsers({ ids }: GetUsersRequest): Promise<GetUsersResponse> {
    const users = await this.users.find({
      _id: { $in: ids.filter((id) => isValidObjectId(id)) },
    });

    return { users: users.map((user) => toUserMessage(user)) };
  }
}

function toUserMessage(user: UserDocument): UserMessage {
  return {
    email: user.email,
    id: user.id,
    name: user.name,
  };
}
