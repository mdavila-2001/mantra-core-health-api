import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

const MAX_INPUTS = 100;

/** Cuerpo de `POST /embeddings/compute`, con la forma de una API de embeddings real. */
export class ComputeEmbeddingsDto {
  @ApiPropertyOptional({ default: 'mock-embedding-v1' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  model?: string;

  @ApiProperty({
    type: [String],
    maxItems: MAX_INPUTS,
    description: 'Textos ya redactados a embeber',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_INPUTS)
  @Type(() => String)
  inputs!: string[];
}

export class EmbeddingDatumDto {
  @ApiProperty()
  index!: number;

  @ApiProperty({ type: [Number] })
  embedding!: number[];

  @ApiProperty()
  tokenCount!: number;
}

export class ComputeEmbeddingsResponseDto {
  @ApiProperty()
  model!: string;

  @ApiProperty()
  dimension!: number;

  @ApiProperty({ type: [EmbeddingDatumDto] })
  data!: EmbeddingDatumDto[];
}
