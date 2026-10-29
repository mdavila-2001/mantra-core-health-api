import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { CONCEPTS } from '../../../../common';
import { CLIN } from '../../../clinical/clinical.concepts';
import type { RetireBlocker } from '../../../practice/dto/infrastructure.types';
import {
  RETIRE_BLOCKER_PROVIDERS,
  RETIRE_SAMPLE_SIZE,
  type RetireBlockerContext,
  type RetireBlockerProvider,
  type RetireBlockerRegistry,
} from '../../../practice/services/retire-blockers';

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
 * Bloqueos de clausura que pone la agenda (INV-11, F5d):
 *
 * - `FUTURE_BOOKING`: citas pendientes, reservadas o en curso del espacio (`appointments.care_space_id`)
 *   cuyo fin todavía no pasó, más las reservas de la agenda anterior a F5d
 *   (`availability_slots`). Reemplaza al bloqueo del mismo nombre de `practice`, que sólo
 *   miraba esta segunda fuente: una cita con espacio no se veía y la sala se clausuraba con
 *   pacientes citados.
 * - `PUBLISHED_SCHEDULE`: plantillas publicadas cuyo horario es del espacio o de un espacio de
 *   su subárbol. Una agenda publicada sobre un espacio clausurado seguiría ofreciendo turnos
 *   que ninguna reserva puede aceptar.
 */
export const AGENDA_RETIRE_BLOCKERS: readonly RetireBlockerProvider[] = [
  {
    kind: 'FUTURE_BOOKING',
    collect: (context) =>
      sample(
        context,
        'FUTURE_BOOKING',
        'Reprogramar o cancelar las citas reservadas en el espacio',
        `select a.id from clinical.appointments a
           join sub on a.care_space_id = sub.id
          where a.tenant_id = ? and a.status_concept_id in (?, ?, ?)
            and coalesce(a.end_at, a.start_at) > ?
         union
         select s.appointment_id as id from scheduling.availability_slots s
           join sub on s.care_space_id = sub.id
          where s.appointment_id is not null and s.start_at > ?`,
        [
          context.tenantId,
          CLIN.APPOINTMENT_PENDING,
          CLIN.APPOINTMENT_BOOKED,
          CLIN.APPOINTMENT_CHECKED_IN,
          context.now,
          context.now,
        ],
      ),
  },
  {
    kind: 'PUBLISHED_SCHEDULE',
    collect: (context) =>
      sample(
        context,
        'PUBLISHED_SCHEDULE',
        'Retirar o mover los horarios publicados en el espacio',
        `select t.id from scheduling.schedule_templates t
           join sub on t.care_space_id = sub.id
          where t.tenant_id = ? and t.status_concept_id = ?`,
        [context.tenantId, CONCEPTS.TEMPLATE_PUBLISHED],
      ),
  },
];

/** Suma los bloqueos de la agenda al registro de `practice` al arrancar el módulo. */
@Injectable()
export class AgendaRetireBlockersInitializer implements OnModuleInit {
  /** @param registry - Registro de proveedores de bloqueo (`PracticeModule`). */
  constructor(
    @Inject(RETIRE_BLOCKER_PROVIDERS)
    private readonly registry: RetireBlockerRegistry,
  ) {}

  /** Alta de los proveedores propios. */
  onModuleInit(): void {
    for (const provider of AGENDA_RETIRE_BLOCKERS)
      this.registry.register(provider);
  }
}
