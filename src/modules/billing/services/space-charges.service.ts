import { Injectable, type OnModuleInit, Inject } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { CONCEPTS } from '../../../common/constants/concepts';
import { InsufficientRoleException } from '../../../common/errors/domain.exception';
import { OutboxService } from '../../messaging/services/outbox.service';
import { CLIN } from '../../clinical/clinical.concepts';
import { zoneOffsetMinutes } from '../../clinical/domain/inpatient/census';
import { PRAC } from '../../practice/practice.concepts';
import type { InfraPolicy } from '../../practice/domain/ops/infra-scope';
import {
  INFRA_POLICIES,
  InfrastructureAccessService,
  type InfraPolicyRegistry,
} from '../../practice/services/infrastructure-access.service';
import { translateInfraWriteError } from '../../practice/services/ops/ops-errors';
import { BILL } from '../billing.concepts';
import { PERIOP } from '../../procedures_perioperative/procedures_perioperative.concepts';
import { BillingErrorReason } from '../billing.error-reasons';
import { ChargeCaptures, SpaceTariffs } from '../entities';
import { bedDays, orTimeUnits } from '../domain/space-charges';

/** Acciones de F5e (CONTRATO-F2-F5 §F5e, permisos). */
export const INFRA_F5E_POLICY: InfraPolicy = {
  name: 'F5e',
  actions: {
    'f5e.tariff.write': {
      roles: ['ORG_ADMIN', 'BILLING'],
      globalRoles: ['BILLING'],
    },
    'f5e.tariff.read': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'SITE_ADMIN', 'BILLING'],
      globalRoles: ['BILLING'],
    },
    'f5e.charge.write': { roles: ['BILLING'], globalRoles: ['BILLING'] },
    'f5e.charge.read': {
      roles: ['SUPERADMIN', 'ORG_ADMIN', 'SITE_ADMIN', 'BILLING'],
      globalRoles: ['BILLING'],
    },
  },
};

/** Registra la política de F5e al arrancar `billing`. */
@Injectable()
export class InfraF5ePolicyRegistrar implements OnModuleInit {
  constructor(
    @Inject(INFRA_POLICIES) private readonly registry: InfraPolicyRegistry,
  ) {}

  /** @inheritdoc */
  onModuleInit(): void {
    this.registry.register(INFRA_F5E_POLICY);
  }
}

/** Alta de tarifa. */
export interface CreateSpaceTariffInput {
  practiceId: string;
  tariffKind: 'BED_DAY' | 'OR_TIME';
  bedCategoryCode?: string;
  careSpaceId?: string;
  serviceCatalogId: string;
  unitMinutes?: number;
  minimumUnits?: number;
  unitPrice: string;
  currencyConceptId?: string;
  validFrom: string;
  validTo?: string;
}

/** Petición de facturación (`actor` null = worker). */
export interface BillingRequest {
  readonly actor: AuthenticatedUser | null;
  readonly tenantId: string | null;
  readonly requestId?: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Vista de un cargo devengado. */
function chargeView(c: ChargeCaptures): Record<string, unknown> {
  return {
    id: c.id,
    encounterId: c.encounterId ?? null,
    source:
      c.sourceKindConceptId === BILL.CHG_SRC_BED_DAY ? 'BED_DAY' : 'OR_TIME',
    sourceRefId: c.sourceRefId,
    serviceDate: String(
      c.serviceDate instanceof Date
        ? c.serviceDate.toISOString()
        : c.serviceDate,
    ).slice(0, 10),
    careSpaceId: c.careSpaceId ?? null,
    bedCategoryConceptId: c.bedCategoryConceptId ?? null,
    spaceTariffId: c.spaceTariffId ?? null,
    quantity: String(c.quantity),
    unitPrice:
      c.unitPrice === undefined || c.unitPrice === null
        ? null
        : String(c.unitPrice),
    costCenterId: c.costCenterId ?? null,
    status:
      c.statusConceptId === BILL.CHG_PENDING
        ? 'CHG_PENDING'
        : c.statusConceptId === BILL.CHG_INVOICED
          ? 'CHG_INVOICED'
          : 'CHG_VOIDED',
    idempotencyKey: c.idempotencyKey,
  };
}

/**
 * Cargos de espacio (F5e): tarifas con vigencia, devengo de día-cama por la
 * regla de medianoche (idempotente por `BEDDAY:<encuentro>:<fecha>`), uso de
 * quirófano por unidades (`ORTIME:<caso>`), lectura de pendientes y anulación.
 * La autorización es de facturación a nivel práctica/sede (§0.3); el worker
 * corre con contexto SYSTEM dentro de su transacción.
 */
@Injectable()
export class SpaceChargesService {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly outbox: OutboxService,
  ) {}

  // --- Tarifas -----------------------------------------------------------------

