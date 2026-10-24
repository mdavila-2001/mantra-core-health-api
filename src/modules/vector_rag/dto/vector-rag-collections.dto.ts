import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de colecciones vectoriales (V59-01). */
export class VectorCollectionItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ type: Number })
  dimension!: number;

  @ApiProperty({ type: String })
  distanceMetric!: string;

  @ApiProperty({ format: 'uuid' })
  embeddingModelVersionId!: string;

  @ApiProperty({ type: Boolean })
  containsPhi!: boolean;

  @ApiProperty({ format: 'uuid' })
  accessPolicyId!: string;

  @ApiProperty({ type: String })
  lifecycleState!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;
}

/** Filtros del listado de colecciones vectoriales. */
export class ListCollectionsQueryDto extends PaginationQueryDto {}

/** Página de colecciones vectoriales. */
export class VectorCollectionPageDto extends pageResponseOf(
  VectorCollectionItemDto,
  'VectorCollectionPageDto',
) {}

/** Fila de trabajos de embedding de una colección (V59-02). */
export class VectorEmbeddingJobItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  vectorCollectionId!: string;

  @ApiProperty({ type: String })
  jobType!: string;

  @ApiProperty({ type: 'object', additionalProperties: true })
  sourceScope!: unknown;

  @ApiProperty({ format: 'uuid' })
  requestedByUserId!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: Number })
  totalChunks!: number;

  @ApiProperty({ type: Number })
  completedChunks!: number;

  @ApiProperty({ type: Number })
  failedChunks!: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de trabajos de embedding de una colección. */
export class ListCollectionEmbeddingJobsQueryDto extends PaginationQueryDto {}

/** Página de trabajos de embedding de una colección. */
export class VectorEmbeddingJobPageDto extends pageResponseOf(
  VectorEmbeddingJobItemDto,
  'VectorEmbeddingJobPageDto',
) {}

/** Fila de conciliaciones de una colección (V59-04). */
export class VectorReconciliationRunItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  vectorCollectionId!: string;

  @ApiProperty({ type: Number })
  missingCount!: number;

  @ApiProperty({ type: Number })
  orphanCount!: number;

  @ApiProperty({ type: Number })
  mismatchedCount!: number;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  completedAt!: Date;
}

/** Filtros del listado de conciliaciones de una colección. */
export class ListCollectionReconciliationsQueryDto extends PaginationQueryDto {}

/** Página de conciliaciones de una colección. */
export class VectorReconciliationRunPageDto extends pageResponseOf(
  VectorReconciliationRunItemDto,
  'VectorReconciliationRunPageDto',
) {}

/** Fila de políticas de acceso RAG (V59-06). */
export class RagAccessPolicyItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({})
  allowedPrincipalTypes!: string[];

  @ApiProperty({})
  allowedPurposeCodes!: string[];

  @ApiProperty({})
  allowedSecurityLabels!: string[];

  @ApiProperty({ type: Boolean })
  patientScopeRequired!: boolean;

  @ApiProperty({ type: Boolean })
  consentRequired!: boolean;

  @ApiProperty({ type: String })
  fieldRedactionProfile!: string;

  @ApiProperty({ type: String })
  state!: string;
}

/** Filtros del listado de políticas de acceso RAG. */
export class ListRagAccessPoliciesQueryDto extends PaginationQueryDto {}

/** Página de políticas de acceso RAG. */
export class RagAccessPolicyPageDto extends pageResponseOf(
  RagAccessPolicyItemDto,
  'RagAccessPolicyPageDto',
) {}

/** Fila de trabajos de borrado vectorial (V59-10). */
export class VectorDeletionJobItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  @ApiProperty({ format: 'uuid' })
  sourceDocumentId!: string;

  @ApiProperty({ type: String })
  deletionReason!: string;

  @ApiProperty({ type: String })
  status!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  requestedAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  verifiedAt!: Date;
}

/** Filtros del listado de trabajos de borrado vectorial. */
export class ListDeletionJobsQueryDto extends PaginationQueryDto {}

/** Página de trabajos de borrado vectorial. */
export class VectorDeletionJobPageDto extends pageResponseOf(
  VectorDeletionJobItemDto,
  'VectorDeletionJobPageDto',
) {}

/** Filtros del listado de trabajos de embedding. */
export class ListEmbeddingJobsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  vectorCollectionId?: string;
}
