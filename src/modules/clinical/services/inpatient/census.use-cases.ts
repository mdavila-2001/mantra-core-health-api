import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { ResourceNotFoundException } from '../../../../common';
import { InfrastructureAccessService } from '../../../practice/services/infrastructure-access.service';
import { CLIN } from '../../clinical.concepts';
import {
  InpatientCensusAdjustments,
  InpatientCensusDays,
  InpatientCensusEntries,
} from '../../entities';
import {
  InpatientRepository,
  type SegmentRow,
} from '../../repositories/inpatient.repository';
import {
  CENSUS_FIELDS,
  computeCensus,
  computeIndicators,
  fieldColumn,
  localDayWindow,
  percentile,
  zoneOffsetMinutes,
  type CensusCounts,
  type StaySegment,
} from '../../domain/inpatient/census';
import type { CensusAdjustmentDto } from '../../dto/inpatient.dto';
import { adtError } from './adt-errors';
import { ADT_EVENTS, AdtSupport, type AdtRequest } from './adt-support';

const TZ_DEFAULT = 'America/La_Paz';
const GRACE_MINUTES = 60;

/** Un día de censo de una unidad, como lo ve el cliente. */
export interface CensusDayView {
  id: string | null;
  unitId: string | null;
  date: string;
  status: 'OPEN' | 'CLOSED';
  cutoffAt: string;
  counts: CensusCounts;
  adjustments: Record<string, unknown>[];
  adjustedTotals: CensusCounts;
}

/** Tramos de una unidad → forma del dominio. */
function toSegments(
  rows: readonly SegmentRow[],
  unitId: string | null,
): StaySegment[] {
  return rows
    .filter((r) => (r.unit_id ?? null) === unitId)
    .map((r) => {
      const prevSame = r.prev_unit_id !== null && r.prev_unit_id === r.unit_id;
      const nextSame = r.next_unit_id !== null && r.next_unit_id === r.unit_id;
      const startKind: StaySegment['startKind'] =
        r.movement_id === CLIN.ADT_TRANSFER
          ? prevSame
            ? 'INTERNAL'
            : 'TRANSFER_IN'
          : r.movement_id === CLIN.ADT_SWAP
            ? 'INTERNAL'
            : 'ADMIT';
      let endKind: StaySegment['endKind'] = null;
      if (r.period_end) {
        if (r.end_reason_id === CLIN.ADT_END_DISCHARGE) {
          endKind =
            r.disposition_id === CLIN.DISP_DEATH ? 'DEATH' : 'DISCHARGE';
        } else if (r.end_reason_id === CLIN.ADT_END_TRANSFER_OUT) {
          endKind = nextSame ? 'INTERNAL' : 'TRANSFER_OUT';
        } else {
          endKind = 'INTERNAL';
        }
      }
      return {
        encounterId: r.encounter_id,
        start: new Date(r.period_start),
        end: r.period_end ? new Date(r.period_end) : null,
        startKind,
        endKind,
        admittedAt: new Date(r.admitted_at),
      };
    });
}

/** Ajustes aplicados en orden sobre el snapshot. */
function adjusted(
  counts: CensusCounts,
  adjustments: readonly InpatientCensusAdjustments[],
): CensusCounts {
  const out = { ...counts };
  for (const a of [...adjustments].sort(
    (x, y) => x.createdAt.getTime() - y.createdAt.getTime(),
  )) {
    const field = CENSUS_FIELDS.find((f) => fieldColumn(f) === a.fieldCode);
    if (field) out[field] = a.newValue;
  }
  return out;
}

/** Contadores de una fila cerrada. */
function countsOf(d: InpatientCensusDays): CensusCounts {
  return Object.fromEntries(
    CENSUS_FIELDS.map((f) => [f, (d as unknown as Record<string, number>)[f]]),
  ) as unknown as CensusCounts;
}

/**
 * Censo diario (§F3.3): vista previa del día abierto (calculada, no se
 * persiste), cierre idempotente por unidad (snapshot inmutable + entradas) y
 * ajustes append-only que no reescriben el snapshot.
 */
@Injectable()
export class InpatientCensusUseCases {
  constructor(
    private readonly em: EntityManager,
    private readonly access: InfrastructureAccessService,
    private readonly repo: InpatientRepository,
    private readonly support: AdtSupport,
  ) {}