  /**
   * `GET /billing/space-tariffs?practiceId`.
   *
   * @param practiceId - Práctica.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async listTariffs(
    practiceId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ) {
    const em = this.em.fork();
    await this.assertPractice(
      em,
      actor,
      practiceId,
      tenantId,
      'f5e.tariff.read',
    );
    const rows = await em.find(
      SpaceTariffs,
      { practiceId },
      { orderBy: { validFrom: 'desc' }, limit: 500 },
    );
    return this.tariffViews(em, rows);
  }

  /**
   * `POST /billing/space-tariffs`.
   *
   * @param input - Tarifa.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  createTariff(
    input: CreateSpaceTariffInput,
    actor: AuthenticatedUser,
    tenantId: string,
  ) {
    return this.em.transactional(async (tx) => {
      await this.assertPractice(
        tx,
        actor,
        input.practiceId,
        tenantId,
        'f5e.tariff.write',
      );
      if (
        !DATE_RE.test(input.validFrom) ||
        (input.validTo && !DATE_RE.test(input.validTo))
      ) {
        throw new PreconditionFailedException(
          'Vigencia inválida',
          {},
          BillingErrorReason.TARIFF_OVERLAP,
        );
      }
      if (input.tariffKind === 'OR_TIME' && !(Number(input.unitMinutes) > 0)) {
        throw new PreconditionFailedException(
          'La tarifa de quirófano necesita minutos por unidad',
          {},
          BillingErrorReason.TARIFF_UNIT_MINUTES_REQUIRED,
        );
      }
      const [svc] = await tx.execute<{ id: string }[]>(
        'SELECT id FROM billing.service_catalog WHERE id = ? AND practice_id = ?',
        [input.serviceCatalogId, input.practiceId],
        'all',
      );
      if (!svc) {
        throw new PreconditionFailedException(
          'El servicio no es de la práctica',
          {},
          BillingErrorReason.TARIFF_SERVICE_NOT_IN_PRACTICE,
        );
      }
      if (input.careSpaceId) {
        const [space] = await tx.execute<{ id: string }[]>(
          `SELECT c.id FROM practice.care_spaces c JOIN practice.practice_sites s ON s.id = c.practice_site_id
            WHERE c.id = ? AND s.practice_id = ? AND c.tenant_id = ?`,
          [input.careSpaceId, input.practiceId, tenantId],
          'all',
        );
        if (!space)
          throw new ResourceNotFoundException('Espacio no encontrado', {
            careSpaceId: input.careSpaceId,
          });
      }
      const bedCategory = input.bedCategoryCode
        ? PRAC[input.bedCategoryCode as keyof typeof PRAC]
        : undefined;
      if (
        input.bedCategoryCode &&
        (!input.bedCategoryCode.startsWith('BED_CAT_') || !bedCategory)
      ) {
        throw new PreconditionFailedException(
          'Categoría de cama desconocida',
          {},
          BillingErrorReason.TARIFF_OVERLAP,
        );
      }
      const now = new Date();
      const tariff = tx.create(
        SpaceTariffs,
        {
          tenantId,
          practiceId: input.practiceId,
          tariffKindConceptId:
            input.tariffKind === 'BED_DAY'
              ? BILL.TARIFF_BED_DAY
              : BILL.TARIFF_OR_TIME,
          bedCategoryConceptId: bedCategory,
          careSpaceId: input.careSpaceId,
          serviceCatalogId: input.serviceCatalogId,
          unitMinutes: input.unitMinutes,
          minimumUnits: input.minimumUnits,
          unitPrice: input.unitPrice,
          currencyConceptId: input.currencyConceptId,
          validFrom: input.validFrom,
          validTo: input.validTo,
          statusConceptId: CONCEPTS.STATE_ACTIVE,
          createdAt: now,
          updatedAt: now,
          createdByUserId: actor.id,
          updatedByUserId: actor.id,
        } as never,
        { partial: true },
      );
      await this.flush(tx);
      await this.publish(
        tx,
        'billing.space_tariff.created',
        tenantId,
        'billing.space_tariffs',
        tariff.id,
        { tariffId: tariff.id, practiceId: input.practiceId },
        actor.id,
      );
      return (await this.tariffViews(tx, [tariff]))[0];
    });
  }

  /**
   * `POST /billing/space-tariffs/:id/close {validTo}`.
   *
   * @param tariffId - Tarifa.
   * @param validTo - Fin (exclusivo).
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  closeTariff(
    tariffId: string,
    validTo: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ) {
    return this.em.transactional(async (tx) => {
      const tariff = await tx.findOne(SpaceTariffs, { id: tariffId });
      if (!tariff || tariff.tenantId !== tenantId)
        throw new ResourceNotFoundException('Tarifa no encontrada', {
          tariffId,
        });
      await this.assertPractice(
        tx,
        actor,
        tariff.practiceId,
        tenantId,
        'f5e.tariff.write',
      );
      if (
        !DATE_RE.test(validTo) ||
        validTo <= String(tariff.validFrom).slice(0, 10)
      ) {
        throw new PreconditionFailedException(
          'El fin debe ser posterior al inicio',
          {},
          BillingErrorReason.TARIFF_OVERLAP,
        );
      }
      (tariff as unknown as { validTo: string }).validTo = validTo;
      tariff.updatedAt = new Date();
      tariff.updatedByUserId = actor.id;
      await this.flush(tx);
      await this.publish(
        tx,
        'billing.space_tariff.closed',
        tenantId,
        'billing.space_tariffs',
        tariff.id,
        { tariffId: tariff.id, validTo },
        actor.id,
      );
      return (await this.tariffViews(tx, [tariff]))[0];
    });
  }

  // --- Devengo -----------------------------------------------------------------

  /**
   * Día-cama de un encuentro (`POST /billing/encounters/:id/bed-day-charges/run`
   * y el worker). Idempotente: una fecha ya devengada no se repite.
   *
   * @param encounterId - Encuentro.
   * @param req - Actor y tenant (null = worker).
   */
  runBedDays(encounterId: string, req: BillingRequest) {
    return this.em.transactional(async (tx) => {
      if (!req.actor)
        await tx.execute(
          "select set_config('app.system_context', 'true', true)",
        );
      const enc = await this.encounter(tx, encounterId, req);
      const locations = await tx.execute<
        {
          id: string;
          care_space_id: string;
          practice_site_id: string;
          clinical_unit_id: string | null;
          period_start: string;
          period_end: string | null;
        }[]
      >(
        `SELECT id, care_space_id, practice_site_id, clinical_unit_id, period_start, period_end
           FROM clinical.encounter_locations
          WHERE encounter_id = ? AND is_bed_assignment AND location_status_concept_id IN (?, ?)
          ORDER BY period_start`,
        [encounterId, CLIN.LOCATION_ACTIVE, CLIN.LOCATION_COMPLETED],
        'all',
      );
      if (locations.length === 0) return { created: [], skipped: 0 };
      if (req.actor)
        await this.assertSites(
          tx,
          req,
          [...new Set(locations.map((l) => l.practice_site_id))],
          'f5e.charge.write',
        );
      const [site] = await tx.execute<
        { time_zone: string | null; practice_id: string }[]
      >(
        'SELECT time_zone, practice_id FROM practice.practice_sites WHERE id = ?',
        [locations[0].practice_site_id],
        'all',
      );
      const tz = site?.time_zone ?? 'America/La_Paz';
      const until = enc.end_at ? new Date(enc.end_at) : new Date();
      const days = bedDays(
        locations.map((l) => ({
          careSpaceId: l.care_space_id,
          start: new Date(l.period_start),
          end: l.period_end ? new Date(l.period_end) : null,
        })),
        zoneOffsetMinutes(tz, until),
        until,
        true,
        !!enc.end_at,
      );
      const created: Record<string, unknown>[] = [];
      let skipped = 0;
      for (const day of days) {
        const key = `BEDDAY:${encounterId}:${day.serviceDate}`;
        if (await tx.findOne(ChargeCaptures, { idempotencyKey: key })) {
          skipped += 1;
          continue;
        }
        const loc =
          locations.find((l) => l.care_space_id === day.careSpaceId) ??
          locations[0];
        const [cat] = await tx.execute<{ category: string | null }[]>(
          `SELECT coalesce(
             (SELECT bed_category_concept_id FROM practice.care_space_category_periods
               WHERE care_space_id = ? AND valid_from <= ? AND (valid_to IS NULL OR valid_to > ?)
               ORDER BY valid_from DESC LIMIT 1),
             (SELECT bed_category_concept_id FROM practice.care_spaces WHERE id = ?)) AS category`,
          [day.careSpaceId, day.midnight, day.midnight, day.careSpaceId],
          'all',
        );
        const category = cat?.category ?? null;
        const tariff = await this.tariffFor(
          tx,
          site.practice_id,
          BILL.TARIFF_BED_DAY,
          day.careSpaceId,
          category,
          day.serviceDate,
        );
        created.push(
          await this.capture(tx, {
            tenantId: enc.tenant_id,
            practiceId: site.practice_id,
            patientProfileId: enc.patient_profile_id,
            encounterId,
            source: BILL.CHG_SRC_BED_DAY,
            sourceRefId: loc.id,
            serviceDate: day.serviceDate,
            careSpaceId: day.careSpaceId,
            bedCategoryConceptId: category,
            tariff,
            quantity: 1,
            unitId: loc.clinical_unit_id,
            key,
            actorId: req.actor?.id,
          }),
        );
      }
      return { created, skipped };
    });
  }

