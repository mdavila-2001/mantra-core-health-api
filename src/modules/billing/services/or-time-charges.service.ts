import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { CONCEPTS } from '../../../common';
import { AUD } from '../../audit/audit.concepts';
import { HistoryRepository } from '../../audit/repositories';
import { PERIOP } from '../../procedures_perioperative/procedures_perioperative.concepts';
import { BILL } from '../billing.concepts';
import { orTimeKey } from '../domain/bed-day-rules';
import {
  billableInterval,
  intervalMinutes,
  orTimeUnits,
  type OrCaseTimes,
} from '../domain/or-time-rules';
import { pickOrTimeTariff, type TariffCandidate } from '../domain/tariff-rules';
import { isValidTimeZone, localDate } from '../domain/zoned-time';
import type { OrTimeRunResultDto } from '../dto';
import { readBedDaySettings } from './bed-day-settings';
import { ChargeAccrualSupport } from './charge-accrual.support';
import { CHARGE_EVENTS, ChargeEventsService } from './charge-events.service';
import { enterSystemContext, postgresViolation } from './pg-error';

/** Lo que pide el devengo de quirófano. */
export interface OrTimeRunInput {
  /** Sólo este caso. */
  readonly caseId?: string;
  /** Ahora (inyectable para pruebas). */
  readonly now?: Date;
}

/** Caso completado con lo que el cobro necesita. */
interface CaseRow {
  id: string;
  tenant_id: string;
  patient_profile_id: string;
  encounter_id: string | null;
  operating_room_id: string | null;
  actual_start_at: Date | null;
  actual_end_at: Date | null;
  updated_at: Date;
  practice_id: string;
  tz: string | null;
}

/** Cargo existente de un caso. */
interface ExistingRow {
  id: string;
  status_concept_id: string;
  unit_price: string | null;
}

/** Escaneo máximo de la primera consulta (cada práctica acota con su ajuste). */
const SCAN_DAYS = 33;

/**
 * Cargo del uso de quirófano **por tiempo** (CONTRATO-F2-F5 F5e).
 *
 * Al pasar un caso a `CASE_COMPLETED` (con la Salida del check-list OMS hecha) se
 * devenga un cargo con
 * `minutos = PATIENT_OUT_OF_ROOM − PATIENT_IN_ROOM` (si falta alguno de los dos
 * hechos de sala, `actual_end_at − actual_start_at`) y
 * `unidades = max(minimum_units, ceil(minutos ÷ unit_minutes))`, con la tarifa de la
 * sala o la general de quirófano vigente en la fecha del inicio del caso.
 *
 * Los hechos de sala los registra el módulo de quirófanos en
 * `operating_room_utilization_events`; este servicio sólo los **lee** (Facturación
 * no edita la ocupación ni los tiempos). Es idempotente (`ORTIME:<caso>` y el único
 * parcial por caso) y sin tarifa vigente deja el cargo pendiente sin precio.
 *
 * Corre sin contexto de tenant: cada transacción fija el contexto de SISTEMA.
 */
