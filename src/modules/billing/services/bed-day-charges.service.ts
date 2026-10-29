import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { PreconditionFailedException } from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { CLIN } from '../../clinical/clinical.concepts';
import { BILL } from '../billing.concepts';
import { BillingErrorReason } from '../billing.error-reasons';
import {
  bedDayKey,
  computeBedNights,
  type BedNight,
  type CategoryPeriod,
  type OccupancyPeriod,
} from '../domain/bed-day-rules';
import { pickBedDayTariff, type TariffCandidate } from '../domain/tariff-rules';
import {
  addDays,
  isIsoDay,
  isValidTimeZone,
  localDate,
  localMidnight,
} from '../domain/zoned-time';
import type { BedDayRunResultDto } from '../dto';
import { readBedDaySettings, type BedDaySettings } from './bed-day-settings';
import { ChargeAccrualSupport } from './charge-accrual.support';
import {
  CHARGE_COLUMNS,
  ChargeCapturesService,
  type ChargeRow,
} from './charge-captures.service';
import { CHARGE_EVENTS, ChargeEventsService } from './charge-events.service';
import { enterSystemContext, postgresViolation } from './pg-error';

/** Lo que pide el devengo. */
export interface BedDayRunInput {
  /** Fecha de servicio hasta la que se devenga (incluida). */
  readonly date?: string;
  /** Sólo este encuentro. */
  readonly encounterId?: string;
  /** Ahora (inyectable para pruebas). */
  readonly now?: Date;
}

/** Período de ocupación leído de `encounter_locations`. */
interface LocationRow {
  id: string;
  encounter_id: string;
  care_space_id: string;
  period_start: Date;
  period_end: Date | null;
  tenant_id: string;
  patient_profile_id: string;
  practice_id: string;
  site_id: string;
  tz: string | null;
}

interface CategoryRow {
  care_space_id: string;
  bed_category_concept_id: string;
  valid_from: Date;
  valid_to: Date | null;
}

/** Una escritura del devengo; cada una va en su propia transacción. */
type Operation =
  | {
      readonly kind: 'create';
      readonly night: BedNight;
      readonly revision: number;
    }
  | { readonly kind: 'void'; readonly charge: ChargeRow }
  | {
      readonly kind: 'update';
      readonly charge: ChargeRow;
      readonly night: BedNight;
    };

/** Un encuentro con todo lo que el cálculo necesita. */
interface EncounterWork {
  readonly encounterId: string;
  readonly tenantId: string;
  readonly practiceId: string;
  readonly patientProfileId: string;
  readonly timeZone: string;
  readonly periods: OccupancyPeriod[];
  readonly settings: BedDaySettings;
}

/** Razón con la que se anula un cargo pendiente cuya noche ya no corresponde. */
const OCCUPANCY_CORRECTED =
  'La ocupación del encuentro se corrigió: la noche ya no corresponde a este cargo';

/** Tope de encuentros por consulta de períodos. */
const CHUNK = 100;

/** Ventana máxima de la primera consulta (el ajuste de cada práctica la acota después). */
const SCAN_DAYS = 31 + 2;

/**
 * Devengo del día-cama por la **regla de medianoche** (CONTRATO-F2-F5 F5e,
 * decisión D7; `procesos/11`).
 *
 * Lee la ocupación que escribe la internación (`clinical.encounter_locations`) y
 * por cada medianoche local en que un paciente ocupa una cama censable crea un
 * cargo `CHG_PENDING`, con la categoría de cama vigente **en esa medianoche** y la
 * tarifa vigente en la fecha de servicio.
 *
 * Es **idempotente**: la clave `BEDDAY:<encuentro>:<fecha>` y
 * `ON CONFLICT (tenant_id, idempotency_key) DO NOTHING` hacen que reaplicarlo no
 * duplique, también cuando dos corridas se solapan. Si dos clientes armaran la
 * clave distinto, los otros tres únicos parciales de la tabla (encuentro+noche,
 * cama+noche) rechazan el segundo cargo: ese choque se cuenta y se registra, no
 * se cobra.
 *
 * Corrige lo pendiente por diferencia (un movimiento corregido después del cargo,
 * o una tarifa que apareció tarde): recalcula el precio de un pendiente sin
 * tarifa, y anula —con motivo y rastro— el pendiente cuya noche ya no
 * corresponde, abriendo uno nuevo con la clave `…:rN`. **Un cargo emitido no se
 * toca**: se anula a mano con motivo.
 *
 * Corre sin contexto de tenant (la tabla tiene RLS): cada transacción fija el
 * contexto de SISTEMA.
 */
