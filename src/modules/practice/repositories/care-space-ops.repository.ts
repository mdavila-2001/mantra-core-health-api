import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common/constants/concepts';
import { CLIN } from '../../clinical/clinical.concepts';
import { DIR } from '../../directory/directory.concepts';
import { PRAC } from '../practice.concepts';
import {
  CareSpaceBlocks,
  CareSpaceStatusEvents,
  CleaningOrders,
} from '../entities';
import {
  OPEN_CLEANING_STATUSES,
  CLEANING_STATUS,
} from '../domain/ops/ops-catalog';

/** Una asignación vigente del actor (`organization_user_assignments`). */
export interface GrantRow {
  role_id: string;
  scope_id: string;
  practice_id: string | null;
  /** Sede de la asignación (la propia, o la de su unidad o espacio). */
  practice_site_id: string | null;
  clinical_unit_id: string | null;
  care_space_id: string | null;
}

/** Un eslabón del camino del espacio hacia la raíz. */
export interface ChainRow {
  id: string;
  code: string;
  name: string;
  parent_space_id: string | null;
  form_concept_id: string | null;
  space_type_concept_id: string;
  clinical_unit_id: string | null;
  pressure_concept_id: string | null;
  hvac_validated_on: Date | string | null;
  depth: number;
}

/** Ubicación de cama vigente (ocupación derivada). */
export interface OccupancyRow {
  care_space_id: string;
  location_id: string;
  encounter_id: string;
  status_id: string;
  period_start: Date | string | null;
}

/** Datos mínimos del paciente para el tablero (iniciales, sexo, edad). */
export interface PatientBadgeRow {
  encounter_id: string;
  name: string | null;
  last_name: string | null;
  gender_id: string | null;
  birth_date: Date | string | null;
}

/** Compromiso futuro en la ventana de un bloqueo. */
export interface CommitmentRow {
  kind: 'PROCEDURE_CASE' | 'APPOINTMENT' | 'BOOKING';
  id: string;
  starts_at: Date | string;
}

/**
 * Lecturas y escrituras de la operación de F2 (CONTRATO-F2-F5 §F2.3).
 *
 * Lee tablas de `clinical`, `procedures_perioperative`, `scheduling` y
 * `delegated_access` con SQL parametrizado, igual que `RetireBlockersRepository`:
 * esos módulos importan `practice`, y depender de ellos cerraría ciclos. Sólo
 * ids, estados y lo mínimo del paciente (iniciales, sexo, edad); `em.execute`
 * corre en la transacción y con el tenant del llamador.
 */
@Injectable()
export class CareSpaceOpsRepository {
  /**
   * Asignaciones vigentes del actor en el tenant.
   *
   * @param em - Contexto.
   * @param userId - Actor.
   * @param tenantId - Tenant.
   */
  grants(
    em: EntityManager,
    userId: string,
    tenantId: string,
  ): Promise<GrantRow[]> {
    return em.execute<GrantRow[]>(
      `SELECT a.assignment_role_concept_id AS role_id,
              a.access_scope_concept_id AS scope_id,
              a.practice_id,
              coalesce(a.practice_site_id, cs.practice_site_id, cu.practice_site_id)
                AS practice_site_id,
              a.clinical_unit_id, a.care_space_id
         FROM delegated_access.organization_user_assignments a
         JOIN directory.tenant_memberships m ON m.id = a.tenant_membership_id
         LEFT JOIN practice.care_spaces cs ON cs.id = a.care_space_id
         LEFT JOIN practice.clinical_units cu ON cu.id = a.clinical_unit_id
        WHERE m.user_id = ? AND m.tenant_id = ? AND m.status_concept_id = ?
          AND a.status_concept_id = ?
          AND (a.valid_from IS NULL OR a.valid_from <= now())
          AND (a.valid_to IS NULL OR a.valid_to > now())`,
      [userId, tenantId, DIR.MEMBERSHIP_ACTIVE, CONCEPTS.STATE_ACTIVE],
      'all',
    );
  }

