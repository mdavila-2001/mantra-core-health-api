import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
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
  MinLength,
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
@ApiSchema({ name: 'CommunityCreateReviewDto' })
export class CreateReviewDto {
  /**
   * La atención que respalda la reseña. **Obligatoria.**
   *
   * Era opcional, y sin ella la reseña salía marcada como «no verificada» pero
   * salía igual: cualquiera podía calificar a cualquiera sin haberse atendido
   * nunca. Ahora no hay reseña sin atención detrás, y el servidor comprueba que
   * esa atención sea de quien reseña, con quien se califica, y esté terminada.
   *
   * Nunca se expone en las lecturas: publicarla diría que esa persona se
   * atendió, ese día, con ese profesional.
   */
  @ApiProperty({
    description: 'Atención que respalda la reseña (nunca se expone)',
    format: 'uuid',
  })
  @IsUUID()
  verifiedEncounterId!: string;

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

/**
 * Cuerpo de `POST /community/profiles/{profileId}/reviews/{reviewId}/responses`.
 *
 * `community.review_responses` existía como tabla y **no tenía endpoint**: un
 * profesional podía ser calificado en público y no tenía forma de contestar.
 */
@ApiSchema({ name: 'CommunityCreateReviewResponseDto' })
export class CreateReviewResponseDto {
  /**
   * Texto de la respuesta.
   */
  @ApiProperty({ description: 'Respuesta del profesional', maxLength: 4000 })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  responseText!: string;
}
