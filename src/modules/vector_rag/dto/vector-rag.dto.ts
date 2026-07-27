import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  COLLECTION_STATES,
  DELETION_REASONS,
  DISTANCE_METRICS,
  FEEDBACK_TYPES,
  JOB_TYPES,
  MAX_CANDIDATES,
  MAX_CHUNKS_PER_BATCH,
  MAX_EVIDENCE,
  PRINCIPAL_TYPES,
} from '../constants';

// ---------------------------------------------------------------------------
// UC-59-01 · Registrar y aprobar versión de modelo
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/embedding-model-versions` (UC-59-01). */
export class RegisterModelVersionDto {
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  providerCode!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  modelId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  modelVersion!: string;

  @ApiProperty({
    minimum: 1,
    maximum: 16000,
    description: 'Dimensión del vector que produce',
  })
  @IsInt()
  @Min(1)
  @Max(16000)
  dimension!: number;

  @ApiProperty({ enum: DISTANCE_METRICS })
  @IsIn(DISTANCE_METRICS)
  distanceMetric!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  tokenizerVersion!: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Si está aprobado para datos de paciente; queda registrado quién lo aprobó',
  })
  @IsOptional()
  @IsBoolean()
  approvedForPhi?: boolean;
}

export class ModelVersionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  providerCode!: string;

  @ApiProperty()
  modelId!: string;

  @ApiProperty()
  modelVersion!: string;

  @ApiProperty()
  dimension!: number;

  @ApiProperty()
  approvedForPhi!: boolean;

  @ApiPropertyOptional({ format: 'date-time' })
  retiredAt?: string;
}

// ---------------------------------------------------------------------------
// UC-59-02 · Crear colección con binding de tenant
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/collections` (UC-59-02). */
export class CreateCollectionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ format: 'uuid', description: 'Modelo aprobado y no retirado' })
  @IsUUID()
  embeddingModelVersionId!: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Si la colección va a contener datos de paciente',
  })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Política de acceso RAG publicada',
  })
  @IsOptional()
  @IsUUID()
  accessPolicyId?: string;

  @ApiProperty({
    maxLength: 200,
    description: 'Namespace físico único del vínculo',
  })
  @IsString()
  @MaxLength(200)
  namespace!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  encryptionProfileCode?: string;
}

export class CollectionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  dimension!: number;

  @ApiProperty()
  distanceMetric!: string;

  @ApiProperty({ enum: COLLECTION_STATES })
  lifecycleState!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Vínculo del tenant creado con la colección',
  })
  bindingId!: string;
}

// ---------------------------------------------------------------------------
// UC-59-03 · Política de acceso RAG
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/rag-access-policies` (UC-59-03). */
export class DefineRagPolicyDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ type: [String], enum: PRINCIPAL_TYPES })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(PRINCIPAL_TYPES, { each: true })
  allowedPrincipalTypes!: string[];

  @ApiProperty({ type: [String], description: 'Propósitos de uso admitidos' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedPurposeCodes!: string[];

  @ApiProperty({
    type: [String],
    description: 'Etiquetas de seguridad admitidas',
  })
  @IsArray()
  @IsString({ each: true })
  allowedSecurityLabels!: string[];

  @ApiPropertyOptional({
    default: false,
    description:
      'Si la consulta debe declarar el paciente sobre el que se hace',
  })
  @IsOptional()
  @IsBoolean()
  patientScopeRequired?: boolean;

  @ApiPropertyOptional({
    default: false,
    description: 'Si exige consentimiento vigente',
  })
  @IsOptional()
  @IsBoolean()
  consentRequired?: boolean;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldRedactionProfile?: string;
}

/** Cuerpo de `PUT /vector-rag/rag-access-policies/{id}/publish` (UC-59-03). */
export class PublishRagPolicyDto {
  @ApiPropertyOptional({
    type: [String],
    format: 'uuid',
    description: 'Colecciones que pasan a regirse por esta política',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  rebindCollectionIds?: string[];
}

export class RagPolicyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  state!: string;

  @ApiProperty({ description: 'Colecciones reenlazadas al publicar' })
  reboundCollections!: number;
}

// ---------------------------------------------------------------------------
// UC-59-04 · Encolar job de embedding
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/collections/{id}/embedding-jobs` (UC-59-04). */
export class QueueEmbeddingJobDto {
  @ApiProperty({ enum: JOB_TYPES })
  @IsIn(JOB_TYPES)
  jobType!: string;

  @ApiProperty({ description: 'Qué documentos y versiones abarca el job' })
  @IsObject()
  sourceScope!: Record<string, unknown>;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'Chunks previstos, si se conocen',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalChunks?: number;
}

