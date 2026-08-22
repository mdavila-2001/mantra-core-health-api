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
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único global de la definición',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Identificador asociado a value set.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Value set de terminología del que sale el enum',
  })
  @IsUUID()
  valueSetId!: string;

  /**
   * Identificador asociado a scope type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Ámbito de la definición (catálogo abierto)',
  })
  @IsUUID()
  scopeTypeConceptId!: string;

  /**
   * Identificador asociado a selection mode concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Modo de selección (catálogo abierto)',
  })
  @IsUUID()
  selectionModeConceptId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a country concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Valor de allow tenant extension mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'El tenant puede añadir opciones propias',
  })
  @IsOptional()
  @IsBoolean()
  allowTenantExtension?: boolean;

  /**
   * Valor de allow custom value mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Se admite un valor fuera del catálogo',
  })
  @IsOptional()
  @IsBoolean()
  allowCustomValue?: boolean;
}

/**
 * Define el contrato validado para enum definition response.
 */
export class EnumDefinitionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'La definición nace en borrador',
  })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-02 · Versión de enum con snapshot de opciones
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para enum option.
 */
export class EnumOptionDto {
  /**
   * Identificador asociado a concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Concepto de terminología' })
  @IsUUID()
  conceptId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de display mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  display!: string;

  /**
   * Valor de ordinal mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Orden de presentación; por defecto, el del array',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  ordinal?: number;

  /**
   * Valor de is default mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Sólo una opción puede serlo',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /**
   * Valor de metadata json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadataJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /system-context/dynamic-enums/{defId}/versions` (UC-45-02). */
export class DraftEnumVersionDto {
  /**
   * Identificador asociado a value set version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión del value set que se congela',
  })
  // Obligatoria, aunque el DTO la declaraba opcional: la entidad
  // `DynamicEnumVersions` la exige, así que omitirla no producía una versión
  // sin value set — producía un 500 del ORM ya dentro de la transacción, con
  // un mensaje que sólo se entiende leyendo el modelo (18/08/2026). Una
  // versión de enumeración *es* el congelado de una versión de value set: sin
  // ella no hay nada que congelar.
  @IsUUID()
  valueSetVersionId!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 50 })
  // Obligatoria por el mismo motivo que `valueSetVersionId`: la entidad la
  // exige y omitirla moría con un 500 del ORM dentro de la transacción.
  @IsString()
  @MaxLength(50)
  schemaVersion!: string;

  /**
   * Valor de options mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para enum version response.
 */
export class EnumVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de option ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  optionIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-45-03 · Publicación de versión de enum
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para publish enum version response.
 */
export class PublishEnumVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de cache token mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Token nuevo; invalida la caché de la definición',
  })
  cacheToken!: string;

  /**
   * Identificador asociado a superseded version.
   */
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
  /**
   * Valor de target schema name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Esquema del campo destino', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetSchemaName!: string;

  /**
   * Valor de target entity name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entidad del campo destino', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetEntityName!: string;

  /**
   * Valor de target field name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Campo gobernado por el enum', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetFieldName!: string;

  /**
   * Identificador asociado a system context.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Contexto que acota la resolución',
  })
  @IsOptional()
  @IsUUID()
  systemContextId?: string;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'El campo no admite quedarse vacío',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Identificador asociado a fallback concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Concepto al que se cae en modo LENIENT; obligatorio en ese modo',
  })
  @IsOptional()
  @IsUUID()
  fallbackConceptId?: string;

  /**
   * Valor de validation mode mantenido por la instancia.
   */
  @ApiProperty({ enum: VALIDATION_MODES })
  @IsIn(VALIDATION_MODES)
  validationMode!: ValidationMode;
}

/**
 * Define el contrato validado para enum binding response.
 */
