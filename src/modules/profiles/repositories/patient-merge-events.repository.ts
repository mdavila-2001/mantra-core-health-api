import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PatientMergeEvents } from '../entities';

/**
 * Datos de un evento de fusión IMMUTABLE. La tabla no lleva campos de auditoría
 * estándar (`created_at`/`row_version`): solo `recorded_at` + `recorded_by`, más
 * `approved_by`. No se actualiza nunca; la reversión es un nuevo evento.
 */
export interface CreateMergeEventData {
  survivingPatientProfileId: string;
  mergedPatientProfileId: string;
  reasonConceptId: string;
  decisionStatusConceptId: string;
  approvedByUserId?: string;
  reversalOfEventId?: string;
  recordedAt: Date;
  recordedByUserId?: string;
}

/** Acceso a datos de `profiles.patient_merge_events` (append-only). */
@Injectable()
export class PatientMergeEventsRepository {
  findById(em: EntityManager, id: string): Promise<PatientMergeEvents | null> {
    return em.findOne(PatientMergeEvents, { id });
  }

  /** Evento de reversión que ya apunte a un evento dado (impide revertir dos veces). */
  findByReversalOf(em: EntityManager, eventId: string): Promise<PatientMergeEvents | null> {
    return em.findOne(PatientMergeEvents, { reversalOfEventId: eventId });
  }

  create(em: EntityManager, data: CreateMergeEventData): PatientMergeEvents {
    return em.create(
      PatientMergeEvents,
      {
        survivingPatientProfileId: data.survivingPatientProfileId,
        mergedPatientProfileId: data.mergedPatientProfileId,
        reasonConceptId: data.reasonConceptId,
        decisionStatusConceptId: data.decisionStatusConceptId,
        approvedByUserId: data.approvedByUserId,
        reversalOfEventId: data.reversalOfEventId,
        recordedAt: data.recordedAt,
        recordedByUserId: data.recordedByUserId,
      },
      { partial: true },
    );
  }
}
