import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Licencia inicial que acompaña el alta de una farmacia (UC-24-01). */
export class InitialLicenseDto {
  @ApiProperty({ description: 'Número de licencia', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  licenseNumber!: string;

  @ApiPropertyOptional({ description: 'Tenant de la autoridad emisora', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  issuingAuthorityTenantId?: string;

  @ApiPropertyOptional({ description: 'Concept id de la jurisdicción', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Archivo de evidencia de la licencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}

/** Cuerpo de `POST /pharmacies` (UC-24-01). */
export class CreatePharmacyDto {
  @ApiProperty({ description: 'Tenant propietario de la farmacia', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Código único de la farmacia por tenant', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Razón social', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  @ApiPropertyOptional({ description: 'Nombre comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string;

  @ApiPropertyOptional({ description: 'Tenant no público / farmacia interna', example: false })
  @IsOptional()
  @IsBoolean()
  isRetail?: boolean;

  @ApiProperty({ description: 'Licencia inicial de la farmacia', type: InitialLicenseDto })
  @ValidateNested()
  @Type(() => InitialLicenseDto)
  license!: InitialLicenseDto;
}
