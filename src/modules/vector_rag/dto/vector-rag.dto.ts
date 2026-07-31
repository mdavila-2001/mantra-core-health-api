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
  /**
   * Valor de provider code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  providerCode!: string;

  /**
   * Identificador asociado a model.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  modelId!: string;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  modelVersion!: string;

  /**
   * Valor de dimension mantenido por la instancia.
   */
  @ApiProperty({
    minimum: 1,
    maximum: 16000,
    description: 'Dimensión del vector que produce',
  })
  @IsInt()
  @Min(1)
  @Max(16000)
  dimension!: number;

  /**
   * Valor de distance metric mantenido por la instancia.
   */
  @ApiProperty({ enum: DISTANCE_METRICS })
  @IsIn(DISTANCE_METRICS)
  distanceMetric!: string;

  /**
   * Valor de tokenizer version mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  tokenizerVersion!: string;

  /**
   * Valor de approved for phi mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description:
      'Si está aprobado para datos de paciente; queda registrado quién lo aprobó',
  })
  @IsOptional()
  @IsBoolean()
  approvedForPhi?: boolean;
}

/**
 * Define el contrato validado para model version response.
 */
export class ModelVersionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de provider code mantenido por la instancia.
   */
  @ApiProperty()
  providerCode!: string;

  /**
   * Identificador asociado a model.
   */
  @ApiProperty()
  modelId!: string;

  /**
   * Valor de model version mantenido por la instancia.
   */
  @ApiProperty()
  modelVersion!: string;

  /**
   * Valor de dimension mantenido por la instancia.
   */
  @ApiProperty()
  dimension!: number;

  /**
   * Valor de approved for phi mantenido por la instancia.
   */
  @ApiProperty()
  approvedForPhi!: boolean;

  /**
   * Valor de retired at mantenido por la instancia.
   */
  @ApiPropertyOptional({ format: 'date-time' })
  retiredAt?: string;
}

// ---------------------------------------------------------------------------
// UC-59-02 · Crear colección con binding de tenant
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/collections` (UC-59-02). */
export class CreateCollectionDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
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
   * Identificador asociado a embedding model version.
   */
  @ApiProperty({ format: 'uuid', description: 'Modelo aprobado y no retirado' })
  @IsUUID()
  embeddingModelVersionId!: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si la colección va a contener datos de paciente',
  })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  /**
   * Identificador asociado a access policy.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Política de acceso RAG publicada',
  })
  @IsOptional()
  @IsUUID()
  accessPolicyId?: string;

  /**
   * Valor de namespace mantenido por la instancia.
   */
  @ApiProperty({
    maxLength: 200,
    description: 'Namespace físico único del vínculo',
  })
  @IsString()
  @MaxLength(200)
  namespace!: string;

  /**
   * Valor de encryption profile code mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  encryptionProfileCode?: string;
}

/**
 * Define el contrato validado para collection response.
 */
export class CollectionResponseDto {
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
   * Valor de dimension mantenido por la instancia.
   */
  @ApiProperty()
  dimension!: number;

  /**
   * Valor de distance metric mantenido por la instancia.
   */
  @ApiProperty()
  distanceMetric!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ enum: COLLECTION_STATES })
  lifecycleState!: string;

  /**
   * Identificador asociado a binding.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  /**
   * Valor de allowed principal types mantenido por la instancia.
   */
  @ApiProperty({ type: [String], enum: PRINCIPAL_TYPES })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(PRINCIPAL_TYPES, { each: true })
  allowedPrincipalTypes!: string[];

  /**
   * Valor de allowed purpose codes mantenido por la instancia.
   */
  @ApiProperty({ type: [String], description: 'Propósitos de uso admitidos' })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  allowedPurposeCodes!: string[];

  /**
   * Valor de allowed security labels mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    description: 'Etiquetas de seguridad admitidas',
  })
  @IsArray()
  @IsString({ each: true })
  allowedSecurityLabels!: string[];

  /**
   * Valor de patient scope required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description:
      'Si la consulta debe declarar el paciente sobre el que se hace',
  })
  @IsOptional()
  @IsBoolean()
  patientScopeRequired?: boolean;

  /**
   * Valor de consent required mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si exige consentimiento vigente',
  })
  @IsOptional()
  @IsBoolean()
  consentRequired?: boolean;

  /**
   * Valor de field redaction profile mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fieldRedactionProfile?: string;
}

/** Cuerpo de `PUT /vector-rag/rag-access-policies/{id}/publish` (UC-59-03). */
export class PublishRagPolicyDto {
  /**
   * Valor de rebind collection ids mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para rag policy response.
 */
export class RagPolicyResponseDto {
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
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty()
  state!: string;

  /**
   * Valor de rebound collections mantenido por la instancia.
   */
  @ApiProperty({ description: 'Colecciones reenlazadas al publicar' })
  reboundCollections!: number;
}

// ---------------------------------------------------------------------------
// UC-59-04 · Encolar job de embedding
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/collections/{id}/embedding-jobs` (UC-59-04). */
export class QueueEmbeddingJobDto {
  /**
   * Valor de job type mantenido por la instancia.
   */
  @ApiProperty({ enum: JOB_TYPES })
  @IsIn(JOB_TYPES)
  jobType!: string;

