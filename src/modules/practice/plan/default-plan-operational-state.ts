import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import { CLIN } from '../../clinical/clinical.concepts';
import { FORMS } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { deriveAssignable, deriveV2Code, type OpsAxes } from './plan-ops-v2';
import { pgUuidArray } from './floor-plans.repository';
import { PLAN_SETTING_KEYS } from './floor-plan.constants';
import type { SpaceState } from './floor-plan.types';
import type {
  OccupantView,
  OpenBlockView,
  OpenCleaningView,
  OpsCardView,
  OpsStateRequest,
  PlanOperationalStatePort,
} from './plan-operational-state.port';

interface StateRow {
  id: string;
  lifecycle_code: string;
  availability_code: string | null;
  reason_code: string | null;
  reason_text: string | null;
  expected_until: string | null;
  availability_since: string;
  hygiene_code: string | null;
  hygiene_since: string;
  terminal_required: boolean;
  isolation_code: string | null;
  isolation_organism: string | null;
  isolation_since: string;
  ops_version: number;
  last_event_at: string;
  loc_status: string | null;
  loc_since: string | null;
  cleaning_order_id: string | null;
}

interface PatientRow {
  care_space_id: string;
  name: string | null;
  last_name: string | null;
  display_name: string | null;
  sex_code: string | null;
  age_years: number | null;
}

/** Iniciales (nombre + primer apellido), o `?` si no hay nombre cargado. */
export function initialsOf(
  name: string | null,
  lastName: string | null,
  displayName: string | null,
): string {
  const first = (name ?? '').trim()[0];
  const second = (lastName ?? '').trim()[0];
  if (first || second) return `${first ?? ''}${second ?? ''}`.toUpperCase();
  const tokens = (displayName ?? '').trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '?';
  return `${tokens[0][0]}${tokens.length > 1 ? tokens[tokens.length - 1][0] : ''}`.toUpperCase();
}

/**
 * Lector por defecto del estado operativo: las columnas de F2 de
 * `practice.care_spaces` (disponibilidad, higiene, aislamiento), la ocupación
 * derivada de `clinical.encounter_locations` (INV-24) y las tablas de bloqueos y
 * órdenes de limpieza. Los códigos salen del catálogo de conceptos, no de
 * constantes de F2: el plano no depende de que sus claves ya estén declaradas.
 *
 * Es el reemplazable: F2 provee su adaptador del tablero con el mismo token.
 */