  /**
   * `GET /sites/:siteId/census?date&unitId`.
   *
   * @param siteId - Sede.
   * @param date - `yyyy-mm-dd`.
   * @param unitId - Unidad, opcional.
   * @param req - Actor y tenant.
   */
  async view(
    siteId: string,
    date: string,
    unitId: string | undefined,
    req: AdtRequest,
  ): Promise<CensusDayView[]> {
    const em = this.em.fork();
    const { target } = await this.access.assertCan(
      req.actor as never,
      'f3.census.read',
      { siteId },
      em,
      req.tenantId,
    );
    const tz = target.site.timeZone ?? TZ_DEFAULT;
    const closed = await em.find(InpatientCensusDays, {
      practiceSiteId: siteId,
      censusDate: date as never,
    });
    const preview = await this.compute(em, siteId, date, tz);
    const out: CensusDayView[] = [];
    for (const [unit, counts] of preview) {
      if (unitId && unit !== unitId) continue;
      const day = closed.find((d) => d.clinicalUnitId === unit);
      if (day) {
        const adj = await em.find(InpatientCensusAdjustments, {
          censusDayId: day.id,
        });
        out.push({
          id: day.id,
          unitId: unit,
          date,
          status: 'CLOSED',
          cutoffAt: day.cutoffAt.toISOString(),
          counts: countsOf(day),
          adjustments: adj.map(adjView),
          adjustedTotals: adjusted(countsOf(day), adj),
        });
      } else {
        out.push({
          id: null,
          unitId: unit,
          date,
          status: 'OPEN',
          cutoffAt: localDayWindow(date, tz).cutoff.toISOString(),
          counts,
          adjustments: [],
          adjustedTotals: counts,
        });
      }
    }
    return out;
  }

  /**
   * `POST /sites/:siteId/census/:date/close`.
   *
   * @param siteId - Sede.
   * @param date - Día.
   * @param unitIds - Unidades (todas si falta).
   * @param req - Actor, tenant, requestId (actor `null` = worker).
   */
  async close(
    siteId: string,
    date: string,
    unitIds: string[] | undefined,
    req: AdtRequest | null,
  ): Promise<CensusDayView[]> {
    return this.em.transactional(async (tx) => {
      let tz = TZ_DEFAULT;
      let tenantId: string;
      if (req) {
        const { target } = await this.access.assertCan(
          req.actor as never,
          'f3.census.close',
          { siteId },
          tx,
          req.tenantId,
        );
        tz = target.site.timeZone ?? TZ_DEFAULT;
        tenantId = req.tenantId;
      } else {
        await tx.execute(
          "select set_config('app.system_context', 'true', true)",
        );
        const [site] = await tx.execute<
          { tenant_id: string; time_zone: string | null }[]
        >(
          'SELECT tenant_id, time_zone FROM practice.practice_sites WHERE id = ?',
          [siteId],
          'all',
        );
        if (!site)
          throw new ResourceNotFoundException('Sitio no encontrado', {
            siteId,
          });
        tz = site.time_zone ?? TZ_DEFAULT;
        tenantId = site.tenant_id;
      }
      const window = localDayWindow(date, tz);
      if (Date.now() < window.cutoff.getTime() + GRACE_MINUTES * 60_000) {
        throw adtError('CENSUS_DATE_NOT_ENDED', {
          cutoffAt: window.cutoff.toISOString(),
          graceMinutes: GRACE_MINUTES,
        });
      }
      const preview = await this.compute(tx, siteId, date, tz);
      const segments = await this.repo.segments(
        tx,
        siteId,
        window.dayStart,
        window.cutoff,
      );
      const existing = await tx.find(InpatientCensusDays, {
        practiceSiteId: siteId,
        censusDate: date as never,
      });
      const wanted = [...preview.keys()].filter(
        (u) => u !== null && (!unitIds || unitIds.includes(u)),
      ) as string[];
      const pending = wanted.filter(
        (u) => !existing.some((d) => d.clinicalUnitId === u),
      );
      if (req && wanted.length > 0 && pending.length === 0)
        throw adtError('CENSUS_ALREADY_CLOSED');
      const out: CensusDayView[] = [];
      const now = new Date();
      for (const unit of pending) {
        const counts = preview.get(unit) as CensusCounts;
        const day = tx.create(
          InpatientCensusDays,
          {
            tenantId,
            practiceSiteId: siteId,
            clinicalUnitId: unit,
            censusDate: date as never,
            cutoffAt: window.cutoff,
            statusConceptId: CLIN.CENSUS_CLOSED,
            closedAt: now,
            closedByUserId: req?.actor.id,
            ...counts,
            contentHash: createHash('sha256')
              .update(JSON.stringify({ siteId, unit, date, counts }))
              .digest('hex'),
            createdAt: now,
            updatedAt: now,
            createdByUserId: req?.actor.id,
            updatedByUserId: req?.actor.id,
          },
          { partial: true },
        );
        await this.support.flush(tx);
        for (const s of segments.filter((r) => r.unit_id === unit)) {
          const start = new Date(s.period_start);
          const end = s.period_end ? new Date(s.period_end) : null;
          const present =
            start <= window.cutoff && (!end || end > window.cutoff);
          const movement = present
            ? CLIN.CEN_PRESENT
            : end && end < window.cutoff && start >= window.dayStart
              ? CLIN.CEN_SAME_DAY
              : end && end < window.cutoff
                ? s.end_reason_id === CLIN.ADT_END_TRANSFER_OUT
                  ? CLIN.CEN_TRANSFER_OUT
                  : CLIN.CEN_DISCHARGED
                : s.movement_id === CLIN.ADT_TRANSFER
                  ? CLIN.CEN_TRANSFER_IN
                  : CLIN.CEN_ADMITTED;
          tx.create(
            InpatientCensusEntries,
            {
              tenantId,
              censusDayId: day.id,
              encounterId: s.encounter_id,
              patientProfileId: s.patient_profile_id,
              careSpaceId: s.care_space_id,
              bedCategoryConceptId: s.bed_category_concept_id ?? undefined,
              movementConceptId: movement,
              occurredAt: present ? window.cutoff : (end ?? start),
              createdAt: now,
            },
            { partial: true },
          );
        }
        await this.support.flush(tx);
        await this.support.publish(
          tx,
          ADT_EVENTS.censusClosed,
          { tenantId, id: day.id },
          day.id,
          {
            censusDayId: day.id,
            siteId,
            unitId: unit,
            date,
            counts,
          },
          req ?? { actor: { id: 'system' }, tenantId },
        );
        out.push({
          id: day.id,
          unitId: unit,
          date,
          status: 'CLOSED',
          cutoffAt: window.cutoff.toISOString(),
          counts,
          adjustments: [],
          adjustedTotals: counts,
        });
      }
      return out;
    });
  }

