import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Atributos técnicos y descriptivos de un espacio (CONTRATO-F0-F1 §3). Todos
 * opcionales; en un `PATCH`, `null` limpia el dato.
 *
 * Los rangos y los códigos de catálogo se validan en el servicio con el mismo
 * criterio para el alta individual, el lote y la importación; acá sólo el tipo.
 */
export class SpaceAttributesDto {
  /** Descripción libre. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  /** Capacidad (nº de plazas). */
  @ApiPropertyOptional({ description: 'Capacidad (nº de plazas)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;

  /** Número de piso. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  floorNumber?: number;

  /** Superficie útil en m². */
  @ApiPropertyOptional({ description: 'Superficie útil (m²)' })
  @IsOptional()
  @IsNumber()
  areaM2?: number;

  /** Asepsia (`ASEPSIS_*`). */
  @ApiPropertyOptional({ example: 'ASEPSIS_RESTRICTED' })
  @IsOptional()
  @IsString()
  asepsisCode?: string;

  /** Presión (`PRESSURE_*`). */
  @ApiPropertyOptional({ example: 'PRESSURE_NEGATIVE' })
  @IsOptional()
  @IsString()
  pressureCode?: string;

  /** Renovaciones de aire por hora. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  airChangesPerHour?: number;

  /** Fecha de la última validación HVAC (AAAA-MM-DD). */
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @IsDateString()
  hvacValidatedOn?: string;

  /** Restricción de sexo (`SEX_*`). */
  @ApiPropertyOptional({ example: 'SEX_FEMALE' })
  @IsOptional()
  @IsString()
  sexRestrictionCode?: string;

  /** Grupo etario (`AGE_*`). */
  @ApiPropertyOptional({ example: 'AGE_PEDIATRIC' })
  @IsOptional()
  @IsString()
  ageGroupCode?: string;

  /** Categoría de cama (`BED_CAT_*`). */
  @ApiPropertyOptional({ example: 'BED_CAT_PRIVATE' })
  @IsOptional()
  @IsString()
  bedCategoryCode?: string;

  /** La cama cuenta en el censo. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  censable?: boolean;

  /** Minutos de preparación previos al uso. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  prepMinutes?: number;

  /** Minutos de limpieza posteriores al uso. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  cleanupMinutes?: number;

  /** GLN de 13 dígitos. */
  @ApiPropertyOptional({ example: '7790001234567' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{13}$/, { message: 'El GLN tiene 13 dígitos' })
  gln?: string;
}

/** Cuerpo de `POST /sites/{siteId}/care-spaces` (UC-14-05, extendido en F1). */
export class CreateCareSpaceDto extends SpaceAttributesDto {
  /** Código único dentro de la sede (inmutable una vez activo; nunca se reutiliza). */
  @ApiProperty({
    description: 'Código único dentro de la sede',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /** Nombre del espacio. */
  @ApiProperty({ description: 'Nombre del espacio', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /** Forma (`LOC_FORM_*`); por omisión `LOC_FORM_ROOM`. */
  @ApiPropertyOptional({ example: 'LOC_FORM_ROOM' })
  @IsOptional()
  @IsString()
  formCode?: string;

  /** Función (`SPACE_FN_*`); por omisión la genérica. */
  @ApiPropertyOptional({ example: 'SPACE_FN_OPERATING_ROOM' })
  @IsOptional()
  @IsString()
  functionCode?: string;

  /**
   * Concepto de función por id. Heredado: lo usaban los clientes anteriores a F1;
   * `functionCode` manda si vienen los dos.
   */
  @ApiPropertyOptional({
    description: 'Heredado: función por id de concepto',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  spaceTypeConceptId?: string;

  /** Espacio padre (misma sede); sin padre sólo se admiten edificio, área, local y sala virtual. */
  @ApiPropertyOptional({
    description: 'Espacio padre (misma sede)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string;

  /** Unidad clínica propietaria (crea el vínculo OWNER). */
  @ApiPropertyOptional({
    description: 'Unidad clínica (misma sede)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /** Nace activo en vez de planificado (el padre tiene que estar activo). */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}

/** Cuerpo de `PATCH /care-spaces/{id}`. */
export class UpdateCareSpaceDto extends SpaceAttributesDto {
  /** Código (sólo mientras está planificado). */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code?: string;

  /** Nombre. */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  /** Forma (sólo mientras está planificado). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  formCode?: string;

  /** Función. */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  functionCode?: string;
}

/** Cuerpo de `POST /sites/{siteId}/care-spaces/bulk`. */
export class BulkCareSpacesDto extends SpaceAttributesDto {
  /** Espacio padre común (o raíz si se omite y la forma lo admite). */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  parentSpaceId?: string;

  /** Unidad propietaria común. */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalUnitId?: string;

  /** Forma común. */
  @ApiProperty({ example: 'LOC_FORM_BED' })
  @IsString()
  formCode!: string;

  /** Función común. */
  @ApiProperty({ example: 'SPACE_FN_BED_STANDARD' })
  @IsString()
  functionCode!: string;

  /** Patrón del código: un rango `{A..H}` o `{1..12}`. */
  @ApiProperty({ example: '301-{A..H}' })
  @IsString()
  @MaxLength(200)
  codePattern!: string;

  /** Patrón del nombre: puede repetir el rango o usar `{code}`, `{n}`, `{i}`. */
  @ApiProperty({ example: 'Cama 301-{A..H}' })
  @IsString()
  @MaxLength(300)
  namePattern!: string;
}

/** Cuerpo de `POST /sites/{siteId}/care-spaces/import`. */
export class ImportCareSpacesDto {
  /**
   * Filas ya parseadas por el cliente. Cada una se valida **por separado** en el
   * servicio para devolver los errores por línea; por eso acá sólo se exige que
   * sean objetos.
   */
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  @IsArray()
  rows!: unknown[];
}

/** Cuerpo de `POST /care-spaces/{id}/move`. */
export class MoveCareSpaceDto {
  /** Nuevo padre, o `null` para dejarlo en la raíz. */
  @ApiProperty({ format: 'uuid', nullable: true })
  @ValidateIf((body: MoveCareSpaceDto) => body.parentSpaceId !== null)
  @IsUUID()
  parentSpaceId!: string | null;
}

/** Acciones de ciclo de vida (espacio y unidad). */
export const LIFECYCLE_ACTIONS = [
  'activate',
  'suspend',
  'reactivate',
  'retire',
] as const;

/** Cuerpo de `POST /care-spaces/{id}/lifecycle` y `/clinical-units/{id}/lifecycle`. */
export class LifecycleDto {
  /** Acción. */
  @ApiProperty({ enum: LIFECYCLE_ACTIONS })
  @IsIn(LIFECYCLE_ACTIONS)
  action!: (typeof LIFECYCLE_ACTIONS)[number];

  /** Motivo: obligatorio en `suspend` y `retire`. */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

/** Cuerpo de `POST /care-spaces/{id}/unit-assignments`. */
export class CreateUnitAssignmentDto {
  /** Unidad a vincular. */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  clinicalUnitId!: string;

  /** Rol: `SPACE_UNIT_ROLE_OWNER`, `_SHARED` o `_LOAN` (también `OWNER`/`SHARED`/`LOAN`). */
  @ApiProperty({ example: 'SPACE_UNIT_ROLE_OWNER' })
  @IsString()
  roleCode!: string;
}
