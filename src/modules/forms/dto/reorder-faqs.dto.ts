import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, ArrayUnique, IsArray, IsUUID } from 'class-validator';

/**
 * Body of `PUT /forms/faqs/order`: the full list of the practitioner's entries
 * in their final order. A missing, extra or foreign id is a 422 — a partial
 * list would leave two entries competing for the same position.
 */
export class ReorderFaqsDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  ids!: string[];
}
