import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { PRAC } from '../../practice/practice.concepts';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import { CLIN } from '../clinical.concepts';
import {
  CENSUS_NUMERIC_FIELDS,
  censusContentHash,
  computeCensus,
  localDate,
  type CensusBed,
  type CensusCounts,
  type CensusEncounter,
  type CensusEntryDraft,
  type CensusField,
  type CensusLocation,
  type CensusMovement,
} from '../domain/census-calculation';
import type {
  AdjustCensusDto,
  CensusQueryDto,
  CloseCensusDto,
} from '../dto/adt.dto';
import { INFRA_F3_ACTIONS } from '../policies/infra-f3.policy';
import { clinCode } from './inpatient-read.service';
import { AdtAccessService } from './adt-access.service';
import { ADT_EVENTS, AdtEventsService } from './adt-events.service';
import { AdtSettingsService } from './adt-settings.service';

/** Concepto de movimiento de una entrada del censo. */
const MOVEMENT_CONCEPT: Readonly<Record<CensusMovement, string>> = {
  PRESENT: CLIN.CEN_PRESENT,
  ADMITTED: CLIN.CEN_ADMITTED,
  DISCHARGED: CLIN.CEN_DISCHARGED,
  TRANSFER_IN: CLIN.CEN_TRANSFER_IN,
  TRANSFER_OUT: CLIN.CEN_TRANSFER_OUT,
  SAME_DAY: CLIN.CEN_SAME_DAY,
};

/** Un día de censo de una unidad tal como lo ve el cliente. */
export interface CensusDayView {
  id: string | null;
  siteId: string;
  unitId: string;
  unitName: string | null;
  date: string;
  cutoffAt: string;
  status: 'OPEN' | 'CLOSED';
  closedAt: string | null;
  closedByUserId: string | null;
  contentHash: string | null;
  /** Los recuentos del snapshot, por nombre de columna (el `fieldCode` de un ajuste). */
  counts: CensusCounts;
  adjustments: CensusAdjustmentView[];
  /** El snapshot con los ajustes aplicados; el snapshot en sí no cambia. */
  adjustedTotals: CensusCounts;
}

/** Un ajuste. */
export interface CensusAdjustmentView {
  id: string;
  censusDayId: string;
  fieldCode: string;
  previousValue: number;
  newValue: number;
  reasonText: string;
  entryRefId: string | null;
  adjustedByUserId: string;
  requestId: string | null;
  createdAt: string;
}

interface DayRow {
  id: string;
  clinical_unit_id: string;
  census_date: Date | string;
  cutoff_at: Date;
  closed_at: Date | null;
  closed_by_user_id: string | null;
  content_hash: string | null;
  [field: string]: unknown;
}

/** Datos para cerrar los días de una sede. */
interface CloseSiteInput {
  tenantId: string;
  siteId: string;
  practiceId: string;
  date: string;
  unitIds?: readonly string[];
  actorUserId: string | null;
  requestId?: string;
}

/**
 * Censo diario inmutable (CONTRATO-F2-F5 F3.3, `procesos/05` flujo E).
 *
 * A la hora de corte (00:00 local del día siguiente) se toma la foto de cada
 * unidad: camas censables, disponibles y bloqueadas; ingresos, egresos,
 * traslados, pacientes presentes. El cierre inserta **todas** las entradas del
 * día y recién entonces actualiza el día con `closed_at` y `content_hash` en el
 * mismo `UPDATE`; la base rechaza cualquier cambio posterior. Una corrección es
 * un **ajuste** auditado en otra tabla: el snapshot no se toca.
 */
