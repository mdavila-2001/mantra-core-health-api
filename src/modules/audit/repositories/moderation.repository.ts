import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ModerationEvents, ModerationDecisionsHistory } from '../entities';

/** Evento de moderación / gobernanza (WORM, UC-10-11). */
export interface RecordModerationData {
  targetTypeConceptId: string;
  targetId: string;
  actionConceptId: string;
  reasonConceptId?: string;
  policyVersion?: string;
  evidenceJson?: unknown;
  recordedByUserId?: string;
}

/** Versión (snapshot) de una decisión de moderación (append-only, UC-10-11). */
export interface RecordModerationHistoryData {
  moderationDecisionsId: string;
  operationConceptId: string;
  dataSnapshot: unknown;
  changedByUserId?: string;
  changeReasonConceptId?: string;
  validFrom?: Date;
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
