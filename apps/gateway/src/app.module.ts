import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { grpcOptions } from '@recipes/contracts/grpc';

import { AuthController } from './auth.controller.js';
import { config } from './config.js';
import { HealthController } from './health.controller.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { RecipeController } from './recipe.controller.js';

@Module({
  imports: [
    ClientsModule.register([
      {
        ...grpcOptions('user', config.userGrpcUrl),
        name: 'USER_SERVICE',
      },
      {
        ...grpcOptions('recipe', config.recipeGrpcUrl),
        name: 'RECIPE_SERVICE',
      },
    ]),
  ],
  controllers: [AuthController, HealthController, RecipeController],
  providers: [JwtAuthGuard],
})
export class AppModule {}
