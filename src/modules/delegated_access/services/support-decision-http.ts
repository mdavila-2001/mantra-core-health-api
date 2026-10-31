import { ForbiddenException, HttpStatus } from '@nestjs/common';
import {
  ConflictException,
  DomainException,
  ErrorCode,
  PreconditionFailedException,
} from '../../../common';
import type { SupportAccessDecision } from '../domain';

/**
 * Motivos que SÍ pueden salir en `details.reason` de un 403: son de la propia
 * persona o de su organización y no revelan nada de otras personas, de otros
 * doctores ni de los pacientes (`PATIENT_*` y `EXPLICIT_DENY` quedan fuera a
 * propósito). El resto se ve solo en «explicar».
 */
export const DISCLOSABLE_DENY_REASONS: ReadonlySet<string> = new Set([
  'TIME_WINDOW',
  'LIMIT_EXCEEDED',
  'APPOINTMENT_WINDOW',
  'LEAD_TIME',
  'HORIZON',
  'CHANNEL_NOT_ALLOWED',
  'NETWORK_NOT_ALLOWED',
  'DEVICE_NOT_TRUSTED',
  'SESSION_TOO_LONG',
  'DOCTOR_OFFLINE',
  'AMOUNT_LIMIT',
  'ORG_RULE_DENY',
  'ONBOARDING_INCOMPLETE',
  'NOT_DELEGABLE',
  'STEP_UP_UNAVAILABLE',
  'DECISION_LOG_UNAVAILABLE',
]);

/**
 * Traduce la decisión de la política a la excepción HTTP de un PEP
 * (CONTRATO-GOBIERNO §8.4), para los PEP de `delegated_access`, `community` y
 * búsqueda de pacientes: `CHALLENGE(REASON)` ⇒ 422 `REASON_REQUIRED`;
 * `CHALLENGE(STEP_UP)` ⇒ 403 `STEP_UP_REQUIRED` con `{ maxAgeMinutes, enrolled }`;
 * `CHALLENGE(APPROVAL)` ⇒ 403 `APPROVAL_REQUIRED` con `{ approverKind, atom }` (o
 * 409 `FOUR_EYES_PAYLOAD_CHANGED` si la aprobación era de otra acción);
 * `DENY` ⇒ 403 con `deniedMessage` (el mensaje de cada PEP, que no cambia) y
 * `details.reason` solo si es de la persona u organización.
 *
 * @param decision - Veredicto de la política.
 * @param deniedMessage - Mensaje del 403 de este PEP.
 * @returns La excepción a lanzar; `undefined` si se permite.
 */
export function supportDecisionToException(
  decision: Pick<
    SupportAccessDecision,
    'allowed' | 'reason' | 'effect' | 'challenge'
  >,
  deniedMessage: string,
): Error | undefined {
  if (decision.allowed) return undefined;
  const challenge = decision.challenge;
  if (decision.effect === 'CHALLENGE' && challenge) {
    const details = challenge.details;
    if (challenge.kind === 'REASON') {
      return new PreconditionFailedException(
        'Indique el motivo: este permiso lo exige.',
        { failureCode: 'REASON_REQUIRED', ...pick(details, ['minLength']) },
        'REASON_REQUIRED',
      );
    }
    if (challenge.kind === 'STEP_UP' || challenge.kind === 'STEP_UP_ENROLL') {
      return new DomainException(
        HttpStatus.FORBIDDEN,
        ErrorCode.FORBIDDEN,
        'Confirme su identidad con el segundo paso para continuar.',
        pick(details, ['maxAgeMinutes', 'enrolled']),
        'STEP_UP_REQUIRED',
      );
    }
    if (details.approvalProblem === 'FOUR_EYES_PAYLOAD_CHANGED') {
      return new ConflictException(
        'La aprobación que presentó es de otra acción: pida una nueva.',
        undefined,
        'FOUR_EYES_PAYLOAD_CHANGED',
      );
    }
    return new DomainException(
      HttpStatus.FORBIDDEN,
      ErrorCode.FORBIDDEN,
      'Esta acción necesita la aprobación de otra persona.',
      pick(details, ['approverKind', 'atom', 'ttlMinutes', 'approvalProblem']),
      'APPROVAL_REQUIRED',
    );
  }
  return new ForbiddenException({
    code: ErrorCode.FORBIDDEN,
    message: deniedMessage,
    ...(DISCLOSABLE_DENY_REASONS.has(decision.reason)
      ? { details: { reason: decision.reason } }
      : {}),
  });
}

/** Solo las claves indicadas: los desafíos no arrastran nada más al cliente. */
function pick(
  source: Readonly<Record<string, unknown>>,
  keys: readonly string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out;
}