  /**
   * Valor de source scope mantenido por la instancia.
   */
  @ApiProperty({ description: 'Qué documentos y versiones abarca el job' })
  @IsObject()
  sourceScope!: Record<string, unknown>;

  /**
   * Valor de total chunks mantenido por la instancia.
   */
  @ApiPropertyOptional({
    minimum: 0,
    description: 'Chunks previstos, si se conocen',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  totalChunks?: number;
}

/**
 * Define el contrato validado para embedding job response.
 */
export class EmbeddingJobResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a vector collection.
   */
  @ApiProperty({ format: 'uuid' })
  vectorCollectionId!: string;

  /**
   * Valor de job type mantenido por la instancia.
   */
  @ApiProperty()
  jobType!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Verdadero si la clave de idempotencia ya había encolado este job',
  })
  duplicate!: boolean;
}

/** Un job en cola, tal como lo necesita el worker para llamar `run`. */
export class QueuedEmbeddingJobSummaryDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a vector collection.
   */
  @ApiProperty({ format: 'uuid' })
  vectorCollectionId!: string;

  /**
   * Valor de job type mantenido por la instancia.
   */
  @ApiProperty()
  jobType!: string;
}

/** Respuesta de `GET /vector-rag/embedding-jobs/pending` (descubrimiento del worker). */
export class PendingEmbeddingJobsResponseDto {
  /**
   * Valor de jobs mantenido por la instancia.
   */
  @ApiProperty({ type: [QueuedEmbeddingJobSummaryDto] })
  jobs!: QueuedEmbeddingJobSummaryDto[];
}

// ---------------------------------------------------------------------------
// UC-59-05 · Ejecutar job: chunking + embedding + upsert
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para embedded chunk.
 */
export class EmbeddedChunkDto {
  /**
   * Valor de chunk number mantenido por la instancia.
   */
  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  chunkNumber!: number;

  /**
   * Valor de chunk text redacted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Texto ya redactado; nunca el original' })
  @IsString()
  chunkTextRedacted!: string;

  /**
   * Valor de token count mantenido por la instancia.
   */
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  tokenCount!: number;

  /**
   * Valor de chunk hash mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200, description: 'Hash del texto del chunk' })
  @IsString()
  @MaxLength(200)
  chunkHash!: string;

  /**
   * Valor de section path mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sectionPath?: string;

  /**
   * Valor de metadata mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  /**
   * Valor de embedding mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Vector en formato de pgvector, p. ej. `[0.1,0.2,...]`',
  })
  @IsString()
  embedding!: string;

  /**
   * Valor de embedding hash mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  embeddingHash!: string;
}

/**
 * Define el contrato validado para embedded document.
 */
export class EmbeddedDocumentDto {
  /**
   * Identificador asociado a source document.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceDocumentId!: string;

  /**
   * Identificador asociado a source version.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sourceVersionId!: string;

  /**
   * Valor de document type mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  documentType?: string;

  /**
   * Valor de language mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  language?: string;

  /**
   * Valor de title mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  /**
   * Valor de content hash mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200 })
  @IsString()
  @MaxLength(200)
  contentHash!: string;

  /**
   * Valor de contains phi mantenido por la instancia.
   */
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  containsPhi?: boolean;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Valor de security labels mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  securityLabels?: string[];