  /**
   * El espacio y sus ancestros, del espacio (depth 0) a la raíz.
   *
   * @param em - Contexto.
   * @param spaceId - Espacio.
   */
  chain(em: EntityManager, spaceId: string): Promise<ChainRow[]> {
    return em.execute<ChainRow[]>(
      `WITH RECURSIVE up AS (
         SELECT id, code, name, parent_space_id, form_concept_id, space_type_concept_id,
                clinical_unit_id, pressure_concept_id, hvac_validated_on, 0 AS depth
           FROM practice.care_spaces WHERE id = ?
         UNION ALL
         SELECT c.id, c.code, c.name, c.parent_space_id, c.form_concept_id, c.space_type_concept_id,
                c.clinical_unit_id, c.pressure_concept_id, c.hvac_validated_on, up.depth + 1
           FROM practice.care_spaces c JOIN up ON c.id = up.parent_space_id
          WHERE up.depth < 32)
       SELECT * FROM up ORDER BY depth`,
      [spaceId],
      'all',
    );
  }

  /**
   * Unidades que contienen a los espacios: vínculos vigentes y
   * `clinical_unit_id` del camino, más sus unidades ancestro.
   *
   * @param em - Contexto.
   * @param spaceIds - Camino del espacio.
   */
  async unitsOf(
    em: EntityManager,
    spaceIds: readonly string[],
  ): Promise<string[]> {
    if (spaceIds.length === 0) return [];
    const rows = await em.execute<{ id: string }[]>(
      `WITH RECURSIVE direct AS (
         SELECT clinical_unit_id AS id FROM practice.space_unit_assignments
          WHERE care_space_id = ANY(?::uuid[]) AND valid_from <= now()
            AND (valid_to IS NULL OR valid_to > now())
         UNION
         SELECT clinical_unit_id FROM practice.care_spaces
          WHERE id = ANY(?::uuid[]) AND clinical_unit_id IS NOT NULL),
       up AS (
         SELECT u.id, u.parent_unit_id, 0 AS depth FROM practice.clinical_units u
          WHERE u.id IN (SELECT id FROM direct)
         UNION
         SELECT p.id, p.parent_unit_id, up.depth + 1 FROM practice.clinical_units p
           JOIN up ON p.id = up.parent_unit_id WHERE up.depth < 16)
       SELECT DISTINCT id FROM up`,
      [`{${spaceIds.join(',')}}`, `{${spaceIds.join(',')}}`],
      'all',
    );
    return rows.map((r) => r.id);
  }

  /**
   * Ubicaciones de cama vigentes (ACTIVE que contienen `now`, o RESERVED).
   *
   * @param em - Contexto.
   * @param spaceIds - Espacios.
   */
  async occupancy(
    em: EntityManager,
    spaceIds: readonly string[],
  ): Promise<OccupancyRow[]> {
    if (spaceIds.length === 0) return [];
    return em.execute<OccupancyRow[]>(
      `SELECT care_space_id, id AS location_id, encounter_id,
              location_status_concept_id AS status_id, period_start
         FROM clinical.encounter_locations
        WHERE care_space_id = ANY(?::uuid[]) AND is_bed_assignment
          AND ((location_status_concept_id = ? AND period_start <= clock_timestamp()
                AND (period_end IS NULL OR period_end > clock_timestamp()))
            OR (location_status_concept_id = ?
                AND (period_end IS NULL OR period_end > clock_timestamp())))`,
      [`{${spaceIds.join(',')}}`, CLIN.LOCATION_ACTIVE, CLIN.LOCATION_RESERVED],
      'all',
    );
  }

  /**
   * Nombre, sexo y nacimiento del paciente de cada encuentro (para derivar
   * iniciales y edad; el texto completo nunca sale del servicio).
   *
   * @param em - Contexto.
   * @param encounterIds - Encuentros.
   */
  async patientBadges(
    em: EntityManager,
    encounterIds: readonly string[],
  ): Promise<PatientBadgeRow[]> {
    if (encounterIds.length === 0) return [];
    return em.execute<PatientBadgeRow[]>(
      `SELECT e.id AS encounter_id, p.name, p.last_name,
              p.administrative_gender_concept_id AS gender_id, p.birth_date
         FROM clinical.encounters e
         JOIN profiles.patient_profiles pp ON pp.profile_id = e.patient_profile_id
         JOIN profiles.person_profiles pr ON pr.id = pp.profile_id
         JOIN profiles.persons p ON p.id = pr.person_id
        WHERE e.id = ANY(?::uuid[])`,
      [`{${encounterIds.join(',')}}`],
      'all',
    );
  }

  /**
   * Bloqueos no terminados ni cancelados del espacio (incluye programados).
   *
   * @param em - Contexto.
   * @param spaceId - Espacio.
   */
  openBlocks(em: EntityManager, spaceId: string): Promise<CareSpaceBlocks[]> {
    return em.find(
      CareSpaceBlocks,
      { careSpaceId: spaceId, endedAt: null, cancelledAt: null },
      { orderBy: { startsAt: 'asc' } },
    );
  }

