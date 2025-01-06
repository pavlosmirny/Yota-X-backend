// dto/create-position.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsNotEmpty, ArrayMinSize } from 'class-validator';

export class CreatePositionDto {
  @ApiProperty({
    example: 'Senior Frontend Developer',
    description: 'The title of the position',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'development', description: 'Department name' })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({ example: 'Full-time', description: 'Type of employment' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 'Remote', description: 'Location of the position' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: '5+ years', description: 'Required experience' })
  @IsString()
  @IsNotEmpty()
  experience: string;

  @ApiProperty({
    example: 'We are looking for...',
    description: 'Position description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: ['React experience', 'TypeScript knowledge'],
    description: 'List of requirements',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  requirements: string[];
}
