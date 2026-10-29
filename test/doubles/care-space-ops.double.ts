import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CLIN } from '../../src/modules/clinical/clinical.concepts';
import type { OccupancyCode } from '../../src/modules/practice/domain/bed-status-v2';
import type {
  BookingWindow,
  CareSpaceOperationalState,
  CareSpaceOpsPort,
  MarkDirtyInput,
  OccupancyChangeInput,
  RevertDirtyInput,
} from '../../src/modules/practice/services/care-space-ops.port';
import { PRAC } from '../../src/modules/practice/practice.concepts';

/** Una llamada registrada al puerto. */
export interface DoubleCall {
  readonly method:
    | 'getOperationalState'
    | 'markDirtyFromSource'
    | 'recordOccupancyChange'
    | 'revertDirtyFromSource'
    | 'assertBookable';
  readonly careSpaceId: string;
  readonly input?: unknown;
}

/** Una orden de limpieza que el doble «creó». */
export interface DoubleCleaningOrder {
  readonly id: string;
  readonly careSpaceId: string;
  readonly trigger: string;
  readonly terminal: boolean;
  readonly sourceRefId: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'INSPECTED' | 'CANCELLED';
}

interface Hygiene {
  code: string;
  terminal: boolean;
}

/**
 * Doble de prueba del puerto `CareSpaceOpsPort` (CONTRATO-F2-F5 F2.3).
 *
 * Lee de la base lo que F3 **escribe** (la ocupación sale de `encounter_locations`
 * y el ciclo de vida y la disponibilidad de la fila del espacio) y guarda en
 * memoria lo que es de F2: la higiene, el aislamiento y las órdenes de limpieza.
 * Una cama sin historia de limpieza está limpia. `markDirtyFromSource` la deja
 * sucia y crea una orden; `cleanAndInspect` la devuelve a asignable.
 *
 * No es la implementación de F2: aplica la fórmula «Asignable» del contrato
 * (ciclo ACTIVE ∧ disponible ∧ libre ∧ limpia/inspeccionada ∧ sin limpieza
 * terminal) y nada más. `lie` permite devolver un estado falso a propósito para
 * probar que la base (EXCLUDE) es la red cuando el pre-chequeo se equivoca.
 */
export class CareSpaceOpsDouble implements CareSpaceOpsPort {
  readonly calls: DoubleCall[] = [];
  readonly orders: DoubleCleaningOrder[] = [];
  private readonly hygiene = new Map<string, Hygiene>();
  private readonly previousHygiene = new Map<string, Hygiene>();
  private readonly isolation = new Map<string, string>();
  private readonly lies = new Map<string, Partial<CareSpaceOperationalState>>();
  /** Hace que el siguiente `markDirtyFromSource` falle (prueba de atomicidad). */
  failNextMarkDirty: Error | null = null;
  /** Si es `false`, el doble responde que la limpieza no se puede revertir (A12 falla cerrado). */
  supportsRevert = true;

  /** Vuelve al estado inicial entre pruebas. */
  reset(): void {
    this.calls.length = 0;
    this.orders.length = 0;
    this.hygiene.clear();
    this.previousHygiene.clear();
    this.isolation.clear();
    this.lies.clear();
    this.failNextMarkDirty = null;
    this.supportsRevert = true;
  }

  /** Devuelve las llamadas de un método. */
  callsTo(method: DoubleCall['method']): DoubleCall[] {
    return this.calls.filter((call) => call.method === method);
  }

  /** La orden de limpieza abierta de una cama, si hay. */
  openOrderOf(careSpaceId: string): DoubleCleaningOrder | undefined {
    return this.orders.find(
      (order) =>
        order.careSpaceId === careSpaceId &&
        ['PENDING', 'IN_PROGRESS', 'DONE'].includes(order.status),
    );
  }

  /** Limpieza terminada e inspeccionada: la cama vuelve a ser asignable. */
  cleanAndInspect(careSpaceId: string): void {
    this.hygiene.set(careSpaceId, { code: 'HYG_INSPECTED', terminal: false });
    for (const order of this.orders) {
      if (order.careSpaceId === careSpaceId && order.status !== 'CANCELLED') {
        order.status = 'INSPECTED';
      }
    }
  }

  /** Marca el aislamiento vigente de una cama. */
  setIsolation(careSpaceId: string, code: string): void {
    this.isolation.set(careSpaceId, code);
  }

  /** Devuelve un estado falso para una cama (sólo para probar la red de la base). */
  lie(careSpaceId: string, patch: Partial<CareSpaceOperationalState>): void {
    this.lies.set(careSpaceId, patch);
  }

  /** Quita la mentira de una cama. */
  stopLying(careSpaceId: string): void {
    this.lies.delete(careSpaceId);
  }

