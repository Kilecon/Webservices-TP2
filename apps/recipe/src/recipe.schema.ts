import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class Recipe {
  @Prop({ required: true })
  ownerId!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, type: [String] })
  ingredients!: string[];

  @Prop({ required: true, type: [String] })
  steps!: string[];

  createdAt!: Date;
}

export const RecipeSchema = SchemaFactory.createForClass(Recipe);
