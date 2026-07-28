import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  RetrievalSessions,
  RetrievalCandidates,
  RetrievalEvidence,
  RetrievalFeedbackEvents,
} from '../entities';

/**
 * Describe el contrato estructural de create session data.
 */
export interface CreateSessionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a principal.
   */
  principalId: string;
  /**
   * Identificador asociado a agent.
   */
  agentId?: string;
  /**
   * Valor de purpose of use code mantenido por la instancia.
   */
  purposeOfUseCode: string;
  /**
   * Identificador asociado a patient profile.
   */
  patientProfileId?: string;
  /**
   * Identificador asociado a consent directive.
   */
  consentDirectiveId?: string;
  /**
   * Valor de query text redacted mantenido por la instancia.
   */
  queryTextRedacted: string;
  /**
   * Valor de query hash mantenido por la instancia.
   */
  queryHash: string;
  /**
   * Valor de status mantenido por la instancia.
   */
  status: string;
}

/**
 * Describe el contrato estructural de create candidate data.
 */
export interface CreateCandidateData {
  /**
   * Identificador asociado a retrieval session.
   */
  retrievalSessionId: string;
  /**
   * Identificador asociado a vector chunk.
   */
  vectorChunkId: string;
  /**
   * Valor de rank mantenido por la instancia.
   */
  rank: number;
  /**
   * Valor de vector score mantenido por la instancia.
   */
  vectorScore: number;
  /**
   * Valor de lexical score mantenido por la instancia.
   */
  lexicalScore?: number;
  /**
   * Valor de reranker score mantenido por la instancia.
   */
  rerankerScore?: number;
  /**
   * Valor de authorization decision mantenido por la instancia.
   */
  authorizationDecision: string;
  /**
   * Valor de selected mantenido por la instancia.
   */
  selected: boolean;
}

/**
 * Describe el contrato estructural de create evidence data.
 */
export interface CreateEvidenceData {
  /**
   * Identificador asociado a retrieval session.
   */
  retrievalSessionId: string;
  /**
   * Identificador asociado a vector chunk.
   */
  vectorChunkId: string;
  /**
   * Valor de citation number mantenido por la instancia.
   */
  citationNumber: number;
  /**
   * Valor de quoted text redacted mantenido por la instancia.
   */
  quotedTextRedacted: string;
  /**
   * Valor de source uri mantenido por la instancia.
   */
  sourceUri?: string;
  /**
   * Identificador asociado a source version.
   */
  sourceVersionId?: string;
  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  evidenceHash: string;
}

/**
 * Sesiones de retrieval y todo lo que cuelga de ellas: candidatos con su decisión
 * de autorización, evidencia citable y feedback.
 *
 * Candidatos, evidencia y feedback son append-only: son el registro de qué se
 * consultó, qué se dejó ver y por qué. Editable, no serviría para auditar la
 * respuesta que se le dio a un clínico.
 */
@Injectable()
export class RetrievalRepository {
  // --- Sesiones (UC-59-06 … 09) ---

  /**
   * Crea create session.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create session conforme al contrato `RetrievalSessions`.
   */
  createSession(em: EntityManager, data: CreateSessionData): RetrievalSessions {
    return em.create(
      RetrievalSessions,
      { ...data, startedAt: new Date() } as never,
      { partial: true },
    );
  }

  /**
   * Obtiene find session by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find session by id conforme al contrato `Promise<RetrievalSessions | null>`.
   */
  findSessionById(
    em: EntityManager,
    id: string,
  ): Promise<RetrievalSessions | null> {
    return em.findOne(RetrievalSessions, { id });
  }

  /**
   * Obtiene find session for update.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find session for update conforme al contrato `Promise<RetrievalSessions | null>`.
   */
  findSessionForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<RetrievalSessions | null> {
    return em.findOne(
      RetrievalSessions,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /**
   * Sesión abierta del mismo principal para la misma consulta. Es lo que evita
   * que un cliente que reintenta abra dos sesiones para la misma pregunta y las
   * cuente dos veces en el histórico de acceso.
   */
  findOpenSessionByHash(
    em: EntityManager,
    tenantId: string,
    principalId: string,
    queryHash: string,
    openStatus: string,
  ): Promise<RetrievalSessions | null> {
    return em.findOne(RetrievalSessions, {
      tenantId,
      principalId,
      queryHash,
      status: openStatus,
    });
  }

  // --- Candidatos (UC-59-07, 08) ---

  /**
   * Crea create candidate.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create candidate conforme al contrato `RetrievalCandidates`.
   */
  createCandidate(
    em: EntityManager,
    data: CreateCandidateData,
  ): RetrievalCandidates {
    return em.create(RetrievalCandidates, data as never, { partial: true });
  }

  /**
   * Obtiene find candidates by session.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param retrievalSessionId - Identificador de retrieval session.
   * @returns Resultado de find candidates by session conforme al contrato `Promise<RetrievalCandidates[]>`.
   */
  findCandidatesBySession(
    em: EntityManager,
    retrievalSessionId: string,
  ): Promise<RetrievalCandidates[]> {
    return em.find(
      RetrievalCandidates,
      { retrievalSessionId },
      { orderBy: { rank: 'ASC' } },
    );
  }

  /** Los candidatos que se pueden citar: seleccionados y autorizados. */
  findSelectedCandidates(
    em: EntityManager,
    retrievalSessionId: string,
    allowDecision: string,
  ): Promise<RetrievalCandidates[]> {
    return em.find(
      RetrievalCandidates,
      {
        retrievalSessionId,
        selected: true,
        authorizationDecision: allowDecision,
      },
      { orderBy: { rank: 'ASC' } },
    );
  }

  // --- Evidencia (UC-59-08) ---

  /**
   * Crea create evidence.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create evidence conforme al contrato `RetrievalEvidence`.
   */
  createEvidence(
    em: EntityManager,
    data: CreateEvidenceData,
  ): RetrievalEvidence {
    return em.create(RetrievalEvidence, data as never, { partial: true });
  }

  /**
   * Obtiene find evidence by session.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param retrievalSessionId - Identificador de retrieval session.
   * @returns Resultado de find evidence by session conforme al contrato `Promise<RetrievalEvidence[]>`.
   */
  findEvidenceBySession(
    em: EntityManager,
    retrievalSessionId: string,
  ): Promise<RetrievalEvidence[]> {
    return em.find(
      RetrievalEvidence,
      { retrievalSessionId },
      { orderBy: { citationNumber: 'ASC' } },
    );
  }

  // --- Feedback (UC-59-09) ---

  /**
   * Crea create feedback.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create feedback conforme al contrato `RetrievalFeedbackEvents`.
   */
  createFeedback(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a retrieval session.
       */
      retrievalSessionId: string;
      /**
       * Identificador asociado a principal.
       */
      principalId: string;
      /**
       * Valor de feedback type mantenido por la instancia.
       */
      feedbackType: string;
      /**
       * Valor de relevance score mantenido por la instancia.
       */
      relevanceScore?: number;
      /**
       * Valor de safety issue code mantenido por la instancia.
       */
      safetyIssueCode?: string;
      /**
       * Valor de comment redacted mantenido por la instancia.
       */
      commentRedacted?: string;
    },
  ): RetrievalFeedbackEvents {
    return em.create(
      RetrievalFeedbackEvents,
      { ...data, createdAt: new Date() } as never,
      { partial: true },
    );
  }
}
