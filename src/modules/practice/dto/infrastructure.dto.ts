import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { CareSpaceAttributesDto } from './care-space-attributes.dto';
import {
  LIFECYCLE_ACTIONS,
  type LifecycleAction,
} from '../domain/structure/lifecycle';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Cuerpo de `POST /sites/:siteId/care-spaces/bulk` (contrato §3). */
export class BulkCreateCareSpacesDto extends CareSpaceAttributesDto {
  @ApiPropertyOptional({
    description: 'Padre común (misma sede). Ausente o null: raíz',
    format: 'uuid',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string | null;

  @ApiProperty({ description: 'Forma (LOC_FORM_*)' })
  @IsString()
  formCode!: string;

  @ApiProperty({ description: 'Función (SPACE_FN_* o SPACE_TYPE_ROOM)' })
  @IsString()
  functionCode!: string;

  @ApiProperty({
    description: 'Patrón de código con un rango: "301-{A..H}", "CAMA-{1..12}"',
    example: 'CAMA-{1..12}',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  codePattern!: string;

  @ApiProperty({
    description:
      'Patrón del nombre: el mismo rango, "{}" o nada (se agrega al final)',
    example: 'Cama {1..12}',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  namePattern!: string;

  @ApiPropertyOptional({
    description: 'Unidad clínica (misma sede)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({ description: 'Nacer ACTIVOS (padre activo)' })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}

/** Cuerpo de `POST /sites/:siteId/care-spaces/import` (contrato §3). */
export class ImportCareSpacesDto {
  @ApiProperty({
    description:
      'Filas ya parseadas por el cliente. Cada una: code, name, formCode, functionCode, ' +
      'parentCode? (código de un espacio existente o de una fila anterior), clinicalUnitCode?, ' +
      'activate?, y los atributos de CareSpaceAttributes. Se validan fila por fila.',
    type: 'array',
    items: { type: 'object', additionalProperties: true },
    maxItems: 500,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  // Sin esto, `enableImplicitConversion` (pipe global) aplica el tipo de
  // diseño `Array` a cada elemento y la fila llega como `[]` (lo detectó el
  // E2E de F1). `Object` deja cada fila tal cual; se valida en el servicio.
  @Type(() => Object)
  rows!: Record<string, unknown>[];
}

/** Cuerpo de `PATCH /care-spaces/:id` (contrato §3). */
export class UpdateCareSpaceDto extends CareSpaceAttributesDto {
  @ApiPropertyOptional({
    description: 'Código: sólo mientras el espacio está PLANNED',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ description: 'Nombre', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Forma: sólo mientras el espacio está PLANNED',
  })
  @IsOptional()
  @IsString()
  formCode?: string;

  @ApiPropertyOptional({ description: 'Función (valida perfil y tipología)' })
  @IsOptional()
  @IsString()
  functionCode?: string;

  @ApiPropertyOptional({
    description: 'Unidad clínica principal (misma sede); null la quita',
    format: 'uuid',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string | null;
}

/** Cuerpo de `POST /care-spaces/:id/move`. */
export class MoveCareSpaceDto {
  @ApiPropertyOptional({
    description: 'Nuevo padre (misma sede); null o ausente: raíz',
    format: 'uuid',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string | null;
}

/** Cuerpo de `POST /care-spaces/:id/lifecycle` y `/clinical-units/:id/lifecycle`. */
export class LifecycleChangeDto {
  @ApiProperty({ enum: LIFECYCLE_ACTIONS })
  @IsIn([...LIFECYCLE_ACTIONS])
  action!: LifecycleAction;

  @ApiPropertyOptional({
    description: 'Motivo; obligatorio para suspend y retire',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /care-spaces/:id/unit-assignments`. */
export class CreateUnitAssignmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clinicalUnitId!: string;

  @ApiProperty({
    enum: [
      'SPACE_UNIT_ROLE_OWNER',
      'SPACE_UNIT_ROLE_SHARED',
      'SPACE_UNIT_ROLE_LOAN',
    ],
  })
  @IsIn([
    'SPACE_UNIT_ROLE_OWNER',
    'SPACE_UNIT_ROLE_SHARED',
    'SPACE_UNIT_ROLE_LOAN',
  ])
  roleCode!: string;
}

/** Cuerpo de `PATCH /clinical-units/:id`. */
export class UpdateClinicalUnitDto {
  @ApiPropertyOptional({ description: 'Código: sólo mientras está PLANNED' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ maxLength: 1000, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({
    description: 'Unidad padre (misma sede); null: raíz',
    format: 'uuid',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsUUID()
  parentUnitId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  responsibleUserId?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  specialtyConceptId?: string | null;
}

/** Cuerpo de `PATCH /sites/:siteId/regulatory` (contrato §3). */
export class UpdateSiteRegulatoryDto {
  @ApiPropertyOptional({
    description: 'Código SNIS/SUIS',
    maxLength: 30,
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z0-9-]{1,30}$/)
  snisCode?: string | null;

  @ApiPropertyOptional({
    description: 'SUBSECTOR_*',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  subsectorCode?: string | null;

  @ApiPropertyOptional({
    description: 'CARE_LEVEL_*',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  careLevelCode?: string | null;

  @ApiPropertyOptional({
    description: 'TYPOLOGY_*',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsString()
  typologyCode?: string | null;

  @ApiPropertyOptional({ maxLength: 200, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  managingEntityName?: string | null;

  @ApiPropertyOptional({ maxLength: 200, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  healthNetworkName?: string | null;

  @ApiPropertyOptional({ description: 'SEDES_*', nullable: true, type: String })
  @IsOptional()
  @IsString()
  sedesCode?: string | null;

  @ApiPropertyOptional({ maxLength: 200, nullable: true, type: String })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  municipalityName?: string | null;
}

/** Cuerpo de `POST /sites/:siteId/licenses`. */
export class CreateSiteLicenseDto {
  @ApiProperty({
    description: 'Autoridad emisora (p. ej. SEDES La Paz)',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  authorityName!: string;

  @ApiProperty({ description: 'Número de resolución', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  resolutionNumber!: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  issuedOn?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  expiresOn?: string;

  @ApiPropertyOptional({
    description: 'Alcance: unidad de la sede',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  @ApiPropertyOptional({
    description: 'Alcance: servicio de la sede',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  healthcareServiceId?: string;

  @ApiPropertyOptional({
    description: 'Archivo de la resolución',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  documentFileId?: string;
}

/** Cuerpo de `PATCH /site-licenses/:id`. */
export class UpdateSiteLicenseDto {
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  authorityName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  resolutionNumber?: string;

  @ApiPropertyOptional({ format: 'date', nullable: true, type: String })
  @IsOptional()
  @Matches(DATE)
  issuedOn?: string | null;

  @ApiPropertyOptional({ format: 'date', nullable: true, type: String })
  @IsOptional()
  @Matches(DATE)
  expiresOn?: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true, type: String })
  @IsOptional()
  @IsUUID()
  documentFileId?: string | null;

  @ApiPropertyOptional({
    description:
      'Estado: LIC_IN_PROCESS | LIC_VALID | LIC_REVOKED (sólo plataforma). LIC_EXPIRED se calcula; LIC_SUSPENDED no tiene columna en facility_licenses',
  })
  @IsOptional()
  @IsString()
  statusCode?: string;
}

/** Cuerpo de `POST /sites/:siteId/declared-capacities`. */
export class CreateDeclaredCapacityDto {
  @ApiProperty({ description: 'CAP_*' })
  @IsString()
  kindCode!: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  quantity!: number;

  @ApiProperty({ format: 'date' })
  @Matches(DATE)
  asOf!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  resolutionNumber?: string;

  @ApiPropertyOptional({ format: 'date' })
  @IsOptional()
  @Matches(DATE)
  validTo?: string;
}
