import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ContextAgents,
  HealthContextSources,
  CountryContextSchedules,
  CountryHealthContexts,
  CountryHealthContextVersions,
  ContextCollectionRuns,
  ContextSourceObservations,
  HealthContextFacts,
  ContextFactEvidence,
  ContextQualityReviews,
} from '../entities';
import { createdBy } from '../../../common';

/**
 * Describe el contrato estructural de create agent data.
 */
export interface CreateAgentData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a agent type concept.
   */
  agentTypeConceptId: string;
  /**
   * Identificador asociado a provider.
   */
  providerId?: string;
  /**
   * Valor de implementation ref mantenido por la instancia.
   */
  implementationRef?: string;
  /**
   * Identificador asociado a owner tenant.
   */
  ownerTenantId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create source data.
 */
export interface CreateSourceData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId: string;
  /**
   * Valor de owner name mantenido por la instancia.
   */
  ownerName?: string;
  /**
   * Valor de canonical url mantenido por la instancia.
   */
  canonicalUrl?: string;
  /**
   * Identificador asociado a country concept.
   */
  countryConceptId?: string;
  /**
   * Valor de license text mantenido por la instancia.
   */
  licenseText?: string;
  /**
   * Identificador asociado a trust tier concept.
   */
  trustTierConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create observation data.
 */
export interface CreateObservationData {
  /**
   * Identificador asociado a collection run.
   */
  collectionRunId: string;
  /**
   * Identificador asociado a source.
   */
  sourceId: string;
  /**
   * Identificador asociado a country concept.
   */
  countryConceptId?: string;
  /**
   * Valor de source locator mantenido por la instancia.
   */
  sourceLocator?: string;
  /**
   * Valor de published at mantenido por la instancia.
   */
  publishedAt?: Date;
  /**
   * Valor de retrieved at mantenido por la instancia.
   */
  retrievedAt?: Date;
  /**
   * Valor de media type mantenido por la instancia.
   */
  mediaType?: string;
  /**
   * Identificador asociado a raw payload file.
   */
  rawPayloadFileId?: string;
  /**
   * Valor de extracted payload json mantenido por la instancia.
   */
  extractedPayloadJson?: unknown;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/**
 * Acceso a `health_context.*`: agentes recolectores, fuentes, programaciones,
 * contextos de país con sus versiones, corridas de recolección, observaciones,
 * hechos con su evidencia y revisiones de calidad.
 */
@Injectable()
export class HealthContextRepository {
  // --- Agentes (UC-44-01) ---