@Injectable()
export class InpatientCensusService {
  /**
   * @param em - Contexto de persistencia.
   * @param access - Política de F3.
   * @param settings - Ajustes `infra.*`.
   * @param events - Outbox.
   * @param logger - Logger.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly access: AdtAccessService,
    private readonly settings: AdtSettingsService,
    private readonly events: AdtEventsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InpatientCensusService.name);
  }

  // =========================================================================
  // Lectura
  // =========================================================================

  /**
   * `GET /sites/:siteId/census?date&unitId`: el día cerrado (snapshot + ajustes) o,
   * si está abierto, una **vista previa calculada** que no se persiste.
   *
   * @param siteId - Establecimiento.
   * @param query - Fecha y unidad.
   * @param actor - Quien consulta.
   */
  async get(siteId: string, query: CensusQueryDto, actor: AuthenticatedUser) {
    return this.em.transactional(async (tx) => {
      const scope = await this.access.forSite(tx, siteId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.CENSUS_VIEW);
      const timeZone = await this.timeZone(tx, siteId);
      const bounds = await this.bounds(tx, query.date, timeZone);
      const unitNames = await this.unitNames(tx, siteId, scope.tenantId);
      if (query.unitId && !unitNames.has(query.unitId)) throw this.notFound();

      const closed = await this.closedDays(
        tx,
        scope.tenantId,
        siteId,
        query.date,
        query.unitId,
      );
      const views = new Map<string, CensusDayView>(
        closed.map((view) => [
          view.unitId,
          { ...view, unitName: unitNames.get(view.unitId) ?? null },
        ]),
      );

      // Unidades sin día cerrado: vista previa calculada, nunca persistida.
      const pending = [
        ...(await this.unitsWithBeds(
          tx,
          scope.tenantId,
          siteId,
          bounds.cutoff,
        )),
      ]
        .filter((unitId) => !views.has(unitId))
        .filter((unitId) => !query.unitId || unitId === query.unitId);
      if (pending.length > 0) {
        const data = await this.loadDayData(tx, scope.tenantId, siteId, bounds);
        for (const unitId of pending) {
          const { counts } = computeCensus({
            unitId,
            dayStart: bounds.dayStart,
            cutoff: bounds.cutoff,
            timeZone,
            ...data,
          });
          views.set(unitId, {
            id: null,
            siteId,
            unitId,
            unitName: unitNames.get(unitId) ?? null,
            date: query.date,
            cutoffAt: bounds.cutoff.toISOString(),
            status: 'OPEN',
            closedAt: null,
            closedByUserId: null,
            contentHash: null,
            counts,
            adjustments: [],
            adjustedTotals: counts,
          });
        }
      }
      return {
        siteId,
        date: query.date,
        cutoffAt: bounds.cutoff.toISOString(),
        timeZone,
        generatedAt: new Date().toISOString(),
        units: [...views.values()].sort((a, b) =>
          (a.unitName ?? a.unitId).localeCompare(b.unitName ?? b.unitId),
        ),
      };
    });
  }

  // =========================================================================
  // Cierre
  // =========================================================================

