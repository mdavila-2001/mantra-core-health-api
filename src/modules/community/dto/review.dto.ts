import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/** Puntuación de una dimensión de la review. */
export class ReviewDimensionInputDto {
  /**
   * Valor de dimension mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Dimensión',
    enum: ['COMMUNICATION', 'PUNCTUALITY', 'CLEANLINESS', 'OUTCOME'],
  })
  @IsIn(['COMMUNICATION', 'PUNCTUALITY', 'CLEANLINESS', 'OUTCOME'])
  dimension!: 'COMMUNICATION' | 'PUNCTUALITY' | 'CLEANLINESS' | 'OUTCOME';

  /**
   * Valor de score mantenido por la instancia.
   */
  @ApiProperty({ description: 'Puntuación 1..5', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;
}

/** Cuerpo de `POST /community/profiles/{profileId}/reviews` (UC-19-11). */
export class CreateReviewDto {
  /**
   * Identificador asociado a reviewer patient profile.
   */
  @ApiProperty({ description: 'Perfil de paciente que reseña', format: 'uuid' })
  @IsUUID()
  reviewerPatientProfileId!: string;

  /**
   * Identificador asociado a verified encounter.
   */
  @ApiPropertyOptional({
    description: 'Encuentro verificado (nunca se expone públicamente)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  verifiedEncounterId?: string;

  /**
   * Valor de overall rating mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Calificación global 1..5',
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating!: number;

  /**
   * Valor de review text mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Texto de la review', maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reviewText?: string;

  /**
   * Valor de display mode mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Modo de visualización del reviewer',
    enum: ['REAL_NAME', 'ANONYMOUS'],
  })
  @IsOptional()
  @IsIn(['REAL_NAME', 'ANONYMOUS'])
  displayMode?: 'REAL_NAME' | 'ANONYMOUS';

  /**
   * Valor de dimensions mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [ReviewDimensionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => ReviewDimensionInputDto)
  dimensions?: ReviewDimensionInputDto[];
}