  /**
   * Uso de quirófano por tiempo de los casos completados sin cargo (worker).
   * Minutos = OUT_OF_ROOM − IN_ROOM (o fin − inicio reales); unidades =
   * `max(mínimo, ceil(min ÷ unidad))`; tarifa de la sala o la general.
   */
  runOrTime() {
    return this.em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      const cases = await tx.execute<
        {
          id: string;
          tenant_id: string;
          patient_profile_id: string;
          encounter_id: string | null;
          operating_room_id: string;
          practice_id: string;
          minutes: number | null;
          service_date: string;
        }[]
      >(
        `SELECT c.id, c.custodian_tenant_id AS tenant_id, c.patient_profile_id, c.encounter_id, c.operating_room_id,
                s.practice_id, to_char(coalesce(c.actual_end_at, c.scheduled_end_at), 'YYYY-MM-DD') AS service_date,
                coalesce(
                  extract(epoch FROM (
                    (SELECT max(occurred_at) FROM procedures_perioperative.operating_room_utilization_events
                      WHERE procedure_case_id = c.id AND event_type_concept_id = ?) -
                    (SELECT min(occurred_at) FROM procedures_perioperative.operating_room_utilization_events
                      WHERE procedure_case_id = c.id AND event_type_concept_id = ?))) / 60,
                  extract(epoch FROM (c.actual_end_at - c.actual_start_at)) / 60) AS minutes
           FROM procedures_perioperative.procedure_cases c
           JOIN practice.care_spaces r ON r.id = c.operating_room_id
           JOIN practice.practice_sites s ON s.id = r.practice_site_id
          WHERE c.status_concept_id = ?
            AND NOT EXISTS (SELECT 1 FROM billing.charge_captures k WHERE k.idempotency_key = 'ORTIME:' || c.id::text)
          LIMIT 200`,
        [
          PERIOP.OR_EVENT_PATIENT_OUT_OF_ROOM,
          PERIOP.OR_EVENT_PATIENT_IN_ROOM,
          CONCEPTS.CASE_COMPLETED,
        ],
        'all',
      );
      let created = 0;
      for (const c of cases) {
        const tariff = await this.tariffFor(
          tx,
          c.practice_id,
          BILL.TARIFF_OR_TIME,
          c.operating_room_id,
          null,
          c.service_date,
        );
        const units = tariff
          ? orTimeUnits(
              Number(c.minutes ?? 0),
              Number(tariff.unit_minutes ?? 0),
              Number(tariff.minimum_units ?? 0),
            )
          : Math.ceil(Number(c.minutes ?? 0));
        await this.capture(tx, {
          tenantId: c.tenant_id,
          practiceId: c.practice_id,
          patientProfileId: c.patient_profile_id,
          encounterId: c.encounter_id,
          source: BILL.CHG_SRC_OR_TIME,
          sourceRefId: c.id,
          serviceDate: c.service_date,
          careSpaceId: c.operating_room_id,
          bedCategoryConceptId: null,
          tariff,
          quantity: units,
          unitId: null,
          key: `ORTIME:${c.id}`,
        });
        created += 1;
      }
      return { created };
    });
  }

  /**
   * `POST /internal/billing/bed-day-charges/run {date}` (SYSTEM): devenga los
   * días-cama de los encuentros con cama alrededor de la fecha y el uso de
   * quirófano pendiente. Idempotente.
   *
   * @param date - `yyyy-mm-dd` (por defecto, hoy UTC).
   */
  async runInternal(
    date?: string,
  ): Promise<{ encounters: number; bedDays: number; orTime: number }> {
    const d =
      date && DATE_RE.test(date) ? date : new Date().toISOString().slice(0, 10);
    const encounters = await this.em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return tx.execute<{ encounter_id: string }[]>(
        `SELECT DISTINCT encounter_id FROM clinical.encounter_locations
          WHERE is_bed_assignment AND location_status_concept_id IN (?, ?)
            AND period_start < (?::date + 2) AND (period_end IS NULL OR period_end >= (?::date - 1))
          LIMIT 5000`,
        [CLIN.LOCATION_ACTIVE, CLIN.LOCATION_COMPLETED, d, d],
        'all',
      );
    });
    let bedDaysCreated = 0;
    for (const e of encounters) {
      bedDaysCreated += (
        await this.runBedDays(e.encounter_id, { actor: null, tenantId: null })
      ).created.length;
    }
    const or = await this.runOrTime();
    return {
      encounters: encounters.length,
      bedDays: bedDaysCreated,
      orTime: or.created,
    };
  }

  /**
   * `GET /billing/encounters/:encounterId/pending-charges`.
   *
   * @param encounterId - Encuentro.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async pending(
    encounterId: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ) {
    const em = this.em.fork();
    const req = { actor, tenantId };
    await this.encounter(em, encounterId, req);
    // Objetivos de autorización: sedes de los movimientos del encuentro y de
    // los espacios de sus cargos. Sin sede, la práctica de los cargos. Sin
    // ninguna de las dos, se deniega (nunca se autoriza sobre una lista vacía).
    const sites = await em.execute<{ practice_site_id: string }[]>(
      `SELECT practice_site_id FROM clinical.encounter_locations
        WHERE encounter_id = ? AND tenant_id = ?
       UNION
       SELECT cs.practice_site_id
         FROM billing.charge_captures c
         JOIN practice.care_spaces cs ON cs.id = c.care_space_id
        WHERE c.encounter_id = ? AND c.tenant_id = ?`,
      [encounterId, tenantId, encounterId, tenantId],
      'all',
    );
    if (sites.length > 0) {
      await this.assertSites(
        em,
        req,
        sites.map((s) => s.practice_site_id),
        'f5e.charge.read',
      );
    } else {
      const practices = await em.execute<{ practice_id: string }[]>(
        'SELECT DISTINCT practice_id FROM billing.charge_captures WHERE encounter_id = ? AND tenant_id = ?',
        [encounterId, tenantId],
        'all',
      );
      if (practices.length === 0) this.denyWithoutTarget('f5e.charge.read');
      for (const p of practices)
        await this.assertPractice(
          em,
          actor,
          p.practice_id,
          tenantId,
          'f5e.charge.read',
        );
    }
    const rows = await em.find(
      ChargeCaptures,
      { encounterId, statusConceptId: BILL.CHG_PENDING },
      { orderBy: { serviceDate: 'asc' } },
    );
    return rows.map(chargeView);
  }

  /**
   * `POST /billing/charge-captures/:id/void {reason}`.
   *
   * @param chargeId - Cargo.
   * @param reason - Motivo.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  voidCharge(
    chargeId: string,
    reason: string,
    actor: AuthenticatedUser,
    tenantId: string,
  ) {
    return this.em.transactional(async (tx) => {
      const c = await tx.findOne(ChargeCaptures, { id: chargeId });
      if (!c || c.tenantId !== tenantId)
        throw new ResourceNotFoundException('Cargo no encontrado', {
          chargeId,
        });
      const [s] = c.careSpaceId
        ? await tx.execute<{ practice_site_id: string }[]>(
            'SELECT practice_site_id FROM practice.care_spaces WHERE id = ? AND tenant_id = ?',
            [c.careSpaceId, tenantId],
            'all',
          )
        : [];
      if (s) {
        await this.assertSites(
          tx,
          { actor, tenantId },
          [s.practice_site_id],
          'f5e.charge.write',
        );
      } else {
        await this.assertPractice(
          tx,
          actor,
          c.practiceId,
          tenantId,
          'f5e.charge.write',
        );
      }
      if (c.statusConceptId === BILL.CHG_INVOICED)
        throw new ConflictException(
          'El cargo ya está facturado',
          {},
          BillingErrorReason.CHARGE_ALREADY_INVOICED,
        );
      if (c.statusConceptId !== BILL.CHG_PENDING)
        throw new ConflictException(
          'El cargo no está pendiente',
          {},
          BillingErrorReason.CHARGE_NOT_PENDING,
        );
      c.statusConceptId = BILL.CHG_VOIDED;
      c.voidReason = reason;
      c.updatedAt = new Date();
      c.updatedByUserId = actor.id;
      await this.flush(tx);
      await this.publish(
        tx,
        'billing.charge_capture.voided',
        tenantId,
        'billing.charge_captures',
        c.id,
        { chargeCaptureId: c.id },
        actor.id,
      );
      return chargeView(c);
    });
  }

  /**
   * `GET /billing/bed-day/stays?siteId&from&to`: estancias de internación de
   * la sede con algún tramo en cama dentro del rango (por defecto, los
   * últimos 30 días hasta hoy), para que Facturación elija qué devengar.
   * Lectura de cargos a nivel sede (`f5e.charge.read`, el mismo criterio que
   * `pending-charges`): sin rol de nivel sede, 403. Del paciente sólo el
   * nombre para mostrar (lo que la factura necesita).
   *
   * @param q - Sede y rango `yyyy-mm-dd`.
   * @param actor - Actor.
   * @param tenantId - Tenant activo.
   */
  async stays(
    q: { siteId: string; from?: string; to?: string },
    actor: AuthenticatedUser,
    tenantId: string,
  ) {
    const em = this.em.fork();
    await this.assertSites(
      em,
      { actor, tenantId },
      [q.siteId],
      'f5e.charge.read',
    );
    const to =
      q.to && DATE_RE.test(q.to) ? q.to : new Date().toISOString().slice(0, 10);
    const from =
      q.from && DATE_RE.test(q.from)
        ? q.from
        : new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
    if (from > to || (Date.parse(to) - Date.parse(from)) / 86_400_000 > 366)
      throw new PreconditionFailedException(
        'Rango inválido (máximo 366 días)',
        { from, to },
        'STAYS_RANGE_INVALID',
      );
    const rows = await em.execute<
      {
        encounter_id: string;
        patient_profile_id: string;
        display_name: string | null;
        start_at: Date | null;
        end_at: Date | null;
        status_concept_id: string;
        bed_id: string | null;
        bed_code: string | null;
        bed_name: string | null;
        pending: number;
      }[]
    >(
      `SELECT e.id AS encounter_id, e.patient_profile_id, pr.display_name,
              e.start_at, e.end_at, e.status_concept_id,
              cur.care_space_id AS bed_id, cs.code AS bed_code, cs.name AS bed_name,
              (SELECT count(*)::int FROM billing.charge_captures c
                WHERE c.encounter_id = e.id AND c.status_concept_id = ?) AS pending
         FROM clinical.encounters e
         LEFT JOIN profiles.person_profiles pp ON pp.id = e.patient_profile_id
         LEFT JOIN profiles.persons pr ON pr.id = pp.person_id
         LEFT JOIN LATERAL (
           SELECT l.care_space_id FROM clinical.encounter_locations l
            WHERE l.encounter_id = e.id AND l.is_bed_assignment
            ORDER BY l.period_start DESC LIMIT 1) cur ON true
         LEFT JOIN practice.care_spaces cs ON cs.id = cur.care_space_id
        WHERE e.tenant_id = ? AND e.class_concept_id = ?
          AND EXISTS (
            SELECT 1 FROM clinical.encounter_locations l
             WHERE l.encounter_id = e.id AND l.is_bed_assignment
               AND l.practice_site_id = ? AND l.location_status_concept_id IN (?, ?)
               AND l.period_start < (?::date + 1)
               AND (l.period_end IS NULL OR l.period_end >= ?::date))
        ORDER BY e.start_at DESC NULLS LAST, e.id
        LIMIT 500`,
      [
        BILL.CHG_PENDING,
        tenantId,
        CLIN.ENCOUNTER_CLASS_INPATIENT,
        q.siteId,
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_COMPLETED,
        to,
        from,
      ],
      'all',
    );
    const iso = (d: Date | null) => (d ? new Date(d).toISOString() : null);
    return {
      siteId: q.siteId,
      from,
      to,
      items: rows.map((r) => ({
        encounterId: r.encounter_id,
        patient: {
          patientProfileId: r.patient_profile_id,
          displayName: r.display_name ?? '',
        },
        admittedAt: iso(r.start_at),
        dischargedAt: iso(r.end_at),
        inProgress: r.status_concept_id === CLIN.ENCOUNTER_IN_PROGRESS,
        bed: r.bed_id
          ? { id: r.bed_id, code: r.bed_code ?? '', name: r.bed_name ?? '' }
          : null,
        pendingCharges: Number(r.pending),
      })),
    };
  }

  // --- Internos ------------------------------------------------------------------

  /**
   * Vista de tarifas para la web (decisión del orquestador: la API manda las
   * formas): categoría {code, display}, sala {id, code, name}, nombre del
   * servicio, código de moneda y estado de vigencia (`SCHEDULED|ACTIVE|CLOSED`).
   */
  private async tariffViews(
    em: EntityManager,
    tariffs: readonly SpaceTariffs[],
  ): Promise<Record<string, unknown>[]> {
    if (tariffs.length === 0) return [];
    const uuids = (xs: (string | undefined | null)[]) =>
      `{${[...new Set(xs.filter((x): x is string => !!x))].join(',')}}`;
    const [concepts, spaces, services] = await Promise.all([
      em.execute<{ id: string; code: string; display: string | null }[]>(
        'SELECT id, code, display FROM terminology.catalog_concepts WHERE id = ANY(?::uuid[])',
        [
          uuids(
            tariffs.flatMap((t) => [
              t.bedCategoryConceptId,
              t.currencyConceptId,
            ]),
          ),
        ],
        'all',
      ),
      em.execute<{ id: string; code: string; name: string }[]>(
        'SELECT id, code, name FROM practice.care_spaces WHERE id = ANY(?::uuid[])',
        [uuids(tariffs.map((t) => t.careSpaceId))],
        'all',
      ),
      em.execute<{ id: string; name: string }[]>(
        'SELECT id, name FROM billing.service_catalog WHERE id = ANY(?::uuid[])',
        [uuids(tariffs.map((t) => t.serviceCatalogId))],
        'all',
      ),
    ]);
    const concept = new Map(concepts.map((c) => [c.id, c]));
    const space = new Map(spaces.map((c) => [c.id, c]));
    const service = new Map(services.map((c) => [c.id, c]));
    const today = new Date().toISOString().slice(0, 10);
    return tariffs.map((t) => {
      const base = tariffView(t);
      const cat = t.bedCategoryConceptId
        ? concept.get(t.bedCategoryConceptId)
        : undefined;
      const cur = t.currencyConceptId
        ? concept.get(t.currencyConceptId)
        : undefined;
      const from = base.validFrom as string;
      const to = base.validTo as string | null;
      return {
        ...base,
        bedCategory: t.bedCategoryConceptId
          ? {
              code:
                PRAC_CODE_BY_ID.get(t.bedCategoryConceptId) ?? cat?.code ?? '',
              display: cat?.display ?? cat?.code ?? '',
            }
          : null,
        careSpace: t.careSpaceId ? (space.get(t.careSpaceId) ?? null) : null,
        serviceName: service.get(t.serviceCatalogId)?.name ?? null,
        currencyCode: cur ? shortCode(cur.code) : null,
        status:
          from > today ? 'SCHEDULED' : to && to <= today ? 'CLOSED' : 'ACTIVE',
      };
    });
  }

  private async encounter(
    em: EntityManager,
    encounterId: string,
    req: { tenantId: string | null },
  ) {
    const [enc] = await em.execute<
      {
        id: string;
        tenant_id: string;
        patient_profile_id: string;
        end_at: string | null;
      }[]
    >(
      'SELECT id, tenant_id, patient_profile_id, end_at FROM clinical.encounters WHERE id = ?',
      [encounterId],
      'all',
    );
    if (!enc || (req.tenantId && enc.tenant_id !== req.tenantId)) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId,
      });
    }
    return enc;
  }

  private async tariffFor(
    em: EntityManager,
    practiceId: string,
    kind: string,
    careSpaceId: string,
    category: string | null,
    date: string,
  ) {
    const [t] = await em.execute<
      {
        id: string;
        service_catalog_id: string;
        unit_price: string | null;
        currency_concept_id: string | null;
        unit_minutes: number | null;
        minimum_units: number | null;
      }[]
    >(
      `SELECT id, service_catalog_id, unit_price, currency_concept_id, unit_minutes, minimum_units FROM billing.space_tariffs
        WHERE practice_id = ? AND tariff_kind_concept_id = ? AND status_concept_id = ?
          AND valid_from <= ?::date AND (valid_to IS NULL OR valid_to > ?::date)
          AND (care_space_id = ? OR (care_space_id IS NULL AND (bed_category_concept_id IS NOT DISTINCT FROM ?::uuid OR bed_category_concept_id IS NULL)))
        ORDER BY (care_space_id IS NULL), (bed_category_concept_id IS NULL) LIMIT 1`,
      [
        practiceId,
        kind,
        CONCEPTS.STATE_ACTIVE,
        date,
        date,
        careSpaceId,
        category,
      ],
      'all',
    );
    return t ?? null;
  }

  private async capture(
    tx: EntityManager,
    input: {
      tenantId: string;
      practiceId: string;
      patientProfileId: string;
      encounterId: string | null;
      source: string;
      sourceRefId: string;
      serviceDate: string;
      careSpaceId: string;
      bedCategoryConceptId: string | null;
      tariff: {
        id: string;
        service_catalog_id: string;
        unit_price: string | null;
        currency_concept_id: string | null;
      } | null;
      quantity: number;
      unitId: string | null;
      key: string;
      actorId?: string;
    },
  ): Promise<Record<string, unknown>> {
    const [cc] = input.unitId
      ? await tx.execute<{ id: string }[]>(
          'SELECT id FROM accounting.cost_centers WHERE clinical_unit_id = ? AND status_concept_id = ? LIMIT 1',
          [input.unitId, CONCEPTS.STATE_ACTIVE],
          'all',
        )
      : [];
    const now = new Date();
    const charge = tx.create(
      ChargeCaptures,
      {
        tenantId: input.tenantId,
        practiceId: input.practiceId,
        patientProfileId: input.patientProfileId,
        encounterId: input.encounterId ?? undefined,
        sourceKindConceptId: input.source,
        sourceRefId: input.sourceRefId,
        serviceDate: input.serviceDate,
        careSpaceId: input.careSpaceId,
        bedCategoryConceptId: input.bedCategoryConceptId ?? undefined,
        spaceTariffId: input.tariff?.id,
        serviceCatalogId: input.tariff?.service_catalog_id,
        quantity: String(input.quantity),
        unitPrice: input.tariff?.unit_price ?? undefined,
        currencyConceptId: input.tariff?.currency_concept_id ?? undefined,
        costCenterId: cc?.id,
        statusConceptId: BILL.CHG_PENDING,
        idempotencyKey: input.key,
        createdAt: now,
        updatedAt: now,
        createdByUserId: input.actorId,
        updatedByUserId: input.actorId,
      } as never,
      { partial: true },
    );
    await this.flush(tx);
    await this.publish(
      tx,
      input.tariff
        ? 'billing.charge_capture.created'
        : 'billing.charge_capture.tariff_missing',
      input.tenantId,
      'billing.charge_captures',
      charge.id,
      {
        chargeCaptureId: charge.id,
        idempotencyKey: input.key,
        serviceDate: input.serviceDate,
        careSpaceId: input.careSpaceId,
      },
      input.actorId,
    );
    return chargeView(charge);
  }

  /** Facturación a nivel práctica: plataforma, admin de la org o rol de práctica/tenant. */
  private async assertPractice(
    em: EntityManager,
    actor: AuthenticatedUser,
    practiceId: string,
    tenantId: string,
    action: string,
  ) {
    const [p] = await em.execute<{ tenant_id: string }[]>(
      'SELECT tenant_id FROM practice.practices WHERE id = ?',
      [practiceId],
      'all',
    );
    if (!p || p.tenant_id !== tenantId)
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    const pseudoSite = {
      id: '',
      practiceId,
      tenantId,
      branchId: undefined,
    } as never;
    const scope = await this.access.actorScope(em, actor, pseudoSite);
    this.access.decide(
      action,
      this.access.siteLevelRoles(scope, { id: '', practiceId }),
      false,
      scope,
    );
  }

  /** Sin objetivo de autorización no hay permiso: se deniega (fail-closed). */
  private denyWithoutTarget(action: string): never {
    throw new InsufficientRoleException(
      'No hay un objetivo sobre el que autorizar esta acción',
      { action },
      'INFRA_ACTION_NOT_ALLOWED',
    );
  }

  /** Facturación a nivel sede en cada sede tocada. */
  private async assertSites(
    em: EntityManager,
    req: { actor: AuthenticatedUser | null; tenantId: string | null },
    siteIds: string[],
    action: string,
  ) {
    // Sin actor = job del sistema (contexto de sistema dentro de la tx).
    if (!req.actor) return;
    if (!req.tenantId || siteIds.length === 0) this.denyWithoutTarget(action);
    for (const siteId of siteIds) {
      const filter = await this.access.scopeFilter(
        req.actor,
        action,
        siteId,
        em,
        req.tenantId,
      );
      if (!filter.allSite)
        this.access.decide(
          action,
          this.access.siteLevelRoles(filter.scope, filter.site),
          false,
          filter.scope,
        );
    }
  }

  private async flush(tx: EntityManager): Promise<void> {
    try {
      await tx.flush();
    } catch (error) {
      throw translateInfraWriteError(error);
    }
  }

  private async publish(
    tx: EntityManager,
    eventType: string,
    tenantId: string,
    aggregateType: string,
    aggregateId: string,
    payload: Record<string, unknown>,
    actorUserId?: string,
  ) {
    try {
      await this.outbox.publishDomainEvent(tx, {
        tenantId,
        eventType,
        aggregateType,
        aggregateId,
        payloadJson: payload,
        actorUserId,
      });
    } catch (error) {
      throw translateInfraWriteError(error);
    }
  }
}

