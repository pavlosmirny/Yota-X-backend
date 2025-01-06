import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ArticlesService } from './articles.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

@ApiTags('articles')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new article' })
  @ApiResponse({
    status: 201,
    description: 'Article successfully created.',
  })
  create(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all articles with pagination and filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  @ApiQuery({ name: 'tag', required: false, type: String })
  @ApiQuery({ name: 'author', required: false, type: String })
  @ApiQuery({ name: 'searchTerm', required: false, type: String })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('published') published?: boolean,
    @Query('tag') tag?: string,
    @Query('author') author?: string,
    @Query('searchTerm') searchTerm?: string,
  ) {
    return this.articlesService.findAll({
      page,
      limit,
      published,
      tag,
      author,
      searchTerm,
    });
  }

  @Get('tags')
  @ApiOperation({ summary: 'Get all tags with usage count' })
  getTagsWithCount() {
    return this.articlesService.getTagsWithCount();
  }

  @Get('tags/popular')
  @ApiOperation({ summary: 'Get popular tags based on views' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getPopularTags(@Query('limit') limit?: number) {
    return this.articlesService.getPopularTags(limit);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get article by slug' })
  @ApiResponse({
    status: 200,
    description: 'Returns the article',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  findOne(@Param('slug') slug: string) {
    return this.articlesService.findOne(slug);
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'Get related articles based on tags' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'Returns related articles',
  })
  getRelatedArticles(
    @Param('slug') slug: string,
    @Query('limit') limit?: number,
  ) {
    return this.articlesService.getRelatedArticles(slug, limit);
  }

  @Patch(':slug')
  @ApiOperation({ summary: 'Update article' })
  @ApiResponse({
    status: 200,
    description: 'Article successfully updated',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  update(
    @Param('slug') slug: string,
    @Body() updateArticleDto: UpdateArticleDto,
  ) {
    return this.articlesService.update(slug, updateArticleDto);
  }

  @Delete(':slug')
  @ApiOperation({ summary: 'Delete article' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'Article successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'Article not found',
  })
  remove(@Param('slug') slug: string) {
    return this.articlesService.remove(slug);
  }
}
