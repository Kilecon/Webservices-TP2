import type { ClientGrpc } from '@nestjs/microservices';
import type {
  CreateRecipeRequest,
  Recipe,
  RecipeServiceClient,
  User,
  UserServiceClient,
} from '@recipes/contracts';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  type OnModuleInit,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { userMetadata } from '@recipes/contracts/grpc';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { type AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard.js';
import { rpc } from './rpc.js';

class CreateRecipeDto implements CreateRecipeRequest {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ingredients!: string[];

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  steps!: string[];
}

class ListRecipesQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

interface RestRecipe extends Recipe {
  author: null | Pick<User, 'id' | 'name'>;
}

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipeController implements OnModuleInit {
  private recipes!: RecipeServiceClient;
  private users!: UserServiceClient;

  constructor(
    @Inject('RECIPE_SERVICE')
    private readonly recipeClient: ClientGrpc,
    @Inject('USER_SERVICE')
    private readonly userClient: ClientGrpc,
  ) {}

  onModuleInit(): void {
    this.recipes =
      this.recipeClient.getService<RecipeServiceClient>('RecipeService');
    this.users = this.userClient.getService<UserServiceClient>('UserService');
  }

  @Get()
  async list(
    @Query() { limit }: ListRecipesQuery,
    @Req() request: AuthenticatedRequest,
  ): Promise<RestRecipe[]> {
    const { recipes } = await rpc(
      this.recipes.listRecipes(
        { limit: limit ?? 0 },
        userMetadata(request.userId),
      ),
    );

    return this.withAuthors(recipes);
  }

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<RestRecipe> {
    const recipe = await rpc(
      this.recipes.getRecipe({ id }, userMetadata(request.userId)),
    );
    const [result] = await this.withAuthors([recipe]);

    return result;
  }

  @Post()
  async create(
    @Body() input: CreateRecipeDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<RestRecipe> {
    const recipe = await rpc(
      this.recipes.createRecipe(input, userMetadata(request.userId)),
    );
    const [result] = await this.withAuthors([recipe]);

    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<void> {
    await rpc(this.recipes.deleteRecipe({ id }, userMetadata(request.userId)));
  }

  private async withAuthors(recipes: Recipe[]): Promise<RestRecipe[]> {
    if (recipes.length === 0) return [];

    const ids = [...new Set(recipes.map(({ ownerId }) => ownerId))];
    const { users } = await rpc(this.users.getUsers({ ids }));
    const authors = new Map(users.map((user) => [user.id, user]));

    return recipes.map((recipe) => {
      const user = authors.get(recipe.ownerId);

      return {
        ...recipe,
        author: user ? { id: user.id, name: user.name } : null,
      };
    });
  }
}
