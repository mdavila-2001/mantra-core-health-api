import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthDeidentificationProfiles,
  HealthDeidentificationRuns,
  HealthExportJobs,
  HealthExportManifests,
} from '../entities';

/**
 * Acceso a la liberación de datos de `health_data.*`: perfiles y corridas de
 * de-identificación, trabajos de exportación y sus manifiestos.
 */
@Injectable()
export class DataReleaseRepository {
  // --- De-identificación (UC-52-11) ---

  /**
   * Obtiene find deid profile by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find deid profile by id conforme al contrato `Promise<HealthDeidentificationProfiles | null>`.
   */
  findDeidProfileById(
    em: EntityManager,
    id: string,
  ): Promise<HealthDeidentificationProfiles | null> {
    return em.findOne(HealthDeidentificationProfiles, { id });
  }

  /**
   * Crea create deid run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create deid run conforme al contrato `HealthDeidentificationRuns`.
   */
  createDeidRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a health deidentification profile.
       */
      healthDeidentificationProfileId: string;
      /**
       * Identificador asociado a purpose concept.
       */
      purposeConceptId: string;
      /**
       * Identificador asociado a consent directive.
       */
      consentDirectiveId?: string;
      /**
       * Valor de started at mantenido por la instancia.
       */
      startedAt: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a input manifest file.
       */
      inputManifestFileId?: string;
      /**
       * Identificador asociado a output manifest file.
       */
      outputManifestFileId?: string;
      /**
       * Valor de records processed mantenido por la instancia.
       */
      recordsProcessed?: string;
      /**
       * Valor de records rejected mantenido por la instancia.
       */
      recordsRejected?: string;
      /**
       * Valor de verification summary json mantenido por la instancia.
       */
      verificationSummaryJson?: unknown;
    },
  ): HealthDeidentificationRuns {
    return em.create(
      HealthDeidentificationRuns,
      {
        tenantId: data.tenantId,
        healthDeidentificationProfileId: data.healthDeidentificationProfileId,
        purposeConceptId: data.purposeConceptId,
        consentDirectiveId: data.consentDirectiveId,
        startedAt: data.startedAt,
        completedAt: new Date(),
        statusConceptId: data.statusConceptId,
        inputManifestFileId: data.inputManifestFileId,
        outputManifestFileId: data.outputManifestFileId,
        recordsProcessed: data.recordsProcessed,
        recordsRejected: data.recordsRejected,
        verificationSummaryJson: data.verificationSummaryJson,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find deid run by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find deid run by id conforme al contrato `Promise<HealthDeidentificationRuns | null>`.
   */
  findDeidRunById(
    em: EntityManager,
    id: string,
  ): Promise<HealthDeidentificationRuns | null> {
    return em.findOne(HealthDeidentificationRuns, { id });
  }

  // --- Exportación (UC-52-12) ---

  /**
   * Crea create export job.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create export job conforme al contrato `HealthExportJobs`.
   */
  createExportJob(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId?: string;
      /**
       * Identificador asociado a export type concept.
       */
      exportTypeConceptId: string;
      /**
       * Identificador asociado a requested by user.
       */
      requestedByUserId: string;
      /**
       * Identificador asociado a purpose of use concept.
       */
      purposeOfUseConceptId: string;
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId?: string;
      /**
       * Identificador asociado a cohort definition.
       */
      cohortDefinitionId?: string;
      /**
       * Identificador asociado a consent directive.
       */
      consentDirectiveId?: string;
      /**
       * Identificador asociado a deidentification run.
       */
      deidentificationRunId?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Valor de expires at mantenido por la instancia.
       */
      expiresAt?: Date;
      /**
       * Valor de delivery destination json mantenido por la instancia.
       */
      deliveryDestinationJson?: unknown;
    },
  ): HealthExportJobs {
    return em.create(
      HealthExportJobs,
      {
        tenantId: data.tenantId,
        exportTypeConceptId: data.exportTypeConceptId,
        requestedByUserId: data.requestedByUserId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        patientProfileId: data.patientProfileId,
        cohortDefinitionId: data.cohortDefinitionId,
        consentDirectiveId: data.consentDirectiveId,
        deidentificationRunId: data.deidentificationRunId,
        requestedAt: new Date(),
        statusConceptId: data.statusConceptId,
        completedAt: new Date(),
        expiresAt: data.expiresAt,
        deliveryDestinationJson: data.deliveryDestinationJson,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find export job for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find export job for update conforme al contrato `Promise<HealthExportJobs | null>`.
   */
  findExportJobForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<HealthExportJobs | null> {
    return em.findOne(
      HealthExportJobs,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Manifiesto inmutable: su hash sella el Bundle entregado. */
  createExportManifest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health export job.
       */
      healthExportJobId: string;
      /**
       * Valor de manifest version mantenido por la instancia.
       */
      manifestVersion: number;
      /**
       * Identificador asociado a file.
       */
      fileId?: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash: string;
      /**
       * Valor de record count mantenido por la instancia.
       */
      recordCount: string;
      /**
       * Valor de size bytes mantenido por la instancia.
       */
      sizeBytes?: string;
      /**
       * Identificador asociado a encryption profile.
       */
      encryptionProfileId?: string;
      /**
       * Identificador asociado a retention policy.
       */
      retentionPolicyId?: string;
    },
  ): HealthExportManifests {
    return em.create(
      HealthExportManifests,
      {
        healthExportJobId: data.healthExportJobId,
        manifestVersion: data.manifestVersion,
        fileId: data.fileId,
        contentHash: data.contentHash,
        recordCount: data.recordCount,
        sizeBytes: data.sizeBytes,
        encryptionProfileId: data.encryptionProfileId,
        retentionPolicyId: data.retentionPolicyId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find manifest.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param healthExportJobId - Identificador de health export job.
   * @param manifestVersion - Valor de manifest version requerido por la operación.
   * @returns Resultado de find manifest conforme al contrato `Promise<HealthExportManifests | null>`.
   */
  findManifest(
    em: EntityManager,
    healthExportJobId: string,
    manifestVersion: number,
  ): Promise<HealthExportManifests | null> {
    return em.findOne(HealthExportManifests, {
      healthExportJobId,
      manifestVersion,
    });
  }
}
