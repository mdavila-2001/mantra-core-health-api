import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ModerationEvents, ModerationDecisionsHistory } from '../entities';

/** Evento de moderación / gobernanza (WORM, UC-10-11). */
export interface RecordModerationData {
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId: string;
  /**
   * Identificador asociado a target.
   */
  targetId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a reason concept.
   */
  reasonConceptId?: string;
  /**
   * Valor de policy version mantenido por la instancia.
   */
  policyVersion?: string;
  /**
   * Valor de evidence json mantenido por la instancia.
   */
  evidenceJson?: unknown;
  /**
   * Identificador asociado a recorded by user.
   */
  recordedByUserId?: string;
}

/** Versión (snapshot) de una decisión de moderación (append-only, UC-10-11). */
export interface RecordModerationHistoryData {
  /**
   * Identificador asociado a moderation decisions.
   */
  moderationDecisionsId: string;
  /**
   * Identificador asociado a operation concept.
   */
  operationConceptId: string;
  /**
   * Valor de data snapshot mantenido por la instancia.
   */
  dataSnapshot: unknown;
  /**
   * Identificador asociado a changed by user.
   */
  changedByUserId?: string;
  /**
   * Identificador asociado a change reason concept.
   */
  changeReasonConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
}

/**
 * Acceso a `audit.moderation_events` (WORM append-only) y
 * `audit.moderation_decisions_history` (versionado append-only). Stateless.
 */
@Injectable()
export class ModerationRepository {
  /** Encola un evento de moderación inmutable; sin flush. */
  record(em: EntityManager, data: RecordModerationData): ModerationEvents {
    return em.create(
      ModerationEvents,
      {
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        actionConceptId: data.actionConceptId,
        reasonConceptId: data.reasonConceptId,
        policyVersion: data.policyVersion,
        evidenceJson: data.evidenceJson,
        recordedAt: new Date(),
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }

  /**
   * Encola una fila de versión de la decisión (nunca edita la anterior). Requiere un
   * `moderationDecisionsId` REAL (FK NOT NULL → community.moderation_decisions); por
   * eso el servicio solo la escribe cuando el cliente aporta ese id.
   */
  recordHistory(
    em: EntityManager,
    data: RecordModerationHistoryData,
  ): ModerationDecisionsHistory {
    return em.create(
      ModerationDecisionsHistory,
      {
        moderationDecisionsId: data.moderationDecisionsId,
        operationConceptId: data.operationConceptId,
        validFrom: data.validFrom ?? new Date(),
        validTo: data.validTo,
        dataSnapshot: data.dataSnapshot,
        changedByUserId: data.changedByUserId,
        changeReasonConceptId: data.changeReasonConceptId,
        recordedAt: new Date(),
      },
      { partial: true },
    );
  }
}
