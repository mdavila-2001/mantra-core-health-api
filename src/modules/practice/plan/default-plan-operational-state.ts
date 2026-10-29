import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { isoTimestampSql } from '../../../common/pagination/iso-timestamp-sql';
import { CLIN } from '../../clinical/clinical.concepts';
import { FORMS } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import { OpsStateService } from '../services/ops-state';
import { isClinicalText, visibleText } from '../services/ops-privacy';
import type { SpaceState } from './floor-plan.types';
import type {
  OccupantView,
  OpenBlockView,
  OpenCleaningView,
  OpsCardView,
  OpsStateRequest,
  PatientVisibility,
  PlanOperationalStatePort,
} from './plan-operational-state.port';

/** ¿Se autoriza el dato de este espacio? */
function isVisible(visibility: PatientVisibility, spaceId: string): boolean {
  return (
    visibility === 'ALL' || (visibility !== 'NONE' && visibility.has(spaceId))
  );
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
 * Es el reemplazable: otro adaptador puede proveer el mismo token.
 */
@Injectable()
export class DefaultPlanOperationalState implements PlanOperationalStatePort {
  /** @param ops - Lector del estado operativo de F2 (dueño del filtro clínico). */
  constructor(private readonly ops: OpsStateService) {}

  /**
   * @inheritdoc
   *
   * Las celdas las arma `OpsStateService.cells()` de F2, que es quien filtra el
   * dato clínico: el organismo del aislamiento, el texto del motivo «condición
   * del paciente» y las iniciales del ocupante sólo salen para los espacios que
   * `clinicalVisibility` / `patientVisibility` autorizan. El plano no tiene un
   * filtro propio: lo que F2 no entrega, no viaja (ausente = no autorizado).
   */
  async read(
    tx: EntityManager,
    request: OpsStateRequest,
  ): Promise<Map<string, SpaceState>> {
    const result = new Map<string, SpaceState>();
    if (request.spaceIds.length === 0) return result;
    const bed = FORMS.byInput('LOC_FORM_BED')!.id;
    const room = FORMS.byInput('LOC_FORM_ROOM')!.id;
    const spaces = (
      await this.ops.loadSpaces(tx, request.tenantId, request.spaceIds)
    ).filter((s) => s.formConceptId === bed || s.formConceptId === room);
    const now = new Date();
    const cells = await this.ops.cells(tx, request.siteId, spaces, {
      now,
      patientVisible: (id) => isVisible(request.patientVisibility, id),
      clinicalVisible: (id) => isVisible(request.clinicalVisibility, id),
    });
    const fallbackAt = now.toISOString();
    for (const cell of cells) {
      const since = (value: string | null): string => value ?? fallbackAt;
      const patient = cell.occupancy.patient;
      const organism = cell.isolation.organism;
      const reasonText = cell.availability.reasonText;
      result.set(cell.id, {
        lifecycle: { code: cell.lifecycle?.code ?? 'UNKNOWN' },
        availability: {
          code: cell.availability.code,
          ...(cell.availability.reasonCode
            ? { reasonCode: cell.availability.reasonCode }
            : {}),
          ...(reasonText ? { reasonText } : {}),
          ...(cell.availability.expectedUntil
            ? { expectedUntil: cell.availability.expectedUntil }
            : {}),
          since: since(cell.availability.since),
        },
        occupancy: {
          code: cell.occupancy.code as
            'OCC_FREE' | 'OCC_RESERVED' | 'OCC_OCCUPIED',
          since: since(cell.occupancy.since ?? cell.availability.since),
          ...(patient ? { patient } : {}),
        },
        hygiene: {
          code: cell.hygiene.code,
          since: since(cell.hygiene.since),
          terminalRequired: cell.hygiene.terminalRequired,
        },
        isolation: {
          code: cell.isolation.code,
          ...(organism ? { organism } : {}),
          since: since(cell.isolation.since),
        },
        v2Code: cell.v2Code,
        assignable: cell.assignable,
        ...(cell.openCleaningOrderId
          ? { openCleaningOrderId: cell.openCleaningOrderId }
          : {}),
        lastEventAt: since(cell.lastEventAt ?? cell.availability.since),
        opsVersion: cell.opsVersion,
      });
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
    clinicalVisible = false,
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
      `select b.id, regexp_replace(k.code, '^[a-z_]+:', '') as kind, regexp_replace(r.code, '^[a-z_]+:', '') as reason_code, b.reason_text,
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
      `select co.id, regexp_replace(t.code, '^[a-z_]+:', '') as type, regexp_replace(s.code, '^[a-z_]+:', '') as status, regexp_replace(p.code, '^[a-z_]+:', '') as priority, ${isoTimestampSql('co.requested_at')} as requested_at
         from practice.cleaning_orders co
         join terminology.catalog_concepts t on t.id = co.cleaning_type_concept_id
         join terminology.catalog_concepts s on s.id = co.status_concept_id
         join terminology.catalog_concepts p on p.id = co.priority_concept_id
        where co.care_space_id = ?::uuid and co.tenant_id = ?::uuid and co.status_concept_id in (?::uuid, ?::uuid, ?::uuid)
        order by co.requested_at desc limit 1`,
      [
        spaceId,
        tenantId,
        PRAC.CLN_PENDING,
        PRAC.CLN_IN_PROGRESS,
        PRAC.CLN_DONE,
      ],
    );
    const openBlocks: OpenBlockView[] = blocks.map((b) => {
      // Mismo criterio que F2: el texto de «condición del paciente» es clínico y,
      // para quien no lo ve, la clave no existe (ausente = no autorizado).
      const text = visibleText(
        b.reason_text,
        isClinicalText(null, b.reason_code),
        clinicalVisible,
      );
      const hidden = text === null && b.reason_text !== null;
      return {
        id: b.id,
        kind: b.kind,
        reasonCode: b.reason_code,
        ...(hidden ? {} : { reasonText: text }),
        startsAt: b.starts_at,
        expectedEndAt: b.expected_end_at,
      };
    });
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
              p.display_name, regexp_replace(sx.code, '^[a-z_]+:', '') as sex_code, extract(year from age(p.birth_date))::int as age_years,
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
