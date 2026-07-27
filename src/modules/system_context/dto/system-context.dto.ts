import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Cómo se comporta la validación de escritura cuando el valor no pertenece al
 * conjunto permitido.
 */
export type ValidationMode = 'STRICT' | 'LENIENT';
const VALIDATION_MODES = ['STRICT', 'LENIENT'] as const;

/** Qué disparó la corrida de refresco. */
export type RefreshTrigger = 'SCHEDULED' | 'MANUAL' | 'EVENT';
const REFRESH_TRIGGERS = ['SCHEDULED', 'MANUAL', 'EVENT'] as const;

// ---------------------------------------------------------------------------
// UC-45-01 · Definición de enumeración dinámica
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/dynamic-enums/definitions` (UC-45-01). */
export class CreateEnumDefinitionDto {
  @ApiProperty({
    description: 'Código único global de la definición',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Value set de terminología del que sale el enum',
  })
  @IsUUID()
  valueSetId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Ámbito de la definición (catálogo abierto)',
  })
  @IsUUID()
  scopeTypeConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Modo de selección (catálogo abierto)',
  })
  @IsUUID()
  selectionModeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'El tenant puede añadir opciones propias',
  })
  @IsOptional()
  @IsBoolean()
  allowTenantExtension?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Se admite un valor fuera del catálogo',
  })
  @IsOptional()
  @IsBoolean()
  allowCustomValue?: boolean;
}

export class EnumDefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'La definición nace en borrador',
  })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-02 · Versión de enum con snapshot de opciones
// ---------------------------------------------------------------------------

export class EnumOptionDto {
  @ApiProperty({ format: 'uuid', description: 'Concepto de terminología' })
  @IsUUID()
  conceptId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  display!: string;

  @ApiPropertyOptional({
    description: 'Orden de presentación; por defecto, el del array',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Sólo una opción puede serlo',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /system-context/dynamic-enums/{defId}/versions` (UC-45-02). */
export class DraftEnumVersionDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión del value set que se congela',
  })
  @IsOptional()
  @IsUUID()
  valueSetVersionId?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  @ApiProperty({
    type: [EnumOptionDto],
    description: 'Snapshot ordenado de las opciones',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EnumOptionDto)
  options!: EnumOptionDto[];
}

export class EnumVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: [String], format: 'uuid' })
  optionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-45-03 · Publicación de versión de enum
// ---------------------------------------------------------------------------

export class PublishEnumVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description: 'Token nuevo; invalida la caché de la definición',
  })
  cacheToken!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que queda superseded',
  })
  supersededVersionId?: string;
}

// ---------------------------------------------------------------------------
// UC-45-04 · Binding del enum a un campo
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/dynamic-enums/{defId}/bindings` (UC-45-04). */
export class CreateEnumBindingDto {
  @ApiProperty({ description: 'Esquema del campo destino', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetSchemaName!: string;

  @ApiProperty({ description: 'Entidad del campo destino', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetEntityName!: string;

  @ApiProperty({ description: 'Campo gobernado por el enum', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetFieldName!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Contexto que acota la resolución',
  })
  @IsOptional()
  @IsUUID()
  systemContextId?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'El campo no admite quedarse vacío',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Concepto al que se cae en modo LENIENT; obligatorio en ese modo',
  })
  @IsOptional()
  @IsUUID()
  fallbackConceptId?: string;

  @ApiProperty({ enum: VALIDATION_MODES })
  @IsIn(VALIDATION_MODES)
  validationMode!: ValidationMode;
}

export class EnumBindingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  dynamicEnumDefinitionId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-05 · Resolución y validación de un valor
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/dynamic-enums/resolve` (UC-45-05). */
export class ResolveEnumValueDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetSchemaName!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetEntityName!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetFieldName!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Valor propuesto, por concepto',
  })
  @IsOptional()
  @IsUUID()
  conceptId?: string;

  @ApiPropertyOptional({
    description: 'Valor propuesto, por código de la opción',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;
}

export class ResolveEnumValueResponseDto {
  @ApiProperty({ description: 'true si el valor puede escribirse' })
  accepted!: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concepto resuelto que debe persistirse',
  })
  resolvedConceptId?: string;

  @ApiPropertyOptional({ description: 'Código de la opción resuelta' })
  resolvedCode?: string;

  @ApiProperty({
    description: 'true si se cayó al concepto de reserva del binding',
  })
  usedFallback!: boolean;

  @ApiProperty({ format: 'uuid', description: 'Modo con el que se evaluó' })
  validationModeConceptId!: string;

  @ApiProperty({
    description: 'Token de la versión resuelta; identifica la caché',
  })
  cacheToken!: string;

  @ApiPropertyOptional({ description: 'Por qué se rechazó' })
  rejectionReason?: string;
}

