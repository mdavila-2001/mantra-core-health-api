import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Las tres partes de la calificación en malla (v4.2.42).
 *
 * Cada una se nombra por su id canónico, no por su vitrina pública:
 * `PATIENT` = `profiles.patient_profiles`, `PRACTITIONER` =
 * `profiles.health_practitioner_profiles`, `ORGANIZATION` =
 * `practice.practices`. El paciente no tiene vitrina por diseño, y los médicos y
 * organizaciones de los entornos desplegados tampoco la tienen todavía.
 */
export const RATING_PARTY_TYPES = [
  'PATIENT',
  'PRACTITIONER',
  'ORGANIZATION',
] as const;

/** Tipo de parte que califica o es calificada. */
export type RatingPartyType = (typeof RATING_PARTY_TYPES)[number];

/** Cuerpo de `PUT /community/ratings`: califico (o recalifico) a alguien. */
@ApiSchema({ name: 'CommunityRatePartyDto' })
export class RatePartyDto {
  /**
   * Con qué identidad califico. El servidor la resuelve contra el token: el
   * paciente y el médico salen de sus claims; la organización exige que yo la
   * administre.
   */
  @ApiProperty({ enum: RATING_PARTY_TYPES })
  @IsIn(RATING_PARTY_TYPES)
  reviewerType!: RatingPartyType;

  /**
   * La organización en cuyo nombre califico. Obligatoria si
   * `reviewerType = ORGANIZATION`; se ignora en los otros dos casos.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reviewerOrganizationId?: string;

  /** Qué tipo de parte califico. */
  @ApiProperty({ enum: RATING_PARTY_TYPES })
  @IsIn(RATING_PARTY_TYPES)
  targetType!: RatingPartyType;

  /** A quién califico, por su id canónico. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetId!: string;

  /**
   * La atención terminada que respalda la calificación. Obligatoria cuando hay
   * un paciente de por medio. Nunca se devuelve en las lecturas.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * El vínculo de trabajo (vigente o pasado) que respalda la calificación entre
   * médico y organización. Obligatorio en ese par.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  roleAssignmentId?: string;

  /** Estrellas, de 1 a 5. */
  @ApiProperty({ minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating!: number;

  /** Comentario opcional. */
  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  commentText?: string;
}

/** Respuesta de `PUT /community/ratings`. */
@ApiSchema({ name: 'CommunityPartyRatingResultDto' })
export class PartyRatingResultDto {
  /** Identificador de la calificación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Estrellas guardadas. */
  @ApiProperty()
  overallRating!: number;

  /** `true` si se creó; `false` si se actualizó una calificación previa. */
  @ApiProperty()
  created!: boolean;
}

/** Filtro de las lecturas: de quién quiero la nota. */
@ApiSchema({ name: 'CommunityRatingTargetQueryDto' })
export class RatingTargetQueryDto {
  /** Tipo de parte calificada. */
  @ApiProperty({ enum: RATING_PARTY_TYPES })
  @IsIn(RATING_PARTY_TYPES)
  targetType!: RatingPartyType;

  /** Id canónico de la parte calificada. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetId!: string;
}

/** Nota media de una parte. */
@ApiSchema({ name: 'CommunityRatingSummaryDto' })
export class RatingSummaryDto {
  /** Media de estrellas, con un decimal; `null` si nadie la calificó. */
  @ApiProperty({ type: Number, nullable: true })
  average!: number | null;

  /** Cuántas calificaciones la componen. */
  @ApiProperty()
  count!: number;
}

/**
 * Una calificación tal como la ve quien puede leerla.
 *
 * No trae quién calificó ni la atención que la respalda: decir qué médico
 * calificó a un paciente, o en qué atención, revelaría la relación clínica.
 */
@ApiSchema({ name: 'CommunityRatingItemDto' })
export class RatingItemDto {
  /** Identificador de la calificación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Qué tipo de parte calificó. */
  @ApiProperty({ enum: RATING_PARTY_TYPES })
  reviewerType!: RatingPartyType;

  /** Estrellas. */
  @ApiProperty()
  overallRating!: number;

  /** Comentario, si lo dejó. */
  @ApiPropertyOptional()
  commentText?: string;

  /** Cuándo se calificó por última vez. */
  @ApiProperty()
  updatedAt!: Date;
}

/** Nota media más las calificaciones individuales, de la más nueva a la más vieja. */
@ApiSchema({ name: 'CommunityRatingListDto' })
export class RatingListDto extends RatingSummaryDto {
  /** Calificaciones individuales (hasta 50, las más recientes). */
  @ApiProperty({ type: [RatingItemDto] })
  items!: RatingItemDto[];
}

/** Una calificación que yo hice, para precargar el formulario. */
@ApiSchema({ name: 'CommunityMyRatingDto' })
export class MyRatingDto {
  /** Identificador de la calificación. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Con qué identidad califiqué. */
  @ApiProperty({ enum: RATING_PARTY_TYPES })
  reviewerType!: RatingPartyType;

  /** A qué tipo de parte. */
  @ApiProperty({ enum: RATING_PARTY_TYPES })
  targetType!: RatingPartyType;

  /** A quién. */
  @ApiProperty({ format: 'uuid' })
  targetId!: string;

  /** Atención que la respalda, si es el caso (es mía, así que puedo verla). */
  @ApiPropertyOptional({ format: 'uuid' })
  encounterId?: string;

  /** Vínculo que la respalda, si es el caso. */
  @ApiPropertyOptional({ format: 'uuid' })
  roleAssignmentId?: string;

  /** Estrellas. */
  @ApiProperty()
  overallRating!: number;

  /** Comentario. */
  @ApiPropertyOptional()
  commentText?: string;
}

/** Filtro de `GET /community/ratings/mine`: con qué identidad califiqué. */
@ApiSchema({ name: 'CommunityMyRatingsQueryDto' })
export class MyRatingsQueryDto {
  /** Con qué identidad. */
  @ApiProperty({ enum: RATING_PARTY_TYPES })
  @IsIn(RATING_PARTY_TYPES)
  reviewerType!: RatingPartyType;

  /** La organización, si `reviewerType = ORGANIZATION`. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reviewerOrganizationId?: string;
}
