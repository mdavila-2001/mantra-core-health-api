import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /diagnostic-units/{id}/accreditations` (UC-23-11). */
export class CreateAccreditationDto {
  @ApiProperty({ description: 'Tipo de acreditación (concept id)', format: 'uuid' })
  @IsUUID()
  accreditationConceptId!: string;

  @ApiPropertyOptional({ description: 'Sitio de la unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  @ApiPropertyOptional({ description: 'Nº de acreditación', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accreditationNumber?: string;

  @ApiPropertyOptional({ description: 'Tenant emisor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  issuerTenantId?: string;

  @ApiPropertyOptional({ description: 'Archivo de evidencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

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
}

/** Cuerpo de `POST /diagnostic-unit-accreditations/{id}/renew` (UC-23-11). */
export class RenewAccreditationDto {
  @ApiPropertyOptional({ description: 'Nuevo nº de acreditación', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accreditationNumber?: string;

  @ApiPropertyOptional({ description: 'Nuevo archivo de evidencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

  @ApiPropertyOptional({ description: 'Nueva vigencia desde', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validFrom?: Date;

  @ApiPropertyOptional({ description: 'Nueva vigencia hasta', type: String, format: 'date-time' })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
