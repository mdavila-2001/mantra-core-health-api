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
  /**
   * Identificador asociado a practice site.
   */
  @ApiProperty({
    description: 'Sitio del practice donde opera la unidad',
    format: 'uuid',
  })
  @IsUUID()
  practiceSiteId!: string;

  /**
   * Identificador asociado a site role concept.
   */
  @ApiPropertyOptional({
    description: 'Rol del sitio (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  siteRoleConceptId?: string;

  /**
   * Valor de accession prefix mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Prefijo de accesión del sitio',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  accessionPrefix?: string;

  /**
   * Valor de sample collection available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Toma de muestras disponible' })
  @IsOptional()
  @IsBoolean()
  sampleCollectionAvailable?: boolean;

  /**
   * Valor de imaging available mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Imagenología disponible' })
  @IsOptional()
  @IsBoolean()
  imagingAvailable?: boolean;
}

/** Acreditación declarada al dar de alta la unidad (UC-23-01). */
export class CreateUnitAccreditationDto {
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
}

/** Cuerpo de `POST /diagnostic-units` (UC-23-01). */
export class CreateDiagnosticUnitDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant propietario de la unidad',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único de la unidad en el tenant',
    maxLength: 60,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la unidad', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a diagnostic unit type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de unidad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  diagnosticUnitTypeConceptId?: string;

  /**
   * Identificador asociado a ownership type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de propiedad (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  ownershipTypeConceptId?: string;

  /**
   * Identificador asociado a practice.
   */
  @ApiPropertyOptional({ description: 'Practice asociado', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  practiceId?: string;

  /**
   * Identificador asociado a primary practice site.
   */
  @ApiPropertyOptional({
    description: 'Sitio principal del practice',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  primaryPracticeSiteId?: string;

  /**
   * Valor de accepts external orders mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Acepta órdenes externas' })
  @IsOptional()
  @IsBoolean()
  acceptsExternalOrders?: boolean;

  /**
   * Valor de sites mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [CreateUnitSiteDto],
    description: 'Sitios operativos (1..N)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitSiteDto)
  sites?: CreateUnitSiteDto[];

  /**
   * Valor de accreditations mantenido por la instancia.
   */
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
