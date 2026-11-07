import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { DUNIT } from '../../diagnostic_units.concepts';
import { findUnitSites, type SiteRow } from './center-sites.query';
import type { ScheduleWindow } from '../domain/center-schedule.model';

/** The unit as the center screens need it. */
export interface UnitRow {
  id: string;
  tenant_id: string;
  practice_id: string | null;
  name: string;
  type_concept_id: string;
  status_concept_id: string;
  verification_status_concept_id: string;
}

/** Listed in the directory: active and verified, like the public search. */
export function isPublished(unit: UnitRow): boolean {
  return (
    unit.status_concept_id === DUNIT.UNIT_ACTIVE &&
    unit.verification_status_concept_id === DUNIT.VERIFICATION_VERIFIED
  );
}

export interface TemplateRuleRow {
  template_id: string;
  name: string;
  slot_minutes: number | null;
  updated_at: Date;
  day_of_week: number | null;
  start_time: string | null;
  end_time: string | null;
  capacity_per_slot: number | null;
  /** The rule's own length and rest: a window may differ from its template. */
  rule_slot_minutes?: number | null;
  gap_minutes?: number | null;
}

export interface EquipmentRow {
  id: string;
  type_concept_id: string;
  type_display: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  modality_concept_id: string | null;
  status_concept_id: string;
}

export type { SiteRow };

const UNIT_COLUMNS = `u.id, u.tenant_id, u.practice_id, u.name,
  u.diagnostic_unit_type_concept_id AS type_concept_id,
  u.status_concept_id, u.verification_status_concept_id`;

/**
 * Raw reads/writes of a center's unit, site, scheduling resource, templates
 * and equipment. Stateless: every method receives the `EntityManager`.
 *
 * The schedule reuses `scheduling`: one `schedulable_resources` row per unit
 * (`resource_ref_type = 'diagnostic_units'`, the same row patch v4.2.39 seeds)
 * and one published `schedule_templates` per block, with its windows as
 * `schedule_rules`.
 */
@Injectable()
export class CenterScheduleRepository {
  async findUnit(em: EntityManager, unitId: string): Promise<UnitRow | null> {
    const [row] = await em.execute<UnitRow[]>(
      `SELECT ${UNIT_COLUMNS} FROM diagnostic_units.diagnostic_units u WHERE u.id = ?`,
      [unitId],
      'all',
    );
    return row ?? null;
  }

  async findUnitOfTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<UnitRow | null> {
    const [row] = await em.execute<UnitRow[]>(
      `SELECT ${UNIT_COLUMNS} FROM diagnostic_units.diagnostic_units u
        WHERE u.tenant_id = ? ORDER BY u.created_at LIMIT 1`,
      [tenantId],
      'all',
    );
    return row ?? null;
  }

  /** Main active site of each unit (primary first), with its address. */
  async findMainSites(
    em: EntityManager,
    unitIds: readonly string[],
  ): Promise<SiteRow[]> {
    const rows = await this.findSites(em, unitIds);
    return rows.filter(
      (row, i) => rows.findIndex((r) => r.unit_id === row.unit_id) === i,
    );
  }

  /** Every active site of the units, primary first, then by creation. */
  findSites(em: EntityManager, unitIds: readonly string[]): Promise<SiteRow[]> {
    return findUnitSites(em, unitIds);
  }

  /**
   * The bookable resource of one site. The main site falls back to the
   * unit-level resource that predates per-site schedules, so its published
   * schedule and booked appointments stay where they were.
   */
  async findResource(
    em: EntityManager,
    unitId: string,
    site: { site_id: string; main: boolean } | null,
  ): Promise<{ id: string; time_zone: string | null } | null> {
    const [row] = await em.execute<{ id: string; time_zone: string | null }[]>(
      `SELECT id, time_zone FROM scheduling.schedulable_resources
        WHERE state_concept_id = ?
          AND ((resource_ref_type = 'diagnostic_unit_sites' AND resource_ref_id = ?)
            OR (? AND resource_ref_type = 'diagnostic_units' AND resource_ref_id = ?))
        ORDER BY (resource_ref_type = 'diagnostic_unit_sites') DESC, created_at LIMIT 1`,
      [
        CONCEPTS.STATE_ACTIVE,
        site?.site_id ?? null,
        site === null || site.main,
        unitId,
      ],
      'all',
    );
    return row ?? null;
  }