  /**
   * Crea create agent.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create agent conforme al contrato `ContextAgents`.
   */
  createAgent(em: EntityManager, data: CreateAgentData): ContextAgents {
    return em.create(
      ContextAgents,
      {
        code: data.code,
        name: data.name,
        agentTypeConceptId: data.agentTypeConceptId,
        providerId: data.providerId,
        implementationRef: data.implementationRef,
        ownerTenantId: data.ownerTenantId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find agent by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find agent by id conforme al contrato `Promise<ContextAgents | null>`.
   */
  findAgentById(em: EntityManager, id: string): Promise<ContextAgents | null> {
    return em.findOne(ContextAgents, { id });
  }

  /**
   * Obtiene find agent by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find agent by code conforme al contrato `Promise<ContextAgents | null>`.
   */
  findAgentByCode(
    em: EntityManager,
    code: string,
  ): Promise<ContextAgents | null> {
    return em.findOne(ContextAgents, { code });
  }

  // --- Fuentes (UC-44-02) ---

  /**
   * Crea create source.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create source conforme al contrato `HealthContextSources`.
   */
  createSource(
    em: EntityManager,
    data: CreateSourceData,
  ): HealthContextSources {
    return em.create(
      HealthContextSources,
      {
        code: data.code,
        name: data.name,
        sourceTypeConceptId: data.sourceTypeConceptId,
        ownerName: data.ownerName,
        canonicalUrl: data.canonicalUrl,
        countryConceptId: data.countryConceptId,
        licenseText: data.licenseText,
        trustTierConceptId: data.trustTierConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find source by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find source by id conforme al contrato `Promise<HealthContextSources | null>`.
   */
  findSourceById(
    em: EntityManager,
    id: string,
  ): Promise<HealthContextSources | null> {
    return em.findOne(HealthContextSources, { id });
  }

  /**
   * Obtiene find source by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find source by code conforme al contrato `Promise<HealthContextSources | null>`.
   */
  findSourceByCode(
    em: EntityManager,
    code: string,
  ): Promise<HealthContextSources | null> {
    return em.findOne(HealthContextSources, { code });
  }

  // --- Programaciones (UC-44-03, 05, 10) ---

  /**
   * Crea create schedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create schedule conforme al contrato `CountryContextSchedules`.
   */
  createSchedule(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a country concept.
       */
      countryConceptId: string;
      /**
       * Identificador asociado a agent.
       */
      agentId: string;
      /**
       * Valor de schedule expression mantenido por la instancia.
       */
      scheduleExpression: string;
      /**
       * Identificador asociado a timezone concept.
       */
      timezoneConceptId?: string;
      /**
       * Valor de lookback days mantenido por la instancia.
       */
      lookbackDays?: number;
      /**
       * Valor de freshness ttl seconds mantenido por la instancia.
       */
      freshnessTtlSeconds?: number;
      /**
       * Valor de next run at mantenido por la instancia.
       */
      nextRunAt?: Date;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): CountryContextSchedules {
    return em.create(
      CountryContextSchedules,
      {
        countryConceptId: data.countryConceptId,
        agentId: data.agentId,
        scheduleExpression: data.scheduleExpression,
        timezoneConceptId: data.timezoneConceptId,
        lookbackDays: data.lookbackDays,
        freshnessTtlSeconds: data.freshnessTtlSeconds,
        nextRunAt: data.nextRunAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Lote de programaciones vencidas (`next_run_at` ya pasó), activas, con
   * `SKIP LOCKED` para que varios ticks del worker no se disputen la misma
   * fila. La usa el tick de recolección (Fase 2 del plan de corrección de
   * workers) — antes de esto nada evaluaba si una programación estaba vencida.
   */
  claimDueSchedules(
    em: EntityManager,
    now: Date,
    activeStatusConceptId: string,
    limit: number,
  ): Promise<CountryContextSchedules[]> {
    return em.find(
      CountryContextSchedules,
      {
        statusConceptId: activeStatusConceptId,
        nextRunAt: { $lte: now },
      },
      {
        lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
        orderBy: { nextRunAt: 'ASC' },
        limit,
      },
    );
  }

  /**
   * Programación bloqueada. Arrancar una corrida recalcula `next_run_at`, y dos
   * disparos simultáneos dejarían la cola del scheduler con la misma marca.
   */
  findScheduleForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CountryContextSchedules | null> {
    return em.findOne(
      CountryContextSchedules,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Contextos de país (UC-44-04, 09, 11, 12) ---

  /**
   * Crea create context.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create context conforme al contrato `CountryHealthContexts`.
   */
  createContext(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a country concept.
       */
      countryConceptId: string;
      /**
       * Identificador asociado a context domain concept.
       */
      contextDomainConceptId: string;
      /**
       * Valor de context key mantenido por la instancia.
       */
      contextKey: string;
      /**
       * Valor de title mantenido por la instancia.
       */
      title: string;
      /**
       * Valor de description mantenido por la instancia.
       */
      description?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a actor user.
       */
      actorUserId?: string;
    },
  ): CountryHealthContexts {
    return em.create(
      CountryHealthContexts,
      {
        countryConceptId: data.countryConceptId,
        contextDomainConceptId: data.contextDomainConceptId,
        contextKey: data.contextKey,
        title: data.title,
        description: data.description,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find context by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find context by id conforme al contrato `Promise<CountryHealthContexts | null>`.
   */
  findContextById(
    em: EntityManager,
    id: string,
  ): Promise<CountryHealthContexts | null> {
    return em.findOne(CountryHealthContexts, { id });
  }

  /** Todo lo que mueve `current_version_id` bloquea el contexto. */
  findContextForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CountryHealthContexts | null> {
    return em.findOne(
      CountryHealthContexts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Clave natural del contexto: país + dominio + clave. Es lo que resuelve UC-44-12. */
  findContextByKey(
    em: EntityManager,
    countryConceptId: string,
    contextDomainConceptId: string,
    contextKey: string,
  ): Promise<CountryHealthContexts | null> {
    return em.findOne(CountryHealthContexts, {
      countryConceptId,
      contextDomainConceptId,
      contextKey,
    });
  }

  // --- Versiones (UC-44-07, 08, 09, 11, 12) ---

  /**
   * Crea create context version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create context version conforme al contrato `CountryHealthContextVersions`.
   */
  createContextVersion(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a country health context.
       */
      countryHealthContextId: string;
      /**
       * Valor de version number mantenido por la instancia.
       */
      versionNumber: number;
      /**
       * Identificador asociado a collection run.
       */
      collectionRunId?: string;
      /**
       * Valor de schema version mantenido por la instancia.
       */
      schemaVersion?: string;
      /**
       * Valor de summary mantenido por la instancia.
       */
      summary?: string;
      /**
       * Valor de context payload json mantenido por la instancia.
       */
      contextPayloadJson?: unknown;
      /**
       * Valor de observed at mantenido por la instancia.
       */
      observedAt?: Date;
      /**
       * Valor de expires at mantenido por la instancia.
       */
      expiresAt?: Date;
      /**
       * Valor de confidence score mantenido por la instancia.
       */
      confidenceScore?: string;
      /**
       * Valor de content hash mantenido por la instancia.
       */
      contentHash: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): CountryHealthContextVersions {
    return em.create(
      CountryHealthContextVersions,
      {
        countryHealthContextId: data.countryHealthContextId,
        versionNumber: data.versionNumber,
        collectionRunId: data.collectionRunId,
        schemaVersion: data.schemaVersion,
        summary: data.summary,
        contextPayloadJson: data.contextPayloadJson,
        observedAt: data.observedAt,
        expiresAt: data.expiresAt,
        confidenceScore: data.confidenceScore,
        contentHash: data.contentHash,
        statusConceptId: data.statusConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find version by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version by id conforme al contrato `Promise<CountryHealthContextVersions | null>`.
   */
  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<CountryHealthContextVersions | null> {
    return em.findOne(CountryHealthContextVersions, { id });
  }

  /**
   * Obtiene find version for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version for update conforme al contrato `Promise<CountryHealthContextVersions | null>`.
   */
  findVersionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<CountryHealthContextVersions | null> {
    return em.findOne(
      CountryHealthContextVersions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Obtiene find latest version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param countryHealthContextId - Identificador de country health context.
   * @returns Resultado de find latest version conforme al contrato `Promise<CountryHealthContextVersions | null>`.
   */
  findLatestVersion(
    em: EntityManager,
    countryHealthContextId: string,
  ): Promise<CountryHealthContextVersions | null> {
    return em.findOne(
      CountryHealthContextVersions,
      { countryHealthContextId },
      { orderBy: { versionNumber: 'DESC' } },
    );
  }

  /** Versión publicada vigente del contexto: sólo puede haber una a la vez. */
  findPublishedVersionForUpdate(
    em: EntityManager,
    countryHealthContextId: string,
    publishedStatusConceptId: string,
  ): Promise<CountryHealthContextVersions | null> {
    return em.findOne(
      CountryHealthContextVersions,
      {
        countryHealthContextId,
        statusConceptId: publishedStatusConceptId,
        effectiveTo: null,
      },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  // --- Corridas de recolección (UC-44-05, 06, 10) ---

  /**
   * Crea create collection run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create collection run conforme al contrato `ContextCollectionRuns`.
   */
  createCollectionRun(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a schedule.
       */
      scheduleId?: string;
      /**
       * Identificador asociado a agent.
       */
      agentId: string;
      /**
       * Identificador asociado a country concept.
       */
      countryConceptId: string;
      /**
       * Valor de idempotency key mantenido por la instancia.
       */
      idempotencyKey: string;
      /**
       * Identificador asociado a trigger concept.
       */
      triggerConceptId: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): ContextCollectionRuns {
    return em.create(
      ContextCollectionRuns,
      {
        scheduleId: data.scheduleId,
        agentId: data.agentId,
        countryConceptId: data.countryConceptId,
        idempotencyKey: data.idempotencyKey,
        triggerConceptId: data.triggerConceptId,
        statusConceptId: data.statusConceptId,
        startedAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find run by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find run by id conforme al contrato `Promise<ContextCollectionRuns | null>`.
   */
  findRunById(
    em: EntityManager,
    id: string,
  ): Promise<ContextCollectionRuns | null> {
    return em.findOne(ContextCollectionRuns, { id });
  }

  /**
   * Obtiene find run for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find run for update conforme al contrato `Promise<ContextCollectionRuns | null>`.
   */
  findRunForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<ContextCollectionRuns | null> {
    return em.findOne(
      ContextCollectionRuns,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Idempotencia de la corrida programada: el mismo disparo no se ejecuta dos veces. */
  findRunByIdempotencyKey(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<ContextCollectionRuns | null> {
    return em.findOne(ContextCollectionRuns, { idempotencyKey });
  }

  // --- Observaciones (UC-44-06, 07, 10) ---

  /** Log inmutable: la observación queda tal como se recogió. */
  createObservation(
    em: EntityManager,
    data: CreateObservationData,
  ): ContextSourceObservations {
    return em.create(
      ContextSourceObservations,
      {
        collectionRunId: data.collectionRunId,
        sourceId: data.sourceId,
        countryConceptId: data.countryConceptId,
        sourceLocator: data.sourceLocator,
        publishedAt: data.publishedAt,
        retrievedAt: data.retrievedAt ?? new Date(),
        mediaType: data.mediaType,
        rawPayloadFileId: data.rawPayloadFileId,
        extractedPayloadJson: data.extractedPayloadJson,
        contentHash: data.contentHash,
        statusConceptId: data.statusConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /** Misma corrida y mismo contenido: la observación ya estaba recogida. */
  findObservationByHash(
    em: EntityManager,
    collectionRunId: string,
    contentHash: string,
  ): Promise<ContextSourceObservations | null> {
    return em.findOne(ContextSourceObservations, {
      collectionRunId,
      contentHash,
    });
  }

  /**
   * Obtiene find observations by run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param collectionRunId - Identificador de collection run.
   * @returns Resultado de find observations by run conforme al contrato `Promise<ContextSourceObservations[]>`.
   */
  findObservationsByRun(
    em: EntityManager,
    collectionRunId: string,
  ): Promise<ContextSourceObservations[]> {
    return em.find(ContextSourceObservations, { collectionRunId });
  }

  /**
   * Ejecuta la operación count observations.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param collectionRunId - Identificador de collection run.
   * @param statusConceptId - Identificador de status concept.
   * @returns Resultado de count observations conforme al contrato `Promise<number>`.
   */
  countObservations(
    em: EntityManager,
    collectionRunId: string,
    statusConceptId?: string,
  ): Promise<number> {
    return em.count(
      ContextSourceObservations,
      statusConceptId
        ? { collectionRunId, statusConceptId }
        : { collectionRunId },
    );
  }

  // --- Hechos y evidencia (UC-44-07, 12) ---

  /** Hecho inmutable de una versión: se escribe una vez y no se corrige. */
  createFact(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a context version.
       */
      contextVersionId: string;
      /**
       * Valor de fact key mantenido por la instancia.
       */
      factKey: string;
      /**
       * Identificador asociado a metric concept.
       */
      metricConceptId?: string;
      /**
       * Valor de value type mantenido por la instancia.
       */
      valueType: string;
      /**
       * Valor de value json mantenido por la instancia.
       */
      valueJson: unknown;
      /**
       * Identificador asociado a unit concept.
       */
      unitConceptId?: string;
      /**
       * Valor de period start mantenido por la instancia.
       */
      periodStart?: Date;
      /**
       * Valor de period end mantenido por la instancia.
       */
      periodEnd?: Date;
      /**
       * Valor de confidence score mantenido por la instancia.
       */
      confidenceScore?: string;
      /**
       * Identificador asociado a status concept.
       */
      statusConceptId: string;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): HealthContextFacts {
    return em.create(
      HealthContextFacts,
      {
        contextVersionId: data.contextVersionId,
        factKey: data.factKey,
        metricConceptId: data.metricConceptId,
        valueType: data.valueType,
        valueJson: data.valueJson,
        unitConceptId: data.unitConceptId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        confidenceScore: data.confidenceScore,
        statusConceptId: data.statusConceptId,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find facts by version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param contextVersionId - Identificador de context version.
   * @returns Resultado de find facts by version conforme al contrato `Promise<HealthContextFacts[]>`.
   */
  findFactsByVersion(
    em: EntityManager,
    contextVersionId: string,
  ): Promise<HealthContextFacts[]> {
    return em.find(HealthContextFacts, { contextVersionId });
  }

  /** Enlace inmutable hecho → observación: es la trazabilidad de la evidencia. */
  createFactEvidence(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health context fact.
       */
      healthContextFactId: string;
      /**
       * Identificador asociado a source observation.
       */
      sourceObservationId: string;
      /**
       * Valor de evidence locator json mantenido por la instancia.
       */
      evidenceLocatorJson?: unknown;
      /**
       * Valor de relevance score mantenido por la instancia.
       */
      relevanceScore?: string;
      /**
       * Valor de evidence hash mantenido por la instancia.
       */
      evidenceHash?: string;
      /**
       * Identificador asociado a recorded by user.
       */
      recordedByUserId?: string;
    },
  ): ContextFactEvidence {
    return em.create(
      ContextFactEvidence,
      {
        healthContextFactId: data.healthContextFactId,
        sourceObservationId: data.sourceObservationId,
        evidenceLocatorJson: data.evidenceLocatorJson,
        relevanceScore: data.relevanceScore,
        evidenceHash: data.evidenceHash,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Obtiene find evidence by facts.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param healthContextFactIds - Valor de health context fact ids requerido por la operación.
   * @returns Resultado de find evidence by facts conforme al contrato `Promise<ContextFactEvidence[]>`.
   */
  findEvidenceByFacts(
    em: EntityManager,
    healthContextFactIds: string[],
  ): Promise<ContextFactEvidence[]> {
    return em.find(ContextFactEvidence, {
      healthContextFactId: { $in: healthContextFactIds },
    });
  }

  // --- Revisiones de calidad (UC-44-08) ---

  /** Log append-only: se admiten varias revisiones; la transición decide. */
  createQualityReview(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a context version.
       */
      contextVersionId: string;
      /**
       * Identificador asociado a reviewer agent.
       */
      reviewerAgentId?: string;
      /**
       * Identificador asociado a reviewed by user.
       */
      reviewedByUserId?: string;
      /**
       * Identificador asociado a review type concept.
       */
      reviewTypeConceptId: string;
      /**
       * Identificador asociado a outcome concept.
       */
      outcomeConceptId: string;
      /**
       * Valor de issues json mantenido por la instancia.
       */
      issuesJson?: unknown;
      /**
       * Valor de notes mantenido por la instancia.
       */
      notes?: string;
    },
  ): ContextQualityReviews {
    return em.create(
      ContextQualityReviews,
      {
        contextVersionId: data.contextVersionId,
        reviewerAgentId: data.reviewerAgentId,
        reviewedByUserId: data.reviewedByUserId,
        reviewTypeConceptId: data.reviewTypeConceptId,
        outcomeConceptId: data.outcomeConceptId,
        issuesJson: data.issuesJson,
        notes: data.notes,
        recordedAt: new Date(),
      },
      { partial: true },
    );
  }
}
