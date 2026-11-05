import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../../common/constants/concepts';
import { DUNIT } from '../../diagnostic_units.concepts';
import type { TemplateRuleRow, UnitRow } from './center-schedule.repository';

export interface DeviceResourceRow {
  id: string;
  equipment_id: string;
}

/** The rules of a device's own template, tagged with its resource. */
export interface DeviceRuleRow extends TemplateRuleRow {
  resource_id: string;
}

/**
 * Raw reads/writes of what makes a device a production line: its
 * `scheduling.schedulable_resources` row (`RES_EQUIPMENT`, the one F5a
 * declared), the published template with its own hours, and the equipment
 * row itself. Stateless: every method receives the `EntityManager`.
 */
@Injectable()
export class DeviceResourcesRepository {
  /** Active resources of the devices, by equipment. */
  findResources(
    em: EntityManager,
    equipmentIds: readonly string[],
  ): Promise<DeviceResourceRow[]> {
    if (equipmentIds.length === 0) return Promise.resolve([]);
    return em.execute<DeviceResourceRow[]>(
      `SELECT DISTINCT ON (resource_ref_id) id, resource_ref_id AS equipment_id
         FROM scheduling.schedulable_resources
        WHERE resource_ref_type = 'diagnostic_equipment' AND resource_ref_id = ANY(?::uuid[])
          AND state_concept_id = ?
        ORDER BY resource_ref_id, created_at`,
      [`{${equipmentIds.join(',')}}`, CONCEPTS.STATE_ACTIVE],
      'all',
    );
  }

  /** Published template rules of several resources, newest first within each. */
  findTemplateRules(
    em: EntityManager,
    resourceIds: readonly string[],
  ): Promise<DeviceRuleRow[]> {
    if (resourceIds.length === 0) return Promise.resolve([]);
    return em.execute<DeviceRuleRow[]>(
      `SELECT t.resource_id, t.id AS template_id, t.name, t.slot_minutes, t.updated_at,
              r.day_of_week, r.start_time::text AS start_time, r.end_time::text AS end_time,
              r.capacity_per_slot
         FROM scheduling.schedule_templates t
         LEFT JOIN scheduling.schedule_rules r
           ON r.schedule_template_id = t.id AND (r.valid_to IS NULL OR r.valid_to >= current_date)
        WHERE t.resource_id = ANY(?::uuid[]) AND t.status_concept_id = ?
        ORDER BY t.resource_id, t.updated_at DESC, r.day_of_week, r.start_time`,
      [`{${resourceIds.join(',')}}`, CONCEPTS.TEMPLATE_PUBLISHED],
      'all',
    );
  }

  /** The `RES_EQUIPMENT` resource of a device, linked from the equipment row. */
  async createResource(
    em: EntityManager,
    unit: UnitRow,
    equipment: { id: string; name: string },
    timeZone: string,
    actorId: string,
  ): Promise<string> {
    const [row] = await em.execute<{ id: string }[]>(
      `INSERT INTO scheduling.schedulable_resources
         (id, tenant_id, practice_id, resource_type_concept_id, resource_ref_type, resource_ref_id,
          name, time_zone, capacity, state_concept_id, created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       VALUES (gen_random_uuid(), ?, ?, ?, 'diagnostic_equipment', ?, ?, ?, 1, ?, now(), now(), ?, ?, 1)
       RETURNING id`,
      [
        unit.tenant_id,
        unit.practice_id,
        CONCEPTS.RESOURCE_EQUIPMENT,
        equipment.id,
        equipment.name.slice(0, 200),
        timeZone,
        CONCEPTS.STATE_ACTIVE,
        actorId,
        actorId,
      ],
      'all',
    );
    await em.execute(
      `UPDATE diagnostic_units.diagnostic_equipment
          SET schedulable_resource_id = ?, updated_at = now(), updated_by_user_id = ?
        WHERE id = ? AND schedulable_resource_id IS NULL`,
      [row.id, actorId, equipment.id],
    );
    return row.id;
  }

  /** A retired device's resource stops being bookable; its booked slots keep their FK. */
  async retireResource(
    em: EntityManager,
    resourceId: string,
    actorId: string,
  ): Promise<void> {
    await em.execute(
      `UPDATE scheduling.schedulable_resources
          SET state_concept_id = ?, updated_at = now(), updated_by_user_id = ?, row_version = row_version + 1
        WHERE id = ?`,
      [CONCEPTS.STATE_REVOKED, actorId, resourceId],
    );
  }

  /** Whether any booking, past or future, was ever taken on the resource. */
  async hasBookings(em: EntityManager, resourceId: string): Promise<boolean> {
    const [row] = await em.execute<{ n: string }[]>(
      `SELECT count(*)::text AS n FROM scheduling.bookable_slots WHERE resource_id = ?`,
      [resourceId],
      'all',
    );
    return Number(row?.n ?? 0) > 0;
  }

  /** The active site a new device of the unit goes to (primary first). */
  async findMainSiteId(
    em: EntityManager,
    unitId: string,
  ): Promise<{ id: string; imaging_available: boolean | null } | null> {
    const [row] = await em.execute<
      { id: string; imaging_available: boolean | null }[]
    >(
      `SELECT id, imaging_available FROM diagnostic_units.diagnostic_unit_sites
        WHERE diagnostic_unit_id = ? AND status_concept_id = ?
        ORDER BY (site_role_concept_id = ?) DESC, created_at LIMIT 1`,
      [unitId, DUNIT.SITE_ACTIVE, DUNIT.SITE_ROLE_PRIMARY],
      'all',
    );
    return row ?? null;
  }

  async deleteEquipment(em: EntityManager, equipmentId: string): Promise<void> {
    await em.execute(
      'DELETE FROM diagnostic_units.diagnostic_equipment WHERE id = ?',
      [equipmentId],
    );
  }
}
