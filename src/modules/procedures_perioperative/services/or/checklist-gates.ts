import { PreconditionFailedException } from '../../../../common';
import { CONCEPTS } from '../../../../common/constants/concepts';
import type { SurgicalSafetyChecklists } from '../../entities';
import { ProceduresPerioperativeErrorReason } from '../../procedures_perioperative.error-reasons';

/** Fase OMS 2009 que exige cada momento (§F4.3 «Check-list OMS bloqueante»). */
export type ChecklistGate = 'SIGN_IN' | 'TIME_OUT' | 'SIGN_OUT';

const REASON: Record<ChecklistGate, ProceduresPerioperativeErrorReason> = {
  SIGN_IN: ProceduresPerioperativeErrorReason.CHECKLIST_SIGN_IN_REQUIRED,
  TIME_OUT: ProceduresPerioperativeErrorReason.CHECKLIST_TIME_OUT_REQUIRED,
  SIGN_OUT: ProceduresPerioperativeErrorReason.CHECKLIST_SIGN_OUT_REQUIRED,
};

const MESSAGE: Record<ChecklistGate, string> = {
  SIGN_IN: 'Falta completar la Entrada (Sign In) del check-list OMS',
  TIME_OUT: 'Falta completar la Pausa (Time Out) del check-list OMS',
  SIGN_OUT: 'Falta completar la Salida (Sign Out) del check-list OMS',
};

/** Lo que el gate necesita leer. */
export interface ChecklistReader {
  findSafetyChecklistByCase(
    em: unknown,
    procedureCaseId: string,
    checklistTypeConceptId: string,
  ): Promise<SurgicalSafetyChecklists | null>;
}

/**
 * Exige la fase del check-list OMS del caso (422 con el reason del contrato).
 * Sin check-list creado, ninguna fase está completa.
 *
 * @param reader - Repositorio de casos.
 * @param em - Transacción.
 * @param caseId - Caso.
 * @param gate - Fase exigida.
 */
export async function assertChecklistPhase(
  reader: ChecklistReader,
  em: unknown,
  caseId: string,
  gate: ChecklistGate,
): Promise<void> {
  const checklist = await reader.findSafetyChecklistByCase(
    em,
    caseId,
    CONCEPTS.CHECKLIST_WHO,
  );
  const done =
    gate === 'SIGN_IN'
      ? checklist?.signInCompletedAt
      : gate === 'TIME_OUT'
        ? checklist?.timeOutCompletedAt
        : checklist?.signOutCompletedAt;
  if (!done) {
    throw new PreconditionFailedException(
      MESSAGE[gate],
      { caseId, phase: gate },
      REASON[gate],
    );
  }
}
