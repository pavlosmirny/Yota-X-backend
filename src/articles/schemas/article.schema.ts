import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Category, PREDEFINED_CATEGORIES } from '../../constants/categories';

@Schema()
class SeoMetadata {
  @Prop({ required: true })
  metaTitle: string;

  @Prop({ required: true })
  metaDescription: string;

  @Prop({ type: [String], required: true })
  metaKeywords: string[];
}

export type ArticleDocument = Article & Document;

@Schema({ timestamps: true })
export class Article {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: String,
    required: true,
    enum: PREDEFINED_CATEGORIES,
  })
  category: Category;

  @Prop({ required: true })
  author: string;

  @Prop({ default: false })
  published: boolean;

  @Prop()
  imageUrl: string;

  @Prop({ type: SeoMetadata, required: true })
  seo: SeoMetadata;

  @Prop({ type: Object, default: {} })
  relatedTags: { [key: string]: number };

  @Prop({ type: Object, default: {} })
  tagViews: { [key: string]: number };
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

// Составные индексы
ArticleSchema.index({ tags: 1, createdAt: -1 });
ArticleSchema.index({ tags: 1, published: 1 });
ArticleSchema.index({ category: 1, published: 1 }); // Обновленный индекс для категорий

export interface ArticleModel extends Document {
  title: string;
  slug: string;
  content: string;
  description: string;
  tags: string[];
  category: Category;
  author: string;
  published: boolean;
  imageUrl?: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  relatedTags: { [key: string]: number };
  tagViews: { [key: string]: number };
}