  async getOperationalState(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceOperationalState> {
    this.calls.push({ method: 'getOperationalState', careSpaceId });
    const rows = await tx.execute<
      {
        tenant: string;
        site: string;
        status: string;
        op: string | null;
        occ: string | null;
      }[]
    >(
      `select cs.tenant_id as tenant, cs.practice_site_id as site,
              cs.status_concept_id as status, cs.operational_status_concept_id as op,
              (select el.location_status_concept_id
                 from clinical.encounter_locations el
                where el.care_space_id = cs.id and el.is_bed_assignment
                  and el.location_status_concept_id in (?, ?) and el.period_end is null
                order by (el.location_status_concept_id = ?) desc limit 1) as occ
         from practice.care_spaces cs where cs.id = ?`,
      [
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_RESERVED,
        CLIN.LOCATION_ACTIVE,
        careSpaceId,
      ],
    );
    const row = rows[0];
    const occupancy: OccupancyCode =
      row?.occ === CLIN.LOCATION_ACTIVE
        ? 'OCC_OCCUPIED'
        : row?.occ === CLIN.LOCATION_RESERVED
          ? 'OCC_RESERVED'
          : 'OCC_FREE';
    const hygiene = this.hygiene.get(careSpaceId) ?? {
      code: 'HYG_CLEAN',
      terminal: false,
    };
    const lifecycleActive = row?.status === PRAC.SPACE_ACTIVE;
    const availability =
      !row?.op || row.op === PRAC.SPACE_OP_AVAILABLE
        ? 'SPACE_OP_AVAILABLE'
        : 'SPACE_OP_CLOSED';
    const hygieneOk =
      !hygiene.terminal &&
      (hygiene.code === 'HYG_INSPECTED' || hygiene.code === 'HYG_CLEAN');
    const assignable =
      lifecycleActive &&
      availability === 'SPACE_OP_AVAILABLE' &&
      occupancy === 'OCC_FREE' &&
      hygieneOk;
    const open = this.openOrderOf(careSpaceId);
    const state: CareSpaceOperationalState = {
      careSpaceId,
      tenantId: row?.tenant ?? '',
      practiceSiteId: row?.site ?? '',
      lifecycleActive,
      availability,
      availabilityReasonCode: null,
      availabilityExpectedUntil: null,
      hygiene: hygiene.code as CareSpaceOperationalState['hygiene'],
      terminalCleaningRequired: hygiene.terminal,
      isolation: (this.isolation.get(careSpaceId) ??
        'ISO_NONE') as CareSpaceOperationalState['isolation'],
      isolationOrganism: null,
      occupancy,
      v2Code: occupancy === 'OCC_OCCUPIED' ? 'O' : assignable ? 'U' : 'H',
      assignable,
      openCleaningOrderId: open?.id ?? null,
      opsVersion: 1,
    };
    return { ...state, ...(this.lies.get(careSpaceId) ?? {}) };
  }

  async markDirtyFromSource(
    _tx: EntityManager,
    careSpaceId: string,
    input: MarkDirtyInput,
  ): Promise<{ cleaningOrderId: string }> {
    this.calls.push({
      method: 'markDirtyFromSource',
      careSpaceId,
      input: {
        trigger: input.trigger,
        sourceRefId: input.sourceRefId,
        terminal: input.terminal,
        requestId: input.requestId,
      },
    });
    const sourceRefId = input.sourceRefId ?? '';
    if (this.failNextMarkDirty) {
      const error = this.failNextMarkDirty;
      this.failNextMarkDirty = null;
      throw error;
    }
    const previous = this.hygiene.get(careSpaceId) ?? {
      code: 'HYG_CLEAN',
      terminal: false,
    };
    this.previousHygiene.set(careSpaceId, previous);
    this.hygiene.set(careSpaceId, {
      code: 'HYG_DIRTY',
      terminal: input.terminal,
    });
    const order: DoubleCleaningOrder = {
      id: randomUUID(),
      careSpaceId,
      trigger: input.trigger,
      terminal: input.terminal,
      sourceRefId,
      status: 'PENDING',
    };
    this.orders.push(order);
    return { cleaningOrderId: order.id };
  }

  async recordOccupancyChange(
    _tx: EntityManager,
    careSpaceId: string,
    input: OccupancyChangeInput,
  ): Promise<void> {
    this.calls.push({
      method: 'recordOccupancyChange',
      careSpaceId,
      input: {
        from: input.from,
        to: input.to,
        sourceRefId: input.sourceRefId,
        requestId: input.requestId,
      },
    });
  }

  async revertDirtyFromSource(
    _tx: EntityManager,
    careSpaceId: string,
    input: RevertDirtyInput,
  ): Promise<{ reverted: boolean }> {
    this.calls.push({
      method: 'revertDirtyFromSource',
      careSpaceId,
      input: { sourceRefId: input.sourceRefId },
    });
    const order = this.orders.find(
      (o) =>
        o.careSpaceId === careSpaceId && o.sourceRefId === input.sourceRefId,
    );
    if (!this.supportsRevert || !order || order.status !== 'PENDING') {
      return { reverted: false };
    }
    order.status = 'CANCELLED';
    this.hygiene.set(
      careSpaceId,
      this.previousHygiene.get(careSpaceId) ?? {
        code: 'HYG_CLEAN',
        terminal: false,
      },
    );
    return { reverted: true };
  }

  async assertBookable(
    _tx: EntityManager,
    careSpaceId: string,
    window: BookingWindow,
  ): Promise<void> {
    this.calls.push({
      method: 'assertBookable',
      careSpaceId,
      input: { start: window.start, end: window.end },
    });
  }
}