@Injectable()
export class DefaultPlanOperationalState implements PlanOperationalStatePort {
  /** @inheritdoc */
  async read(
    tx: EntityManager,
    request: OpsStateRequest,
  ): Promise<Map<string, SpaceState>> {
    const result = new Map<string, SpaceState>();
    if (request.spaceIds.length === 0) return result;
    const inspectionRequired = await this.inspectionRequired(
      tx,
      request.practiceId,
    );
    const rows = await tx.execute<StateRow[]>(
      `select cs.id, st.code as lifecycle_code, av.code as availability_code, rs.code as reason_code,
              blk.reason_text, ${isoTimestampSql('cs.availability_expected_until')} as expected_until,
              ${isoTimestampSql('coalesce(cs.availability_changed_at, cs.updated_at)')} as availability_since,
              hy.code as hygiene_code, ${isoTimestampSql('coalesce(cs.hygiene_changed_at, cs.updated_at)')} as hygiene_since,
              cs.terminal_cleaning_required as terminal_required,
              iso.code as isolation_code, cs.isolation_organism_text as isolation_organism,
              ${isoTimestampSql('coalesce(cs.isolation_changed_at, cs.updated_at)')} as isolation_since,
              cs.ops_version, ${isoTimestampSql('cs.updated_at')} as last_event_at,
              loc.status_id as loc_status, ${isoTimestampSql('loc.period_start')} as loc_since,
              cl.id as cleaning_order_id
         from practice.care_spaces cs
         join terminology.catalog_concepts st on st.id = cs.status_concept_id
         left join terminology.catalog_concepts av on av.id = cs.operational_status_concept_id
         left join terminology.catalog_concepts rs on rs.id = cs.availability_reason_concept_id
         left join terminology.catalog_concepts hy on hy.id = cs.hygiene_status_concept_id
         left join terminology.catalog_concepts iso on iso.id = cs.isolation_concept_id
         left join lateral (
              select b.reason_text from practice.care_space_blocks b
               where b.care_space_id = cs.id and b.cancelled_at is null and b.ended_at is null
               order by b.starts_at desc limit 1) blk on true
         left join lateral (
              select el.location_status_concept_id as status_id, el.period_start
                from clinical.encounter_locations el
               where el.care_space_id = cs.id and el.period_end is null
                 and el.location_status_concept_id in (?::uuid, ?::uuid)
               order by (el.location_status_concept_id = ?::uuid) desc, el.period_start desc limit 1) loc on true
         left join lateral (
              select co.id from practice.cleaning_orders co
               where co.care_space_id = cs.id and co.status_concept_id in (?::uuid, ?::uuid, ?::uuid)
               limit 1) cl on true
        where cs.id = any(?::uuid[]) and cs.tenant_id = ?::uuid
          and cs.form_concept_id in (?::uuid, ?::uuid)`,
      [
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_RESERVED,
        CLIN.LOCATION_ACTIVE,
        PRAC.CLN_PENDING,
        PRAC.CLN_IN_PROGRESS,
        PRAC.CLN_DONE,
        pgUuidArray(request.spaceIds),
        request.tenantId,
        FORMS.byInput('LOC_FORM_BED')!.id,
        FORMS.byInput('LOC_FORM_ROOM')!.id,
      ],
    );

    const visibleFor = (spaceId: string): boolean =>
      request.patientVisibility === 'ALL' ||
      (request.patientVisibility !== 'NONE' &&
        request.patientVisibility.has(spaceId));
    const patients = await this.patients(
      tx,
      rows
        .filter((r) => r.loc_status === CLIN.LOCATION_ACTIVE && visibleFor(r.id))
        .map((r) => r.id),
    );

    for (const row of rows) {
      const occupancyCode =
        row.loc_status === CLIN.LOCATION_ACTIVE
          ? ('OCC_OCCUPIED' as const)
          : row.loc_status === CLIN.LOCATION_RESERVED
            ? ('OCC_RESERVED' as const)
            : ('OCC_FREE' as const);
      const axes: OpsAxes = {
        lifecycleCode: row.lifecycle_code,
        availabilityCode: row.availability_code ?? 'SPACE_OP_AVAILABLE',
        hygieneCode: row.hygiene_code ?? 'HYG_CLEAN',
        isolationCode: row.isolation_code ?? 'ISO_NONE',
        occupancyCode,
        terminalCleaningRequired: row.terminal_required,
        inspectionRequired,
      };
      const patient = patients.get(row.id);
      const state: SpaceState = {
        lifecycle: { code: row.lifecycle_code },
        availability: {
          code: axes.availabilityCode,
          ...(row.reason_code ? { reasonCode: row.reason_code } : {}),
          ...(row.reason_text ? { reasonText: row.reason_text } : {}),
          ...(row.expected_until ? { expectedUntil: row.expected_until } : {}),
          since: row.availability_since,
        },
        occupancy: {
          code: occupancyCode,
          since: row.loc_since ?? row.availability_since,
          ...(patient ? { patient } : {}),
        },
        hygiene: {
          code: axes.hygieneCode,
          since: row.hygiene_since,
          terminalRequired: row.terminal_required,
        },
        isolation: {
          code: axes.isolationCode,
          ...(row.isolation_organism ? { organism: row.isolation_organism } : {}),
          since: row.isolation_since,
        },
        v2Code: deriveV2Code(axes),
        assignable: deriveAssignable(axes),
        ...(row.cleaning_order_id
          ? { openCleaningOrderId: row.cleaning_order_id }
          : {}),
        lastEventAt: row.last_event_at,
        opsVersion: row.ops_version,
      };
      result.set(row.id, state);
    }
    return result;
  }

  /** @inheritdoc */
  async lastEventAt(tx: EntityManager, planId: string): Promise<string | null> {
    const rows = await tx.execute<{ last: string | null }[]>(
      `select ${isoTimestampSql('max(e.occurred_at)')} as last
         from practice.care_space_status_events e
         join practice.space_placements sp on sp.care_space_id = e.care_space_id
        where sp.floor_plan_id = ?::uuid`,
      [planId],
    );
    return rows[0]?.last ?? null;
  }

