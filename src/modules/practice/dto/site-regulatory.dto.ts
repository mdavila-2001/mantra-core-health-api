import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Cuerpo de `PATCH /sites/{siteId}/regulatory`. `null` limpia el dato. */
export class UpdateSiteRegulatoryDto {
  /** Código SNIS/SUIS: texto validable, sin formato inventado. */
  @ApiPropertyOptional({ maxLength: 60, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  snisCode?: string | null;

  /** Subsector (`SUBSECTOR_*`). */
  @ApiPropertyOptional({ example: 'SUBSECTOR_PUBLIC', nullable: true })
  @IsOptional()
  @IsString()
  subsectorCode?: string | null;

  /** Nivel de atención (`CARE_LEVEL_1..4`). */
  @ApiPropertyOptional({ example: 'CARE_LEVEL_2', nullable: true })
  @IsOptional()
  @IsString()
  careLevelCode?: string | null;

  /** Tipología (`TYPOLOGY_*`). */
  @ApiPropertyOptional({ example: 'TYPOLOGY_HOSPITAL_L2', nullable: true })
  @IsOptional()
  @IsString()
  typologyCode?: string | null;

  /** Ente gestor (Caja, municipio…). */
  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  managingEntityName?: string | null;

  /** Red de salud. */
  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  healthNetworkName?: string | null;

  /** SEDES (`SEDES_*`). */
  @ApiPropertyOptional({ example: 'SEDES_SCZ', nullable: true })
  @IsOptional()
  @IsString()
  sedesCode?: string | null;

  /** Municipio. */
  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  municipalityName?: string | null;
}

/** Cuerpo de `POST /sites/{siteId}/licenses`. */
export class CreateSiteLicenseDto {
  /** Autoridad que emite (SEDES, CODELAB…). */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  authorityName?: string;

  /** Número de resolución. */
  @ApiProperty({ maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  resolutionNumber!: string;

  /** Fecha de emisión (AAAA-MM-DD). */
  @ApiPropertyOptional({ example: '2026-01-15' })
  @IsOptional()
  @IsDateString()
  issuedOn?: string;

  /** Fecha de vencimiento (AAAA-MM-DD). */
  @ApiPropertyOptional({ example: '2028-01-15' })
  @IsOptional()
  @IsDateString()
  expiresOn?: string;

  /** Estado (`LIC_*`); por omisión `LIC_IN_PROCESS`. */
  @ApiPropertyOptional({ example: 'LIC_VALID' })
  @IsOptional()
  @IsString()
  status?: string;

  /** Alcance por unidad. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /** Alcance por servicio. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  /** Documento de respaldo. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  documentFileId?: string;
}

/** Cuerpo de `PATCH /site-licenses/{id}`. `null` limpia fechas, alcance y documento. */
export class UpdateSiteLicenseDto {
  /** Autoridad. */
  @ApiPropertyOptional({ maxLength: 200, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  authorityName?: string | null;

  /** Número de resolución. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  resolutionNumber?: string;

  /** Emisión. */
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  issuedOn?: string | null;

  /** Vencimiento. */
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsDateString()
  expiresOn?: string | null;

  /** Estado (`LIC_*`). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  /** Alcance por unidad. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string | null;

  /** Alcance por servicio. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string | null;

  /** Documento. */
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @IsOptional()
  @IsUUID()
  documentFileId?: string | null;
}

/** Cuerpo de `POST /sites/{siteId}/declared-capacities`. */
export class DeclareCapacityDto {
  /** Tipo de capacidad (`CAP_*`). */
  @ApiProperty({ example: 'CAP_BEDS_CENSABLE' })
  @IsString()
  capacityKindCode!: string;

  /** Cantidad declarada. */
  @ApiProperty()
  @IsInt()
  @Min(0)
  quantity!: number;

  /** Fecha de corte (AAAA-MM-DD). */
  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  asOf!: string;

  /** Resolución que la respalda. */
  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  resolutionNumber?: string;

  /** Fin de vigencia. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  validTo?: string;
}