// ---------------------------------------------------------------------------
// UC-45-11 · Retiro de la definición
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/dynamic-enums/definitions/{defId}/retire` (UC-45-11). */
export class RetireEnumDefinitionDto {
  @ApiProperty({ description: 'Por qué se retira' })
  @IsString()
  reason!: string;
}

export class RetireEnumDefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ description: 'Bindings que quedan deshabilitados' })
  disabledBindings!: number;
}

// ---------------------------------------------------------------------------
// UC-45-06 · Contexto de sistema y versión inicial
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/contexts` (UC-45-06). */
export class CreateSystemContextDto {
  @ApiProperty({ description: 'Código único del contexto', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de contexto (catálogo abierto)',
  })
  @IsUUID()
  contextTypeConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Ámbito del contexto (catálogo abierto)',
  })
  @IsUUID()
  scopeTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  localeConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Política de refresco (catálogo abierto)',
  })
  @IsOptional()
  @IsUUID()
  refreshPolicyConceptId?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  @ApiProperty({
    description:
      'Contenido del contexto. Nunca secretos: sólo referencias gobernadas.',
  })
  @IsObject()
  contextJson!: Record<string, unknown>;
}

export class SystemContextResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Versión 1, creada en la misma transacción',
  })
  currentVersionId!: string;

  @ApiProperty({ description: 'Hash del contenido de la versión inicial' })
  contentHash!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-07 / UC-45-08 · Refresco con procedencia
// ---------------------------------------------------------------------------

export class ContextInputDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza de la fuente (catálogo abierto)',
  })
  @IsUUID()
  sourceTypeConceptId!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceSchemaName?: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceEntityName?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceRecordId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceVersionId?: string;

  @ApiPropertyOptional({
    description: 'Hash del contenido de la fuente en el momento del snapshot',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceContentHash?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Frescura del dato de origen',
  })
  @IsOptional()
  @IsISO8601()
  sourceFreshnessAt?: string;

  @ApiPropertyOptional({
    description: 'Precedencia; menor gana ante colisión',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  precedence?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Si falta, la corrida falla',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'true si la entrada no pudo recogerse' })
  @IsOptional()
  @IsBoolean()
  missing?: boolean;
}

/** Cuerpo de `POST /system-context/contexts/{id}/refresh` (UC-45-07, incluye UC-45-08). */
export class RefreshSystemContextDto {
  @ApiProperty({
    description: 'Clave de idempotencia de la corrida',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  @ApiProperty({ enum: REFRESH_TRIGGERS })
  @IsIn(REFRESH_TRIGGERS)
  trigger!: RefreshTrigger;

  @ApiProperty({ description: 'Contenido regenerado del contexto' })
  @IsObject()
  contextJson!: Record<string, unknown>;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente que generó el contenido',
  })
  @IsOptional()
  @IsUUID()
  generatedByAgentId?: string;

  @ApiPropertyOptional({
    type: [ContextInputDto],
    description: 'Procedencia de lo recogido',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContextInputDto)
  inputs?: ContextInputDto[];
}

export class RefreshRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  runId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión redactada, si hubo cambio',
  })
  versionId?: string;

  @ApiPropertyOptional({ description: 'Número de la versión redactada' })
  versionNumber?: number;

  @ApiProperty({ description: 'Hash del contenido regenerado' })
  contentHash!: string;

  @ApiProperty({
    description: 'true si el contenido no cambió y no se redactó versión',
  })
  unchanged!: boolean;

  @ApiProperty({ description: 'Entradas de procedencia registradas' })
  inputCount!: number;

  @ApiProperty({ description: 'true si la corrida ya existía con esa clave' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-45-09 · Promoción de versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/contexts/{id}/versions/{version}/activate` (UC-45-09). */
export class ActivateContextVersionDto {
  @ApiPropertyOptional({
    description:
      'Hash esperado; si no coincide con el de la versión, no se activa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  expectedContentHash?: string;
}

export class ActivateContextVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión que queda superseded',
  })
  supersededVersionId?: string;
}

// ---------------------------------------------------------------------------
// UC-45-10 · Binding del contexto a un consumidor
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/contexts/{id}/bindings` (UC-45-10). */
export class CreateContextBindingDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza del consumidor (catálogo abierto)',
  })
  @IsUUID()
  consumerTypeConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Consumidor concreto' })
  @IsUUID()
  consumerId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  @ApiPropertyOptional({ description: 'Condición de activación del binding' })
  @IsOptional()
  @IsObject()
  activationRuleJson?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: 'Desempata varios bindings; menor gana',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

export class ContextBindingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  systemContextId!: string;

  @ApiProperty()
  priority!: number;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-12 · Rollback
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/contexts/{id}/rollback` (UC-45-12). */
export class RollbackContextDto {
  @ApiProperty({ description: 'Versión a reactivar', minimum: 1 })
  @IsInt()
  @Min(1)
  targetVersionNumber!: number;

  @ApiProperty({ description: 'Por qué se vuelve atrás' })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ description: 'Hash esperado de la versión objetivo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  expectedContentHash?: string;
}

export class RollbackContextResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Versión reactivada' })
  id!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ format: 'uuid', description: 'Versión que queda superseded' })
  supersededVersionId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}
