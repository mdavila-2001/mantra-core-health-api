import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  BackupPolicies,
  CrossBorderTransferEvents,
  DraftRecords,
  LegalHolds,
  RemediationPlans,
  TenantResidencyBindings,
  WorkloadAssessments,
} from '../entities';
import type {
  BackupPolicyItemDto,
  CrossBorderTransferEventItemDto,
  DraftRecordItemDto,
  LegalHoldItemDto,
  ListBackupPoliciesQueryDto,
  ListCrossBorderTransfersQueryDto,
  ListDraftsQueryDto,
  ListLegalHoldsQueryDto,
  ListRemediationPlansQueryDto,
  ListTenantResidencyBindingsQueryDto,
  ListWorkloadAssessmentsQueryDto,
  RemediationPlanItemDto,
  TenantResidencyBindingItemDto,
  WorkloadAssessmentItemDto,
} from '../dto';

/**
 * Lecturas de colección de `system_ops`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class SystemOpsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar borradores de gobierno del tenant (V11-01).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listDrafts(
    query: ListDraftsQueryDto,
  ): Promise<PageResponseDto<DraftRecordItemDto>> {
    return listTenantCollection(this.em.fork(), DraftRecords, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): DraftRecordItemDto => ({
        id: row.id,
        schemaName: row.schemaName,
        tableName: row.tableName,
        targetRecordId: row.targetRecordId ?? null,
        ownerUserId: row.ownerUserId,
        tenantId: row.tenantId ?? null,
        draftLabel: row.draftLabel ?? null,
        payloadJson: row.payloadJson,
        statusConceptId: row.statusConceptId,
        schemaVersion: row.schemaVersion ?? null,
        publishedRecordId: row.publishedRecordId ?? null,
        expiresAt: row.expiresAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar retenciones legales del tenant (V11-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listLegalHolds(
    query: ListLegalHoldsQueryDto,
  ): Promise<PageResponseDto<LegalHoldItemDto>> {
    return listTenantCollection(this.em.fork(), LegalHolds, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): LegalHoldItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        targetTypeConceptId: row.targetTypeConceptId,
        targetId: row.targetId,
        reasonConceptId: row.reasonConceptId,
        authorityReference: row.authorityReference ?? null,
        startsAt: row.startsAt ?? null,
        endsAt: row.endsAt ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar planes de remediación de una evaluación del tenant (V11-05).
   *
   * @param id - Recurso padre de la ruta.
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listRemediationPlans(
    id: string,
    query: ListRemediationPlansQueryDto,
  ): Promise<PageResponseDto<RemediationPlanItemDto>> {
    return listTenantCollection(this.em.fork(), RemediationPlans, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code'],
      where: definedFilters({
        workloadAssessmentId: id,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): RemediationPlanItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        workloadAssessmentId: row.workloadAssessmentId,
        code: row.code,
        name: row.name,
        statusConceptId: row.statusConceptId,
        ownerUserId: row.ownerUserId ?? null,
        targetCompletionAt: row.targetCompletionAt ?? null,
        approvedByUserId: row.approvedByUserId ?? null,
        approvedAt: row.approvedAt ?? null,
        notes: row.notes ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar transferencias transfronterizas del tenant (V11-06).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCrossBorderTransfers(
    query: ListCrossBorderTransfersQueryDto,
  ): Promise<PageResponseDto<CrossBorderTransferEventItemDto>> {
    return listTenantCollection(this.em.fork(), CrossBorderTransferEvents, {
      query,
      sortable: ['recordedAt'],
      map: (row): CrossBorderTransferEventItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        dataCategoryConceptId: row.dataCategoryConceptId,
        sourceRegionConceptId: row.sourceRegionConceptId,
        destinationRegionConceptId: row.destinationRegionConceptId,
        transferBasisConceptId: row.transferBasisConceptId,
        recipientTenantId: row.recipientTenantId ?? null,
        transferReference: row.transferReference ?? null,
        approvedByUserId: row.approvedByUserId ?? null,
        recordedAt: row.recordedAt,
      }),
    });
  }

  /**
   * Listar vínculos de residencia del tenant (V11-16).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listTenantResidencyBindings(
    query: ListTenantResidencyBindingsQueryDto,
  ): Promise<PageResponseDto<TenantResidencyBindingItemDto>> {
    return listTenantCollection(this.em.fork(), TenantResidencyBindings, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): TenantResidencyBindingItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        residencyPolicyId: row.residencyPolicyId,
        primaryRegionConceptId: row.primaryRegionConceptId,
        disasterRecoveryRegionConceptId:
          row.disasterRecoveryRegionConceptId ?? null,
        effectiveFrom: row.effectiveFrom ?? null,
        effectiveTo: row.effectiveTo ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar evaluaciones de carga de trabajo del tenant (V11-17).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listWorkloadAssessments(
    query: ListWorkloadAssessmentsQueryDto,
  ): Promise<PageResponseDto<WorkloadAssessmentItemDto>> {
    return listTenantCollection(this.em.fork(), WorkloadAssessments, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): WorkloadAssessmentItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        operationalFrameworkId: row.operationalFrameworkId,
        workloadCode: row.workloadCode,
        workloadName: row.workloadName,
        serviceComponentId: row.serviceComponentId ?? null,
        assessmentTypeConceptId: row.assessmentTypeConceptId,
        statusConceptId: row.statusConceptId,
        assessmentPeriodStart: row.assessmentPeriodStart ?? null,
        assessmentPeriodEnd: row.assessmentPeriodEnd ?? null,
        facilitatorUserId: row.facilitatorUserId ?? null,
        approvedByUserId: row.approvedByUserId ?? null,
        approvedAt: row.approvedAt ?? null,
        summaryJson: row.summaryJson ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar políticas de respaldo del tenant (V11-20).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listBackupPolicies(
    query: ListBackupPoliciesQueryDto,
  ): Promise<PageResponseDto<BackupPolicyItemDto>> {
    return listTenantCollection(this.em.fork(), BackupPolicies, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): BackupPolicyItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        resourceScopeConceptId: row.resourceScopeConceptId,
        backupTypeConceptId: row.backupTypeConceptId,
        rpoSeconds: row.rpoSeconds ?? null,
        rtoSeconds: row.rtoSeconds ?? null,
        retentionDays: row.retentionDays ?? null,
        immutableCopyRequired: row.immutableCopyRequired ?? null,
        encryptionRequired: row.encryptionRequired ?? null,
        restoreTestFrequencyDays: row.restoreTestFrequencyDays ?? null,
        statusConceptId: row.statusConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
