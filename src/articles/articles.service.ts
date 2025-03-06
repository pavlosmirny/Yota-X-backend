import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, FilterQuery } from 'mongoose';
import { Article, ArticleDocument } from './schemas/article.schema';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { PREDEFINED_CATEGORIES, Category } from '../constants/categories';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<ArticleDocument>,
  ) {}

  // Создание статьи
  async create(createArticleDto: CreateArticleDto): Promise<ArticleDocument> {
    try {
      const existingArticle = await this.articleModel
        .findOne({ slug: createArticleDto.slug })
        .exec();

      if (existingArticle) {
        throw new BadRequestException('Article with this slug already exists');
      }

      const createdArticle = new this.articleModel({
        ...createArticleDto,
        relatedTags: {},
        tagViews: {},
      });

      return await createdArticle.save();
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }

      if (err?.code === 11000) {
        throw new BadRequestException('Article with this slug already exists');
      }

      throw new InternalServerErrorException('Error creating article');
    }
  }

  // Получение всех статей с пагинацией и фильтрацией
  async findAll(query: {
    page?: number;
    limit?: number;
    published?: boolean;
    tag?: string;
    category?: Category;
    author?: string;
    searchTerm?: string;
  }): Promise<{
    articles: ArticleDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      published,
      tag,
      category,
      author,
      searchTerm,
    } = query;
    const filter: FilterQuery<ArticleDocument> = {};

    if (published !== undefined) {
      filter.published = published;
    }
    if (tag) {
      filter.tags = tag;
    }
    if (category && PREDEFINED_CATEGORIES.includes(category as Category)) {
      filter.category = category;
    }
    if (author) {
      filter.author = author;
    }
    if (searchTerm) {
      filter.$or = [
        { title: { $regex: searchTerm, $options: 'i' } },
        { content: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await Promise.all([
      this.articleModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.articleModel.countDocuments(filter).exec(),
    ]);

    return {
      articles,
      total,
      page: +page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Получение статьи по slug и обновление тегов
  async findOne(slug: string): Promise<ArticleDocument> {
    const article = await this.articleModel.findOne({ slug }).exec();

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const tagViews = article.tagViews || {};
    article.tags.forEach((tag) => {
      tagViews[tag] = (tagViews[tag] || 0) + 1;
    });

    article.tagViews = tagViews;
    await article.save();

    return article;
  }

  // Обновление статьи
  async update(
    currentSlug: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleDocument> {
    const category = updateArticleDto.category as Category;
    if (category && !PREDEFINED_CATEGORIES.includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    if (updateArticleDto.slug) {
      const existingArticle = await this.articleModel
        .findOne({
          slug: updateArticleDto.slug,
          _id: { $ne: (await this.findOne(currentSlug))._id },
        })
        .exec();

      if (existingArticle) {
        throw new BadRequestException('Article with this slug already exists');
      }
    }

    const updatedArticle = await this.articleModel
      .findOneAndUpdate({ slug: currentSlug }, updateArticleDto, { new: true })
      .exec();

    if (!updatedArticle) {
      throw new NotFoundException('Article not found');
    }

    return updatedArticle;
  }

  // Получение статей по категории
  async findByCategory(
    category: Category,
    limit = 10,
  ): Promise<ArticleDocument[]> {
    if (!PREDEFINED_CATEGORIES.includes(category)) {
      throw new BadRequestException('Invalid category');
    }

    return this.articleModel
      .find({ category, published: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
  }

  // Получение статистики по категориям
  async getCategoryStats(): Promise<
    Array<{ category: Category; count: number }>
  > {
    const categories = await this.articleModel.aggregate([
      { $match: { published: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $project: { category: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    return categories.map((stat) => ({
      category: stat.category as Category,
      count: stat.count,
    }));
  }

  // Удаление статьи
  async remove(slug: string): Promise<void> {
    const result = await this.articleModel.findOneAndDelete({ slug }).exec();
    if (!result) {
      throw new NotFoundException('Article not found');
    }
  }

  // Получение связанных статей
  async getRelatedArticles(
    slug: string,
    limit = 3,
  ): Promise<ArticleDocument[]> {
    const article = await this.findOne(slug);

    const relatedArticles = await this.articleModel
      .find({
        slug: { $ne: slug },
        published: true,
        category: article.category,
        tags: { $in: article.tags },
      })
      .exec();

    const articlesWithRelevance = relatedArticles.map((relatedArticle) => {
      const commonTags = relatedArticle.tags.filter((tag) =>
        article.tags.includes(tag),
      );
      const relevanceScore = commonTags.length / article.tags.length;
      return { article: relatedArticle, relevance: relevanceScore };
    });

    return articlesWithRelevance
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map((item) => item.article);
  }

  // Получение тегов с количеством
  async getTagsWithCount(): Promise<Array<{ tag: string; count: number }>> {
    const articles = await this.articleModel.find({ published: true }).exec();
    const tagCount: { [key: string]: number } = {};

    articles.forEach((article) => {
      article.tags.forEach((tag) => {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCount).map(([tag, count]) => ({
      tag,
      count,
    }));
  }

  // Получение популярных тегов
  async getPopularTags(
    limit = 5,
  ): Promise<Array<{ tag: string; views: number }>> {
    const articles = await this.articleModel.find({ published: true }).exec();
    const tagViews: { [key: string]: number } = {};

    articles.forEach((article) => {
      if (article.tagViews) {
        Object.entries(article.tagViews).forEach(([tag, views]) => {
          tagViews[tag] = (tagViews[tag] || 0) + views;
        });
      }
    });

    return Object.entries(tagViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, views]) => ({ tag, views }));
  }

  // Обновление связанных тегов
  private async updateRelatedTags(article: ArticleDocument): Promise<void> {
    const relatedArticles = await this.articleModel
      .find({
        slug: { $ne: article.slug },
        category: article.category,
        tags: { $in: article.tags },
      })
      .exec();

    const tagRelations: { [key: string]: number } = {};

    relatedArticles.forEach((relatedArticle) => {
      relatedArticle.tags.forEach((tag) => {
        if (!article.tags.includes(tag)) {
          tagRelations[tag] = (tagRelations[tag] || 0) + 1;
        }
      });
    });

    article.relatedTags = Object.fromEntries(
      Object.entries(tagRelations)
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => [tag, count / relatedArticles.length]),
    );

    await article.save();
  }
}
