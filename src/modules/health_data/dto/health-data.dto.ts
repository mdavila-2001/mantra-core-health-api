import { ApiProperty, ApiPropertyOptional, ApiSchema } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumberString,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * Desenlace de una corrida de validación FHIR. No es un campo de entrada: el
 * servicio lo deriva de las severidades halladas, y el tipo existe para
 * nombrarlo en la documentación.
 */
export type ValidationResult = 'PASS' | 'WARNING' | 'ERROR';

/** Severidad de un hallazgo, en el vocabulario de `OperationOutcome` de FHIR. */
export type IssueSeverity = 'FATAL' | 'ERROR' | 'WARNING' | 'INFORMATION';
const ISSUE_SEVERITIES = ['FATAL', 'ERROR', 'WARNING', 'INFORMATION'] as const;

/** Decisión del responsable de identidad sobre un candidato. */
export type MatchDecision = 'MATCH' | 'NO_MATCH';
const MATCH_DECISIONS = ['MATCH', 'NO_MATCH'] as const;

/** Cómo terminó la corrida de de-identificación. */
export type DeidOutcome = 'COMPLETED' | 'FAILED';
const DEID_OUTCOMES = ['COMPLETED', 'FAILED'] as const;

// ---------------------------------------------------------------------------
// UC-52-01 · Lote de ingesta
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/ingestion-batches` (UC-52-01). */
export class OpenIngestionBatchDto {
  /**
   * Identificador asociado a health source connection.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Conexión de origen que trae el lote',
  })
  @IsUUID()
  healthSourceConnectionId!: string;

  /**
   * Valor de batch identifier mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificador del lote en el origen',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  batchIdentifier!: string;

  /**
   * Identificador asociado a ingestion mode concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Modo de ingesta (catálogo abierto)',
  })
  @IsUUID()
  ingestionModeConceptId!: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de source period start mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  sourcePeriodStart?: string;

  /**
   * Valor de source period end mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  sourcePeriodEnd?: string;

  /**
   * Identificador asociado a payload manifest file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del payload en almacenamiento',
  })
  @IsOptional()
  @IsUUID()
  payloadManifestFileId?: string;
}

/**
 * Define el contrato validado para ingestion batch response.
 */
export class IngestionBatchResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de batch identifier mantenido por la instancia.
   */
  @ApiProperty()
  batchIdentifier!: string;

  /**
   * Identificador asociado a status concept.
   */
  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el lote ya existía y se devuelve el mismo',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-52-02 · Registros crudos y cierre del lote
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/ingestion-batches/{id}/records` (UC-52-02). */
export class RecordIngestionRecordDto {
  /**
   * Valor de source record identifier mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificador del registro en el origen',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  sourceRecordIdentifier!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de recurso (catálogo abierto)',
  })
  @IsUUID()
  resourceTypeConceptId!: string;

  /**
   * Valor de payload hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del payload; detecta que nada cambió',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  payloadHash!: string;

  /**
   * Valor de source version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión del registro en el origen',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceVersion?: string;

  /**
   * Valor de source last updated at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  sourceLastUpdatedAt?: string;

  /**
   * Identificador asociado a payload file.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Payload persistido en almacenamiento',
  })
  @IsOptional()
  @IsUUID()
  payloadFileId?: string;
}

/**
 * Define el contrato validado para ingestion record response.
 */
export class IngestionRecordResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a processing status concept.
   */
  @ApiProperty({ format: 'uuid' })
  processingStatusConceptId!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el registro ya estaba en el lote' })
  duplicate!: boolean;
}

/** Cuerpo de `POST /health-data/ingestion-batches/{id}/close` (UC-52-02). */
export class CloseIngestionBatchDto {
  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del contenido completo del lote',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentHash?: string;

  /**
   * Valor de records rejected mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Registros que el origen rechazó antes de llegar',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  recordsRejected?: number;
}

/**
 * Define el contrato validado para close batch response.
 */
export class CloseBatchResponseDto {
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
   * Valor de records received mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Registros recibidos, contados contra la tabla; cadena por ser bigint',
  })
  recordsReceived!: string;

  /**
   * Valor de records accepted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cadena por ser bigint' })
  recordsAccepted!: string;

  /**
   * Valor de records rejected mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cadena por ser bigint' })
  recordsRejected!: string;
}

// ---------------------------------------------------------------------------
// UC-52-03 · Proyección del recurso canónico
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/canonical-resources/project` (UC-52-03). */
export class ProjectCanonicalResourceDto {
  /**
   * Identificador asociado a health ingestion record.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Registro crudo del que sale la proyección',
  })
  @IsUUID()
  healthIngestionRecordId!: string;

  /**
   * Valor de logical identifier mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificador lógico del recurso en el custodio',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  logicalIdentifier!: string;

  /**
   * Valor de normalized payload json mantenido por la instancia.
   */
  @ApiProperty({ description: 'Payload normalizado del recurso' })
  @IsObject()
  normalizedPayloadJson!: Record<string, unknown>;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente al que pertenece el recurso',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a source system.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceSystemId?: string;