  /**
   * Valor de purpose of use codes mantenido por la instancia.
   */
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  purposeOfUseCodes?: string[];

  /**
   * Valor de chunks mantenido por la instancia.
   */
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
  /**
   * Documentos ya troceados y embebidos por el proveedor real. Ausente u
   * omitido cuando `failed=true`: el propio worker no calcula embeddings
   * (ver `EmbeddingPipelineService`), así que sin un proveedor conectado no
   * hay nada que enviar aquí — inventar un vector sería peor que declarar el
   * fallo.
   */
  @ApiPropertyOptional({ type: [EmbeddedDocumentDto] })
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => EmbeddedDocumentDto)
  documents?: EmbeddedDocumentDto[];

  /**
   * Valor de final batch mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: false,
    description: 'Si este lote cierra el job y lo pasa a completado',
  })
  @IsOptional()
  @IsBoolean()
  finalBatch?: boolean;

  /**
   * El proveedor de embeddings no pudo calcular este lote (p. ej. no está
   * configurado). Sin `documents`; el job pasa a `failed` sin tocar el corpus.
   */
  @ApiPropertyOptional({
    description: 'El lote falló antes de calcular ningún embedding',
  })
  @IsOptional()
  @IsBoolean()
  failed?: boolean;

  /**
   * Motivo del fallo, para diagnóstico (p. ej. `PROVIDER_NOT_CONFIGURED`).
   */
  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  errorCode?: string;
}

/**
 * Define el contrato validado para run embedding job response.
 */
export class RunEmbeddingJobResponseDto {
  /**
   * Identificador asociado a job.
   */
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de documents upserted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Documentos creados en este lote' })
  documentsUpserted!: number;

  /**
   * Valor de chunks created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Chunks creados en este lote' })
  chunksCreated!: number;

  /**
   * Valor de embeddings created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Embeddings creados en este lote' })
  embeddingsCreated!: number;

  /**
   * Valor de chunks skipped mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a vector collection.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vectorCollectionId!: string;

  /**
   * Valor de principal type mantenido por la instancia.
   */
  @ApiProperty({ enum: PRINCIPAL_TYPES })
  @IsIn(PRINCIPAL_TYPES)
  principalType!: string;

  /**
   * Identificador asociado a agent.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Agente que consulta, si no es una persona',
  })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 100, description: 'Propósito de uso declarado' })
  @IsString()
  @MaxLength(100)
  purposeOfUseCode!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Identificador asociado a consent directive.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Directiva de consentimiento que ampara la consulta',
  })
  @IsOptional()
  @IsUUID()
  consentDirectiveId?: string;

  /**
   * Valor de query text redacted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Consulta ya redactada; nunca la original' })
  @IsString()
  queryTextRedacted!: string;
}

/**
 * Define el contrato validado para retrieval session response.
 */
export class RetrievalSessionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de query hash mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Hash de la consulta; identifica la pregunta sin guardarla',
  })
  queryHash!: string;

  /**
   * Valor de duplicate mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Verdadero si ya había una sesión abierta para la misma consulta',
  })
  duplicate!: boolean;
}

// ---------------------------------------------------------------------------
// UC-59-07 · Ranquear y filtrar candidatos
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para candidate input.
 */
export class CandidateInputDto {
  /**
   * Identificador asociado a vector chunk.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vectorChunkId!: string;

  /**
   * Valor de vector score mantenido por la instancia.
   */
  @ApiProperty({ description: 'Distancia o similitud devuelta por el índice' })
  @IsNumber()
  vectorScore!: number;

  /**
   * Valor de lexical score mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  lexicalScore?: number;

  /**
   * Valor de reranker score mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  rerankerScore?: number;
}

/** Cuerpo de `POST /vector-rag/retrieval-sessions/{id}/search` (UC-59-07). */
export class RankCandidatesDto {
  /**
   * Valor de candidates mantenido por la instancia.
   */
  @ApiProperty({ type: [CandidateInputDto], maxItems: MAX_CANDIDATES })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_CANDIDATES)
  @ValidateNested({ each: true })
  @Type(() => CandidateInputDto)
  candidates!: CandidateInputDto[];