@Injectable()
export class BedDayChargesService {
  /**
   * @param em - Contexto de persistencia.
   * @param support - SQL compartido del devengo.
   * @param captures - Anulación de cargos.
   * @param events - Outbox.
   * @param historyRepo - Historia append-only.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly support: ChargeAccrualSupport,
    private readonly captures: ChargeCapturesService,
    private readonly events: ChargeEventsService,
    private readonly historyRepo: HistoryRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BedDayChargesService.name);
  }

  /**
   * `POST /internal/billing/bed-day-charges/run`.
   *
   * @param input - Fecha de servicio y/o encuentro.
   * @returns Cuántos cargos se crearon, ya existían o chocaron.
   */
  async run(input: BedDayRunInput = {}): Promise<BedDayRunResultDto> {
    if (input.date !== undefined && !isIsoDay(input.date))
      throw new PreconditionFailedException(
        'La fecha debe ser un día válido con formato YYYY-MM-DD',
        { field: 'date' },
        BillingErrorReason.BED_DAY_DATE_INVALID,
      );
    const now = input.now ?? new Date();
    const result = {
      sites: 0,
      encounters: 0,
      created: 0,
      alreadyCaptured: 0,
      tariffMissing: 0,
      repriced: 0,
      voidedStale: 0,
      categoryMissing: 0,
      conflicts: 0,
      failed: 0,
      timeZoneMissing: 0,
    };

    const work = await this.em.transactional(async (tx) => {
      await enterSystemContext(tx);
      return this.collect(tx, input, now, result);
    });
    const tariffs = new Map<string, TariffCandidate[]>();

    for (const item of work) {
      result.encounters += 1;
      try {
        const ops = await this.em.transactional(async (tx) => {
          await enterSystemContext(tx);
          return this.plan(tx, item, input, now, tariffs, result);
        });
        for (const op of ops) await this.apply(op, item, tariffs, result);
      } catch (error) {
        result.failed += 1;
        this.logger.error(
          {
            operation: 'billing.bed_day.encounter',
            encounterId: item.encounterId,
            sqlstate: postgresViolation(error)?.sqlstate,
          },
          'No se pudo devengar el día-cama del encuentro',
        );
      }
    }
    return result;
  }

  /** Encuentros con ocupación de cama censable en la ventana, con todos sus períodos. */
  private async collect(
    tx: EntityManager,
    input: BedDayRunInput,
    now: Date,
    result: { sites: number; timeZoneMissing: number },
  ): Promise<EncounterWork[]> {
    const anchor = input.date
      ? new Date(`${addDays(input.date, 1)}T00:00:00Z`)
      : now;
    const scanFrom = new Date(anchor.getTime() - SCAN_DAYS * 86_400_000);
    const candidates = await tx.execute<LocationRow[]>(
      `${this.locationSelect()}
        where el.is_bed_assignment and el.location_status_concept_id in (?, ?)
          and el.period_start is not null and cs.censable is true
          and (el.period_end is null or el.period_end >= ?)
          ${input.encounterId ? 'and el.encounter_id = ?' : ''}
        order by el.encounter_id, el.period_start`,
      [
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_COMPLETED,
        scanFrom,
        ...(input.encounterId ? [input.encounterId] : []),
      ],
    );

    const settingsByPractice = new Map<string, BedDaySettings>();
    const selected = new Set<string>();
    for (const row of candidates) {
      if (!settingsByPractice.has(row.practice_id))
        settingsByPractice.set(
          row.practice_id,
          await readBedDaySettings(tx, row.practice_id),
        );
      const settings = settingsByPractice.get(row.practice_id)!;
      const from = new Date(
        anchor.getTime() - (settings.lookbackDays + 1) * 86_400_000,
      );
      const end = row.period_end ? new Date(row.period_end) : null;
      if (input.encounterId || end === null || end.getTime() >= from.getTime())
        selected.add(row.encounter_id);
    }
    result.sites = new Set(candidates.map((row) => row.site_id)).size;

    const encounterIds = [...selected];
    const work: EncounterWork[] = [];
    for (let i = 0; i < encounterIds.length; i += CHUNK) {
      const chunk = encounterIds.slice(i, i + CHUNK);
      const rows = await tx.execute<LocationRow[]>(
        `${this.locationSelect()}
          where el.is_bed_assignment and el.location_status_concept_id in (?, ?)
            and el.period_start is not null and cs.censable is true
            and el.encounter_id in (${chunk.map(() => '?').join(', ')})
          order by el.encounter_id, el.period_start`,
        [CLIN.LOCATION_ACTIVE, CLIN.LOCATION_COMPLETED, ...chunk],
      );
      const byEncounter = new Map<string, LocationRow[]>();
      for (const row of rows)
        byEncounter.set(row.encounter_id, [
          ...(byEncounter.get(row.encounter_id) ?? []),
          row,
        ]);
      for (const [encounterId, locations] of byEncounter) {
        const first = locations[0];
        if (!isValidTimeZone(first.tz)) {
          // Sin zona no se sabe cuándo es medianoche: no se adivina.
          result.timeZoneMissing += 1;
          this.logger.warn(
            {
              operation: 'billing.bed_day.time_zone',
              practiceId: first.practice_id,
            },
            'La sede no tiene zona horaria válida: no se devenga el día-cama',
          );
          continue;
        }
        work.push({
          encounterId,
          tenantId: first.tenant_id,
          practiceId: first.practice_id,
          patientProfileId: first.patient_profile_id,
          timeZone: first.tz as string,
          periods: locations.map((row) => ({
            id: row.id,
            careSpaceId: row.care_space_id,
            start: new Date(row.period_start),
            end: row.period_end ? new Date(row.period_end) : null,
          })),
          settings: settingsByPractice.get(first.practice_id)!,
        });
      }
    }
    return work;
  }