export class EnumBindingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a dynamic enum definition.
   */
  @ApiProperty({ format: 'uuid' })
  dynamicEnumDefinitionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-05 · Resolución y validación de un valor
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/dynamic-enums/resolve` (UC-45-05). */
export class ResolveEnumValueDto {
  /**
   * Valor de target schema name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetSchemaName!: string;

  /**
   * Valor de target entity name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetEntityName!: string;

  /**
   * Valor de target field name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  targetFieldName!: string;

  /**
   * Identificador asociado a concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Valor propuesto, por concepto',
  })
  @IsOptional()
  @IsUUID()
  conceptId?: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Valor propuesto, por código de la opción',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  code?: string;
}

/**
 * Define el contrato validado para resolve enum value response.
 */
export class ResolveEnumValueResponseDto {
  /**
   * Valor de accepted mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el valor puede escribirse' })
  accepted!: boolean;

  /**
   * Identificador asociado a resolved concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Concepto resuelto que debe persistirse',
  })
  resolvedConceptId?: string;

  /**
   * Valor de resolved code mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Código de la opción resuelta' })
  resolvedCode?: string;

  /**
   * Valor de used fallback mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si se cayó al concepto de reserva del binding',
  })
  usedFallback!: boolean;

  /**
   * Identificador asociado a validation mode concept.
   */
  @ApiProperty({ format: 'uuid', description: 'Modo con el que se evaluó' })
  validationModeConceptId!: string;

  /**
   * Valor de cache token mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Token de la versión resuelta; identifica la caché',
  })
  cacheToken!: string;

  /**
   * Valor de rejection reason mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Por qué se rechazó' })
  rejectionReason?: string;
}

// ---------------------------------------------------------------------------
// UC-45-11 · Retiro de la definición
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/dynamic-enums/definitions/{defId}/retire` (UC-45-11). */
export class RetireEnumDefinitionDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se retira' })
  @IsString()
  reason!: string;
}

/**
 * Define el contrato validado para retire enum definition response.
 */
export class RetireEnumDefinitionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de disabled bindings mantenido por la instancia.
   */
  @ApiProperty({ description: 'Bindings que quedan deshabilitados' })
  disabledBindings!: number;
}

// ---------------------------------------------------------------------------
// UC-45-06 · Contexto de sistema y versión inicial
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/contexts` (UC-45-06). */
export class CreateSystemContextDto {
  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único del contexto', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  /**
   * Valor de description mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  /**
   * Identificador asociado a context type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de contexto (catálogo abierto)',
  })
  @IsUUID()
  contextTypeConceptId!: string;

  /**
   * Identificador asociado a scope type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Ámbito del contexto (catálogo abierto)',
  })
  @IsUUID()
  scopeTypeConceptId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a country concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Identificador asociado a locale concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  localeConceptId?: string;

  /**
   * Identificador asociado a refresh policy concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Política de refresco (catálogo abierto)',
  })
  @IsOptional()
  @IsUUID()
  refreshPolicyConceptId?: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  /**
   * Valor de context json mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Contenido del contexto. Nunca secretos: sólo referencias gobernadas.',
  })
  @IsObject()
  contextJson!: Record<string, unknown>;
}

/**
 * Define el contrato validado para system context response.
 */
export class SystemContextResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty()
  code!: string;

  /**
   * Identificador asociado a current version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión 1, creada en la misma transacción',
  })
  currentVersionId!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hash del contenido de la versión inicial' })
  contentHash!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-07 / UC-45-08 · Refresco con procedencia
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para context input.
 */
export class ContextInputDto {
  /**
   * Identificador asociado a source type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza de la fuente (catálogo abierto)',
  })
  @IsUUID()
  sourceTypeConceptId!: string;

  /**
   * Valor de source schema name mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceSchemaName?: string;

  /**
   * Valor de source entity name mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceEntityName?: string;

  /**
   * Identificador asociado a source record.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceRecordId?: string;

  /**
   * Identificador asociado a source version.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceVersionId?: string;

  /**
   * Valor de source content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del contenido de la fuente en el momento del snapshot',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  sourceContentHash?: string;

  /**
   * Valor de source freshness at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Frescura del dato de origen',
  })
  @IsOptional()
  @IsISO8601()
  sourceFreshnessAt?: string;

  /**
   * Valor de precedence mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Precedencia; menor gana ante colisión',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  precedence?: number;

  /**
   * Valor de required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si falta, la corrida falla',
  })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  /**
   * Valor de missing mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'true si la entrada no pudo recogerse' })
  @IsOptional()
  @IsBoolean()
  missing?: boolean;
}

/** Cuerpo de `POST /system-context/contexts/{id}/refresh` (UC-45-07, incluye UC-45-08). */
export class RefreshSystemContextDto {
  /**
   * Valor de idempotency key mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Clave de idempotencia de la corrida',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  idempotencyKey!: string;

  /**
   * Valor de trigger mantenido por la instancia.
   */
  @ApiProperty({ enum: REFRESH_TRIGGERS })
  @IsIn(REFRESH_TRIGGERS)
  trigger!: RefreshTrigger;

  /**
   * Valor de context json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Contenido regenerado del contexto' })
  @IsObject()
  contextJson!: Record<string, unknown>;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  schemaVersion?: string;

  /**
   * Identificador asociado a generated by agent.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente que generó el contenido',
  })
  @IsOptional()
  @IsUUID()
  generatedByAgentId?: string;

  /**
   * Valor de inputs mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para refresh run response.
 */
export class RefreshRunResponseDto {
  /**
   * Identificador asociado a run.
   */
  @ApiProperty({ format: 'uuid' })
  runId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión redactada, si hubo cambio',
  })
  versionId?: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Número de la versión redactada' })
  versionNumber?: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hash del contenido regenerado' })
  contentHash!: string;

  /**
   * Valor de unchanged mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el contenido no cambió y no se redactó versión',
  })
  unchanged!: boolean;

  /**
   * Valor de input count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Entradas de procedencia registradas' })
  inputCount!: number;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la corrida ya existía con esa clave' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-45-09 · Promoción de versión
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/contexts/{id}/versions/{version}/activate` (UC-45-09). */
export class ActivateContextVersionDto {
  /**
   * Valor de expected content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Hash esperado; si no coincide con el de la versión, no se activa',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  expectedContentHash?: string;
}

/**
 * Define el contrato validado para activate context version response.
 */
export class ActivateContextVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Identificador asociado a superseded version.
   */
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
  /**
   * Identificador asociado a consumer type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Naturaleza del consumidor (catálogo abierto)',
  })
  @IsUUID()
  consumerTypeConceptId!: string;

  /**
   * Identificador asociado a consumer.
   */
  @ApiProperty({ format: 'uuid', description: 'Consumidor concreto' })
  @IsUUID()
  consumerId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Identificador asociado a country concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  countryConceptId?: string;

