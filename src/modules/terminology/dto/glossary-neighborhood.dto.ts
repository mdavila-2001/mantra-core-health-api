import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min, ValidateIf } from 'class-validator';
import {
  GLOSSARY_EVIDENCE_TIERS,
  GLOSSARY_RELATION_DIRECTIONS,
  GLOSSARY_RELATION_FREQUENCIES,
  GLOSSARY_RELATION_TYPES,
  type GlossaryEvidenceTier,
  type GlossaryRelationDirection,
  type GlossaryRelationFrequency,
  type GlossaryRelationType,
} from '../glossary.constants';
import { SUPPORTED_DESIGNATION_LANGUAGES } from '../terminology.constants';
import {
  ConceptTaxonomyRefDto,
  GlossaryGraphNodeDto,
} from './search-concepts.dto';

/** Vecinos por grupo cuando no se pide otra cosa. */
export const DEFAULT_NEIGHBORS_PER_GROUP = 8;
/** Tope de `perGroup`. */
export const MAX_NEIGHBORS_PER_GROUP = 50;
/** Tope de `limit` al pedir la página de un grupo. */
export const MAX_NEIGHBOR_PAGE_SIZE = 200;
/** Tamaño de página de un grupo cuando no se indica `limit`. */
export const DEFAULT_NEIGHBOR_PAGE_SIZE = 50;

/**
 * Query de `GET /terminology/concepts/{conceptId}/glossary-neighborhood`.
 *
 * Hay dos lecturas con una sola ruta: sin `type` ni `direction`, una **muestra**
 * de cada grupo (`perGroup`); con los dos, **un solo grupo** paginado
 * (`offset`/`limit`). `type` sin `direction` (o al revés) es un pedido a medias
 * y se rechaza en vez de adivinar el otro lado.
 */
export class GlossaryNeighborhoodQueryDto {
  /** Idioma preferido de los nombres. Por omisión, castellano. */
  @ApiPropertyOptional({ enum: SUPPORTED_DESIGNATION_LANGUAGES })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toUpperCase() : value,
  )
  @IsIn(SUPPORTED_DESIGNATION_LANGUAGES)
  lang?: string;

  /** Cuántos vecinos trae cada grupo en la muestra (1 a 50, por omisión 8). */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_NEIGHBORS_PER_GROUP,
    default: DEFAULT_NEIGHBORS_PER_GROUP,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_NEIGHBORS_PER_GROUP)
  perGroup?: number;

  /** Tipo del grupo a paginar; exige `direction`. */
  @ApiPropertyOptional({ enum: GLOSSARY_RELATION_TYPES })
  @ValidateIf(
    (query: GlossaryNeighborhoodQueryDto) =>
      query.type !== undefined || query.direction !== undefined,
  )
  @IsIn(GLOSSARY_RELATION_TYPES)
  type?: GlossaryRelationType;

  /** Sentido del grupo a paginar; exige `type`. */
  @ApiPropertyOptional({ enum: GLOSSARY_RELATION_DIRECTIONS })
  @ValidateIf(
    (query: GlossaryNeighborhoodQueryDto) =>
      query.type !== undefined || query.direction !== undefined,
  )
  @IsIn(GLOSSARY_RELATION_DIRECTIONS)
  direction?: GlossaryRelationDirection;

  /** Cuántos vecinos saltear dentro del grupo. Por omisión, cero. */
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number;

  /** Tamaño de la página del grupo (1 a 200, por omisión 50). */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_NEIGHBOR_PAGE_SIZE,
    default: DEFAULT_NEIGHBOR_PAGE_SIZE,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_NEIGHBOR_PAGE_SIZE)
  limit?: number;
}

/** Lo que el servicio entiende del pedido, ya validado: una muestra o un grupo. */
export type GlossaryNeighborhoodRequest =
  | { readonly perGroup: number }
  | {
      readonly type: GlossaryRelationType;
      readonly direction: GlossaryRelationDirection;
      readonly offset: number;
      readonly limit: number;
    };

/**
 * A quién aplica una relación, según su evidencia. Cada campo viaja sólo si
 * **todas** las evidencias de la relación lo restringen igual: si una fuente
 * lo restringe y otra no, la relación no está restringida y el campo se omite.
 */
export class GlossaryNeighborQualifiersDto {
  /** Código del sexo al que aplica (`sex_concept_id`). */
  @ApiPropertyOptional()
  sex?: string;

  /** Edad mínima en días: la menor entre las evidencias. */
  @ApiPropertyOptional({ minimum: 0 })
  ageMinDays?: number;

  /** Edad máxima en días: la mayor entre las evidencias. */
  @ApiPropertyOptional({ minimum: 0 })
  ageMaxDays?: number;

  /** Código de aplicabilidad en el embarazo. */
  @ApiPropertyOptional()
  pregnancy?: string;

  /** Código del nivel de atención (`FIRST_LEVEL`, `SECOND_LEVEL`, `THIRD_LEVEL`). */
  @ApiPropertyOptional()
  careLevel?: string;

  /** Código de la línea de tratamiento (`FIRST_LINE`, `SECOND_LINE`). */
  @ApiPropertyOptional()
  lineOfTherapy?: string;
}

/**
 * Un término vecino: lo justo para pintarlo y navegar a él.
 *
 * Los campos opcionales (TAREA-41 F1.5) salen de la evidencia de la relación y
 * se **omiten** cuando la relación no tiene ese dato: una relación sin
 * evidencia cargada se publica igual que antes de F1.
 */
export class GlossaryNeighborDto {
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  display!: string;

  @ApiProperty({ type: () => ConceptTaxonomyRefDto, nullable: true })
  category!: ConceptTaxonomyRefDto | null;

  /** Fuerza de la relación, de 0 a 1 (`strength_score`). Ordena el grupo. */
  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  strength?: number;

  /**
   * Frecuencia del hallazgo según la mejor evidencia. `EXCLUDED` significa que
   * la fuente lo descarta: no es una relación positiva.
   */
  @ApiPropertyOptional({ enum: GLOSSARY_RELATION_FREQUENCIES })
  frequency?: GlossaryRelationFrequency;

  /** Mejor nivel de evidencia de la relación. */
  @ApiPropertyOptional({ enum: GLOSSARY_EVIDENCE_TIERS })
  evidenceTier?: GlossaryEvidenceTier;

  /** Ids de origen de cada evidencia (`source_reference`), sin repetir. */
  @ApiPropertyOptional({ type: [String] })
  sourceCodes?: string[];

  @ApiPropertyOptional({ type: () => GlossaryNeighborQualifiersDto })
  qualifiers?: GlossaryNeighborQualifiersDto;
}

/** Los vecinos de un término por tipo y sentido de relación. */
export class GlossaryNeighborGroupDto {
  @ApiProperty({ enum: GLOSSARY_RELATION_TYPES })
  type!: GlossaryRelationType;

  @ApiProperty({ enum: GLOSSARY_RELATION_DIRECTIONS })
  direction!: GlossaryRelationDirection;

  /** Tamaño real del grupo, no lo que vino en `items`. */
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: () => [GlossaryNeighborDto] })
  items!: GlossaryNeighborDto[];
}

/** El vecindario de un término: sus relaciones salientes y entrantes. */
export class GlossaryNeighborhoodDto {
  @ApiProperty({ type: () => GlossaryGraphNodeDto })
  focus!: GlossaryGraphNodeDto;

  @ApiProperty({ type: () => [GlossaryNeighborGroupDto] })
  groups!: GlossaryNeighborGroupDto[];
}
