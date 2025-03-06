import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PREDEFINED_CATEGORIES } from '../../constants/categories';

export class SeoMetadataDto {
  @ApiProperty({
    example: 'Understanding DevOps - Complete Guide',
    description: 'Meta title for SEO',
  })
  @IsString()
  @IsNotEmpty()
  metaTitle: string;

  @ApiProperty({
    example: 'Learn everything about DevOps practices and principles',
    description: 'Meta description for SEO',
  })
  @IsString()
  @IsNotEmpty()
  metaDescription: string;

  @ApiProperty({
    example: ['devops', 'automation', 'development'],
    description: 'Meta keywords for SEO',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  metaKeywords: string[];
}

export class CreateArticleDto {
  @ApiProperty({
    example: 'Understanding DevOps',
    description: 'The title of the article',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'understanding-devops',
    description: 'URL-friendly version of the title',
  })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({
    example: 'Comprehensive content about DevOps...',
    description: 'The main content of the article',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    example: 'A brief overview of DevOps principles and practices',
    description: 'Short description of the article',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: ['devops', 'automation', 'ci-cd'],
    description: 'Tags related to the article',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags: string[];

  @ApiProperty({
    enum: PREDEFINED_CATEGORIES,
    example: 'DevOps',
    description: 'Category of the article',
  })
  @IsEnum(PREDEFINED_CATEGORIES, {
    message: 'Category must be one of the predefined categories',
  })
  @IsNotEmpty()
  category: (typeof PREDEFINED_CATEGORIES)[number];

  @ApiProperty({
    example: 'John Doe',
    description: 'Author of the article',
  })
  @IsString()
  @IsNotEmpty()
  author: string;

  @ApiProperty({
    example: false,
    description: 'Whether the article is published',
  })
  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @ApiProperty({
    example: 'https://example.com/image.jpg',
    description: "URL of the article's main image",
  })
  @IsUrl()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({
    type: SeoMetadataDto,
    description: 'SEO metadata for the article',
  })
  @ValidateNested()
  @Type(() => SeoMetadataDto)
  seo: SeoMetadataDto;
}

// DTO для ответа с дополнительными полями
export class ArticleResponseDto extends CreateArticleDto {
  @ApiProperty({
    example: { javascript: 0.8, typescript: 0.6 },
    description: 'Related tags with their relevance scores',
  })
  relatedTags: Record<string, number>;

  @ApiProperty({
    example: { javascript: 150, typescript: 100 },
    description: 'View count per tag',
  })
  tagViews: Record<string, number>;

  @ApiProperty({
    example: '2024-01-04T12:00:00.000Z',
    description: 'Article creation date',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-04T12:00:00.000Z',
    description: 'Article last update date',
  })
  updatedAt: Date;
}
