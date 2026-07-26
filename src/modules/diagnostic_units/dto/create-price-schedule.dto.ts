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
  @ApiProperty({ description: 'Código único del cronograma en la unidad', maxLength: 60 })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  code!: string;

  @ApiPropertyOptional({ description: 'Tipo de cronograma (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  priceScheduleTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Sitio de la unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  @ApiPropertyOptional({ description: 'Tenant aseguradora', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  insurerTenantId?: string;

  @ApiPropertyOptional({ description: 'Tenant broker', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  brokerTenantId?: string;

  @ApiPropertyOptional({ description: 'Moneda (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ description: 'Vigente desde', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Vigente hasta', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;

  @ApiPropertyOptional({ description: 'Visible al público' })
  @IsOptional()
  @IsBoolean()
  publicVisibility?: boolean;
}
