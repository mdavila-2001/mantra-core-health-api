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

export interface CreateAgentData {
  code: string;
  name: string;
  agentTypeConceptId: string;
  providerId?: string;
  implementationRef?: string;
  ownerTenantId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateSourceData {
  code: string;
  name: string;
  sourceTypeConceptId: string;
  ownerName?: string;
  canonicalUrl?: string;
  countryConceptId?: string;
  licenseText?: string;
  trustTierConceptId: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateObservationData {
  collectionRunId: string;
  sourceId: string;
  countryConceptId?: string;
  sourceLocator?: string;
  publishedAt?: Date;
  retrievedAt?: Date;
  mediaType?: string;
  rawPayloadFileId?: string;
  extractedPayloadJson?: unknown;
  contentHash: string;
  statusConceptId: string;
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

  findAgentById(em: EntityManager, id: string): Promise<ContextAgents | null> {
    return em.findOne(ContextAgents, { id });
  }

  findAgentByCode(
    em: EntityManager,
    code: string,
  ): Promise<ContextAgents | null> {
    return em.findOne(ContextAgents, { code });
  }

  // --- Fuentes (UC-44-02) ---

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

  findSourceById(
    em: EntityManager,
    id: string,
  ): Promise<HealthContextSources | null> {
    return em.findOne(HealthContextSources, { id });
  }

  findSourceByCode(
    em: EntityManager,
    code: string,
  ): Promise<HealthContextSources | null> {
    return em.findOne(HealthContextSources, { code });
  }

  // --- Programaciones (UC-44-03, 05, 10) ---

  createSchedule(
    em: EntityManager,
    data: {
      countryConceptId: string;
      agentId: string;
      scheduleExpression: string;
      timezoneConceptId?: string;
      lookbackDays?: number;
      freshnessTtlSeconds?: number;
      nextRunAt?: Date;
      statusConceptId: string;
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

  createContext(
    em: EntityManager,
    data: {
      countryConceptId: string;
      contextDomainConceptId: string;
      contextKey: string;
      title: string;
      description?: string;
      statusConceptId: string;
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

  createContextVersion(
    em: EntityManager,
    data: {
      countryHealthContextId: string;
      versionNumber: number;
      collectionRunId?: string;
      schemaVersion?: string;
      summary?: string;
      contextPayloadJson?: unknown;
      observedAt?: Date;
      expiresAt?: Date;
      confidenceScore?: string;
      contentHash: string;
      statusConceptId: string;
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

  findVersionById(
    em: EntityManager,
    id: string,
  ): Promise<CountryHealthContextVersions | null> {
    return em.findOne(CountryHealthContextVersions, { id });
  }

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

  createCollectionRun(
    em: EntityManager,
    data: {
      scheduleId?: string;
      agentId: string;
      countryConceptId: string;
      idempotencyKey: string;
      triggerConceptId: string;
      statusConceptId: string;
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

  findRunById(
    em: EntityManager,
    id: string,
  ): Promise<ContextCollectionRuns | null> {
    return em.findOne(ContextCollectionRuns, { id });
  }

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

  findObservationsByRun(
    em: EntityManager,
    collectionRunId: string,
  ): Promise<ContextSourceObservations[]> {
    return em.find(ContextSourceObservations, { collectionRunId });
  }

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
      contextVersionId: string;
      factKey: string;
      metricConceptId?: string;
      valueType: string;
      valueJson: unknown;
      unitConceptId?: string;
      periodStart?: Date;
      periodEnd?: Date;
      confidenceScore?: string;
      statusConceptId: string;
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
      healthContextFactId: string;
      sourceObservationId: string;
      evidenceLocatorJson?: unknown;
      relevanceScore?: string;
      evidenceHash?: string;
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
      contextVersionId: string;
      reviewerAgentId?: string;
      reviewedByUserId?: string;
      reviewTypeConceptId: string;
      outcomeConceptId: string;
      issuesJson?: unknown;
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