  /**
   * Bloqueos del espacio (con o sin los terminados).
   *
   * @param em - Contexto.
   * @param spaceId - Espacio.
   * @param includeEnded - Incluir terminados y cancelados.
   */
  blocks(
    em: EntityManager,
    spaceId: string,
    includeEnded: boolean,
  ): Promise<CareSpaceBlocks[]> {
    return em.find(
      CareSpaceBlocks,
      includeEnded
        ? { careSpaceId: spaceId }
        : { careSpaceId: spaceId, endedAt: null, cancelledAt: null },
      { orderBy: { startsAt: 'desc' } },
    );
  }

  /**
   * Bloqueos programados cuyo inicio llegó, y vencidos sin fin.
   *
   * @param em - Contexto (SYSTEM).
   */
  async dueBlocks(em: EntityManager): Promise<{
    starting: CareSpaceBlocks[];
    overdue: CareSpaceBlocks[];
  }> {
    const now = new Date();
    const open = await em.find(CareSpaceBlocks, {
      endedAt: null,
      cancelledAt: null,
      $or: [{ startsAt: { $lte: now } }, { expectedEndAt: { $lt: now } }],
    });
    return {
      starting: open.filter((b) => b.startsAt <= now),
      overdue: open.filter((b) => b.expectedEndAt && b.expectedEndAt < now),
    };
  }

  /**
   * Orden de limpieza abierta de cada espacio.
   *
   * @param em - Contexto.
   * @param spaceIds - Espacios.
   */
  async openCleaningOrders(
    em: EntityManager,
    spaceIds: readonly string[],
  ): Promise<CleaningOrders[]> {
    if (spaceIds.length === 0) return [];
    return em.find(CleaningOrders, {
      careSpaceId: { $in: [...spaceIds] },
      statusConceptId: {
        $in: OPEN_CLEANING_STATUSES.map((c) => CLEANING_STATUS[c]),
      },
    });
  }

  /**
   * Compromisos futuros del espacio que se pisan con `[start, end)` (end NULL
   * = abierto): casos quirúrgicos, citas y reservas de agenda.
   *
   * @param em - Contexto.
   * @param spaceId - Espacio.
   * @param start - Inicio.
   * @param end - Fin, o `null`.
   */
  futureCommitments(
    em: EntityManager,
    spaceId: string,
    start: Date,
    end: Date | null,
  ): Promise<CommitmentRow[]> {
    const until = end ?? new Date('9999-12-31T00:00:00Z');
    return em.execute<CommitmentRow[]>(
      `SELECT 'PROCEDURE_CASE' AS kind, id, scheduled_start_at AS starts_at
         FROM procedures_perioperative.procedure_cases
        WHERE operating_room_id = ? AND status_concept_id NOT IN (?, ?)
          AND scheduled_start_at < ? AND coalesce(scheduled_end_at, scheduled_start_at) > ?
       UNION ALL
       SELECT 'APPOINTMENT', id, start_at FROM clinical.appointments
        WHERE care_space_id = ? AND status_concept_id IN (?, ?)
          AND start_at < ? AND coalesce(end_at, start_at) > ?
       UNION ALL
       SELECT 'BOOKING', b.id, bs.start_at FROM scheduling.appointment_bookings b
         JOIN scheduling.bookable_slots bs ON bs.id = b.bookable_slot_id
         JOIN scheduling.schedulable_resources r ON r.id = bs.resource_id
        WHERE (r.care_space_id = ? OR r.resource_ref_id = ?)
          AND b.status_concept_id = ?
          AND bs.start_at < ? AND bs.end_at > ?
       ORDER BY starts_at`,
      [
        spaceId,
        CONCEPTS.CASE_CANCELLED,
        CONCEPTS.CASE_COMPLETED,
        until,
        start,
        spaceId,
        CLIN.APPOINTMENT_BOOKED,
        CLIN.APPOINTMENT_CHECKED_IN,
        until,
        start,
        spaceId,
        spaceId,
        CONCEPTS.BOOKING_CONFIRMED,
        until,
        start,
      ],
      'all',
    );
  }

  /**
   * Último evento A20 de la sede (para `X-Data-As-Of`).
   *
   * @param em - Contexto.
   * @param siteId - Sede.
   */
  async lastEventAt(em: EntityManager, siteId: string): Promise<Date | null> {
    const rows = await em.execute<{ at: Date | string | null }[]>(
      `SELECT max(occurred_at) AS at FROM practice.care_space_status_events
        WHERE practice_site_id = ?`,
      [siteId],
      'all',
    );
    return rows[0]?.at ? new Date(rows[0].at) : null;
  }