  /**
   * Valor de activation rule json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Condición de activación del binding' })
  @IsOptional()
  @IsObject()
  activationRuleJson?: Record<string, unknown>;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Desempata varios bindings; menor gana',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  priority?: number;

  /**
   * Valor de valid from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  /**
   * Valor de valid to mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;
}

/**
 * Define el contrato validado para context binding response.
 */
export class ContextBindingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a system context.
   */
  @ApiProperty({ format: 'uuid' })
  systemContextId!: string;

  /**
   * Valor de priority mantenido por la instancia.
   */
  @ApiProperty()
  priority!: number;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// ---------------------------------------------------------------------------
// UC-45-12 · Rollback
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /system-context/contexts/{id}/rollback` (UC-45-12). */
export class RollbackContextDto {
  /**
   * Valor de target version number mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión a reactivar', minimum: 1 })
  @IsInt()
  @Min(1)
  targetVersionNumber!: number;

  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se vuelve atrás' })
  @IsString()
  reason!: string;

  /**
   * Valor de expected content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash esperado de la versión objetivo' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  expectedContentHash?: string;
}

/**
 * Define el contrato validado para rollback context response.
 */
export class RollbackContextResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Versión reactivada' })
  id!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Identificador asociado a superseded version.
   */
  @ApiProperty({ format: 'uuid', description: 'Versión que queda superseded' })
  supersededVersionId!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;
}

// --- Lectura del catálogo de enumeraciones (cara de consulta de UC-45-04/05) ---

/**
 * Una opción ofrecible en un selector, ya resuelta.
 *
 * Lleva a la vez el `conceptId` -que es lo que se persiste- y el `code`/`display`
 * -que es lo que se pinta-, de modo que el formulario no necesita una segunda
 * llamada a terminología para rotular lo que ya tiene.
 */
export class DynamicEnumOptionItemDto {
  /**
   * Concepto que respalda la opción; es el valor que se envía al escribir.
   */
  @ApiProperty({ format: 'uuid' })
  conceptId!: string;

  /**
   * Código estable del concepto.
   */
  @ApiProperty()
  code!: string;

  /**
   * Rótulo legible de la opción.
   */
  @ApiProperty()
  display!: string;

  /**
   * Posición en la que se ofrece, empezando en cero.
   */
  @ApiPropertyOptional()
  ordinal?: number;

  /**
   * Si la opción viene preseleccionada.
   */
  @ApiProperty()
  isDefault!: boolean;
}

/**
 * Enumeración publicada, lista para poblar un selector.
 *
 * El `cacheToken` es el de la versión publicada: mientras no cambie, el cliente
 * puede reutilizar lo que ya tiene sin volver a pedirlo.
 */
export class ReadDynamicEnumResponseDto {
  /**
   * Código estable de la enumeración.
   */
  @ApiProperty()
  code!: string;

  /**
   * Nombre legible de la enumeración.
   */
  @ApiProperty()
  name!: string;

  /**
   * Qué gobierna la enumeración.
   */
  @ApiPropertyOptional()
  description?: string;

  /**
   * Identificador de la definición.
   */
  @ApiProperty({ format: 'uuid' })
  definitionId!: string;

  /**
   * Conjunto de valores de terminología del que sale la enumeración.
   */
  @ApiProperty({ format: 'uuid' })
  valueSetId!: string;

  /**
   * Versión publicada de la que salen las opciones.
   */
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  /**
   * Versión del value set que la versión vigente congeló.
   *
   * Es lo que hay que volver a mandar para redactar la siguiente: la entidad la
   * exige y ninguna otra lectura la exponía.
   */
  @ApiProperty({ format: 'uuid' })
  valueSetVersionId!: string;

  /** Versión de esquema que la versión vigente declara. Se repite al redactar. */
  @ApiProperty({ maxLength: 50 })
  schemaVersion!: string;

  /**
   * Testigo de caché de la versión publicada.
   */
  @ApiPropertyOptional()
  cacheToken?: string;

  /**
   * Si el campo admite un valor fuera del conjunto.
   */
  @ApiProperty()
  allowCustomValue!: boolean;

  /**
   * Opciones habilitadas, en el orden en que se ofrecen.
   */
  @ApiProperty({ type: [DynamicEnumOptionItemDto] })
  options!: DynamicEnumOptionItemDto[];
}

/**
 * Un amarre `esquema.tabla.columna` -> enumeración.
 *
 * Es lo que permite que un formulario sepa qué campos suyos son de catálogo sin
 * conocer ningún identificador de antemano.
 */
export class DynamicEnumBindingItemDto {
  /**
   * Campo gobernado, en la forma `esquema.tabla.columna`.
   */
  @ApiProperty({ example: 'profiles.persons.administrative_gender_concept_id' })
  target!: string;

  /**
   * Esquema de la tabla destino.
   */
  @ApiProperty()
  targetSchemaName!: string;

  /**
   * Tabla destino.
   */
  @ApiProperty()
  targetEntityName!: string;

  /**
   * Columna destino.
   */
  @ApiProperty()
  targetFieldName!: string;

  /**
   * Código estable de la enumeración que lo gobierna.
   */
  @ApiProperty()
  enumCode!: string;

  /**
   * Identificador de la definición.
   */
  @ApiProperty({ format: 'uuid' })
  definitionId!: string;

  /**
   * Conjunto de valores del que sale la enumeración.
   */
  @ApiProperty({ format: 'uuid' })
  valueSetId!: string;

  /**
   * Si el amarre declara el campo obligatorio.
   */
  @ApiProperty()
  required!: boolean;

  /**
   * Concepto de reserva cuando la validación es permisiva.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  fallbackConceptId?: string;

  /**
   * Modo de validación con el que se resuelve el valor propuesto.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  validationModeConceptId?: string;
}

/**
 * Tabla de amarres campo -> enumeración.
 */
export class ListDynamicEnumBindingsResponseDto {
  /**
   * Amarres activos, ordenados por campo.
   */
  @ApiProperty({ type: [DynamicEnumBindingItemDto] })
  items!: DynamicEnumBindingItemDto[];

  /**
   * Cuántos amarres trae la respuesta.
   */
  @ApiProperty()
  count!: number;
}
