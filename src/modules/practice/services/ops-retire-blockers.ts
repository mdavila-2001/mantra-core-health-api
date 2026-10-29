import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { PRAC } from '../practice.concepts';
import type { RetireBlocker } from '../dto/infrastructure.types';
import {
  RETIRE_BLOCKER_PROVIDERS,
  RETIRE_SAMPLE_SIZE,
  RetireBlockerRegistry,
  type RetireBlockerContext,
  type RetireBlockerProvider,
} from './retire-blockers';

/** Cuenta filas del subárbol y arma el bloqueo con ejemplos. */
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
 * Bloqueos de clausura que aporta F2 (INV-11): un espacio con una orden de limpieza
 * abierta o con un bloqueo vigente (o programado) no se clausura hasta cerrarlos.
 */
export const OPS_RETIRE_BLOCKERS: readonly RetireBlockerProvider[] = [
  {
    kind: 'OPEN_CLEANING_ORDER',
    collect: (context) =>
      sample(
        context,
        'OPEN_CLEANING_ORDER',
        'Completar, inspeccionar o cancelar la orden de limpieza abierta del espacio',
        `select o.id from practice.cleaning_orders o
           join sub on o.care_space_id = sub.id
          where o.status_concept_id in (?, ?, ?)`,
        [PRAC.CLN_PENDING, PRAC.CLN_IN_PROGRESS, PRAC.CLN_DONE],
      ),
  },
  {
    kind: 'OPEN_BLOCK',
    collect: (context) =>
      sample(
        context,
        'OPEN_BLOCK',
        'Terminar o cancelar el bloqueo vigente o programado del espacio',
        `select b.id from practice.care_space_blocks b
           join sub on b.care_space_id = sub.id
          where b.ended_at is null and b.cancelled_at is null`,
        [],
      ),
  },
];

/** Registra los bloqueos de clausura de F2 en `RETIRE_BLOCKER_PROVIDERS` al arrancar. */
@Injectable()
export class PracticeOpsRetireBlockersInitializer implements OnModuleInit {
  /**
   * @param registry - Registro de proveedores.
   */
  constructor(
    @Inject(RETIRE_BLOCKER_PROVIDERS)
    private readonly registry: RetireBlockerRegistry,
  ) {}

  /** Alta de los proveedores de F2. */
  onModuleInit(): void {
    for (const provider of OPS_RETIRE_BLOCKERS)
      this.registry.register(provider);
  }
}
