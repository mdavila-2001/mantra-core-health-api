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
  @ApiPropertyOptional({ description: 'Campos visibles (subconjunto del allow-list del contrato)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  visibleFields?: string[];

  @ApiPropertyOptional({ description: 'Orden de campos' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fieldOrder?: string[];

  @ApiPropertyOptional({ description: 'Filtros activos (mapa código -> valor)' })
  @IsOptional()
  activeFilter?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Código de orden preferido' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  sortCode?: string;

  @ApiPropertyOptional({ description: 'Densidad', enum: ['COMPACT', 'COMFORTABLE'] })
  @IsOptional()
  @IsIn(['COMPACT', 'COMFORTABLE'])
  density?: 'COMPACT' | 'COMFORTABLE';

  @ApiPropertyOptional({ description: 'Tamaño de página preferido' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  pageSize?: number;

  @ApiPropertyOptional({ description: 'Tenant al que se asocia la preferencia', format: 'uuid' })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
