import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { IdentityVerificationCases } from '../entities';
import { createdBy } from '../../../common';

/** Apertura de un caso de verificación (UC-27-02). */
export interface CreateCaseData {
  /**
   * Identificador asociado a subject type concept.
   */
  subjectTypeConceptId: string;
  /**
   * Identificador asociado a subject entity.
   */
  subjectEntityId: string;
  /**
   * Identificador asociado a identity verification policy.
   */
  identityVerificationPolicyId: string;
  /**
   * Identificador asociado a requested assurance level concept.
   */
  requestedAssuranceLevelConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de risk score mantenido por la instancia.
   */
  riskScore?: string;
  /**
   * Valor de opened at mantenido por la instancia.
   */
  openedAt: Date;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
  /**
   * Identificador asociado a correlation.
   */
  correlationId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `identity_assurance.identity_verification_cases`. */
@Injectable()
export class IdentityVerificationCasesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<IdentityVerificationCases | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<IdentityVerificationCases | null> {
    return em.findOne(IdentityVerificationCases, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `IdentityVerificationCases`.
   */
  create(em: EntityManager, data: CreateCaseData): IdentityVerificationCases {
    return em.create(
      IdentityVerificationCases,
      {
        subjectTypeConceptId: data.subjectTypeConceptId,
        subjectEntityId: data.subjectEntityId,
        identityVerificationPolicyId: data.identityVerificationPolicyId,
        requestedAssuranceLevelConceptId: data.requestedAssuranceLevelConceptId,
        statusConceptId: data.statusConceptId,
        riskScore: data.riskScore,
        openedAt: data.openedAt,
        expiresAt: data.expiresAt,
        correlationId: data.correlationId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Cuántas verificaciones sigue habiendo en marcha para un sujeto.
   *
   * Evita que reenviar el formulario abra un segundo caso del mismo sujeto, que
   * dejaría dos verdades compitiendo sobre la misma identidad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param subjectTypeConceptId - Qué clase de sujeto.
   * @param subjectEntityId - Qué sujeto concreto.
   * @param liveStatuses - Estados que cuentan como "en marcha".
   * @returns Cuántos casos vivos hay.
   */
  countLiveForSubject(
    em: EntityManager,
    subjectTypeConceptId: string,
    subjectEntityId: string,
    liveStatuses: string[],
  ): Promise<number> {
    return em.count(IdentityVerificationCases, {
      subjectTypeConceptId,
      subjectEntityId,
      statusConceptId: { $in: liveStatuses },
    });
  }

  /** Casos vencidos (expires_at < now) aún no completados (UC-27-12). */
  findExpirable(
    em: EntityManager,
    openStatuses: string[],
    now: Date,
    limit = 100,
  ): Promise<IdentityVerificationCases[]> {
    return em.find(
      IdentityVerificationCases,
      { statusConceptId: { $in: openStatuses }, expiresAt: { $lt: now } },
      { limit },
    );
  }
}
