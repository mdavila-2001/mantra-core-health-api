import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /diagnostic-units/{id}/price-schedules` (UC-23-06). */
export class CreatePriceScheduleDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único del cronograma en la unidad',
    maxLength: 60,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  code!: string;

  /**
   * Identificador asociado a price schedule type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de cronograma (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  priceScheduleTypeConceptId?: string;

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @ApiPropertyOptional({ description: 'Sitio de la unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  /**
   * Identificador asociado a insurer tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant aseguradora', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  insurerTenantId?: string;

  /**
   * Identificador asociado a broker tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant broker', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  brokerTenantId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ description: 'Moneda (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente desde',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Vigente hasta',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;

  /**
   * Valor de public visibility mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Visible al público' })
  @IsOptional()
  @IsBoolean()
  publicVisibility?: boolean;
}
