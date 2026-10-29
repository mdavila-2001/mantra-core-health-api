import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { CLIN } from '../clinical.concepts';
import type { RetireBlocker } from '../../practice/dto/infrastructure.types';
import {
  RETIRE_BLOCKER_PROVIDERS,
  RETIRE_SAMPLE_SIZE,
  RetireBlockerRegistry,
  type RetireBlockerContext,
  type RetireBlockerProvider,
} from '../../practice/services/retire-blockers';

/**
 * Bloqueo de clausura por **ocupación de cama** (INV-11): un espacio —o algo de
 * su subárbol— con un paciente instalado o una cama reservada no se clausura.
 *
 * Es más amplio que el `ACTIVE_ENCOUNTER` de `practice`, que sólo ve ubicaciones
 * activas: esta mira también las **reservas** (una cama reservada tiene un
 * paciente esperando). La respuesta nombra los encuentros afectados y la acción
 * siguiente.
 */
export const BED_OCCUPANCY_BLOCKER: RetireBlockerProvider = {
  kind: 'ACTIVE_BED_OCCUPANCY',
  async collect(context: RetireBlockerContext): Promise<RetireBlocker | null> {
    const rows = await context.tx.execute<{ id: string }[]>(
      `${context.subtreeCte}
       select distinct el.encounter_id as id
         from clinical.encounter_locations el
         join sub on el.care_space_id = sub.id
        where el.is_bed_assignment and el.period_end is null
          and el.location_status_concept_id in (?, ?)`,
      [context.rootId, CLIN.LOCATION_ACTIVE, CLIN.LOCATION_RESERVED],
    );
    if (rows.length === 0) return null;
    return {
      kind: 'ACTIVE_BED_OCCUPANCY',
      count: rows.length,
      sampleIds: rows.slice(0, RETIRE_SAMPLE_SIZE).map((row) => row.id),
      nextAction:
        'Trasladar o dar egreso a los pacientes internados, o cancelar las reservas de cama',
    };
  },
};

/** Registra los bloqueos de la internación en el registro de `practice` al arrancar. */
@Injectable()
export class ClinicalRetireBlockersInitializer implements OnModuleInit {
  /**
   * @param registry - Registro de proveedores de bloqueo de clausura.
   */
  constructor(
    @Inject(RETIRE_BLOCKER_PROVIDERS)
    private readonly registry: RetireBlockerRegistry,
  ) {}

  /** Alta del proveedor. */
  onModuleInit(): void {
    this.registry.register(BED_OCCUPANCY_BLOCKER);
  }
}
