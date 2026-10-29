import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { RetireBlocker } from '../../practice/dto/infrastructure.types';
import {
  RETIRE_BLOCKER_PROVIDERS,
  RETIRE_SAMPLE_SIZE,
  RetireBlockerRegistry,
  type RetireBlockerContext,
  type RetireBlockerProvider,
} from '../../practice/services/retire-blockers';

/**
 * Bloqueo de clausura por **equipos** (CONTRATO-F2-F5 F5f): un espacio —o algo de su
 * subárbol— con un activo de infraestructura ubicado (`accounting.infrastructure_items`)
 * o un equipo diagnóstico (`diagnostic_units.diagnostic_equipment`) no se clausura.
 *
 * Reemplaza al proveedor `EQUIPMENT` de `practice`, que sólo veía los equipos
 * diagnósticos (el registro es único por `kind`): éste mira las dos fuentes.
 */
export const EQUIPMENT_BLOCKER: RetireBlockerProvider = {
  kind: 'EQUIPMENT',
  async collect(context: RetireBlockerContext): Promise<RetireBlocker | null> {
    const rows = await context.tx.execute<{ id: string }[]>(
      `${context.subtreeCte}
       select ii.id from accounting.infrastructure_items ii join sub on ii.care_space_id = sub.id
       union
       select e.id from diagnostic_units.diagnostic_equipment e join sub on e.care_space_id = sub.id`,
      [context.rootId],
    );
    if (rows.length === 0) return null;
    return {
      kind: 'EQUIPMENT',
      count: rows.length,
      sampleIds: rows.slice(0, RETIRE_SAMPLE_SIZE).map((row) => row.id),
      nextAction: 'Reubicar los equipos y activos del espacio a otra sala',
    };
  },
};

/** Registra el bloqueo de equipos en el registro de `practice` al arrancar. */
@Injectable()
export class AccountingRetireBlockersInitializer implements OnModuleInit {
  /**
   * @param registry - Registro de proveedores de bloqueo de clausura.
   */
  constructor(
    @Inject(RETIRE_BLOCKER_PROVIDERS)
    private readonly registry: RetireBlockerRegistry,
  ) {}

  /** Alta del proveedor. */
  onModuleInit(): void {
    this.registry.register(EQUIPMENT_BLOCKER);
  }
}