  private locationSelect(): string {
    return `select el.id, el.encounter_id, el.care_space_id, el.period_start, el.period_end, el.tenant_id,
            e.patient_profile_id, s.practice_id, s.id as site_id, coalesce(s.time_zone, p.time_zone) as tz
       from clinical.encounter_locations el
       join clinical.encounters e on e.id = el.encounter_id and e.tenant_id = el.tenant_id
       join practice.care_spaces cs on cs.id = el.care_space_id and cs.tenant_id = el.tenant_id
       join practice.practice_sites s on s.id = cs.practice_site_id
       join practice.practices p on p.id = s.practice_id`;
  }

  /** Qué escribir para un encuentro: crear lo que falta, recalcular y anular lo pendiente que cambió. */
  private async plan(
    tx: EntityManager,
    item: EncounterWork,
    input: BedDayRunInput,
    now: Date,
    tariffs: Map<string, TariffCandidate[]>,
    result: { categoryMissing: number; alreadyCaptured: number },
  ): Promise<Operation[]> {
    const spaceIds = [...new Set(item.periods.map((p) => p.careSpaceId))];
    const categoryRows = await tx.execute<CategoryRow[]>(
      `select care_space_id, bed_category_concept_id, valid_from, valid_to
         from practice.care_space_category_periods
        where care_space_id in (${spaceIds.map(() => '?').join(', ')})`,
      spaceIds,
    );
    const categories: CategoryPeriod[] = categoryRows.map((row) => ({
      careSpaceId: row.care_space_id,
      categoryConceptId: row.bed_category_concept_id,
      validFrom: new Date(row.valid_from),
      validTo: row.valid_to ? new Date(row.valid_to) : null,
    }));
    const cap = input.date
      ? new Date(
          Math.min(
            now.getTime(),
            localMidnight(addDays(input.date, 1), item.timeZone).getTime(),
          ),
        )
      : now;
    const computed = computeBedNights({
      periods: item.periods,
      categories,
      timeZone: item.timeZone,
      cap,
      minimumOneDay: item.settings.minimumOneDay,
    });
    result.categoryMissing += computed.uncategorized.length;
    if (computed.uncategorized.length > 0)
      this.logger.warn(
        {
          operation: 'billing.bed_day.category_missing',
          encounterId: item.encounterId,
          nights: computed.uncategorized.length,
        },
        'Camas sin categoría vigente en la medianoche: no se devengan por defecto',
      );

    if (!tariffs.has(item.practiceId))
      tariffs.set(
        item.practiceId,
        await this.support.loadTariffs(
          tx,
          item.practiceId,
          BILL.TARIFF_BED_DAY,
        ),
      );

    const existing = await tx.execute<ChargeRow[]>(
      `select ${CHARGE_COLUMNS} from billing.charge_captures c
        where c.tenant_id = ? and c.encounter_id = ? and c.source_kind_concept_id = ?
        order by c.service_date, c.created_at`,
      [item.tenantId, item.encounterId, BILL.CHG_SRC_BED_DAY],
    );
    const byDate = new Map<string, ChargeRow[]>();
    for (const row of existing)
      byDate.set(row.service_date, [
        ...(byDate.get(row.service_date) ?? []),
        row,
      ]);

    const ops: Operation[] = [];
    const costCenters = new Map<string, string | null>();
    const costCenterOf = async (spaceId: string): Promise<string | null> => {
      if (!costCenters.has(spaceId))
        costCenters.set(
          spaceId,
          await this.support.costCenterOfSpace(tx, spaceId),
        );
      return costCenters.get(spaceId) ?? null;
    };
    const nightsByDate = new Map(
      computed.nights.map((n) => [n.serviceDate, n]),
    );
    const lastServiceDate = addDays(localDate(cap, item.timeZone), -1);

    for (const night of computed.nights) {
      const rows = byDate.get(night.serviceDate) ?? [];
      const active = rows.find((r) => r.status_concept_id !== BILL.CHG_VOIDED);
      if (!active) {
        // Anulado a mano: la anulación es una decisión y el devengo no la deshace.
        if (rows.length > 0) result.alreadyCaptured += 1;
        else ops.push({ kind: 'create', night, revision: 1 });
        continue;
      }
      if (active.status_concept_id !== BILL.CHG_PENDING) {
        result.alreadyCaptured += 1;
        continue;
      }
      if (
        active.care_space_id !== night.careSpaceId ||
        active.minimum_stay_charge !== night.minimumStay
      ) {
        ops.push({ kind: 'void', charge: active });
        ops.push({ kind: 'create', night, revision: rows.length + 1 });
        continue;
      }
      const tariff = pickBedDayTariff(
        tariffs.get(item.practiceId)!,
        night.careSpaceId,
        night.categoryConceptId,
        night.serviceDate,
      );
      const costCenter = await costCenterOf(night.careSpaceId);
      const changed =
        active.bed_category_concept_id !== night.categoryConceptId ||
        (tariff !== null &&
          (active.unit_price === null ||
            active.unit_price !== tariff.unitPrice ||
            active.currency_concept_id !== tariff.currencyConceptId)) ||
        (costCenter !== null && active.cost_center_id !== costCenter);
      if (changed) ops.push({ kind: 'update', charge: active, night });
      else result.alreadyCaptured += 1;
    }

    // Pendientes cuya noche ya no existe (movimiento corregido o cancelado).
    for (const row of existing) {
      if (row.status_concept_id !== BILL.CHG_PENDING) continue;
      if (row.service_date > lastServiceDate) continue;
      if (nightsByDate.has(row.service_date)) continue;
      ops.push({ kind: 'void', charge: row });
    }
    return ops;
  }

