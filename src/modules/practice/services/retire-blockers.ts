import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { PRAC } from '../practice.concepts';
import type { RetireBlocker } from '../dto/infrastructure.types';

/** Cuántos ids de ejemplo lleva cada bloqueo. */
export const RETIRE_SAMPLE_SIZE = 5;

/**
 * Token de inyección del registro de bloqueos de clausura.
 *
 * Un módulo que tenga algo que impida clausurar un espacio (stock, equipos,
 * reservas…) importa `PracticeModule`, inyecta el registro con este token y se
 * registra en `onModuleInit`; **no** se edita `CareSpaceLifecycleService`:
 *
 * ```ts
 * constructor(@Inject(RETIRE_BLOCKER_PROVIDERS) registry: RetireBlockerRegistry) {}
 * onModuleInit() { this.registry.register(this); }
 * ```
 */
export const RETIRE_BLOCKER_PROVIDERS = 'PRACTICE_RETIRE_BLOCKER_PROVIDERS';

/** Sobre qué se pregunta: la raíz y todo su subárbol. */
export interface RetireBlockerContext {
  /** Transacción en la que se calcula (la misma de la clausura). */
  readonly tx: EntityManager;
  /** Tenant del contexto. */
  readonly tenantId: string;
  /** Espacio que se quiere clausurar. */
  readonly rootId: string;
  /** Ahora. */
  readonly now: Date;
  /**
   * Fragmento `WITH RECURSIVE sub …` que expone `sub(id)` con el espacio y todos
   * sus descendientes; los proveedores lo anteponen a su consulta y le pasan
   * `[rootId]` como primer parámetro.
   */
  readonly subtreeCte: string;
}

/** Una fuente de bloqueos de clausura. */
export interface RetireBlockerProvider {
  /** Tipo de bloqueo que produce (`RetireBlocker.kind`). */
  readonly kind: string;
  /**
   * Cuenta los bloqueos sobre el subárbol.
   *
   * @param context - Subárbol y transacción.
   * @returns El bloqueo, o `null` si no hay ninguno.
   */
  collect(context: RetireBlockerContext): Promise<RetireBlocker | null>;
}

/** Registro de proveedores de bloqueo (único por `kind`: registrar de nuevo reemplaza). */
@Injectable()
export class RetireBlockerRegistry {
  private readonly providers = new Map<string, RetireBlockerProvider>();

  /**
   * Agrega (o reemplaza) un proveedor.
   *
   * @param provider - El proveedor.
   */
  register(provider: RetireBlockerProvider): void {
    this.providers.set(provider.kind, provider);
  }

  /** Los proveedores registrados, en orden de alta. */
  all(): RetireBlockerProvider[] {
    return [...this.providers.values()];
  }
}

/** CTE del subárbol (el espacio y sus descendientes). */
export const SUBTREE_CTE = `with recursive sub as (
    select id from practice.care_spaces where id = ?
    union
    select c.id from practice.care_spaces c join sub on c.parent_space_id = sub.id
  )`;

/** Resultado de una consulta de conteo: total y ejemplos. */
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
 * Bloqueos de clausura que `practice` sabe leer hoy (INV-11): hijos, encuentros,
 * cirugías futuras, citas futuras, recursos agendables, stock y equipos.
 *
 * Son lecturas de sólo consulta sobre el subárbol. Quedan como proveedores
 * propios de `practice` porque las tablas existen en el modelo (F1 +
 * `care_space_id` de F5) y es el único lugar que conoce el subárbol; cualquier
 * módulo puede sumar el suyo al registro sin tocar el servicio.
 */
export const BUILT_IN_RETIRE_BLOCKERS: readonly RetireBlockerProvider[] = [
  {
    kind: 'ACTIVE_CHILDREN',
    collect: (context) =>
      sample(
        context,
        'ACTIVE_CHILDREN',
        'Clausurar o mover los espacios hijos que siguen vigentes',
        `select cs.id from practice.care_spaces cs join sub on cs.id = sub.id
          where cs.id <> ? and cs.status_concept_id <> ?`,
        [context.rootId, PRAC.SPACE_RETIRED],
      ),
  },
  {
    kind: 'ACTIVE_ENCOUNTER',
    collect: (context) =>
      sample(
        context,
        'ACTIVE_ENCOUNTER',
        'Trasladar o dar egreso al paciente (internación)',
        `select el.encounter_id as id from clinical.encounter_locations el
           join sub on el.care_space_id = sub.id
          where el.location_status_concept_id = ? and el.period_end is null`,
        [CLIN.LOCATION_ACTIVE],
      ),
  },
  {
    kind: 'FUTURE_PROCEDURE',
    collect: (context) =>
      sample(
        context,
        'FUTURE_PROCEDURE',
        'Reprogramar o cancelar las cirugías programadas en el quirófano',
        `select pc.id from procedures_perioperative.procedure_cases pc
           join sub on pc.operating_room_id = sub.id
          where pc.scheduled_start_at > ?
            and pc.status_concept_id not in (?, ?)`,
        [context.now, CONCEPTS.CASE_CANCELLED, CONCEPTS.CASE_COMPLETED],
      ),
  },
  {
    kind: 'FUTURE_BOOKING',
    collect: (context) =>
      sample(
        context,
        'FUTURE_BOOKING',
        'Reprogramar o cancelar las citas reservadas en el espacio',
        `select s.appointment_id as id from scheduling.availability_slots s
           join sub on s.care_space_id = sub.id
          where s.appointment_id is not null and s.start_at > ?`,
        [context.now],
      ),
  },
  {
    kind: 'SCHEDULABLE_RESOURCE',
    collect: (context) =>
      sample(
        context,
        'SCHEDULABLE_RESOURCE',
        'Dar de baja el recurso agendable que apunta al espacio',
        `select r.id from scheduling.schedulable_resources r
           join sub on r.resource_ref_id = sub.id
          where r.tenant_id = ? and r.state_concept_id = ?`,
        [context.tenantId, CONCEPTS.STATE_ACTIVE],
      ),
  },
  {
    kind: 'INVENTORY_LOCATION',
    collect: (context) =>
      sample(
        context,
        'INVENTORY_LOCATION',
        'Transferir el stock a otra ubicación de inventario',
        `select l.id from pharmacy_inventory.inventory_locations l
           join sub on l.care_space_id = sub.id
          where exists (
            select 1 from pharmacy_inventory.inventory_stock_positions p
             where p.inventory_location_id = l.id and p.on_hand_quantity > 0
          )`,
        [],
      ),
  },
  {
    kind: 'EQUIPMENT',
    collect: (context) =>
      sample(
        context,
        'EQUIPMENT',
        'Reubicar los equipos del espacio a otra sala',
        `select e.id from diagnostic_units.diagnostic_equipment e
           join sub on e.care_space_id = sub.id`,
        [],
      ),
  },
];

/** Registra los bloqueos propios de `practice` al arrancar el módulo. */
@Injectable()
export class PracticeRetireBlockersInitializer implements OnModuleInit {
  /**
   * @param registry - Registro de proveedores.
   */
  constructor(private readonly registry: RetireBlockerRegistry) {}

  /** Alta de los proveedores propios. */
  onModuleInit(): void {
    for (const provider of BUILT_IN_RETIRE_BLOCKERS)
      this.registry.register(provider);
  }
}