  /**
   * Identificador asociado a payload format concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Formato del payload (catálogo abierto)',
  })
  @IsOptional()
  @IsUUID()
  payloadFormatConceptId?: string;

  /**
   * Identificador asociado a original payload file.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  originalPayloadFileId?: string;

  /**
   * Valor de effective start at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveStartAt?: string;

  /**
   * Valor de security labels json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Etiquetas de seguridad del recurso' })
  @IsOptional()
  @IsObject()
  securityLabelsJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para canonical resource version response.
 */
export class CanonicalResourceVersionResponseDto {
  /**
   * Identificador asociado a resource.
   */
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ausente si el contenido no cambió',
  })
  versionId?: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Ausente si el contenido no cambió' })
  versionNumber?: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty()
  contentHash!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el recurso se creó en esta proyección' })
  created!: boolean;

  /**
   * Valor de unchanged mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el payload es idéntico al vigente y no se versionó',
  })
  unchanged!: boolean;

  /**
   * Identificador asociado a provenance record.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Procedencia registrada de la ingesta',
  })
  provenanceRecordId?: string;
}

// ---------------------------------------------------------------------------
// UC-52-04 · Identificadores de negocio
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/canonical-resources/{id}/identifiers` (UC-52-04). */
export class RegisterIdentifierDto {
  /**
   * Valor de identifier system mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Sistema emisor del identificador',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  identifierSystem!: string;

  /**
   * Valor de identifier value mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  identifierValue!: string;

  /**
   * Identificador asociado a identifier type concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  identifierTypeConceptId?: string;

  /**
   * Valor de assigning authority mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  assigningAuthority?: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Sólo uno vigente por sistema; el anterior se cierra',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;
}

/**
 * Define el contrato validado para identifier response.
 */
export class IdentifierResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a canonical health resource.
   */
  @ApiProperty({ format: 'uuid' })
  canonicalHealthResourceId!: string;

  /**
   * Valor de is primary mantenido por la instancia.
   */
  @ApiProperty()
  isPrimary!: boolean;

  /**
   * Identificador asociado a superseded identifier.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Identificador principal que se cerró',
  })
  supersededIdentifierId?: string;
}

// ---------------------------------------------------------------------------
// UC-52-05 · Relación entre recursos
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/canonical-resources/{id}/relationships` (UC-52-05). */
@ApiSchema({ name: 'HealthDataCreateRelationshipDto' })
export class CreateRelationshipDto {
  /**
   * Identificador asociado a target resource.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Recurso al que apunta la relación',
  })
  @IsUUID()
  targetResourceId!: string;

  /**
   * Identificador asociado a relationship type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de relación (catálogo abierto)',
  })
  @IsUUID()
  relationshipTypeConceptId!: string;

  /**
   * Identificador asociado a relationship role concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relationshipRoleConceptId?: string;

  /**
   * Valor de effective from mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Confianza, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  confidenceScore?: string;
}

/**
 * Define el contrato validado para relationship response.
 */
export class RelationshipResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a source resource.
   */
  @ApiProperty({ format: 'uuid' })
  sourceResourceId!: string;

  /**
   * Identificador asociado a target resource.
   */
  @ApiProperty({ format: 'uuid' })
  targetResourceId!: string;

  /**
   * Identificador asociado a superseded relationship.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Relación anterior que se cerró',
  })
  supersededRelationshipId?: string;
}

// ---------------------------------------------------------------------------
// UC-52-06 · Binding a entidad de dominio
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/canonical-resources/{id}/bindings` (UC-52-06). */
export class CreateResourceBindingDto {
  /**
   * Identificador asociado a domain entity type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de entidad de dominio (catálogo abierto)',
  })
  @IsUUID()
  domainEntityTypeConceptId!: string;

  /**
   * Identificador asociado a domain entity.
   */
  @ApiProperty({ format: 'uuid', description: 'Entidad de dominio concreta' })
  @IsUUID()
  domainEntityId!: string;

