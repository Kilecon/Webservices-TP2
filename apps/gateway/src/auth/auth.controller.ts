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
import { lastValueFrom } from 'rxjs';

import { USER_CLIENT } from '../common/grpc.js';
import { Public } from './auth.guard.js';

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
@Public()
export class AuthController implements OnModuleInit {
  private users!: UserServiceClient;

  constructor(@Inject(USER_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit(): void {
    this.users = this.client.getService<UserServiceClient>('UserService');
  }

  @Post('register')
  register(@Body() request: RegisterDto): Promise<User> {
    return lastValueFrom(this.users.register(request));
  }

  @Post('login')
  login(@Body() request: LoginDto): Promise<LoginResponse> {
    return lastValueFrom(this.users.login(request));
  }
}
