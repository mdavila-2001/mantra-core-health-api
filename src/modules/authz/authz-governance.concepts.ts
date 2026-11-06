import { defineModuleConcepts } from '../../common/seed/concept-seed';

/**
 * Conceptos del gobierno de acceso que esta API escribe como tipo de evento de
 * `iam.security_events`: ahí viven el motivo, el actor y el instante de cada acción que no tiene
 * columna propia donde dejarlos.
 *
 * Sólo se declara lo que el código usa. Se retiraron `USER_SUSPENDED`, `USER_REACTIVATED`,
 * `USER_OFFBOARDED` y `ACCESS_REVIEWED` (2026-11-01): ningún código los escribía ni los leía (el
 * ciclo de vida y la revisión de accesos de `dev` sellan en `audit.audit_log` con acciones de
 * texto, no con estos conceptos). Retirar la semilla no borra filas ya sembradas.
 *
 * El agregador `common/seed/module-concepts.ts` incluye `AUTHZ_GOVERNANCE_CONCEPT_SEEDS`; sin esa
 * línea el concepto no existe en la base y el insert del evento viola su FK.
 */
export const { seeds: AUTHZ_GOVERNANCE_CONCEPT_SEEDS, ids: AUTHZ_GOVERNANCE } =
  defineModuleConcepts('authz-governance', {
    EVENT_RESOURCE_SCOPE_GRANT_ENDED: {
      code: 'RESOURCE_SCOPE_GRANT_ENDED',
      display: 'Resource scope grant ended by an administrator',
    },
  });