  /**
   * Identificador asociado a binding role concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bindingRoleConceptId?: string;

  /**
   * Identificador asociado a mapping version.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión del mapeo terminológico aplicado',
  })
  @IsOptional()
  @IsUUID()
  mappingVersionId?: string;
}

/**
 * Define el contrato validado para resource binding response.
 */
export class ResourceBindingResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a canonical health resource.
   */
  @ApiProperty({ format: 'uuid' })
  canonicalHealthResourceId!: string;

  /**
   * Identificador asociado a binding status concept.
   */
  @ApiProperty({ format: 'uuid' })
  bindingStatusConceptId!: string;

  /**
   * Identificador asociado a lineage edge.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Arista de linaje versión → entidad de dominio',
  })
  lineageEdgeId!: string;
}

// ---------------------------------------------------------------------------
// UC-52-07 · Validación contra perfil FHIR R5
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para validation issue.
 */
export class ValidationIssueDto {
  /**
   * Valor de severity mantenido por la instancia.
   */
  @ApiProperty({ enum: ISSUE_SEVERITIES })
  @IsIn(ISSUE_SEVERITIES)
  severity!: IssueSeverity;

  /**
   * Valor de issue code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issueCode?: string;

  /**
   * Valor de expression path mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Ruta FHIRPath del hallazgo',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  expressionPath?: string;

  /**
   * Valor de diagnostics text mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosticsText?: string;

  /**
   * Valor de location json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  locationJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /health-data/versions/{id}/validate` (UC-52-07). */
export class ValidateVersionDto {
  /**
   * Identificador asociado a fhir profile version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión del perfil FHIR contra la que se valida',
  })
  @IsUUID()
  fhirProfileVersionId!: string;

  /**
   * Valor de validator version mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Versión del validador que produjo el resultado',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  validatorVersion!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Cuándo empezó la validación',
  })
  @IsISO8601()
  startedAt!: string;

  /**
   * Valor de issues mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [ValidationIssueDto],
    description: 'Hallazgos del validador',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationIssueDto)
  issues?: ValidationIssueDto[];

  /**
   * Valor de summary json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  summaryJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para validation run response.
 */
export class ValidationRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a result concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Resultado derivado de las severidades halladas',
  })
  resultConceptId!: string;

  /**
   * Valor de issue count mantenido por la instancia.
   */
  @ApiProperty()
  issueCount!: number;

  /**
   * Valor de quarantined mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el recurso quedó en cuarentena' })
  quarantined!: boolean;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si esa validación ya se había corrido' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-52-08 · Corrida de reglas de calidad
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para quality finding.
 */
export class QualityFindingDto {
  /**
   * Identificador asociado a health data quality rule.
   */
  @ApiProperty({ format: 'uuid', description: 'Regla que se incumple' })
  @IsUUID()
  healthDataQualityRuleId!: string;

  /**
   * Identificador asociado a canonical health resource.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  canonicalHealthResourceId?: string;

  /**
   * Identificador asociado a canonical resource version.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  canonicalResourceVersionId?: string;

  /**
   * Valor de field path mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Campo afectado', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fieldPath?: string;

  /**
   * Valor de observed value hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash del valor observado; el valor en claro no se guarda',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  observedValueHash?: string;
}

/** Cuerpo de `POST /health-data/quality-runs` (UC-52-08). */
export class RecordQualityRunDto {
  /**
   * Identificador asociado a health data quality rule set.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  healthDataQualityRuleSetId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  /**
   * Valor de records evaluated mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Registros evaluados; cadena por ser bigint',
    example: '1200',
  })
  @IsNumberString({ no_symbols: true })
  recordsEvaluated!: string;

  /**
   * Identificador asociado a health ingestion batch.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ámbito: lote de ingesta',
  })
  @IsOptional()
  @IsUUID()
  healthIngestionBatchId?: string;

  /**
   * Identificador asociado a canonical resource.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ámbito: recurso canónico',
  })
  @IsOptional()
  @IsUUID()
  canonicalResourceId?: string;

  /**
   * Valor de findings mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [QualityFindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityFindingDto)
  findings?: QualityFindingDto[];

  /**
   * Valor de summary json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  summaryJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para quality run response.
 */
export class QualityRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a result concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Resultado derivado de la severidad de las reglas',
  })
  resultConceptId!: string;

  /**
   * Valor de issues detected mantenido por la instancia.
   */
  @ApiProperty({ description: 'Incidencias abiertas en esta corrida' })
  issuesDetected!: number;

  /**
   * Valor de duplicates skipped mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hallazgos que ya tenían incidencia abierta idéntica',
  })
  duplicatesSkipped!: number;
}

// ---------------------------------------------------------------------------
// UC-52-09 · Resolución de identidad longitudinal
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/identity/candidates/{id}/decision` (UC-52-09). */
export class ResolveMatchCandidateDto {
  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({ enum: MATCH_DECISIONS })
  @IsIn(MATCH_DECISIONS)
  decision!: MatchDecision;

