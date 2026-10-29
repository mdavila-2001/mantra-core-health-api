import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { CONCEPTS } from '../../../common';
import type { RetireBlocker } from '../../practice/dto/infrastructure.types';
import {
  RETIRE_BLOCKER_PROVIDERS,
  RETIRE_SAMPLE_SIZE,
  type RetireBlockerContext,
  type RetireBlockerProvider,
  type RetireBlockerRegistry,
} from '../../practice/services/retire-blockers';
import { PERIOP } from '../procedures_perioperative.concepts';

/** Ejecuta la consulta sobre el subárbol y arma el bloqueo con ejemplos. */
async function sample(
  context: RetireBlockerContext,
  kind: string,
  nextAction: string,
  sql: string,
  params: unknown[],
): Promise<RetireBlocker | null> {
  const rows = await context.tx.execute<{ id: string }[]>(
    `${context.subtreeCte} select distinct x.id from (${sql}) x`,
    [context.rootId, ...params],
  );
  if (rows.length === 0) return null;
  return {
    kind,
    count: rows.length,
    sampleIds: rows.slice(0, RETIRE_SAMPLE_SIZE).map((row) => row.id),
    nextAction,
  };
}

/**
 * Bloqueos de clausura de quirófanos (INV-11):
 *
 * - `FUTURE_OR_CASE`: casos vivos (programado, listo o en curso) cuya ventana reservada
 *   —preparación y limpieza incluidas— todavía no terminó. Es más estricto que el bloqueo de
 *   cirugías futuras de `practice`: un caso en curso, que empezó en el pasado, también impide
 *   clausurar la sala.
 * - `FUTURE_OR_BLOCK`: bloques activos que todavía no terminaron.
 */
export const PERIOP_RETIRE_BLOCKERS: readonly RetireBlockerProvider[] = [
  {
    kind: 'FUTURE_OR_CASE',
    collect: (context) =>
      sample(
        context,
        'FUTURE_OR_CASE',
        'Reubicar o cancelar los casos quirúrgicos de la sala, incluido el que está en curso',
        `select pc.id from procedures_perioperative.procedure_cases pc
           join sub on pc.operating_room_id = sub.id
          where pc.status_concept_id in (?, ?, ?)
            and coalesce(pc.reserved_end_at, pc.scheduled_end_at) > ?`,
        [
          CONCEPTS.CASE_SCHEDULED,
          CONCEPTS.CASE_READY_FOR_SURGERY,
          CONCEPTS.SURGICAL_CASE_IN_PROGRESS,
          context.now,
        ],
      ),
  },
  {
    kind: 'FUTURE_OR_BLOCK',
    collect: (context) =>
      sample(
        context,
        'FUTURE_OR_BLOCK',
        'Cancelar los bloques de quirófano vigentes de la sala o de su serie',
        `select b.id from procedures_perioperative.operating_room_blocks b
           join sub on b.operating_room_id = sub.id
          where b.tenant_id = ? and b.status_concept_id = ? and b.ends_at > ?`,
        [context.tenantId, PERIOP.ORB_ACTIVE, context.now],
      ),
  },
];

/** Suma los bloqueos de quirófanos al registro de `practice` al arrancar el módulo. */
@Injectable()
export class PeriopRetireBlockersInitializer implements OnModuleInit {
  /** @param registry - Registro de proveedores de bloqueo (`PracticeModule`). */
  constructor(
    @Inject(RETIRE_BLOCKER_PROVIDERS)
    private readonly registry: RetireBlockerRegistry,
  ) {}

  /** Alta de los proveedores propios. */
  onModuleInit(): void {
    for (const provider of PERIOP_RETIRE_BLOCKERS)
      this.registry.register(provider);
  }
}