  /** @inheritdoc */
  async fingerprint(
    tx: EntityManager,
    tenantId: string,
    planId: string,
  ): Promise<string> {
    const rows = await tx.execute<{ fp: string }[]>(
      `select md5(concat_ws('|',
         (select max(cs.updated_at)::text || ':' || coalesce(sum(cs.ops_version), 0)::text
            from practice.space_placements sp join practice.care_spaces cs on cs.id = sp.care_space_id
           where sp.floor_plan_id = ?::uuid),
         (select max(el.updated_at)::text || ':' || count(*)::text || ':' || count(el.period_end)::text
            from practice.space_placements sp join clinical.encounter_locations el on el.care_space_id = sp.care_space_id
           where sp.floor_plan_id = ?::uuid),
         (select max(e.occurred_at)::text || ':' || count(*)::text
            from practice.space_placements sp join practice.care_space_status_events e on e.care_space_id = sp.care_space_id
           where sp.floor_plan_id = ?::uuid),
         (select max(b.updated_at)::text || ':' || count(*)::text
            from practice.space_placements sp join practice.care_space_blocks b on b.care_space_id = sp.care_space_id
           where sp.floor_plan_id = ?::uuid),
         (select max(co.updated_at)::text || ':' || count(*)::text
            from practice.space_placements sp join practice.cleaning_orders co on co.care_space_id = sp.care_space_id
           where sp.floor_plan_id = ?::uuid),
         ?::text)) as fp`,
      [planId, planId, planId, planId, planId, tenantId],
    );
    return rows[0]?.fp ?? '-';
  }

  /** @inheritdoc */
  async card(
    tx: EntityManager,
    tenantId: string,
    spaceId: string,
    withOccupant: boolean,
  ): Promise<OpsCardView> {
    const blocks = await tx.execute<
      {
        id: string;
        kind: string;
        reason_code: string | null;
        reason_text: string | null;
        starts_at: string;
        expected_end_at: string | null;
      }[]
    >(
      `select b.id, k.code as kind, r.code as reason_code, b.reason_text,
              ${isoTimestampSql('b.starts_at')} as starts_at, ${isoTimestampSql('b.expected_end_at')} as expected_end_at
         from practice.care_space_blocks b
         join terminology.catalog_concepts k on k.id = b.kind_concept_id
         left join terminology.catalog_concepts r on r.id = b.reason_concept_id
        where b.care_space_id = ?::uuid and b.tenant_id = ?::uuid and b.cancelled_at is null and b.ended_at is null
        order by b.starts_at desc`,
      [spaceId, tenantId],
    );
    const orders = await tx.execute<
      {
        id: string;
        type: string;
        status: string;
        priority: string;
        requested_at: string;
      }[]
    >(
      `select co.id, t.code as type, s.code as status, p.code as priority, ${isoTimestampSql('co.requested_at')} as requested_at
         from practice.cleaning_orders co
         join terminology.catalog_concepts t on t.id = co.cleaning_type_concept_id
         join terminology.catalog_concepts s on s.id = co.status_concept_id
         join terminology.catalog_concepts p on p.id = co.priority_concept_id
        where co.care_space_id = ?::uuid and co.tenant_id = ?::uuid and co.status_concept_id in (?::uuid, ?::uuid, ?::uuid)
        order by co.requested_at desc limit 1`,
      [spaceId, tenantId, PRAC.CLN_PENDING, PRAC.CLN_IN_PROGRESS, PRAC.CLN_DONE],
    );
    const openBlocks: OpenBlockView[] = blocks.map((b) => ({
      id: b.id,
      kind: b.kind,
      reasonCode: b.reason_code,
      reasonText: b.reason_text,
      startsAt: b.starts_at,
      expectedEndAt: b.expected_end_at,
    }));
    const order = orders[0];
    const openCleaningOrder: OpenCleaningView | undefined = order
      ? {
          id: order.id,
          type: order.type,
          status: order.status,
          priority: order.priority,
          requestedAt: order.requested_at,
        }
      : undefined;
    const occupant = withOccupant
      ? await this.occupant(tx, tenantId, spaceId)
      : undefined;
    return {
      openBlocks,
      ...(openCleaningOrder ? { openCleaningOrder } : {}),
      ...(occupant ? { occupant } : {}),
    };
  }

