import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { DEFAULT_SEARCH_SIZE, MAX_SEARCH_SIZE } from '../constants';

/**
 * Cuerpo de `POST /search/:index/documents`.
 *
 * El `tenantId` NO viaja en el cuerpo: lo fija el servicio desde el contexto de
 * la petición, así el cliente no puede indexar en el espacio de otro tenant.
 */
export class IndexDocumentDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({
    maxLength: 256,
    description: 'Identificador del documento en el índice (idempotente).',
  })
  @IsString()
  @MaxLength(256)
  id!: string;

  /**
   * Valor de document mantenido por la instancia.
   */
  @ApiProperty({
    type: 'object',
    additionalProperties: true,
    description:
      'Documento de negocio. El servicio sobrescribe `tenantId` con el del contexto.',
  })
  @IsObject()
  document!: Record<string, unknown>;
}

/**
 * Cláusula de filtro exacto declarada. El `field` se valida contra la allowlist
 * del índice; nunca se acepta un fragmento de query DSL.
 */
export class SearchFilterDto {
  /**
   * Valor de field mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100, description: 'Campo permitido del índice.' })
  @IsString()
  @MaxLength(100)
  field!: string;

  /**
   * Valor de values mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    description: 'Valores admitidos (OR); se traduce a un `terms` acotado.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(256, { each: true })
  values!: string[];
}

/**
 * Cuerpo de `POST /search/:index/_search`.
 *
 * Es una búsqueda *tipada*: se declara el texto y filtros/facetas por nombre de
 * campo. No hay forma de inyectar un query DSL crudo, de modo que el filtro
 * `term { tenantId }` que añade el servicio no puede ser evadido.
 */
export class SearchRequestDto {
  /**
   * Valor de query mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 512,
    description: 'Texto a buscar en los campos full-text del índice.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  query?: string;

  /**
   * Valor de filters mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [SearchFilterDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SearchFilterDto)
  filters?: SearchFilterDto[];

  /**
   * Valor de facets mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    description: 'Campos a agregar como faceta (allowlist del índice).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  facets?: string[];

  /**
   * Valor de from mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  from?: number = 0;

  /**
   * Valor de size mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_SEARCH_SIZE,
    default: DEFAULT_SEARCH_SIZE,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(MAX_SEARCH_SIZE)
  size?: number = DEFAULT_SEARCH_SIZE;
}

// --- Respuestas ------------------------------------------------------------

/**
 * Define el contrato validado para index document response.
 */
export class IndexDocumentResponseDto {
  /**
   * Valor de index mantenido por la instancia.
   */
  @ApiProperty()
  index!: string;

  /**
   * Identificador único de la instancia.
   */
  @ApiProperty()
  id!: string;

  /**
   * Valor de result mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Resultado de OpenSearch: `created` o `updated`.',
  })
  result!: string;
}

/**
 * Define el contrato validado para search hit.
 */
export class SearchHitDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty()
  id!: string;

  /**
   * Valor de score mantenido por la instancia.
   */
  @ApiProperty({ nullable: true })
  score!: number | null;

  /**
   * Valor de source mantenido por la instancia.
   */
  @ApiProperty({ type: 'object', additionalProperties: true })
  source!: Record<string, unknown>;
}

/**
 * Define el contrato validado para facet bucket.
 */
export class FacetBucketDto {
  /**
   * Valor de key mantenido por la instancia.
   */
  @ApiProperty()
  key!: string;

  /**
   * Valor de count mantenido por la instancia.
   */
  @ApiProperty()
  count!: number;
}

/**
 * Define el contrato validado para search response.
 */
export class SearchResponseDto {
  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty()
  total!: number;

  /**
   * Valor de hits mantenido por la instancia.
   */
  @ApiProperty({ type: [SearchHitDto] })
  hits!: SearchHitDto[];

  /**
   * Valor de facets mantenido por la instancia.
   */
  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'object' } },
    description: 'Facetas por campo: `{ campo: [{ key, count }] }`.',
  })
  facets!: Record<string, FacetBucketDto[]>;
}

/**
 * Define el contrato validado para delete document response.
 */
export class DeleteDocumentResponseDto {
  /**
   * Valor de index mantenido por la instancia.
   */
  @ApiProperty()
  index!: string;

  /**
   * Identificador único de la instancia.
   */
  @ApiProperty()
  id!: string;

  /**
   * Valor de deleted mantenido por la instancia.
   */
  @ApiProperty()
  deleted!: boolean;
}