  /**
   * Valor de top k mantenido por la instancia.
   */
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

/**
 * Define el contrato validado para ranked candidate.
 */
export class RankedCandidateDto {
  /**
   * Identificador asociado a vector chunk.
   */
  @ApiProperty({ format: 'uuid' })
  vectorChunkId!: string;

  /**
   * Valor de rank mantenido por la instancia.
   */
  @ApiProperty()
  rank!: number;

  /**
   * Valor de authorization decision mantenido por la instancia.
   */
  @ApiProperty()
  authorizationDecision!: string;

  /**
   * Valor de selected mantenido por la instancia.
   */
  @ApiProperty()
  selected!: boolean;
}

/**
 * Define el contrato validado para rank candidates response.
 */
export class RankCandidatesResponseDto {
  /**
   * Identificador asociado a retrieval session.
   */
  @ApiProperty({ format: 'uuid' })
  retrievalSessionId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de candidates mantenido por la instancia.
   */
  @ApiProperty({ type: [RankedCandidateDto] })
  candidates!: RankedCandidateDto[];

  /**
   * Valor de denied by reason mantenido por la instancia.
   */
  @ApiProperty({ description: 'Candidatos denegados, por motivo' })
  deniedByReason!: Record<string, number>;
}

// ---------------------------------------------------------------------------
// UC-59-08 · Materializar evidencia
// ---------------------------------------------------------------------------

/**
 * Define el contrato validado para evidence input.
 */
export class EvidenceInputDto {
  /**
   * Identificador asociado a vector chunk.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  vectorChunkId!: string;

  /**
   * Valor de quoted text redacted mantenido por la instancia.
   */
  @ApiProperty({ description: 'Fragmento citado, ya redactado' })
  @IsString()
  quotedTextRedacted!: string;

  /**
   * Valor de source uri mantenido por la instancia.
   */
  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  sourceUri?: string;
}

/** Cuerpo de `POST /vector-rag/retrieval-sessions/{id}/evidence` (UC-59-08). */
export class MaterializeEvidenceDto {
  /**
   * Valor de citations mantenido por la instancia.
   */
  @ApiProperty({ type: [EvidenceInputDto], maxItems: MAX_EVIDENCE })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_EVIDENCE)
  @ValidateNested({ each: true })
  @Type(() => EvidenceInputDto)
  citations!: EvidenceInputDto[];
}

/**
 * Define el contrato validado para evidence response.
 */
export class EvidenceResponseDto {
  /**
   * Identificador asociado a retrieval session.
   */
  @ApiProperty({ format: 'uuid' })
  retrievalSessionId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de citations mantenido por la instancia.
   */
  @ApiProperty({ description: 'Citas materializadas' })
  citations!: number;
}

// ---------------------------------------------------------------------------
// UC-59-09 · Feedback
// ---------------------------------------------------------------------------

/** Cuerpo de `POST /vector-rag/retrieval-sessions/{id}/feedback` (UC-59-09). */
export class CaptureFeedbackDto {
  /**
   * Valor de feedback type mantenido por la instancia.
   */
  @ApiProperty({ enum: FEEDBACK_TYPES })
  @IsIn(FEEDBACK_TYPES)
  feedbackType!: string;