export class EmbeddingJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  vectorCollectionId!: string;

  @ApiProperty()
  jobType!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({
    description:
      'Verdadero si la clave de idempotencia ya había encolado este job',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-59-05 · Ejecutar job: chunking + embedding + upsert
// ---------------------------------------------------------------------------

export class EmbeddedChunkDto {
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  chunkNumber!: number;

  @ApiProperty({ description: 'Texto ya redactado; nunca el original' })
  @IsString()
  chunkTextRedacted!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  tokenCount!: number;

  @ApiProperty({ maxLength: 200, description: 'Hash del texto del chunk' })
  @IsString()
  @MaxLength(200)
  chunkHash!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sectionPath?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiProperty({
    description: 'Vector en formato de pgvector, p. ej. `[0.1,0.2,...]`',
  })
  @IsString()
  embedding!: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  embeddingHash!: string;
}

export class EmbeddedDocumentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceDocumentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceVersionId!: string;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentType?: string;

  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityLabels?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  purposeOfUseCodes?: string[];

  @ApiProperty({ type: [EmbeddedChunkDto], maxItems: MAX_CHUNKS_PER_BATCH })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_CHUNKS_PER_BATCH)
  @ValidateNested({ each: true })
  @Type(() => EmbeddedChunkDto)
  chunks!: EmbeddedChunkDto[];
}

/** Cuerpo de `POST /vector-rag/embedding-jobs/{id}/run` (UC-59-05). */
export class RunEmbeddingJobDto {
  @ApiProperty({ type: [EmbeddedDocumentDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmbeddedDocumentDto)
  documents!: EmbeddedDocumentDto[];

  @ApiPropertyOptional({
    default: false,
    description: 'Si este lote cierra el job y lo pasa a completado',
  })
  @IsOptional()
  @IsBoolean()
  finalBatch?: boolean;
}

export class RunEmbeddingJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Documentos creados en este lote' })
  documentsUpserted!: number;

  @ApiProperty({ description: 'Chunks creados en este lote' })
  chunksCreated!: number;

  @ApiProperty({ description: 'Embeddings creados en este lote' })
  embeddingsCreated!: number;

  @ApiProperty({
    description: 'Chunks que ya estaban embebidos y no se repitieron',
  })
  chunksSkipped!: number;
}

// ---------------------------------------------------------------------------
// UC-59-06 · Abrir sesión de retrieval
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/retrieval-sessions` (UC-59-06). */
export class OpenRetrievalSessionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vectorCollectionId!: string;

  @ApiProperty({ enum: PRINCIPAL_TYPES })
  @IsIn(PRINCIPAL_TYPES)
  principalType!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente que consulta, si no es una persona',
  })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiProperty({ maxLength: 100, description: 'Propósito de uso declarado' })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Directiva de consentimiento que ampara la consulta',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  @ApiProperty({ description: 'Consulta ya redactada; nunca la original' })
  @IsString()
  queryTextRedacted!: string;
}

export class RetrievalSessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({
    description: 'Hash de la consulta; identifica la pregunta sin guardarla',
  })
  queryHash!: string;

  @ApiProperty({
    description:
      'Verdadero si ya había una sesión abierta para la misma consulta',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-59-07 · Ranquear y filtrar candidatos
// ---------------------------------------------------------------------------

export class CandidateInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vectorChunkId!: string;

  @ApiProperty({ description: 'Distancia o similitud devuelta por el índice' })
  @IsNumber()
  vectorScore!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lexicalScore?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rerankerScore?: number;
}

/** Cuerpo de `POST /vector-rag/retrieval-sessions/{id}/search` (UC-59-07). */
export class RankCandidatesDto {
  @ApiProperty({ type: [CandidateInputDto], maxItems: MAX_CANDIDATES })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_CANDIDATES)
  @ValidateNested({ each: true })
  @Type(() => CandidateInputDto)
  candidates!: CandidateInputDto[];

  @ApiPropertyOptional({
    minimum: 1,
    maximum: MAX_CANDIDATES,
    default: 10,
    description: 'Cuántos de los autorizados se marcan como seleccionados',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  topK?: number;
}

export class RankedCandidateDto {
  @ApiProperty({ format: 'uuid' })
  vectorChunkId!: string;

  @ApiProperty()
  rank!: number;

  @ApiProperty()
  authorizationDecision!: string;

  @ApiProperty()
  selected!: boolean;
}

export class RankCandidatesResponseDto {
  @ApiProperty({ format: 'uuid' })
  retrievalSessionId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ type: [RankedCandidateDto] })
  candidates!: RankedCandidateDto[];

  @ApiProperty({ description: 'Candidatos denegados, por motivo' })
  deniedByReason!: Record<string, number>;
}

// ---------------------------------------------------------------------------
// UC-59-08 · Materializar evidencia
// ---------------------------------------------------------------------------

export class EvidenceInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vectorChunkId!: string;

  @ApiProperty({ description: 'Fragmento citado, ya redactado' })
  @IsString()
  quotedTextRedacted!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUri?: string;
}

/** Cuerpo de `POST /vector-rag/retrieval-sessions/{id}/evidence` (UC-59-08). */
export class MaterializeEvidenceDto {
  @ApiProperty({ type: [EvidenceInputDto], maxItems: MAX_EVIDENCE })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EVIDENCE)
  @ValidateNested({ each: true })
  @Type(() => EvidenceInputDto)
  citations!: EvidenceInputDto[];
}

export class EvidenceResponseDto {
  @ApiProperty({ format: 'uuid' })
  retrievalSessionId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Citas materializadas' })
  citations!: number;
}

// ---------------------------------------------------------------------------
// UC-59-09 · Feedback
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/retrieval-sessions/{id}/feedback` (UC-59-09). */
export class CaptureFeedbackDto {
  @ApiProperty({ enum: FEEDBACK_TYPES })
  @IsIn(FEEDBACK_TYPES)
  feedbackType!: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  relevanceScore?: number;

