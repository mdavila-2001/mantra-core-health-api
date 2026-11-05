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

  /**
   * Proyecto del tenant activo; uno ajeno cuenta como inexistente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant activo del actor.
   * @param id - Identificador del proyecto.
   * @returns El proyecto o `null`.
   */
  findProjectById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<ResearchProjects | null> {
    return em.findOne(ResearchProjects, { id, tenantId });
  }

  /**
   * Proyecto por id sin acotar por tenant. Sólo para detectar que el id ya lo
   * ocupa otro tenant antes de un alta por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador del proyecto.
   * @returns El proyecto o `null`.
   */
  findProjectByIdAnyTenant(
    em: EntityManager,
    id: string,
  ): Promise<ResearchProjects | null> {
    return em.findOne(ResearchProjects, { id });
  }

  /**
   * Proyecto del tenant activo, bloqueado para actualizar.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant activo del actor.
   * @param id - Identificador del proyecto.
   * @returns El proyecto o `null`.
   */
  findProjectForUpdate(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<ResearchProjects | null> {
    return em.findOne(
      ResearchProjects,
      { id, tenantId },
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

  /**
   * Crea create project.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create project conforme al contrato `ResearchProjects`.
   */
  createProject(
    em: EntityManager,
    data: {
      /**
       * Identificador único de la instancia.
       */
      id?: string;
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Valor de protocol reference mantenido por la instancia.
       */
      protocolReference?: string;
      /**
       * Identificador asociado a principal investigator.
       */
      principalInvestigatorId: string;
      /**
       * Valor de ethics approval reference mantenido por la instancia.
       */
      ethicsApprovalReference: string;
      /**
       * Valor de approved from mantenido por la instancia.
       */
      approvedFrom: Date;
      /**
       * Valor de approved to mantenido por la instancia.
       */
      approvedTo: Date;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): ResearchProjects {
    return em.create(
      ResearchProjects,
      {
        ...data,
        // `protocol_reference` es NOT NULL: no todo proyecto tiene protocolo
        // registrado en un repositorio externo, y la cadena vacía expresa eso
        // sin inventar una referencia que después nadie podría resolver.
        protocolReference: data.protocolReference ?? '',
      } as never,
      { partial: true },
    );
  }

  // --- Cohortes (UC-63-09, 10, 11) ---

  /**
   * Crea create cohort.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cohort conforme al contrato `CohortDefinitions`.
   */
  createCohort(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a research project.
       */
      researchProjectId: string;
      /**
       * Valor de code mantenido por la instancia.
       */
      code: string;
      /**
       * Valor de version mantenido por la instancia.
       */
      version: string;
      /**
       * Valor de inclusion expression mantenido por la instancia.
       */
      inclusionExpression?: string;
      /**
       * Valor de exclusion expression mantenido por la instancia.
       */
      exclusionExpression?: string;
      /**
       * Identificador asociado a deidentification profile.
       */
      deidentificationProfileId: string;
      /**
       * Valor de state mantenido por la instancia.
       */
      state: string;
    },
  ): CohortDefinitions {
    return em.create(
      CohortDefinitions,
      {
        ...data,
        // `exclusion_expression` es NOT NULL: una cohorte sin criterios de
        // exclusión no excluye a nadie, y eso se expresa con la cadena vacía.
        exclusionExpression: data.exclusionExpression ?? '',
      } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find cohort by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find cohort by id conforme al contrato `Promise<CohortDefinitions | null>`.
   */
  findCohortById(
    em: EntityManager,
    id: string,
  ): Promise<CohortDefinitions | null> {
    return em.findOne(CohortDefinitions, { id });
  }

  /**
   * Obtiene find cohort by version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param researchProjectId - Identificador de research project.
   * @param code - Valor de code requerido por la operación.
   * @param version - Valor de version requerido por la operación.
   * @returns Resultado de find cohort by version conforme al contrato `Promise<CohortDefinitions | null>`.
   */
  findCohortByVersion(
    em: EntityManager,
    researchProjectId: string,
    code: string,
    version: string,
  ): Promise<CohortDefinitions | null> {
    return em.findOne(CohortDefinitions, { researchProjectId, code, version });
  }

  // --- Solicitudes de release (UC-63-10, 11, 12) ---

  /**
   * Crea create release request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create release request conforme al contrato `DatasetReleaseRequests`.
   */
  createReleaseRequest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a tenant.
       */
      tenantId: string;
      /**
       * Identificador asociado a research project.
       */
      researchProjectId: string;
      /**
       * Identificador asociado a data product version.
       */
      dataProductVersionId: string;
      /**
       * Identificador asociado a cohort definition.
       */
      cohortDefinitionId: string;
      /**
       * Valor de purpose of use code mantenido por la instancia.
       */
      purposeOfUseCode: string;
      /**
       * Identificador asociado a requested by user.
       */
      requestedByUserId: string;
      /**
       * Valor de status mantenido por la instancia.
       */
      status: string;
    },
  ): DatasetReleaseRequests {
    return em.create(
      DatasetReleaseRequests,
      { ...data, requestedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Solicitud de release bloqueada para actualizar. Con `tenantId` sólo alcanza
   * las del tenant (una ajena cuenta como inexistente y no se bloquea); sin él
   * (barrido interno de `SYSTEM`) no filtra.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant activo, o `undefined` para el barrido interno.
   * @param id - Identificador de la solicitud.
   * @returns La solicitud o `null`.
   */
  findReleaseRequestForUpdate(
    em: EntityManager,
    tenantId: string | undefined,
    id: string,
  ): Promise<DatasetReleaseRequests | null> {
    return em.findOne(
      DatasetReleaseRequests,
      tenantId === undefined ? { id } : { id, tenantId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Igual que `findReleaseRequestForUpdate`, sin lock: solo para descubrimiento. */
  findReleaseRequestById(
    em: EntityManager,
    id: string,
  ): Promise<DatasetReleaseRequests | null> {
    return em.findOne(DatasetReleaseRequests, { id });
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

  /**
   * Ids de las solicitudes de un tenant que siguen abiertas (en alguno de los
   * estados dados). El manifiesto no tiene `tenant_id`: su tenant es el de su
   * solicitud, así que acotar el barrido de vencidos pasa por aquí.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant activo.
   * @param statuses - Estados que cuentan como abiertos.
   * @returns Los ids de las solicitudes.
   */
  async findOpenRequestIds(
    em: EntityManager,
    tenantId: string,
    statuses: readonly string[],
  ): Promise<string[]> {
    const rows = await em.find(
      DatasetReleaseRequests,
      { tenantId, status: { $in: [...statuses] } },
      { fields: ['id'] },
    );
    return rows.map((row) => row.id);
  }

  /**
   * Manifiestos vencidos. Con `requestIds` sólo los de esas solicitudes (las de
   * un tenant); sin él, todos (barrido interno de `SYSTEM`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param now - Instante de corte.
   * @param limit - Tope de filas.
   * @param requestIds - Solicitudes a las que acotar, si las hay.
   * @returns Los manifiestos vencidos, del más antiguo al más nuevo.
   */
  findExpiredManifests(
    em: EntityManager,
    now: Date,
    limit: number,
    requestIds?: string[],
  ): Promise<DatasetReleaseManifests[]> {
    return em.find(
      DatasetReleaseManifests,
      {
        expiresAt: { $lte: now },
        ...(requestIds ? { datasetReleaseRequestId: { $in: requestIds } } : {}),
      },
      { orderBy: { expiresAt: 'ASC' }, limit },
    );
  }

  /**
   * Crea create manifest.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create manifest conforme al contrato `DatasetReleaseManifests`.
   */
  createManifest(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a dataset release request.
       */
      datasetReleaseRequestId: string;
      /**
       * Identificador asociado a deidentification run.
       */
      deidentificationRunId: string;
      /**
       * Identificador asociado a object manifest.
       */
      objectManifestId?: string;
      /**
       * Valor de schema version mantenido por la instancia.
       */
      schemaVersion?: string;
      /**
       * Valor de record count mantenido por la instancia.
       */
      recordCount: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash: string;
      /**
       * Valor de expires at mantenido por la instancia.
       */
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