  /**
   * `POST /census-days/:id/adjustments`.
   *
   * @param dayId - Día cerrado.
   * @param dto - Columna, valor y motivo.
   * @param req - Actor, tenant, requestId.
   */
  async adjust(
    dayId: string,
    dto: CensusAdjustmentDto,
    req: AdtRequest,
  ): Promise<Record<string, unknown>> {
    return this.em.transactional(async (tx) => {
      const day = await tx.findOne(InpatientCensusDays, { id: dayId });
      if (!day || day.tenantId !== req.tenantId)
        throw new ResourceNotFoundException('Día de censo no encontrado', {
          dayId,
        });
      await this.access.assertCan(
        req.actor as never,
        'f3.census.adjust',
        { siteId: day.practiceSiteId },
        tx,
        req.tenantId,
      );
      if (day.statusConceptId !== CLIN.CENSUS_CLOSED)
        throw adtError('CENSUS_NOT_CLOSED');
      if (!dto.reasonText?.trim()) throw adtError('ADJUSTMENT_REASON_REQUIRED');
      const field = CENSUS_FIELDS.find(
        (f) => f === dto.fieldCode || fieldColumn(f) === dto.fieldCode,
      );
      if (!field)
        throw adtError('ADJUSTMENT_FIELD_INVALID', {
          fieldCode: dto.fieldCode,
        });
      const prior = await tx.find(InpatientCensusAdjustments, {
        censusDayId: day.id,
      });
      const previous = adjusted(countsOf(day), prior)[field];
      const adj = tx.create(
        InpatientCensusAdjustments,
        {
          tenantId: day.tenantId,
          censusDayId: day.id,
          fieldCode: fieldColumn(field),
          previousValue: previous,
          newValue: dto.newValue,
          reasonText: dto.reasonText,
          entryRefId: dto.entryRefId,
          adjustedByUserId: req.actor.id,
          requestId: req.requestId,
          createdAt: new Date(),
        },
        { partial: true },
      );
      await this.support.flush(tx);
      await this.support.publish(
        tx,
        ADT_EVENTS.censusAdjusted,
        { tenantId: day.tenantId, id: day.id },
        day.id,
        {
          censusDayId: day.id,
          adjustmentId: adj.id,
          fieldCode: adj.fieldCode,
          previousValue: previous,
          newValue: dto.newValue,
        },
        req,
      );
      return adjView(adj);
    });
  }

