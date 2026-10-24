import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto, pageResponseOf } from '../../../common';

/** Fila de borradores de gobierno (V11-01). */
export class DraftRecordItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: String })
  schemaName!: string;

  @ApiProperty({ type: String })
  tableName!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  targetRecordId!: string | null;

  @ApiProperty({ format: 'uuid' })
  ownerUserId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  tenantId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  draftLabel!: string | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  payloadJson!: unknown;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  schemaVersion!: number | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  publishedRecordId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  expiresAt!: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de borradores de gobierno. */
export class ListDraftsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de borradores de gobierno. */
export class DraftRecordPageDto extends pageResponseOf(
  DraftRecordItemDto,
  'DraftRecordPageDto',
) {}

/** Fila de retenciones legales (V11-02). */
export class LegalHoldItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  targetTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  targetId!: string;

  @ApiProperty({ format: 'uuid' })
  reasonConceptId!: string;

  @ApiPropertyOptional({ type: String, nullable: true })
  authorityReference!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  startsAt!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  endsAt!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de retenciones legales. */
export class ListLegalHoldsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de retenciones legales. */
export class LegalHoldPageDto extends pageResponseOf(
  LegalHoldItemDto,
  'LegalHoldPageDto',
) {}

/** Fila de planes de remediación de una evaluación (V11-05). */
export class RemediationPlanItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  workloadAssessmentId!: string;

  @ApiProperty({ type: String })
  code!: string;

  @ApiProperty({ type: String })
  name!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  ownerUserId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  targetCompletionAt!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  approvedByUserId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  approvedAt!: Date | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  notes!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de planes de remediación de una evaluación. */
export class ListRemediationPlansQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de planes de remediación de una evaluación. */
export class RemediationPlanPageDto extends pageResponseOf(
  RemediationPlanItemDto,
  'RemediationPlanPageDto',
) {}

/** Fila de transferencias transfronterizas (V11-06). */
export class CrossBorderTransferEventItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  dataCategoryConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  sourceRegionConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  destinationRegionConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  transferBasisConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  recipientTenantId!: string | null;

  @ApiPropertyOptional({ type: String, nullable: true })
  transferReference!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  approvedByUserId!: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  recordedAt!: Date;
}

/** Filtros del listado de transferencias transfronterizas. */
export class ListCrossBorderTransfersQueryDto extends PaginationQueryDto {}

/** Página de transferencias transfronterizas. */
export class CrossBorderTransferEventPageDto extends pageResponseOf(
  CrossBorderTransferEventItemDto,
  'CrossBorderTransferEventPageDto',
) {}

/** Fila de vínculos de residencia (V11-16). */
export class TenantResidencyBindingItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  residencyPolicyId!: string;

  @ApiProperty({ format: 'uuid' })
  primaryRegionConceptId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  disasterRecoveryRegionConceptId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveFrom!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  effectiveTo!: Date | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de vínculos de residencia. */
export class ListTenantResidencyBindingsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de vínculos de residencia. */
export class TenantResidencyBindingPageDto extends pageResponseOf(
  TenantResidencyBindingItemDto,
  'TenantResidencyBindingPageDto',
) {}

/** Fila de evaluaciones de carga de trabajo (V11-17). */
export class WorkloadAssessmentItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  operationalFrameworkId!: string;

  @ApiProperty({ type: String })
  workloadCode!: string;

  @ApiProperty({ type: String })
  workloadName!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  serviceComponentId!: string | null;

  @ApiProperty({ format: 'uuid' })
  assessmentTypeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  assessmentPeriodStart!: Date | null;

  @ApiPropertyOptional({ type: String, format: 'date', nullable: true })
  assessmentPeriodEnd!: Date | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  facilitatorUserId!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  approvedByUserId!: string | null;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  approvedAt!: Date | null;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: true,
    nullable: true,
  })
  summaryJson!: unknown;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de evaluaciones de carga de trabajo. */
export class ListWorkloadAssessmentsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de evaluaciones de carga de trabajo. */
export class WorkloadAssessmentPageDto extends pageResponseOf(
  WorkloadAssessmentItemDto,
  'WorkloadAssessmentPageDto',
) {}

/** Fila de políticas de respaldo (V11-20). */
export class BackupPolicyItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  tenantId!: string;

  @ApiProperty({ format: 'uuid' })
  resourceScopeConceptId!: string;

  @ApiProperty({ format: 'uuid' })
  backupTypeConceptId!: string;

  @ApiPropertyOptional({ type: Number, nullable: true })
  rpoSeconds!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  rtoSeconds!: number | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  retentionDays!: number | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  immutableCopyRequired!: boolean | null;

  @ApiPropertyOptional({ type: Boolean, nullable: true })
  encryptionRequired!: boolean | null;

  @ApiPropertyOptional({ type: Number, nullable: true })
  restoreTestFrequencyDays!: number | null;

  @ApiProperty({ format: 'uuid' })
  statusConceptId!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}

/** Filtros del listado de políticas de respaldo. */
export class ListBackupPoliciesQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  statusConceptId?: string;
}

/** Página de políticas de respaldo. */
export class BackupPolicyPageDto extends pageResponseOf(
  BackupPolicyItemDto,
  'BackupPolicyPageDto',
) {}
