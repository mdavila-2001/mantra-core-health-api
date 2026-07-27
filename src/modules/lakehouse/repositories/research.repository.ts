import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ResearchProjects,
  CohortDefinitions,
  DatasetReleaseRequests,
  DatasetReleaseManifests,
} from '../entities';

/**
 * Investigación: proyectos con su aprobación ética, cohortes, solicitudes de
 * release y los manifiestos de-identificados que las materializan.
 */
@Injectable()
export class ResearchRepository {
  // --- Proyectos (UC-63-09, 10) ---

  findProjectById(
    em: EntityManager,
    id: string,
  ): Promise<ResearchProjects | null> {
    return em.findOne(ResearchProjects, { id });
  }

  findProjectForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ResearchProjects | null> {
    return em.findOne(
      ResearchProjects,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Clave natural del proyecto: `(tenant, código)`. El caso de uso lo hace UPSERT. */
  findProjectByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<ResearchProjects | null> {
    return em.findOne(ResearchProjects, { tenantId, code });
  }

  createProject(
    em: EntityManager,
    data: {
      id?: string;
      tenantId: string;
      code: string;
      title: string;
      protocolReference?: string;
      principalInvestigatorId: string;
      ethicsApprovalReference: string;
      approvedFrom: Date;
      approvedTo: Date;
      state: string;
    },
  ): ResearchProjects {
    return em.create(ResearchProjects, data as never, { partial: true });
  }

  // --- Cohortes (UC-63-09, 10, 11) ---

  createCohort(
    em: EntityManager,
    data: {
      researchProjectId: string;
      code: string;
      version: string;
      inclusionExpression?: string;
      exclusionExpression?: string;
      deidentificationProfileId: string;
      state: string;
    },
  ): CohortDefinitions {
    return em.create(CohortDefinitions, data as never, { partial: true });
  }

  findCohortById(
    em: EntityManager,
    id: string,
  ): Promise<CohortDefinitions | null> {
    return em.findOne(CohortDefinitions, { id });
  }

  findCohortByVersion(
    em: EntityManager,
    researchProjectId: string,
    code: string,
    version: string,
  ): Promise<CohortDefinitions | null> {
    return em.findOne(CohortDefinitions, { researchProjectId, code, version });
  }

  // --- Solicitudes de release (UC-63-10, 11, 12) ---

  createReleaseRequest(
    em: EntityManager,
    data: {
      tenantId: string;
      researchProjectId: string;
      dataProductVersionId: string;
      cohortDefinitionId: string;
      purposeOfUseCode: string;
      requestedByUserId: string;
      status: string;
    },
  ): DatasetReleaseRequests {
    return em.create(
      DatasetReleaseRequests,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

  findReleaseRequestForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<DatasetReleaseRequests | null> {
    return em.findOne(
      DatasetReleaseRequests,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Manifiestos (UC-63-11, 12) ---

  /**
   * Un manifiesto por solicitud (1:1). Materializar dos veces daría dos copias
   * de-identificadas del mismo dato con caducidades distintas, y revocar una no
   * revocaría la otra.
   */
  findManifestByRequestForUpdate(
    em: EntityManager,
    datasetReleaseRequestId: string,
  ): Promise<DatasetReleaseManifests | null> {
    return em.findOne(
      DatasetReleaseManifests,
      { datasetReleaseRequestId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  createManifest(
    em: EntityManager,
    data: {
      datasetReleaseRequestId: string;
      deidentificationRunId: string;
      objectManifestId?: string;
      schemaVersion?: string;
      recordCount: string;
      contentHash: string;
      expiresAt: Date;
    },
  ): DatasetReleaseManifests {
    return em.create(
      DatasetReleaseManifests,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }
}