  /** Ejecuta una escritura en su propia transacción: un choque no arrastra a las demás. */
  private async apply(
    op: Operation,
    item: EncounterWork,
    tariffs: Map<string, TariffCandidate[]>,
    result: {
      created: number;
      alreadyCaptured: number;
      tariffMissing: number;
      repriced: number;
      voidedStale: number;
      conflicts: number;
      failed: number;
    },
  ): Promise<void> {
    try {
      await this.em.transactional(async (tx) => {
        await enterSystemContext(tx);
        if (op.kind === 'void') {
          const locked = await tx.execute<ChargeRow[]>(
            `select ${CHARGE_COLUMNS} from billing.charge_captures c
              where c.id = ? and c.status_concept_id = ? for update`,
            [op.charge.id, BILL.CHG_PENDING],
          );
          if (locked.length === 0) return;
          await this.captures.markVoided(
            tx,
            locked[0],
            OCCUPANCY_CORRECTED,
            null,
          );
          await this.events.publish(tx, {
            type: CHARGE_EVENTS.chargeVoided,
            aggregateType: 'charge_capture',
            aggregateId: op.charge.id,
            tenantId: item.tenantId,
            actorUserId: null,
            payload: this.captures.voidedPayload(
              locked[0],
              'OCCUPANCY_CORRECTION',
            ),
          });
          result.voidedStale += 1;
          return;
        }
        const tariff = pickBedDayTariff(
          tariffs.get(item.practiceId)!,
          op.night.careSpaceId,
          op.night.categoryConceptId,
          op.night.serviceDate,
        );
        const costCenterId = await this.support.costCenterOfSpace(
          tx,
          op.night.careSpaceId,
        );
        if (op.kind === 'update') {
          // Sin tarifa para la categoría nueva, el pendiente queda sin precio (la tarifa
          // vieja ya no aplica a la categoría); si la categoría no cambió, se conserva el
          // precio y sólo se completa el centro de costo.
          const keepPrice =
            tariff === null &&
            op.charge.bed_category_concept_id === op.night.categoryConceptId;
          const price = tariff
            ? {
                tariffId: tariff.id,
                serviceId: tariff.serviceCatalogId,
                unitPrice: tariff.unitPrice,
                currencyId: tariff.currencyConceptId,
              }
            : keepPrice
              ? {
                  tariffId: op.charge.space_tariff_id,
                  serviceId: op.charge.service_catalog_id,
                  unitPrice: op.charge.unit_price,
                  currencyId: op.charge.currency_concept_id,
                }
              : {
                  tariffId: null,
                  serviceId: null,
                  unitPrice: null,
                  currencyId: null,
                };
          const rows = await tx.execute<{ snapshot: unknown }[]>(
            `update billing.charge_captures c
                set bed_category_concept_id = ?, space_tariff_id = ?, service_catalog_id = ?,
                    unit_price = ?::numeric, currency_concept_id = ?,
                    cost_center_id = coalesce(?, c.cost_center_id),
                    updated_at = now(), row_version = row_version + 1
              where c.id = ? and c.status_concept_id = ?
              returning to_jsonb(c.*) as snapshot`,
            [
              op.night.categoryConceptId,
              price.tariffId,
              price.serviceId,
              price.unitPrice,
              price.currencyId,
              costCenterId,
              op.charge.id,
              BILL.CHG_PENDING,
            ],
          );
          if (rows.length === 0) return;
          await this.historyRepo.append(tx, 'charge_captures', op.charge.id, {
            operationConceptId: AUD.OPERATION_UPDATE,
            dataSnapshot: rows[0].snapshot,
            tenantId: item.tenantId,
          });
          result.repriced += 1;
          return;
        }
        const inserted = await this.support.insertIfAbsent(tx, {
          tenantId: item.tenantId,
          practiceId: item.practiceId,
          patientProfileId: item.patientProfileId,
          encounterId: item.encounterId,
          sourceKind: 'BED_DAY',
          sourceRefId: op.night.occupancyId,
          serviceDate: op.night.serviceDate,
          careSpaceId: op.night.careSpaceId,
          bedCategoryConceptId: op.night.categoryConceptId,
          tariff,
          quantity: 1,
          minimumStay: op.night.minimumStay,
          costCenterId,
          idempotencyKey: bedDayKey(
            item.encounterId,
            op.night.serviceDate,
            op.revision,
          ),
          actorUserId: null,
        });
        if (!inserted) {
          result.alreadyCaptured += 1;
          return;
        }
        await this.historyRepo.append(tx, 'charge_captures', inserted.id, {
          operationConceptId: AUD.OPERATION_INSERT,
          dataSnapshot: inserted.snapshot,
          tenantId: item.tenantId,
          firstRevision: true,
        });
        const base = {
          chargeCaptureId: inserted.id,
          encounterId: item.encounterId,
          sourceKind: 'BED_DAY',
          serviceDate: op.night.serviceDate,
          careSpaceId: op.night.careSpaceId,
        };
        await this.events.publish(tx, {
          type: CHARGE_EVENTS.chargeCreated,
          aggregateType: 'charge_capture',
          aggregateId: inserted.id,
          tenantId: item.tenantId,
          actorUserId: null,
          payload: {
            ...base,
            bedCategoryConceptId: op.night.categoryConceptId,
            quantity: '1',
            unitPrice: tariff?.unitPrice ?? null,
            minimumStay: op.night.minimumStay,
          },
        });
        result.created += 1;
        if (!tariff) {
          await this.events.publish(tx, {
            type: CHARGE_EVENTS.tariffMissing,
            aggregateType: 'charge_capture',
            aggregateId: inserted.id,
            tenantId: item.tenantId,
            actorUserId: null,
            payload: {
              ...base,
              tariffKind: 'TARIFF_BED_DAY',
              bedCategoryConceptId: op.night.categoryConceptId,
            },
          });
          result.tariffMissing += 1;
        }
      });
    } catch (error) {
      const violation = postgresViolation(error);
      if (violation?.sqlstate === '23505') {
        // Otro cargo ya ocupa esa cama o esa noche con una clave distinta: la base
        // impide el doble cobro y el devengo lo informa sin reintentar.
        result.conflicts += 1;
        this.logger.warn(
          {
            operation: 'billing.bed_day.conflict',
            encounterId: item.encounterId,
            constraint: violation.constraint,
          },
          'La noche ya está cobrada con otra clave: no se vuelve a cobrar',
        );
        return;
      }
      result.failed += 1;
      this.logger.error(
        {
          operation: 'billing.bed_day.apply',
          encounterId: item.encounterId,
          sqlstate: violation?.sqlstate,
        },
        'No se pudo escribir un cargo de día-cama',
      );
    }
  }
}