@Injectable()
export class OrTimeChargesService {
  /**
   * @param em - Contexto de persistencia.
   * @param support - SQL compartido del devengo.
   * @param events - Outbox.
   * @param historyRepo - Historia append-only.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly support: ChargeAccrualSupport,
    private readonly events: ChargeEventsService,
    private readonly historyRepo: HistoryRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(OrTimeChargesService.name);
  }

  /**
   * `POST /internal/billing/or-time-charges/run`.
   *
   * @param input - Caso concreto, o todos los completados en la ventana.
   */
  async run(input: OrTimeRunInput = {}): Promise<OrTimeRunResultDto> {
    const now = input.now ?? new Date();
    const result = {
      cases: 0,
      created: 0,
      alreadyCaptured: 0,
      tariffMissing: 0,
      notChargeable: 0,
      failed: 0,
    };
    const scanFrom = new Date(now.getTime() - SCAN_DAYS * 86_400_000);
    const cases = await this.em.transactional(async (tx) => {
      await enterSystemContext(tx);
      const rows = await tx.execute<CaseRow[]>(
        `select pc.id, pc.custodian_tenant_id as tenant_id, pc.patient_profile_id, pc.encounter_id,
                pc.operating_room_id, pc.actual_start_at, pc.actual_end_at, pc.updated_at,
                s.practice_id, coalesce(s.time_zone, p.time_zone) as tz
           from procedures_perioperative.procedure_cases pc
           join practice.practice_sites s
             on s.id = coalesce(pc.practice_site_id,
                                (select cs.practice_site_id from practice.care_spaces cs
                                  where cs.id = pc.operating_room_id))
            and s.tenant_id = pc.custodian_tenant_id
           join practice.practices p on p.id = s.practice_id
          where pc.status_concept_id = ?
            ${input.caseId ? 'and pc.id = ?' : 'and pc.updated_at >= ?'}
          order by pc.updated_at, pc.id`,
        [CONCEPTS.CASE_COMPLETED, input.caseId ?? scanFrom],
      );
      const settings = new Map<string, number>();
      const selected: CaseRow[] = [];
      for (const row of rows) {
        if (!settings.has(row.practice_id))
          settings.set(
            row.practice_id,
            (await readBedDaySettings(tx, row.practice_id)).lookbackDays,
          );
        const from =
          now.getTime() - (settings.get(row.practice_id)! + 1) * 86_400_000;
        if (input.caseId || new Date(row.updated_at).getTime() >= from)
          selected.push(row);
      }
      return selected;
    });

    const tariffs = new Map<string, TariffCandidate[]>();
    for (const row of cases) {
      result.cases += 1;
      try {
        await this.em.transactional(async (tx) => {
          await enterSystemContext(tx);
          if (!tariffs.has(row.practice_id))
            tariffs.set(
              row.practice_id,
              await this.support.loadTariffs(
                tx,
                row.practice_id,
                BILL.TARIFF_OR_TIME,
              ),
            );
          await this.captureOne(tx, row, tariffs.get(row.practice_id)!, result);
        });
      } catch (error) {
        const violation = postgresViolation(error);
        if (violation?.sqlstate === '23505') {
          result.alreadyCaptured += 1;
          continue;
        }
        result.failed += 1;
        this.logger.error(
          {
            operation: 'billing.or_time.case',
            caseId: row.id,
            sqlstate: violation?.sqlstate,
          },
          'No se pudo devengar el tiempo de quirófano del caso',
        );
      }
    }
    return result;
  }

