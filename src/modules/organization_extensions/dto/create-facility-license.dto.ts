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
  @ApiProperty({ description: 'Tenant (directory) titular de la licencia', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({ description: 'Sitio de práctica de la instalación', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceSiteId?: string;

  @ApiPropertyOptional({ description: 'Tipo de instalación (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  facilityTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Tipo de licencia (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  licenseTypeConceptId?: string;

  @ApiProperty({ description: 'Número de licencia', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  licenseNumber!: string;

  @ApiPropertyOptional({ description: 'Tenant de la autoridad emisora', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  issuingAuthorityTenantId?: string;

  @ApiPropertyOptional({ description: 'Nombre de la autoridad emisora', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuingAuthorityName?: string;

  @ApiPropertyOptional({ description: 'Jurisdicción (concepto)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({ description: 'Vigente desde (ISO date)' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Vigente hasta (ISO date)' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Archivo de evidencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}
