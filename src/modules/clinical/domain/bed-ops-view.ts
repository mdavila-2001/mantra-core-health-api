import type { CareSpaceOperationalState } from '../../practice/services/care-space-ops.port';

/**
 * Lo que la internación (F3) lee del estado operativo de una cama y lo que
 * devuelve como `cell` en la respuesta HTTP: cada eje con su `code`.
 *
 * El puerto de `practice` entrega el estado plano ({@link CareSpaceOperationalState});
 * esta vista lo ordena por ejes, que es la forma que las reglas de compatibilidad
 * y el contrato HTTP de ADT usan. El organismo del aislamiento (dato clínico) no
 * pasa a la vista.
 */
export interface BedOpsView {
  /** Id de la cama. */
  readonly careSpaceId: string;
  /** Ciclo de vida: `SPACE_ACTIVE` o `SPACE_NOT_ACTIVE`. */
  readonly lifecycle: { readonly code: string };
  /** Disponibilidad: `SPACE_OP_AVAILABLE` o una de bloqueo/mantenimiento/cierre. */
  readonly availability: { readonly code: string };
  /** Higiene: `HYG_CLEAN`, `HYG_DIRTY`, `HYG_CLEANING`, `HYG_INSPECTED`, `HYG_CONTAMINATED`. */
  readonly hygiene: {
    readonly code: string;
    readonly terminalRequired: boolean;
  };
  /** Aislamiento vigente de la cama: `ISO_NONE`… */
  readonly isolation: { readonly code: string };
  /** Ocupación derivada: `OCC_FREE`, `OCC_RESERVED` u `OCC_OCCUPIED`. */
  readonly occupancy: { readonly code: string };
  /** Resumen HL7 v2-0116 (`U`, `O`, `H`, `C`, `I`, `K`, `R`). */
  readonly v2Code: string;
  /** Cumple todo lo de «Asignable» de F2.2. */
  readonly assignable: boolean;
}

/**
 * Ordena por ejes el estado plano que da el puerto de operación de espacios.
 *
 * @param state - Estado operativo de la cama.
 */
export function toBedOpsView(state: CareSpaceOperationalState): BedOpsView {
  return {
    careSpaceId: state.careSpaceId,
    lifecycle: {
      code: state.lifecycleActive ? 'SPACE_ACTIVE' : 'SPACE_NOT_ACTIVE',
    },
    availability: { code: state.availability },
    hygiene: {
      code: state.hygiene,
      terminalRequired: state.terminalCleaningRequired,
    },
    isolation: { code: state.isolation },
    occupancy: { code: state.occupancy },
    v2Code: state.v2Code,
    assignable: state.assignable,
  };
}