  @ApiPropertyOptional({
    maxLength: 100,
    description:
      'Código del problema de seguridad; su presencia marca la sesión para revisión',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  safetyIssueCode?: string;

  @ApiPropertyOptional({ description: 'Comentario ya redactado' })
  @IsOptional()
  @IsString()
  commentRedacted?: string;
}

export class FeedbackResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  retrievalSessionId!: string;

  @ApiProperty({
    description: 'Verdadero si el feedback marcó la sesión para revisión',
  })
  flagged!: boolean;
}

// ---------------------------------------------------------------------------
// UC-59-10 · Propagar borrado
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/deletion-jobs` (UC-59-10). */
export class PropagateDeletionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Documento fuente borrado',
  })
  @IsOptional()
  @IsUUID()
  sourceDocumentId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente cuyo dato se borra',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  @ApiProperty({ enum: DELETION_REASONS })
  @IsIn(DELETION_REASONS)
  deletionReason!: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 1000, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  batchSize?: number;
}

export class DeletionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  documentsPurged!: number;

  @ApiProperty()
  chunksPurged!: number;

  @ApiProperty()
  embeddingsPurged!: number;

  @ApiProperty({
    description:
      'Verdadero si no quedaba nada por purgar y el borrado queda verificado',
  })
  verified!: boolean;
}

// ---------------------------------------------------------------------------
// UC-59-11 · Re-embeber
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/collections/{id}/re-embed` (UC-59-11). */
export class ReEmbedCollectionDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Nuevo modelo, aprobado y no retirado',
  })
  @IsUUID()
  embeddingModelVersionId!: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Si los embeddings del modelo anterior pasan a `superseded`',
  })
  @IsOptional()
  @IsBoolean()
  supersedePrevious?: boolean;
}

export class ReEmbedResponseDto {
  @ApiProperty({ format: 'uuid' })
  vectorCollectionId!: string;

  @ApiProperty({ format: 'uuid', description: 'Job de re-embedding encolado' })
  embeddingJobId!: string;

  @ApiProperty({ format: 'uuid' })
  embeddingModelVersionId!: string;

  @ApiProperty({
    description: 'Embeddings del modelo anterior marcados como superados',
  })
  supersededEmbeddings!: number;
}

// ---------------------------------------------------------------------------
// UC-59-12 · Reconciliar
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/collections/{id}/reconciliation` (UC-59-12). */
export class ReconcileCollectionDto {
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Documentos que la fuente autoritativa dice que deberían estar',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  canonicalDocumentIds!: string[];

  @ApiProperty({ maxLength: 200, description: 'Hash del manifiesto canónico' })
  @IsString()
  @MaxLength(200)
  canonicalManifestHash!: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Si el drift detectado encola automáticamente su reparación',
  })
  @IsOptional()
  @IsBoolean()
  autoRepair?: boolean;
}

export class ReconciliationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Documentos que la fuente tiene y el vector no' })
  missingCount!: number;

  @ApiProperty({
    description: 'Documentos que el vector tiene y la fuente ya no',
  })
  orphanCount!: number;

  @ApiProperty({
    description: 'Documentos presentes en ambos con contenido distinto',
  })
  mismatchedCount!: number;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job encolado para reparar lo que falta',
  })
  repairJobId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job encolado para purgar los huérfanos',
  })
  purgeJobId?: string;
}

// ---------------------------------------------------------------------------
// UC-59-13 · Retirar modelo y sellar colección
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/embedding-model-versions/{id}/retire` (UC-59-13). */
export class RetireModelVersionDto {
  @ApiPropertyOptional({
    description: 'Por qué se retira; queda en el evento publicado',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/** Cuerpo de `PUT /vector-rag/collections/{id}/lifecycle` (UC-59-13). */
export class UpdateCollectionLifecycleDto {
  @ApiProperty({ enum: COLLECTION_STATES })
  @IsIn(COLLECTION_STATES)
  lifecycleState!: string;
}

export class LifecycleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  lifecycleState!: string;

  @ApiProperty({ description: 'Vínculos de tenant congelados por el cambio' })
  frozenBindings!: number;
}
