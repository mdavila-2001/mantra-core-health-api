import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import type { OmsPhase } from '../domain/oms-checklist';
import { ProceduresPerioperativeErrorReason as Reason } from '../procedures_perioperative.error-reasons';
import { PeriopPreopRepository } from '../repositories';

/** `reason` que se responde cuando falta cada fase (INV-39). */
const REASON_BY_PHASE: Readonly<Record<OmsPhase, Reason>> = {
  SIGN_IN: Reason.CHECKLIST_SIGN_IN_REQUIRED,
  TIME_OUT: Reason.CHECKLIST_TIME_OUT_REQUIRED,
  SIGN_OUT: Reason.CHECKLIST_SIGN_OUT_REQUIRED,
};

/**
 * Compuerta del check-list de cirugía segura de la OMS (INV-39, CONTRATO-F2-F5 §F4.3):
 *
 * | Momento | Exige |
 * |---|---|
 * | inducción (`anesthesia-events`) y `room-events ANESTHESIA_START` | Entrada |
 * | `room-events INCISION` | Pausa |
 * | `room-events PATIENT_OUT_OF_ROOM`, `signReport`, `charge-items/post` | Salida |
 *
 * Un caso sin check-list tampoco pasa: la fase «no está completa». La compuerta lee la fecha
 * de la fase completada en el check-list del caso; la base además impide que una fase se
 * complete sin la anterior (`ck_surgical_safety_checklists_phase_order`).
 */
@Injectable()
export class PeriopChecklistGateService {
  /** @param preopRepo - Check-lists del caso. */
  constructor(private readonly preopRepo: PeriopPreopRepository) {}

  /**
   * Exige que la fase esté completa.
   *
   * @param tx - Transacción activa.
   * @param caseId - Caso (ya validado en el tenant por quien llama).
   * @param phase - Fase exigida.
   * @throws PreconditionFailedException (422) con el `reason` de la fase.
   */
  async assertPhase(
    tx: EntityManager,
    caseId: string,
    phase: OmsPhase,
  ): Promise<void> {
    const checklist = await this.preopRepo.findChecklistByCase(tx, caseId);
    const completedAt =
      phase === 'SIGN_IN'
        ? checklist?.signInCompletedAt
        : phase === 'TIME_OUT'
          ? checklist?.timeOutCompletedAt
          : checklist?.signOutCompletedAt;
    if (!completedAt) {
      throw new PreconditionFailedException(
        'Falta completar una fase del check-list de cirugía segura',
        { caseId, phase, hasChecklist: !!checklist },
        REASON_BY_PHASE[phase],
      );
    }
  }
}
