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
  /**
   * Valor de license number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Número de licencia', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
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
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id de la jurisdicción',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Fin de vigencia', format: 'date' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de evidencia de la licencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;
}

/** Cuerpo de `POST /pharmacies` (UC-24-01). */
export class CreatePharmacyDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant propietario de la farmacia',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de la farmacia por tenant',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de legal name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Razón social', maxLength: 300 })
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  legalName!: string;

  /**
   * Valor de trade name mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nombre comercial', maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  tradeName?: string;

  /**
   * Valor de is retail mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tenant no público / farmacia interna',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isRetail?: boolean;

  /**
   * Valor de license mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Licencia inicial de la farmacia',
    type: InitialLicenseDto,
  })
  @ValidateNested()
  @Type(() => InitialLicenseDto)
  license!: InitialLicenseDto;
}
