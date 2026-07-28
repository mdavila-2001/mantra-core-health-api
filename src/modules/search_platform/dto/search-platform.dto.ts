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
  @ApiProperty({
    maxLength: 256,
    description: 'Identificador del documento en el índice (idempotente).',
  })
  @IsString()
  @MaxLength(256)
  id!: string;

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
  @ApiProperty({ maxLength: 100, description: 'Campo permitido del índice.' })
  @IsString()
  @MaxLength(100)
  field!: string;

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
  @ApiPropertyOptional({
    maxLength: 512,
    description: 'Texto a buscar en los campos full-text del índice.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(512)
  query?: string;

  @ApiPropertyOptional({ type: [SearchFilterDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => SearchFilterDto)
  filters?: SearchFilterDto[];

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

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  from?: number = 0;

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

export class IndexDocumentResponseDto {
  @ApiProperty()
  index!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'Resultado de OpenSearch: `created` o `updated`.' })
  result!: string;
}

export class SearchHitDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true })
  score!: number | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  source!: Record<string, unknown>;
}

export class FacetBucketDto {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  count!: number;
}

export class SearchResponseDto {
  @ApiProperty()
  total!: number;

  @ApiProperty({ type: [SearchHitDto] })
  hits!: SearchHitDto[];

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'object' } },
    description: 'Facetas por campo: `{ campo: [{ key, count }] }`.',
  })
  facets!: Record<string, FacetBucketDto[]>;
}

export class DeleteDocumentResponseDto {
  @ApiProperty()
  index!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  deleted!: boolean;
}
