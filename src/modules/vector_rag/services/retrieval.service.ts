import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import type { RagAccessPolicies, VectorDocuments } from '../entities';
import {
  RetrievalRepository,
  VectorCatalogRepository,
  VectorCorpusRepository,
} from '../repositories';
import { MAX_CANDIDATES, type AuthorizationDecision } from '../constants';
import {
  OpenRetrievalSessionDto,
  RetrievalSessionResponseDto,
  RankCandidatesDto,
  RankCandidatesResponseDto,
  MaterializeEvidenceDto,
  EvidenceResponseDto,
  CaptureFeedbackDto,
  FeedbackResponseDto,
} from '../dto';

const DEFAULT_TOP_K = 10;

/**
 * Retrieval gobernado por consentimiento (UC-59-06 … 09): abrir la sesión,
 * ranquear y filtrar candidatos, materializar la evidencia citable y capturar el
 * feedback.
 *
 * La idea que sostiene el módulo entero: **la autorización se evalúa por chunk y
 * se registra**. No basta con no devolver lo que no toca; hay que poder demostrar
 * después qué se descartó y por qué.
 */
@Injectable()
export class RetrievalService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param retrievalRepo - Valor de retrieval repo requerido por la operación.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param corpusRepo - Valor de corpus repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly retrievalRepo: RetrievalRepository,
    private readonly catalogRepo: VectorCatalogRepository,
    private readonly corpusRepo: VectorCorpusRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(RetrievalService.name);
  }

  /**
   * UC-59-06: abrir la sesión.
   *
   * La política de la colección tiene que estar **publicada**: una en borrador es
   * una propuesta de privacidad, y consultar bajo ella sería aplicar reglas que
   * nadie ha aprobado todavía.
   *
   * La consulta se guarda redactada y con su hash. El hash identifica la pregunta
   * —para deduplicar y para agrupar en el histórico— sin necesidad de conservar lo
   * que el clínico escribió.
   */
  async openSession(
    dto: OpenRetrievalSessionDto,
    actor: AuthenticatedUser,
  ): Promise<RetrievalSessionResponseDto> {
    return this.em.transactional(async (tx) => {
      const collection = await this.catalogRepo.findCollectionById(
        tx,
        dto.vectorCollectionId,
      );
      if (!collection) {
        throw new ResourceNotFoundException('Colección no encontrada.', {
          vectorCollectionId: dto.vectorCollectionId,
        });
      }
      if (collection.lifecycleState === 'deprecated') {
        throw new PreconditionFailedException('La colección está deprecada.', {
          vectorCollectionId: collection.id,
        });
      }

      const policy = await this.requirePublishedPolicy(
        tx,
        collection.accessPolicyId,
      );

      if (!policy.allowedPrincipalTypes.includes(dto.principalType)) {
        throw new PreconditionFailedException(
          'La política no admite ese tipo de principal.',
          { principalType: dto.principalType },
        );
      }
      if (!policy.allowedPurposeCodes.includes(dto.purposeOfUseCode)) {
        throw new PreconditionFailedException(
          'La política no admite ese propósito de uso.',
          { purposeOfUseCode: dto.purposeOfUseCode },
        );
      }
      if (policy.patientScopeRequired && !dto.patientProfileId) {
        throw new PreconditionFailedException(
          'La política exige declarar el paciente sobre el que se consulta.',
          { policyCode: policy.code },
        );
      }
      if (policy.consentRequired && !dto.consentDirectiveId) {
        throw new PreconditionFailedException(
          'La política exige una directiva de consentimiento vigente.',
          { policyCode: policy.code },
        );
      }

      const queryHash = createHash('sha256')
        .update(dto.queryTextRedacted)
        .digest('hex');

      const open = await this.retrievalRepo.findOpenSessionByHash(
        tx,
        collection.tenantId,
        actor.id,
        queryHash,
        'open',
      );
      if (open) {
        return {
          id: open.id,
          status: open.status,
          queryHash: open.queryHash,
          duplicate: true,
        };
      }

      const session = this.retrievalRepo.createSession(tx, {
        tenantId: collection.tenantId,
        principalId: actor.id,
        agentId: dto.agentId,
        purposeOfUseCode: dto.purposeOfUseCode,
        patientProfileId: dto.patientProfileId,
        consentDirectiveId: dto.consentDirectiveId,
        queryTextRedacted: dto.queryTextRedacted,
        queryHash,
        status: 'open',
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: collection.tenantId,
        eventType: 'RetrievalSessionOpened',
        aggregateType: 'vector_rag.retrieval_sessions',
        aggregateId: session.id,
        payloadJson: {
          vectorCollectionId: collection.id,
          purposeOfUseCode: dto.purposeOfUseCode,
          patientProfileId: dto.patientProfileId ?? null,
          consentDirectiveId: dto.consentDirectiveId ?? null,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'vector.retrieval.open',
          sessionId: session.id,
          purposeOfUseCode: dto.purposeOfUseCode,
        },
        'Sesión de retrieval abierta',
      );

      return {
        id: session.id,
        status: session.status,
        queryHash,
        duplicate: false,
      };
    });
  }

  /**
   * UC-59-07: ranquear los candidatos y decidir cuáles se pueden ver.
   *
   * Cada candidato recibe una decisión y **todas se guardan**, también las
   * denegadas. Es la diferencia entre "la respuesta salió corta" y "la respuesta
   * salió corta porque faltaba el consentimiento de estos tres documentos".
   *
   * Sólo un candidato autorizado puede quedar seleccionado, y `topK` recorta entre
   * los autorizados: si recortara antes de decidir, un documento permitido podría
   * quedar fuera por culpa de otros que ni siquiera se podían mostrar.
   */
  async rankCandidates(
    sessionId: string,
    dto: RankCandidatesDto,
    actor: AuthenticatedUser,
  ): Promise<RankCandidatesResponseDto> {
    return this.em.transactional(async (tx) => {
      const session = await this.retrievalRepo.findSessionForUpdate(
        tx,
        sessionId,
      );
      if (!session) {
        throw new ResourceNotFoundException(
          'Sesión de retrieval no encontrada.',
          { sessionId },
        );
      }
      if (session.status !== 'open') {
        throw new PreconditionFailedException('La sesión ya no está abierta.', {
          sessionId,
          status: session.status,
        });
      }

      // Se ordena por puntuación antes de decidir: el rango es el del ranking, no
      // el orden en que el worker mandó los candidatos.
      const ordered = [...dto.candidates].sort(
        (a, b) =>
          (b.rerankerScore ?? b.vectorScore) -
          (a.rerankerScore ?? a.vectorScore),
      );

      const deniedByReason: Record<string, number> = {};
      const evaluated: {
        /**
         * Identificador asociado a vector chunk.
         */
        vectorChunkId: string;
        /**
         * Valor de rank mantenido por la instancia.
         */
        rank: number;
        /**
         * Valor de decision mantenido por la instancia.
         */
        decision: AuthorizationDecision;
      }[] = [];

      let rank = 0;
      for (const candidate of ordered.slice(0, MAX_CANDIDATES)) {
        rank += 1;
        const chunk = await this.corpusRepo.findChunkById(
          tx,
          candidate.vectorChunkId,
        );
        if (!chunk) {
          throw new ResourceNotFoundException(
            'Chunk candidato no encontrado.',
            {
              vectorChunkId: candidate.vectorChunkId,
            },
          );
        }
        const document = await this.corpusRepo.findDocumentById(
          tx,
          chunk.vectorDocumentId,
        );
        if (!document) {
          throw new ResourceNotFoundException(
            'Documento del chunk no encontrado.',
            {
              vectorChunkId: candidate.vectorChunkId,
            },
          );
        }

        const policy = await this.requirePublishedPolicy(
          tx,
          (
            await this.catalogRepo.findCollectionById(
              tx,
              document.vectorCollectionId,
            )
          )?.accessPolicyId,
        );

        const decision = this.decide(document, policy, session);
        if (decision !== 'allow') {
          deniedByReason[decision] = (deniedByReason[decision] ?? 0) + 1;
        }
        evaluated.push({
          vectorChunkId: candidate.vectorChunkId,
          rank,
          decision,
        });
      }

      const allowedIds = new Set(
        evaluated
          .filter((e) => e.decision === 'allow')
          .slice(0, dto.topK ?? DEFAULT_TOP_K)
          .map((e) => e.vectorChunkId),
      );

      const candidates = evaluated.map((entry, index) => {
        const input = ordered[index];
        const selected = allowedIds.has(entry.vectorChunkId);
        this.retrievalRepo.createCandidate(tx, {
          retrievalSessionId: sessionId,
          vectorChunkId: entry.vectorChunkId,
          rank: entry.rank,
          vectorScore: input.vectorScore,
          lexicalScore: input.lexicalScore,
          rerankerScore: input.rerankerScore,
          authorizationDecision: entry.decision,
          selected,
        });
        return {
          vectorChunkId: entry.vectorChunkId,
          rank: entry.rank,
          authorizationDecision: entry.decision,
          selected,
        };
      });

      session.status = 'ranked';

      await this.outbox.publishDomainEvent(tx, {
        tenantId: session.tenantId,
        eventType: 'RetrievalCandidatesRanked',
        aggregateType: 'vector_rag.retrieval_sessions',
        aggregateId: sessionId,
        payloadJson: {
          evaluated: candidates.length,
          selected: allowedIds.size,
          deniedByReason,
        },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'vector.retrieval.rank',
          sessionId,
          evaluated: candidates.length,
          selected: allowedIds.size,
          deniedByReason,
        },
        'Candidatos de retrieval ranqueados',
      );

      return {
        retrievalSessionId: sessionId,
        status: session.status,
        candidates,
        deniedByReason,
      };
    });
  }

  /**
   * UC-59-08: materializar la evidencia citable.
   *
   * Sólo se cita lo seleccionado y autorizado. La `source_version_id` se copia del
   * documento, no se recibe: una cita tiene que apuntar a la versión concreta que
   * se leyó, y si el llamante pudiera declararla podría citar una versión que
   * dice lo contrario.
   *
   * El `evidence_hash` liga la cita a su texto: es lo que permite comprobar
   * después que la respuesta generada citaba lo que decía citar.
   */
  async materializeEvidence(
    sessionId: string,
    dto: MaterializeEvidenceDto,
    actor: AuthenticatedUser,
  ): Promise<EvidenceResponseDto> {
    return this.em.transactional(async (tx) => {
      const session = await this.retrievalRepo.findSessionForUpdate(
        tx,
        sessionId,
      );
      if (!session) {
        throw new ResourceNotFoundException(
          'Sesión de retrieval no encontrada.',
          { sessionId },
        );
      }
      if (session.status !== 'ranked') {
        throw new PreconditionFailedException(
          'La sesión tiene que estar ranqueada para materializar evidencia.',
          { sessionId, status: session.status },
        );
      }

      const selected = await this.retrievalRepo.findSelectedCandidates(
        tx,
        sessionId,
        'allow',
      );
      const selectable = new Set(selected.map((c) => c.vectorChunkId));
      if (selectable.size === 0) {
        throw new PreconditionFailedException(
          'La sesión no tiene ningún candidato seleccionado y autorizado que citar.',
          { sessionId },
        );
      }

      let citationNumber = 0;
      for (const citation of dto.citations) {
        if (!selectable.has(citation.vectorChunkId)) {
          throw new PreconditionFailedException(
            'Se intenta citar un chunk que no quedó seleccionado y autorizado.',
            { vectorChunkId: citation.vectorChunkId },
          );
        }

        const chunk = await this.corpusRepo.findChunkById(
          tx,
          citation.vectorChunkId,
        );
        const document = chunk
          ? await this.corpusRepo.findDocumentById(tx, chunk.vectorDocumentId)
          : null;

        citationNumber += 1;
        this.retrievalRepo.createEvidence(tx, {
          retrievalSessionId: sessionId,
          vectorChunkId: citation.vectorChunkId,
          citationNumber,
          quotedTextRedacted: citation.quotedTextRedacted,
          sourceUri: citation.sourceUri,
          sourceVersionId: document?.sourceVersionId,
          evidenceHash: createHash('sha256')
            .update(citation.vectorChunkId)
            .update(citation.quotedTextRedacted)
            .digest('hex'),
        });
      }

      session.status = 'completed';
      session.completedAt = new Date();

      await this.outbox.publishDomainEvent(tx, {
        tenantId: session.tenantId,
        eventType: 'RetrievalEvidenceMaterialized',
        aggregateType: 'vector_rag.retrieval_sessions',
        aggregateId: sessionId,
        payloadJson: { citations: citationNumber },
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'vector.retrieval.evidence',
          sessionId,
          citations: citationNumber,
        },
        'Evidencia de retrieval materializada',
      );

      return {
        retrievalSessionId: sessionId,
        status: session.status,
        citations: citationNumber,
      };
    });
  }

  /**
   * UC-59-09: capturar el feedback.
   *
   * Un `safety_issue_code` marca la sesión como `flagged` y publica un evento
   * aparte. Un problema de relevancia se agrega en una métrica de calidad; uno de
   * seguridad tiene que llegar a alguien.
   */
  async captureFeedback(
    sessionId: string,
    dto: CaptureFeedbackDto,
    actor: AuthenticatedUser,
  ): Promise<FeedbackResponseDto> {
    return this.em.transactional(async (tx) => {
      const session = await this.retrievalRepo.findSessionForUpdate(
        tx,
        sessionId,
      );
      if (!session) {
        throw new ResourceNotFoundException(
          'Sesión de retrieval no encontrada.',
          { sessionId },
        );
      }
      if (session.status !== 'completed' && session.status !== 'flagged') {
        throw new PreconditionFailedException(
          'Sólo se puede dar feedback de una sesión completada.',
          { sessionId, status: session.status },
        );
      }

      const feedback = this.retrievalRepo.createFeedback(tx, {
        retrievalSessionId: sessionId,
        principalId: actor.id,
        feedbackType: dto.feedbackType,
        relevanceScore: dto.relevanceScore,
        safetyIssueCode: dto.safetyIssueCode,
        commentRedacted: dto.commentRedacted,
      });

      const flagged = Boolean(dto.safetyIssueCode);
      if (flagged) {
        session.status = 'flagged';
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: session.tenantId,
        eventType: 'RetrievalFeedbackCaptured',
        aggregateType: 'vector_rag.retrieval_feedback_events',
        aggregateId: feedback.id,
        payloadJson: {
          retrievalSessionId: sessionId,
          feedbackType: dto.feedbackType,
          relevanceScore: dto.relevanceScore ?? null,
        },
        actorUserId: actor.id,
      });

      if (flagged) {
        await this.outbox.publishDomainEvent(tx, {
          tenantId: session.tenantId,
          eventType: 'RetrievalSafetyIssueRaised',
          aggregateType: 'vector_rag.retrieval_sessions',
          aggregateId: sessionId,
          payloadJson: { safetyIssueCode: dto.safetyIssueCode },
          actorUserId: actor.id,
        });

        this.logger.warn(
          {
            operation: 'vector.retrieval.safety-issue',
            sessionId,
            safetyIssueCode: dto.safetyIssueCode,
          },
          'Problema de seguridad reportado en una sesión de retrieval',
        );
      }

      return { id: feedback.id, retrievalSessionId: sessionId, flagged };
    });
  }

  // --- Piezas compartidas -------------------------------------------------

  /**
   * Ejecuta la operación require published policy.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param accessPolicyId - Identificador de access policy.
   * @returns Resultado de require published policy conforme al contrato `Promise<RagAccessPolicies>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private async requirePublishedPolicy(
    tx: EntityManager,
    accessPolicyId: string | undefined,
  ): Promise<RagAccessPolicies> {
    if (!accessPolicyId) {
      throw new PreconditionFailedException(
        'La colección no tiene política de acceso RAG; no se puede consultar.',
      );
    }
    const policy = await this.catalogRepo.findPolicyById(tx, accessPolicyId);
    if (!policy) {
      throw new ResourceNotFoundException(
        'Política de acceso RAG no encontrada.',
        {
          accessPolicyId,
        },
      );
    }
    if (policy.state !== 'published') {
      throw new PreconditionFailedException(
        'La política de acceso RAG no está publicada.',
        { accessPolicyId, state: policy.state },
      );
    }
    return policy;
  }

  /**
   * Decide si el candidato se puede mostrar, distinguiendo el motivo.
   *
   * El orden no es arbitrario: primero el ámbito de paciente —el fallo más
   * grosero, mostrar el expediente de otra persona—, después el consentimiento y
   * por último las etiquetas de seguridad, que es el filtro más fino.
   */
  private decide(
    document: VectorDocuments,
    policy: RagAccessPolicies,
    session: {
      /**
       * Identificador asociado a patient profile.
       */
      patientProfileId?: string; /**
       * Identificador asociado a consent directive.
       */
      consentDirectiveId?: string;
    },
  ): AuthorizationDecision {
    if (policy.patientScopeRequired) {
      if (!document.patientProfileId) return 'deny_scope';
      if (document.patientProfileId !== session.patientProfileId)
        return 'deny_scope';
    }

    if (
      document.containsPhi &&
      policy.consentRequired &&
      !session.consentDirectiveId
    ) {
      return 'deny_consent';
    }

    const labels = document.securityLabels ?? [];
    if (labels.some((label) => !policy.allowedSecurityLabels.includes(label))) {
      return 'deny_label';
    }

    return 'allow';
  }
}
