import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /diagnostic-units/{id}/accreditations` (UC-23-11). */
@ApiSchema({ name: 'DiagnosticUnitsCreateAccreditationDto' })
export class CreateAccreditationDto {
  /**
   * Identificador asociado a accreditation concept.
   */
  @ApiProperty({
    description: 'Tipo de acreditación (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  accreditationConceptId!: string;

  /**
   * Identificador asociado a diagnostic unit site.
   */
  @ApiPropertyOptional({ description: 'Sitio de la unidad', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  diagnosticUnitSiteId?: string;

  /**
   * Valor de accreditation number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nº de acreditación', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accreditationNumber?: string;

  /**
   * Identificador asociado a issuer tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant emisor', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  issuerTenantId?: string;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({ description: 'Archivo de evidencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

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
}

/** Cuerpo de `POST /diagnostic-unit-accreditations/{id}/renew` (UC-23-11). */
export class RenewAccreditationDto {
  /**
   * Valor de accreditation number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nuevo nº de acreditación',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  accreditationNumber?: string;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({
    description: 'Nuevo archivo de evidencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nueva vigencia desde',
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
    description: 'Nueva vigencia hasta',
    type: String,
    format: 'date-time',
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  validTo?: Date;
}
