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

  findDeidProfileById(
    em: EntityManager,
    id: string,
  ): Promise<HealthDeidentificationProfiles | null> {
    return em.findOne(HealthDeidentificationProfiles, { id });
  }

  createDeidRun(
    em: EntityManager,
    data: {
      tenantId?: string;
      healthDeidentificationProfileId: string;
      purposeConceptId: string;
      consentDirectiveId?: string;
      startedAt: Date;
      statusConceptId: string;
      inputManifestFileId?: string;
      outputManifestFileId?: string;
      recordsProcessed?: string;
      recordsRejected?: string;
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

  findDeidRunById(
    em: EntityManager,
    id: string,
  ): Promise<HealthDeidentificationRuns | null> {
    return em.findOne(HealthDeidentificationRuns, { id });
  }

  // --- Exportación (UC-52-12) ---

  createExportJob(
    em: EntityManager,
    data: {
      tenantId?: string;
      exportTypeConceptId: string;
      requestedByUserId: string;
      purposeOfUseConceptId: string;
      patientProfileId?: string;
      cohortDefinitionId?: string;
      consentDirectiveId?: string;
      deidentificationRunId?: string;
      statusConceptId: string;
      expiresAt?: Date;
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
      healthExportJobId: string;
      manifestVersion: number;
      fileId?: string;
      contentHash: string;
      recordCount: string;
      sizeBytes?: string;
      encryptionProfileId?: string;
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
