import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { config } from './config.js';
import { UserController } from './user.controller.js';
import { User, UserSchema } from './user.schema.js';

@Module({
  imports: [
    MongooseModule.forRoot(config.mongoUrl, { dbName: 'users' }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
})
export class AppModule {}