  /**
   * Valor de reason text mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se decide así' })
  @IsString()
  reasonText!: string;

  /**
   * Valor de evidence json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Evidencia en la que se apoya la decisión',
  })
  @IsOptional()
  @IsObject()
  evidenceJson?: Record<string, unknown>;

  /**
   * Identificador asociado a member role concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  memberRoleConceptId?: string;
}

/**
 * Define el contrato validado para match decision response.
 */
export class MatchDecisionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a candidate status concept.
   */
  @ApiProperty({ format: 'uuid' })
  candidateStatusConceptId!: string;

  /**
   * Identificador asociado a cluster.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Clúster en el que quedan los dos perfiles',
  })
  clusterId?: string;

  /**
   * Valor de cluster created mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si el clúster se creó en esta decisión' })
  clusterCreated!: boolean;

  /**
   * Valor de added member ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Miembros añadidos al clúster',
  })
  addedMemberIds!: string[];
}

// ---------------------------------------------------------------------------
// UC-52-10 · Proyección de línea de tiempo
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/timeline-entries` (UC-52-10). */
export class ProjectTimelineEntryDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Valor de event time mantenido por la instancia.
   */
  @ApiProperty({
    format: 'date-time',
    description: 'Cuándo ocurrió el evento clínico',
  })
  @IsISO8601()
  eventTime!: string;

  /**
   * Identificador asociado a event type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de evento (catálogo abierto)',
  })
  @IsUUID()
  eventTypeConceptId!: string;

  /**
   * Identificador asociado a source entity type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de la entidad de origen (catálogo abierto)',
  })
  @IsUUID()
  sourceEntityTypeConceptId!: string;

  /**
   * Identificador asociado a source entity.
   */
  @ApiProperty({ format: 'uuid', description: 'Entidad de origen concreta' })
  @IsUUID()
  sourceEntityId!: string;

  /**
   * Identificador asociado a custodian tenant.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  /**
   * Identificador asociado a organization.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  /**
   * Valor de summary redacted mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Resumen ya redactado según el consentimiento; nunca el dato clínico en claro',
  })
  @IsOptional()
  @IsString()
  summaryRedacted?: string;

  /**
   * Identificador asociado a clinical priority concept.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalPriorityConceptId?: string;

  /**
   * Identificador asociado a patient visibility concept.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Visibilidad para el paciente',
  })
  @IsOptional()
  @IsUUID()
  patientVisibilityConceptId?: string;

  /**
   * Valor de security labels json mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  securityLabelsJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para timeline entry response.
 */
export class TimelineEntryResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si la entrada ya existía para esa entidad y evento',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-52-11 · Corrida de de-identificación
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/deidentification-runs` (UC-52-11). */
export class RecordDeidRunDto {
  /**
   * Identificador asociado a health deidentification profile.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  healthDeidentificationProfileId!: string;

  /**
   * Identificador asociado a purpose concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Propósito de la liberación (catálogo abierto)',
  })
  @IsUUID()
  purposeConceptId!: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  /**
   * Valor de outcome mantenido por la instancia.
   */
  @ApiProperty({ enum: DEID_OUTCOMES })
  @IsIn(DEID_OUTCOMES)
  outcome!: DeidOutcome;

  /**
   * Valor de records processed mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Registros procesados; cadena por ser bigint',
    example: '5000',
  })
  @IsNumberString({ no_symbols: true })
  recordsProcessed!: string;

  /**
   * Identificador asociado a consent directive.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Directiva de consentimiento que autoriza el propósito',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  /**
   * Identificador asociado a input manifest file.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  inputManifestFileId?: string;

  /**
   * Identificador asociado a output manifest file.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  outputManifestFileId?: string;

  /**
   * Valor de records rejected mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cadena por ser bigint', example: '3' })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  recordsRejected?: string;

  /**
   * Valor de verification summary json mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Resultado de la verificación de re-identificación',
  })
  @IsOptional()
  @IsObject()
  verificationSummaryJson?: Record<string, unknown>;

  /**
   * Valor de source version ids mantenido por la instancia.
   */
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Versiones canónicas de las que salió la salida',
  })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  sourceVersionIds?: string[];
}

/**
 * Define el contrato validado para deid run response.
 */
export class DeidRunResponseDto {
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
   * Identificador asociado a provenance record.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Procedencia registrada de la de-identificación',
  })
  provenanceRecordId!: string;

  /**
   * Valor de lineage edge count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Aristas de linaje versión → manifiesto de salida',
  })
  lineageEdgeCount!: number;
}

// ---------------------------------------------------------------------------
// UC-52-12 · Exportación de Bundle FHIR
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /fhir/r5/$export` (UC-52-12). */
export class ExportBundleDto {
  /**
   * Identificador asociado a export type concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de exportación (catálogo abierto)',
  })
  @IsUUID()
  exportTypeConceptId!: string;

  /**
   * Identificador asociado a purpose of use concept.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Propósito de uso; sin él no se exporta',
  })
  @IsUUID()
  purposeOfUseConceptId!: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del Bundle entregado; lo sella',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  /**
   * Valor de record count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Recursos incluidos; cadena por ser bigint',
    example: '412',
  })
  @IsNumberString({ no_symbols: true })
  recordCount!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Paciente exportado' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a cohort definition.
   */
  @ApiPropertyOptional({ format: 'uuid', description: 'Cohorte exportada' })
  @IsOptional()
  @IsUUID()
  cohortDefinitionId?: string;

