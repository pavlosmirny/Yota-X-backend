// schemas/position.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PositionDocument = Position & Document;

@Schema()
export class Position {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  department: string;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  experience: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], required: true })
  requirements: string[];
}

export const PositionSchema = SchemaFactory.createForClass(Position);
