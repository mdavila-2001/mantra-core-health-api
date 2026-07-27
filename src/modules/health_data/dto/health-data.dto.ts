import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
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
  @ApiProperty({
    format: 'uuid',
    description: 'Conexión de origen que trae el lote',
  })
  @IsUUID()
  healthSourceConnectionId!: string;

  @ApiProperty({
    description: 'Identificador del lote en el origen',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  batchIdentifier!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Modo de ingesta (catálogo abierto)',
  })
  @IsUUID()
  ingestionModeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  sourcePeriodStart?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  sourcePeriodEnd?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Manifiesto del payload en almacenamiento',
  })
  @IsOptional()
  @IsUUID()
  payloadManifestFileId?: string;
}

export class IngestionBatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  batchIdentifier!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

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
  @ApiProperty({
    description: 'Identificador del registro en el origen',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  sourceRecordIdentifier!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de recurso (catálogo abierto)',
  })
  @IsUUID()
  resourceTypeConceptId!: string;

  @ApiProperty({
    description: 'Hash del payload; detecta que nada cambió',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  payloadHash!: string;

  @ApiPropertyOptional({
    description: 'Versión del registro en el origen',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sourceVersion?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  sourceLastUpdatedAt?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Payload persistido en almacenamiento',
  })
  @IsOptional()
  @IsUUID()
  payloadFileId?: string;
}

export class IngestionRecordResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  processingStatusConceptId!: string;

  @ApiProperty({ description: 'true si el registro ya estaba en el lote' })
  duplicate!: boolean;
}

