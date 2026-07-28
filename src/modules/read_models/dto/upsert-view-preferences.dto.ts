import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/** Cuerpo de `PUT /views/{frontend_page_view_id}/preferences` (UC-30-09). */
export class UpsertViewPreferencesDto {
  /**
   * Valor de visible fields mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Campos visibles (subconjunto del allow-list del contrato)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleFields?: string[];

  /**
   * Valor de field order mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Orden de campos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldOrder?: string[];

  /**
   * Valor de active filter mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Filtros activos (mapa código -> valor)',
  })
  @IsOptional()
  activeFilter?: Record<string, unknown>;

  /**
   * Valor de sort code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código de orden preferido' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sortCode?: string;

  /**
   * Valor de density mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Densidad',
    enum: ['COMPACT', 'COMFORTABLE'],
  })
  @IsOptional()
  @IsIn(['COMPACT', 'COMFORTABLE'])
  density?: 'COMPACT' | 'COMFORTABLE';

  /**
   * Valor de page size mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Tamaño de página preferido' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize?: number;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant al que se asocia la preferencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