  /**
   * Valor de relevance score mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  relevanceScore?: number;

  /**
   * Valor de safety issue code mantenido por la instancia.
   */
  @ApiPropertyOptional({
    maxLength: 100,
    description:
      'Código del problema de seguridad; su presencia marca la sesión para revisión',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  safetyIssueCode?: string;

  /**
   * Valor de comment redacted mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Comentario ya redactado' })
  @IsOptional()
  @IsString()
  commentRedacted?: string;
}

/**
 * Define el contrato validado para feedback response.
 */
export class FeedbackResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a retrieval session.
   */
  @ApiProperty({ format: 'uuid' })
  retrievalSessionId!: string;

  /**
   * Valor de flagged mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a source document.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Documento fuente borrado',
  })
  @IsOptional()
  @IsUUID()
  sourceDocumentId?: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Paciente cuyo dato se borra',
  })
  @IsOptional()
  @IsUUID()
  patientProfileId?: string;

  /**
   * Valor de deletion reason mantenido por la instancia.
   */
  @ApiProperty({ enum: DELETION_REASONS })
  @IsIn(DELETION_REASONS)
  deletionReason!: string;

  /**
   * Valor de batch size mantenido por la instancia.
   */
  @ApiPropertyOptional({ minimum: 1, maximum: 1000, default: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  batchSize?: number;
}

/**
 * Define el contrato validado para deletion response.
 */
export class DeletionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de documents purged mantenido por la instancia.
   */
  @ApiProperty()
  documentsPurged!: number;

  /**
   * Valor de chunks purged mantenido por la instancia.
   */
  @ApiProperty()
  chunksPurged!: number;

  /**
   * Valor de embeddings purged mantenido por la instancia.
   */
  @ApiProperty()
  embeddingsPurged!: number;

  /**
   * Valor de verified mantenido por la instancia.
   */
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
  /**
   * Identificador asociado a embedding model version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Nuevo modelo, aprobado y no retirado',
  })
  @IsUUID()
  embeddingModelVersionId!: string;

  /**
   * Valor de supersede previous mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Si los embeddings del modelo anterior pasan a `superseded`',
  })
  @IsOptional()
  @IsBoolean()
  supersedePrevious?: boolean;
}

/**
 * Define el contrato validado para re embed response.
 */
export class ReEmbedResponseDto {
  /**
   * Identificador asociado a vector collection.
   */
  @ApiProperty({ format: 'uuid' })
  vectorCollectionId!: string;

  /**
   * Identificador asociado a embedding job.
   */
  @ApiProperty({ format: 'uuid', description: 'Job de re-embedding encolado' })
  embeddingJobId!: string;

  /**
   * Identificador asociado a embedding model version.
   */
  @ApiProperty({ format: 'uuid' })
  embeddingModelVersionId!: string;

  /**
   * Valor de superseded embeddings mantenido por la instancia.
   */
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
  /**
   * Valor de canonical document ids mantenido por la instancia.
   */
  @ApiProperty({
    type: [String],
    format: 'uuid',
    description:
      'Documentos que la fuente autoritativa dice que deberían estar',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  canonicalDocumentIds!: string[];

  /**
   * Valor de canonical manifest hash mantenido por la instancia.
   */
  @ApiProperty({ maxLength: 200, description: 'Hash del manifiesto canónico' })
  @IsString()
  @MaxLength(200)
  canonicalManifestHash!: string;

  /**
   * Valor de auto repair mantenido por la instancia.
   */
  @ApiPropertyOptional({
    default: true,
    description: 'Si el drift detectado encola automáticamente su reparación',
  })
  @IsOptional()
  @IsBoolean()
  autoRepair?: boolean;
}

/**
 * Define el contrato validado para reconciliation response.
 */
export class ReconciliationResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty()
  status!: string;

  /**
   * Valor de missing count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Documentos que la fuente tiene y el vector no' })
  missingCount!: number;

  /**
   * Valor de orphan count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Documentos que el vector tiene y la fuente ya no',
  })
  orphanCount!: number;

  /**
   * Valor de mismatched count mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Documentos presentes en ambos con contenido distinto',
  })
  mismatchedCount!: number;

  /**
   * Identificador asociado a repair job.
   */
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Job encolado para reparar lo que falta',
  })
  repairJobId?: string;

  /**
   * Identificador asociado a purge job.
   */
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
  /**
   * Valor de reason mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Por qué se retira; queda en el evento publicado',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

/** Cuerpo de `PUT /vector-rag/collections/{id}/lifecycle` (UC-59-13). */
export class UpdateCollectionLifecycleDto {
  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty({ enum: COLLECTION_STATES })
  @IsIn(COLLECTION_STATES)
  lifecycleState!: string;
}

/**
 * Define el contrato validado para lifecycle response.
 */
export class LifecycleResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de lifecycle state mantenido por la instancia.
   */
  @ApiProperty()
  lifecycleState!: string;

  /**
   * Valor de frozen bindings mantenido por la instancia.
   */
  @ApiProperty({ description: 'Vínculos de tenant congelados por el cambio' })
  frozenBindings!: number;
}
