/** Estados de ciclo de vida de una cuenta, tal como los muestra la consola. */
export const USER_LIFECYCLE_STATES = [
  'ACTIVE',
  'SUSPENDED',
  'DEACTIVATED',
  'ANONYMIZED',
] as const;
/** Estado de ciclo de vida de una cuenta. */
export type UserLifecycleState = (typeof USER_LIFECYCLE_STATES)[number];

/** Acciones de ciclo de vida que quedan en la historia de la cuenta. */
export const USER_LIFECYCLE_ACTIONS = [
  'SUSPEND',
  'REACTIVATE',
  'DEACTIVATE',
] as const;
/** Acción de ciclo de vida. */
export type UserLifecycleAction = (typeof USER_LIFECYCLE_ACTIONS)[number];

/**
 * Máquina de estados del ciclo de vida. Cada acción dice desde qué estados se puede aplicar y en
 * cuál deja la cuenta. Aplicarla sobre la cuenta que ya está en `to` no escribe nada.
 *
 * - `ANONYMIZED` es terminal: ninguna acción sale de ahí.
 * - `DEACTIVATED` (baja) no se reactiva: la baja revoca credenciales y roles, y volver atrás es un
 *   alta nueva, no un clic.
 */
export const USER_LIFECYCLE_RULES: Readonly<
  Record<
    UserLifecycleAction,
    {
      readonly from: readonly UserLifecycleState[];
      readonly to: UserLifecycleState;
    }
  >
> = {
  SUSPEND: { from: ['ACTIVE'], to: 'SUSPENDED' },
  REACTIVATE: { from: ['SUSPENDED'], to: 'ACTIVE' },
  DEACTIVATE: { from: ['ACTIVE', 'SUSPENDED'], to: 'DEACTIVATED' },
};
