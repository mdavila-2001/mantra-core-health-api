import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS } from '../../../common';
import { BILL } from '../billing.concepts';
import type { TariffCandidate } from '../domain/tariff-rules';

/** Un cargo a insertar. */
export interface NewCharge {
  readonly tenantId: string;
  readonly practiceId: string;
  readonly patientProfileId: string;
  readonly encounterId: string;
  readonly sourceKind: 'BED_DAY' | 'OR_TIME';
  readonly sourceRefId: string;
  readonly serviceDate: string;
  readonly careSpaceId: string | null;
  readonly bedCategoryConceptId: string | null;
  readonly tariff: TariffCandidate | null;
  readonly quantity: number;
  readonly minimumStay: boolean;
  readonly costCenterId: string | null;
  readonly idempotencyKey: string;
  readonly actorUserId: string | null;
}

/** Cargo insertado. */
export interface InsertedCharge {
  readonly id: string;
  readonly snapshot: Record<string, unknown>;
}

/** Fila de tarifa tal como la lee el devengo. */
interface TariffRow {
  id: string;
  tariff_kind_concept_id: string;
  bed_category_concept_id: string | null;
  care_space_id: string | null;
  service_catalog_id: string;
  unit_minutes: number | null;
  minimum_units: number | null;
  unit_price: string;
  currency_concept_id: string;
  valid_from: string;
  valid_to: string | null;
}

/**
 * Acceso a datos que comparten los procesos de devengo (día-cama y quirófano por
 * tiempo): tarifas, centro de costo de la unidad dueña del espacio y la
 * inserción **idempotente** de un cargo.
 *
 * La idempotencia descansa en la base: `INSERT … ON CONFLICT (tenant_id,
 * idempotency_key) DO NOTHING` (con objetivo: el índice es único y no diferible).
 * Los otros tres únicos parciales (encuentro+noche, cama+noche, caso de
 * quirófano) quedan como red: si dos servicios arman la clave distinto, la base
 * rechaza el segundo cargo con `23505` en vez de cobrar dos veces.
 */
@Injectable()
export class ChargeAccrualSupport {
  /**
   * Tarifas de un tipo de la práctica que todavía rigen o rigieron (todas las
   * versiones; la elección por fecha la hace {@link pickBedDayTariff}).
   *
   * @param tx - Transacción.
   * @param practiceId - Práctica.
   * @param kindConceptId - `BILL.TARIFF_BED_DAY` o `BILL.TARIFF_OR_TIME`.
   */
  async loadTariffs(
    tx: EntityManager,
    practiceId: string,
    kindConceptId: string,
  ): Promise<TariffCandidate[]> {
    const rows = await tx.execute<TariffRow[]>(
      `select id, tariff_kind_concept_id, bed_category_concept_id, care_space_id, service_catalog_id,
              unit_minutes, minimum_units, unit_price::text as unit_price, currency_concept_id,
              valid_from::text as valid_from, valid_to::text as valid_to
         from billing.space_tariffs
        where practice_id = ? and tariff_kind_concept_id = ?`,
      [practiceId, kindConceptId],
    );
    return rows.map((row) => ({
      id: row.id,
      tariffKindConceptId: row.tariff_kind_concept_id,
      bedCategoryConceptId: row.bed_category_concept_id,
      careSpaceId: row.care_space_id,
      serviceCatalogId: row.service_catalog_id,
      unitMinutes: row.unit_minutes,
      minimumUnits: row.minimum_units,
      unitPrice: row.unit_price,
      currencyConceptId: row.currency_concept_id,
      validFrom: row.valid_from,
      validTo: row.valid_to,
    }));
  }

  /**
   * Centro de costo activo de la unidad dueña del espacio (CONTRATO-F2-F5 F5f): el
   * de la unidad del espacio o, subiendo por `parent_space_id`, la de su ancestro;
   * si esa unidad no tiene centro de costo, el de su unidad superior.
   *
   * @param tx - Transacción.
   * @param careSpaceId - Espacio (cama o quirófano).
   * @returns El centro de costo, o `null` si ninguna unidad dueña tiene uno.
   */
  async costCenterOfSpace(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<string | null> {
    const rows = await tx.execute<{ id: string }[]>(
      `with recursive up(id, parent_space_id, clinical_unit_id, depth) as (
         select id, parent_space_id, clinical_unit_id, 0
           from practice.care_spaces where id = ?
         union all
         select p.id, p.parent_space_id, p.clinical_unit_id, up.depth + 1
           from practice.care_spaces p join up on p.id = up.parent_space_id
       ),
       owner_units as (
         select clinical_unit_id as unit_id, min(depth) as depth
           from up where clinical_unit_id is not null group by clinical_unit_id
       ),
       units(unit_id, parent_unit_id, depth) as (
         select cu.id, cu.parent_unit_id, o.depth * 100
           from practice.clinical_units cu join owner_units o on o.unit_id = cu.id
         union all
         select p.id, p.parent_unit_id, units.depth + 1
           from practice.clinical_units p join units on p.id = units.parent_unit_id
       )
       select cc.id from units
         join accounting.cost_centers cc
           on cc.clinical_unit_id = units.unit_id and cc.status_concept_id = ?
        order by units.depth, cc.id
        limit 1`,
      [careSpaceId, CONCEPTS.STATE_ACTIVE],
    );
    return rows[0]?.id ?? null;
  }

  /**
   * Inserta un cargo `CHG_PENDING` si no existe uno con esa clave.
   *
   * Sin tarifa vigente el cargo se crea **sin precio** (`unit_price NULL`): no se
   * inventa un precio ni se cae a otra tarifa.
   *
   * @param tx - Transacción (con el contexto de sistema o el del tenant).
   * @param charge - El cargo.
   * @returns El cargo insertado, o `null` si la clave ya existía.
   */
  async insertIfAbsent(
    tx: EntityManager,
    charge: NewCharge,
  ): Promise<InsertedCharge | null> {
    const tariff = charge.tariff;
    const rows = await tx.execute<
      { id: string; snapshot: Record<string, unknown> }[]
    >(
      `insert into billing.charge_captures
         (id, tenant_id, practice_id, patient_profile_id, encounter_id, source_kind_concept_id, source_ref_id,
          service_date, care_space_id, bed_category_concept_id, space_tariff_id, service_catalog_id,
          minimum_stay_charge, quantity, unit_price, currency_concept_id, cost_center_id,
          status_concept_id, invoice_line_id, void_reason, idempotency_key,
          created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
       values (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?::date, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, null, null, ?,
               now(), now(), ?, ?, 1)
       on conflict (tenant_id, idempotency_key) do nothing
       returning id, to_jsonb(billing.charge_captures.*) as snapshot`,
      [
        charge.tenantId,
        charge.practiceId,
        charge.patientProfileId,
        charge.encounterId,
        charge.sourceKind === 'BED_DAY'
          ? BILL.CHG_SRC_BED_DAY
          : BILL.CHG_SRC_OR_TIME,
        charge.sourceRefId,
        charge.serviceDate,
        charge.careSpaceId,
        charge.bedCategoryConceptId,
        tariff?.id ?? null,
        tariff?.serviceCatalogId ?? null,
        charge.minimumStay,
        String(charge.quantity),
        tariff?.unitPrice ?? null,
        tariff?.currencyConceptId ?? null,
        charge.costCenterId,
        BILL.CHG_PENDING,
        charge.idempotencyKey,
        charge.actorUserId,
        charge.actorUserId,
      ],
    );
    return rows[0] ?? null;
  }
}