  /**
   * `GET /sites/:siteId/inpatient-indicators?from&to&unitId`.
   *
   * @param siteId - Sede.
   * @param from - `yyyy-mm-dd`.
   * @param to - `yyyy-mm-dd` (inclusive).
   * @param unitId - Unidad, opcional.
   * @param req - Actor y tenant.
   */
  async indicators(
    siteId: string,
    from: string,
    to: string,
    unitId: string | undefined,
    req: AdtRequest,
  ): Promise<Record<string, unknown>> {
    const em = this.em.fork();
    const { target } = await this.access.assertCan(
      req.actor as never,
      'f3.indicators.read',
      { siteId },
      em,
      req.tenantId,
    );
    const dates = dateRange(from, to);
    if (dates.length === 0 || dates.length > 366)
      throw adtError('INDICATOR_RANGE_TOO_LONG', { maxDays: 366 });
    const days = await em.find(InpatientCensusDays, {
      practiceSiteId: siteId,
      censusDate: { $gte: from as never, $lte: to as never },
      statusConceptId: CLIN.CENSUS_CLOSED,
      ...(unitId ? { clinicalUnitId: unitId } : {}),
    });
    const adj = days.length
      ? await em.find(InpatientCensusAdjustments, {
          censusDayId: { $in: days.map((d) => d.id) },
        })
      : [];
    const counts = days.map((d) =>
      adjusted(
        countsOf(d),
        adj.filter((a) => a.censusDayId === d.id),
      ),
    );
    const closedDates = new Set(
      days.map((d) => {
        const v = d.censusDate as unknown;
        return v instanceof Date
          ? v.toISOString().slice(0, 10)
          : String(v).slice(0, 10);
      }),
    );
    const tz = target.site.timeZone ?? TZ_DEFAULT;
    const turns = await this.repo.turnarounds(
      em,
      siteId,
      localDayWindow(from, tz).dayStart,
      localDayWindow(to, tz).cutoff,
    );
    const min = (a: string | null, b: string | null) =>
      a && b ? (new Date(b).getTime() - new Date(a).getTime()) / 60_000 : null;
    const pick = (xs: (number | null)[]) =>
      xs.filter((x): x is number => x !== null);
    const total = pick(
      turns.map((t) => min(t.requested_at, t.inspected_at ?? t.finished_at)),
    );
    return {
      period: { from, to },
      ...computeIndicators(counts, dates.length),
      bedTurnaroundMinutes: {
        p50: percentile(total, 50),
        p90: percentile(total, 90),
        waitToStart: percentile(
          pick(turns.map((t) => min(t.requested_at, t.started_at))),
          50,
        ),
        cleaning: percentile(
          pick(turns.map((t) => min(t.started_at, t.finished_at))),
          50,
        ),
        inspection: percentile(
          pick(turns.map((t) => min(t.finished_at, t.inspected_at))),
          50,
        ),
      },
      coverage: {
        daysClosed: closedDates.size,
        daysMissing: dates.filter((d) => !closedDates.has(d)),
      },
    };
  }

  /**
   * `POST /internal/clinical/census-close-tick` (SYSTEM): cierra el día de
   * ayer (hora de cada sede) en las unidades que falten. Idempotente.
   */
  async tick(): Promise<{ closed: number }> {
    const sites = await this.em.transactional(async (tx) => {
      await tx.execute("select set_config('app.system_context', 'true', true)");
      return this.repo.sitesWithBeds(tx);
    });
    let closed = 0;
    for (const site of sites) {
      const tz = site.time_zone ?? TZ_DEFAULT;
      const now = new Date();
      const local = new Date(
        now.getTime() + zoneOffsetMinutes(tz, now) * 60_000 - 86_400_000,
      );
      const date = local.toISOString().slice(0, 10);
      try {
        closed += (await this.close(site.id, date, undefined, null)).length;
      } catch (error) {
        if ((error as { reason?: string }).reason !== 'CENSUS_DATE_NOT_ENDED')
          throw error;
      }
    }
    return { closed };
  }

  /** Contadores calculados por unidad para el día. */
  private async compute(
    em: EntityManager,
    siteId: string,
    date: string,
    tz: string,
  ): Promise<Map<string | null, CensusCounts>> {
    const window = localDayWindow(date, tz);
    const segments = await this.repo.segments(
      em,
      siteId,
      window.dayStart,
      window.cutoff,
    );
    const beds = await this.repo.bedsByUnit(em, siteId);
    const offset = zoneOffsetMinutes(tz, window.cutoff);
    const units = new Set<string | null>([
      ...beds.map((b) => b.unit_id),
      ...segments.map((s) => s.unit_id),
    ]);
    const out = new Map<string | null, CensusCounts>();
    for (const unit of units) {
      const b = beds.find((x) => x.unit_id === unit) ?? {
        censable: 0,
        available: 0,
      };
      out.set(
        unit,
        computeCensus(toSegments(segments, unit), window, b, offset),
      );
    }
    return out;
  }
}

/** Fechas `yyyy-mm-dd` de `from` a `to` inclusive. */
function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  const start = new Date(`${from}T00:00:00Z`);
  const end = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  for (
    let d = start;
    d <= end && out.length <= 367;
    d = new Date(d.getTime() + 86_400_000)
  ) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

/** Vista de un ajuste. */
function adjView(a: InpatientCensusAdjustments): Record<string, unknown> {
  return {
    id: a.id,
    fieldCode: a.fieldCode,
    previousValue: a.previousValue,
    newValue: a.newValue,
    reasonText: a.reasonText,
    adjustedByUserId: a.adjustedByUserId,
    createdAt: a.createdAt.toISOString(),
  };
}
