import type { ClientGrpc } from '@nestjs/microservices';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  User,
  UserServiceClient,
} from '@recipes/contracts';

import {
  Body,
  Controller,
  Inject,
  type OnModuleInit,
  Post,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

import { rpc } from './rpc.js';

class RegisterDto implements RegisterRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

class LoginDto implements LoginRequest {
  @IsEmail()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}

@Controller('auth')
export class AuthController implements OnModuleInit {
  private users!: UserServiceClient;

  constructor(
    @Inject('USER_SERVICE')
    private readonly userClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.users = this.userClient.getService<UserServiceClient>('UserService');
  }

  @Post('register')
  register(@Body() request: RegisterDto): Promise<User> {
    return rpc(this.users.register(request));
  }

  @Post('login')
  login(@Body() request: LoginDto): Promise<LoginResponse> {
    return rpc(this.users.login(request));
  }
}
