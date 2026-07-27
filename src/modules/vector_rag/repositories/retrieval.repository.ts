import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  RetrievalSessions,
  RetrievalCandidates,
  RetrievalEvidence,
  RetrievalFeedbackEvents,
} from '../entities';

export interface CreateSessionData {
  tenantId: string;
  principalId: string;
  agentId?: string;
  purposeOfUseCode: string;
  patientProfileId?: string;
  consentDirectiveId?: string;
  queryTextRedacted: string;
  queryHash: string;
  status: string;
}

export interface CreateCandidateData {
  retrievalSessionId: string;
  vectorChunkId: string;
  rank: number;
  vectorScore: number;
  lexicalScore?: number;
  rerankerScore?: number;
  authorizationDecision: string;
  selected: boolean;
}

export interface CreateEvidenceData {
  retrievalSessionId: string;
  vectorChunkId: string;
  citationNumber: number;
  quotedTextRedacted: string;
  sourceUri?: string;
  sourceVersionId?: string;
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

  createSession(em: EntityManager, data: CreateSessionData): RetrievalSessions {
    return em.create(
      RetrievalSessions,
      { ...data, startedAt: new Date() } as never,
      { partial: true },
    );
  }

  findSessionById(
    em: EntityManager,
    id: string,
  ): Promise<RetrievalSessions | null> {
    return em.findOne(RetrievalSessions, { id });
  }

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

  createCandidate(
    em: EntityManager,
    data: CreateCandidateData,
  ): RetrievalCandidates {
    return em.create(RetrievalCandidates, data as never, { partial: true });
  }

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

  createEvidence(
    em: EntityManager,
    data: CreateEvidenceData,
  ): RetrievalEvidence {
    return em.create(RetrievalEvidence, data as never, { partial: true });
  }

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

  createFeedback(
    em: EntityManager,
    data: {
      retrievalSessionId: string;
      principalId: string;
      feedbackType: string;
      relevanceScore?: number;
      safetyIssueCode?: string;
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
