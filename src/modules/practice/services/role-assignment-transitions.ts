import { PRAC } from '../practice.concepts';

/**
 * Transiciones que ejerce la **organización** sobre una vinculación (Carril 18).
 *
 * No incluye `INVITED`: una invitación la resuelve el profesional, y que la
 * organización pudiera activarla equivaldría a figurar en un centro sin que el
 * profesional lo haya aceptado.
 */
export const PRACTICE_ASSIGNMENT_TRANSITIONS: Record<
  string,
  readonly string[]
> = {
  [PRAC.ROLE_ASSIGNMENT_PENDING]: [
    PRAC.ROLE_ASSIGNMENT_ACTIVE,
    PRAC.ROLE_ASSIGNMENT_REJECTED,
  ],
  [PRAC.ROLE_ASSIGNMENT_ACTIVE]: [
    PRAC.ROLE_ASSIGNMENT_SUSPENDED,
    PRAC.ROLE_ASSIGNMENT_ENDED,
  ],
  [PRAC.ROLE_ASSIGNMENT_SUSPENDED]: [
    PRAC.ROLE_ASSIGNMENT_ACTIVE,
    PRAC.ROLE_ASSIGNMENT_ENDED,
  ],
  [PRAC.ROLE_ASSIGNMENT_REJECTED]: [],
  [PRAC.ROLE_ASSIGNMENT_ENDED]: [],
};

/**
 * Transiciones que ejerce el **profesional** sobre una vinculación: solo
 * resuelve la invitación que le hizo la organización. Una solicitud propia
 * (`PENDING`) no la puede aprobar él mismo.
 */
export const PRACTITIONER_ASSIGNMENT_TRANSITIONS: Record<
  string,
  readonly string[]
> = {
  [PRAC.ROLE_ASSIGNMENT_INVITED]: [
    PRAC.ROLE_ASSIGNMENT_ACTIVE,
    PRAC.ROLE_ASSIGNMENT_REJECTED,
  ],
};
