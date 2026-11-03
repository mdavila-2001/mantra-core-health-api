import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  AUDIT_DEFAULT_PAGE_SIZE,
  AUDIT_MAX_PAGE_SIZE,
} from './audit-query.dto';
import { DSAR_TYPES } from './dsar.dto';

/** Estados de la máquina DSAR (códigos de concepto). */
export const DSAR_STATUSES = [
  'RECEIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'REJECTED',
] as const;

/** Tope inferior y valor por omisión del mínimo de muestra de los agregados. */
export const SUMMARY_MIN_SAMPLE_DEFAULT = 5;
/** Piso del servidor: el cliente puede pedir más, nunca menos (k-anonimato de los agregados). */
export const SUMMARY_MIN_SAMPLE_FLOOR = 5;
/** Ventana mínima del resumen: una ventana corta aísla a una sola persona. */
export const SUMMARY_MIN_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Filtros de `GET /audit/data-access/summary`. */
export class DataAccessSummaryQueryDto {
  @ApiPropertyOptional({
    description: 'Desde (ISO 8601, incluido). Sin rango, los últimos 30 días',
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Hasta (ISO 8601, excluido)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    minimum: 5,
    maximum: 1000,
    default: SUMMARY_MIN_SAMPLE_DEFAULT,
    description:
      'Un grupo con menos eventos que esto no se muestra: se suma a `suppressed`. El mínimo es 5 (piso del servidor)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(SUMMARY_MIN_SAMPLE_FLOOR)
  @Max(1000)
  minSample?: number;
}

/** Filtros de `GET /privacy/dsar`. */
export class DsarListQueryDto {
  @ApiPropertyOptional({ enum: DSAR_STATUSES })
  @IsOptional()
  @IsIn(DSAR_STATUSES)
  status?: string;

  @ApiPropertyOptional({ enum: DSAR_TYPES })
  @IsOptional()
  @IsIn(DSAR_TYPES)
  type?: string;

  @ApiPropertyOptional({ description: 'Solicitada desde (ISO 8601, incluido)' })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({ description: 'Solicitada hasta (ISO 8601, excluido)' })
  @IsOptional()
  @IsISO8601()
  to?: string;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: AUDIT_MAX_PAGE_SIZE,
    default: AUDIT_DEFAULT_PAGE_SIZE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(AUDIT_MAX_PAGE_SIZE)
  limit?: number;

  @ApiPropertyOptional({ maxLength: 600 })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  @Matches(/^[A-Za-z0-9_-]*$/)
  cursor?: string;
}
