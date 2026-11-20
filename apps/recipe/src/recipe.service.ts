import type {
  CreateRecipeRequest,
  Empty,
  ListRecipesRequest,
  ListRecipesResponse,
  RecipeIdRequest,
  Recipe as RecipeMessage,
} from '@recipes/contracts';

import { type Metadata, status } from '@grpc/grpc-js';
import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { requireUserId, rpcError } from '@recipes/contracts/grpc';
import { type HydratedDocument, isValidObjectId, Model } from 'mongoose';

import { Recipe } from './recipe.schema.js';

type RecipeDocument = HydratedDocument<Recipe>;

@Controller()
export class RecipeService {
  constructor(
    @InjectModel(Recipe.name)
    private readonly recipes: Model<Recipe>,
  ) {}

  @GrpcMethod('RecipeService', 'ListRecipes')
  async listRecipes(
    { limit }: ListRecipesRequest,
    metadata: Metadata,
  ): Promise<ListRecipesResponse> {
    requireUserId(metadata);
    const query = this.recipes.find().sort({ createdAt: -1 });
    if (limit > 0) query.limit(Math.floor(limit));

    const recipes = await query.exec();

    return { recipes: recipes.map((recipe) => toRecipeMessage(recipe)) };
  }

  @GrpcMethod('RecipeService', 'GetRecipe')
  async getRecipe(
    { id }: RecipeIdRequest,
    metadata: Metadata,
  ): Promise<RecipeMessage> {
    requireUserId(metadata);

    return toRecipeMessage(await this.findRecipe(id));
  }

  @GrpcMethod('RecipeService', 'CreateRecipe')
  async createRecipe(
    request: CreateRecipeRequest,
    metadata: Metadata,
  ): Promise<RecipeMessage> {
    const ownerId = requireUserId(metadata);
    const recipe = await this.recipes.create({ ...request, ownerId });

    return toRecipeMessage(recipe);
  }

  @GrpcMethod('RecipeService', 'DeleteRecipe')
  async deleteRecipe(
    { id }: RecipeIdRequest,
    metadata: Metadata,
  ): Promise<Empty> {
    const userId = requireUserId(metadata);
    const recipe = await this.findRecipe(id);
    if (recipe.ownerId !== userId) {
      throw rpcError(status.PERMISSION_DENIED, 'Not the recipe owner');
    }

    await recipe.deleteOne();

    return {};
  }

  private async findRecipe(id: string): Promise<RecipeDocument> {
    if (!isValidObjectId(id)) {
      throw rpcError(status.NOT_FOUND, 'Recipe not found');
    }

    const recipe = await this.recipes.findById(id).exec();
    if (!recipe) throw rpcError(status.NOT_FOUND, 'Recipe not found');

    return recipe;
  }
}

function toRecipeMessage(recipe: RecipeDocument): RecipeMessage {
  return {
    createdAt: recipe.createdAt.toISOString(),
    id: recipe.id,
    ingredients: recipe.ingredients,
    ownerId: recipe.ownerId,
    steps: recipe.steps,
    title: recipe.title,
  };
}