  /** `infra.inspection_required` de la práctica; sin valor configurado, `false`. */
  private async inspectionRequired(
    tx: EntityManager,
    practiceId: string,
  ): Promise<boolean> {
    const rows = await tx.execute<{ value_json: unknown }[]>(
      `select value_json from practice.practice_settings where practice_id = ?::uuid and setting_key = ? limit 1`,
      [practiceId, PLAN_SETTING_KEYS.inspectionRequired],
    );
    return rows[0]?.value_json === true;
  }

  /** Iniciales, sexo y edad de los ocupantes de los espacios pedidos. */
  private async patients(
    tx: EntityManager,
    spaceIds: readonly string[],
  ): Promise<
    Map<string, { initials: string; sexCode: string; ageYears: number }>
  > {
    const out = new Map<
      string,
      { initials: string; sexCode: string; ageYears: number }
    >();
    if (spaceIds.length === 0) return out;
    const rows = await tx.execute<PatientRow[]>(
      `select distinct on (el.care_space_id) el.care_space_id, p.name, p.last_name, p.display_name,
              sx.code as sex_code, extract(year from age(p.birth_date))::int as age_years
         from clinical.encounter_locations el
         join clinical.encounters e on e.id = el.encounter_id
         join profiles.persons p on p.id = e.patient_profile_id
         left join terminology.catalog_concepts sx on sx.id = p.sex_at_birth_concept_id
        where el.care_space_id = any(?::uuid[]) and el.period_end is null and el.location_status_concept_id = ?::uuid
        order by el.care_space_id, el.period_start desc`,
      [pgUuidArray(spaceIds), CLIN.LOCATION_ACTIVE],
    );
    for (const row of rows) {
      out.set(row.care_space_id, {
        initials: initialsOf(row.name, row.last_name, row.display_name),
        sexCode: row.sex_code ?? 'UNKNOWN',
        ageYears: row.age_years ?? 0,
      });
    }
    return out;
  }

  /** Ocupante activo de un espacio, con nombre completo. */
  private async occupant(
    tx: EntityManager,
    tenantId: string,
    spaceId: string,
  ): Promise<OccupantView | undefined> {
    const rows = await tx.execute<
      {
        patient_profile_id: string;
        encounter_id: string;
        name: string | null;
        middle_name: string | null;
        last_name: string | null;
        mother_last_name: string | null;
        display_name: string | null;
        sex_code: string | null;
        age_years: number | null;
        admitted_at: string;
        los_days: number;
        expected_discharge_at: string | null;
      }[]
    >(
      `select e.patient_profile_id, e.id as encounter_id, p.name, p.middle_name, p.last_name, p.mother_last_name,
              p.display_name, sx.code as sex_code, extract(year from age(p.birth_date))::int as age_years,
              ${isoTimestampSql('coalesce(e.start_at, el.period_start)')} as admitted_at,
              greatest(0, floor(extract(epoch from (now() - coalesce(e.start_at, el.period_start))) / 86400))::int as los_days,
              ${isoTimestampSql('e.expected_discharge_at')} as expected_discharge_at
         from clinical.encounter_locations el
         join clinical.encounters e on e.id = el.encounter_id and e.tenant_id = ?::uuid
         join profiles.persons p on p.id = e.patient_profile_id
         left join terminology.catalog_concepts sx on sx.id = p.sex_at_birth_concept_id
        where el.care_space_id = ?::uuid and el.period_end is null and el.location_status_concept_id = ?::uuid
        order by el.period_start desc limit 1`,
      [tenantId, spaceId, CLIN.LOCATION_ACTIVE],
    );
    const row = rows[0];
    if (!row) return undefined;
    const displayName =
      (row.display_name ?? '').trim() ||
      [row.name, row.middle_name, row.last_name, row.mother_last_name]
        .filter((part): part is string => Boolean(part && part.trim()))
        .join(' ') ||
      'Paciente sin identificar';
    return {
      displayName,
      initials: initialsOf(row.name, row.last_name, row.display_name),
      sexCode: row.sex_code ?? 'UNKNOWN',
      ageYears: row.age_years ?? 0,
      encounterId: row.encounter_id,
      patientProfileId: row.patient_profile_id,
      admittedAt: row.admitted_at,
      losDays: row.los_days,
      ...(row.expected_discharge_at
        ? { expectedDischargeAt: row.expected_discharge_at }
        : {}),
    };
  }
}
