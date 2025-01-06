// positions.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PositionsService } from './positions.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@ApiTags('positions')
@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new position' })
  @ApiResponse({
    status: 201,
    description: 'Position has been created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createPositionDto: CreatePositionDto) {
    return this.positionsService.create(createPositionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all positions' })
  @ApiQuery({
    name: 'department',
    required: false,
    description: 'Filter by department',
  })
  @ApiResponse({ status: 200, description: 'Return all positions.' })
  findAll(@Query('department') department?: string) {
    return this.positionsService.findAll(department);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search positions' })
  @ApiQuery({ name: 'q', required: true, description: 'Search query' })
  @ApiResponse({ status: 200, description: 'Return found positions.' })
  search(@Query('q') searchText: string) {
    return this.positionsService.search(searchText);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a position by id' })
  @ApiResponse({ status: 200, description: 'Return the position.' })
  @ApiResponse({ status: 404, description: 'Position not found.' })
  findOne(@Param('id') id: string) {
    return this.positionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a position' })
  @ApiResponse({
    status: 200,
    description: 'Position has been updated successfully.',
  })
  @ApiResponse({ status: 404, description: 'Position not found.' })
  update(
    @Param('id') id: string,
    @Body() updatePositionDto: UpdatePositionDto,
  ) {
    return this.positionsService.update(id, updatePositionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a position' })
  @ApiResponse({
    status: 200,
    description: 'Position has been deleted successfully.',
  })
  @ApiResponse({ status: 404, description: 'Position not found.' })
  remove(@Param('id') id: string) {
    return this.positionsService.remove(id);
  }
}