  /** Creates the site's resource; without a site, the legacy unit-level one. */
  async createResource(
    em: EntityManager,
    unit: UnitRow,
    site: { site_id: string; site_name: string } | null,
    timeZone: string,
    actorId: string,
  ): Promise<string> {
    const [row] = await em.execute<{ id: string }[]>(
      `INSERT INTO scheduling.schedulable_resources
         (id, tenant_id, practice_id, resource_type_concept_id, resource_ref_type, resource_ref_id,
          name, time_zone, state_concept_id, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, ?, now(), now(), ?, ?, 1)
       RETURNING id`,
      [
        unit.tenant_id,
        unit.practice_id,
        CONCEPTS.RESOURCE_ROOM,
        site ? 'diagnostic_unit_sites' : 'diagnostic_units',
        site?.site_id ?? unit.id,
        `Agenda de ${site ? `${unit.name} · ${site.site_name}` : unit.name}`.slice(
          0,
          200,
        ),
        timeZone,
        CONCEPTS.STATE_ACTIVE,
        actorId,
        actorId,
      ],
      'all',
    );
    return row.id;
  }

  /** Published templates of the resource with their current rules, newest first. */
  findTemplateRules(
    em: EntityManager,
    resourceId: string,
  ): Promise<TemplateRuleRow[]> {
    return em.execute<TemplateRuleRow[]>(
      `SELECT t.id AS template_id, t.name, t.slot_minutes, t.updated_at,
              r.day_of_week, r.start_time::text AS start_time, r.end_time::text AS end_time,
              r.capacity_per_slot, r.slot_minutes AS rule_slot_minutes, r.gap_minutes
         FROM scheduling.schedule_templates t
         LEFT JOIN scheduling.schedule_rules r
           ON r.schedule_template_id = t.id AND (r.valid_to IS NULL OR r.valid_to >= current_date)
        WHERE t.resource_id = ? AND t.status_concept_id = ?
        ORDER BY t.updated_at DESC, r.day_of_week, r.start_time`,
      [resourceId, CONCEPTS.TEMPLATE_PUBLISHED],
      'all',
    );
  }

  /** Retires (never deletes) the published templates: booked slots keep their FK. */
  async retireTemplates(
    em: EntityManager,
    resourceId: string,
    actorId: string,
  ): Promise<void> {
    await em.execute(
      `UPDATE scheduling.schedule_templates
          SET status_concept_id = ?, valid_to = current_date, updated_at = now(),
              updated_by_user_id = ?, row_version = row_version + 1
        WHERE resource_id = ? AND status_concept_id = ?`,
      [
        CONCEPTS.TEMPLATE_RETIRED,
        actorId,
        resourceId,
        CONCEPTS.TEMPLATE_PUBLISHED,
      ],
    );
  }

  async insertTemplate(
    em: EntityManager,
    data: {
      resourceId: string;
      name: string;
      serviceConceptId: string | null;
      slotMinutes: number;
      windows: readonly ScheduleWindow[];
    },
    actorId: string,
  ): Promise<void> {
    const [template] = await em.execute<{ id: string }[]>(
      `INSERT INTO scheduling.schedule_templates
         (id, resource_id, name, service_concept_id, valid_from, slot_minutes, status_concept_id,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (gen_random_uuid(), ?, ?, ?, current_date, ?, ?, now(), now(), ?, ?, 1)
       RETURNING id`,
      [
        data.resourceId,
        data.name,
        data.serviceConceptId,
        data.slotMinutes,
        CONCEPTS.TEMPLATE_PUBLISHED,
        actorId,
        actorId,
      ],
      'all',
    );
    for (const w of data.windows) {
      await em.execute(
        `INSERT INTO scheduling.schedule_rules
           (id, schedule_template_id, day_of_week, start_time, end_time, slot_minutes, gap_minutes,
            created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
         VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?, now(), now(), ?, ?, 1)`,
        [
          template.id,
          w.dayOfWeek % 7,
          w.startTime,
          w.endTime,
          w.slotMinutes ?? data.slotMinutes,
          w.gapMinutes ? w.gapMinutes : null,
          actorId,
          actorId,
        ],
      );
    }
  }

  /** The unit's devices; with a site, only the ones installed there. */
  findEquipment(
    em: EntityManager,
    unitId: string,
    siteId: string | null = null,
  ): Promise<EquipmentRow[]> {
    return em.execute<EquipmentRow[]>(
      `SELECT e.id, e.equipment_type_concept_id AS type_concept_id, c.display AS type_display,
              e.manufacturer, e.model, e.serial_number, e.modality_concept_id,
              e.operational_status_concept_id AS status_concept_id
         FROM diagnostic_units.diagnostic_equipment e
         JOIN diagnostic_units.diagnostic_unit_sites s ON s.id = e.diagnostic_unit_site_id
         LEFT JOIN terminology.catalog_concepts c ON c.id = e.equipment_type_concept_id
        WHERE s.diagnostic_unit_id = ? AND (?::uuid IS NULL OR s.id = ?::uuid)
        ORDER BY e.created_at, e.id`,
      [unitId, siteId, siteId],
      'all',
    );
  }
}