  /**
   * Identificador asociado a consent directive.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  /**
   * Identificador asociado a deidentification run.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Corrida de de-identificación aplicada, si la hubo',
  })
  @IsOptional()
  @IsUUID()
  deidentificationRunId?: string;

  /**
   * Identificador asociado a file.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  /**
   * Valor de size bytes mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Tamaño en bytes; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  sizeBytes?: string;

  /**
   * Identificador asociado a encryption profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encryptionProfileId?: string;

  /**
   * Identificador asociado a retention policy.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  retentionPolicyId?: string;

  /**
   * Valor de expires at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la entrega',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  /**
   * Valor de delivery destination json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'A dónde se entrega' })
  @IsOptional()
  @IsObject()
  deliveryDestinationJson?: Record<string, unknown>;
}

/**
 * Define el contrato validado para export job response.
 */
export class ExportJobResponseDto {
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
   * Identificador asociado a manifest.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Manifiesto inmutable del Bundle',
  })
  manifestId!: string;

  /**
   * Valor de manifest version mantenido por la instancia.
   */
  @ApiProperty()
  manifestVersion!: number;

  /**
   * Identificador asociado a provenance record.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Procedencia registrada de la exportación',
  })
  provenanceRecordId!: string;
}

// ---------------------------------------------------------------------------
// UC-52-13 · Historia longitudinal (`$everything`)
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para everything entry.
 */
export class EverythingEntryDto {
  /**
   * Identificador asociado a resource.
   */
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  /**
   * Identificador asociado a resource type concept.
   */
  @ApiProperty({ format: 'uuid' })
  resourceTypeConceptId!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Valor de payload mantenido por la instancia.
   */
  @ApiProperty({ description: 'Payload normalizado de la versión vigente' })
  payload!: unknown;
}

/**
 * Define el contrato validado para everything bundle response.
 */
export class EverythingBundleResponseDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Paciente por el que se preguntó',
  })
  patientProfileId!: string;

  /**
   * Valor de included patient profile ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Perfiles del clúster de identidad que se expandieron',
  })
  includedPatientProfileIds!: string[];

  /**
   * Identificador asociado a identity cluster.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Clúster de identidad resuelto',
  })
  identityClusterId?: string;

  /**
   * Valor de entries mantenido por la instancia.
   */
  @ApiProperty({ type: [EverythingEntryDto] })
  entries!: EverythingEntryDto[];

  /**
   * Valor de total mantenido por la instancia.
   */
  @ApiProperty({ description: 'Recursos incluidos' })
  total!: number;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash del Bundle; permite validar la frescura de una caché',
  })
  contentHash!: string;
}

// ---------------------------------------------------------------------------
// UC-52-14 · Retiro del recurso canónico
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/canonical-resources/{id}/retire` (UC-52-14). */
export class RetireResourceDto {
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Por qué se retira' })
  @IsString()
  reason!: string;
}

/**
 * Define el contrato validado para retire resource response.
 */
export class RetireResourceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a lifecycle status concept.
   */
  @ApiProperty({ format: 'uuid' })
  lifecycleStatusConceptId!: string;

  /**
   * Valor de closed bindings mantenido por la instancia.
   */
  @ApiProperty({ description: 'Bindings que quedan cerrados' })
  closedBindings!: number;

  /**
   * Valor de closed relationships mantenido por la instancia.
   */
  @ApiProperty({ description: 'Relaciones que quedan cerradas' })
  closedRelationships!: number;

  /**
   * Identificador asociado a provenance record.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Procedencia registrada del retiro',
  })
  provenanceRecordId!: string;
}