  private async captureOne(
    tx: EntityManager,
    row: CaseRow,
    tariffs: readonly TariffCandidate[],
    result: {
      created: number;
      alreadyCaptured: number;
      tariffMissing: number;
      notChargeable: number;
    },
  ): Promise<void> {
    if (!row.encounter_id || !isValidTimeZone(row.tz)) {
      result.notChargeable += 1;
      return;
    }
    const times = await this.timesOf(tx, row);
    const interval = billableInterval(times);
    if (!interval || intervalMinutes(interval) <= 0) {
      result.notChargeable += 1;
      this.logger.warn(
        { operation: 'billing.or_time.timing', caseId: row.id },
        'El caso completado no tiene tiempos de sala utilizables: no se devenga',
      );
      return;
    }
    const minutes = intervalMinutes(interval);
    const serviceDate = localDate(interval.start, row.tz as string);
    const tariff = pickOrTimeTariff(
      tariffs,
      row.operating_room_id,
      serviceDate,
    );
    const quantity =
      tariff && tariff.unitMinutes
        ? orTimeUnits(minutes, tariff.unitMinutes, tariff.minimumUnits)
        : 1;
    const costCenterId = row.operating_room_id
      ? await this.support.costCenterOfSpace(tx, row.operating_room_id)
      : null;

    const existing = await tx.execute<ExistingRow[]>(
      `select id, status_concept_id, unit_price::text as unit_price
         from billing.charge_captures
        where tenant_id = ? and idempotency_key = ?`,
      [row.tenant_id, orTimeKey(row.id)],
    );
    if (existing.length > 0) {
      const charge = existing[0];
      // Un pendiente sin precio se completa cuando aparece la tarifa; lo demás no se toca.
      if (
        charge.status_concept_id === BILL.CHG_PENDING &&
        charge.unit_price === null &&
        tariff
      ) {
        const rows = await tx.execute<{ snapshot: unknown }[]>(
          `update billing.charge_captures c
              set quantity = ?::numeric, space_tariff_id = ?, service_catalog_id = ?,
                  unit_price = ?::numeric, currency_concept_id = ?,
                  cost_center_id = coalesce(?, c.cost_center_id),
                  updated_at = now(), row_version = row_version + 1
            where c.id = ? and c.status_concept_id = ?
            returning to_jsonb(c.*) as snapshot`,
          [
            String(quantity),
            tariff.id,
            tariff.serviceCatalogId,
            tariff.unitPrice,
            tariff.currencyConceptId,
            costCenterId,
            charge.id,
            BILL.CHG_PENDING,
          ],
        );
        if (rows.length > 0)
          await this.historyRepo.append(tx, 'charge_captures', charge.id, {
            operationConceptId: AUD.OPERATION_UPDATE,
            dataSnapshot: rows[0].snapshot,
            tenantId: row.tenant_id,
          });
        return;
      }
      result.alreadyCaptured += 1;
      return;
    }

    const inserted = await this.support.insertIfAbsent(tx, {
      tenantId: row.tenant_id,
      practiceId: row.practice_id,
      patientProfileId: row.patient_profile_id,
      encounterId: row.encounter_id,
      sourceKind: 'OR_TIME',
      sourceRefId: row.id,
      serviceDate,
      careSpaceId: row.operating_room_id,
      bedCategoryConceptId: null,
      tariff,
      quantity,
      minimumStay: false,
      costCenterId,
      idempotencyKey: orTimeKey(row.id),
      actorUserId: null,
    });
    if (!inserted) {
      result.alreadyCaptured += 1;
      return;
    }
    await this.historyRepo.append(tx, 'charge_captures', inserted.id, {
      operationConceptId: AUD.OPERATION_INSERT,
      dataSnapshot: inserted.snapshot,
      tenantId: row.tenant_id,
      firstRevision: true,
    });
    const base = {
      chargeCaptureId: inserted.id,
      encounterId: row.encounter_id,
      sourceKind: 'OR_TIME',
      serviceDate,
      careSpaceId: row.operating_room_id,
      procedureCaseId: row.id,
    };
    await this.events.publish(tx, {
      type: CHARGE_EVENTS.chargeCreated,
      aggregateType: 'charge_capture',
      aggregateId: inserted.id,
      tenantId: row.tenant_id,
      actorUserId: null,
      payload: {
        ...base,
        minutes: Math.round(minutes * 100) / 100,
        timeSource: interval.source,
        quantity: String(quantity),
        unitPrice: tariff?.unitPrice ?? null,
      },
    });
    result.created += 1;
    if (!tariff) {
      await this.events.publish(tx, {
        type: CHARGE_EVENTS.tariffMissing,
        aggregateType: 'charge_capture',
        aggregateId: inserted.id,
        tenantId: row.tenant_id,
        actorUserId: null,
        payload: { ...base, tariffKind: 'TARIFF_OR_TIME' },
      });
      result.tariffMissing += 1;
    }
  }

  /** Hechos de sala del caso (entrada y salida del paciente) y su inicio y fin reales. */
  private async timesOf(tx: EntityManager, row: CaseRow): Promise<OrCaseTimes> {
    const events = await tx.execute<
      { event_type_concept_id: string; first_at: Date; last_at: Date }[]
    >(
      `select event_type_concept_id, min(occurred_at) as first_at, max(occurred_at) as last_at
         from procedures_perioperative.operating_room_utilization_events
        where procedure_case_id = ? and tenant_id = ? and event_type_concept_id in (?, ?)
        group by event_type_concept_id`,
      [
        row.id,
        row.tenant_id,
        PERIOP.OR_EVENT_PATIENT_IN_ROOM,
        PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
      ],
    );
    const find = (id: string) =>
      events.find((event) => event.event_type_concept_id === id);
    const inRoom = find(PERIOP.OR_EVENT_PATIENT_IN_ROOM);
    const outOfRoom = find(PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM);
    return {
      patientInRoomAt: inRoom ? new Date(inRoom.first_at) : null,
      patientOutOfRoomAt: outOfRoom ? new Date(outOfRoom.last_at) : null,
      actualStartAt: row.actual_start_at ? new Date(row.actual_start_at) : null,
      actualEndAt: row.actual_end_at ? new Date(row.actual_end_at) : null,
    };
  }
}
