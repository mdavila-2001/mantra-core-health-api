/**
 * Bloqueos de retiro (contrato §3, `SPACE_RETIRE_BLOCKED`) y de unidad
 * (`UNIT_RETIRE_BLOCKED`). Cada bloqueo trae la **próxima acción** (estado S3
 * del frontend: el usuario tiene que saber qué hacer, no sólo que no puede).
 */

/** Tipos de bloqueo del espacio (contrato §3) y de la unidad. */
export type BlockerKind =
  | 'ACTIVE_CHILDREN'
  | 'ACTIVE_ENCOUNTER'
  | 'FUTURE_PROCEDURE'
  | 'FUTURE_BOOKING'
  | 'SCHEDULABLE_RESOURCE'
  | 'INVENTORY_LOCATION'
  | 'EQUIPMENT'
  | 'ACTIVE_CHILD_UNITS'
  | 'ACTIVE_SPACES'
  | 'ACTIVE_STAFF';

/** Un bloqueo con su recuento y ejemplos. */
export interface Blocker {
  readonly kind: BlockerKind;
  readonly count: number;
  readonly sampleIds: string[];
  readonly nextAction: NextAction;
}

/**
 * Próxima acción (S3): texto para la persona y, si la web tiene dónde
 * resolverlo, una ruta relativa a la ficha del espacio (forma de «Desvíos»
 * WEB-F1 punto 2).
 */
export interface NextAction {
  readonly label: string;
  readonly route?: string;
}

/** Un tipo que en F1 no se puede comprobar (sin FK al espacio todavía). */
export interface UnverifiableCheck {
  readonly kind: BlockerKind;
  readonly why: string;
}

/** Próxima acción por tipo de bloqueo. */
export const NEXT_ACTION: Readonly<Record<BlockerKind, NextAction>> = {
  ACTIVE_CHILDREN: {
    label:
      'Retirar o mover primero los espacios hijos que siguen activos, planificados o suspendidos.',
    route: '?tab=children',
  },
  ACTIVE_ENCOUNTER: {
    label: 'Dar de alta o trasladar a los pacientes que ocupan el espacio.',
  },
  FUTURE_PROCEDURE: {
    label:
      'Reprogramar en otro quirófano o cancelar las intervenciones futuras.',
  },
  FUTURE_BOOKING: {
    label: 'Reprogramar o cancelar las reservas futuras del espacio.',
  },
  SCHEDULABLE_RESOURCE: {
    label:
      'Dar de baja el recurso de agenda o el horario que usa este espacio.',
  },
  INVENTORY_LOCATION: {
    label: 'Transferir el stock o reubicar el depósito',
    route: '?tab=stock',
  },
  EQUIPMENT: {
    label: 'Reubicar los equipos que están instalados en el espacio.',
  },
  ACTIVE_CHILD_UNITS: {
    label: 'Retirar o reasignar primero las unidades hijas activas.',
  },
  ACTIVE_SPACES: {
    label:
      'Desvincular o reasignar a otra unidad los espacios que siguen activos.',
  },
  ACTIVE_STAFF: {
    label: 'Finalizar o reasignar las vinculaciones del personal de la unidad.',
  },
};

/**
 * Bloqueos del espacio que todavía no se verifican. `INVENTORY_LOCATION` se
 * verifica desde F5c; `EQUIPMENT` queda para F5f. Se informan como no
 * verificables, nunca como cero.
 */
export const UNVERIFIABLE_SPACE_CHECKS: readonly UnverifiableCheck[] = [
  {
    kind: 'EQUIPMENT',
    why: 'diagnostic_units.diagnostic_equipment no tiene care_space_id (F5)',
  },
];

/** Cuántos ids de ejemplo devuelve cada bloqueo. */
export const BLOCKER_SAMPLE_SIZE = 5;

/**
 * Arma un bloqueo, o `null` si el recuento es cero.
 *
 * @param kind - Tipo.
 * @param ids - Ids que bloquean (se recortan a la muestra).
 * @param count - Recuento total, si es distinto de `ids.length`.
 */
export function blocker(
  kind: BlockerKind,
  ids: readonly string[],
  count = ids.length,
): Blocker | null {
  if (count === 0) return null;
  return {
    kind,
    count,
    sampleIds: ids.slice(0, BLOCKER_SAMPLE_SIZE),
    nextAction: NEXT_ACTION[kind],
  };
}