/** Vista de una tarifa. */
function tariffView(t: SpaceTariffs): Record<string, unknown> {
  return {
    id: t.id,
    practiceId: t.practiceId,
    tariffKind:
      t.tariffKindConceptId === BILL.TARIFF_BED_DAY ? 'BED_DAY' : 'OR_TIME',
    bedCategoryConceptId: t.bedCategoryConceptId ?? null,
    careSpaceId: t.careSpaceId ?? null,
    serviceCatalogId: t.serviceCatalogId,
    unitMinutes: t.unitMinutes ?? null,
    minimumUnits: t.minimumUnits ?? null,
    unitPrice:
      t.unitPrice === undefined || t.unitPrice === null
        ? null
        : String(t.unitPrice),
    validFrom: String(
      t.validFrom instanceof Date ? t.validFrom.toISOString() : t.validFrom,
    ).slice(0, 10),
    validTo: t.validTo
      ? String(
          t.validTo instanceof Date ? t.validTo.toISOString() : t.validTo,
        ).slice(0, 10)
      : null,
    rowVersion: t.rowVersion,
  };
}

/** `billing:CURRENCY_BOB` → `CURRENCY_BOB`; sin prefijo, igual. */
function shortCode(code: string): string {
  const i = code.lastIndexOf(':');
  return i >= 0 ? code.slice(i + 1) : code;
}

/** Código de concepto de `practice` por id (categorías de cama). */
const PRAC_CODE_BY_ID = new Map<string, string>(
  Object.entries(PRAC).map(([k, id]) => [id, k]),
);
