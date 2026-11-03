import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del gobierno de acceso (ciclo de vida del usuario interno y revisión de accesos).
 * Son los tipos de evento de `iam.security_events` con que se deja el rastro de cada transición:
 * ahí viven el motivo, el actor y el instante, y de ahí se lee el historial.
 *
 * Quien integre este archivo debe añadir `AUTHZ_GOVERNANCE_CONCEPT_SEEDS` al agregador
 * `common/seed/module-concepts.ts`; sin esa línea los conceptos no existen en la base y el insert
 * del evento viola su FK.
 */
export const { seeds: AUTHZ_GOVERNANCE_CONCEPT_SEEDS, ids: AUTHZ_GOVERNANCE } =
  defineModuleConcepts('authz-governance', {
    EVENT_USER_SUSPENDED: {
      code: 'USER_SUSPENDED',
      display: 'User suspended by an administrator',
    },
    EVENT_USER_REACTIVATED: {
      code: 'USER_REACTIVATED',
      display: 'User reactivated by an administrator',
    },
    EVENT_USER_OFFBOARDED: {
      code: 'USER_OFFBOARDED',
      display: 'User offboarded by an administrator',
    },
    EVENT_ACCESS_REVIEWED: {
      code: 'ACCESS_REVIEWED',
      display: 'Periodic access review recorded',
    },
  });

/** Los eventos que cuentan en el historial del ciclo de vida. */
export const LIFECYCLE_EVENT_CONCEPTS = [
  AUTHZ_GOVERNANCE.EVENT_USER_SUSPENDED,
  AUTHZ_GOVERNANCE.EVENT_USER_REACTIVATED,
  AUTHZ_GOVERNANCE.EVENT_USER_OFFBOARDED,
] as const;
