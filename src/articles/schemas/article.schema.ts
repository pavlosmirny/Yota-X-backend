import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

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

@Schema()
export class Article {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [], index: true }) // Добавляем индекс для тегов
  tags: string[];

  @Prop({ required: true })
  author: string;

  @Prop({ default: false })
  published: boolean;

  @Prop()
  imageUrl: string;

  @Prop({ type: SeoMetadata, required: true })
  seo: SeoMetadata;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;

  // Добавляем поле для связанных тегов и их весов
  @Prop({ type: Map, of: Number, default: new Map() })
  relatedTags: Map<string, number>;

  // Добавляем поле для хранения счетчика просмотров по тегам
  @Prop({ type: Map, of: Number, default: new Map() })
  tagViews: Map<string, number>;
}

export const ArticleSchema = SchemaFactory.createForClass(Article);

// Добавляем составной индекс для поиска по тегам и дате публикации
ArticleSchema.index({ tags: 1, createdAt: -1 });

// Добавляем индекс для поиска похожих статей
ArticleSchema.index({ tags: 1, published: 1 });

export interface ArticleModel extends Document {
  title: string;
  slug: string;
  content: string;
  description: string;
  tags: string[];
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
  relatedTags: Map<string, number>;
  tagViews: Map<string, number>;
}
