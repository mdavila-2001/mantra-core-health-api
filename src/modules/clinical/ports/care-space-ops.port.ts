import { HttpStatus } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { DomainException, ErrorCode } from '../../../common';
import type { AuthenticatedUser } from '../../../common';
import { ClinicalErrorReason } from '../clinical.error-reasons';

/**
 * Puerto `CareSpaceOpsPort` (CONTRATO-F2-F5 §F2.3) tal como lo consume la
 * internación (F3).
 *
 * Es la forma que el contrato fija; la implementa la franja F2
 * (`practice/services/care-space-ops.service.ts`) y F3 se programa contra ella
 * sin esperarla. Las firmas son las del contrato; los tipos de los argumentos y
 * del estado sólo declaran lo que F3 **lee**, de modo que el objeto más rico de
 * F2 (`BedBoardCell`) es asignable a {@link CareSpaceOperationalState}.
 *
 * El proveedor de este token es, por omisión, {@link UnavailableCareSpaceOps}:
 * falla cerrado con 503. El integrador lo reemplaza por el servicio de F2; las
 * pruebas lo reemplazan por `test/doubles/care-space-ops.double.ts`.
 */
export const CARE_SPACE_OPS_PORT = 'CLINICAL_CARE_SPACE_OPS_PORT';

/** Ocupación derivada (`practice:OCC_*`). */
export type OccupancyCode = 'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED';

/** Foto de los ejes operativos de una cama (subconjunto de `BedBoardCell` que F3 lee). */
export interface CareSpaceOperationalState {
  /** Id de la cama. */
  readonly careSpaceId: string;
  /** Ciclo de vida: `SPACE_ACTIVE`, `SPACE_SUSPENDED`… */
  readonly lifecycle: { readonly code: string };
  /** Disponibilidad: `SPACE_OP_AVAILABLE` o una de bloqueo/mantenimiento/cierre. */
  readonly availability: { readonly code: string };
  /** Higiene: `HYG_CLEAN`, `HYG_DIRTY`, `HYG_CLEANING`, `HYG_INSPECTED`, `HYG_CONTAMINATED`. */
  readonly hygiene: {
    readonly code: string;
    readonly terminalRequired: boolean;
  };
  /** Aislamiento vigente de la cama: `ISO_NONE`… */
  readonly isolation: {
    readonly code: string;
    readonly organism?: string | null;
  };
  /** Ocupación derivada. */
  readonly occupancy: { readonly code: OccupancyCode };
  /** Resumen HL7 v2-0116 (`U`, `O`, `H`, `C`, `I`, `K`, `R`). */
  readonly v2Code: string;
  /** Cumple todo lo de «Asignable» de F2.2. */
  readonly assignable: boolean;
}

/** Quién y por qué: el contexto que acompaña cada llamada al puerto. */
export interface CareSpaceOpsContext {
  /** Quien ejecuta el movimiento. */
  readonly actor: AuthenticatedUser;
  /** Id de correlación de la petición. */
  readonly requestId?: string;
}

/** Disparador de la orden de limpieza (`CLN_TRG_*`, sin el prefijo). */
export type CleaningTrigger = 'DISCHARGE' | 'TRANSFER';

/** Argumentos de {@link CareSpaceOpsPort.markDirtyFromSource}. */
export interface MarkDirtyInput extends CareSpaceOpsContext {
  /** `CLN_TRG_DISCHARGE` o `CLN_TRG_TRANSFER`. */
  readonly trigger: CleaningTrigger;
  /** Ubicación de encuentro que dejó la cama. */
  readonly sourceRefId: string;
  /** Limpieza terminal (aislamiento, contaminación). */
  readonly terminal: boolean;
}

/** Argumentos de {@link CareSpaceOpsPort.recordOccupancyChange}. */
export interface OccupancyChangeInput extends CareSpaceOpsContext {
  /** Ocupación anterior. */
  readonly from: OccupancyCode;
  /** Ocupación nueva. */
  readonly to: OccupancyCode;
  /** Ubicación de encuentro que provocó el cambio. */
  readonly sourceRefId: string;
}

/** Contrato de F2.3 que F3 usa dentro de su transacción. */
export interface CareSpaceOpsPort {
  /**
   * Ejes de la cama, `assignable` y `v2Code`.
   *
   * @param tx - Transacción del llamador (con la fila de la cama ya bloqueada).
   * @param careSpaceId - Cama.
   */
  getOperationalState(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceOperationalState>;

  /**
   * Deja la cama sucia y crea (o escala) su orden de limpieza.
   *
   * @returns El id de la orden de limpieza abierta.
   */
  markDirtyFromSource(
    tx: EntityManager,
    careSpaceId: string,
    input: MarkDirtyInput,
  ): Promise<{ cleaningOrderId: string }>;

  /** Asienta el evento A20 del eje de ocupación. */
  recordOccupancyChange(
    tx: EntityManager,
    careSpaceId: string,
    input: OccupancyChangeInput,
  ): Promise<void>;

  /**
   * Revierte la suciedad que dejó un traslado que luego se cancela (A12).
   *
   * **No está en el contrato de F2.3**: F3 lo necesita para reabrir la cama
   * previa sin dejar una orden de limpieza sobre una cama ocupada. Es opcional
   * en el puerto; si F2 no lo ofrece, A12 responde 409
   * `PREVIOUS_BED_NO_LONGER_AVAILABLE` (falla cerrado).
   *
   * @returns `reverted: false` si la limpieza ya empezó y no se puede deshacer.
   */
  revertDirtyFromSource?(
    tx: EntityManager,
    careSpaceId: string,
    input: CareSpaceOpsContext & { readonly sourceRefId: string },
  ): Promise<{ reverted: boolean }>;
}

/**
 * Proveedor por omisión del puerto: ninguna franja de operación lo reemplazó.
 * Cada método responde 503 `CARE_SPACE_OPS_UNAVAILABLE` en lugar de simular un
 * estado de cama: una cama cuyo estado no se puede leer no se asigna.
 */
export class UnavailableCareSpaceOps implements CareSpaceOpsPort {
  getOperationalState(): Promise<CareSpaceOperationalState> {
    return Promise.reject(this.unavailable());
  }

  markDirtyFromSource(): Promise<{ cleaningOrderId: string }> {
    return Promise.reject(this.unavailable());
  }

  recordOccupancyChange(): Promise<void> {
    return Promise.reject(this.unavailable());
  }

  private unavailable(): DomainException {
    return new DomainException(
      HttpStatus.SERVICE_UNAVAILABLE,
      ErrorCode.DEPENDENCY_UNAVAILABLE,
      'La operación de camas no está disponible; no se puede asignar ni liberar una cama',
      undefined,
      ClinicalErrorReason.CARE_SPACE_OPS_UNAVAILABLE,
    );
  }
}
