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
        relatedTags: new Map(),
        tagViews: new Map(),
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
    author?: string;
    searchTerm?: string;
  }): Promise<{
    articles: ArticleDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10, published, tag, author, searchTerm } = query;
    const filter: FilterQuery<ArticleDocument> = {};

    if (published !== undefined) {
      filter.published = published;
    }
    if (tag) {
      filter.tags = tag;
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

    // Обновляем счетчики просмотров для тегов
    const tagViews = new Map(article.tagViews);
    article.tags.forEach((tag) => {
      const currentViews = tagViews.get(tag) || 0;
      tagViews.set(tag, currentViews + 1);
    });

    // Обновляем статью с новыми данными просмотров
    article.tagViews = tagViews;
    await article.save();

    return article;
  }

  // Обновление статьи
  async update(
    currentSlug: string,
    updateArticleDto: UpdateArticleDto,
  ): Promise<ArticleDocument> {
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

  // Удаление статьи
  async remove(slug: string): Promise<void> {
    const result = await this.articleModel.findOneAndDelete({ slug }).exec();
    if (!result) {
      throw new NotFoundException('Article not found');
    }
  }

  // Получение связанных статей по тегам
  async getRelatedArticles(
    slug: string,
    limit = 3,
  ): Promise<ArticleDocument[]> {
    const article = await this.findOne(slug);

    // Получаем все статьи с похожими тегами
    const relatedArticles = await this.articleModel
      .find({
        slug: { $ne: slug },
        published: true,
        tags: { $in: article.tags },
      })
      .exec();

    // Рассчитываем релевантность для каждой статьи
    const articlesWithRelevance = relatedArticles.map((relatedArticle) => {
      const commonTags = relatedArticle.tags.filter((tag) =>
        article.tags.includes(tag),
      );
      const relevanceScore = commonTags.length / article.tags.length;
      return { article: relatedArticle, relevance: relevanceScore };
    });

    // Сортируем по релевантности и ограничиваем количество
    return articlesWithRelevance
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit)
      .map((item) => item.article);
  }

  // Получение всех тегов с количеством использований
  async getTagsWithCount(): Promise<Array<{ tag: string; count: number }>> {
    const articles = await this.articleModel.find({ published: true }).exec();
    const tagCount = new Map<string, number>();

    articles.forEach((article) => {
      article.tags.forEach((tag) => {
        tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
      });
    });

    return Array.from(tagCount.entries()).map(([tag, count]) => ({
      tag,
      count,
    }));
  }

  // Получение популярных тегов на основе просмотров
  async getPopularTags(
    limit = 5,
  ): Promise<Array<{ tag: string; views: number }>> {
    const articles = await this.articleModel.find({ published: true }).exec();

    const tagViews = new Map<string, number>();

    articles.forEach((article) => {
      article.tagViews.forEach((views, tag) => {
        tagViews.set(tag, (tagViews.get(tag) || 0) + views);
      });
    });

    return Array.from(tagViews.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, views]) => ({ tag, views }));
  }

  // Обновление связанных тегов
  private async updateRelatedTags(article: ArticleDocument): Promise<void> {
    const relatedArticles = await this.articleModel
      .find({
        slug: { $ne: article.slug },
        tags: { $in: article.tags },
      })
      .exec();

    const tagRelations = new Map<string, number>();

    relatedArticles.forEach((relatedArticle) => {
      relatedArticle.tags.forEach((tag) => {
        if (!article.tags.includes(tag)) {
          tagRelations.set(tag, (tagRelations.get(tag) || 0) + 1);
        }
      });
    });

    article.relatedTags = new Map(
      Array.from(tagRelations.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([tag, count]) => [tag, count / relatedArticles.length]),
    );

    await article.save();
  }
}
