import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /orgext/facility-licenses` (UC-22-05). */
export class CreateFacilityLicenseDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant (directory) titular de la licencia',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a practice site.
   */
  @ApiPropertyOptional({
    description: 'Sitio de práctica de la instalación',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  /**
   * Identificador asociado a facility type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de instalación (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  facilityTypeConceptId?: string;

  /**
   * Identificador asociado a license type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de licencia (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  licenseTypeConceptId?: string;

  /**
   * Valor de license number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de licencia', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  licenseNumber!: string;

  /**
   * Identificador asociado a issuing authority tenant.
   */
  @ApiPropertyOptional({
    description: 'Tenant de la autoridad emisora',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  issuingAuthorityTenantId?: string;

  /**
   * Valor de issuing authority name mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Nombre de la autoridad emisora',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuingAuthorityName?: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Jurisdicción (concepto)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({ description: 'Archivo de evidencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}
