import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../common';

/**
 * Exige que la sesión tenga perfil de paciente.
 *
 * Es lo que impide que un profesional o un administrador entren por la puerta
 * del autoservicio: sin perfil de paciente no hay invitaciones que mirar, y el
 * identificador no se acepta por parámetro justamente para que nadie pida las
 * de otro. 403 y no 422: no es una precondición que el cliente pueda cumplir
 * mandando otra cosa — es que esta sesión no es la de un paciente (mismo
 * criterio que `community-reviews.service.ts` para calificar).
 *
 * @returns El perfil de paciente de la sesión.
 */
export function requirePatientProfile(actor: AuthenticatedUser): string {
  if (!actor.patientProfileId) {
    throw new ForbiddenException(
      'Solo un paciente puede ver sus cuestionarios',
    );
  }
  return actor.patientProfileId;
}

/**
 * Una cuenta con rol de paciente cuyo token todavía no trae perfil (`pid`): no
 * tiene cuestionarios, y su bandeja es una lista vacía, no un 403 que la barra
 * superior lea como fallo. Sin rol de paciente sigue siendo 403.
 */
export function isPatientWithoutProfile(actor: AuthenticatedUser): boolean {
  return !actor.patientProfileId && actor.roles?.includes('PATIENT') === true;
}