  /**
   * `POST /sites/:siteId/census/:date/close`: cierra a mano el día de las unidades
   * pedidas (o de todas las que tienen camas censables). Idempotente por unidad.
   *
   * @param siteId - Establecimiento.
   * @param date - Día `YYYY-MM-DD`.
   * @param dto - Unidades (opcional).
   * @param actor - Quien cierra.
   * @param requestId - Id de correlación.
   */
  async close(
    siteId: string,
    date: string,
    dto: CloseCensusDto,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<{ closed: CensusDayView[]; alreadyClosed: string[] }> {
    return this.em.transactional(async (tx) => {
      const scope = await this.access.forSite(tx, siteId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.CENSUS_CLOSE);
      const unitNames = await this.unitNames(tx, siteId, scope.tenantId);
      for (const unitId of dto.unitIds ?? []) {
        if (!unitNames.has(unitId)) throw this.notFound();
      }
      const result = await this.closeSiteDay(tx, {
        tenantId: scope.tenantId,
        siteId,
        practiceId: scope.practiceId,
        date,
        unitIds: dto.unitIds,
        actorUserId: actor.id,
        requestId,
      });
      if (result.closed.length === 0 && result.alreadyClosed.length > 0) {
        throw new ConflictException(
          'El censo de esa fecha ya está cerrado',
          { units: result.alreadyClosed },
          ClinicalErrorReason.CENSUS_ALREADY_CLOSED,
        );
      }
      return {
        closed: result.closed.map((view) => ({
          ...view,
          unitName: unitNames.get(view.unitId) ?? null,
        })),
        alreadyClosed: result.alreadyClosed,
      };
    });
  }

  /**
   * Cierra los días vencidos de todas las sedes (`POST /internal/clinical/census-close-tick`).
   *
   * Corre **sin contexto de tenant**: la tabla tiene RLS, así que cada
   * transacción fija el contexto SYSTEM. Recorre los últimos
   * `infra.census_close_lookback_days` días ya terminados de cada sede con camas
   * censables y cierra los que falten; es idempotente.
   *
   * @param now - Ahora (inyectable para pruebas).
   */
  async closeDueDays(now: Date = new Date()): Promise<{
    sites: number;
    daysClosed: number;
    unitsClosed: number;
    failed: number;
  }> {
    const sites = await this.em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return tx.execute<
        {
          site_id: string;
          tenant_id: string;
          practice_id: string;
          tz: string;
        }[]
      >(
        `select s.id as site_id, s.tenant_id, s.practice_id, coalesce(s.time_zone, p.time_zone, 'UTC') as tz
           from practice.practice_sites s join practice.practices p on p.id = s.practice_id
          where exists (select 1 from practice.care_spaces cs
                         where cs.practice_site_id = s.id and cs.form_concept_id = ? and cs.censable is true)`,
        [PRAC.LOC_FORM_BED],
      );
    });
    let daysClosed = 0;
    let unitsClosed = 0;
    let failed = 0;
    for (const site of sites) {
      const settings = await this.em.transactional(async (tx) => {
        await tx.execute(
          "select set_config('app.system_context', 'true', true)",
        );
        return this.settings.forPractice(tx, site.practice_id);
      });
      const today = localDate(now, site.tz);
      for (let back = 1; back <= settings.censusCloseLookbackDays; back += 1) {
        const date = addDays(today, -back);
        try {
          const outcome = await this.em.transactional(async (tx) => {
            await tx.execute(
              "select set_config('app.system_context', 'true', true)",
            );
            const bounds = await this.bounds(tx, date, site.tz);
            const due =
              now.getTime() >=
              bounds.cutoff.getTime() +
                settings.censusCloseGraceMinutes * 60_000;
            if (!due) return { closed: [], alreadyClosed: [] };
            return this.closeSiteDay(tx, {
              tenantId: site.tenant_id,
              siteId: site.site_id,
              practiceId: site.practice_id,
              date,
              actorUserId: null,
            });
          });
          if (outcome.closed.length > 0) {
            daysClosed += 1;
            unitsClosed += outcome.closed.length;
          }
        } catch (error) {
          failed += 1;
          this.logger.error(
            {
              operation: 'clinical.census.close-tick',
              siteId: site.site_id,
              date,
              err: error,
            },
            'No se pudo cerrar el censo del día',
          );
        }
      }
    }
    return { sites: sites.length, daysClosed, unitsClosed, failed };
  }

  /**
   * Cierra el día de una sede dentro de la transacción del llamador. No lee el
   * tenant del contexto: lo recibe, porque el cierre programado no tiene.
   */
  private async closeSiteDay(
    tx: EntityManager,
    input: CloseSiteInput,
  ): Promise<{ closed: CensusDayView[]; alreadyClosed: string[] }> {
    const settings = await this.settings.forPractice(tx, input.practiceId);
    const timeZone = await this.timeZone(tx, input.siteId);
    const bounds = await this.bounds(tx, input.date, timeZone);
    const now = new Date();
    if (
      now.getTime() <
      bounds.cutoff.getTime() + settings.censusCloseGraceMinutes * 60_000
    ) {
      throw new PreconditionFailedException(
        'El día todavía no terminó: el censo se cierra después del corte',
        {
          cutoffAt: bounds.cutoff.toISOString(),
          graceMinutes: settings.censusCloseGraceMinutes,
        },
        ClinicalErrorReason.CENSUS_DATE_NOT_ENDED,
      );
    }

    const wanted = new Set(
      input.unitIds ??
        (await this.unitsWithBeds(
          tx,
          input.tenantId,
          input.siteId,
          bounds.cutoff,
        )),
    );
    const data = await this.loadDayData(
      tx,
      input.tenantId,
      input.siteId,
      bounds,
    );
    const closed: CensusDayView[] = [];
    const alreadyClosed: string[] = [];
    for (const unitId of [...wanted].sort()) {
      const existing = await tx.execute<
        { id: string; closed_at: Date | null }[]
      >(
        `select id, closed_at from clinical.inpatient_census_days
          where practice_site_id = ? and clinical_unit_id = ? and census_date = ? for update`,
        [input.siteId, unitId, input.date],
      );
      if (existing[0]?.closed_at) {
        alreadyClosed.push(unitId);
        continue;
      }
      const { counts, entries } = computeCensus({
        unitId,
        dayStart: bounds.dayStart,
        cutoff: bounds.cutoff,
        timeZone,
        ...data,
      });
      const hash = censusContentHash(counts, entries);
      const dayId = existing[0]?.id ?? randomUUID();
      const stamp = new Date();
      if (!existing[0]) {
        const zeros = Object.fromEntries(
          CENSUS_NUMERIC_FIELDS.map((f) => [f, 0]),
        );
        await tx.execute(
          `insert into clinical.inpatient_census_days
             (id, tenant_id, practice_site_id, clinical_unit_id, census_date, cutoff_at, status_concept_id,
              ${CENSUS_NUMERIC_FIELDS.join(', ')},
              created_at, updated_at, created_by_user_id, updated_by_user_id, row_version)
           values (?, ?, ?, ?, ?, ?, ?, ${CENSUS_NUMERIC_FIELDS.map(() => '?').join(', ')}, ?, ?, ?, ?, 1)`,
          [
            dayId,
            input.tenantId,
            input.siteId,
            unitId,
            input.date,
            bounds.cutoff,
            CLIN.CENSUS_OPEN,
            ...CENSUS_NUMERIC_FIELDS.map((f) => zeros[f]),
            stamp,
            stamp,
            input.actorUserId,
            input.actorUserId,
          ],
        );
      }
      // Todas las entradas primero: un INSERT en un día ya cerrado lo rechaza la base.
      await this.insertEntries(tx, input.tenantId, dayId, entries);
      // Un solo UPDATE cierra el día: recuentos, closed_at y content_hash juntos.
      await tx.execute(
        `update clinical.inpatient_census_days
            set status_concept_id = ?, closed_at = ?, closed_by_user_id = ?, content_hash = ?,
                ${CENSUS_NUMERIC_FIELDS.map((f) => `${f} = ?`).join(', ')},
                updated_at = ?, updated_by_user_id = ?, row_version = row_version + 1
          where id = ?`,
        [
          CLIN.CENSUS_CLOSED,
          stamp,
          input.actorUserId,
          hash,
          ...CENSUS_NUMERIC_FIELDS.map((f) => counts[f]),
          stamp,
          input.actorUserId,
          dayId,
        ],
      );
      await this.events.publish(tx, {
        type: ADT_EVENTS.censusClosed,
        aggregateType: 'inpatient_census_day',
        aggregateId: dayId,
        tenantId: input.tenantId,
        actorUserId: input.actorUserId,
        correlationId: input.requestId,
        payload: {
          censusDayId: dayId,
          siteId: input.siteId,
          unitId,
          date: input.date,
          cutoffAt: bounds.cutoff.toISOString(),
          contentHash: hash,
          closedBySystem: input.actorUserId === null,
          bedsAvailable: counts.beds_available,
          patientDays: counts.patient_days,
          admissions: counts.admissions,
          discharges: counts.discharges,
        },
      });
      closed.push({
        id: dayId,
        siteId: input.siteId,
        unitId,
        unitName: null,
        date: input.date,
        cutoffAt: bounds.cutoff.toISOString(),
        status: 'CLOSED',
        closedAt: stamp.toISOString(),
        closedByUserId: input.actorUserId,
        contentHash: hash,
        counts,
        adjustments: [],
        adjustedTotals: counts,
      });
    }
    return { closed, alreadyClosed };
  }

  // =========================================================================
  // Ajuste
  // =========================================================================

  /**
   * `POST /census-days/:id/adjustments`: corrige un número de un censo cerrado con
   * motivo, autor y `requestId`. El snapshot **no cambia**: el ajuste es una fila
   * aparte y los totales ajustados se calculan encima.
   *
   * @param censusDayId - Día de censo.
   * @param dto - Campo, valor nuevo y motivo.
   * @param actor - Quien ajusta.
   * @param requestId - Id de correlación.
   */
  async adjust(
    censusDayId: string,
    dto: AdjustCensusDto,
    actor: AuthenticatedUser,
    requestId?: string,
  ): Promise<{
    adjustment: CensusAdjustmentView;
    adjustedTotals: CensusCounts;
  }> {
    return this.em.transactional(async (tx) => {
      const tenantId = requireTenantId();
      const rows = await tx.execute<DayRow[]>(
        `select * from clinical.inpatient_census_days where id = ? for update`,
        [censusDayId],
      );
      const day = rows[0];
      if (!day || (day['tenant_id'] as string) !== tenantId)
        throw this.notFound();
      const siteId = day['practice_site_id'] as string;
      const scope = await this.access.forSite(tx, siteId, actor);
      this.access.assertCan(scope, INFRA_F3_ACTIONS.CENSUS_ADJUST);

      if (!day.closed_at) {
        throw new ConflictException(
          'Un día abierto no se ajusta: cerrá el censo primero',
          undefined,
          ClinicalErrorReason.CENSUS_NOT_CLOSED,
        );
      }
      if (
        !(CENSUS_NUMERIC_FIELDS as readonly string[]).includes(dto.fieldCode)
      ) {
        throw new PreconditionFailedException(
          'El campo no es una columna numérica del censo',
          { allowed: [...CENSUS_NUMERIC_FIELDS] },
          ClinicalErrorReason.ADJUSTMENT_FIELD_INVALID,
        );
      }
      const reason = dto.reasonText?.trim();
      if (!reason) {
        throw new PreconditionFailedException(
          'El ajuste exige un motivo',
          undefined,
          ClinicalErrorReason.ADJUSTMENT_REASON_REQUIRED,
        );
      }
      if (dto.entryRefId) {
        const entry = await tx.execute<{ id: string }[]>(
          'select id from clinical.inpatient_census_entries where id = ? and census_day_id = ?',
          [dto.entryRefId, censusDayId],
        );
        if (entry.length === 0) {
          throw new PreconditionFailedException(
            'La entrada citada no pertenece a este censo',
            undefined,
            ClinicalErrorReason.ADJUSTMENT_ENTRY_NOT_IN_DAY,
          );
        }
      }
      const existing = await this.adjustmentsOf(tx, [censusDayId]);
      const field = dto.fieldCode as CensusField;
      const current = adjustedTotals(this.snapshotOf(day), existing)[field];
      const id = randomUUID();
      const now = new Date();
      await tx.execute(
        `insert into clinical.inpatient_census_adjustments
           (id, tenant_id, census_day_id, field_code, previous_value, new_value, reason_text,
            entry_ref_id, adjusted_by_user_id, request_id, created_at)
         values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          tenantId,
          censusDayId,
          field,
          current,
          dto.newValue,
          reason,
          dto.entryRefId ?? null,
          actor.id,
          requestId ?? null,
          now,
        ],
      );
      const adjustment: CensusAdjustmentView = {
        id,
        censusDayId,
        fieldCode: field,
        previousValue: current,
        newValue: dto.newValue,
        reasonText: reason,
        entryRefId: dto.entryRefId ?? null,
        adjustedByUserId: actor.id,
        requestId: requestId ?? null,
        createdAt: now.toISOString(),
      };
      await this.events.publish(tx, {
        type: ADT_EVENTS.censusAdjusted,
        aggregateType: 'inpatient_census_day',
        aggregateId: censusDayId,
        tenantId,
        actorUserId: actor.id,
        correlationId: requestId,
        payload: {
          censusDayId,
          adjustmentId: id,
          siteId,
          unitId: day.clinical_unit_id,
          date: dateOnly(day.census_date),
          fieldCode: field,
          previousValue: current,
          newValue: dto.newValue,
        },
      });
      return {
        adjustment,
        adjustedTotals: adjustedTotals(this.snapshotOf(day), [
          ...existing,
          adjustment,
        ]),
      };
    });
  }

  // =========================================================================
  // Datos del día
  // =========================================================================

  /** Medianoche local del día y de la mañana siguiente (instantes). */
  private async bounds(
    tx: EntityManager,
    date: string,
    timeZone: string,
  ): Promise<{ dayStart: Date; cutoff: Date }> {
    const rows = await tx.execute<{ day_start: Date; cutoff: Date }[]>(
      `select (?::date)::timestamp at time zone ? as day_start,
              ((?::date) + 1)::timestamp at time zone ? as cutoff`,
      [date, timeZone, date, timeZone],
    );
    return {
      dayStart: new Date(rows[0].day_start),
      cutoff: new Date(rows[0].cutoff),
    };
  }

  private async timeZone(tx: EntityManager, siteId: string): Promise<string> {
    const rows = await tx.execute<{ tz: string | null }[]>(
      `select coalesce(s.time_zone, p.time_zone, 'UTC') as tz
         from practice.practice_sites s join practice.practices p on p.id = s.practice_id
        where s.id = ?`,
      [siteId],
    );
    return rows[0]?.tz ?? 'UTC';
  }

  private async unitNames(
    tx: EntityManager,
    siteId: string,
    tenantId: string,
  ): Promise<Map<string, string>> {
    const rows = await tx.execute<{ id: string; name: string }[]>(
      'select id, name from practice.clinical_units where practice_site_id = ? and tenant_id = ?',
      [siteId, tenantId],
    );
    return new Map(rows.map((row) => [row.id, row.name]));
  }

  /** Unidades con al menos una cama censable en el corte. */
  private async unitsWithBeds(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
    cutoff: Date,
  ): Promise<Set<string>> {
    const beds = await this.loadBeds(tx, tenantId, siteId, cutoff);
    return new Set(
      beds
        .filter((bed) => bed.censable && bed.inForceAtCutoff && bed.unitId)
        .map((bed) => bed.unitId!),
    );
  }

  private async loadBeds(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
    cutoff: Date,
  ): Promise<CensusBed[]> {
    const rows = await tx.execute<
      {
        id: string;
        censable: boolean | null;
        category: string | null;
        status: string;
        valid_from: Date | null;
        valid_to: Date | null;
        unit: string | null;
        blocked: boolean;
      }[]
    >(
      `select cs.id, cs.censable, cs.bed_category_concept_id as category, cs.status_concept_id as status,
              cs.valid_from, cs.valid_to,
              coalesce(
                (select a.clinical_unit_id from practice.space_unit_assignments a
                  where a.care_space_id = cs.id and a.role_concept_id = ?
                    and a.valid_from <= ? and (a.valid_to is null or a.valid_to > ?)
                  order by a.valid_from desc limit 1),
                (select a.clinical_unit_id from practice.space_unit_assignments a
                  where a.care_space_id = cs.id and a.role_concept_id = ?
                    and a.valid_from <= ? and (a.valid_to is null or a.valid_to > ?)
                  order by a.valid_from desc limit 1),
                cs.clinical_unit_id) as unit,
              exists (select 1 from practice.care_space_blocks b
                       where b.care_space_id = cs.id and b.cancelled_at is null
                         and b.starts_at <= ? and (b.ended_at is null or b.ended_at > ?)) as blocked
         from practice.care_spaces cs
        where cs.practice_site_id = ? and cs.tenant_id = ? and cs.form_concept_id = ?`,
      [
        PRAC.SPACE_UNIT_ROLE_LOAN,
        cutoff,
        cutoff,
        PRAC.SPACE_UNIT_ROLE_OWNER,
        cutoff,
        cutoff,
        cutoff,
        cutoff,
        siteId,
        tenantId,
        PRAC.LOC_FORM_BED,
      ],
    );
    return rows.map((row) => {
      const from = row.valid_from ? new Date(row.valid_from).getTime() : null;
      const to = row.valid_to ? new Date(row.valid_to).getTime() : null;
      const wasActive =
        row.status === PRAC.SPACE_ACTIVE ||
        (row.status === PRAC.SPACE_RETIRED &&
          to !== null &&
          to > cutoff.getTime());
      return {
        id: row.id,
        unitId: row.unit,
        censable: row.censable === true,
        inForceAtCutoff:
          wasActive &&
          (from === null || from <= cutoff.getTime()) &&
          (to === null || to > cutoff.getTime()),
        availableAtCutoff: !row.blocked,
        categoryConceptId: row.category,
      };
    });
  }

  /** Camas, ubicaciones y encuentros que tocan el día (para todas las unidades de la sede). */
  private async loadDayData(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
    bounds: { dayStart: Date; cutoff: Date },
  ): Promise<{
    beds: CensusBed[];
    locations: CensusLocation[];
    encounters: CensusEncounter[];
  }> {
    const beds = await this.loadBeds(tx, tenantId, siteId, bounds.cutoff);
    const rows = await tx.execute<
      {
        id: string;
        encounter_id: string;
        patient_profile_id: string;
        care_space_id: string;
        period_start: Date;
        period_end: Date | null;
        movement: string | null;
        end_reason: string | null;
        previous: string | null;
        category: string | null;
        enc_start: Date | null;
        disposition: string | null;
      }[]
    >(
      `select el.id, el.encounter_id, e.patient_profile_id, el.care_space_id, el.period_start, el.period_end,
              el.movement_type_concept_id as movement, el.end_reason_concept_id as end_reason,
              el.previous_encounter_location_id as previous, el.bed_category_concept_id as category,
              e.start_at as enc_start, e.discharge_disposition_concept_id as disposition
         from clinical.encounter_locations el
         join clinical.encounters e on e.id = el.encounter_id
        where el.tenant_id = ? and el.is_bed_assignment
          and el.location_status_concept_id in (?, ?)
          and el.encounter_id in (
                select x.encounter_id from clinical.encounter_locations x
                 where x.tenant_id = ? and x.practice_site_id = ? and x.is_bed_assignment
                   and x.location_status_concept_id in (?, ?)
                   and x.period_start < ? and (x.period_end is null or x.period_end > ?))`,
      [
        tenantId,
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_COMPLETED,
        tenantId,
        siteId,
        CLIN.LOCATION_ACTIVE,
        CLIN.LOCATION_COMPLETED,
        bounds.cutoff,
        bounds.dayStart,
      ],
    );
    const encounters = new Map<string, CensusEncounter>();
    const locations: CensusLocation[] = rows.map((row) => {
      if (!encounters.has(row.encounter_id)) {
        encounters.set(row.encounter_id, {
          id: row.encounter_id,
          startAt: row.enc_start
            ? new Date(row.enc_start)
            : new Date(row.period_start),
          dischargeDisposition: clinCode(row.disposition),
        });
      }
      return {
        id: row.id,
        encounterId: row.encounter_id,
        patientProfileId: row.patient_profile_id,
        careSpaceId: row.care_space_id,
        periodStart: new Date(row.period_start),
        periodEnd: row.period_end ? new Date(row.period_end) : null,
        movement: clinCode(row.movement),
        endReason: clinCode(row.end_reason),
        previousLocationId: row.previous,
        bedCategoryConceptId: row.category,
      };
    });
    return { beds, locations, encounters: [...encounters.values()] };
  }

  private async insertEntries(
    tx: EntityManager,
    tenantId: string,
    censusDayId: string,
    entries: readonly CensusEntryDraft[],
  ): Promise<void> {
    const CHUNK = 200;
    for (let offset = 0; offset < entries.length; offset += CHUNK) {
      const slice = entries.slice(offset, offset + CHUNK);
      const params: unknown[] = [];
      const tuples = slice.map((entry) => {
        params.push(
          randomUUID(),
          tenantId,
          censusDayId,
          entry.encounterId,
          entry.patientProfileId,
          entry.careSpaceId,
          entry.bedCategoryConceptId,
          MOVEMENT_CONCEPT[entry.movement],
          entry.occurredAt,
        );
        return '(?, ?, ?, ?, ?, ?, ?, ?, ?)';
      });
      await tx.execute(
        `insert into clinical.inpatient_census_entries
           (id, tenant_id, census_day_id, encounter_id, patient_profile_id, care_space_id,
            bed_category_concept_id, movement_concept_id, occurred_at)
         values ${tuples.join(', ')}`,
        params,
      );
    }
  }

  private async closedDays(
    tx: EntityManager,
    tenantId: string,
    siteId: string,
    date: string,
    unitId?: string,
  ): Promise<CensusDayView[]> {
    const rows = await tx.execute<DayRow[]>(
      `select * from clinical.inpatient_census_days
        where tenant_id = ? and practice_site_id = ? and census_date = ? and closed_at is not null
          ${unitId ? 'and clinical_unit_id = ?' : ''}
        order by clinical_unit_id`,
      unitId ? [tenantId, siteId, date, unitId] : [tenantId, siteId, date],
    );
    const adjustments = await this.adjustmentsOf(
      tx,
      rows.map((row) => row.id),
    );
    return rows.map((row) => {
      const mine = adjustments.filter((a) => a.censusDayId === row.id);
      const counts = this.snapshotOf(row);
      return {
        id: row.id,
        siteId,
        unitId: row.clinical_unit_id,
        unitName: null,
        date,
        cutoffAt: new Date(row.cutoff_at).toISOString(),
        status: 'CLOSED' as const,
        closedAt: row.closed_at ? new Date(row.closed_at).toISOString() : null,
        closedByUserId: row.closed_by_user_id,
        contentHash: row.content_hash,
        counts,
        adjustments: mine,
        adjustedTotals: adjustedTotals(counts, mine),
      };
    });
  }

  /** Ajustes de varios días, en el orden en que se hicieron. */
  async adjustmentsOf(
    tx: EntityManager,
    dayIds: readonly string[],
  ): Promise<CensusAdjustmentView[]> {
    if (dayIds.length === 0) return [];
    const rows = await tx.execute<
      {
        id: string;
        census_day_id: string;
        field_code: string;
        previous_value: number;
        new_value: number;
        reason_text: string;
        entry_ref_id: string | null;
        adjusted_by_user_id: string;
        request_id: string | null;
        created_at: Date;
      }[]
    >(
      `select * from clinical.inpatient_census_adjustments
        where census_day_id in (${dayIds.map(() => '?').join(', ')}) order by created_at, id`,
      [...dayIds],
    );
    return rows.map((row) => ({
      id: row.id,
      censusDayId: row.census_day_id,
      fieldCode: row.field_code,
      previousValue: row.previous_value,
      newValue: row.new_value,
      reasonText: row.reason_text,
      entryRefId: row.entry_ref_id,
      adjustedByUserId: row.adjusted_by_user_id,
      requestId: row.request_id,
      createdAt: new Date(row.created_at).toISOString(),
    }));
  }

  /** Los doce recuentos de una fila de día. */
  snapshotOf(row: Record<string, unknown>): CensusCounts {
    return Object.fromEntries(
      CENSUS_NUMERIC_FIELDS.map((field) => [field, Number(row[field])]),
    ) as CensusCounts;
  }

  private notFound(): ResourceNotFoundException {
    return new ResourceNotFoundException(
      'Recurso no encontrado',
      undefined,
      ClinicalErrorReason.ADT_RESOURCE_OUT_OF_SCOPE,
    );
  }
}

/**
 * El snapshot con los ajustes aplicados: el último valor de cada campo.
 *
 * @param snapshot - Recuentos cerrados (no se modifican).
 * @param adjustments - Ajustes del día, en orden.
 */
export function adjustedTotals(
  snapshot: CensusCounts,
  adjustments: readonly Pick<CensusAdjustmentView, 'fieldCode' | 'newValue'>[],
): CensusCounts {
  const totals: CensusCounts = { ...snapshot };
  for (const adjustment of adjustments) {
    totals[adjustment.fieldCode as CensusField] = adjustment.newValue;
  }
  return totals;
}

/** `YYYY-MM-DD` más `days` días. */
export function addDays(isoDay: string, days: number): string {
  const base = Date.UTC(
    Number(isoDay.slice(0, 4)),
    Number(isoDay.slice(5, 7)) - 1,
    Number(isoDay.slice(8, 10)),
  );
  return new Date(base + days * 86_400_000).toISOString().slice(0, 10);
}

/** `YYYY-MM-DD` de una fecha de base. */
function dateOnly(value: Date | string): string {
  if (typeof value === 'string') return value.slice(0, 10);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}
