// positions.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Position, PositionDocument } from './schemas/position.schema';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';

@Injectable()
export class PositionsService {
  constructor(
    @InjectModel(Position.name) private positionModel: Model<PositionDocument>,
  ) {}

  // Создать новую вакансию
  async create(createPositionDto: CreatePositionDto): Promise<Position> {
    const createdPosition = new this.positionModel(createPositionDto);
    return createdPosition.save();
  }

  // Получить все вакансии с опциональной фильтрацией по департаменту
  async findAll(department?: string): Promise<Position[]> {
    const filter = department && department !== 'all' ? { department } : {};
    return this.positionModel.find(filter).exec();
  }

  // Получить одну вакансию по id
  async findOne(id: string): Promise<Position> {
    const position = await this.positionModel.findById(id).exec();
    if (!position) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    return position;
  }

  // Обновить вакансию
  async update(
    id: string,
    updatePositionDto: UpdatePositionDto,
  ): Promise<Position> {
    const updatedPosition = await this.positionModel
      .findByIdAndUpdate(id, updatePositionDto, { new: true })
      .exec();

    if (!updatedPosition) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    return updatedPosition;
  }

  // Удалить вакансию
  async remove(id: string): Promise<Position> {
    const deletedPosition = await this.positionModel
      .findByIdAndDelete(id)
      .exec();

    if (!deletedPosition) {
      throw new NotFoundException(`Position with ID ${id} not found`);
    }
    return deletedPosition;
  }

  // Получить вакансии по нескольким критериям
  async findByFilters(filters: {
    department?: string;
    type?: string;
    location?: string;
  }): Promise<Position[]> {
    const query = Object.entries(filters)
      .filter(([, value]) => value && value !== 'all')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    return this.positionModel.find(query).exec();
  }

  // Поиск вакансий по текстовому запросу
  async search(searchText: string): Promise<Position[]> {
    return this.positionModel
      .find({
        $or: [
          { title: { $regex: searchText, $options: 'i' } },
          { description: { $regex: searchText, $options: 'i' } },
        ],
      })
      .exec();
  }
}
