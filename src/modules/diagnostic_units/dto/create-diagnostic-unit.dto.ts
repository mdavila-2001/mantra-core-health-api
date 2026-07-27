import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

/** Sitio operativo declarado al dar de alta la unidad (UC-23-01). */
export class CreateUnitSiteDto {
  @ApiProperty({
    description: 'Sitio del practice donde opera la unidad',
    format: 'uuid',
  })
  @IsUUID()
  practiceSiteId!: string;

  @ApiPropertyOptional({
    description: 'Rol del sitio (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteRoleConceptId?: string;

  @ApiPropertyOptional({
    description: 'Prefijo de accesión del sitio',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accessionPrefix?: string;

  @ApiPropertyOptional({ description: 'Toma de muestras disponible' })
  @IsOptional()
  @IsBoolean()
  sampleCollectionAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Imagenología disponible' })
  @IsOptional()
  @IsBoolean()
  imagingAvailable?: boolean;
}

/** Acreditación declarada al dar de alta la unidad (UC-23-01). */
export class CreateUnitAccreditationDto {
  @ApiProperty({
    description: 'Tipo de acreditación (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  accreditationConceptId!: string;

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
}

/** Cuerpo de `POST /diagnostic-units` (UC-23-01). */
export class CreateDiagnosticUnitDto {
  @ApiProperty({
    description: 'Tenant propietario de la unidad',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({
    description: 'Código único de la unidad en el tenant',
    maxLength: 60,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  code!: string;

  @ApiProperty({ description: 'Nombre de la unidad', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Tipo de unidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  diagnosticUnitTypeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Tipo de propiedad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ownershipTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Practice asociado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  @ApiPropertyOptional({
    description: 'Sitio principal del practice',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  primaryPracticeSiteId?: string;

  @ApiPropertyOptional({ description: 'Acepta órdenes externas' })
  @IsOptional()
  @IsBoolean()
  acceptsExternalOrders?: boolean;

  @ApiPropertyOptional({
    type: [CreateUnitSiteDto],
    description: 'Sitios operativos (1..N)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitSiteDto)
  sites?: CreateUnitSiteDto[];

  @ApiPropertyOptional({
    type: [CreateUnitAccreditationDto],
    description: 'Acreditaciones (0..N)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitAccreditationDto)
  accreditations?: CreateUnitAccreditationDto[];
}
