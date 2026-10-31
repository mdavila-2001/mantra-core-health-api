import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';

/** Ids que bloquean, con su recuento total. */
export interface BlockingRows {
  readonly count: number;
  readonly sampleIds: string[];
}

/** Bloqueos que viven en otros módulos, por tipo. */
export interface ExternalSpaceBlockers {
  readonly activeEncounters: BlockingRows;
  readonly futureProcedures: BlockingRows;
  readonly futureBookings: BlockingRows;
  readonly schedulableResources: BlockingRows;
  /** F5c: ubicaciones de inventario con existencias en el subárbol. */
  readonly inventoryLocations: BlockingRows;
  /** F5f/F5a: activos de infraestructura y equipos diagnósticos del subárbol. */
  readonly equipment: BlockingRows;
}

/** Espacio y sus descendientes (hasta 32 niveles). */
const SUBTREE = `WITH RECURSIVE sub AS (
    SELECT id, 0 AS depth FROM practice.care_spaces WHERE id = ?
    UNION ALL
    SELECT c.id, sub.depth + 1 FROM practice.care_spaces c JOIN sub ON c.parent_space_id = sub.id
     WHERE sub.depth < 32)`;

const SAMPLE = 5;

/**
 * Lo que impide retirar un espacio y vive **fuera** de `practice` (contrato §3).
 *
 * SQL parametrizado y no los repositorios de cada módulo: `practice` no importa
 * `clinical`, `procedures_perioperative` ni `scheduling` (todos lo leen a él),
 * y sumarlos cerraría ciclos. Las consultas sólo leen ids y estados, nunca
 * datos del paciente.
 *
 * Corren con el contexto de la petición: con `RLS_ENFORCE=true` sólo ven filas
 * del tenant activo, que es lo que corresponde (un espacio del tenant A no
 * puede estar ocupado por un episodio del tenant B).
 *
 * Qué cuenta como bloqueo:
 * - `ACTIVE_ENCOUNTER`: `clinical.encounter_locations` del espacio sin
 *   `period_end` o con `period_end` futuro.
 * - `FUTURE_PROCEDURE`: `procedures_perioperative.procedure_cases` con ese
 *   quirófano, inicio programado futuro y ni cancelados ni completados.
 * - `FUTURE_BOOKING`: cupos de `scheduling.availability_slots` del espacio
 *   con cita y comienzo futuro, más reservas de `appointment_bookings` sobre un
 *   recurso agendable que apunta al espacio (`resource_ref_id`), futuras y no
 *   canceladas/completadas/ausentes.
 * - `SCHEDULABLE_RESOURCE`: `schedulable_resources` activos con
 *   `resource_ref_id` = espacio (referencia sin FK, ver PLAN §1) y horarios de
 *   `practitioner_schedules` del espacio con vigencia abierta o futura.
 * - `INVENTORY_LOCATION` (F5c): ubicaciones de `pharmacy_inventory` del espacio
 *   o de su subárbol con alguna posición `on_hand_quantity > 0`.
 * - `EQUIPMENT` (F5f): `accounting.infrastructure_items` y
 *   `diagnostic_units.diagnostic_equipment` ubicados en el espacio o su subárbol.
 */
@Injectable()
export class RetireBlockersRepository {
  /**
   * Bloqueos externos de un espacio.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param careSpaceId - Espacio.
   */
  async forSpace(
    em: EntityManager,
    careSpaceId: string,
  ): Promise<ExternalSpaceBlockers> {
    const [
      activeEncounters,
      futureProcedures,
      futureBookings,
      resources,
      inventoryLocations,
      equipment,
    ] = await Promise.all([
      this.ids(
        em,
        `SELECT id FROM clinical.encounter_locations
            WHERE care_space_id = ?
              AND (period_end IS NULL OR period_end > now())`,
        [careSpaceId],
      ),
      this.ids(
        em,
        `SELECT id FROM procedures_perioperative.procedure_cases
            WHERE operating_room_id = ?
              AND scheduled_start_at > now()
              AND status_concept_id NOT IN (?, ?)`,
        [careSpaceId, CONCEPTS.CASE_CANCELLED, CONCEPTS.CASE_COMPLETED],
      ),
      this.ids(
        em,
        `SELECT s.id FROM scheduling.availability_slots s
            WHERE s.care_space_id = ?
              AND s.appointment_id IS NOT NULL
              AND s.start_at > now()
           UNION ALL
           SELECT b.id FROM scheduling.appointment_bookings b
             JOIN scheduling.bookable_slots bs ON bs.id = b.bookable_slot_id
             JOIN scheduling.schedulable_resources r ON r.id = bs.resource_id
            WHERE r.resource_ref_id = ?
              AND bs.start_at > now()
              AND b.status_concept_id NOT IN (?, ?, ?)`,
        [
          careSpaceId,
          careSpaceId,
          CONCEPTS.BOOKING_CANCELLED,
          SCHED.BOOKING_COMPLETED,
          SCHED.BOOKING_NO_SHOW,
        ],
      ),
      this.ids(
        em,
        `SELECT id FROM scheduling.schedulable_resources
            WHERE resource_ref_id = ? AND state_concept_id = ?
           UNION ALL
           SELECT id FROM scheduling.practitioner_schedules
            WHERE care_space_id = ?
              AND (valid_to IS NULL OR valid_to >= current_date)`,
        [careSpaceId, CONCEPTS.STATE_ACTIVE, careSpaceId],
      ),
      this.ids(
        em,
        `${SUBTREE}
           SELECT l.id FROM pharmacy_inventory.inventory_locations l
            WHERE l.care_space_id IN (SELECT id FROM sub)
              AND EXISTS (SELECT 1 FROM pharmacy_inventory.inventory_stock_positions sp
                           WHERE sp.inventory_location_id = l.id AND sp.on_hand_quantity > 0)`,
        [careSpaceId],
      ),
      this.ids(
        em,
        `${SUBTREE}
           SELECT i.id FROM accounting.infrastructure_items i
            WHERE i.care_space_id IN (SELECT id FROM sub)
           UNION ALL
           SELECT e.id FROM diagnostic_units.diagnostic_equipment e
            WHERE e.care_space_id IN (SELECT id FROM sub)`,
        [careSpaceId],
      ),
    ]);
    return {
      activeEncounters,
      futureProcedures,
      futureBookings,
      schedulableResources: resources,
      inventoryLocations,
      equipment,
    };
  }

  /**
   * Recuento y muestra de una consulta de ids.
   *
   * @param em - Contexto.
   * @param sql - Consulta que devuelve una columna `id`.
   * @param params - Parámetros posicionales.
   */
  private async ids(
    em: EntityManager,
    sql: string,
    params: unknown[],
  ): Promise<BlockingRows> {
    // `em.execute` y no `getConnection().execute`: el primero corre dentro de
    // la transacción del llamador (y de su `set_config` de tenant).
    const rows = await em.execute<{ id: string; total: string | number }[]>(
      `SELECT id, count(*) OVER () AS total FROM (${sql}) q ORDER BY id LIMIT ${SAMPLE}`,
      params,
      'all',
    );
    return {
      count: rows.length === 0 ? 0 : Number(rows[0].total),
      sampleIds: rows.map((r) => r.id),
    };
  }
}