/** Cuerpo de `POST /health-data/ingestion-batches/{id}/close` (UC-52-02). */
export class CloseIngestionBatchDto {
  @ApiPropertyOptional({
    description: 'Hash del contenido completo del lote',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contentHash?: string;

  @ApiPropertyOptional({
    description: 'Registros que el origen rechazó antes de llegar',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  recordsRejected?: number;
}

export class CloseBatchResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    description:
      'Registros recibidos, contados contra la tabla; cadena por ser bigint',
  })
  recordsReceived!: string;

  @ApiProperty({ description: 'Cadena por ser bigint' })
  recordsAccepted!: string;

  @ApiProperty({ description: 'Cadena por ser bigint' })
  recordsRejected!: string;
}

// ---------------------------------------------------------------------------
// UC-52-03 · Proyección del recurso canónico
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /health-data/canonical-resources/project` (UC-52-03). */
export class ProjectCanonicalResourceDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Registro crudo del que sale la proyección',
  })
  @IsUUID()
  healthIngestionRecordId!: string;

  @ApiProperty({
    description: 'Identificador lógico del recurso en el custodio',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  logicalIdentifier!: string;

  @ApiProperty({ description: 'Payload normalizado del recurso' })
  @IsObject()
  normalizedPayloadJson!: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente al que pertenece el recurso',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sourceSystemId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Formato del payload (catálogo abierto)',
  })
  @IsOptional()
  @IsUUID()
  payloadFormatConceptId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  originalPayloadFileId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveStartAt?: string;

  @ApiPropertyOptional({ description: 'Etiquetas de seguridad del recurso' })
  @IsOptional()
  @IsObject()
  securityLabelsJson?: Record<string, unknown>;
}

export class CanonicalResourceVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ausente si el contenido no cambió',
  })
  versionId?: string;

  @ApiPropertyOptional({ description: 'Ausente si el contenido no cambió' })
  versionNumber?: number;

  @ApiProperty()
  contentHash!: string;

  @ApiProperty({ description: 'true si el recurso se creó en esta proyección' })
  created!: boolean;

  @ApiProperty({
    description: 'true si el payload es idéntico al vigente y no se versionó',
  })
  unchanged!: boolean;

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
  @ApiProperty({
    description: 'Sistema emisor del identificador',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  identifierSystem!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString()
  @MaxLength(300)
  identifierValue!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  identifierTypeConceptId?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  assigningAuthority?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Sólo uno vigente por sistema; el anterior se cierra',
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;
}

export class IdentifierResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  canonicalHealthResourceId!: string;

  @ApiProperty()
  isPrimary!: boolean;

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
export class CreateRelationshipDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Recurso al que apunta la relación',
  })
  @IsUUID()
  targetResourceId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de relación (catálogo abierto)',
  })
  @IsUUID()
  relationshipTypeConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  relationshipRoleConceptId?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601()
  effectiveFrom?: string;

  @ApiPropertyOptional({ description: 'Confianza, como cadena decimal' })
  @IsOptional()
  @IsNumberString()
  confidenceScore?: string;
}

export class RelationshipResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  sourceResourceId!: string;

  @ApiProperty({ format: 'uuid' })
  targetResourceId!: string;

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
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de entidad de dominio (catálogo abierto)',
  })
  @IsUUID()
  domainEntityTypeConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Entidad de dominio concreta' })
  @IsUUID()
  domainEntityId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  bindingRoleConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Versión del mapeo terminológico aplicado',
  })
  @IsOptional()
  @IsUUID()
  mappingVersionId?: string;
}

export class ResourceBindingResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  canonicalHealthResourceId!: string;

  @ApiProperty({ format: 'uuid' })
  bindingStatusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Arista de linaje versión → entidad de dominio',
  })
  lineageEdgeId!: string;
}

// ---------------------------------------------------------------------------
// UC-52-07 · Validación contra perfil FHIR R5
// ---------------------------------------------------------------------------

export class ValidationIssueDto {
  @ApiProperty({ enum: ISSUE_SEVERITIES })
  @IsIn(ISSUE_SEVERITIES)
  severity!: IssueSeverity;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  issueCode?: string;

  @ApiPropertyOptional({
    description: 'Ruta FHIRPath del hallazgo',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  expressionPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  diagnosticsText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  locationJson?: Record<string, unknown>;
}

/** Cuerpo de `POST /health-data/versions/{id}/validate` (UC-52-07). */
export class ValidateVersionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Versión del perfil FHIR contra la que se valida',
  })
  @IsUUID()
  fhirProfileVersionId!: string;

  @ApiProperty({
    description: 'Versión del validador que produjo el resultado',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  validatorVersion!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Cuándo empezó la validación',
  })
  @IsISO8601()
  startedAt!: string;

  @ApiPropertyOptional({
    type: [ValidationIssueDto],
    description: 'Hallazgos del validador',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidationIssueDto)
  issues?: ValidationIssueDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  summaryJson?: Record<string, unknown>;
}

export class ValidationRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Resultado derivado de las severidades halladas',
  })
  resultConceptId!: string;

  @ApiProperty()
  issueCount!: number;

  @ApiProperty({ description: 'true si el recurso quedó en cuarentena' })
  quarantined!: boolean;

  @ApiProperty({ description: 'true si esa validación ya se había corrido' })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-52-08 · Corrida de reglas de calidad
// ---------------------------------------------------------------------------

export class QualityFindingDto {
  @ApiProperty({ format: 'uuid', description: 'Regla que se incumple' })
  @IsUUID()
  healthDataQualityRuleId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  canonicalHealthResourceId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  canonicalResourceVersionId?: string;

  @ApiPropertyOptional({ description: 'Campo afectado', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  fieldPath?: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  healthDataQualityRuleSetId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  @ApiProperty({
    description: 'Registros evaluados; cadena por ser bigint',
    example: '1200',
  })
  @IsNumberString({ no_symbols: true })
  recordsEvaluated!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ámbito: lote de ingesta',
  })
  @IsOptional()
  @IsUUID()
  healthIngestionBatchId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Ámbito: recurso canónico',
  })
  @IsOptional()
  @IsUUID()
  canonicalResourceId?: string;

  @ApiPropertyOptional({ type: [QualityFindingDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityFindingDto)
  findings?: QualityFindingDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  summaryJson?: Record<string, unknown>;
}

export class QualityRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Resultado derivado de la severidad de las reglas',
  })
  resultConceptId!: string;

  @ApiProperty({ description: 'Incidencias abiertas en esta corrida' })
  issuesDetected!: number;

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
  @ApiProperty({ enum: MATCH_DECISIONS })
  @IsIn(MATCH_DECISIONS)
  decision!: MatchDecision;

  @ApiProperty({ description: 'Por qué se decide así' })
  @IsString()
  reasonText!: string;

  @ApiPropertyOptional({
    description: 'Evidencia en la que se apoya la decisión',
  })
  @IsOptional()
  @IsObject()
  evidenceJson?: Record<string, unknown>;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  memberRoleConceptId?: string;
}

export class MatchDecisionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  candidateStatusConceptId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Clúster en el que quedan los dos perfiles',
  })
  clusterId?: string;

  @ApiProperty({ description: 'true si el clúster se creó en esta decisión' })
  clusterCreated!: boolean;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    format: 'date-time',
    description: 'Cuándo ocurrió el evento clínico',
  })
  @IsISO8601()
  eventTime!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de evento (catálogo abierto)',
  })
  @IsUUID()
  eventTypeConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de la entidad de origen (catálogo abierto)',
  })
  @IsUUID()
  sourceEntityTypeConceptId!: string;

  @ApiProperty({ format: 'uuid', description: 'Entidad de origen concreta' })
  @IsUUID()
  sourceEntityId!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  custodianTenantId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encounterId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  organizationId?: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @ApiPropertyOptional({
    description:
      'Resumen ya redactado según el consentimiento; nunca el dato clínico en claro',
  })
  @IsOptional()
  @IsString()
  summaryRedacted?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  clinicalPriorityConceptId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Visibilidad para el paciente',
  })
  @IsOptional()
  @IsUUID()
  patientVisibilityConceptId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  securityLabelsJson?: Record<string, unknown>;
}

export class TimelineEntryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

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
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  healthDeidentificationProfileId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Propósito de la liberación (catálogo abierto)',
  })
  @IsUUID()
  purposeConceptId!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startedAt!: string;

  @ApiProperty({ enum: DEID_OUTCOMES })
  @IsIn(DEID_OUTCOMES)
  outcome!: DeidOutcome;

  @ApiProperty({
    description: 'Registros procesados; cadena por ser bigint',
    example: '5000',
  })
  @IsNumberString({ no_symbols: true })
  recordsProcessed!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Directiva de consentimiento que autoriza el propósito',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  inputManifestFileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  outputManifestFileId?: string;

  @ApiPropertyOptional({ description: 'Cadena por ser bigint', example: '3' })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  recordsRejected?: string;

  @ApiPropertyOptional({
    description: 'Resultado de la verificación de re-identificación',
  })
  @IsOptional()
  @IsObject()
  verificationSummaryJson?: Record<string, unknown>;

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

export class DeidRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Procedencia registrada de la de-identificación',
  })
  provenanceRecordId!: string;

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
  @ApiProperty({
    format: 'uuid',
    description: 'Tipo de exportación (catálogo abierto)',
  })
  @IsUUID()
  exportTypeConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Propósito de uso; sin él no se exporta',
  })
  @IsUUID()
  purposeOfUseConceptId!: string;

  @ApiProperty({
    description: 'Hash del Bundle entregado; lo sella',
    maxLength: 200,
  })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  @ApiProperty({
    description: 'Recursos incluidos; cadena por ser bigint',
    example: '412',
  })
  @IsNumberString({ no_symbols: true })
  recordCount!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Paciente exportado' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Cohorte exportada' })
  @IsOptional()
  @IsUUID()
  cohortDefinitionId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Corrida de de-identificación aplicada, si la hubo',
  })
  @IsOptional()
  @IsUUID()
  deidentificationRunId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  fileId?: string;

  @ApiPropertyOptional({
    description: 'Tamaño en bytes; cadena por ser bigint',
  })
  @IsOptional()
  @IsNumberString({ no_symbols: true })
  sizeBytes?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  encryptionProfileId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  retentionPolicyId?: string;

  @ApiPropertyOptional({
    format: 'date-time',
    description: 'Cuándo caduca la entrega',
  })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'A dónde se entrega' })
  @IsOptional()
  @IsObject()
  deliveryDestinationJson?: Record<string, unknown>;
}

export class ExportJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Manifiesto inmutable del Bundle',
  })
  manifestId!: string;

  @ApiProperty()
  manifestVersion!: number;

  @ApiProperty({
    format: 'uuid',
    description: 'Procedencia registrada de la exportación',
  })
  provenanceRecordId!: string;
}

// ---------------------------------------------------------------------------
// UC-52-13 · Historia longitudinal (`$everything`)
// ---------------------------------------------------------------------------

export class EverythingEntryDto {
  @ApiProperty({ format: 'uuid' })
  resourceId!: string;

  @ApiProperty({ format: 'uuid' })
  resourceTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  versionId!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ description: 'Payload normalizado de la versión vigente' })
  payload!: unknown;
}

export class EverythingBundleResponseDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Paciente por el que se preguntó',
  })
  patientProfileId!: string;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Perfiles del clúster de identidad que se expandieron',
  })
  includedPatientProfileIds!: string[];

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Clúster de identidad resuelto',
  })
  identityClusterId?: string;

  @ApiProperty({ type: [EverythingEntryDto] })
  entries!: EverythingEntryDto[];

  @ApiProperty({ description: 'Recursos incluidos' })
  total!: number;

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
  @ApiProperty({ description: 'Por qué se retira' })
  @IsString()
  reason!: string;
}

export class RetireResourceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  lifecycleStatusConceptId!: string;

  @ApiProperty({ description: 'Bindings que quedan cerrados' })
  closedBindings!: number;

  @ApiProperty({ description: 'Relaciones que quedan cerradas' })
  closedRelationships!: number;

  @ApiProperty({
    format: 'uuid',
    description: 'Procedencia registrada del retiro',
  })
  provenanceRecordId!: string;
}