  /**
   * Último evento A20 de cada espacio.
   *
   * @param em - Contexto.
   * @param spaceIds - Espacios.
   */
  async lastEventBySpace(
    em: EntityManager,
    spaceIds: readonly string[],
  ): Promise<Map<string, Date>> {
    if (spaceIds.length === 0) return new Map();
    const rows = await em.execute<{ id: string; at: Date | string }[]>(
      `SELECT care_space_id AS id, max(occurred_at) AS at
         FROM practice.care_space_status_events
        WHERE care_space_id = ANY(?::uuid[]) GROUP BY care_space_id`,
      [`{${spaceIds.join(',')}}`],
      'all',
    );
    return new Map(rows.map((r) => [r.id, new Date(r.at)]));
  }

  /**
   * Historial A20 del espacio (más nuevo primero), paginado por `occurred_at`.
   *
   * @param em - Contexto.
   * @param spaceId - Espacio.
   * @param filter - Eje, rango y cursor.
   */
  statusEvents(
    em: EntityManager,
    spaceId: string,
    filter: {
      axisId?: string;
      from?: Date;
      to?: Date;
      before?: Date;
      limit: number;
    },
  ): Promise<CareSpaceStatusEvents[]> {
    const occurredAt: Record<string, Date> = {};
    if (filter.from) occurredAt.$gte = filter.from;
    if (filter.to) occurredAt.$lt = filter.to;
    if (filter.before) occurredAt.$lt = filter.before;
    return em.find(
      CareSpaceStatusEvents,
      {
        careSpaceId: spaceId,
        ...(filter.axisId ? { axisConceptId: filter.axisId } : {}),
        ...(Object.keys(occurredAt).length ? { occurredAt } : {}),
      },
      {
        orderBy: { occurredAt: 'desc', createdAt: 'desc' },
        limit: filter.limit,
      },
    );
  }

  /**
   * Valores `infra.*` de la práctica (`practice_settings.value_json`).
   *
   * @param em - Contexto.
   * @param practiceId - Práctica.
   */
  async settings(
    em: EntityManager,
    practiceId: string,
  ): Promise<Map<string, unknown>> {
    const rows = await em.execute<
      { setting_key: string; value_json: unknown }[]
    >(
      `SELECT setting_key, value_json FROM practice.practice_settings
        WHERE practice_id = ? AND (setting_key LIKE 'infra.%' OR setting_key LIKE 'billing.%')`,
      [practiceId],
      'all',
    );
    return new Map(rows.map((r) => [r.setting_key, r.value_json]));
  }

  /**
   * Índice de alcance de una sede: espacios (padre, función, unidad propia),
   * vínculos vigentes espacio↔unidad y unidades con su padre.
   *
   * @param em - Contexto.
   * @param siteId - Sede.
   */
  async siteScopeIndex(
    em: EntityManager,
    siteId: string,
  ): Promise<{
    spaces: { id: string; parent_space_id: string | null; space_type_concept_id: string; clinical_unit_id: string | null }[];
    links: { care_space_id: string; clinical_unit_id: string }[];
    units: { id: string; parent_unit_id: string | null }[];
  }> {
    const [spaces, links, units] = await Promise.all([
      em.execute<{ id: string; parent_space_id: string | null; space_type_concept_id: string; clinical_unit_id: string | null }[]>(
        'SELECT id, parent_space_id, space_type_concept_id, clinical_unit_id FROM practice.care_spaces WHERE practice_site_id = ?',
        [siteId],
        'all',
      ),
      em.execute<{ care_space_id: string; clinical_unit_id: string }[]>(
        `SELECT a.care_space_id, a.clinical_unit_id FROM practice.space_unit_assignments a
           JOIN practice.care_spaces c ON c.id = a.care_space_id
          WHERE c.practice_site_id = ? AND a.valid_from <= now() AND (a.valid_to IS NULL OR a.valid_to > now())`,
        [siteId],
        'all',
      ),
      em.execute<{ id: string; parent_unit_id: string | null }[]>(
        'SELECT id, parent_unit_id FROM practice.clinical_units WHERE practice_site_id = ?',
        [siteId],
        'all',
      ),
    ]);
    return { spaces, links, units };
  }

  /** Espacios con forma cama de una sede (para el tablero). */
  bedFormId(): string {
    return PRAC.LOC_FORM_BED;
  }
}
